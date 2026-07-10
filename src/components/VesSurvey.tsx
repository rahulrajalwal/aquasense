'use client'

// The Electrical Resistivity Survey (VES) step — the core geophysical input.
// Mode 1 (default): official CGWB interpreted layers for the location.
// Mode 2: upload a field sounding CSV (AB/2, apparent resistivity) → real
// 1-D inversion → interpretation. Emits a VesInterpretation upward.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui'
import { siteById } from '@/lib/data/sites'
import { schlumbergerRhoA, type ResLayer } from '@/lib/physics/ves'
import { invertVES } from '@/lib/physics/invert'
import { interpretLayers, officialInterpretation, type VesInterpretation } from '@/lib/physics/interpret'
import { parseVesCsv, VES_CSV_TEMPLATE } from '@/lib/physics/vesCsv'
import type { VESReading } from '@/lib/types'

export interface OfficialParams {
  aq1BottomM: number
  aq2BottomM: number
  aq2ThickM: number
  preSwlM: number
}

const ARCH = () => siteById('basalt-plateau')!

function demoReadings(): VESReading[] {
  // A textbook Deccan H-type sounding: dry cover (resistive) over a saturated
  // weathered/fractured aquifer (low) over fresh massive basalt (high). The
  // conductive middle layer is the classic groundwater signature — a
  // favourable, internally-consistent example that the 3-layer inversion
  // recovers cleanly (low misfit).
  const layers: ResLayer[] = [
    { resistivity: 58, thickness: 4 },
    { resistivity: 22, thickness: 18 },
    { resistivity: 520, thickness: 0 },
  ]
  const spac = [1.5, 2, 3, 4.5, 6.5, 10, 15, 22, 32, 46, 68, 100]
  return spac.map((s, i) => ({ s, rhoA: Math.round(schlumbergerRhoA(layers, s) * (0.97 + 0.06 * ((i * 13) % 10) / 10) * 10) / 10 }))
}

function invert(readings: VESReading[]): VesInterpretation {
  const arch = ARCH()
  const valid = readings.filter((r) => r.s > 0 && r.rhoA > 0).sort((a, b) => a.s - b.s)
  const fit = invertVES(valid, arch)
  const maxDepth = Math.max(...valid.map((r) => r.s)) * 0.6
  return { ...interpretLayers(fit.layers, fit.rmsLog, maxDepth), readings: valid }
}

export interface OfficialMeta {
  location: string
  setting: string
  reference: string
  basis: string
}

