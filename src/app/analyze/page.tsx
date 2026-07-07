'use client'

// Guided borewell assessment. The user tells us where and what they know;
// the platform matches it against the CGWB record, asks for a resistivity
// sounding when it will change the answer, then runs the trained model +
// transparent rules and explains everything.

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader, Badge, StatCard } from '@/components/ui'
import Chart from '@/components/Chart'
import { probabilityGauge, confidenceGauge, factorBars } from '@/components/chartDefs'
import VesPanel, { type VesAquiferInfo } from '@/components/VesPanel'
import { useAppState, DEFAULT_SITE } from '@/components/AppState'
import { TALUKAS_REAL, talukaByIdReal, TALUKA_NAME_TO_ID } from '@/lib/data/real/talukas'
import { wellsInTaluka, wellOutcome } from '@/lib/data/real/wells'
import {
  assessSite,
  gatherEvidence,
  type SiteInput,
  type RealAssessment,
  type NearbyOutcome,
} from '@/lib/engine/assessReal'
import { PRETRAINED_REAL } from '@/lib/ml/pretrainedReal'

const STEPS = ['Location', 'What you know', 'Data match', 'Assessment'] as const

function StepRail({ step }: { step: number }) {
  return (
    <div className="mx-auto mt-2 flex max-w-3xl items-center gap-2 px-4">
      {STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
              i < step
                ? 'bg-emerald-400/20 text-emerald-300'
                : i === step
                  ? 'bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-400/50'
                  : 'bg-white/5 text-slate-500'
            }`}
          >
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`hidden text-xs sm:block ${i === step ? 'text-slate-200' : 'text-slate-500'}`}>{s}</span>
          {i < STEPS.length - 1 && <div className="h-px flex-1 bg-white/10" />}
        </div>
      ))}
    </div>
  )
}

// ── step 3: data-match view ────────────────────────────────────────────
function DataMatch({
  input,
  onVes,
  vesDone,
}: {
  input: SiteInput
  onVes: (aq: VesAquiferInfo | null) => void
  vesDone: boolean
}) {
  const { taluka, evidence } = useMemo(() => gatherEvidence(input), [input])
  const covTone = evidence.coverage === 'good' ? 'green' : evidence.coverage === 'moderate' ? 'amber' : 'red'

  return (
    <div className="space-y-4">
      <div className="glass p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-white">
            Matched against the CGWB record for {taluka.name}
          </h3>
          <Badge tone={covTone as 'green' | 'amber' | 'red'}>data coverage: {evidence.coverage}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Pump-tested CGWB wells"
            value={String(evidence.talukaTested.length)}
            hint={`in ${taluka.name} taluka`}
          />
          <StatCard
            label="Local success rate"
            value={evidence.talukaSuccessRate !== null ? `${Math.round(evidence.talukaSuccessRate * 100)}%` : '—'}
            hint="wells reaching ≥1 lps"
            tone={
              evidence.talukaSuccessRate === null
                ? 'default'
                : evidence.talukaSuccessRate >= 0.6
                  ? 'good'
                  : evidence.talukaSuccessRate >= 0.4
                    ? 'warn'
                    : 'bad'
            }
          />
          <StatCard label="Aquifer-I bottom" value={`~${evidence.medAq1M}`} unit="m" hint="local median (CGWB logs)" />
          <StatCard
            label="Aquifer-II zone"
            value={`~${evidence.medAq2M}`}
            unit="m"
            hint={`median thickness ${evidence.medAq2ThickM} m`}
          />
        </div>

        {evidence.nearby.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full whitespace-nowrap text-xs">
              <thead className="bg-white/[0.03] text-left uppercase tracking-wider text-slate-500">
                <tr>
                  {['Nearest CGWB wells', 'Distance', 'Drilled', 'Pre-monsoon WL', 'Yield', 'Aquifer-II'].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evidence.nearby.map(({ well, km }) => (
                  <tr key={well.sno} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-1.5">
                      {well.village} <span className="text-slate-500">({well.type})</span>
                    </td>
                    <td className="px-3 py-1.5 font-mono">{km} km</td>
                    <td className="px-3 py-1.5 font-mono">{well.depthM ?? '—'} m</td>
                    <td className="px-3 py-1.5 font-mono">{well.preSwlM ?? '—'} m</td>
                    <td className="px-3 py-1.5">
                      {well.yieldLps === null ? (
                        <span className="text-slate-500">not tested</span>
                      ) : (
                        <Badge tone={wellOutcome(well) === 1 ? 'green' : 'red'}>{well.yieldRaw}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-1.5 font-mono">{well.aq2BottomM ?? '—'} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {evidence.nearby.length === 0 && (
          <p className="mt-3 text-xs text-slate-500">
            No coordinates provided — the assessment will use taluka-level evidence. Add a location on the{' '}
            <Link href="/map" className="text-cyan-300 underline">
              map
            </Link>{' '}
            for well-by-well matching.
          </p>
        )}
      </div>

      {/* progressive ask: resistivity */}
      <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">
              {vesDone ? 'Resistivity sounding captured ✓' : 'One more input makes this much sharper'}
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">
              {vesDone
                ? 'Your inverted sounding is included in the assessment below.'
                : 'If you have (or can commission) a Vertical Electrical Sounding at the plot, enter the readings — the interpreted aquifer layer feeds both the physics check and the final verdict. You can also skip and analyze with the CGWB evidence alone.'}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <VesPanel
            context={{
              siteName: input.placeName || taluka.name,
              rainfallMm: taluka.rainfallMm,
              waterTableM: input.knownWaterTableM !== '' ? Number(input.knownWaterTableM) : evidence.medPreSwlM,
              boreDepthM: input.nearbyBoreDepthM !== '' ? Number(input.nearbyBoreDepthM) : evidence.medAq2M,
              successPct: Math.round((evidence.talukaSuccessRate ?? 0.5) * 100),
            }}
            onAquifer={onVes}
          />
        </div>
      </div>
    </div>
  )
}

// ── step 4: results ────────────────────────────────────────────────────
function Results({ a }: { a: RealAssessment }) {
  const [open, setOpen] = useState(0)
  const verdictTone =
    a.verdict === 'favourable'
      ? 'border-emerald-400/30 bg-emerald-400/10'
      : a.verdict === 'moderate'
        ? 'border-amber-400/30 bg-amber-400/10'
        : 'border-rose-400/30 bg-rose-400/10'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* verdict */}
      <div className={`rounded-2xl border p-5 ${verdictTone}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`text-lg font-bold ${
              a.verdict === 'favourable' ? 'text-emerald-300' : a.verdict === 'moderate' ? 'text-amber-300' : 'text-rose-300'
            }`}
          >
            {a.verdict === 'favourable' ? '✓ Favourable' : a.verdict === 'moderate' ? '◐ Marginal' : '✗ Unfavourable'}
          </span>
          <Badge tone="cyan">CGWB-data-backed</Badge>
          {a.taluka.category === 'Semi-Critical' && <Badge tone="amber">semi-critical taluka</Badge>}
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-200">{a.verdictText}</p>
      </div>

      {/* gauges + stats */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass p-4">
          <Chart option={probabilityGauge(a.probability)} style={{ minHeight: 235 }} />
          <div className="-mt-2 flex justify-center gap-4 pb-2 text-[11px] text-slate-500">
            <span>
              ML model: <b className="text-cyan-300">{a.mlProbability}%</b>
            </span>
            <span>
              Rule engine: <b className="text-cyan-300">{a.ruleProbability}%</b>
            </span>
          </div>
        </div>
        <div className="glass p-4">
          <Chart option={confidenceGauge(a.confidencePct)} style={{ minHeight: 235 }} />
          <p className="-mt-2 px-2 pb-2 text-center text-[11px] text-slate-500">
            Coverage {a.evidence.coverage} · {a.input.ves ? 'VES included' : 'no VES yet'} ·{' '}
            {a.evidence.talukaTested.length} tested wells in taluka
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Expected water strike" value={`${a.waterStrikeM[0]}–${a.waterStrikeM[1]}`} unit="m" tone="good" />
          <StatCard label="Recommended depth" value={`${a.recommendedDepthM[0]}–${a.recommendedDepthM[1]}`} unit="m" />
          <StatCard
            label="Expected yield"
            value={a.yieldCategory}
            hint={`~${a.yieldLph[0].toLocaleString()}–${a.yieldLph[1].toLocaleString()} L/hr`}
            tone={a.yieldCategory === 'Good' ? 'good' : a.yieldCategory === 'Moderate' ? 'warn' : 'bad'}
          />
          <StatCard
            label="GW development"
            value={`${a.taluka.stagePct}%`}
            hint={a.taluka.category}
            tone={a.taluka.category === 'Semi-Critical' ? 'warn' : 'default'}
          />
          <div className="glass col-span-2 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expected aquifer</div>
            <div className="mt-1 text-sm font-medium text-cyan-200">{a.aquiferType}</div>
          </div>
        </div>
      </div>

      {/* factors + ML explanation */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <h3 className="font-semibold text-white">Rule engine — factor contributions</h3>
          <p className="mt-1 text-xs text-slate-500">Each factor scored 0–100 from the CGWB evidence; weights shown.</p>
          <Chart option={factorBars(a.factors)} style={{ minHeight: 280 }} />
        </div>
        <div className="glass p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white">ML model — why {a.mlProbability}%</h3>
            <Badge tone="green">trained on {PRETRAINED_REAL.nTrain + PRETRAINED_REAL.nVal} CGWB wells</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Logistic regression · validation AUC {PRETRAINED_REAL.valMetrics.auc.toFixed(2)} · exact per-feature logit
            contributions:
          </p>
          <ul className="mt-3 space-y-1.5">
            {a.mlContributions.slice(0, 6).map((c) => {
              const width = Math.min(100, Math.abs(c.logit) * 55)
              return (
                <li key={c.name} className="flex items-center gap-3 text-xs">
                  <span className="w-44 shrink-0 truncate text-slate-300">{c.name}</span>
                  <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <span
                      className={`absolute top-0 h-full rounded-full ${c.logit >= 0 ? 'left-1/2 bg-emerald-400/80' : 'right-1/2 bg-rose-400/80'}`}
                      style={{ width: `${width / 2}%` }}
                    />
                    <span className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
                  </span>
                  <span className={`w-12 shrink-0 text-right font-mono ${c.logit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {c.logit >= 0 ? '+' : ''}
                    {c.logit.toFixed(2)}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Factor notes: {a.factors.map((f) => `${f.label} ${f.score}/100`).join(' · ')}
          </p>
        </div>
      </div>

      {/* explanation accordion */}
      <div className="glass mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="font-semibold text-white">Explanation panel</h3>
          <Badge tone="cyan">every number traced to CGWB data</Badge>
        </div>
        {a.explanations.map((e, i) => (
          <div key={e.q} className="border-b border-white/5 last:border-0">
            <button
              className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-medium text-slate-200 transition hover:bg-white/5"
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              {e.q}
              <span className={`text-cyan-400 transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm leading-relaxed text-slate-400">{e.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* next steps + actions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass p-5 lg:col-span-2">
          <h3 className="font-semibold text-white">Before you drill</h3>
          <ol className="mt-3 space-y-2.5">
            {a.nextSteps.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 font-mono text-xs font-bold text-cyan-300">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="glass flex flex-col justify-center gap-3 p-5">
          <Link href="/report" className="btn-primary w-full">
            Download PDF report
          </Link>
          <Link href="/dashboard" className="btn-ghost w-full">
            Open taluka dashboard
          </Link>
          <p className="text-center text-[11px] text-slate-500">Both follow this assessment automatically.</p>
        </div>
      </div>
    </motion.div>
  )
}

// ── the wizard ─────────────────────────────────────────────────────────
function AnalyzeInner() {
  const params = useSearchParams()
  const { setSite } = useAppState()

  const [step, setStep] = useState(0)
  const [input, setInput] = useState<SiteInput>({
    ...DEFAULT_SITE,
    talukaId: params.get('taluka') && talukaByIdReal(params.get('taluka')!) ? params.get('taluka')! : '',
    placeName: params.get('place') ?? '',
    lat: params.get('lat') ? Number(params.get('lat')) : null,
    lon: params.get('lon') ? Number(params.get('lon')) : null,
  })
  const [assessment, setAssessment] = useState<RealAssessment | null>(null)
  const [busy, setBusy] = useState(false)

  const taluka = input.talukaId ? talukaByIdReal(input.talukaId) : null
  const villageOptions = useMemo(() => {
    if (!taluka) return []
    const names = new Set(
      wellsInTaluka(
        Object.entries(TALUKA_NAME_TO_ID).find(([, id]) => id === taluka.id)?.[0] ?? taluka.name,
      ).map((w) => w.village),
    )
    // include every printed-taluka name mapping to this id
    for (const [printed, id] of Object.entries(TALUKA_NAME_TO_ID)) {
      if (id === taluka.id) wellsInTaluka(printed).forEach((w) => names.add(w.village))
    }
    return Array.from(names).sort()
  }, [taluka])

  const upd = (patch: Partial<SiteInput>) => {
    setInput((s) => ({ ...s, ...patch }))
    setAssessment(null)
  }

  const runAssessment = () => {
    setBusy(true)
    setTimeout(() => {
      const a = assessSite(input)
      setAssessment(a)
      setSite(input)
      setStep(3)
      setBusy(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 700)
  }

  useEffect(() => {
    // &run=1 → shareable link that executes the assessment immediately
    if (params.get('run') === '1' && input.talukaId) {
      runAssessment()
      return
    }
    // arriving with a full location from the map → jump to step 2
    if (input.talukaId && (input.lat !== null || input.placeName) && step === 0 && params.get('taluka')) {
      setStep(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <PageHeader
        kicker="Site assessment"
        title="Check Your Borewell Site"
        sub="Answer what you can — the platform fills the rest from the CGWB record for Pune district, asks for a resistivity sounding when it will sharpen the answer, and explains every number it returns."
      />
      <StepRail step={step} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* ── STEP 0: location ── */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass mx-auto max-w-3xl p-6">
            <h3 className="font-semibold text-white">Where is the site?</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">State</label>
                <select className="field" value="Maharashtra" disabled>
                  <option>Maharashtra</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">District</label>
                <select className="field" value="Pune" disabled>
                  <option>Pune</option>
                </select>
              </div>
              <div>
                <label htmlFor="select-taluka" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Taluka *
                </label>
                <select
                  id="select-taluka"
                  className="field"
                  value={input.talukaId}
                  onChange={(e) => upd({ talukaId: e.target.value })}
                >
                  <option value="">Select taluka…</option>
                  {TALUKAS_REAL.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="input-place" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Village / plot name
                </label>
                <input
                  id="input-place"
                  className="field"
                  list="village-options"
                  placeholder="Type or pick a documented village…"
                  value={input.placeName}
                  onChange={(e) => upd({ placeName: e.target.value })}
                />
                <datalist id="village-options">
                  {villageOptions.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Latitude (optional)
                </label>
                <input
                  className="field font-mono"
                  type="number"
                  step="any"
                  placeholder="e.g. 18.5431"
                  value={input.lat ?? ''}
                  onChange={(e) => upd({ lat: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Longitude (optional)
                </label>
                <input
                  className="field font-mono"
                  type="number"
                  step="any"
                  placeholder="e.g. 73.7150"
                  value={input.lon ?? ''}
                  onChange={(e) => upd({ lon: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
            </div>
            {taluka && <p className="mt-3 text-xs leading-relaxed text-slate-500">{taluka.terrain}</p>}
            <p className="mt-1 text-[11px] text-slate-600">
              Tip: pick your spot visually on the <Link href="/map" className="text-cyan-400 underline">interactive map</Link> — its
              “Analyze here” button fills coordinates for you.
            </p>
            <div className="mt-5 flex justify-end">
              <button id="btn-step1" className="btn-primary" disabled={!input.talukaId} onClick={() => setStep(1)}>
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 1: known parameters ── */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass mx-auto max-w-3xl p-6">
            <h3 className="font-semibold text-white">What do you already know? (all optional)</h3>
            <p className="mt-1 text-sm text-slate-400">
              Anything you skip is filled from CGWB records for {taluka?.name ?? 'the taluka'}.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Depth to water in nearby wells (m)
                </label>
                <input
                  id="input-wt"
                  className="field font-mono"
                  type="number"
                  step="any"
                  placeholder="e.g. 8 (summer level)"
                  value={input.knownWaterTableM}
                  onChange={(e) => upd({ knownWaterTableM: e.target.value === '' ? '' : Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Typical bore depth nearby (m)
                </label>
                <input
                  className="field font-mono"
                  type="number"
                  step="any"
                  placeholder="e.g. 120"
                  value={input.nearbyBoreDepthM}
                  onChange={(e) => upd({ nearbyBoreDepthM: e.target.value === '' ? '' : Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  How are the bores around you doing?
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      ['most-working', 'Most work'],
                      ['mixed', 'Mixed'],
                      ['many-failed', 'Many failed'],
                      ['unknown', "Don't know"],
                    ] as [NearbyOutcome, string][]
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                        input.nearbyOutcome === v
                          ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                      }`}
                      onClick={() => upd({ nearbyOutcome: v })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-between">
              <button className="btn-ghost" onClick={() => setStep(0)}>
                Back
              </button>
              <button id="btn-step2" className="btn-primary" onClick={() => setStep(2)}>
                Match against CGWB data
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: data match + progressive VES ask ── */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <DataMatch input={input} vesDone={!!input.ves} onVes={(aq) => upd({ ves: aq })} />
            <div className="mt-5 flex flex-wrap justify-between gap-3">
              <button className="btn-ghost" onClick={() => setStep(1)}>
                Back
              </button>
              <div className="flex gap-3">
                <button id="btn-analyze" className="btn-primary px-8" onClick={runAssessment} disabled={busy}>
                  {busy ? 'Running models…' : input.ves ? 'Run full assessment (with VES)' : 'Analyze without VES'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: results ── */}
        {step === 3 && assessment && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">
                {input.placeName || 'Your site'}
                <span className="ml-2 text-sm font-normal text-slate-400">
                  {assessment.taluka.name} taluka · Pune district
                </span>
              </h2>
              <button
                className="btn-ghost !py-2 text-xs"
                onClick={() => {
                  setStep(0)
                  setAssessment(null)
                }}
              >
                ↻ Assess another site
              </button>
            </div>
            <Results a={assessment} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzeInner />
    </Suspense>
  )
}
