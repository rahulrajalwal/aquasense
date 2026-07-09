'use client'

// Interactive geological cross-section rendered from a VES interpretation.
// Depth-scaled coloured layers with rock-specific textures (topsoil stipple,
// weathered dashes, fractured cracks, massive/fresh brick), the water table,
// aquifer tags, resistivity labels, a depth scale and a legend — the visual
// payoff of the resistivity interpretation.

import type { InterpretedLayer, RockType } from '@/lib/physics/interpret'

const TEX: Record<RockType, string> = {
  topsoil: 'url(#tex-topsoil)',
  'weathered-basalt': 'url(#tex-weathered)',
  'fractured-basalt': 'url(#tex-fractured)',
  'fresh-basalt': 'url(#tex-fresh)',
}

const LEGEND: { label: string; color: string; tex: RockType }[] = [
  { label: 'Top soil', color: '#c79a4b', tex: 'topsoil' },
  { label: 'Weathered basalt (Aq-I)', color: '#22d3ee', tex: 'weathered-basalt' },
  { label: 'Massive basalt', color: '#8595a8', tex: 'fresh-basalt' },
  { label: 'Fractured basalt (Aq-II)', color: '#3b82f6', tex: 'fractured-basalt' },
  { label: 'Fresh basalt', color: '#64748b', tex: 'fresh-basalt' },
]

export default function CrossSection({
  layers,
  waterTableM,
  maxDepthM,
  height = 380,
}: {
  layers: InterpretedLayer[]
  waterTableM: number | null
  maxDepthM: number
  height?: number
}) {
  const W = 440
  const H = height
  const padTop = 16
  const padBottom = 16
  const axisW = 34
  const colX = axisW + 6
  const colW = 150
  const labelX = colX + colW + 12

  const lastFinite = [...layers].reverse().find((l) => l.bottomM !== null)?.bottomM ?? maxDepthM
  const depthMax = Math.max(maxDepthM, (lastFinite ?? 30) * 1.12, 20)
  const plotH = H - padTop - padBottom
  const yOf = (d: number) => padTop + (Math.min(d, depthMax) / depthMax) * plotH

  const tickStep = depthMax > 120 ? 40 : depthMax > 60 ? 20 : depthMax > 30 ? 10 : 5
  const ticks: number[] = []
  for (let d = 0; d <= depthMax; d += tickStep) ticks.push(d)

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H + 10 }} role="img" aria-label="Geological cross-section from VES">
        <defs>
          <pattern id="tex-topsoil" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.8" fill="#00000038" />
            <circle cx="4.3" cy="4" r="0.7" fill="#00000030" />
          </pattern>
          <pattern id="tex-weathered" width="8" height="5" patternUnits="userSpaceOnUse">
            <path d="M0 2.5 h4" stroke="#00000035" strokeWidth="0.7" />
          </pattern>
          <pattern id="tex-fractured" width="9" height="9" patternUnits="userSpaceOnUse">
            <path d="M0 9 L9 0 M-2 2 L2 -2 M7 11 L11 7" stroke="#00000045" strokeWidth="0.7" />
          </pattern>
          <pattern id="tex-fresh" width="12" height="7" patternUnits="userSpaceOnUse">
            <path d="M0 0 h12 M0 3.5 h12 M0 0 v3.5 M6 3.5 v3.5 M12 0 v3.5" stroke="#ffffff1f" strokeWidth="0.6" fill="none" />
          </pattern>
        </defs>

        {/* depth axis */}
        <line x1={axisW} y1={padTop} x2={axisW} y2={H - padBottom} stroke="#2b4468" strokeWidth={1} />
        {ticks.map((d) => (
          <g key={d}>
            <line x1={axisW - 4} y1={yOf(d)} x2={axisW} y2={yOf(d)} stroke="#2b4468" strokeWidth={1} />
            <text x={axisW - 6} y={yOf(d) + 3} textAnchor="end" fontSize={9} fill="#8fa8c7" fontFamily="monospace">
              {d}
            </text>
          </g>
        ))}
        <text x={12} y={H - 2} fontSize={8.5} fill="#5b6674">
          m bgl
        </text>

        {/* layers */}
        {layers.map((l, i) => {
          const top = yOf(l.topM)
          const bottom = l.bottomM === null ? H - padBottom : yOf(l.bottomM)
          const h = Math.max(bottom - top, 6)
          const mid = top + h / 2
          const wtInBand =
            waterTableM !== null &&
            waterTableM >= l.topM &&
            (l.bottomM === null ? true : waterTableM <= l.bottomM) &&
            Math.abs(yOf(waterTableM) - mid) < 12
          return (
            <g key={i} className="cs-layer" style={{ animationDelay: `${i * 0.09}s` }}>
              <rect x={colX} y={top} width={colW} height={h} fill={l.color} fillOpacity={l.isAquifer ? 0.9 : 0.82} stroke="#0a1830" strokeWidth={1} />
              <rect x={colX} y={top} width={colW} height={h} fill={TEX[l.rock]} stroke="none" />
              {h > 16 && !wtInBand && (
                <text x={colX + colW / 2} y={mid + 3} textAnchor="middle" fontSize={9.5} fontFamily="monospace" fill={l.rock === 'fresh-basalt' ? '#e2ecf7' : '#06132a'} fontWeight={700}>
                  {l.resistivity.toFixed(0)} Ω·m
                </text>
              )}
              <line x1={colX + colW} y1={mid} x2={labelX - 4} y2={mid} stroke="#3a4d6b" strokeWidth={0.75} />
              <text x={labelX} y={mid - 2} fontSize={10} fill="#dbe7f5" fontWeight={l.isAquifer ? 700 : 500}>
                {l.rockLabel}
                {l.isAquifer && ' 💧'}
              </text>
              <text x={labelX} y={mid + 11} fontSize={8.5} fill="#8fa8c7" fontFamily="monospace">
                {l.topM}{l.bottomM === null ? ' m →' : `–${l.bottomM} m`}
                {l.thicknessM !== null ? `  (${l.thicknessM} m)` : ''}
              </text>
            </g>
          )
        })}

        {/* water table */}
        {waterTableM !== null && waterTableM > 0 && waterTableM < depthMax && (
          <g>
            <line x1={colX - 3} y1={yOf(waterTableM)} x2={colX + colW + 3} y2={yOf(waterTableM)} stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="5 3" />
            <polygon
              points={`${colX + colW / 2 - 4},${yOf(waterTableM) - 8} ${colX + colW / 2 + 4},${yOf(waterTableM) - 8} ${colX + colW / 2},${yOf(waterTableM) - 2}`}
              fill="#38bdf8"
            />
            <rect x={colX + colW / 2 - 52} y={yOf(waterTableM) - 21} width={104} height={12} rx={3} fill="#04101f" fillOpacity={0.82} />
            <text x={colX + colW / 2} y={yOf(waterTableM) - 12} textAnchor="middle" fontSize={8.5} fill="#67e8f9">
              water table ≈ {waterTableM} m
            </text>
          </g>
        )}
      </svg>

      {/* legend */}
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 px-1 text-[10px] text-slate-400">
        {LEGEND.map((x) => (
          <span key={x.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: x.color }} />
            {x.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3.5 border-b-2 border-dashed border-sky-400" /> water table
        </span>
      </div>
    </div>
  )
}
