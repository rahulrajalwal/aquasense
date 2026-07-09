// ─────────────────────────────────────────────────────────────────────────
//  Geoelectric knowledge base — the "textbook" behind the VES interpretation.
//
//  Holds the four Deccan-trap rock types, the standard resistivity reference
//  table (with the overlaps that make interpretation a reasoning task, not a
//  lookup), the sounding-curve-type classifier (H / K / A / Q and their
//  compounds), and a per-layer descriptor that returns both plain-language
//  prose and an explicit reasoning chain. Kept separate from interpret.ts so
//  the physics module and the UI can share one source of truth.
// ─────────────────────────────────────────────────────────────────────────

export type RockType = 'topsoil' | 'weathered-basalt' | 'fractured-basalt' | 'fresh-basalt'

/** Presentation for each rock type (label + cross-section colour). */
export const ROCK: Record<RockType, { label: string; color: string }> = {
  topsoil: { label: 'Top soil', color: '#c79a4b' },
  'weathered-basalt': { label: 'Weathered basalt (Aquifer-I)', color: '#22d3ee' },
  'fractured-basalt': { label: 'Fractured basalt (Aquifer-II)', color: '#3b82f6' },
  'fresh-basalt': { label: 'Fresh / massive basalt', color: '#64748b' },
}

// ── standard resistivity reference table ───────────────────────────────────
export interface RhoBand {
  material: string
  min: number
  max: number // Infinity → open-ended
  rock?: RockType // which interpreted rock this band maps to
  note: string
}

/** Typical resistivity ranges for Deccan-trap materials (Ω·m). The overlaps
 *  are deliberate and real — dry topsoil and saturated weathered basalt share
 *  ground, which is exactly why depth/position must be used alongside the
 *  number to classify a layer. */
export const RESISTIVITY_BANDS: RhoBand[] = [
  { material: 'Clay / saturated soil', min: 1, max: 20, note: 'very conductive — water held in fine clay' },
  { material: 'Top soil / dry murrum', min: 20, max: 80, rock: 'topsoil', note: 'surface cover, usually above the water table' },
  { material: 'Saturated weathered basalt — Aquifer-I', min: 20, max: 50, rock: 'weathered-basalt', note: 'shallow aquifer tapped by dug & bore wells' },
  { material: 'Fractured basalt — Aquifer-II', min: 50, max: 150, rock: 'fractured-basalt', note: 'deeper aquifer — water in interconnected joints' },
  { material: 'Fresh / massive basalt', min: 300, max: Infinity, rock: 'fresh-basalt', note: 'compact, impermeable basement rock' },
]

export const rangeLabel = (b: RhoBand) => (b.max === Infinity ? `${b.min}+ Ω·m` : `${b.min}–${b.max} Ω·m`)

/** The reference band that best represents a classified rock type. */
export function bandForRock(rock: RockType): RhoBand {
  return RESISTIVITY_BANDS.find((b) => b.rock === rock) ?? RESISTIVITY_BANDS[1]
}

// ── sounding-curve type (H / K / A / Q and compounds) ──────────────────────
export interface CurveTypeInfo {
  code: string // "H", "HA", "HKH", …
  name: string // "H-type" / "HKH-type (compound curve)"
  shape: string // one-line shape description
  meaning: string // hydrogeological interpretation
  favourability: 'good' | 'mixed' | 'poor'
  confidence: number // 0–100, how pronounced the defining contrasts are
}

const clampNum = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Letter for one resistivity triplet (top → middle → bottom). */
function triplet(a: number, b: number, c: number): 'H' | 'K' | 'A' | 'Q' {
  if (b < a && b < c) return 'H' // conductive minimum
  if (b > a && b > c) return 'K' // resistive maximum
  return c >= a ? 'A' : 'Q' // otherwise net-rising (A) or net-falling (Q)
}

const LETTER_SHAPE: Record<string, string> = {
  H: 'ρ dips to a low then rises (a conductive layer between two resistive ones)',
  K: 'ρ peaks then falls (a resistive layer between two conductive ones)',
  A: 'ρ rises steadily with depth',
  Q: 'ρ falls steadily with depth',
}

const LETTER_HYDRO: Record<string, string> = {
  H: 'a saturated weathered/fractured zone held between drier or more massive rock',
  K: 'a hard, massive band with aquifers above and/or below it',
  A: 'soft, moist cover hardening downward into dry massive rock',
  Q: 'resistive rock over progressively more conductive (often more saturated) material',
}

