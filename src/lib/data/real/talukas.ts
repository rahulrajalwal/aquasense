// ─────────────────────────────────────────────────────────────────────────
//  REAL DATA — taluka-level hydrogeological layers, Pune district.
//
//  Sources:
//  • CGWB "Ground Water Information, Pune District" (2013):
//    Table-3 rainfall 2003–2012, Table-2 exploration ranges, Table-8 yield
//    potential, §6 drought-prone areas.
//  • CGWB NAQUIM "Aquifer Mapping and Management of Ground Water
//    Resources, Pune District": Table 8.1 groundwater resources (2013
//    assessment) — stage of development & category.
//
//  hqLat/hqLon are approximate taluka-headquarters anchors for the map
//  (not from the reports). Pune City is not assessed separately in the
//  resource estimation; Haveli figures are shown with a note.
// ─────────────────────────────────────────────────────────────────────────

export interface TalukaInfo {
  id: string
  name: string
  hqLat: number
  hqLon: number
  /** decadal average annual rainfall 2003–2012, mm (CGWB 2013, Table-3) */
  rainfallMm: number
  /** stage of groundwater development %, 2013 assessment (NAQUIM Table 8.1) */
  stagePct: number
  category: 'Safe' | 'Semi-Critical'
  /** aquifer yield potential (CGWB 2013, Table-8) */
  yieldPotential: 'Low' | 'Low to Medium' | 'Medium' | 'Medium to High' | 'Low and High'
  droughtProne: boolean
  /** exploration ranges from CGWB 2013 Table-2 (SWL m bgl, discharge lps) */
  explSwl: [number, number]
  explYieldMax: number
  terrain: string
}

