'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PageHeader, Badge, StatCard } from '@/components/ui'
import { useAppState, DEFAULT_SITE } from '@/components/AppState'
import { TALUKAS_REAL, talukaByIdReal } from '@/lib/data/real/talukas'
import { assessSite } from '@/lib/engine/assessReal'
import { generateReport } from '@/lib/report'

const SECTIONS = [
  ['1 · Study area & inputs', 'Location, coordinates and every parameter you provided'],
  ['2 · VES survey & interpretation', 'Interpreted resistivity layers (topsoil → weathered → fractured → fresh basalt) and the aquifer parameters auto-extracted from them'],
  ['3 · Data sources', 'Full citations: CGWB 2013 report, NAQUIM study, GSDA 2023 assessment'],
  ['4 · Local CGWB evidence', 'Nearest documented wells with depths, water levels, yields and outcomes'],
  ['5 · Aquifer setting', 'The NAQUIM two-aquifer system with the VES-derived depths for this site'],
  ['6 · ML prediction', 'Probability bar (ML + rules), verdict, strike & drilling depths, yield, confidence'],
  ['7 · Factor breakdown', 'All rule-engine factors with weights, scores and evidence notes'],
  ['8 · ML model', 'Model provenance, validation metrics, and signed feature contributions'],
  ['9 · Interpretation', 'The full explanation panel in report form'],
  ['10 · Actions', 'VES, permissions, recharge — what to do before drilling'],
  ['11 · Field validation', 'The engineering-decision summary tying the recommendation back to the VES'],
  ['12 · Disclaimer', 'Decision-support scope and data vintage'],
]

export default function ReportPage() {
  const { site, setSite } = useAppState()
  const input = site ?? DEFAULT_SITE
  const taluka = talukaByIdReal(input.talukaId) ?? TALUKAS_REAL[1]
  const assessment = useMemo(() => assessSite({ ...input, talukaId: taluka.id }), [input, taluka.id])
  const [generating, setGenerating] = useState(false)

  const download = () => {
    setGenerating(true)
    setTimeout(() => {
      try {
        generateReport(assessment)
      } finally {
        setGenerating(false)
      }
    }, 50)
  }

  return (
    <div>
      <PageHeader
        kicker="Report generator"
        title="Borewell Assessment Report"
        sub="A professional PDF of the complete assessment — CGWB evidence, model results, interpretation and recommended actions, with full source citations."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-4 grid gap-4 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <div className="glass p-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Report location
              </label>
              <select
                className="field"
                value={taluka.id}
                onChange={(e) => setSite({ ...input, talukaId: e.target.value })}
              >
                {TALUKAS_REAL.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {input.placeName ? `${input.placeName}, ` : ''}
                {taluka.name} taluka, Pune district
                {input.lat !== null ? ` · ${input.lat.toFixed(4)}°N, ${input.lon?.toFixed(4)}°E` : ''}
              </p>
              {!site && (
                <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-400/10 p-2.5 text-[11px] leading-relaxed text-amber-200">
                  No assessment run yet — this report will use taluka-level defaults. For a site-specific report, run
                  the <Link href="/analyze" className="underline">guided assessment</Link> first.
                </p>
              )}

              <button id="btn-download" className="btn-primary mt-5 w-full py-3.5" onClick={download} disabled={generating}>
                {generating ? 'Building PDF…' : 'Download PDF report'}
                {!generating && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
                  </svg>
                )}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                Generated client-side with jsPDF · cites CGWB & NAQUIM sources.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Probability"
                value={`${assessment.probability}%`}
                tone={assessment.probability >= 65 ? 'good' : assessment.probability >= 45 ? 'warn' : 'bad'}
              />
              <StatCard
                label="Depth window"
                value={`${assessment.recommendedDepthM[0]}–${assessment.recommendedDepthM[1]}`}
                unit="m"
              />
              <StatCard
                label="Yield"
                value={assessment.yieldCategory}
                hint={`${assessment.yieldLph[0].toLocaleString()}–${assessment.yieldLph[1].toLocaleString()} L/hr`}
              />
              <StatCard label="Confidence" value={`${assessment.confidencePct}%`} hint={assessment.confidence} />
            </div>
          </div>

          <div className="glass overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="font-semibold text-white">What the report contains</h3>
              <Badge tone="cyan">CGWB-cited</Badge>
            </div>
            <div className="grid gap-0 sm:grid-cols-2">
              {SECTIONS.map(([t, b], i) => (
                <div key={t} className={`border-b border-white/5 p-4 ${i % 2 === 0 ? 'sm:border-r' : ''}`}>
                  <div className="text-sm font-semibold text-cyan-300">{t}</div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-400">{b}</div>
                </div>
              ))}
            </div>
            <div className="p-4 text-[11px] leading-relaxed text-slate-500">
              Current verdict for {input.placeName || taluka.name}:{' '}
              <b
                className={
                  assessment.verdict === 'favourable'
                    ? 'text-emerald-300'
                    : assessment.verdict === 'moderate'
                      ? 'text-amber-300'
                      : 'text-rose-300'
                }
              >
                {assessment.verdict}
              </b>{' '}
              — {assessment.verdictText}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
