// ─────────────────────────────────────────────────────────────────────────
//  PHASE 1 — SAMPLE SITE KNOWLEDGE BASE
//
//  ⚠ Every number in this file is ILLUSTRATIVE. The three sites are
//  geological ARCHETYPES of Maharashtra terrain, with value ranges taken
//  from textbook/lecture material (EH 611 Lecture 9) and typical figures
//  quoted in published Deccan-trap VES literature — NOT from any specific
//  real survey. In Phase 2 these will be replaced by real published VES
//  site data, but only after each source is reviewed and approved.
// ─────────────────────────────────────────────────────────────────────────

import type { Site } from '../types'

export const SITES: Site[] = [
  {
    id: 'basalt-plateau',
    name: 'Site A — Basalt Plateau',
    region: 'Upland Deccan-trap plateau (Pune-district type terrain)',
    geologySummary:
      'Thin black-cotton soil over weathered and fractured basalt flows; hard massive basalt below. Groundwater sits in the weathered/fractured zone — the classic Deccan shallow aquifer.',
    soils: ['black-cotton', 'murrum'],
    rocks: ['weathered-basalt', 'vesicular-basalt', 'massive-basalt'],
    rainfallMm: [450, 900],
    waterTableM: [4, 12],
    wellDepthM: [30, 80],
    wellSuccessPct: 55,
    layers: [
      {
        name: 'Topsoil (black cotton / murrum)',
        role: 'cover',
        rhoRange: [8, 25],
        thickRange: [0.5, 3],
        note: 'Clay-rich, moisture-holding cover; conductive.',
      },
      {
        name: 'Weathered basalt (main aquifer)',
        role: 'aquifer',
        rhoRange: [20, 45],
        thickRange: [4, 18],
        note: 'Saturated weathered zone — the productive layer in Deccan trap.',
      },
      {
        name: 'Fractured / vesicular basalt',
        role: 'aquifer',
        rhoRange: [40, 110],
        thickRange: [6, 25],
        note: 'Secondary aquifer where fractures are water-filled.',
      },
      {
        name: 'Massive basalt (basement)',
        role: 'basement',
        rhoRange: [300, 2000],
        thickRange: [0, 0],
        note: 'Hard, dry, essentially impermeable.',
      },
    ],
    sample: true,
    sourceNote:
      'SAMPLE — archetype of basaltic plateau sites; ranges consistent with Deccan-trap VES literature, pending Phase-2 real data.',
  },
  {
    id: 'river-alluvium',
    name: 'Site B — River Alluvium Valley',
    region: 'Valley-fill alluvium over basalt (river-basin type terrain)',
    geologySummary:
      'Sandy-silty alluvium deposited by a river over basalt bedrock. Saturated sand and gravel form a good porous aquifer; clay lenses act as barriers.',
    soils: ['alluvial', 'sandy'],
    rocks: ['alluvium', 'weathered-basalt'],
    rainfallMm: [500, 1100],
    waterTableM: [3, 9],
    wellDepthM: [15, 45],
    wellSuccessPct: 75,
    layers: [
      {
        name: 'Dry sandy topsoil',
        role: 'cover',
        rhoRange: [30, 80],
        thickRange: [1, 4],
        note: 'Unsaturated sand/silt above the water table.',
      },
      {
        name: 'Saturated sand & gravel (aquifer)',
        role: 'aquifer',
        rhoRange: [15, 40],
        thickRange: [6, 20],
        note: 'Porous alluvial aquifer — high yield when thick.',
      },
      {
        name: 'Clay lens',
        role: 'aquitard',
        rhoRange: [4, 15],
        thickRange: [2, 10],
        note: 'Very conductive but impermeable — traps water above it.',
      },
      {
        name: 'Basalt bedrock (basement)',
        role: 'basement',
        rhoRange: [150, 800],
        thickRange: [0, 0],
        note: 'Base of the alluvial system.',
      },
    ],
    sample: true,
    sourceNote:
      'SAMPLE — archetype of alluvial valley-fill sites; ranges consistent with alluvium VES literature, pending Phase-2 real data.',
  },
  {
    id: 'lateritic-upland',
    name: 'Site C — Lateritic Upland',
    region: 'High-rainfall lateritic upland (western-ghats fringe type terrain)',
    geologySummary:
      'Hard lateritic crust over lithomarge clay and weathered basalt. Heavy monsoon rain, but the resistive dry crust makes siting tricky — water sits in the weathered zone beneath.',
    soils: ['red-lateritic'],
    rocks: ['laterite', 'weathered-basalt', 'massive-basalt'],
    rainfallMm: [2000, 4000],
    waterTableM: [2, 8],
    wellDepthM: [20, 60],
    wellSuccessPct: 65,
    layers: [
      {
        name: 'Dry laterite crust',
        role: 'cover',
        rhoRange: [800, 2500],
        thickRange: [0.5, 2.5],
        note: 'Very resistive duricrust when dry.',
      },
      {
        name: 'Moist laterite / lithomarge',
        role: 'cover',
        rhoRange: [60, 150],
        thickRange: [2, 8],
        note: 'Transition zone, partially saturated.',
      },
      {
        name: 'Weathered basalt (aquifer)',
        role: 'aquifer',
        rhoRange: [20, 50],
        thickRange: [5, 15],
        note: 'Main saturated zone below the laterite profile.',
      },
      {
        name: 'Massive basalt (basement)',
        role: 'basement',
        rhoRange: [400, 1500],
        thickRange: [0, 0],
        note: 'Hard unweathered flow.',
      },
    ],
    sample: true,
    sourceNote:
      'SAMPLE — archetype of lateritic terrain sites; ranges consistent with laterite VES literature, pending Phase-2 real data.',
  },
]

export function siteById(id: string): Site | null {
  return SITES.find((s) => s.id === id) ?? null
}
