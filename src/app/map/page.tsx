'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { PageHeader, Badge } from '@/components/ui'
import { CGWB_WELLS, locatedWells, wellOutcome } from '@/lib/data/real/wells'
import { TALUKAS_REAL, TALUKA_NAME_TO_ID } from '@/lib/data/real/talukas'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="skeleton h-full min-h-[520px] w-full" />,
})

export default function MapPage() {
  const [query, setQuery] = useState('')
  const [selectedSno, setSelectedSno] = useState<number | null>(null)

  const wells = useMemo(() => locatedWells(), [])
  const filtered = wells.filter(
    (w) =>
      w.village.toLowerCase().includes(query.trim().toLowerCase()) ||
      w.taluka.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const selected = CGWB_WELLS.find((w) => w.sno === selectedSno) ?? null
  const unlocated = CGWB_WELLS.length - wells.length

  return (
    <div>
      <PageHeader
        kicker="Interactive map"
        title="CGWB Wells Map — Pune District"
        sub={`All ${CGWB_WELLS.length} documented CGWB exploration & observation wells (NAQUIM Annexure-I). Marker color shows the pump-test outcome: green ≥1 lps, red poor/dry, grey untested. Click anywhere to assess that exact spot.`}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-4 grid gap-4 lg:grid-cols-[330px_1fr]">
          {/* sidebar (below the map on phones, beside it on desktop) */}
          <div className="glass order-2 flex max-h-[420px] flex-col overflow-hidden lg:order-1 lg:max-h-[640px]">
            <div className="border-b border-white/10 p-4">
              <input
                className="field"
                placeholder="Search village or taluka…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#34d399' }} /> yield ≥1 lps
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#fb7185' }} /> poor / dry
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#94a3b8' }} /> not pump-tested
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {TALUKAS_REAL.map((t) => {
                const tw = filtered.filter((w) => TALUKA_NAME_TO_ID[w.taluka] === t.id)
                if (tw.length === 0) return null
                return (
                  <div key={t.id}>
                    <div className="bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {t.name} · {tw.length} wells
                    </div>
                    {tw.map((w) => (
                      <button
                        key={w.sno}
                        onClick={() => setSelectedSno(w.sno)}
                        className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition hover:bg-white/5 ${
                          selectedSno === w.sno ? 'bg-cyan-400/10' : ''
                        }`}
                      >
                        <span className="truncate text-slate-200">
                          {w.village} <span className="text-xs text-slate-500">({w.type})</span>
                        </span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold text-slate-900"
                          style={{
                            background: w.yieldLps === null ? '#94a3b8' : wellOutcome(w) === 1 ? '#34d399' : '#fb7185',
                          }}
                        >
                          {w.yieldLps === null ? 'n/t' : w.yieldRaw.slice(0, 6)}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">No well matches “{query}”.</div>
              )}
            </div>

            {selected && (
              <div className="border-t border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{selected.village}</div>
                  <Badge tone="cyan">CGWB {selected.type}</Badge>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                  <dt>Taluka</dt>
                  <dd className="text-slate-300">{selected.taluka}</dd>
                  <dt>Drilled depth</dt>
                  <dd className="font-mono text-slate-300">{selected.depthM ?? '—'} m</dd>
                  <dt>Water level (pre)</dt>
                  <dd className="font-mono text-slate-300">{selected.preSwlM ?? '—'} m bgl</dd>
                  <dt>Yield</dt>
                  <dd className="font-mono text-slate-300">{selected.yieldRaw}</dd>
                  <dt>Aquifer-I / II</dt>
                  <dd className="font-mono text-slate-300">
                    {selected.aq1BottomM ?? '—'} / {selected.aq2BottomM ?? '—'} m
                  </dd>
                </dl>
                <Link
                  href={`/analyze?taluka=${TALUKA_NAME_TO_ID[selected.taluka] ?? ''}&place=${encodeURIComponent(selected.village)}${
                    selected.lat !== null ? `&lat=${selected.lat}&lon=${selected.lon}` : ''
                  }`}
                  className="btn-primary mt-3 w-full !py-2 text-xs"
                >
                  Analyze near this well
                </Link>
              </div>
            )}
          </div>

          {/* map */}
          <div className="glass order-1 h-[62vh] min-h-[380px] overflow-hidden p-1.5 lg:order-2 lg:h-[640px]">
            <MapView selectedSno={selectedSno} onSelect={setSelectedSno} />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Well data: CGWB NAQUIM Aquifer Mapping report, Pune district (Annexure-I). Basemap © OpenStreetMap
          contributors / CARTO. {unlocated} wells without published coordinates are omitted from the map but included
          in the analysis dataset. The dashed outline is the data extent, not an administrative boundary.
        </p>
      </div>
    </div>
  )
}
