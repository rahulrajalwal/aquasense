// Shared domain types for JalNetra.

export type SoilType =
  | 'black-cotton'
  | 'red-lateritic'
  | 'alluvial'
  | 'sandy'
  | 'murrum'

export type RockType =
  | 'massive-basalt'
  | 'vesicular-basalt'
  | 'weathered-basalt'
  | 'alluvium'
  | 'laterite'
  | 'granite-gneiss'

export type LayerRole = 'cover' | 'aquifer' | 'aquitard' | 'basement'

/** One stratum in a site's typical geological column (with plausible ranges). */
export interface SiteLayer {
  name: string
  role: LayerRole
  rhoRange: [number, number] // ohm-m
  thickRange: [number, number] // m; ignored for basement (half-space)
  note: string
}

/** A calibration site in the knowledge base. Phase 1: SAMPLE data only. */
export interface Site {
  id: string
  name: string
  region: string
  geologySummary: string
  soils: SoilType[]
  rocks: RockType[]
  rainfallMm: [number, number] // annual normal range
  waterTableM: [number, number] // pre-monsoon depth to water, m bgl
  wellDepthM: [number, number] // typical bore depths in the area
  wellSuccessPct: number // reported success rate of existing wells
  layers: SiteLayer[]
  /** Phase 1 flag: every value is illustrative, pending real-data review. */
  sample: true
  sourceNote: string
}

/** What the user tells us about their location (wizard step 2). */
export interface UserParams {
  soil: SoilType | ''
  rock: RockType | ''
  rainfallMm: number | ''
  waterTableM: number | '' // optional: depth to water in nearby wells
  nearbyWellDepthM: number | '' // optional: typical depth of nearby bores
  nearbyWellSuccessPct: number | '' // optional: how many nearby wells work
}

/** One Schlumberger VES reading entered by the user (wizard step 3). */
export interface VESReading {
  s: number // AB/2, m
  rhoA: number // apparent resistivity, ohm-m
}

export const SOIL_LABELS: Record<SoilType, string> = {
  'black-cotton': 'Black cotton soil (regur)',
  'red-lateritic': 'Red / lateritic soil',
  alluvial: 'Alluvial silt-loam',
  sandy: 'Sandy soil',
  murrum: 'Murrum (weathered gravelly)',
}

export const ROCK_LABELS: Record<RockType, string> = {
  'massive-basalt': 'Massive basalt (hard Deccan trap)',
  'vesicular-basalt': 'Vesicular / amygdaloidal basalt',
  'weathered-basalt': 'Weathered basalt',
  alluvium: 'Alluvium (sand, gravel, clay)',
  laterite: 'Laterite',
  'granite-gneiss': 'Granite / gneiss',
}
