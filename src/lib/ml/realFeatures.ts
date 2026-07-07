// Feature engineering for the REAL CGWB well dataset.
//
// One code path builds features for both training (from a CgwbWell) and
// prediction (from a user's site), so the model always sees identically
// computed inputs. Only pre-drilling knowables are used — no leakage of
// the pump-test result into the features.

import type { CgwbWell } from '../data/real/wells'
import { CGWB_WELLS } from '../data/real/wells'
import type { TalukaInfo } from '../data/real/talukas'
import { talukaOfWellName } from '../data/real/talukas'

export const REAL_FEATURE_NAMES = [
  'Taluka rainfall (log mm/yr)',
  'GW development stage (%)',
  'Taluka yield potential (0–3)',
  'Drought-prone taluka',
  'Pre-monsoon water level (m bgl)',
  'Aquifer-I bottom depth (m)',
  'Aquifer-II zone depth (m)',
  'Aquifer-II zone thickness (m)',
  'Seasonal WL recovery (m)',
] as const

export const N_REAL_FEATURES = REAL_FEATURE_NAMES.length

export const YIELD_POT_ORDINAL: Record<TalukaInfo['yieldPotential'], number> = {
  Low: 0,
  'Low to Medium': 1,
  'Low and High': 1.5,
  Medium: 2,
  'Medium to High': 3,
}

export interface RealSiteParams {
  taluka: TalukaInfo
  preSwlM: number
  postSwlM: number | null
  aq1BottomM: number
  aq2BottomM: number
  aq2ThickM: number
}

export function featurizeReal(p: RealSiteParams): number[] {
  const recovery = p.postSwlM !== null ? Math.max(0, p.preSwlM - p.postSwlM) : p.preSwlM * 0.45
  return [
    Math.log(Math.max(100, p.taluka.rainfallMm)),
    p.taluka.stagePct,
    YIELD_POT_ORDINAL[p.taluka.yieldPotential],
    p.taluka.droughtProne ? 1 : 0,
    p.preSwlM,
    p.aq1BottomM,
    p.aq2BottomM,
    p.aq2ThickM,
    recovery,
  ]
}

/** District medians used to fill fields a record/user does not provide. */
export const DISTRICT_MEDIANS = { preSwlM: 17, aq1BottomM: 20, aq2BottomM: 105, aq2ThickM: 2 }

export function paramsFromWell(w: CgwbWell): RealSiteParams | null {
  const taluka = talukaOfWellName(w.taluka)
  if (!taluka) return null
  return {
    taluka,
    preSwlM: w.preSwlM ?? DISTRICT_MEDIANS.preSwlM,
    postSwlM: w.postSwlM,
    aq1BottomM: w.aq1BottomM ?? DISTRICT_MEDIANS.aq1BottomM,
    aq2BottomM: w.aq2BottomM ?? DISTRICT_MEDIANS.aq2BottomM,
    aq2ThickM: w.aq2ThickM ?? DISTRICT_MEDIANS.aq2ThickM,
  }
}

/** All pump-tested wells as training examples (success = yield ≥ 1). */
export function realTrainingExamples(): { x: number[]; y: 0 | 1; well: CgwbWell }[] {
  const out: { x: number[]; y: 0 | 1; well: CgwbWell }[] = []
  for (const w of CGWB_WELLS) {
    if (w.yieldLps === null) continue
    const p = paramsFromWell(w)
    if (!p) continue
    out.push({ x: featurizeReal(p), y: w.yieldLps >= 1 ? 1 : 0, well: w })
  }
  return out
}
