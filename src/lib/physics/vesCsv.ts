// Parse an uploaded Schlumberger VES sounding CSV (Mode 2).
// Expected columns (header row, case-insensitive): AB/2 (or ab2, spacing,
// electrode_spacing) and apparent resistivity (rhoa, resistivity, app_res).

import type { VESReading } from '../types'

export interface VesCsvResult {
  readings: VESReading[]
  errors: string[]
}

const SPACING_KEYS = ['ab/2', 'ab2', 'ab_2', 'spacing', 'electrode_spacing', 'electrode spacing', 'a', 's', 'l/2']
const RHO_KEYS = ['apparent_resistivity', 'apparent resistivity', 'rhoa', 'rho_a', 'resistivity', 'app_res', 'appres', 'rho']

export const VES_CSV_TEMPLATE = [
  'AB/2,apparent_resistivity',
  '1.5,42',
  '2,40',
  '3,38',
  '4.5,35',
  '6.5,29',
  '10,26',
  '15,28',
  '22,35',
  '32,52',
  '46,80',
  '68,140',
  '100,260',
].join('\n')

function findCol(header: string[], keys: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const h = header[i].trim().toLowerCase()
    if (keys.includes(h)) return i
  }
  // loose contains-match fallback
  for (let i = 0; i < header.length; i++) {
    const h = header[i].trim().toLowerCase()
    if (keys.some((k) => h.includes(k))) return i
  }
  return -1
}

export function parseVesCsv(text: string): VesCsvResult {
  const errors: string[] = []
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))
  if (lines.length < 2) return { readings: [], errors: ['File needs a header row and at least a few readings.'] }

  const header = lines[0].split(/[,;\t]/).map((h) => h.trim())
  let sc = findCol(header, SPACING_KEYS)
  let rc = findCol(header, RHO_KEYS)

  // if the header looks numeric (no header row), assume col0 = AB/2, col1 = rho
  const headerLooksNumeric = header.every((h) => Number.isFinite(Number(h)))
  let startRow = 1
  if (sc === -1 || rc === -1) {
    if (headerLooksNumeric && header.length >= 2) {
      sc = 0
      rc = 1
      startRow = 0
    } else {
      if (sc === -1) errors.push('Could not find an AB/2 (electrode spacing) column.')
      if (rc === -1) errors.push('Could not find an apparent-resistivity column.')
      return { readings: [], errors }
    }
  }

  const readings: VESReading[] = []
  for (let i = startRow; i < lines.length; i++) {
    const cells = lines[i].split(/[,;\t]/)
    const s = Number(cells[sc])
    const rhoA = Number(cells[rc])
    if (!Number.isFinite(s) || !Number.isFinite(rhoA)) continue
    if (s <= 0 || rhoA <= 0) continue
    readings.push({ s, rhoA })
  }
  readings.sort((a, b) => a.s - b.s)
  if (readings.length < 5) {
    errors.push(`Only ${readings.length} valid readings found — need at least 5 to invert a reliable layered model.`)
  }
  return { readings, errors }
}