/** Hand-written meanings for the codes a Deccan two-aquifer sounding produces. */
const KNOWN_MEANING: Record<string, string> = {
  H: 'A single conductive layer between two resistive ones. In hard-rock terrain this low-resistivity middle layer is the textbook signature of a saturated weathered/fractured aquifer held between drier cover and massive basalt — a favourable curve for groundwater.',
  A: 'Resistivity rises steadily with depth: soft, moist cover passing down into progressively harder, drier rock. Groundwater prospects are shallow at best and deep massive basalt is unproductive.',
  K: 'A resistive layer between two more conductive ones — a hard, massive basalt band. Aquifers lie above or below this band, so a bore must pass through it to reach the deeper zone.',
  Q: 'Resistivity falls steadily with depth — resistive rock over progressively more conductive layers, often indicating deeper saturation or a clay-rich base.',
  HA: 'A shallow conductive zone (H — the weathered aquifer) followed by resistivity rising into hard basement (A). Typical of a single shallow weathered aquifer over massive basalt.',
  HK: 'A shallow conductive aquifer (H), then a resistive massive band over a more conductive layer (K) — a weathered aquifer above basalt that conceals a deeper conductive, possibly fractured, zone.',
  KH: 'A resistive band near the surface (K) over a deeper conductive low (H) — dry or massive cover hiding a deeper saturated fracture aquifer; the main target is at depth.',
  QH: 'Resistivity falls and then reaches a conductive low (H) — a deeper saturated / fractured zone beneath progressively softer material.',
  AK: 'Resistivity rises (A) to a resistive massive band that then breaks down into a more conductive layer (K) — a deep aquifer beneath competent basalt.',
  HKH: 'The classic Deccan two-aquifer signature: a shallow weathered aquifer (first H) and a deeper fracture zone (second H) separated by a competent massive-basalt band (K), all over a resistive basement — two stacked groundwater targets.',
}

const ordinalWord = ['first', 'second', 'third', 'fourth', 'fifth']

/**
 * Classify a layered resistivity sequence into its sounding-curve type.
 * Consecutive equal trend-letters are collapsed, so a five-layer monotonic
 * model reads "A", not "AAA" — matching how the curves are named in practice.
 */
export function classifyCurve(res: number[]): CurveTypeInfo | null {
  const r = res.filter((x) => x > 0)
  if (r.length < 3) return null

  const raw: ('H' | 'K' | 'A' | 'Q')[] = []
  for (let i = 0; i + 2 < r.length; i++) raw.push(triplet(r[i], r[i + 1], r[i + 2]))
  const letters = raw.filter((l, i) => i === 0 || l !== raw[i - 1])
  const code = letters.join('')

  const compound = letters.length > 1
  const name = `${code}-type${compound ? ' (compound curve)' : ''}`
  const shape = compound
    ? letters.map((l) => LETTER_SHAPE[l]).join(', then ')
    : LETTER_SHAPE[code]

  let meaning = KNOWN_MEANING[code]
  if (!meaning) {
    const segs = letters.map((l, i) => `${ordinalWord[i] ?? `${i + 1}th`} segment ${l} (${LETTER_HYDRO[l]})`)
    meaning = `A compound curve read top-down as ${letters.join('–')}: ${segs.join('; ')}.`
  }

  const favourability: CurveTypeInfo['favourability'] = code.includes('H')
    ? 'good'
    : code === 'A'
      ? 'poor'
      : 'mixed'

  // confidence from how strong the resistivity contrasts between layers are —
  // a sharp min/max is unambiguous, a gentle one is not.
  let logSum = 0
  for (let i = 0; i + 1 < r.length; i++) {
    logSum += Math.abs(Math.log10(r[i + 1] / r[i]))
  }
  const avgLog = logSum / Math.max(1, r.length - 1)
  const confidence = Math.round(clampNum(48 + avgLog * 78, 42, 96))

  return { code, name, shape, meaning, favourability, confidence }
}

// ── per-layer descriptor (prose + reasoning chain) ─────────────────────────
export interface ReasonStep {
  step: string
  text: string
}

export interface LayerDescription {
  explanation: string
  reasoning: ReasonStep[]
  matchConfidence: number // 0–100: how well the measured ρ fits the assigned band
}