export default function VesSurvey({
  officialParams,
  onInterpretation,
  value,
  officialMeta,
}: {
  officialParams: OfficialParams
  onInterpretation: (i: VesInterpretation | null) => void
  value: VesInterpretation | null
  /** Survey provenance shown in the official input panel. */
  officialMeta?: OfficialMeta
}) {
  const [mode, setMode] = useState<'official' | 'upload'>(value?.source === 'inverted' ? 'upload' : 'official')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // the official interpretation (with a representative reconstructed dataset)
  const officialInterp = useMemo(
    () => officialInterpretation(officialParams),
    [officialParams.aq1BottomM, officialParams.aq2BottomM, officialParams.aq2ThickM, officialParams.preSwlM],
  )

  // Mode 1 — load the official interpretation whenever selected / params change
  useEffect(() => {
    if (mode === 'official') {
      onInterpretation(officialInterp)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, officialInterp])

  const runInvert = (readings: VESReading[]) => {
    setBusy(true)
    setTimeout(() => {
      try {
        onInterpretation(invert(readings))
        setError(null)
      } catch {
        setError('Could not invert this sounding — check that the readings increase with spacing.')
        onInterpretation(null)
      } finally {
        setBusy(false)
      }
    }, 30)
  }

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const { readings, errors } = parseVesCsv(String(reader.result ?? ''))
      if (errors.length && readings.length < 5) {
        setError(errors.join(' '))
        onInterpretation(null)
        return
      }
      setError(errors.length ? errors.join(' ') : null)
      runInvert(readings)
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([VES_CSV_TEMPLATE], { type: 'text/csv' }))
    a.download = 'ves_sounding_template.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-4">
      {/* mode selector */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setMode('official')}
          className={`rounded-xl border p-4 text-left transition ${
            mode === 'official' ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white">Official CGWB Survey <span className="font-normal text-slate-400">(Preloaded VES Interpretation)</span></span>
            {mode === 'official' && <Badge tone="cyan">active</Badge>}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            A representative VES sounding reconstructed from CGWB&apos;s published interpreted layers for this area. Default — works immediately.
          </p>
        </button>
        <button
          onClick={() => {
            setMode('upload')
            onInterpretation(value?.source === 'inverted' ? value : null)
          }}
          className={`rounded-xl border p-4 text-left transition ${
            mode === 'upload' ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-white/25'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white">Upload New VES Survey <span className="font-normal text-slate-400">(Field Data)</span></span>
            {mode === 'upload' && <Badge tone="cyan">active</Badge>}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Your own Schlumberger VES readings (CSV: AB/2, apparent resistivity). The engine inverts them live.
          </p>
        </button>
      </div>

      {/* mode 1 — official survey input panel */}
      {mode === 'official' && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">Official survey input</span>
            <Badge tone="cyan">CGWB · NAQUIM</Badge>
          </div>

          {/* survey metadata */}
          <dl className="grid grid-cols-1 gap-x-6 text-xs sm:grid-cols-2">
            {([
              ['Survey source', 'Central Ground Water Board (CGWB) / NAQUIM'],
              ['Survey type', 'Electrical Resistivity Survey — Vertical Electrical Sounding (VES)'],
              ['Location', officialMeta?.location ?? 'Pune district, Maharashtra'],
              ['Publication', officialMeta?.reference ?? 'CGWB district report & NAQUIM aquifer mapping'],
              ['Geological setting', officialMeta?.setting ?? 'Deccan-trap basalt'],
              ['Interpretation source', 'CGWB published interpreted layers'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex gap-2 border-b border-white/5 py-1.5">
                <dt className="w-28 shrink-0 font-semibold text-slate-500">{k}</dt>
                <dd className="text-slate-300">{v}</dd>
              </div>
            ))}
          </dl>

          {/* representative apparent-resistivity dataset */}
          <div className="mt-3">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Representative apparent-resistivity dataset</span>
              <Badge tone="slate">input to the interpretation</Badge>
            </div>
            {officialInterp.readings && (
              <div className="overflow-hidden rounded-lg border border-white/10">
                <div className="max-h-56 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-panel text-left text-[10px] uppercase tracking-wider">
                      <tr className="border-b border-white/10">
                        <th className="px-3 py-1.5 text-slate-500">#</th>
                        <th className="px-3 py-1.5 text-cyan-300">AB/2 (m)</th>
                        <th className="px-3 py-1.5 text-amber-300">ρₐ (Ω·m)</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {officialInterp.readings.map((rd, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="px-3 py-1 text-slate-500">{i + 1}</td>
                          <td className="px-3 py-1 text-cyan-200">{rd.s}</td>
                          <td className="px-3 py-1 text-amber-200">{rd.rhoA.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* honest reconstruction disclaimer */}
          <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-2.5 text-[11px] leading-relaxed text-slate-400">
            <b className="text-amber-300">Representative apparent-resistivity dataset</b> reconstructed from official CGWB interpreted
            layers. Original field readings are generally not publicly available — this dataset is used only for educational
            visualization of the interpretation workflow, and is never presented as original CGWB field data.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            {officialMeta?.basis ? `${officialMeta.basis} ` : ''}The VES curve, geological layers and aquifer parameters derived
            from this dataset appear in the next step. For a plot-specific result, switch to{' '}
            <b className="text-cyan-300">Upload New VES Survey</b>.
          </p>
        </div>
      )}

      {/* mode 2 controls */}
      {mode === 'upload' && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? 'Inverting…' : 'Upload VES CSV'}
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={() => runInvert(demoReadings())} disabled={busy}>
              No file? Load an example sounding
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={downloadTemplate}>
              CSV template
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onFile(f)
                e.target.value = ''
              }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            CSV format: a header row with <span className="font-mono">AB/2</span> and{' '}
            <span className="font-mono">apparent_resistivity</span>, then one row per electrode spacing (at least 5).
          </p>
          {error && <p className="mt-2 text-xs text-amber-300">{error}</p>}
          {value?.source === 'inverted' && !busy && (
            <p className="mt-2 text-xs text-emerald-300">
              ✓ Sounding inverted — {value.layers.length} layers resolved. Interpretation below.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
