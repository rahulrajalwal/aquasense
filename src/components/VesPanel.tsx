'use client'

// VES sounding step of the guided analysis: enter (or demo-load) a
// Schlumberger sounding, invert it with the 1-D engine, and hand the
// interpreted aquifer layer back to the assessment.

import { useMemo, useState } from 'react'
import Chart from '@/components/Chart'
import { soundingChart } from '@/components/chartDefs'
import { Badge } from '@/components/ui'
import { siteById } from '@/lib/data/sites'
import type { VESReading, UserParams } from '@/lib/types'
import { schlumbergerRhoA, soundingCurve, type ResLayer } from '@/lib/physics/ves'
import { invertVES, depthToTop, type FitResult } from '@/lib/physics/invert'
import { matchParams } from '@/lib/engine/matcher'
import { assess, type Assessment } from '@/lib/engine/recommend'

export interface VesAquiferInfo {
  rho: number
  thickM: number
  topM: number
}

/** What the panel needs to seed the inversion and sanity-check parameters. */
export interface VesSiteContext {
  siteName: string
  rainfallMm: number
  waterTableM: number
  boreDepthM: number
  successPct: number
}

/** tiny deterministic hash → 0..1 for repeatable demo noise */
function jitter(id: string, k: number): number {
  let h = 2166136261
  const s = `${id}~${k}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

const DEMO_SPACINGS = [1.5, 2, 3, 4.5, 6.5, 10, 15, 22, 32, 46, 68, 100]
const ARCH = () => siteById('basalt-plateau')! // Deccan-trap prior for the whole district

function demoReadings(ctx: VesSiteContext): VESReading[] {
  const arch = ARCH()
  const gm = (r: [number, number]) => Math.sqrt(r[0] * r[1])
  const layers: ResLayer[] = arch.layers.map((l, i) => ({
    resistivity: gm(l.rhoRange) * (0.85 + 0.3 * jitter(ctx.siteName, i)),
    thickness: l.thickRange[1] === 0 ? 0 : gm(l.thickRange) * (0.85 + 0.3 * jitter(ctx.siteName, 10 + i)),
  }))
  return DEMO_SPACINGS.map((s, i) => ({
    s,
    rhoA: Math.round(schlumbergerRhoA(layers, s) * (0.97 + 0.06 * jitter(ctx.siteName, 20 + i)) * 10) / 10,
  }))
}

function userParamsFrom(ctx: VesSiteContext): UserParams {
  const arch = ARCH()
  return {
    soil: arch.soils[0],
    rock: arch.rocks[0],
    rainfallMm: Math.round(ctx.rainfallMm),
    waterTableM: Math.round(ctx.waterTableM * 10) / 10,
    nearbyWellDepthM: Math.round(ctx.boreDepthM),
    nearbyWellSuccessPct: Math.round(ctx.successPct),
  }
}

export default function VesPanel({
  context,
  onAquifer,
}: {
  context: VesSiteContext
  /** notifies the wizard when an inversion produces (or clears) an aquifer pick */
  onAquifer?: (aq: VesAquiferInfo | null) => void
}) {
  const [readings, setReadings] = useState<VESReading[]>([])
  const [result, setResult] = useState<{ fit: FitResult; assessment: Assessment } | null>(null)
  const [busy, setBusy] = useState(false)

  const clearResult = () => {
    setResult(null)
    onAquifer?.(null)
  }

  const loadDemo = () => {
    setReadings(demoReadings(context))
    clearResult()
  }

  const update = (i: number, field: keyof VESReading, val: string) => {
    const n = Number(val)
    setReadings((rs) => rs.map((r, j) => (j === i ? { ...r, [field]: Number.isFinite(n) ? n : 0 } : r)))
    clearResult()
  }

  const addRow = () => {
    const last = readings[readings.length - 1]
    setReadings([...readings, { s: last ? Math.round(last.s * 1.5 * 10) / 10 : 1.5, rhoA: last?.rhoA ?? 30 }])
    clearResult()
  }

  const removeRow = (i: number) => {
    setReadings((rs) => rs.filter((_, j) => j !== i))
    clearResult()
  }

  const runInversion = () => {
    setBusy(true)
    // let the UI paint the busy state before the synchronous solve
    setTimeout(() => {
      try {
        const arch = ARCH()
        const valid = readings.filter((r) => r.s > 0 && r.rhoA > 0).sort((a, b) => a.s - b.s)
        const fit = invertVES(valid, arch)
        const match = matchParams(arch, userParamsFrom(context))
        const assessment = assess(arch, userParamsFrom(context), match, valid, fit)
        setResult({ fit, assessment })
        const aq = assessment.aquifer
        onAquifer?.(aq ? { rho: aq.rho, thickM: aq.bottomM - aq.topM, topM: aq.topM } : null)
      } finally {
        setBusy(false)
      }
    }, 30)
  }

  const fittedCurve = useMemo(() => {
    if (!result) return []
    const ss = readings.map((r) => r.s)
    return soundingCurve(result.fit.layers, Math.min(...ss) * 0.8, Math.max(...ss) * 1.2, 60)
  }, [result, readings])

  const canInvert = readings.filter((r) => r.s > 0 && r.rhoA > 0).length >= 5

  return (
    <div className="glass overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <h3 className="font-semibold text-white">Resistivity sounding at {context.siteName || 'your plot'}</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Enter Schlumberger field readings (AB/2 vs apparent resistivity ρa). The engine inverts them into a
            layered model and identifies the saturated zone.
          </p>
        </div>
        <Badge tone="cyan">1-D inversion</Badge>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        {/* input table */}
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={loadDemo}>
              No survey yet? Load an example sounding
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={addRow} disabled={readings.length >= 20}>
              + Add row
            </button>
          </div>
          {readings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-500">
              Type your field readings, or load the example (a synthetic Deccan-basalt curve, clearly for
              demonstration) to see how the inversion works.
            </div>
          ) : (
            <div className="max-h-72 overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-panel text-left text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">AB/2 (m)</th>
                    <th className="px-3 py-2">ρa (Ω·m)</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-3 py-1.5 font-mono text-xs text-slate-500">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <input
                          className="field !py-1.5 font-mono"
                          type="number"
                          step="any"
                          value={r.s}
                          onChange={(e) => update(i, 's', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="field !py-1.5 font-mono"
                          type="number"
                          step="any"
                          value={r.rhoA}
                          onChange={(e) => update(i, 'rhoA', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                          onClick={() => removeRow(i)}
                          aria-label="Remove row"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button id="btn-invert" className="btn-primary mt-4 w-full" onClick={runInversion} disabled={!canInvert || busy}>
            {busy ? 'Inverting layered model…' : 'Invert sounding'}
          </button>
          {!canInvert && readings.length > 0 && (
            <p className="mt-2 text-xs text-amber-300/80">Need at least 5 valid readings to invert.</p>
          )}
        </div>

        {/* results */}
        <div>
          {!result ? (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-500">
              The measured curve, fitted layers and interpreted aquifer appear here after inversion.
            </div>
          ) : (
            <div className="space-y-4">
              <Chart option={soundingChart(readings, fittedCurve)} style={{ minHeight: 280 }} />

              {/* layer table */}
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="bg-panel px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Fitted layered model · RMS log-misfit {(result.fit.rmsLog * 100).toFixed(1)}%
                  {result.assessment.curveTypeText && <> · type {result.assessment.curveTypeText}</>}
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {result.fit.layers.map((l, i) => {
                      const top = depthToTop(result.fit.layers, i)
                      const isAquifer = result.assessment.aquifer?.layerIndex === i
                      const last = i === result.fit.layers.length - 1
                      return (
                        <tr key={i} className={`border-t border-white/5 ${isAquifer ? 'bg-cyan-400/10' : ''}`}>
                          <td className="px-4 py-2 font-mono text-xs text-slate-400">
                            {top.toFixed(1)}{last ? ' m → ∞' : `–${(top + l.thickness).toFixed(1)} m`}
                          </td>
                          <td className="px-4 py-2 font-mono text-cyan-200">{l.resistivity.toFixed(0)} Ω·m</td>
                          <td className="px-4 py-2 text-xs text-slate-400">
                            {isAquifer ? (
                              <span className="font-semibold text-cyan-300">Interpreted aquifer ✓</span>
                            ) : last ? (
                              'Basement / half-space'
                            ) : (
                              ''
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div
                className={`rounded-xl border p-4 text-xs leading-relaxed ${
                  result.assessment.aquifer
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                    : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                }`}
              >
                {result.assessment.aquifer ? (
                  <>
                    <b>Aquifer layer identified</b> — ~{result.assessment.aquifer.rho.toFixed(0)} Ω·m between{' '}
                    {result.assessment.aquifer.topM.toFixed(1)} and {result.assessment.aquifer.bottomM.toFixed(1)} m.
                    This feeds directly into the site assessment below.
                  </>
                ) : (
                  <>
                    <b>No clear saturated zone</b> in this sounding — the assessment will treat the geophysics as
                    unfavourable at this exact spot.
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
