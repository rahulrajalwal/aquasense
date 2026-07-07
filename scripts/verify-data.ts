// Cross-verification of the real-data layer + assessment engine.
// Checks internal consistency of the CGWB dataset, the shipped model, and
// runs the full assessment for every taluka (with and without VES).

import { CGWB_WELLS, testedWells, wellOutcome, locatedWells, nearestWells } from '../src/lib/data/real/wells'
import { TALUKAS_REAL, TALUKA_NAME_TO_ID } from '../src/lib/data/real/talukas'
import { assessSite } from '../src/lib/engine/assessReal'
import { realTrainingExamples, REAL_FEATURE_NAMES, featurizeReal } from '../src/lib/ml/realFeatures'
import { PRETRAINED_REAL } from '../src/lib/ml/pretrainedReal'
import { predictProba, contributions, trainLogReg } from '../src/lib/ml/logreg'

let failures = 0
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
}

// ── dataset ─────────────────────────────────────────────────────────────
check('146 wells in dataset', CGWB_WELLS.length === 146, `got ${CGWB_WELLS.length}`)
const tested = testedWells()
check('101 pump-tested wells', tested.length === 101, `got ${tested.length}`)
const succ = tested.filter((w) => wellOutcome(w) === 1).length
check('66 successes at >=1 lps', succ === 66, `got ${succ}`)
check('every well maps to a taluka', CGWB_WELLS.every((w) => TALUKA_NAME_TO_ID[w.taluka] !== undefined))
const located = locatedWells()
check('located wells have plausible coords', located.every((w) => w.lat! > 17.8 && w.lat! < 19.5 && w.lon! > 73.3 && w.lon! < 75.2))
// 6 = rows 4/5/77 (no printed coords) + rows 6/118/119 (anomalous coords omitted)
check('unlocated wells = 6', CGWB_WELLS.length - located.length === 6, `got ${CGWB_WELLS.length - located.length}`)
check('depths within 0-202 m', CGWB_WELLS.every((w) => w.depthM === null || (w.depthM > 10 && w.depthM <= 202)))
check('aquifer ordering AQ1<=AQ2 where both known',
  CGWB_WELLS.filter((w) => w.aq1BottomM !== null && w.aq2BottomM !== null).every((w) => w.aq1BottomM! <= w.aq2BottomM!))
const badYield = CGWB_WELLS.filter((w) => w.yieldLps !== null && (w.yieldLps < 0 || w.yieldLps > 50))
check('yields within 0-50', badYield.length === 0, badYield.map((w) => w.village).join(','))

// spot checks against the printed source table
const spot = (sno: number, f: (w: (typeof CGWB_WELLS)[number]) => boolean, desc: string) => {
  const w = CGWB_WELLS.find((x) => x.sno === sno)!
  check(`spot #${sno} ${w.village}: ${desc}`, f(w))
}
spot(102, (w) => w.village === 'Lavale' && w.yieldLps === 30.68 && w.depthM === 85, 'Lavale EW 85 m, 30.68')
spot(134, (w) => w.village === 'Nimone' && w.yieldLps === 43.85 && w.aq2ThickM === 7, 'Nimone 43.85, thick 7')
spot(18, (w) => w.village === 'Rui' && w.depthM === 198.2 && w.aq2BottomM === 174 && w.yieldLps === 8.24, 'Rui 198.2 m / AQII 174 / 8.24')
spot(8, (w) => w.village === 'Ambhi Khurd' && w.yieldRaw === 'Traces' && w.preSwlM === 70, 'Ambhi Khurd traces, SWL 70')
spot(115, (w) => w.village === 'Gulunche' && w.yieldLps === 0.01, 'Gulunche 0.01')
spot(59, (w) => w.village === 'Manjari' && w.taluka === 'Haveli' && w.yieldLps === 8.25, 'Manjari (Haveli) 8.25')
spot(6, (w) => w.lat === null && !!w.note, 'Sriramnagar coords omitted with note')
spot(1, (w) => w.taluka === 'Akole' && !!w.note, 'Khireshwar border note')

// ── talukas ─────────────────────────────────────────────────────────────
check('14 talukas', TALUKAS_REAL.length === 14)
check('semi-critical = Baramati + Purandhar',
  TALUKAS_REAL.filter((t) => t.category === 'Semi-Critical').map((t) => t.id).sort().join(',') === 'baramati,purandhar')
