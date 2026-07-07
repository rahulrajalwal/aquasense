// Consistency check: do the user's field parameters match the calibrated
// signature of the selected site? This is the gate before the resistivity
// step — a mismatch means either wrong site choice or unusual local
// conditions, and lowers final confidence.

import type { Site, UserParams } from '../types'
import { SOIL_LABELS, ROCK_LABELS } from '../types'

export type Verdict = 'match' | 'partial' | 'mismatch' | 'skipped'

export interface MatchItem {
  label: string
  verdict: Verdict
  score: number // 0-100
  note: string
}

export interface MatchResult {
  overall: number // 0-100, weighted over provided items
  items: MatchItem[]
  level: 'good' | 'partial' | 'poor'
}

const inRange = (v: number, [lo, hi]: [number, number]) => v >= lo && v <= hi
const nearRange = (v: number, [lo, hi]: [number, number], frac: number) =>
  v >= lo * (1 - frac) && v <= hi * (1 + frac)

export function matchParams(site: Site, p: UserParams): MatchResult {
  const items: MatchItem[] = []
  const weights: number[] = []

  // Soil
  if (p.soil) {
    const ok = site.soils.includes(p.soil)
    items.push({
      label: 'Soil type',
      verdict: ok ? 'match' : 'mismatch',
      score: ok ? 100 : 30,
      note: ok
        ? `${SOIL_LABELS[p.soil]} is typical for this terrain.`
        : `${SOIL_LABELS[p.soil]} is unusual here — expected ${site.soils
            .map((s) => SOIL_LABELS[s])
            .join(' or ')}.`,
    })
    weights.push(0.2)
  }

  // Rock
  if (p.rock) {
    const ok = site.rocks.includes(p.rock)
    items.push({
      label: 'Rock type',
      verdict: ok ? 'match' : 'mismatch',
      score: ok ? 100 : 20,
      note: ok
        ? `${ROCK_LABELS[p.rock]} matches the site geology.`
        : `${ROCK_LABELS[p.rock]} does not match — this site is ${site.rocks
            .map((r) => ROCK_LABELS[r])
            .join(' / ')}.`,
    })
    weights.push(0.3)
  }

  // Rainfall
  if (p.rainfallMm !== '') {
    const v = Number(p.rainfallMm)
    const verdict: Verdict = inRange(v, site.rainfallMm)
      ? 'match'
      : nearRange(v, site.rainfallMm, 0.25)
        ? 'partial'
        : 'mismatch'
    items.push({
      label: 'Annual rainfall',
      verdict,
      score: verdict === 'match' ? 100 : verdict === 'partial' ? 60 : 20,
      note:
        verdict === 'match'
          ? `${v} mm/yr sits inside the site's normal ${site.rainfallMm[0]}–${site.rainfallMm[1]} mm.`
          : `${v} mm/yr vs the site's normal ${site.rainfallMm[0]}–${site.rainfallMm[1]} mm.`,
    })
    weights.push(0.2)
  }

  // Water table depth in nearby wells
  if (p.waterTableM !== '') {
    const v = Number(p.waterTableM)
    const verdict: Verdict = inRange(v, site.waterTableM)
      ? 'match'
      : nearRange(v, site.waterTableM, 0.5)
        ? 'partial'
        : 'mismatch'
    items.push({
      label: 'Water table depth',
      verdict,
      score: verdict === 'match' ? 100 : verdict === 'partial' ? 60 : 25,
      note:
        verdict === 'match'
          ? `${v} m matches the site's ${site.waterTableM[0]}–${site.waterTableM[1]} m pre-monsoon range.`
          : `${v} m vs the site's typical ${site.waterTableM[0]}–${site.waterTableM[1]} m.`,
    })
    weights.push(0.15)
  }

  // Depth of nearby bores
  if (p.nearbyWellDepthM !== '') {
    const v = Number(p.nearbyWellDepthM)
    const verdict: Verdict = inRange(v, site.wellDepthM)
      ? 'match'
      : nearRange(v, site.wellDepthM, 0.4)
        ? 'partial'
        : 'mismatch'
    items.push({
      label: 'Nearby bore depths',
      verdict,
      score: verdict === 'match' ? 100 : verdict === 'partial' ? 60 : 25,
      note:
        verdict === 'match'
          ? `${v} m is in the local ${site.wellDepthM[0]}–${site.wellDepthM[1]} m range.`
          : `${v} m vs typical local bores of ${site.wellDepthM[0]}–${site.wellDepthM[1]} m.`,
    })
    weights.push(0.15)
  }

  if (items.length === 0) {
    return {
      overall: 0,
      items: [
        {
          label: 'No parameters',
          verdict: 'skipped',
          score: 0,
          note: 'Enter at least soil, rock and rainfall to run the check.',
        },
      ],
      level: 'poor',
    }
  }

  const wSum = weights.reduce((a, b) => a + b, 0)
  const overall = Math.round(
    items.reduce((acc, it, i) => acc + it.score * weights[i], 0) / wSum,
  )
  const level = overall >= 70 ? 'good' : overall >= 45 ? 'partial' : 'poor'
  return { overall, items, level }
}