export const TALUKAS_REAL: TalukaInfo[] = [
  {
    id: 'pune-city', name: 'Pune City', hqLat: 18.5204, hqLon: 73.8567,
    rainfallMm: 849, stagePct: 58.25, category: 'Safe', yieldPotential: 'Medium',
    droughtProne: false, explSwl: [2.9, 50], explYieldMax: 2.85,
    terrain: 'Urban basalt plateau along the Mula–Mutha confluence (resources assessed with Haveli).',
  },
  {
    id: 'haveli', name: 'Haveli', hqLat: 18.51, hqLon: 73.93,
    rainfallMm: 898, stagePct: 58.25, category: 'Safe', yieldPotential: 'Medium to High',
    droughtProne: false, explSwl: [2.54, 22.52], explYieldMax: 12.88,
    terrain: 'Central basalt plateau with alluvial pockets along the Mula–Mutha; the most-drilled taluka (32 CGWB wells).',
  },
  {
    id: 'khed', name: 'Khed (Rajgurunagar)', hqLat: 18.847, hqLon: 73.884,
    rainfallMm: 778, stagePct: 76.55, category: 'Safe', yieldPotential: 'Low and High',
    droughtProne: false, explSwl: [5, 103], explYieldMax: 4.07,
    terrain: 'Bhima–Indrayani basalt terrain: potential varies sharply between valley fill and upland flows.',
  },
  {
    id: 'ambegaon', name: 'Ambegaon', hqLat: 19.05, hqLon: 73.83,
    rainfallMm: 809, stagePct: 82.85, category: 'Safe', yieldPotential: 'Low',
    droughtProne: false, explSwl: [7.95, 14.15], explYieldMax: 1.05,
    terrain: 'Ghod-basin foothill terrain; thin weathered mantle limits storage.',
  },
  {
    id: 'junnar', name: 'Junnar', hqLat: 19.208, hqLon: 73.875,
    rainfallMm: 852, stagePct: 85.59, category: 'Safe', yieldPotential: 'Low',
    droughtProne: false, explSwl: [2.5, 6], explYieldMax: 10.45,
    terrain: 'Northern hill-and-valley basalt (Kukadi basin); deepest pre-monsoon water levels of the district recorded near Otur.',
  },
  {
    id: 'shirur', name: 'Shirur', hqLat: 18.827, hqLon: 74.373,
    rainfallMm: 550, stagePct: 89.58, category: 'Safe', yieldPotential: 'Medium to High',
    droughtProne: true, explSwl: [1.8, 2.87], explYieldMax: 3.4,
    terrain: 'Rain-shadow Ghod-river plain; drought-prone but with productive deeper fracture zones (Nimone).',
  },
  {
    id: 'daund', name: 'Daund', hqLat: 18.465, hqLon: 74.58,
    rainfallMm: 474, stagePct: 75.74, category: 'Safe', yieldPotential: 'Medium to High',
    droughtProne: true, explSwl: [3.41, 19], explYieldMax: 12.18,
    terrain: 'Driest taluka (474 mm/yr); Bhima-valley basalt plain with canal-command pockets.',
  },
  {
    id: 'indapur', name: 'Indapur', hqLat: 18.12, hqLon: 75.02,
    rainfallMm: 555, stagePct: 84.39, category: 'Safe', yieldPotential: 'Low to Medium',
    droughtProne: true, explSwl: [1.87, 2.05], explYieldMax: 9.84,
    terrain: 'South-eastern Bhima–Nira plain; drought-prone with heavy canal irrigation influence.',
  },
  {
    id: 'baramati', name: 'Baramati', hqLat: 18.15, hqLon: 74.577,
    rainfallMm: 506, stagePct: 95.68, category: 'Semi-Critical', yieldPotential: 'Medium to High',
    droughtProne: true, explSwl: [2.19, 30], explYieldMax: 12.18,
    terrain: 'Semi-critical: development at ~96% of recharge. New bores need recharge measures; deeper zones are hit-or-miss.',
  },
  {
    id: 'purandhar', name: 'Purandhar (Saswad)', hqLat: 18.343, hqLon: 74.03,
    rainfallMm: 696, stagePct: 94.91, category: 'Semi-Critical', yieldPotential: 'Medium to High',
    droughtProne: true, explSwl: [1.5, 50], explYieldMax: 7.76,
    terrain: 'Semi-critical Karha-basin terrain around Saswad–Jejuri; falling water-level trend.',
  },
  {
    id: 'bhor', name: 'Bhor', hqLat: 18.148, hqLon: 73.843,
    rainfallMm: 1229, stagePct: 47.02, category: 'Safe', yieldPotential: 'Low to Medium',
    droughtProne: true, explSwl: [5.85, 30], explYieldMax: 8.25,
    terrain: 'Nira-valley transition from ghat to plain; good rainfall, moderate storage.',
  },
  {
    id: 'velhe', name: 'Velhe', hqLat: 18.294, hqLon: 73.64,
    rainfallMm: 2668, stagePct: 8.24, category: 'Safe', yieldPotential: 'Low to Medium',
    droughtProne: false, explSwl: [3.8, 50], explYieldMax: 1.5,
    terrain: 'Wettest taluka (≈2,670 mm/yr) on the ghat crest; heavy runoff, thin aquifers, lowest groundwater use (8%).',
  },
  {
    id: 'mulshi', name: 'Mulshi (Paud)', hqLat: 18.525, hqLon: 73.615,
    rainfallMm: 1890, stagePct: 17.64, category: 'Safe', yieldPotential: 'Low to Medium',
    droughtProne: false, explSwl: [2.95, 8.9], explYieldMax: 30.68,
    terrain: 'High-rainfall ghat-fringe basalt; home to the district’s highest-yield CGWB well (Lavale, ~30.7).',
  },
  {
    id: 'maval', name: 'Maval (Vadgaon)', hqLat: 18.75, hqLon: 73.65,
    rainfallMm: 1571, stagePct: 20.51, category: 'Safe', yieldPotential: 'Low to Medium',
    droughtProne: false, explSwl: [4.3, 50], explYieldMax: 3,
    terrain: 'Indrayani–Pavana valleys between Lonavala ghats and the plateau; abundant rain, localized aquifers.',
  },
]

export const talukaByIdReal = (id: string): TalukaInfo | null =>
  TALUKAS_REAL.find((t) => t.id === id) ?? null

/** Map a well's printed taluka name to our taluka id. */
export const TALUKA_NAME_TO_ID: Record<string, string> = {
  'Pune City': 'pune-city', Haveli: 'haveli', Khed: 'khed', Ambegaon: 'ambegaon',
  Junnar: 'junnar', Shirur: 'shirur', Daund: 'daund', Indapur: 'indapur',
  Baramati: 'baramati', Purandhar: 'purandhar', Bhor: 'bhor', Velhe: 'velhe',
  Mulshi: 'mulshi', Maval: 'maval', Akole: 'ambegaon', // border well grouped with adjacent Ambegaon
}

export const talukaOfWellName = (printed: string): TalukaInfo | null =>
  talukaByIdReal(TALUKA_NAME_TO_ID[printed] ?? '')