check('rainfall range 474-2668', Math.min(...TALUKAS_REAL.map((t) => t.rainfallMm)) === 474 && Math.max(...TALUKAS_REAL.map((t) => t.rainfallMm)) === 2668)
for (const t of TALUKAS_REAL) {
  const n = CGWB_WELLS.filter((w) => TALUKA_NAME_TO_ID[w.taluka] === t.id).length
  if (t.id !== 'pune-city' && n === 0) check(`taluka ${t.id} has wells`, false, '0 wells')
}
console.log('  taluka well counts:', TALUKAS_REAL.map((t) => `${t.id}:${CGWB_WELLS.filter((w) => TALUKA_NAME_TO_ID[w.taluka] === t.id).length}`).join(' '))

// ── model ───────────────────────────────────────────────────────────────
check('model has 9 features', PRETRAINED_REAL.featureNames.length === REAL_FEATURE_NAMES.length && PRETRAINED_REAL.weights.length === 9)
check('model AUC >= 0.85', PRETRAINED_REAL.valMetrics.auc >= 0.85, String(PRETRAINED_REAL.valMetrics.auc))
// reproducibility: retrain with same config → identical weights
const retrain = trainLogReg(realTrainingExamples().map(({ x, y }) => ({ x, y })), {
  datasetTag: 'repro', featureNames: [...REAL_FEATURE_NAMES], seed: 11, epochs: 800, learningRate: 0.35, l2: 0.03,
})
const wDiff = Math.max(...retrain.model.weights.map((w, i) => Math.abs(w - PRETRAINED_REAL.weights[i])))
check('training reproducible (max |Δw| < 1e-9)', wDiff < 1e-9, `Δ=${wDiff}`)
// decomposition exactness
const x0 = realTrainingExamples()[0].x
const p0 = predictProba(PRETRAINED_REAL, x0)
const cs = contributions(PRETRAINED_REAL, x0)
const logit = PRETRAINED_REAL.bias + cs.reduce((s, c) => s + c.logit, 0)
check('contribution decomposition exact', Math.abs(1 / (1 + Math.exp(-logit)) - p0) < 1e-9)

// ── assessment engine, all talukas × {no-VES, VES} ─────────────────────
let minP = 101, maxP = -1
let assessFailures = 0
for (const t of TALUKAS_REAL) {
  for (const ves of [null, { rho: 32, thickM: 8, topM: 6 }]) {
    const a = assessSite({
      talukaId: t.id, placeName: 'check', lat: null, lon: null,
      knownWaterTableM: '', nearbyBoreDepthM: '', nearbyOutcome: 'unknown', ves,
    })
    const ok =
      a.probability >= 5 && a.probability <= 95 &&
      a.recommendedDepthM[0] >= a.waterStrikeM[1] + 10 - 1e-9 &&
      a.recommendedDepthM[1] > a.recommendedDepthM[0] &&
      a.recommendedDepthM[1] <= 200 &&
      a.waterStrikeM[0] >= 2 && a.waterStrikeM[0] <= a.waterStrikeM[1] &&
      a.factors.length === 6 && a.explanations.length === 5 &&
      a.confidencePct >= 25 && a.confidencePct <= 90
    if (!ok) {
      assessFailures++
      check(`assess ${t.id} ves=${!!ves}`, false, JSON.stringify({ p: a.probability, strike: a.waterStrikeM, rec: a.recommendedDepthM }))
    }
    minP = Math.min(minP, a.probability); maxP = Math.max(maxP, a.probability)
  }
}
check('all 28 taluka assessments structurally valid', assessFailures === 0)
console.log(`  probability spread across talukas: ${minP}%–${maxP}%`)

// with coordinates (Lavale) — nearest-well path
const lav = assessSite({
  talukaId: 'mulshi', placeName: 'Lavale', lat: 18.5431, lon: 73.715,
  knownWaterTableM: 8, nearbyBoreDepthM: '', nearbyOutcome: 'unknown', ves: null,
})
check('Lavale nearest well is Lavale @ ~0 km', lav.evidence.nearby[0].well.village === 'Lavale' && lav.evidence.nearby[0].km < 1)
check('Lavale favourable-or-marginal', lav.probability >= 50, `${lav.probability}%`)
const nearest = nearestWells(18.5431, 73.715, 3)
check('nearestWells sorted', nearest[0].km <= nearest[1].km && nearest[1].km <= nearest[2].km)

// degenerate inputs shouldn't crash
assessSite({ talukaId: 'velhe', placeName: '', lat: 19.4, lon: 75.1, knownWaterTableM: 130, nearbyBoreDepthM: 200, nearbyOutcome: 'many-failed', ves: { rho: 900, thickM: 0.3, topM: 60 } })
check('extreme-input assessment did not crash', true)

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} FAILURES`)
if (failures > 0) process.exit(1)
