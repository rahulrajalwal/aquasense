// ─────────────────────────────────────────────────────────────────────────
//  VES INTERPRETATION — the geophysical heart of AquaSense.
//
//  Turns a layered resistivity model (either inverted from a field sounding
//  or built from official CGWB interpreted depths) into a geological column:
//  topsoil, weathered basalt (Aquifer-I), fractured basalt (Aquifer-II) and
//  fresh massive basalt. From that column it derives the hydrogeological
//  parameters (Aquifer-I bottom, Aquifer-II depth and thickness, water table)
//  that the machine-learning model consumes — so the ML inputs always
//  originate from the resistivity survey, exactly as taught in Near-Surface
//  Geophysics.
// ─────────────────────────────────────────────────────────────────────────

import type { ResLayer } from './ves'
import { depthToTop } from './invert'
import type { VESReading } from '../types'
import {
  ROCK,
  classifyCurve,
  describeLayer,
  bandMatch,
  bandForRock,
  type RockType,
  type CurveTypeInfo,
  type ReasonStep,
} from './geoelectrics'

export type { RockType } from './geoelectrics'

export interface InterpretedLayer {
  index: number
  resistivity: number // Ω·m
  topM: number
  bottomM: number | null // null → half-space (unbounded at depth)
  thicknessM: number | null
  rock: RockType
  rockLabel: string
  role: 'cover' | 'aquifer-1' | 'aquifer-2' | 'basement'
  isAquifer: boolean
  saturated: boolean
  color: string // for the cross-section
  explanation: string
  reasoning: ReasonStep[] // measured ρ → table → material → hydro → class
  matchConfidence: number // 0–100: fit of measured ρ to the assigned band
}

/** Parameters handed to the ML model + rule engine, always VES-derived. */
export interface DerivedAquiferParams {
  aq1BottomM: number
  aq2BottomM: number
  aq2ThickM: number
  waterTableM: number
  primaryAquiferRho: number | null
}

export interface VesInterpretation {
  source: 'inverted' | 'official'
  layers: InterpretedLayer[]
  curveType: CurveTypeInfo | null
  maxDepthM: number
  rmsLogPct: number | null
  derived: DerivedAquiferParams
  quality: 'good' | 'fair' | 'limited'
  summary: string
  /** Honest, plain description of how this interpretation was produced. */
  methodology: string
  /** Field readings (inverted mode only) — for the sounding-curve chart. */
  readings?: VESReading[]
  /** Fitted layer model (inverted mode only) — for the sounding-curve chart. */
  fittedLayers?: ResLayer[]
}

const roleOf: Record<RockType, InterpretedLayer['role']> = {
  topsoil: 'cover',
  'weathered-basalt': 'aquifer-1',
  'fractured-basalt': 'aquifer-2',
  'fresh-basalt': 'basement',
}

