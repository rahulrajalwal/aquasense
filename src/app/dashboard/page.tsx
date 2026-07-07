'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { PageHeader, StatCard, Badge } from '@/components/ui'
import Chart from '@/components/Chart'
import { talukaBars, wellScatter, factorBars, probabilityGauge } from '@/components/chartDefs'
import { useAppState, DEFAULT_SITE } from '@/components/AppState'
import { TALUKAS_REAL, talukaByIdReal, TALUKA_NAME_TO_ID } from '@/lib/data/real/talukas'
import { CGWB_WELLS, wellOutcome } from '@/lib/data/real/wells'
import { DISTRICT_OVERVIEW, LATEST_ASSESSMENT } from '@/lib/data/real/hydro'
import { assessSite } from '@/lib/engine/assessReal'

export default function DashboardPage() {
  const { site, setSite, hydrated } = useAppState()
  const input = site ?? DEFAULT_SITE
  const taluka = talukaByIdReal(input.talukaId) ?? TALUKAS_REAL[1]

  const assessment = useMemo(() => assessSite({ ...input, talukaId: taluka.id }), [input, taluka.id])

  const talukaWells = useMemo(
    () => CGWB_WELLS.filter((w) => TALUKA_NAME_TO_ID[w.taluka] === taluka.id),
    [taluka.id],
  )
  const tested = talukaWells.filter((w) => w.yieldLps !== null)
  const successes = tested.filter((w) => wellOutcome(w) === 1)

  const rainRows = TALUKAS_REAL.map((t) => ({
    name: t.name.replace(/ \(.*\)/, ''),
    value: t.rainfallMm,
    highlight: t.id === taluka.id,
  })).sort((a, b) => a.value - b.value)

  const stageRows = TALUKAS_REAL.filter((t) => t.id !== 'pune-city')
    .map((t) => ({
      name: t.name.replace(/ \(.*\)/, ''),
      value: t.stagePct,
      highlight: t.id === taluka.id,
    }))
    .sort((a, b) => a.value - b.value)

  return (
    <div>
      <PageHeader
        kicker="Dashboard"
        title="Groundwater Intelligence Dashboard"
        sub="Taluka-level view of the CGWB record — rainfall, resource stress, documented wells — alongside the current assessment for your selected site."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* selector */}
        <div className="glass mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Taluka</label>
            <select
              className="field !w-auto"
              value={taluka.id}
              onChange={(e) => setSite({ ...input, talukaId: e.target.value })}
            >
              {TALUKAS_REAL.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {hydrated && site?.placeName && <Badge tone="cyan">site: {site.placeName}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={taluka.category === 'Semi-Critical' ? 'amber' : 'green'}>{taluka.category}</Badge>
            {taluka.droughtProne && <Badge tone="amber">drought-prone</Badge>}
            <Badge tone="slate">CGWB data</Badge>
          </div>
        </div>

        {/* KPI row */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard
            label="Site probability"
            value={`${assessment.probability}%`}
            hint={input.placeName || 'last analyzed input'}
            tone={assessment.probability >= 65 ? 'good' : assessment.probability >= 45 ? 'warn' : 'bad'}
          />
          <StatCard label="Annual rainfall" value={String(taluka.rainfallMm)} unit="mm" hint="CGWB normal 2003–12" />
          <StatCard
            label="GW development"
            value={`${taluka.stagePct}%`}
            hint={`${taluka.category} (2013)`}
            tone={taluka.stagePct >= 90 ? 'bad' : taluka.stagePct >= 75 ? 'warn' : 'good'}
          />
          <StatCard label="CGWB wells" value={String(talukaWells.length)} hint={`${tested.length} pump-tested`} />
          <StatCard
            label="Well success rate"
            value={tested.length ? `${Math.round((successes.length / tested.length) * 100)}%` : '—'}
            hint="≥1 lps of tested"
            tone={
              !tested.length ? 'default' : successes.length / tested.length >= 0.6 ? 'good' : successes.length / tested.length >= 0.4 ? 'warn' : 'bad'
            }
          />
          <StatCard
            label="Best documented yield"
            value={
              tested.length ? String(Math.max(...tested.map((w) => w.yieldLps!)).toFixed(1)) : '—'
            }
            unit="lps"
            hint={taluka.explYieldMax ? `CGWB max ${taluka.explYieldMax}` : undefined}
          />
        </div>

        {/* gauge + terrain + district context */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="glass p-4">
            <Chart option={probabilityGauge(assessment.probability)} style={{ minHeight: 235 }} />
            <p className="-mt-2 pb-2 text-center text-[11px] text-slate-500">
              ML {assessment.mlProbability}% · rules {assessment.ruleProbability}% ·{' '}
              <Link href="/analyze" className="text-cyan-400 underline">
                re-run assessment
              </Link>
            </p>
          </div>
          <div className="glass flex flex-col justify-center gap-4 p-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Terrain & setting</div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{taluka.terrain}</p>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Yield potential (CGWB Table-8)
              </div>
              <div className="mt-1 text-lg font-semibold text-cyan-200">{taluka.yieldPotential}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Recommended depth window (site)
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                {assessment.recommendedDepthM[0]}–{assessment.recommendedDepthM[1]} m
              </div>
            </div>
          </div>
          <div className="glass flex flex-col justify-center p-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">District context</div>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-300">
              <li>
                2013: availability <b className="text-cyan-200">{DISTRICT_OVERVIEW.resources2013.netAvailabilityMcm} MCM</b>{' '}
                · draft {DISTRICT_OVERVIEW.resources2013.draftMcm} MCM ({DISTRICT_OVERVIEW.resources2013.stagePct}%)
              </li>
              <li>
                2023 update: development <b className="text-amber-300">{LATEST_ASSESSMENT.puneDevelopmentBand}</b> ·{' '}
                <b className="text-amber-300">{LATEST_ASSESSMENT.puneStressedTalukas} talukas stressed</b> (GSDA/CGWB)
              </li>
              <li className="text-xs text-slate-500">{DISTRICT_OVERVIEW.trendNote}</li>
            </ul>
          </div>
        </div>

        {/* comparison charts */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass p-5">
            <h3 className="font-semibold text-white">Rainfall across talukas (mm/yr, CGWB 2003–2012)</h3>
            <Chart option={talukaBars(rainRows, 'mm')} style={{ minHeight: 380 }} />
          </div>
          <div className="glass p-5">
            <h3 className="font-semibold text-white">Groundwater development stage (%, 2013 assessment)</h3>
            <p className="mt-0.5 text-xs text-slate-500">≥90% approaches semi-critical; ≥100% would be over-exploited.</p>
            <Chart option={talukaBars(stageRows, '%', ['#fbbf24', '#b45309'])} style={{ minHeight: 360 }} />
          </div>
        </div>

        {/* wells detail */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass p-5">
            <h3 className="font-semibold text-white">Depth vs yield — CGWB wells in {taluka.name}</h3>
            {tested.length >= 2 ? (
              <Chart
                option={wellScatter(tested.map((w) => ({ village: w.village, depthM: w.depthM, yieldLps: w.yieldLps })))}
                style={{ minHeight: 300 }}
              />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
                Not enough pump-tested wells in this taluka for a scatter — see the table.
              </div>
            )}
          </div>
          <div className="glass p-5">
            <h3 className="font-semibold text-white">Site factor breakdown</h3>
            <p className="mt-0.5 text-xs text-slate-500">From the current assessment for your selected input.</p>
            <Chart option={factorBars(assessment.factors)} style={{ minHeight: 300 }} />
          </div>
        </div>

        {/* wells table */}
        <div className="glass mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
            <h3 className="font-semibold text-white">Documented CGWB wells — {taluka.name}</h3>
            <Badge tone="slate">NAQUIM Annexure-I</Badge>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead className="sticky top-0 bg-panel text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  {['Village', 'Type', 'Drilled (m)', 'WL pre/post (m)', 'Yield', 'Aq-I (m)', 'Aq-II (m)', 'Zone thick (m)'].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {talukaWells.map((w) => (
                  <tr key={w.sno} className="border-t border-white/5 text-slate-300">
                    <td className="px-4 py-2">{w.village}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{w.type}</td>
                    <td className="px-4 py-2 font-mono text-xs">{w.depthM ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {w.preSwlM ?? '—'} / {w.postSwlM ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      {w.yieldLps === null ? (
                        <span className="text-xs text-slate-500">not tested</span>
                      ) : (
                        <Badge tone={wellOutcome(w) === 1 ? 'green' : 'red'}>{w.yieldRaw}</Badge>
                      )}
                    </td>
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
          <Link href="/analyze" className="btn-ghost">
            New assessment
          </Link>
          <Link href="/report" className="btn-primary">
            Generate PDF report
          </Link>
        </div>
      </div>
    </div>
  )
}