/** How confidently a measured resistivity sits inside its reference band. */
export function bandMatch(rho: number, band: RhoBand): number {
  if (rho >= band.min && (band.max === Infinity || rho <= band.max)) {
    if (band.max === Infinity) return Math.round(clampNum(78 + Math.log10(rho / band.min) * 18, 78, 96))
    const center = (band.min + band.max) / 2
    const half = (band.max - band.min) / 2 || 1
    return Math.round(clampNum(95 - (Math.abs(rho - center) / half) * 20, 74, 95))
  }
  const edge = rho < band.min ? band.min : band.max
  const off = Math.abs(Math.log10(rho / edge))
  return Math.round(clampNum(70 - off * 130, 28, 68))
}

const MATERIAL: Record<RockType, string> = {
  topsoil: 'surface soil / weathered murrum cover',
  'weathered-basalt': 'soft, clayey weathered basalt',
  'fractured-basalt': 'jointed / fractured basalt',
  'fresh-basalt': 'dense, massive (unfractured) basalt',
}

/** Prose explanation + explicit reasoning chain for one interpreted layer. */
export function describeLayer(
  rock: RockType,
  rho: number,
  saturated: boolean,
  topM: number,
  bottomM: number | null,
): LayerDescription {
  const r = rho.toFixed(0)
  const band = bandForRock(rock)

  let explanation: string
  let hydro: string
  switch (rock) {
    case 'topsoil':
      if (rho < 30) {
        explanation = `≈${r} Ω·m at the surface — moist, clay-rich black-cotton / murrum soil. It is conductive because it retains moisture, but it lies above the water table and does not itself yield water to a bore.`
        hydro = 'moist surface cover above the water table — retains water but does not transmit it to a well'
      } else {
        explanation = `≈${r} Ω·m at the surface — dry surface soil / murrum. It is more resistive than the saturated weathered zone beneath because it sits above the water table and is unsaturated.`
        hydro = 'dry, unsaturated surface cover above the water table'
      }
      break
    case 'weathered-basalt':
      explanation = `≈${r} Ω·m — ${saturated ? 'saturated ' : ''}weathered basalt. The low resistivity is the classic signature of water held in the soft, clayey weathered mantle (Archie's law: water + clay lowers resistivity). This is the shallow Aquifer-I that open dug wells tap.`
      hydro = 'low resistivity = water held in the weathered mantle → shallow Aquifer-I'
      break
    case 'fractured-basalt':
      explanation = `≈${r} Ω·m — jointed / fractured basalt. It is more resistive than the weathered zone because the rock is harder, but the moderate value shows the fractures are water-filled rather than dry. This is the deeper Aquifer-II — the main target of a borewell.`
      hydro = 'moderate resistivity = water-filled fractures → deep Aquifer-II, the borewell target'
      break
    case 'fresh-basalt':
      explanation = `≈${r} Ω·m — fresh, massive basalt. The very high resistivity means dense, unfractured rock with almost no interconnected pore space, so it holds and transmits negligible water. It forms the impermeable basement beneath the aquifers.`
      hydro = 'very high resistivity = no interconnected pores → impermeable basement'
      break
  }

  const depthLabel = bottomM === null ? `${topM} m and below` : `${topM}–${bottomM} m`
  const matchConfidence = bandMatch(rho, band)
  const reasoning: ReasonStep[] = [
    { step: 'Measured resistivity', text: `≈${r} Ω·m, at ${depthLabel} depth.` },
    { step: 'Reference resistivity range', text: `Compared with the standard table → “${band.material}” (${rangeLabel(band)}); match confidence ${matchConfidence}%.` },
    { step: 'Possible lithology', text: `${MATERIAL[rock]} for the Deccan-trap sequence.` },
    { step: 'Hydrogeological interpretation', text: `${hydro.charAt(0).toUpperCase()}${hydro.slice(1)}.` },
    { step: 'Final layer classification', text: `${ROCK[rock].label}${saturated ? ' — water-bearing' : ''}.` },
  ]

  return { explanation, reasoning, matchConfidence }
}

/**
 * Honest description of what the interpretation engine does — shown in the UI
 * and the report so the app never overclaims commercial-grade inversion.
 */
export const INTERPRETATION_DISCLAIMER =
  'Educational rule-assisted VES interpretation calibrated using official CGWB/NAQUIM hydrogeological information. ' +
  'For uploaded soundings the layered-earth model is fitted by a simplified 1-D least-squares inversion (multi-seed ' +
  'coordinate descent on the Schlumberger forward solution), not commercial-grade software. Lithology is then assigned ' +
  'by rule-based classification of the layer resistivities. Always confirm with a professional survey before drilling.'
