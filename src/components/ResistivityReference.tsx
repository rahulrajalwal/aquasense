'use client'

// Collapsible standard-resistivity reference table. Rows matching the rock
// types present in the current interpretation are highlighted, so the
// number → material mapping is transparent rather than a black box.

import { useState } from 'react'
import { RESISTIVITY_BANDS, rangeLabel, ROCK, type RockType } from '@/lib/physics/geoelectrics'
import { Badge } from '@/components/ui'

export default function ResistivityReference({
  active = [],
  defaultOpen = false,
}: {
  active?: RockType[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const activeSet = new Set(active)

  return (
    <div className="glass overflow-hidden">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/5"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-cyan-300">📊</span>
          <span className="text-sm font-semibold text-white">Standard resistivity reference</span>
          {active.length > 0 && <Badge tone="cyan">layers in this survey highlighted</Badge>}
        </span>
        <span className={`text-cyan-400 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>

      {open && (
        <div className="border-t border-white/10">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr className="border-b border-white/10">
                <th className="px-4 py-2">Material</th>
                <th className="px-3 py-2">Typical resistivity</th>
                <th className="hidden px-3 py-2 sm:table-cell">Hydrogeological note</th>
              </tr>
            </thead>
            <tbody>
              {RESISTIVITY_BANDS.map((b) => {
                const hot = b.rock !== undefined && activeSet.has(b.rock)
                return (
                  <tr
                    key={b.material}
                    className={`border-b border-white/5 last:border-0 ${hot ? 'bg-cyan-400/10' : ''}`}
                  >
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-2">
                        {b.rock && (
                          <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: ROCK[b.rock].color }} />
                        )}
                        <span className={hot ? 'font-semibold text-cyan-100' : 'text-slate-200'}>{b.material}</span>
                        {hot && <span className="text-cyan-400">◄</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-cyan-200">{rangeLabel(b)}</td>
                    <td className="hidden px-3 py-2 text-xs text-slate-400 sm:table-cell">{b.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="px-4 py-2.5 text-[11px] leading-relaxed text-slate-500">
            Note the overlap between dry top soil and saturated weathered basalt (both ≈20–80 Ω·m). Resistivity alone is
            ambiguous — the interpretation also uses each layer&apos;s <b className="text-slate-300">depth and position</b> in
            the sequence, which is why the reasoning is shown for every layer.
          </p>
        </div>
      )}
    </div>
  )
}
