// Local dataset manifest — mirrors public/data-manifest.json. The update
// checker compares this against the remote manifest published with the
// latest deployment of the app.

export const LOCAL_MANIFEST = {
  datasetVersion: 3,
  releasedAt: '2026-07-07',
  summary:
    'CGWB 2013 district report + NAQUIM Annexure-I wells (146) + GSDA/CGWB 2023 district assessment status',
}

/** Remote manifest of the latest published build (GitHub raw allows CORS). */
export const REMOTE_MANIFEST_URL =
  'https://raw.githubusercontent.com/rahulrajalwal/aquasense/main/public/data-manifest.json'

/** Portals to watch for newer official surveys than the bundled ones. */
export const OFFICIAL_UPDATE_PORTALS = [
  { name: 'INGRES (annual taluka assessments)', url: 'https://ingres.iith.ac.in' },
  { name: 'GSDA Maharashtra reports', url: 'https://gsda.maharashtra.gov.in/en-reports/' },
  { name: 'CGWB publications', url: 'https://cgwb.gov.in/cgwbpnm/' },
]
