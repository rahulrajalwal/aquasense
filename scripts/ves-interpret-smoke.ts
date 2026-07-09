// Verify the VES-first pipeline: official-layer interpretation, and a real
// inverted sounding → layer classification → derived params → assessment.
import { SITES } from '../src/lib/data/sites'
import { schlumbergerRhoA, type ResLayer } from '../src/lib/physics/ves'
import { invertVES } from '../src/lib/physics/invert'
import { interpretLayers, officialInterpretation } from '../src/lib/physics/interpret'
import { assessSite, type SiteInput } from '../src/lib/engine/assessReal'
import { parseVesCsv, VES_CSV_TEMPLATE } from '../src/lib/physics/vesCsv'

let fail = 0
const ok = (name: string, cond: boolean, extra = '') => {
  if (!cond) fail++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
}

// ── Mode 1: official interpretation from CGWB medians ──────────────────
const official = officialInterpretation({ aq1BottomM: 20, aq2BottomM: 105, aq2ThickM: 3, preSwlM: 9 })
ok('official: source', official.source === 'official')
ok('official: 5 layers', official.layers.length === 5)
ok('official: has topsoil+weathered+fractured+fresh',
   official.layers.some(l => l.rock === 'topsoil') &&
   official.layers.some(l => l.rock === 'weathered-basalt') &&
   official.layers.some(l => l.rock === 'fractured-basalt') &&
   official.layers.some(l => l.rock === 'fresh-basalt'))
ok('official: derived params match', official.derived.aq1BottomM === 20 && official.derived.aq2BottomM === 105 && official.derived.aq2ThickM === 3)

// ── Mode 2: invert a synthetic Deccan-basalt sounding, then interpret ──
const arch = SITES[0]
const gm = (r: [number, number]) => Math.sqrt(r[0] * r[1])
const trueLayers: ResLayer[] = arch.layers.map(l => ({
  resistivity: gm(l.rhoRange),
  thickness: l.thickRange[1] === 0 ? 0 : gm(l.thickRange),
}))
const spacings = [1.5, 2, 3, 4.5, 6.5, 10, 15, 22, 32, 46, 68, 100]
const readings = spacings.map((s, i) => ({ s, rhoA: Math.round(schlumbergerRhoA(trueLayers, s) * (0.98 + 0.04 * ((i * 37) % 100) / 100) * 10) / 10 }))
const fit = invertVES(readings, arch)
const maxDepth = Math.max(...spacings) * 0.6
const interp = interpretLayers(fit.layers, fit.rmsLog, maxDepth)
console.log(`\ninverted ${interp.layers.length} layers (RMS ${interp.rmsLogPct}%):`)
interp.layers.forEach(l => console.log(`  ${l.topM}${l.bottomM === null ? '→∞' : '–' + l.bottomM} m  ${l.resistivity.toFixed(0)} Ω·m  ${l.rockLabel}`))
console.log('derived:', JSON.stringify(interp.derived))
ok('inverted: source', interp.source === 'inverted')
ok('inverted: identifies an aquifer layer', interp.layers.some(l => l.isAquifer))
ok('inverted: aq1BottomM sensible (5-40)', interp.derived.aq1BottomM >= 5 && interp.derived.aq1BottomM <= 40, String(interp.derived.aq1BottomM))
ok('inverted: aq2ThickM in ML range (0.5-12)', interp.derived.aq2ThickM >= 0.5 && interp.derived.aq2ThickM <= 12, String(interp.derived.aq2ThickM))
ok('inverted: water table shallow (<30)', interp.derived.waterTableM < 30, String(interp.derived.waterTableM))

// ── assessment with each interpretation ───────────────────────────────
const base: SiteInput = { talukaId: 'haveli', placeName: 'Test', lat: 18.51, lon: 73.93, knownWaterTableM: '', nearbyBoreDepthM: '', nearbyOutcome: 'unknown', ves: null }
const aOff = assessSite({ ...base })  // ves null → auto official
ok('assess(null): auto-official interpretation', aOff.interpretation.source === 'official' && aOff.paramSource === 'ves-official')
ok('assess(null): fieldValidation present', !!aOff.fieldValidation && aOff.fieldValidation.recommendedDepthM[1] > aOff.fieldValidation.recommendedDepthM[0])
ok('assess(null): askVes true (recommend field survey)', aOff.askVes === true)

const aVes = assessSite({ ...base, ves: interp })
ok('assess(ves): uses survey params', aVes.paramSource === 'ves-survey' && aVes.interpretation.source === 'inverted')
ok('assess(ves): higher confidence than official', aVes.confidencePct >= aOff.confidencePct, `${aVes.confidencePct} vs ${aOff.confidencePct}`)
ok('assess(ves): probability valid', aVes.probability >= 5 && aVes.probability <= 95, String(aVes.probability))
console.log(`\nofficial: ${aOff.probability}% (${aOff.verdict}) conf ${aOff.confidencePct}  |  survey: ${aVes.probability}% (${aVes.verdict}) conf ${aVes.confidencePct}`)
console.log('field validation (survey):', JSON.stringify(aVes.fieldValidation))

// ── CSV parsing ───────────────────────────────────────────────────────
const csv = parseVesCsv(VES_CSV_TEMPLATE)
ok('CSV template parses', csv.readings.length >= 10 && csv.errors.length === 0, `${csv.readings.length} readings`)
const csvNoHeader = parseVesCsv('1.5,42\n3,38\n6.5,29\n15,28\n32,52\n68,140')
ok('CSV without header parses', csvNoHeader.readings.length === 6)

console.log(fail === 0 ? '\nALL VES-PIPELINE CHECKS PASSED' : `\n${fail} FAILURES`)
if (fail) process.exit(1)
