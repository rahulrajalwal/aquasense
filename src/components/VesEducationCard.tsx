'use client'

// Educational card that connects the VES survey to Near-Surface Geophysics
// theory. Collapsible so it never gets in the way of the workflow.

import { useState } from 'react'
import { Badge } from '@/components/ui'

const QA: { q: string; a: string }[] = [
  {
    q: 'What is an Electrical Resistivity Survey?',
    a: 'A geophysical method that sends a controlled electric current into the ground through a pair of electrodes and measures the resulting voltage across another pair. Different earth materials resist the current by different amounts — clay and water conduct easily (low resistivity), while dry or massive rock resists strongly (high resistivity) — so the measured pattern reveals the layering underground without any drilling.',
  },
  {
    q: 'What is Vertical Electrical Sounding (VES)?',
    a: 'A one-dimensional resistivity survey. Keeping the centre point fixed, the current electrodes are moved progressively farther apart (the spacing AB/2 is increased step by step). Each widening lets the current probe deeper, so a VES builds a resistivity-versus-depth profile at a single location — ideal for finding how deep the aquifer lies.',
  },
  {
    q: 'Why is apparent resistivity (ρₐ) measured?',
    a: 'ρₐ is the raw field quantity — the resistivity the ground appears to have at a given electrode spacing. It is a weighted blend of every layer the current passes through, not the true resistivity of any single layer. Plotting ρₐ against AB/2 gives the sounding curve, which is then inverted to recover the true layer resistivities and thicknesses.',
  },
  {
    q: 'Why does a larger AB/2 investigate deeper layers?',
    a: 'The depth to which the injected current spreads is roughly proportional to the electrode separation. Small spacings concentrate current near the surface and sense shallow layers; widening the electrodes forces current deeper, so each larger AB/2 reading samples progressively deeper rock. This is why the sounding is read from left (shallow) to right (deep).',
  },
  {
    q: 'How is groundwater identified from resistivity?',
    a: 'Groundwater sits in the connected pores and fractures of saturated rock, and water (with its dissolved salts) conducts electricity — so a water-bearing zone shows up as a drop in resistivity. In Deccan basalt the tell-tale signature is a low-resistivity band (≈20–50 Ω·m weathered, ≈50–150 Ω·m fractured) sandwiched between resistive dry cover above and massive, unfractured basalt below.',
  },
]

export default function VesEducationCard({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [item, setItem] = useState(0)

  return (
    <div className="glass overflow-hidden">
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/5"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-cyan-300">📘</span>
          <span className="text-sm font-semibold text-white">Understand the VES survey</span>
          <Badge tone="cyan">Near-Surface Geophysics</Badge>
        </span>
        <span className={`text-cyan-400 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>

      {open && (
        <div className="grid gap-0 border-t border-white/10 md:grid-cols-[260px_1fr]">
          <div className="border-b border-white/10 md:border-b-0 md:border-r">
            {QA.map((x, i) => (
              <button
                key={x.q}
                onClick={() => setItem(i)}
                className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                  item === i ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-300'
                }`}
              >
                {x.q}
              </button>
            ))}
          </div>
          <div className="p-4">
            <h4 className="text-sm font-semibold text-white">{QA[item].q}</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{QA[item].a}</p>
          </div>
        </div>
      )}
    </div>
  )
}
