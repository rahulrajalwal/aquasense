// Production site assessment — runs on the real CGWB Pune dataset.
//
// Three evidence streams, all shown to the user:
//   1. Local evidence: the nearest CGWB exploration wells + taluka record.
//   2. Transparent weighted rules over that evidence.
//   3. The pretrained ML model (logistic regression on 101 pump-tested wells).
// The headline probability blends (2) and (3); every number is explained.

import { CGWB_WELLS, nearestWells, wellOutcome, type CgwbWell } from '../data/real/wells'
import { talukaByIdReal, TALUKA_NAME_TO_ID, type TalukaInfo } from '../data/real/talukas'
import { AQUIFERS, DATA_VINTAGE_NOTE, LATEST_ASSESSMENT } from '../data/real/hydro'
import { featurizeReal, DISTRICT_MEDIANS, type RealSiteParams } from '../ml/realFeatures'
import { predictProba, contributions, type Contribution } from '../ml/logreg'
import { PRETRAINED_REAL } from '../ml/pretrainedReal'
import { officialInterpretation, type VesInterpretation } from '../physics/interpret'

export interface FactorScore {
  key: string
  label: string
  weightPct: number
  score: number // 0..100
  contribution: number // weighted points
  detail: string
}

export type NearbyOutcome = 'most-working' | 'mixed' | 'many-failed' | 'unknown'

export interface SiteInput {
  talukaId: string
  placeName: string
  lat: number | null
  lon: number | null
  knownWaterTableM: number | '' // depth to water in nearby wells, if the user knows it
  nearbyBoreDepthM: number | '' // typical bore depth nearby, if known
  nearbyOutcome: NearbyOutcome
  /** Full VES interpretation — official CGWB layers or an inverted field survey.
   *  Null means "not surveyed yet"; the engine then builds the official
   *  interpretation from the CGWB record so aquifer parameters always
   *  originate from a resistivity interpretation. */
  ves: VesInterpretation | null
}

/** Final one-line engineering summary that closes the VES → ML workflow. */
export interface FieldValidation {
  recommendedDepthM: [number, number]
  expectedAquifer: string
  expectedYield: string
  verification: string
  confidencePct: number
  recommendedNextStep: string
  finalStatus: string
  favourable: boolean
}

export interface LocalEvidence {
  nearby: { well: CgwbWell; km: number }[]
  talukaTested: CgwbWell[]
  talukaSuccessRate: number | null // 0..1 over tested wells in taluka
  medPreSwlM: number
  medAq1M: number
  medAq2M: number
  medAq2ThickM: number
  coverage: 'good' | 'moderate' | 'sparse'
}

