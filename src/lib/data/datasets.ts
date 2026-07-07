// Dataset registry shown on the Data Sources page and cited in reports.

export type DatasetStatus = 'integrated' | 'live' | 'planned'

export interface DatasetMeta {
  id: string
  name: string
  provider: string
  kind: string
  coverage: string
  resolution: string
  /** survey/assessment year of the data itself */
  year: string
  /** when the source document/portal was published or last updated */
  published?: string
  license: string
  status: DatasetStatus
  url?: string
  note: string
}

/** Date this registry was last checked against the issuing agencies. */
export const REGISTRY_LAST_VERIFIED = '2026-07-07'

export const DATASETS: DatasetMeta[] = [
  {
    id: 'gsda-2023',
    name: 'Dynamic Groundwater Resources of Maharashtra 2023',
    provider: 'GSDA (Govt. of Maharashtra) jointly with CGWB — report 2576/GWR/2024',
    kind: 'GEC-2015 groundwater resource assessment (recharge, extraction, categorization)',
    coverage: 'Maharashtra; Pune district status integrated',
    resolution: 'District (taluka detail via INGRES portal)',
    year: 'Assessment as on March 2023',
    published: '2024 (on gsda.maharashtra.gov.in, Feb 2025)',
    license: 'Government of Maharashtra publication',
    status: 'integrated',
    url: 'https://gsda.maharashtra.gov.in/wp-content/uploads/2025/02/GWRE-State-Report-2022-23_compressed.pdf',
    note: 'Newest verified assessment: Pune district development 50–70% band; 8 talukas Over-Exploited/Critical/Semi-Critical. Used to update the district status shown across the platform.',
  },
  {
    id: 'ingres',
    name: 'INGRES — India Ground Water Resource Estimation System',
    provider: 'CGWB with IIT Hyderabad',
    kind: 'Live portal for annual GEC assessments (2022, 2023, 2024, 2025…)',
    coverage: 'India, assessment-unit (taluka) level',
    resolution: 'Taluka / assessment unit',
    year: 'Annual — latest assessment 2025',
    published: 'Continuously updated portal',
    license: 'Government of India portal',
    status: 'live',
    url: 'https://ingres.iith.ac.in',
    note: 'The authoritative place for the newest taluka-wise categorization. Linked from the update checker; taluka-wise figures are not yet published as extractable tables, so scoring uses the latest published taluka table (2013) with vintage labels.',
  },
  {
    id: 'naquim-pune',
    name: 'NAQUIM Aquifer Mapping Report — Pune District',
    provider: 'Central Ground Water Board (CGWB), Central Region Nagpur',
    kind: 'Aquifer geometry, exploration wells, water levels, resources, management plan',
    coverage: 'Pune district (14 talukas)',
    resolution: 'Well-point (146 exploration/observation wells) + taluka',
    year: 'Study 2016–19; resources 2013; water levels 2017',
    license: 'Government of India publication',
    status: 'integrated',
    url: 'https://cgwb.gov.in/en/aquifer-mapping-and-management-plan',
    note: 'Primary dataset. Annexure-I powers the well map, the local-evidence engine, and the trained ML model (101 pump-tested wells). Aquifer-I/II characteristics from Table 5.1; taluka resources from Table 8.1.',
  },
  {
    id: 'cgwb-2013',
    name: 'Ground Water Information, Pune District (1810/DBR/2009)',
    provider: 'CGWB, Ministry of Water Resources, Central Region Nagpur (2013)',
    kind: 'District hydrogeology: rainfall, exploration summary, dugwell yields, resources',
    coverage: 'Pune district',
    resolution: 'Taluka',
    year: '2013 (rainfall series 2003–2012)',
    license: 'Government of India publication',
    status: 'integrated',
    url: 'https://cgwb.gov.in',
    note: 'Supplies taluka rainfall normals, exploration SWL/discharge ranges, formation-wise dugwell yields and yield-potential classes used across the platform.',
  },
  {
    id: 'osm',
    name: 'OpenStreetMap / CARTO Basemap',
    provider: 'OpenStreetMap contributors · CARTO',
    kind: 'Basemap tiles (roads, villages, rivers)',
    coverage: 'Global',
    resolution: 'Zoom-dependent tiles',
    year: 'Continuously updated',
    license: 'ODbL 1.0 / CARTO attribution',
    status: 'live',
    note: 'Interactive-map background tiles, fetched live.',
  },
  {
    id: 'gsda',
    name: 'Maharashtra GSDA / WRIS Well Census',
    provider: 'Groundwater Surveys & Development Agency, Govt. of Maharashtra',
    kind: 'State well census, watershed reports, deeper observation network',
    coverage: 'Maharashtra',
    resolution: 'Village/watershed',
    year: 'Varies by layer',
    license: 'State government data',
    status: 'planned',
    url: 'https://gsda.maharashtra.gov.in',
    note: 'Would densify village-level calibration beyond the 146 CGWB wells.',
  },
  {
    id: 'imd',
    name: 'IMD Gridded Rainfall',
    provider: 'India Meteorological Department',
    kind: '0.25° gridded daily rainfall, station normals',
    coverage: 'India',
    resolution: '0.25° grid',
    year: '1901–present',
    license: 'IMD data policy',
    status: 'planned',
    url: 'https://www.imdpune.gov.in',
    note: 'Would replace taluka rainfall normals with point rainfall at the exact site.',
  },
  {
    id: 'srtm',
    name: 'SRTM Digital Elevation Model',
    provider: 'NASA / USGS',
    kind: 'Elevation raster, slope derivation',
    coverage: 'Global',
    resolution: '30 m',
    year: 'v3 (2015)',
    license: 'Public domain',
    status: 'planned',
    url: 'https://earthexplorer.usgs.gov',
    note: 'Would add live elevation/slope at clicked points as model features.',
  },
  {
    id: 'gsi',
    name: 'GSI Geological Maps (Bhukosh)',
    provider: 'Geological Survey of India',
    kind: 'Lithology, structure, lineaments',
    coverage: 'India',
    resolution: '1:50,000',
    year: 'Series maps',
    license: 'GSI portal terms',
    status: 'planned',
    url: 'https://bhukosh.gsi.gov.in',
    note: 'Lineament proximity is a proven fracture-targeting feature for future model versions.',
  },
  {
    id: 'acwadam',
    name: 'ACWADAM Pune Aquifer Studies',
    provider: 'ACWADAM (Pune hydrogeology institute)',
    kind: 'Published local aquifer studies, spring/well inventories',
    coverage: 'Pune region case studies',
    resolution: 'Study-area specific',
    year: 'Various',
    license: 'Published literature (cite per paper)',
    status: 'planned',
    url: 'https://acwadam.org',
    note: 'High-quality local calibration and validation material.',
  },
]

export const STATUS_LABELS: Record<DatasetStatus, string> = {
  integrated: 'INTEGRATED — powers the platform',
  live: 'LIVE — fetched at runtime',
  planned: 'PLANNED — future expansion',
}
