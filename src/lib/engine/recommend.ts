// The consultant brain: combine the fitted layer model, the site
// signature, and the user's parameters into a groundwater assessment.
//
// Phase 1 is deliberately physics + transparent rules (no ML): every
// number in the output can be traced to a stated reason. A statistical
// layer calibrated on real site data is planned for Phase 2.

import type { ResLayer } from '../physics/ves'
import { curveType } from '../physics/ves'
import { depthToTop, type FitResult } from '../physics/invert'
import type { Site, UserParams, VESReading } from '../types'
import type { MatchResult } from './matcher'

export interface AquiferCall {
  layerIndex: number
  topM: number
  bottomM: number
  rho: number
  label: string
}

export interface Assessment {
  probability: number // 0-95 %
  verdict: 'drill' | 'caution' | 'no-drill'
  verdictText: string
  aquifer: AquiferCall | null
  waterStrikeM: number | null
  recommendedDepthM: [number, number] | null
  confidence: 'High' | 'Moderate' | 'Low'
  confidencePct: number
  curveTypeText: string | null
  resolvedDepthM: number
  reasons: string[]
  warnings: string[]
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Aquifer windows for this site (from its layer roles), padded ±30 %. */
function aquiferWindows(site: Site): [number, number][] {
  return site.layers
    .filter((l) => l.role === 'aquifer')
    .map((l) => [l.rhoRange[0] * 0.7, l.rhoRange[1] * 1.3] as [number, number])
}

function classifyAquifer(fit: FitResult, site: Site): AquiferCall | null {
  const windows = aquiferWindows(site)
  let best: AquiferCall | null = null
  for (let i = 0; i < fit.layers.length; i++) {
    const L = fit.layers[i]
    const top = depthToTop(fit.layers, i)
    const isLast = i === fit.layers.length - 1
    if (top < 1 && i === 0) continue // surface soil is not the aquifer
    const inWindow = windows.some(([lo, hi]) => L.resistivity >= lo && L.resistivity <= hi)
    if (!inWindow || isLast) continue
    const bottom = top + L.thickness
    // prefer the thickest saturated zone; shallower wins ties
    if (!best || L.thickness > bottom - top - 1e-9 || L.thickness > (best.bottomM - best.topM)) {
      if (!best || L.thickness > best.bottomM - best.topM) {
        best = {
          layerIndex: i,
          topM: top,
          bottomM: bottom,
          rho: L.resistivity,
          label: `${L.resistivity.toFixed(0)} Ω·m zone`,
        }
      }
    }
  }
  return best
}

/** Gaussian closeness of ρ to the centre of the nearest aquifer window (log space). */
function rhoCentering(rho: number, site: Site): number {
  let best = 0
  for (const l of site.layers.filter((x) => x.role === 'aquifer')) {
    const c = Math.sqrt(l.rhoRange[0] * l.rhoRange[1])
    const spread = Math.log(l.rhoRange[1] / l.rhoRange[0]) / 2 || 0.5
    const z = Math.log(rho / c) / spread
    best = Math.max(best, Math.exp(-0.5 * z * z))
  }
  return best // 0..1
}

export function assess(
  site: Site,
  params: UserParams,
  match: MatchResult,
  readings: VESReading[],
  fit: FitResult,
): Assessment {
  const reasons: string[] = []
  const warnings: string[] = []

  // Depth of investigation — Lecture 9: half the current flows above
  // z = L/2 (L = AB), so AB/2 ≈ max usable depth; be conservative at 0.6×.
  const maxS = Math.max(...readings.map((r) => r.s))
  const resolvedDepthM = Math.round(maxS * 0.6)

  const aquifer = classifyAquifer(fit, site)

  // ── probability ────────────────────────────────────────────────────
  let prob = 20
  if (aquifer) {
    prob += 30
    reasons.push(
      `A layer with ρ ≈ ${aquifer.rho.toFixed(0)} Ω·m between ${aquifer.topM.toFixed(1)} m and ${aquifer.bottomM.toFixed(1)} m matches this site's saturated-zone signature.`,
    )
    const thick = aquifer.bottomM - aquifer.topM
    const thickBonus = clamp(((thick - 3) / 7) * 10, 0, 10)
    prob += thickBonus
    if (thick >= 8) reasons.push(`Saturated zone is thick (~${thick.toFixed(0)} m) — good storage.`)
    else if (thick < 4)
      warnings.push(`Saturated zone is thin (~${thick.toFixed(1)} m) — yield may be seasonal.`)
    prob += rhoCentering(aquifer.rho, site) * 10
  } else {
    prob -= 10
    warnings.push(
      'No layer in the fitted model falls in this site’s aquifer resistivity window — the sounding does not show a clear saturated zone.',
    )
  }

  // site-match contribution (can subtract)
  prob += ((match.overall - 50) / 50) * 15
  if (match.level === 'good') reasons.push(`Field parameters match the site signature (${match.overall}%).`)
  if (match.level === 'poor')
    warnings.push(
      `Field parameters match poorly (${match.overall}%) — the calibration may not apply to this exact location.`,
    )

  // rainfall recharge factor
  if (params.rainfallMm !== '') {
    const v = Number(params.rainfallMm)
    const [lo, hi] = site.rainfallMm
    const t = clamp((v - lo) / (hi - lo), 0, 1)
    prob += t * 8
    if (t > 0.6) reasons.push(`Rainfall (${v} mm/yr) is on the higher side for this terrain — better recharge.`)
    if (t < 0.2 && v < lo) warnings.push(`Low rainfall (${v} mm/yr) limits annual recharge.`)
  }

  // neighbourhood evidence
  if (params.nearbyWellSuccessPct !== '') {
    const v = Number(params.nearbyWellSuccessPct)
    prob += ((v - 50) / 50) * 7
    if (v >= 70) reasons.push(`${v}% of nearby wells are reported working — strong local evidence.`)
    if (v <= 35) warnings.push(`Only ${v}% of nearby wells work — local failure risk is real.`)
  }

  prob = Math.round(clamp(prob, 5, 95))

  // ── drilling depth ─────────────────────────────────────────────────
  let waterStrikeM: number | null = null
  let recommendedDepthM: [number, number] | null = null
  if (aquifer) {
    waterStrikeM = Math.round(aquifer.topM)
    const bottom = aquifer.bottomM
    // drill through the saturated zone and seat into the layer below
    const total = Math.round((bottom + 8) / 5) * 5
    recommendedDepthM = [Math.max(waterStrikeM + 5, Math.round(bottom)), total]
    if (recommendedDepthM[0] > recommendedDepthM[1]) recommendedDepthM = [recommendedDepthM[1], recommendedDepthM[1]]
  }

  // ── confidence ─────────────────────────────────────────────────────
  let conf = 100
  if (fit.rmsLog > 0.05) conf -= 20
  if (fit.rmsLog > 0.12) conf -= 25
  if (readings.length < 8) conf -= 10
  if (readings.length < 6) conf -= 15
  const minS = Math.min(...readings.map((r) => r.s))
  const decades = Math.log10(maxS / minS)
  if (decades < 1.2) {
    conf -= 15
    warnings.push('Electrode spacings cover a narrow range — extend AB/2 for a better-constrained model.')
  }
  if (match.overall < 70) conf -= 10
  if (match.overall < 45) conf -= 15
  if (aquifer && aquifer.bottomM > resolvedDepthM) {
    conf -= 20
    warnings.push(
      `The interpreted aquifer bottom (${aquifer.bottomM.toFixed(0)} m) is deeper than this survey reliably resolves (~${resolvedDepthM} m). Extend the spread to AB/2 ≥ ${Math.ceil((aquifer.bottomM / 0.6) )} m to confirm.`,
    )
  }
  conf = Math.round(clamp(conf, 10, 98))
  const confidence: Assessment['confidence'] = conf >= 75 ? 'High' : conf >= 50 ? 'Moderate' : 'Low'

  if (fit.rmsLog <= 0.05)
    reasons.push(`The layered model fits the measured curve closely (RMS log-misfit ${(fit.rmsLog * 100).toFixed(1)}%).`)
  else if (fit.rmsLog > 0.12)
    warnings.push(`The model fit is rough (RMS log-misfit ${(fit.rmsLog * 100).toFixed(0)}%) — noisy or inconsistent readings?`)

  // ── verdict ────────────────────────────────────────────────────────
  let verdict: Assessment['verdict']
  let verdictText: string
  if (prob >= 70 && confidence !== 'Low') {
    verdict = 'drill'
    verdictText = 'Favourable site — drilling is recommended at the interpreted depth.'
  } else if (prob >= 45) {
    verdict = 'caution'
    verdictText = 'Marginal site — drilling possible but verify with an additional sounding or a local hydrogeologist.'
  } else {
    verdict = 'no-drill'
    verdictText = 'Unfavourable — this sounding does not support drilling here. Consider testing another spot.'
  }

  // 3-layer curve family, when applicable (Lecture 9 master curves)
  const ct = fit.nLayers === 3 ? curveType(fit.layers as ResLayer[]) : null

  return {
    probability: prob,
    verdict,
    verdictText,
    aquifer,
    waterStrikeM,
    recommendedDepthM,
    confidence,
    confidencePct: conf,
    curveTypeText: ct,
    resolvedDepthM,
    reasons,
    warnings,
  }
}
