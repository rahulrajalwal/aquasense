// 1D VES forward modelling — EH 611 Lecture 9.
// Ported from geosim/src/physics/resistivity.ts (validated there against
// exact image-series solutions; Schlumberger rel. error ~1e-12).
//
//   1. Stefanescu recursion for the layered-earth kernel T(λ)
//   2. Hankel transform via the Werthmüller-Key-Slob (2018) 201-pt filter
//
//   Schlumberger:  ρa(s) = s² ∫ T(λ) J₁(λs) λ dλ        (s = AB/2)

import { HANKEL_BASE, HANKEL_J1 } from '../data/hankel'

export interface ResLayer {
  resistivity: number // ohm-m
  thickness: number // m; last layer is the half-space (thickness ignored)
}

/** Stefanescu kernel T(λ) for the layer stack (last layer = half-space). */
function kernelT(lam: number, layers: ResLayer[]): number {
  let T = layers[layers.length - 1].resistivity
  for (let i = layers.length - 2; i >= 0; i--) {
    const rho = layers[i].resistivity
    const th = Math.tanh(lam * layers[i].thickness)
    T = (T + rho * th) / (1 + (T * th) / rho)
  }
  return T
}

/** ideal Schlumberger apparent resistivity at AB/2 = s (m) */
export function schlumbergerRhoA(layers: ResLayer[], s: number): number {
  let sum = 0
  for (let i = 0; i < HANKEL_BASE.length; i++) {
    const lam = HANKEL_BASE[i] / s
    sum += kernelT(lam, layers) * lam * HANKEL_J1[i]
  }
  return s * sum
}

export interface SoundingPoint {
  s: number // AB/2, m
  rhoA: number // ohm-m
}

export function soundingCurve(
  layers: ResLayer[],
  sMin = 1,
  sMax = 300,
  n = 60,
): SoundingPoint[] {
  const out: SoundingPoint[] = []
  const logMin = Math.log10(sMin)
  const logMax = Math.log10(sMax)
  for (let i = 0; i <= n; i++) {
    const s = Math.pow(10, logMin + ((logMax - logMin) * i) / n)
    out.push({ s, rhoA: schlumbergerRhoA(layers, s) })
  }
  return out
}

/**
 * Classic 3-layer sounding-curve types (Lecture 9 master curves):
 *   H: ρ1 > ρ2 < ρ3 (conductive middle — e.g. aquifer under dry cover)
 *   A: ρ1 < ρ2 < ρ3 (rising) · K: ρ1 < ρ2 > ρ3 (resistive middle)
 *   Q: ρ1 > ρ2 > ρ3 (descending)
 */
export function curveType(layers: ResLayer[]): string | null {
  if (layers.length !== 3) return null
  const [r1, r2, r3] = layers.map((l) => l.resistivity)
  if (r1 > r2 && r2 < r3) return 'H — conductive middle layer'
  if (r1 < r2 && r2 < r3) return 'A — resistivity rising with depth'
  if (r1 < r2 && r2 > r3) return 'K — resistive middle layer'
  if (r1 > r2 && r2 > r3) return 'Q — resistivity falling with depth'
  return null
}
