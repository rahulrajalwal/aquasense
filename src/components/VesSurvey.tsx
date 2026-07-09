'use client'

// The Electrical Resistivity Survey (VES) step — the core geophysical input.
// Mode 1 (default): official CGWB interpreted layers for the location.
// Mode 2: upload a field sounding CSV (AB/2, apparent resistivity) → real
// 1-D inversion → interpretation. Emits a VesInterpretation upward.

import { useEffect, useRef, useState } from 'react'
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

export default function VesSurvey({
  officialParams,
  onInterpretation,
  value,
}: {
  officialParams: OfficialParams
  onInterpretation: (i: VesInterpretation | null) => void
  value: VesInterpretation | null
}) {
  const [mode, setMode] = useState<'official' | 'upload'>(value?.source === 'inverted' ? 'upload' : 'official')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Mode 1 — load official interpreted layers whenever selected / params change
  useEffect(() => {
    if (mode === 'official') {
      onInterpretation(officialInterpretation(officialParams))
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, officialParams.aq1BottomM, officialParams.aq2BottomM, officialParams.aq2ThickM, officialParams.preSwlM])

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
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Use official survey data</span>
            {mode === 'official' && <Badge tone="cyan">active</Badge>}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Load the interpreted aquifer layers CGWB already published for this area. Default — works immediately.
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
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Upload a new field survey</span>
            {mode === 'upload' && <Badge tone="cyan">active</Badge>}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Upload your Schlumberger VES readings (CSV: AB/2, apparent resistivity). The engine inverts them live.
          </p>
        </button>
      </div>

      {/* mode 1 note */}
      {mode === 'official' && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-300">
          Official CGWB interpreted layers loaded for this location. CGWB publishes interpreted aquifer <b>depths</b>,
          not raw sounding curves, so no apparent-resistivity curve is shown here — the geological column and aquifer
          parameters below come directly from the official interpretation. For a plot-specific result, switch to
          <b className="text-cyan-300"> Upload a new field survey</b>.
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
