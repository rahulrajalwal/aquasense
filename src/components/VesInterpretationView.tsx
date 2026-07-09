'use client'

// Renders a VES interpretation as composable parts so different pages can show
// exactly the stage they need: the Analyze wizard shows everything, while the
// Dashboard splits it across its seven workflow sections. (The curve type is
// still computed on the backend but intentionally not shown in the UI.)

import { useMemo, useState } from 'react'
import Chart from '@/components/Chart'
import { soundingChart } from '@/components/chartDefs'
import CrossSection from '@/components/CrossSection'
import ResistivityReference from '@/components/ResistivityReference'
import { Badge, StatCard } from '@/components/ui'
import { soundingCurve } from '@/lib/physics/ves'
import type { VesInterpretation } from '@/lib/physics/interpret'
import type { RockType } from '@/lib/physics/geoelectrics'
import type { VESReading } from '@/lib/types'

export type VesPart = 'summary' | 'data' | 'layertable' | 'crosssection' | 'reasoning' | 'reference' | 'params'
const ALL_PARTS: VesPart[] = ['summary', 'data', 'layertable', 'crosssection', 'reasoning', 'params', 'reference']

const ROCK_TONE: Record<RockType, string> = {
  topsoil: 'text-amber-300',
  'weathered-basalt': 'text-cyan-300',
  'fractured-basalt': 'text-blue-300',
  'fresh-basalt': 'text-slate-300',
}

