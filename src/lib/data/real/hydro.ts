// ─────────────────────────────────────────────────────────────────────────
//  REAL DATA — district hydrogeology constants, Pune district (CGWB).
//  Sources: CGWB NAQUIM Aquifer Mapping report (Table 5.1, §5–6, Table 8.1)
//  and CGWB "Ground Water Information, Pune District" 2013 (Tables 4, 5).
// ─────────────────────────────────────────────────────────────────────────

/** Two-aquifer system delineated by NAQUIM in Deccan basalt (Table 5.1). */
export const AQUIFERS = {
  aq1: {
    name: 'Aquifer-I — weathered/fractured basalt (phreatic)',
    depthRangeM: [9, 30] as [number, number],
    swlRangeM: [2.1, 30] as [number, number],
    fractureZonesM: [5, 22] as [number, number],
    yieldM3PerDay: [10, 100] as [number, number],
    sustainabilityHr: [1, 3] as [number, number],
    transmissivityM2PerDay: [5, 55] as [number, number],
    specificYield: [0.019, 0.028] as [number, number],
    note: 'Tapped by dugwells 9–30 m deep; the classic shallow Deccan aquifer.',
  },
  aq2: {
    name: 'Aquifer-II — jointed/fractured basalt (semi-confined to confined)',
    depthRangeM: [48, 175] as [number, number],
    swlRangeM: [9, 70] as [number, number],
    fractureThickM: [0.5, 12] as [number, number],
    yieldLps: [0, 2.5] as [number, number], // "up to 2.5 lps" typical; exploration max ~30
    sustainabilityHr: [0.5, 3] as [number, number],
    transmissivityM2PerDay: [25, 250] as [number, number],
    storativity: [1.2e-4, 3.57e-4] as [number, number],
    note: 'Tapped by borewells 50–180 m deep; yield depends on hitting discrete fracture zones.',
  },
  alluvium: {
    name: 'Alluvium — sand/gravel ribbons along major rivers',
    depthRangeM: [2, 32] as [number, number],
    yieldM3PerDay: [50, 300] as [number, number],
    note: 'Restricted to narrow belts along the Bhima, Mula–Mutha, Ghod and tributaries.',
  },
}

/** Dugwell yield by basalt formation & elevation (CGWB 2013, Table-4). */
export const DUGWELL_YIELDS = [
  { formation: 'Massive basalt, poorly weathered/jointed, thin vesicular zone', yieldLpmDay: [30, 60], elevationM: [787, 838] },
  { formation: 'Weathered, highly jointed massive basalt, thick vesicular zones', yieldLpmDay: [90, 150], elevationM: [721, 787] },
  { formation: 'Weathered, fractured & jointed massive basalt, thick vesicular zone', yieldLpmDay: [60, 120], elevationM: [651, 721] },
  { formation: 'Highly weathered, moderate-poorly jointed basalt', yieldLpmDay: [40, 80], elevationM: [560, 651] },
] as const

/** District overview (both reports). */
export const DISTRICT_OVERVIEW = {
  areaSqKm: 15642,
  talukas: 14,
  villages: 1877,
  rainfallRangeMm: [468, 4659] as [number, number],
  preMonsoonWlM2017: [0.9, 30.35] as [number, number],
  postMonsoonWlM2017: [0, 25.2] as [number, number],
  explorationWells: 'EW-102, OW-41 (2018); annexure lists 146 wells',
  maxYieldNote: 'Discharge negligible to ~30.6 (Lavale, Mulshi)',
  resources2013: {
    netAvailabilityMcm: 1740.09,
    draftMcm: 1285.39,
    stagePct: 73.87,
    semiCritical: ['Baramati (95.68%)', 'Purandhar (94.91%)'],
  },
  trendNote:
    'Decadal trend 2009–2018: ~65% of the area shows falling pre-monsoon water levels (NAQUIM §9).',
}

/** Citations shown in the UI and PDF reports. */
export const CITATIONS = [
  {
    id: 'cgwb-2013',
    short: 'CGWB (2013)',
    full: 'S.S.P. Mishra, "Ground Water Information, Pune District, Maharashtra" (1810/DBR/2009), Central Ground Water Board, Ministry of Water Resources, Central Region Nagpur, 2013.',
  },
  {
    id: 'naquim-pune',
    short: 'CGWB NAQUIM (Pune)',
    full: 'Anu Radha Bhatia et al., "Aquifer Mapping and Management of Ground Water Resources, Pune District, Maharashtra", Central Ground Water Board, Dept. of Water Resources, RD & GR, Ministry of Jal Shakti, Central Region Nagpur (NAQUIM study 2016–19).',
  },
  {
    id: 'gsda-2023',
    short: 'GSDA/CGWB (2023)',
    full: '"Report on the Dynamic Groundwater Resources of Maharashtra 2023" (2576/GWR/2024), Groundwater Surveys & Development Agency, Govt. of Maharashtra, jointly with CGWB — GEC-2015 assessment as on March 2023, published 2024.',
  },
] as const

/**
 * Newest verified official assessment (district level). Taluka-wise 2023
 * figures are published only through the CGWB/IIT-H INGRES portal; the
 * taluka table used for scoring remains the latest publicly published one
 * (2013 assessment, NAQUIM Table 8.1) and is labelled with its vintage.
 */
export const LATEST_ASSESSMENT = {
  year: '2022-23 (as on March 2023)',
  source: 'GSDA/CGWB Dynamic Groundwater Resources of Maharashtra 2023',
  puneDevelopmentBand: '50–70%',
  puneStressedTalukas: 8, // talukas categorized Over-Exploited / Critical / Semi-Critical
  note:
    'The 2023 state assessment places Pune district in the 50–70% development band with 8 talukas categorized Over-Exploited/Critical/Semi-Critical — a marked deterioration from the 2 semi-critical talukas of the 2013 assessment. Taluka-wise 2023 names/figures are on the INGRES portal (ingres.iith.ac.in).',
  ingresUrl: 'https://ingres.iith.ac.in',
}

/** Set on each data refresh: when these sources were last verified as the
 *  latest publicly available official surveys. */
export const DATA_LAST_VERIFIED = '2026-07-07'

export const DATA_VINTAGE_NOTE =
  `Figures reflect the cited official surveys — the latest publicly available for Pune district as verified on ${DATA_LAST_VERIFIED}: ` +
  'taluka layers & wells from CGWB 2013/NAQUIM (water levels 2017, exploration to 2018); district status updated from the GSDA/CGWB 2023 assessment. ' +
  'Groundwater conditions evolve — always confirm with a current field survey.'
