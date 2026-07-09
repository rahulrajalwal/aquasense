// Headless report generation for visual QA — writes an official-mode and a
// field-VES report PDF so they can be rasterised and inspected.
import fs from 'fs'
import { buildReportDoc } from '../src/lib/report'
import { assessSite, type SiteInput } from '../src/lib/engine/assessReal'
import { interpretLayers } from '../src/lib/physics/interpret'
import { invertVES } from '../src/lib/physics/invert'
import { siteById } from '../src/lib/data/sites'
import { schlumbergerRhoA, type ResLayer } from '../src/lib/physics/ves'

const arch = siteById('basalt-plateau')!
const modelLayers: ResLayer[] = [
  { resistivity: 58, thickness: 4 },
  { resistivity: 22, thickness: 18 },
  { resistivity: 520, thickness: 0 },
]
const spac = [1.5, 2, 3, 4.5, 6.5, 10, 15, 22, 32, 46, 68, 100]
const readings = spac.map((s, i) => ({ s, rhoA: Math.round(schlumbergerRhoA(modelLayers, s) * (0.97 + 0.06 * ((i * 13) % 10) / 10) * 10) / 10 }))
const valid = readings.filter((r) => r.s > 0 && r.rhoA > 0).sort((a, b) => a.s - b.s)
const fit = invertVES(valid, arch)
const maxDepth = Math.max(...valid.map((r) => r.s)) * 0.6
const fieldVes = { ...interpretLayers(fit.layers, fit.rmsLog, maxDepth), readings: valid }

const baseInput: SiteInput = {
  talukaId: 'haveli',
  placeName: 'Wagholi',
  lat: 18.58,
  lon: 73.98,
  knownWaterTableM: 9,
  nearbyBoreDepthM: 120,
  nearbyOutcome: 'mixed',
  ves: null,
}

const official = assessSite(baseInput)
const field = assessSite({ ...baseInput, ves: fieldVes })

for (const [name, a] of [['official', official], ['field', field]] as const) {
  const doc = buildReportDoc(a)
  const buf = Buffer.from(doc.output('arraybuffer'))
  const out = `C:\\Users\\acer\\AppData\\Local\\Temp\\claude\\report-${name}.pdf`
  fs.writeFileSync(out, buf)
  console.log(`wrote ${out}  (${(buf.length / 1024).toFixed(0)} kB, ${doc.getNumberOfPages()} pages)`)
}
