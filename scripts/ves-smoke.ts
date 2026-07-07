// Headless smoke test of the VES pipeline exactly as VesPanel drives it:
// demo readings from the forward model → inversion → site assessment.

import { SITES } from '../src/lib/data/sites'
import { schlumbergerRhoA } from '../src/lib/physics/ves'
import { invertVES, depthToTop } from '../src/lib/physics/invert'
import { matchParams } from '../src/lib/engine/matcher'
import { assess } from '../src/lib/engine/recommend'
import type { VESReading, UserParams } from '../src/lib/types'

const SPACINGS = [1.5, 2, 3, 4.5, 6.5, 10, 15, 22, 32, 46, 68, 100]

for (const site of SITES) {
  const gm = (r: [number, number]) => Math.sqrt(r[0] * r[1])
  const layers = site.layers.map((l) => ({
    resistivity: gm(l.rhoRange),
    thickness: l.thickRange[1] === 0 ? 0 : gm(l.thickRange),
  }))
  const readings: VESReading[] = SPACINGS.map((s, i) => ({
    s,
    rhoA: Math.round(schlumbergerRhoA(layers, s) * (0.97 + 0.06 * ((i * 37) % 100) / 100) * 10) / 10,
  }))

  const params: UserParams = {
    soil: site.soils[0],
    rock: site.rocks[0],
    rainfallMm: Math.round((site.rainfallMm[0] + site.rainfallMm[1]) / 2),
    waterTableM: Math.round((site.waterTableM[0] + site.waterTableM[1]) / 2),
    nearbyWellDepthM: Math.round((site.wellDepthM[0] + site.wellDepthM[1]) / 2),
    nearbyWellSuccessPct: site.wellSuccessPct,
  }

  const fit = invertVES(readings, site)
  const match = matchParams(site, params)
  const a = assess(site, params, match, readings, fit)

  console.log(`\n=== ${site.name} ===`)
  console.log(`fit: ${fit.nLayers} layers, RMS log-misfit ${(fit.rmsLog * 100).toFixed(2)}%`)
  fit.layers.forEach((l, i) =>
    console.log(
      `  L${i + 1}: ${l.resistivity.toFixed(1)} ohm-m, top ${depthToTop(fit.layers, i).toFixed(1)} m` +
        (i < fit.layers.length - 1 ? `, thick ${l.thickness.toFixed(1)} m` : ' (half-space)'),
    ),
  )
  console.log(`match: ${match.overall}% (${match.level})`)
  console.log(
    `assessment: prob ${a.probability}%, verdict ${a.verdict}, aquifer ${a.aquifer ? `${a.aquifer.topM.toFixed(1)}-${a.aquifer.bottomM.toFixed(1)} m @ ${a.aquifer.rho.toFixed(0)} ohm-m` : 'NONE'}, depth ${a.recommendedDepthM?.join('-') ?? '-'} m, conf ${a.confidencePct}%`,
  )
  if (!a.aquifer) throw new Error(`No aquifer identified for ${site.name} — check the pipeline`)
}
console.log('\nAll three archetypes: VES pipeline OK')