/** Resistivity + position → Deccan-basalt rock type. */
function classify(rho: number, isFirst: boolean, isLast: boolean): RockType {
  if (isLast && rho >= 150) return 'fresh-basalt'
  if (rho >= 200) return 'fresh-basalt'
  if (isFirst && rho <= 90) return 'topsoil'
  if (rho <= 55) return 'weathered-basalt'
  if (rho <= 180) return 'fractured-basalt'
  return 'fresh-basalt'
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const r1 = (v: number) => Math.round(v * 10) / 10

/** Interpret an inverted layer model (Mode 2: user's field sounding). */
export function interpretLayers(layers: ResLayer[], rmsLog = 0, maxDepthM = 0): VesInterpretation {
  const n = layers.length
  const out: InterpretedLayer[] = []
  let firstAquiferTop: number | null = null

  for (let i = 0; i < n; i++) {
    const L = layers[i]
    const top = depthToTop(layers, i)
    const isLast = i === n - 1
    const bottom = isLast ? null : top + L.thickness
    const rock = classify(L.resistivity, i === 0, isLast)
    const isAquifer = rock === 'weathered-basalt' || rock === 'fractured-basalt'
    if (isAquifer && firstAquiferTop === null) firstAquiferTop = top
    const saturated = isAquifer
    const topR = r1(top)
    const bottomR = bottom === null ? null : r1(bottom)
    const desc = describeLayer(rock, L.resistivity, saturated, topR, bottomR)
    out.push({
      index: i,
      resistivity: L.resistivity,
      topM: topR,
      bottomM: bottomR,
      thicknessM: bottom === null ? null : r1(bottom - top),
      rock,
      rockLabel: ROCK[rock].label,
      role: roleOf[rock],
      isAquifer,
      saturated,
      color: ROCK[rock].color,
      explanation: desc.explanation,
      reasoning: desc.reasoning,
      matchConfidence: desc.matchConfidence,
    })
  }

  const maxD = maxDepthM || (out[n - 1]?.topM ?? 0) + 20

  // ── derive hydrogeological parameters from the column ──────────────
  const weathered = out.filter((l) => l.rock === 'weathered-basalt')
  const fractured = out.filter((l) => l.rock === 'fractured-basalt')

  const waterTableM = firstAquiferTop !== null ? r1(firstAquiferTop) : clamp(maxD * 0.15, 2, 20)

  // Aquifer-I bottom: base of the weathered zone (else base of the shallow cover)
  const aq1BottomM = weathered.length
    ? (weathered[weathered.length - 1].bottomM ?? weathered[weathered.length - 1].topM + 8)
    : out[0]?.bottomM ?? 15

  // Aquifer-II: the fractured interval
  let aq2BottomM: number, fracThick: number
  if (fractured.length) {
    const lastFrac = fractured[fractured.length - 1]
    aq2BottomM = lastFrac.bottomM ?? Math.min(maxD, lastFrac.topM + 25)
    fracThick = fractured.reduce((s, l) => s + (l.thicknessM ?? Math.min(maxD - l.topM, 20)), 0)
  } else {
    aq2BottomM = clamp(aq1BottomM + 40, 50, 175)
    fracThick = 0
  }

  // Map the VES fractured interval onto the CGWB "productive zone thickness"
  // scale (0.5–12 m): only part of a fractured interval actually yields water.
  const aq2ThickFeature = clamp(fracThick * 0.4, 0.5, 12)

  const primaryAquiferRho = fractured[0]?.resistivity ?? weathered[0]?.resistivity ?? null

  const rmsLogPct = Math.round(rmsLog * 1000) / 10
  const quality: VesInterpretation['quality'] =
    rmsLog <= 0.05 && maxD >= 40 ? 'good' : rmsLog <= 0.12 ? 'fair' : 'limited'

  const summary = fractured.length
    ? `The sounding resolves ${n} layers to ≈${maxD.toFixed(0)} m. A ${primaryAquiferRho?.toFixed(0)} Ω·m ${
        fractured.length ? 'fractured' : 'weathered'
      }-basalt aquifer is interpreted; water is expected to strike near ${waterTableM.toFixed(0)} m.`
    : `The sounding resolves ${n} layers to ≈${maxD.toFixed(0)} m, showing weathered cover over resistive basalt with no clear deep fracture zone within the surveyed depth.`

  return {
    source: 'inverted',
    layers: out,
    curveType: classifyCurve(out.map((l) => l.resistivity)),
    maxDepthM: Math.round(maxD),
    rmsLogPct,
    derived: {
      aq1BottomM: Math.round(aq1BottomM),
      aq2BottomM: Math.round(aq2BottomM),
      aq2ThickM: r1(aq2ThickFeature),
      waterTableM,
      primaryAquiferRho,
    },
    quality,
    summary,
    methodology:
      `Simplified 1-D least-squares inversion: a multi-seed coordinate-descent fit of a layered-earth model to your ` +
      `apparent-resistivity curve using the Schlumberger forward solution (Stefanescu recursion + Hankel transform), ` +
      `converging at ${rmsLogPct}% RMS misfit. Layer lithology is then assigned by rule-based classification calibrated ` +
      `to CGWB/NAQUIM resistivity ranges — not commercial-grade inversion software.`,
    fittedLayers: layers.map((l) => ({ resistivity: l.resistivity, thickness: l.thickness })),
  }
}

/**
 * Build an interpretation from OFFICIAL CGWB interpreted depths (Mode 1).
 * CGWB publishes interpreted aquifer depths, not raw sounding curves, so
 * this constructs the geological column directly from those official values
 * (no synthetic apparent-resistivity curve). Representative resistivities are
 * taken from the standard Deccan-trap ranges purely to render the section and
 * name the characteristic curve type.
 */
export function officialInterpretation(p: {
  aq1BottomM: number
  aq2BottomM: number
  aq2ThickM: number
  preSwlM: number
}): VesInterpretation {
  const wt = clamp(p.preSwlM, 1, p.aq1BottomM - 0.5)
  const topsoilBottom = clamp(Math.min(3, p.aq1BottomM * 0.25), 1, 4)
  const aq2Top = clamp(p.aq2BottomM - Math.max(p.aq2ThickM, 3), p.aq1BottomM + 2, p.aq2BottomM - 1)

  // Representative Deccan resistivities: dry cover (resistive) over the
  // saturated weathered aquifer (low), a competent massive band (high), the
  // fractured aquifer (moderate) and the fresh basement (very high). This
  // sequence reads as the classic H-K-H two-aquifer curve.
  const RHO = { topsoil: 55, weathered: 26, massive: 300, fractured: 70, fresh: 750 }

  const mk = (
    index: number,
    rock: RockType,
    rho: number,
    topM: number,
    bottomM: number | null,
    label: string,
    role: InterpretedLayer['role'],
    isAquifer: boolean,
    saturated: boolean,
    color: string,
    desc: { explanation: string; reasoning: ReasonStep[]; matchConfidence: number },
  ): InterpretedLayer => ({
    index,
    resistivity: rho,
    topM: r1(topM),
    bottomM: bottomM === null ? null : r1(bottomM),
    thicknessM: bottomM === null ? null : r1(bottomM - topM),
    rock,
    rockLabel: label,
    role,
    isAquifer,
    saturated,
    color,
    explanation: desc.explanation,
    reasoning: desc.reasoning,
    matchConfidence: desc.matchConfidence,
  })

  const massiveDesc = {
    explanation:
      'Denser, less-fractured basalt separating the shallow weathered aquifer from the deeper fracture zone. Its high resistivity marks competent rock with little storage.',
    reasoning: [
      { step: 'Measured resistivity', text: `≈${RHO.massive} Ω·m, ${r1(p.aq1BottomM)}–${r1(aq2Top)} m depth.` },
      { step: 'Compare with standard table', text: 'Approaches the fresh / massive basalt range (300+ Ω·m).' },
      { step: 'Possible geological material', text: 'Competent basalt flow interior between two weathered / fractured horizons.' },
      { step: 'Hydrogeological interpretation', text: 'Low storage — acts as a partial barrier (aquitard) between Aquifer-I and Aquifer-II.' },
      { step: 'Final layer classification', text: 'Massive basalt (between aquifers).' },
    ] as ReasonStep[],
    matchConfidence: bandMatch(RHO.massive, bandForRock('fresh-basalt')),
  }

  const layers: InterpretedLayer[] = [
    mk(0, 'topsoil', RHO.topsoil, 0, topsoilBottom, ROCK.topsoil.label, 'cover', false, false, ROCK.topsoil.color,
      describeLayer('topsoil', RHO.topsoil, false, 0, r1(topsoilBottom))),
    mk(1, 'weathered-basalt', RHO.weathered, topsoilBottom, p.aq1BottomM, ROCK['weathered-basalt'].label, 'aquifer-1', true, true, ROCK['weathered-basalt'].color,
      describeLayer('weathered-basalt', RHO.weathered, true, r1(topsoilBottom), p.aq1BottomM)),
    mk(2, 'fresh-basalt', RHO.massive, p.aq1BottomM, aq2Top, 'Massive basalt (between aquifers)', 'basement', false, false, '#8595a8', massiveDesc),
    mk(3, 'fractured-basalt', RHO.fractured, aq2Top, p.aq2BottomM, ROCK['fractured-basalt'].label, 'aquifer-2', true, true, ROCK['fractured-basalt'].color,
      describeLayer('fractured-basalt', RHO.fractured, true, r1(aq2Top), p.aq2BottomM)),
    mk(4, 'fresh-basalt', RHO.fresh, p.aq2BottomM, null, ROCK['fresh-basalt'].label, 'basement', false, false, ROCK['fresh-basalt'].color,
      describeLayer('fresh-basalt', RHO.fresh, false, p.aq2BottomM, null)),
  ]

  return {
    source: 'official',
    layers,
    curveType: classifyCurve(layers.map((l) => l.resistivity)),
    maxDepthM: Math.round(p.aq2BottomM + 15),
    rmsLogPct: null,
    derived: {
      aq1BottomM: p.aq1BottomM,
      aq2BottomM: p.aq2BottomM,
      aq2ThickM: p.aq2ThickM,
      waterTableM: r1(wt),
      primaryAquiferRho: RHO.fractured,
    },
    quality: 'good',
    summary:
      `Official CGWB interpreted layers for this location: a weathered Aquifer-I to ~${p.aq1BottomM} m over a ` +
      `fractured Aquifer-II near ~${p.aq2BottomM} m (≈${p.aq2ThickM} m productive zone). These interpreted depths ` +
      `come directly from the CGWB survey; raw sounding curves are not published, so no apparent-resistivity curve is shown.`,
    methodology:
      `No inversion is performed for this location — CGWB/NAQUIM publish interpreted aquifer depths, not raw sounding ` +
      `curves, so the geological column is built directly from those official interpreted depths using the standard ` +
      `Deccan-trap resistivity model. Upload a field sounding to run the live 1-D inversion instead.`,
  }
}
