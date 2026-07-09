'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { PageHeader, StatCard, Badge } from '@/components/ui'
import Chart from '@/components/Chart'
import { talukaBars, wellScatter, factorBars, probabilityGauge, confidenceGauge } from '@/components/chartDefs'
import VesInterpretationView from '@/components/VesInterpretationView'
import FieldValidationBox from '@/components/FieldValidationBox'
import WorkflowProgress from '@/components/WorkflowProgress'
import DepthRationale from '@/components/DepthRationale'
import { useAppState, DEFAULT_SITE } from '@/components/AppState'
import { TALUKAS_REAL, talukaByIdReal, TALUKA_NAME_TO_ID } from '@/lib/data/real/talukas'
import { CGWB_WELLS, wellOutcome } from '@/lib/data/real/wells'
import { DISTRICT_OVERVIEW, LATEST_ASSESSMENT } from '@/lib/data/real/hydro'
import { assessSite } from '@/lib/engine/assessReal'
import { PRETRAINED_REAL } from '@/lib/ml/pretrainedReal'

function StageLabel({ n, title, note }: { n: number; title: string; note?: string }) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 font-mono text-sm font-bold text-cyan-300 ring-1 ring-cyan-400/30">
        {n}
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">Stage {n}</div>
        <div className="text-base font-bold text-white">{title}</div>
      </div>
      {note && <div className="ml-auto hidden max-w-[46%] text-right text-xs text-slate-500 sm:block">{note}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { site, setSite, hydrated } = useAppState()
  const input = site ?? DEFAULT_SITE
  const taluka = talukaByIdReal(input.talukaId) ?? TALUKAS_REAL[1]

  const assessment = useMemo(() => assessSite({ ...input, talukaId: taluka.id }), [input, taluka.id])
  const interp = assessment.interpretation

  const talukaWells = useMemo(() => CGWB_WELLS.filter((w) => TALUKA_NAME_TO_ID[w.taluka] === taluka.id), [taluka.id])
  const tested = talukaWells.filter((w) => w.yieldLps !== null)
  const successes = tested.filter((w) => wellOutcome(w) === 1)

  const rainRows = TALUKAS_REAL.map((t) => ({ name: t.name.replace(/ \(.*\)/, ''), value: t.rainfallMm, highlight: t.id === taluka.id })).sort((a, b) => a.value - b.value)
  const stageRows = TALUKAS_REAL.filter((t) => t.id !== 'pune-city').map((t) => ({ name: t.name.replace(/ \(.*\)/, ''), value: t.stagePct, highlight: t.id === taluka.id })).sort((a, b) => a.value - b.value)

  return (
    <div>
      <PageHeader
        kicker="Dashboard"
        title="Groundwater Intelligence Dashboard"
        sub="The assessment for your selected site, laid out as the four stages of the investigation: the Electrical Resistivity Survey and its interpretation come first, then the machine-learning analysis, then the engineering recommendation — with the wider CGWB record for context."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* selector */}
        <div className="glass mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Taluka</label>
            <select className="field !w-auto" value={taluka.id} onChange={(e) => setSite({ ...input, talukaId: e.target.value, ves: null })}>
              {TALUKAS_REAL.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {hydrated && site?.placeName && <Badge tone="cyan">site: {site.placeName}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={assessment.paramSource === 'ves-survey' ? 'cyan' : 'slate'}>
              {assessment.paramSource === 'ves-survey' ? 'field VES' : 'official VES layers'}
            </Badge>
            <Link href="/analyze" className="btn-ghost !px-3 !py-1.5 text-xs">Run full VES assessment</Link>
          </div>
        </div>

        {/* workflow overview */}
        <div className="mt-4">
          <WorkflowProgress title="Assessment workflow — resistivity survey to recommendation" />
        </div>

        {/* ── 1 · VES survey ── */}
        <StageLabel n={1} title="VES Survey" note="Survey data & apparent-resistivity readings" />
        <VesInterpretationView interp={interp} parts={['summary', 'data']} compact />

        {/* ── 2 · Curve interpretation ── */}
        <StageLabel n={2} title="Curve Interpretation" note="Standard resistivity ranges used to read each layer" />
        <VesInterpretationView interp={interp} parts={['reference']} compact />

        {/* ── 3 · Layer inversion ── */}
        <StageLabel n={3} title="Layer Inversion" note="Best-fit layer resistivity, thickness & match confidence" />
        <VesInterpretationView interp={interp} parts={['layertable']} compact />

        {/* ── 4 · Geological layers ── */}
        <StageLabel n={4} title="Geological Layers" note="Lithology, cross-section & per-layer reasoning" />
        <VesInterpretationView interp={interp} parts={['crosssection', 'reasoning']} compact />

        {/* ── 5 · Aquifer detection ── */}
        <StageLabel n={5} title="Aquifer Detection" note="Hydrogeological parameters extracted from the VES" />
        <VesInterpretationView interp={interp} parts={['params']} compact />

        {/* ── 6 · Machine-learning analysis ── */}
        <StageLabel n={6} title="Machine-Learning Analysis" note="The final decision-support stage, fed by the VES parameters" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="glass p-4">
            <Chart option={probabilityGauge(assessment.probability)} style={{ minHeight: 230 }} />
            <p className="-mt-2 pb-2 text-center text-[11px] text-slate-500">
              ML {assessment.mlProbability}% · rules {assessment.ruleProbability}%
            </p>
          </div>
          <div className="glass p-4">
            <Chart option={confidenceGauge(assessment.confidencePct)} style={{ minHeight: 230 }} />
            <p className="-mt-2 pb-2 text-center text-[11px] text-slate-500">
              recommended depth {assessment.recommendedDepthM[0]}–{assessment.recommendedDepthM[1]} m
            </p>
          </div>
          <div className="glass flex flex-col justify-center p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">The model</div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
              Logistic regression trained on <b className="text-cyan-200">{PRETRAINED_REAL.nTrain + PRETRAINED_REAL.nVal} pump-tested CGWB wells</b>{' '}
              (validation AUC {PRETRAINED_REAL.valMetrics.auc.toFixed(2)}). Its aquifer inputs come from the VES interpretation above — not from manual entry.
            </p>
          </div>
        </div>
        <div className="mt-4 glass p-5">
          <h3 className="font-semibold text-white">Feature contributions to this prediction</h3>
          <p className="mt-0.5 text-xs text-slate-500">Each rule-engine factor scored 0–100; the aquifer &amp; VES factors are the ones derived from the survey above.</p>
          <Chart option={factorBars(assessment.factors)} style={{ minHeight: 280 }} />
        </div>

        {/* ── 7 · Engineering recommendation ── */}
        <StageLabel n={7} title="Engineering Recommendation" note="Depth, yield & the field-validation decision" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid content-start gap-3">
            <StatCard label="Recommended depth" value={`${assessment.recommendedDepthM[0]}–${assessment.recommendedDepthM[1]}`} unit="m" tone="good" />
            <StatCard label="Expected yield" value={assessment.yieldCategory} hint={`~${assessment.yieldLph[0].toLocaleString()}–${assessment.yieldLph[1].toLocaleString()} L/hr`} tone={assessment.yieldCategory === 'Good' ? 'good' : assessment.yieldCategory === 'Moderate' ? 'warn' : 'bad'} />
            <div className="glass p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expected aquifer</div>
              <div className="mt-1 text-sm font-medium text-cyan-200">{assessment.aquiferType}</div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <FieldValidationBox fv={assessment.fieldValidation} />
          </div>
        </div>
        <div className="mt-4">
          <DepthRationale steps={assessment.depthRationale} />
        </div>

        {/* ── supporting context ── */}
        <div className="mb-3 mt-10 flex items-center gap-2 border-t border-white/10 pt-6">
          <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Local &amp; district context (CGWB record)</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard label="Annual rainfall" value={String(taluka.rainfallMm)} unit="mm" hint="CGWB normal 2003–12" />
          <StatCard label="GW development" value={`${taluka.stagePct}%`} hint={`${taluka.category} (2013)`} tone={taluka.stagePct >= 90 ? 'bad' : taluka.stagePct >= 75 ? 'warn' : 'good'} />
          <StatCard label="Yield potential" value={taluka.yieldPotential.split(' ')[0]} hint="CGWB Table-8" />
          <StatCard label="CGWB wells" value={String(talukaWells.length)} hint={`${tested.length} pump-tested`} />
          <StatCard label="Well success rate" value={tested.length ? `${Math.round((successes.length / tested.length) * 100)}%` : '—'} hint="≥1 lps of tested" tone={!tested.length ? 'default' : successes.length / tested.length >= 0.6 ? 'good' : successes.length / tested.length >= 0.4 ? 'warn' : 'bad'} />
          <StatCard label="Best documented yield" value={tested.length ? String(Math.max(...tested.map((w) => w.yieldLps!)).toFixed(1)) : '—'} unit="lps" />
        </div>

        <div className="mt-3 glass p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Terrain &amp; district context</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{taluka.terrain}</p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-400">
            <li>2013: availability {DISTRICT_OVERVIEW.resources2013.netAvailabilityMcm} MCM · draft {DISTRICT_OVERVIEW.resources2013.draftMcm} MCM ({DISTRICT_OVERVIEW.resources2013.stagePct}%).</li>
            <li>2023 update: development <b className="text-amber-300">{LATEST_ASSESSMENT.puneDevelopmentBand}</b>, <b className="text-amber-300">{LATEST_ASSESSMENT.puneStressedTalukas} talukas stressed</b> (GSDA/CGWB).</li>
          </ul>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass p-5">
            <h3 className="font-semibold text-white">Rainfall across talukas (mm/yr)</h3>
            <Chart option={talukaBars(rainRows, 'mm')} style={{ minHeight: 380 }} />
          </div>
          <div className="glass p-5">
            <h3 className="font-semibold text-white">Groundwater development stage (%, 2013)</h3>
            <p className="mt-0.5 text-xs text-slate-500">≥90% approaches semi-critical; ≥100% would be over-exploited.</p>
            <Chart option={talukaBars(stageRows, '%', ['#fbbf24', '#b45309'])} style={{ minHeight: 360 }} />
          </div>
        </div>

        <div className="mt-4 glass p-5">
          <h3 className="font-semibold text-white">Depth vs yield — CGWB wells in {taluka.name}</h3>
          {tested.length >= 2 ? (
            <Chart option={wellScatter(tested.map((w) => ({ village: w.village, depthM: w.depthM, yieldLps: w.yieldLps })))} style={{ minHeight: 300 }} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">Not enough pump-tested wells in this taluka for a scatter — see the table.</div>
          )}
        </div>

        <div className="glass mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
            <h3 className="font-semibold text-white">Documented CGWB wells — {taluka.name}</h3>
            <Badge tone="slate">NAQUIM Annexure-I</Badge>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead className="sticky top-0 bg-panel text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>{['Village', 'Type', 'Drilled (m)', 'WL pre/post (m)', 'Yield', 'Aq-I (m)', 'Aq-II (m)', 'Zone thick (m)'].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {talukaWells.map((w) => (
                  <tr key={w.sno} className="border-t border-white/5 text-slate-300">
                    <td className="px-4 py-2">{w.village}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{w.type}</td>
                    <td className="px-4 py-2 font-mono text-xs">{w.depthM ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs">{w.preSwlM ?? '—'} / {w.postSwlM ?? '—'}</td>
                    <td className="px-4 py-2">{w.yieldLps === null ? <span className="text-xs text-slate-500">not tested</span> : <Badge tone={wellOutcome(w) === 1 ? 'green' : 'red'}>{w.yieldRaw}</Badge>}</td>
                    <td className="px-4 py-2 font-mono text-xs">{w.aq1BottomM ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs">{w.aq2BottomM ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs">{w.aq2ThickM ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Link href="/analyze" className="btn-ghost">New assessment</Link>
          <Link href="/report" className="btn-primary">Generate PDF report</Link>
        </div>
      </div>
    </div>
  )
}
