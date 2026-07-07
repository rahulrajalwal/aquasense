// CSV path for extending the training set with additional drilled-well
// records (e.g. GSDA data or field-collected outcomes). Rows use the same
// pre-drilling features as the CGWB pipeline.

import { TALUKAS_REAL, TALUKA_NAME_TO_ID, talukaByIdReal } from '../data/real/talukas'
import { featurizeReal, DISTRICT_MEDIANS } from './realFeatures'
import type { TrainingExample } from './logreg'

export interface CsvColumnDoc {
  name: string
  required: boolean
  desc: string
}

export const REAL_CSV_SCHEMA: CsvColumnDoc[] = [
  { name: 'taluka', required: true, desc: `Taluka id or name (${TALUKAS_REAL.map((t) => t.id).join(', ')})` },
  { name: 'pre_swl_m', required: true, desc: 'Pre-monsoon static water level, m bgl' },
  { name: 'post_swl_m', required: false, desc: 'Post-monsoon static water level, m bgl' },
  { name: 'aq1_bottom_m', required: false, desc: 'Bottom of weathered zone / Aquifer-I, m' },
  { name: 'aq2_bottom_m', required: false, desc: 'Depth of deeper fracture zone / Aquifer-II, m' },
  { name: 'aq2_thick_m', required: false, desc: 'Thickness of the Aquifer-II zone, m' },
  { name: 'outcome', required: true, desc: '1 = yielded ≥1 lps, 0 = poor/dry' },
]

export const REAL_EXAMPLE_CSV = [
  'taluka,pre_swl_m,post_swl_m,aq1_bottom_m,aq2_bottom_m,aq2_thick_m,outcome',
  'haveli,12,4.5,20,120,4,1',
  'baramati,45,30,15,75,0.5,0',
  'shirur,20,9.9,10,180,7,1',
].join('\n')

export function parseRealCsv(text: string): { examples: TrainingExample[]; errors: string[] } {
  const errors: string[] = []
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return { examples: [], errors: ['CSV needs a header row plus at least one record.'] }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const col = (name: string) => header.indexOf(name)
  for (const c of REAL_CSV_SCHEMA.filter((c) => c.required)) {
    if (col(c.name) === -1) errors.push(`Missing required column "${c.name}".`)
  }
  if (errors.length) return { examples: [], errors }

  const examples: TrainingExample[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim())
    const get = (name: string) => (col(name) >= 0 ? (cells[col(name)] ?? '') : '')
    const num = (name: string, fallback: number) => {
      const v = Number(get(name))
      return Number.isFinite(v) && get(name) !== '' ? v : fallback
    }

    const talukaRaw = get('taluka')
    const taluka =
      talukaByIdReal(talukaRaw.toLowerCase()) ??
      talukaByIdReal(TALUKA_NAME_TO_ID[talukaRaw] ?? '') ??
      TALUKAS_REAL.find((t) => t.name.toLowerCase().startsWith(talukaRaw.toLowerCase())) ??
      null
    if (!taluka) {
      errors.push(`Row ${i}: unknown taluka "${talukaRaw}"`)
      continue
    }
    const outcome = get('outcome')
    if (outcome !== '0' && outcome !== '1') {
      errors.push(`Row ${i}: outcome must be 0 or 1`)
      continue
    }
    const pre = Number(get('pre_swl_m'))
    if (!Number.isFinite(pre)) {
      errors.push(`Row ${i}: pre_swl_m must be numeric`)
      continue
    }

    examples.push({
      x: featurizeReal({
        taluka,
        preSwlM: pre,
        postSwlM: get('post_swl_m') === '' ? null : num('post_swl_m', pre * 0.55),
        aq1BottomM: num('aq1_bottom_m', DISTRICT_MEDIANS.aq1BottomM),
        aq2BottomM: num('aq2_bottom_m', DISTRICT_MEDIANS.aq2BottomM),
        aq2ThickM: num('aq2_thick_m', DISTRICT_MEDIANS.aq2ThickM),
      }),
      y: outcome === '1' ? 1 : 0,
    })
  }
  return { examples, errors: errors.slice(0, 8) }
}
