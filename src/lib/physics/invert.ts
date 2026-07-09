// 1D VES inversion: fit a layered-earth model to observed Schlumberger
// apparent resistivities. Multi-seed coordinate descent in log-parameter
// space, minimising RMS log-residual — small, dependency-free, and fast
// enough to run synchronously in the browser (a few hundred ms).

import { schlumbergerRhoA, type ResLayer } from './ves'
import type { VESReading } from '../types'
import type { Site } from '../types'

export interface FitResult {
  layers: ResLayer[]
  rmsLog: number // RMS of ln(model/observed)
  nLayers: number
}

const RHO_MIN = 1
const RHO_MAX = 5000
const TH_MIN = 0.5
const TH_MAX = 120

function misfit(layers: ResLayer[], obs: VESReading[]): number {
  let ss = 0
  for (const p of obs) {
    const m = schlumbergerRhoA(layers, p.s)
    if (!(m > 0)) return Infinity
    const r = Math.log(m / p.rhoA)
    ss += r * r
  }
  return Math.sqrt(ss / obs.length)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Coordinate descent with shrinking multiplicative steps. */
function refine(seed: ResLayer[], obs: VESReading[]): FitResult {
  const layers = seed.map((l) => ({ ...l }))
  let best = misfit(layers, obs)
  let step = 1.6
  while (step > 1.012) {
    let improved = false
    for (let i = 0; i < layers.length; i++) {
      // resistivity of every layer, thickness of all but the half-space
      const fields: ('resistivity' | 'thickness')[] =
        i < layers.length - 1 ? ['resistivity', 'thickness'] : ['resistivity']
      for (const f of fields) {
        const orig = layers[i][f]
        const [lo, hi] = f === 'resistivity' ? [RHO_MIN, RHO_MAX] : [TH_MIN, TH_MAX]
        for (const cand of [clamp(orig * step, lo, hi), clamp(orig / step, lo, hi)]) {
          layers[i][f] = cand
          const m = misfit(layers, obs)
          if (m < best - 1e-9) {
            best = m
            improved = true
          } else {
            layers[i][f] = orig
          }
        }
      }
    }
    if (!improved) step = Math.pow(step, 0.6)
  }
  return { layers, rmsLog: best, nLayers: layers.length }
}

/** Site-informed seed: mid-points of the site's typical column. */
function siteSeeds(site: Site): ResLayer[][] {
  const mid = (r: [number, number]) => Math.sqrt(r[0] * r[1]) // geometric mid
  const full = site.layers.map((l) => ({
    resistivity: mid(l.rhoRange),
    thickness: mid(l.thickRange),
  }))
  const seeds: ResLayer[][] = [full]
  if (full.length > 3) {
    // 3-layer collapse: cover / main aquifer zone / basement
    seeds.push([full[0], full[1], full[full.length - 1]])
  }
  return seeds
}

/** Generic seeds covering the classic H / A / K / Q curve families. */
const GENERIC_SEEDS: ResLayer[][] = [
  [
    { resistivity: 60, thickness: 2 },
    { resistivity: 15, thickness: 10 },
    { resistivity: 400, thickness: 0 },
  ],
  [
    { resistivity: 10, thickness: 2 },
    { resistivity: 60, thickness: 10 },
    { resistivity: 500, thickness: 0 },
  ],
  [
    { resistivity: 25, thickness: 3 },
    { resistivity: 120, thickness: 12 },
    { resistivity: 30, thickness: 0 },
  ],
  [
    { resistivity: 300, thickness: 2 },
    { resistivity: 60, thickness: 8 },
    { resistivity: 12, thickness: 0 },
  ],
  [
    { resistivity: 25, thickness: 2 },
    { resistivity: 30, thickness: 8 },
    { resistivity: 80, thickness: 15 },
    { resistivity: 600, thickness: 0 },
  ],
  // Deccan-trap H-type: dry cover over a saturated weathered aquifer over
  // massive basalt (the most common hard-rock sounding shape).
  [
    { resistivity: 55, thickness: 4 },
    { resistivity: 24, thickness: 16 },
    { resistivity: 500, thickness: 0 },
  ],
  [
    { resistivity: 45, thickness: 7 },
    { resistivity: 20, thickness: 26 },
    { resistivity: 450, thickness: 0 },
  ],
  // Deccan HA / two-aquifer: cover, weathered (Aq-I), fractured (Aq-II), fresh.
  [
    { resistivity: 60, thickness: 3 },
    { resistivity: 26, thickness: 12 },
    { resistivity: 85, thickness: 30 },
    { resistivity: 700, thickness: 0 },
  ],
]

/**
 * Fit the readings. Tries site-informed and generic seeds; picks the best
 * fit, lightly penalising extra layers (AIC-style) so a 4-layer model must
 * earn its keep.
 */
export function invertVES(obs: VESReading[], site: Site | null): FitResult {
  const seeds = [...(site ? siteSeeds(site) : []), ...GENERIC_SEEDS]
  let best: FitResult | null = null
  for (const seed of seeds) {
    if (seed.length >= obs.length) continue // don't overparameterise
    const fit = refine(seed, obs)
    const k = fit.nLayers * 2 - 1
    const score = obs.length * Math.log(fit.rmsLog * fit.rmsLog + 1e-12) + 2 * k
    const bestScore = best
      ? obs.length * Math.log(best.rmsLog * best.rmsLog + 1e-12) + 2 * (best.nLayers * 2 - 1)
      : Infinity
    if (!best || score < bestScore) best = fit
  }
  if (!best) throw new Error('Not enough readings to fit a model')
  return best
}

/** Depth to the top of layer i in a fitted stack. */
export function depthToTop(layers: ResLayer[], i: number): number {
  let d = 0
  for (let j = 0; j < i; j++) d += layers[j].thickness
  return d
}