export interface RealAssessment {
  input: SiteInput
  taluka: TalukaInfo
  evidence: LocalEvidence
  /** The VES interpretation the aquifer parameters were derived from. */
  interpretation: VesInterpretation
  /** Where the aquifer parameters came from. */
  paramSource: 'ves-survey' | 'ves-official'
  mlProbability: number // 0-100
  ruleProbability: number // 0-100
  probability: number // blended headline, 5-95
  verdict: 'favourable' | 'moderate' | 'unfavourable'
  verdictText: string
  waterStrikeM: [number, number]
  recommendedDepthM: [number, number]
  aquiferType: string
  yieldCategory: 'Good' | 'Moderate' | 'Low'
  yieldLph: [number, number]
  confidencePct: number
  confidence: 'High' | 'Moderate' | 'Low'
  factors: FactorScore[]
  mlContributions: Contribution[]
  explanations: { q: string; a: string }[]
  /** Step-by-step engineering reasoning for the recommended drilling depth. */
  depthRationale: string[]
  nextSteps: string[]
  fieldValidation: FieldValidation
  askVes: boolean
  askVesReason: string
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const r5 = (v: number) => Math.round(v / 5) * 5
const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

// ── local evidence ──────────────────────────────────────────────────────

export function gatherEvidence(input: SiteInput): { taluka: TalukaInfo; evidence: LocalEvidence } {
  const taluka = talukaByIdReal(input.talukaId)
  if (!taluka) throw new Error(`Unknown taluka ${input.talukaId}`)

  const talukaWells = CGWB_WELLS.filter((w) => TALUKA_NAME_TO_ID[w.taluka] === taluka.id)
  const talukaTested = talukaWells.filter((w) => w.yieldLps !== null)
  const succ = talukaTested.filter((w) => wellOutcome(w) === 1).length
  const talukaSuccessRate = talukaTested.length ? succ / talukaTested.length : null

  const nearby =
    input.lat !== null && input.lon !== null ? nearestWells(input.lat, input.lon, 5) : []

  // local medians: prefer wells within 15 km, else the taluka, else district
  const pool =
    nearby.filter((n) => n.km <= 15).map((n) => n.well).length >= 2
      ? nearby.filter((n) => n.km <= 15).map((n) => n.well)
      : talukaWells.length
        ? talukaWells
        : CGWB_WELLS

  const medPreSwlM = median(pool.map((w) => w.preSwlM).filter((v): v is number => v !== null)) ?? DISTRICT_MEDIANS.preSwlM
  const medAq1M = median(pool.map((w) => w.aq1BottomM).filter((v): v is number => v !== null)) ?? DISTRICT_MEDIANS.aq1BottomM
  const medAq2M = median(pool.map((w) => w.aq2BottomM).filter((v): v is number => v !== null)) ?? DISTRICT_MEDIANS.aq2BottomM
  const medAq2ThickM = median(pool.map((w) => w.aq2ThickM).filter((v): v is number => v !== null)) ?? DISTRICT_MEDIANS.aq2ThickM

  const coverage: LocalEvidence['coverage'] =
    nearby.length && nearby[0].km <= 10 && talukaTested.length >= 5
      ? 'good'
      : talukaTested.length >= 3
        ? 'moderate'
        : 'sparse'

  return {
    taluka,
    evidence: { nearby, talukaTested, talukaSuccessRate, medPreSwlM, medAq1M, medAq2M, medAq2ThickM, coverage },
  }
}

// ── assessment ──────────────────────────────────────────────────────────

export function assessSite(input: SiteInput): RealAssessment {
  const { taluka, evidence } = gatherEvidence(input)
  const ev = evidence

  // ── VES interpretation is the foundation ──────────────────────────
  // If the user has not run a survey, build the official interpretation
  // from the CGWB record, so the aquifer parameters ALWAYS originate from
  // a resistivity interpretation rather than being entered directly.
  const interpretation: VesInterpretation =
    input.ves ??
    officialInterpretation({
      aq1BottomM: ev.medAq1M,
      aq2BottomM: ev.medAq2M,
      aq2ThickM: ev.medAq2ThickM,
      preSwlM: ev.medPreSwlM,
    })
  const paramSource: RealAssessment['paramSource'] =
    interpretation.source === 'inverted' ? 'ves-survey' : 'ves-official'

  // aquifer parameters — from the VES interpretation, not typed in
  const aq1BottomM = interpretation.derived.aq1BottomM
  const aq2BottomM = interpretation.derived.aq2BottomM
  const aq2ThickM = interpretation.derived.aq2ThickM
  const preSwl =
    input.knownWaterTableM !== '' ? Number(input.knownWaterTableM) : interpretation.derived.waterTableM

  // ML prediction from the pretrained real-data model — fed the VES-derived aquifer parameters
  const params: RealSiteParams = {
    taluka,
    preSwlM: preSwl,
    postSwlM: null,
    aq1BottomM,
    aq2BottomM,
    aq2ThickM,
  }
  const x = featurizeReal(params)
  const mlProbability = Math.round(predictProba(PRETRAINED_REAL, x) * 100)
  const mlContributions = contributions(PRETRAINED_REAL, x)

  // ── transparent rules ─────────────────────────────────────────────
  const factors: FactorScore[] = []
  const addFactor = (key: string, label: string, weightPct: number, score: number, detail: string) => {
    score = Math.round(clamp(score, 0, 100))
    factors.push({ key, label, weightPct, score, contribution: Math.round(score * weightPct) / 100, detail })
  }

  // 1. local CGWB record (30)
  let wellScore = ev.talukaSuccessRate !== null ? ev.talukaSuccessRate * 100 : 50
  const near3 = ev.nearby.slice(0, 3).filter((n) => n.well.yieldLps !== null)
  if (near3.length) {
    const nearSucc = near3.filter((n) => wellOutcome(n.well) === 1).length / near3.length
    wellScore = 0.55 * wellScore + 45 * nearSucc
  }
  if (input.nearbyOutcome === 'most-working') wellScore = wellScore * 0.75 + 25
  if (input.nearbyOutcome === 'many-failed') wellScore = wellScore * 0.75
  addFactor(
    'wells',
    'CGWB & local well record',
    30,
    wellScore,
    ev.talukaSuccessRate !== null
      ? `${Math.round(ev.talukaSuccessRate * 100)}% of ${ev.talukaTested.length} pump-tested CGWB wells in ${taluka.name} yielded ≥1 lps` +
          (near3.length ? `; nearest tested wells: ${near3.map((n) => `${n.well.village} (${n.km} km, ${n.well.yieldRaw})`).join(', ')}.` : '.')
      : 'No pump-tested CGWB wells in this taluka — district-level prior used.',
  )

  // 2. aquifer geometry (25) — from the VES interpretation
  const thickScore = aq2ThickM >= 6 ? 88 : aq2ThickM >= 3 ? 70 : aq2ThickM >= 1.5 ? 52 : 30
  addFactor(
    'aquifer',
    'Aquifer geometry (from VES)',
    25,
    thickScore,
    `The ${interpretation.source === 'official' ? 'official CGWB interpreted layers' : 'inverted VES sounding'} place ` +
      `Aquifer-I (weathered basalt) to ~${aq1BottomM} m and the Aquifer-II fracture zone near ${aq2BottomM} m with a ` +
      `~${aq2ThickM} m productive thickness — ${
        aq2ThickM >= 3 ? 'workable storage at depth.' : 'thin deeper zone; success depends on hitting discrete fractures.'
      }`,
  )

  // 3. water table (15)
  const wtScore = clamp(100 - (preSwl - 4) * 3.2, 10, 95)
  addFactor(
    'watertable',
    'Water-table depth',
    15,
    wtScore,
    `${input.knownWaterTableM !== '' ? 'Your reported' : 'Local median'} pre-monsoon depth to water ≈ ${preSwl.toFixed(1)} m bgl${
      preSwl > 20 ? ' — deep; expect higher pumping head and seasonal stress.' : preSwl > 10 ? ' — moderate.' : ' — shallow, favourable.'
    }`,
  )

  // 4. rainfall (10) — calibrated to the observed Pune pattern (very high
  // ghat rainfall does not translate to storage in thin hill aquifers)
  const mm = taluka.rainfallMm
  const rainScore = mm < 500 ? 32 : mm < 650 ? 45 : mm < 900 ? 65 : mm < 1300 ? 75 : mm < 2000 ? 62 : 50
  addFactor(
    'rainfall',
    'Rainfall recharge',
    10,
    rainScore,
    `Taluka normal ≈ ${mm} mm/yr (CGWB 2003–2012). ${
      mm < 550 ? 'Rain-shadow zone — recharge is the binding constraint.' : mm > 2000 ? 'Very high ghat rainfall, but steep terrain sheds most of it as runoff.' : 'Typical plateau monsoon recharge.'
    }`,
  )

  // 5. resource stress (10)
  const stageScore = taluka.stagePct >= 95 ? 22 : taluka.stagePct >= 85 ? 42 : taluka.stagePct >= 60 ? 62 : 85
  addFactor(
    'stress',
    'Groundwater development stress',
    10,
    stageScore,
    `Stage of development ${taluka.stagePct}% (${taluka.category}, 2013 taluka assessment — latest published taluka-wise table). ${
      taluka.category === 'Semi-Critical'
        ? 'Semi-critical taluka: CGWB recommends recharge measures before further development.'
        : taluka.stagePct >= 85 ? 'High existing draft — competition among wells is real.' : 'Headroom remains in the local resource.'
    } District-wide, the ${LATEST_ASSESSMENT.year} GSDA/CGWB assessment reports the ${LATEST_ASSESSMENT.puneDevelopmentBand} band with ${LATEST_ASSESSMENT.puneStressedTalukas} stressed talukas — assume conditions are tighter than the 2013 figures.`,
  )

  // 6. VES resistivity signature (10) — from the interpreted aquifer layer
  const rho = interpretation.derived.primaryAquiferRho ?? 60
  const saturatedWindow = rho >= 20 && rho <= 150 // saturated weathered or fractured basalt
  const strong = rho >= 25 && rho <= 110
  const vesScore = (strong ? 82 : saturatedWindow ? 62 : 35) + clamp((aq2ThickM - 3) * 3, -10, 12)
  addFactor(
    'ves',
    interpretation.source === 'inverted' ? 'VES resistivity (your survey)' : 'VES resistivity (official layers)',
    10,
    vesScore,
    `Interpreted aquifer resistivity ≈ ${rho.toFixed(0)} Ω·m. ${
      strong
        ? 'This sits in the saturated basalt-aquifer window (weathered ~20–45 Ω·m / fractured ~40–110 Ω·m) — direct geophysical support for water.'
        : saturatedWindow
          ? 'Near the saturated-basalt window; partially saturated or fracture-controlled.'
          : 'Outside the typical saturated-basalt window — weak geophysical support at this exact spot.'
    }${interpretation.source === 'official' ? ' A field VES at the plot would confirm this.' : ''}`,
  )

  const ruleProbability = Math.round(clamp(factors.reduce((a, f) => a + f.contribution, 0), 5, 95))
  const probability = Math.round(clamp(0.55 * mlProbability + 0.45 * ruleProbability, 5, 95))

  // ── drilling guidance: VES-derived aquifer depth, cross-checked with
  //    the depths at which successful local wells struck water ─────────
  const successfulLocal = ev.talukaTested.filter((w) => wellOutcome(w) === 1)
  const succDepths = successfulLocal.map((w) => w.aq2BottomM).filter((v): v is number => v !== null)
  const medSuccDepth = median(succDepths) ?? aq2BottomM
  const waterStrikeM: [number, number] = [
    Math.max(2, Math.round(Math.min(preSwl * 0.8, aq1BottomM * 0.6))),
    Math.round(aq1BottomM),
  ]
  // anchor the target on the VES-interpreted Aquifer-II, tempered by local wells
  const targetAq2 = Math.round((aq2BottomM + medSuccDepth) / 2)
  const recLo = r5(clamp(Math.min(targetAq2, aq2BottomM), waterStrikeM[1] + 10, 190))
  const recHi = r5(clamp(Math.max(recLo + 20, targetAq2 + 2 * aq2ThickM + 10), recLo + 15, 200))
  const recommendedDepthM: [number, number] = [recLo, recHi]

  // yield expectation from local successful wells
  const succYields = successfulLocal.map((w) => w.yieldLps!).sort((a, b) => a - b)
  const medYield = succYields.length ? succYields[Math.floor(succYields.length / 2)] : 2
  const yieldCategory: RealAssessment['yieldCategory'] =
    probability < 45 ? 'Low' : medYield >= 4 && probability >= 60 ? 'Good' : 'Moderate'
  const yieldLph: [number, number] =
    yieldCategory === 'Good' ? [7000, 30000] : yieldCategory === 'Moderate' ? [2000, 9000] : [300, 2500]

  // ── confidence ────────────────────────────────────────────────────
  let conf = 52
  if (ev.coverage === 'good') conf += 15
  else if (ev.coverage === 'moderate') conf += 8
  if (ev.talukaTested.length >= 6) conf += 5
  if (interpretation.source === 'inverted') conf += 11 // a real field sounding at the plot
  if (Math.abs(mlProbability - ruleProbability) <= 15) conf += 6
  else conf -= 4
  if (input.knownWaterTableM !== '') conf += 3
  conf = Math.round(clamp(conf, 25, 90))
  const confidence: RealAssessment['confidence'] = conf >= 70 ? 'High' : conf >= 50 ? 'Moderate' : 'Low'

  // ── verdict ───────────────────────────────────────────────────────
  let verdict: RealAssessment['verdict']
  let verdictText: string
  if (probability >= 65) {
    verdict = 'favourable'
    verdictText = `Favourable. The CGWB record around ${taluka.name} and the model agree this is a workable site — confirm the exact spot with a VES, then drill within the recommended window.`
  } else if (probability >= 45) {
    verdict = 'moderate'
    verdictText = `Marginal. Success is plausible but not assured${taluka.category === 'Semi-Critical' ? ', and the taluka is semi-critical' : ''} — run a VES at 2–3 candidate spots and pick the best before committing.`
  } else {
    verdict = 'unfavourable'
    verdictText = `Unfavourable. The local CGWB record and model both point to high failure risk — consider managed recharge first, or investigate an alternative site.`
  }

  // ── recommend a field sounding when only official layers were used ─
  const askVes = interpretation.source === 'official'
  const askVesReason =
    'This assessment uses the official CGWB interpreted layers for the area. A field Vertical Electrical Sounding at ' +
    'the exact plot would confirm the aquifer depth and resistivity here and raise the confidence — upload your ' +
    'readings in the survey step to invert them live.'

  // ── explanations ──────────────────────────────────────────────────
  const nearTxt = ev.nearby.slice(0, 3).map((n) => {
    const w = n.well
    const y = w.yieldLps === null ? 'not pump-tested' : `${w.yieldRaw} yield`
    return `${w.village} (${w.type}, ${n.km} km): drilled ${w.depthM ?? '—'} m, ${y}, Aquifer-II ~${w.aq2BottomM ?? '—'} m`
  })
  const explanations = [
    {
      q: `Why ${probability}% probability?`,
      a: `Two engines were combined. The ML model, trained on ${PRETRAINED_REAL.nTrain + PRETRAINED_REAL.nVal} pump-tested CGWB wells across Pune district, gives ${mlProbability}%; the transparent rule engine over the same evidence gives ${ruleProbability}%. The blend weights the model slightly higher (55/45). Biggest drivers here: ${factors
        .slice()
        .sort((a, b) => Math.abs(b.score - 50) * b.weightPct - Math.abs(a.score - 50) * a.weightPct)
        .slice(0, 2)
        .map((f) => f.label.toLowerCase())
        .join(' and ')}.`,
    },
    {
      q: 'What do the real CGWB wells nearby show?',
      a: nearTxt.length
        ? `Nearest documented wells — ${nearTxt.join('; ')}. Taluka-wide, ${
            ev.talukaSuccessRate !== null
              ? `${Math.round(ev.talukaSuccessRate * 100)}% of ${ev.talukaTested.length} pump-tested wells reached ≥1 lps.`
              : 'no pump-tested wells are documented.'
          }`
        : `No coordinates were provided, so taluka-level evidence was used: ${
            ev.talukaSuccessRate !== null
              ? `${Math.round(ev.talukaSuccessRate * 100)}% of ${ev.talukaTested.length} pump-tested CGWB wells in ${taluka.name} reached ≥1 lps.`
              : 'no pump-tested CGWB wells are documented in this taluka.'
          }`,
    },
    {
      q: `Why drill to ${recommendedDepthM[0]}–${recommendedDepthM[1]} m?`,
      a: `The VES interpretation puts the weathered shallow aquifer (Aquifer-I) down to ~${aq1BottomM} m and the productive Aquifer-II fracture zone near ~${aq2BottomM} m${
        succDepths.length ? `; successful CGWB wells nearby hit their zones around ${medSuccDepth} m` : ''
      }. Water typically strikes at ${waterStrikeM[0]}–${waterStrikeM[1]} m, but the bore should continue through the Aquifer-II zone so it survives summer drawdown. District-wide, Aquifer-II runs ${AQUIFERS.aq2.depthRangeM[0]}–${AQUIFERS.aq2.depthRangeM[1]} m (NAQUIM).`,
    },
    {
      q: 'How reliable is this assessment?',
      a: `Confidence ${conf}% (${confidence}). Coverage is ${ev.coverage}: ${
        ev.nearby.length ? `nearest CGWB well ${ev.nearby[0].km} km away` : 'no coordinates given'
      }, ${ev.talukaTested.length} pump-tested wells in the taluka. ${DATA_VINTAGE_NOTE} Newest verified district status (${LATEST_ASSESSMENT.year}): development ${LATEST_ASSESSMENT.puneDevelopmentBand}, ${LATEST_ASSESSMENT.puneStressedTalukas} talukas stressed — taluka-wise 2023 figures are on the INGRES portal.`,
    },
    {
      q: 'What must be done before actually drilling?',
      a: `A Schlumberger VES at the exact plot (AB/2 to ~${Math.ceil(recommendedDepthM[1] / 0.6 / 10) * 10} m) to confirm the saturated zone — saturated weathered basalt reads ~20–45 Ω·m. ${
        taluka.category === 'Semi-Critical'
          ? `${taluka.name} is SEMI-CRITICAL: pair any new bore with recharge structures and check GSDA/CGWA requirements first. `
          : ''
      }Groundwater is a shared resource — a recharge pit alongside the bore materially improves its life.`,
    },
  ]

  const nextSteps = [
    `Commission a Schlumberger VES at the plot (AB/2 up to ~${Math.ceil(recommendedDepthM[1] / 0.6 / 10) * 10} m); look for the 20–45 Ω·m saturated-basalt signature${interpretation.source === 'inverted' ? ' — done ✓ (your survey was inverted above)' : ''}.`,
    verdict === 'favourable'
      ? 'Confirm the depth window with the sounding, then finalise the drilling contract with casing through the weathered zone.'
      : 'Sound 2–3 candidate spots (valley lines, topographic lows) and rank them before choosing.',
    `Cross-check current water levels with the nearest GSDA/CGWB observation well just before drilling — levels here are from ${'2017'} monitoring.`,
    taluka.category === 'Semi-Critical'
      ? 'Semi-critical taluka: obtain groundwater-authority guidance and budget recharge structures (CGWB recommendation).'
      : 'Register the bore and budget a recharge pit / rooftop recharge — it pays back in dry years.',
  ]

  // ── engineering reasoning for the recommended depth ───────────────
  const depthRationale = [
    `Water is first encountered in the weathered zone at about ${waterStrikeM[0]}–${waterStrikeM[1]} m (Aquifer-I).`,
    `This shallow weathered aquifer is thin and its water level falls through the summer — it cannot be relied on by itself.`,
    `The main productive fracture zone (Aquifer-II) is interpreted near ~${aq2BottomM} m${
      succDepths.length ? `, consistent with successful CGWB wells nearby that struck water around ~${medSuccDepth} m` : ''
    }.`,
    `Drilling should therefore continue past the shallow zone to intercept and fully penetrate Aquifer-II so the bore survives summer drawdown.`,
    `Recommended final drilling depth: ${recommendedDepthM[0]}–${recommendedDepthM[1]} m.`,
  ]

  // ── field-validation summary (closes the VES → ML → decision loop) ─
  const expectedAquifer = aq2ThickM >= 2 ? 'Fractured basalt (Aquifer-II)' : 'Weathered basalt (Aquifer-I)'
  const fieldValidation: FieldValidation = {
    recommendedDepthM,
    expectedAquifer,
    expectedYield: `${yieldCategory} (~${yieldLph[0].toLocaleString()}–${yieldLph[1].toLocaleString()} L/hr)`,
    verification:
      interpretation.source === 'inverted'
        ? 'Electrical Resistivity Survey (VES) — field sounding inverted'
        : 'VES interpretation from official CGWB layers (field VES recommended)',
    confidencePct: conf,
    recommendedNextStep:
      verdict === 'favourable'
        ? 'Conduct a confirmatory VES at the exact plot, then drill with casing through the weathered zone.'
        : verdict === 'moderate'
          ? 'Run a detailed field VES at 2–3 candidate spots and compare before choosing where to drill.'
          : 'Do not drill yet — commission a detailed geophysical survey (VES/ERT) and consider alternative sites.',
    favourable: verdict === 'favourable',
    finalStatus:
      verdict === 'favourable'
        ? 'Suitable for Borewell Construction'
        : verdict === 'moderate'
          ? 'Conditionally suitable — confirm with a field VES'
          : 'Not recommended without further investigation',
  }

  return {
    input, taluka, evidence: ev,
    interpretation, paramSource,
    mlProbability, ruleProbability, probability,
    verdict, verdictText,
    waterStrikeM, recommendedDepthM,
    aquiferType:
      aq2ThickM >= 3
        ? 'Weathered basalt (Aquifer-I) over jointed/fractured basalt (Aquifer-II)'
        : 'Weathered basalt (Aquifer-I); thin discrete fractures at depth (Aquifer-II)',
    yieldCategory, yieldLph,
    confidencePct: conf, confidence,
    factors, mlContributions, explanations, depthRationale, nextSteps,
    fieldValidation,
    askVes, askVesReason,
  }
}
