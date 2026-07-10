'use client'

// VES-first borewell assessment. The workflow makes the geophysics visible:
//   Location → Electrical Resistivity Survey (VES) → VES Interpretation &
//   Aquifer Detection → Machine-Learning Prediction & Engineering Recommendation.
// Aquifer parameters are always derived from the resistivity interpretation.

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader, Badge, StatCard } from '@/components/ui'
import Chart from '@/components/Chart'
import { probabilityGauge, confidenceGauge, factorBars } from '@/components/chartDefs'
import VesSurvey from '@/components/VesSurvey'
import VesInterpretationView from '@/components/VesInterpretationView'
import VesEducationCard from '@/components/VesEducationCard'
import WorkflowProgress from '@/components/WorkflowProgress'
import DepthRationale from '@/components/DepthRationale'
import FieldValidationBox from '@/components/FieldValidationBox'
import { useAppState, DEFAULT_SITE } from '@/components/AppState'
import { TALUKAS_REAL, talukaByIdReal, TALUKA_NAME_TO_ID } from '@/lib/data/real/talukas'
import { wellsInTaluka } from '@/lib/data/real/wells'
import { assessSite, gatherEvidence, type SiteInput, type RealAssessment } from '@/lib/engine/assessReal'
import { PRETRAINED_REAL } from '@/lib/ml/pretrainedReal'

const STEPS = ['Survey Location', 'Resistivity Survey (VES)', 'VES Interpretation', 'Prediction & Recommendation'] as const

// the live process indicator shown while the assessment runs
const PROCESS_STEPS = [
  'Survey loaded',
  'VES curve generated',
  'Layer inversion completed',
  'Geological layers identified',
  'Aquifer parameters extracted',
  'Machine-learning completed',
  'Engineering recommendation generated',
] as const