function VesDataTable({ readings }: { readings: VESReading[] }) {
  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Field sounding data</h4>
        <Badge tone="slate">{readings.length} readings</Badge>
      </div>
      <div className="max-h-56 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-panel text-left text-[11px] uppercase tracking-wider">
            <tr className="border-b border-white/10">
              <th className="px-4 py-2 text-slate-500">#</th>
              <th className="px-3 py-2 text-cyan-300">AB/2 (m)</th>
              <th className="px-3 py-2 text-amber-300">ρₐ (Ω·m)</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {readings.map((r, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-1.5 text-slate-500">{i + 1}</td>
                <td className="px-3 py-1.5 text-cyan-200">{r.s}</td>
                <td className="px-3 py-1.5 text-amber-200">{r.rhoA.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function VesInterpretationView({
  interp,
  compact = false,
  parts = ALL_PARTS,
}: {
  interp: VesInterpretation
  compact?: boolean
  parts?: VesPart[]
}) {
  const [open, setOpen] = useState<number>(Math.max(0, interp.layers.findIndex((l) => l.isAquifer)))
  const has = (p: VesPart) => parts.includes(p)

  const curve = useMemo(() => {
    if (interp.source !== 'inverted' || !interp.readings || !interp.fittedLayers) return null
    const ss = interp.readings.map((r) => r.s)
    return soundingCurve(interp.fittedLayers, Math.min(...ss) * 0.8, Math.max(...ss) * 1.2, 60)
  }, [interp])

  const activeRocks = useMemo(() => Array.from(new Set(interp.layers.map((l) => l.rock))) as RockType[], [interp])

  const layerTable = (
    <div className="glass overflow-hidden">
      <div className="border-b border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Interpreted subsurface layers
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500">
          <tr className="border-b border-white/10">
            <th className="px-4 py-2">Depth</th>
            <th className="px-3 py-2">ρ (Ω·m)</th>
            <th className="px-3 py-2">Fit</th>
            <th className="px-3 py-2">Layer</th>
          </tr>
        </thead>
        <tbody>
          {interp.layers.map((l, i) => {
            const fitTone = l.matchConfidence >= 75 ? 'text-emerald-300' : l.matchConfidence >= 55 ? 'text-amber-300' : 'text-rose-300'
            return (
              <tr key={i} className={`border-b border-white/5 last:border-0 ${l.isAquifer ? 'bg-cyan-400/5' : ''}`}>
                <td className="px-4 py-2 font-mono text-xs text-slate-400">
                  {l.topM}
                  {l.bottomM === null ? ' m →' : `–${l.bottomM}`}
                </td>
                <td className="px-3 py-2 font-mono text-cyan-200">{l.resistivity.toFixed(0)}</td>
                <td className={`px-3 py-2 font-mono text-xs ${fitTone}`}>{l.matchConfidence}%</td>
                <td className={`px-3 py-2 text-xs font-medium ${ROCK_TONE[l.rock] ?? 'text-slate-300'}`}>
                  {l.rockLabel}
                  {l.isAquifer && <span className="ml-1 text-cyan-400">💧</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const crossSection = (
    <div className="glass p-3">
      <div className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Geological cross-section</div>
      <CrossSection layers={interp.layers} waterTableM={interp.derived.waterTableM} maxDepthM={interp.maxDepthM} height={compact ? 320 : 380} />
    </div>
  )

  const bothLayers = has('layertable') && has('crosssection')

  return (
    <div className="space-y-4">
      {/* summary */}
      {has('summary') && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={interp.source === 'inverted' ? 'cyan' : 'slate'}>
              {interp.source === 'inverted' ? 'Field VES — inverted' : 'Official CGWB interpreted layers'}
            </Badge>
            {interp.rmsLogPct !== null && <Badge tone="green">RMS misfit {interp.rmsLogPct}%</Badge>}
            <Badge tone={interp.quality === 'good' ? 'green' : interp.quality === 'fair' ? 'amber' : 'red'}>{interp.quality} resolution</Badge>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{interp.summary}</p>
        </>
      )}

      {/* raw data + sounding curve (field only) */}
      {has('data') && interp.source === 'inverted' && interp.readings && (
        <div className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-[300px_1fr]'}`}>
          <VesDataTable readings={interp.readings} />
          {curve && (
            <div className="glass p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">VES sounding curve</h4>
                <Badge tone="cyan">ρₐ vs AB/2 · log–log</Badge>
              </div>
              <Chart option={soundingChart(interp.readings, curve)} style={{ minHeight: 280 }} />
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Scroll or drag on the plot to zoom and pan. <b className="text-slate-300">Apparent resistivity (ρₐ)</b> is what the
                ground appears to have at each spacing; small AB/2 senses shallow layers, large AB/2 senses deep ones.
              </p>
            </div>
          )}
        </div>
      )}

      {/* layer table + cross-section */}
      {bothLayers ? (
        <div className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-[1fr_460px]'}`}>
          {layerTable}
          {crossSection}
        </div>
      ) : (
        <>
          {has('layertable') && layerTable}
          {has('crosssection') && crossSection}
        </>
      )}

      {/* per-layer reasoning */}
      {has('reasoning') && (
        <div className="glass overflow-hidden">
          <div className="border-b border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            How each layer is interpreted (resistivity → geology)
          </div>
          {interp.layers.map((l, i) => (
            <div key={i} className="border-b border-white/5 last:border-0">
              <button
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-white/5"
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: l.color }} />
                  <span className={`font-medium ${ROCK_TONE[l.rock] ?? 'text-slate-200'}`}>{l.rockLabel}</span>
                  <span className="font-mono text-xs text-slate-500">{l.resistivity.toFixed(0)} Ω·m</span>
                </span>
                <span className={`text-cyan-400 transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === i && (
                <div className="px-4 pb-3.5">
                  <p className="text-sm leading-relaxed text-slate-400">{l.explanation}</p>
                  <ol className="mt-3 space-y-1.5 border-l-2 border-cyan-400/20 pl-3.5">
                    {l.reasoning.map((r, k) => (
                      <li key={k} className="text-xs leading-relaxed">
                        <span className="font-semibold text-cyan-300">{r.step}</span>
                        <span className="text-slate-600"> — </span>
                        <span className="text-slate-300">{r.text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* derived aquifer parameters */}
      {has('params') && (
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-white">Aquifer parameters auto-extracted from the VES</h4>
            <Badge tone="green">feeds the ML model</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Water table" value={String(interp.derived.waterTableM)} unit="m" tone="good" />
            <StatCard label="Aquifer-I bottom" value={String(interp.derived.aq1BottomM)} unit="m" hint="weathered zone" />
            <StatCard label="Aquifer-II depth" value={String(interp.derived.aq2BottomM)} unit="m" hint="fracture zone" />
            <StatCard label="Aquifer-II thickness" value={String(interp.derived.aq2ThickM)} unit="m" hint="productive zone" tone="default" />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            These aquifer parameters are <b className="text-slate-300">not entered by hand</b> — they are derived directly from the
            interpreted resistivity layers and passed to the machine-learning model: resistivity → layers → aquifer → parameters →
            prediction.
          </p>
        </div>
      )}

      {/* standard resistivity reference */}
      {has('reference') && <ResistivityReference active={activeRocks} />}
    </div>
  )
}