function StepRail({ step }: { step: number }) {
  return (
    <div className="mx-auto mt-2 flex max-w-4xl items-center gap-1.5 px-4 sm:gap-2">
      {STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-1.5 sm:gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
              i < step ? 'bg-emerald-400/20 text-emerald-300' : i === step ? 'bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-400/50' : 'bg-white/5 text-slate-500'
            }`}
          >
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`hidden text-xs md:block ${i === step ? 'text-slate-200' : 'text-slate-500'}`}>{s}</span>
          {i < STEPS.length - 1 && <div className="h-px flex-1 bg-white/10" />}
        </div>
      ))}
    </div>
  )
}

// ── step 4 results ──────────────────────────────────────────────────────
function Results({ a }: { a: RealAssessment }) {
  const [open, setOpen] = useState(0)
  const verdictTone =
    a.verdict === 'favourable' ? 'border-emerald-400/30 bg-emerald-400/10' : a.verdict === 'moderate' ? 'border-amber-400/30 bg-amber-400/10' : 'border-rose-400/30 bg-rose-400/10'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* VES foundation recap */}
      <div className="glass mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm text-slate-300">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">VES foundation · </span>
          Aquifer parameters from {a.paramSource === 'ves-survey' ? 'your inverted field sounding' : 'official CGWB interpreted layers'}: Aquifer-I ~
          {a.interpretation.derived.aq1BottomM} m · Aquifer-II ~{a.interpretation.derived.aq2BottomM} m ·{' '}
          {a.interpretation.derived.aq2ThickM} m zone → fed to the ML model.
        </div>
        <Badge tone={a.paramSource === 'ves-survey' ? 'cyan' : 'slate'}>{a.paramSource === 'ves-survey' ? 'field VES' : 'official layers'}</Badge>
      </div>

      {/* verdict */}
      <div className={`rounded-2xl border p-5 ${verdictTone}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`text-lg font-bold ${a.verdict === 'favourable' ? 'text-emerald-300' : a.verdict === 'moderate' ? 'text-amber-300' : 'text-rose-300'}`}>
            {a.verdict === 'favourable' ? '✓ Favourable' : a.verdict === 'moderate' ? '◐ Marginal' : '✗ Unfavourable'}
          </span>
          <Badge tone="cyan">VES → ML pipeline</Badge>
          {a.taluka.category === 'Semi-Critical' && <Badge tone="amber">semi-critical taluka</Badge>}
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-200">{a.verdictText}</p>
      </div>

      {/* gauges + stats */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass p-4">
          <Chart option={probabilityGauge(a.probability)} style={{ minHeight: 235 }} />
          <div className="-mt-2 flex justify-center gap-4 pb-2 text-[11px] text-slate-500">
            <span>ML model: <b className="text-cyan-300">{a.mlProbability}%</b></span>
            <span>Rule engine: <b className="text-cyan-300">{a.ruleProbability}%</b></span>
          </div>
        </div>
        <div className="glass p-4">
          <Chart option={confidenceGauge(a.confidencePct)} style={{ minHeight: 235 }} />
          <p className="-mt-2 px-2 pb-2 text-center text-[11px] text-slate-500">
            {a.paramSource === 'ves-survey' ? 'field VES included' : 'official layers'} · coverage {a.evidence.coverage} · {a.evidence.talukaTested.length} tested wells
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Expected water strike" value={`${a.waterStrikeM[0]}–${a.waterStrikeM[1]}`} unit="m" tone="good" />
          <StatCard label="Recommended depth" value={`${a.recommendedDepthM[0]}–${a.recommendedDepthM[1]}`} unit="m" />
          <StatCard label="Expected yield" value={a.yieldCategory} hint={`~${a.yieldLph[0].toLocaleString()}–${a.yieldLph[1].toLocaleString()} L/hr`} tone={a.yieldCategory === 'Good' ? 'good' : a.yieldCategory === 'Moderate' ? 'warn' : 'bad'} />
          <StatCard label="GW development" value={`${a.taluka.stagePct}%`} hint={a.taluka.category} tone={a.taluka.category === 'Semi-Critical' ? 'warn' : 'default'} />
          <div className="glass col-span-2 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expected aquifer</div>
            <div className="mt-1 text-sm font-medium text-cyan-200">{a.aquiferType}</div>
          </div>
        </div>
      </div>

      {/* field validation box + depth rationale */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <FieldValidationBox fv={a.fieldValidation} />
        <DepthRationale steps={a.depthRationale} />
      </div>

      {/* factors + ML feature importance */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <h3 className="font-semibold text-white">Rule engine — factor contributions</h3>
          <p className="mt-1 text-xs text-slate-500">Each factor scored 0–100 from the evidence; aquifer &amp; VES factors come from the interpretation above.</p>
          <Chart option={factorBars(a.factors)} style={{ minHeight: 280 }} />
        </div>
        <div className="glass p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white">ML feature importance — why {a.mlProbability}%</h3>
            <Badge tone="green">trained on {PRETRAINED_REAL.nTrain + PRETRAINED_REAL.nVal} CGWB wells</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Logistic regression · validation AUC {PRETRAINED_REAL.valMetrics.auc.toFixed(2)} · signed per-feature contributions (green raises, red lowers):</p>
          <ul className="mt-3 space-y-1.5">
            {a.mlContributions.slice(0, 6).map((c) => {
              const width = Math.min(100, Math.abs(c.logit) * 55)
              return (
                <li key={c.name} className="flex items-center gap-3 text-xs">
                  <span className="w-44 shrink-0 truncate text-slate-300">{c.name}</span>
                  <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <span className={`absolute top-0 h-full rounded-full ${c.logit >= 0 ? 'left-1/2 bg-emerald-400/80' : 'right-1/2 bg-rose-400/80'}`} style={{ width: `${width / 2}%` }} />
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
        </div>
      </div>

      {/* explanation accordion */}
      <div className="glass mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="font-semibold text-white">Explanation panel</h3>
          <Badge tone="cyan">every number traced to evidence</Badge>
        </div>
        {a.explanations.map((e, i) => (
          <div key={e.q} className="border-b border-white/5 last:border-0">
            <button className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-medium text-slate-200 transition hover:bg-white/5" onClick={() => setOpen(open === i ? -1 : i)}>
              {e.q}
              <span className={`text-cyan-400 transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-slate-400">{e.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* workflow provenance */}
      <div className="mt-4">
        <WorkflowProgress />
      </div>

      {/* next steps + actions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="glass p-5 lg:col-span-2">
          <h3 className="font-semibold text-white">Before you drill</h3>
          <ol className="mt-3 space-y-2.5">
            {a.nextSteps.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 font-mono text-xs font-bold text-cyan-300">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="glass flex flex-col justify-center gap-3 p-5">
          <Link href="/report" className="btn-primary w-full">Download PDF report</Link>
          <Link href="/dashboard" className="btn-ghost w-full">Open dashboard</Link>
          <p className="text-center text-[11px] text-slate-500">Both follow this VES-based assessment automatically.</p>
        </div>
      </div>
    </motion.div>
  )
}

// ── wizard ───────────────────────────────────────────────────────────────
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
  const [runStep, setRunStep] = useState(0)

  const taluka = input.talukaId ? talukaByIdReal(input.talukaId) : null
  const evidence = useMemo(() => (input.talukaId ? gatherEvidence(input) : null), [input.talukaId, input.lat, input.lon])
  const officialParams = evidence
    ? {
        aq1BottomM: evidence.evidence.medAq1M,
        aq2BottomM: evidence.evidence.medAq2M,
        aq2ThickM: evidence.evidence.medAq2ThickM,
        preSwlM: input.knownWaterTableM !== '' ? Number(input.knownWaterTableM) : evidence.evidence.medPreSwlM,
      }
    : null

  const officialMeta =
    taluka && evidence
      ? {
          location: `${input.placeName ? input.placeName + ', ' : ''}${taluka.name} taluka, Pune district, Maharashtra`,
          setting: taluka.terrain,
          reference: 'CGWB “Ground Water Information, Pune District” (2013) & NAQUIM aquifer mapping (2016–19)',
          basis: `${
            input.lat !== null && evidence.evidence.nearby.some((n) => n.km <= 15)
              ? 'Interpreted depths taken from documented CGWB wells near your coordinates.'
              : `Median of CGWB / NAQUIM interpreted depths across documented wells in ${taluka.name} taluka.`
          }${input.knownWaterTableM !== '' ? ' Water level is from your input.' : ''}`,
        }
      : undefined

  const villageOptions = useMemo(() => {
    if (!taluka) return []
    const names = new Set<string>()
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
    setRunStep(0)
    const a = assessSite(input) // computed up-front; the steps below animate the workflow
    let i = 0
    const iv = setInterval(() => {
      i += 1
      setRunStep(i)
      if (i >= PROCESS_STEPS.length) {
        clearInterval(iv)
        setAssessment(a)
        setSite(input)
        setStep(3)
        setBusy(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 240)
  }

  useEffect(() => {
    if (params.get('taluka') && talukaByIdReal(params.get('taluka')!) && step === 0) setStep(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <PageHeader
        kicker="Site assessment"
        title="Borewell Site Assessment — VES-driven"
        sub="The prediction begins with an Electrical Resistivity Survey, not with AI: resistivity → subsurface layers → aquifer detection → parameters → machine-learning prediction → engineering recommendation."
      />
      <StepRail step={step} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* STEP 0 — LOCATION */}
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass mx-auto max-w-3xl p-6">
            <h3 className="font-semibold text-white">Survey location</h3>
            <p className="mt-1 text-sm text-slate-400">State → District → Taluka → Village. Official survey information for the location loads in the next step.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">State</label>
                <select className="field" value="Maharashtra" disabled><option>Maharashtra</option></select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">District</label>
                <select className="field" value="Pune" disabled><option>Pune</option></select>
              </div>
              <div>
                <label htmlFor="select-taluka" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Taluka *</label>
                <select id="select-taluka" className="field" value={input.talukaId} onChange={(e) => upd({ talukaId: e.target.value })}>
                  <option value="">Select taluka…</option>
                  {TALUKAS_REAL.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="input-place" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Village / survey location</label>
                <input id="input-place" className="field" list="village-options" placeholder="Type or pick a documented village…" value={input.placeName} onChange={(e) => upd({ placeName: e.target.value })} />
                <datalist id="village-options">{villageOptions.map((v) => <option key={v} value={v} />)}</datalist>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Latitude (optional)</label>
                <input className="field font-mono" type="number" step="any" placeholder="e.g. 18.5431" value={input.lat ?? ''} onChange={(e) => upd({ lat: e.target.value === '' ? null : Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Longitude (optional)</label>
                <input className="field font-mono" type="number" step="any" placeholder="e.g. 73.7150" value={input.lon ?? ''} onChange={(e) => upd({ lon: e.target.value === '' ? null : Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Depth to water in nearby wells (m, optional)</label>
                <input className="field font-mono" type="number" step="any" placeholder="summer level, if known" value={input.knownWaterTableM} onChange={(e) => upd({ knownWaterTableM: e.target.value === '' ? '' : Number(e.target.value) })} />
              </div>
            </div>
            {taluka && <p className="mt-3 text-xs leading-relaxed text-slate-500">{taluka.terrain}</p>}
            <p className="mt-1 text-[11px] text-slate-600">Tip: pick your exact plot on the <Link href="/map" className="text-cyan-400 underline">interactive map</Link> — its “Analyze here” button fills coordinates for you.</p>
            <div className="mt-5 flex justify-end">
              <button id="btn-step1" className="btn-primary" disabled={!input.talukaId} onClick={() => setStep(1)}>Continue to survey</button>
            </div>
          </motion.div>
        )}

        {/* STEP 1 — VES SURVEY */}
        {step === 1 && officialParams && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Electrical Resistivity Survey (VES)</h2>
              <p className="mt-1 text-sm text-slate-400">
                {input.placeName || taluka?.name}, {taluka?.name} · This resistivity survey is the foundation of the whole assessment — everything downstream depends on it.
              </p>
            </div>
            <div className="mb-4">
              <VesEducationCard />
            </div>
            <VesSurvey officialParams={officialParams} value={input.ves} onInterpretation={(i) => upd({ ves: i })} officialMeta={officialMeta} />
            <div className="mt-5 flex flex-wrap justify-between gap-3">
              <button className="btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button id="btn-step2" className="btn-primary" disabled={!input.ves} onClick={() => setStep(2)}>Continue to interpretation</button>
            </div>
          </motion.div>
        )}

        {/* STEP 2 — INTERPRETATION */}
        {step === 2 && input.ves && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">VES Interpretation &amp; Aquifer Detection</h2>
              <p className="mt-1 text-sm text-slate-400">The resistivity model, translated into geology — and the aquifer parameters extracted from it.</p>
            </div>
            <VesInterpretationView interp={input.ves} />
            {busy ? (
              <div className="glass mt-5 p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  Running geophysical interpretation…
                </div>
                <ol className="space-y-2">
                  {PROCESS_STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-3 text-sm">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                          i < runStep ? 'bg-emerald-400/20 text-emerald-300' : i === runStep ? 'animate-pulse bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-slate-600'
                        }`}
                      >
                        {i < runStep ? '✓' : i + 1}
                      </span>
                      <span className={i < runStep ? 'text-slate-300' : i === runStep ? 'text-white' : 'text-slate-600'}>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap justify-between gap-3">
                <button className="btn-ghost" onClick={() => setStep(1)}>Back to survey</button>
                <button id="btn-analyze" className="btn-primary px-8" onClick={runAssessment}>
                  Run ML prediction &amp; recommendation
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3 — RESULTS */}
        {step === 3 && assessment && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">
                {input.placeName || 'Your site'}
                <span className="ml-2 text-sm font-normal text-slate-400">{assessment.taluka.name} taluka · Pune district</span>
              </h2>
              <button className="btn-ghost !py-2 text-xs" onClick={() => { setStep(0); setAssessment(null) }}>↻ Assess another site</button>
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
