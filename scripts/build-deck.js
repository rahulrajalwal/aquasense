// Builds the AquaSense AI presentation (18 slides, dark engineering theme).
// Output: NSG_Project/presentation/AquaSense_AI_Presentation.pptx
const path = require('path')
const pptxgen = require('pptxgenjs')

const SHOTS = path.join(__dirname, '..', 'docs', 'screenshots')
const OUT = path.join(__dirname, '..', '..', 'presentation', 'AquaSense_AI_Presentation.pptx')

// palette (app-matched)
const BG = '0A1626'
const CARD = '13233D'
const CARD2 = '0F1D33'
const WHITE = 'F4F8FC'
const BODY = 'BCCCE0'
const MUTED = '7E93AF'
const CYAN = '22D3EE'
const BLUE = '3B82F6'
const GREEN = '34D399'
const AMBER = 'FBBF24'
const RED = 'FB7185'
const F = 'Calibri'

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9' // 10 x 5.625
pres.author = 'AquaSense AI — EH 611 Near Surface Geophysics'
pres.title = 'AquaSense AI: Smart Borewell Site Recommendation System'

const shadow = () => ({ type: 'outer', color: '000000', blur: 8, offset: 3, angle: 90, opacity: 0.35 })

function baseSlide() {
  const s = pres.addSlide()
  s.background = { color: BG }
  return s
}

/** standard content slide header; returns content top y */
function header(s, kicker, title) {
  s.addText(kicker.toUpperCase(), {
    x: 0.5, y: 0.32, w: 9, h: 0.3, fontFace: F, fontSize: 12, bold: true,
    color: CYAN, charSpacing: 3, margin: 0,
  })
  s.addText(title, {
    x: 0.5, y: 0.6, w: 9, h: 0.62, fontFace: F, fontSize: 30, bold: true,
    color: WHITE, margin: 0,
  })
  return 1.38
}

function card(s, x, y, w, h, fill = CARD) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, fill: { color: fill }, rectRadius: 0.07, shadow: shadow(),
    line: { color: '223655', width: 0.75 },
  })
}

/** screenshot in a framed card. shots are 1.6:1 */
function shot(s, file, x, y, w, capText) {
  const h = w / 1.6
  card(s, x - 0.05, y - 0.05, w + 0.1, h + 0.1, CARD2)
  s.addImage({ path: path.join(SHOTS, file), x, y, w, h })
  if (capText) {
    s.addText(capText, {
      x: x - 0.05, y: y + h + 0.07, w: w + 0.1, h: 0.26, fontFace: F, fontSize: 10.5,
      color: MUTED, align: 'center', margin: 0,
    })
  }
  return h
}

function stat(s, x, y, w, h, value, label, color = CYAN, valueSize = 30) {
  card(s, x, y, w, h)
  s.addText(value, {
    x: x + 0.15, y: y + 0.08, w: w - 0.3, h: valueSize >= 30 ? 0.55 : 0.45,
    fontFace: F, fontSize: valueSize, bold: true, color, margin: 0,
  })
  s.addText(label, {
    x: x + 0.15, y: y + (valueSize >= 30 ? 0.66 : 0.56), w: w - 0.3, h: h - (valueSize >= 30 ? 0.74 : 0.64),
    fontFace: F, fontSize: 11, color: BODY, margin: 0, valign: 'top',
  })
}

function chipRow(s, x, y, chips) {
  let cx = x
  for (const [text, color] of chips) {
    const w = 0.16 + text.length * 0.082
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: cx, y, w, h: 0.32, fill: { color: CARD2 }, rectRadius: 0.16,
      line: { color, width: 1 },
    })
    s.addText(text, {
      x: cx, y, w, h: 0.32, fontFace: F, fontSize: 10.5, bold: true, color,
      align: 'center', valign: 'middle', margin: 0,
    })
    cx += w + 0.15
  }
}

function bullets(s, x, y, w, h, items, opts = {}) {
  s.addText(
    items.map((t, i) => ({
      text: t,
      options: {
        bullet: { code: '2022', indent: 14 },
        breakLine: true,
        color: opts.color || BODY,
        paraSpaceAfter: opts.gap ?? 8,
      },
    })),
    { x, y, w, h, fontFace: F, fontSize: opts.size || 13, valign: 'top', margin: 0 },
  )
}

// ═══ 1. TITLE ═══════════════════════════════════════════════════════════
{
  const s = baseSlide()
  const h = shot(s, 'results.png', 5.35, 1.02, 4.35)
  s.addText('AquaSense AI', {
    x: 0.55, y: 1.28, w: 4.6, h: 0.85, fontFace: F, fontSize: 47, bold: true, color: WHITE, margin: 0,
  })
  s.addText('Smart Borewell Site Recommendation System', {
    x: 0.55, y: 2.14, w: 4.6, h: 0.75, fontFace: F, fontSize: 19, color: CYAN, margin: 0,
  })
  s.addText(
    'A decision-support platform for Pune district that predicts borewell success, depth and yield — from real CGWB data, transparent hydrogeology and machine learning.',
    { x: 0.55, y: 2.95, w: 4.5, h: 1.05, fontFace: F, fontSize: 12.5, color: BODY, margin: 0 },
  )
  chipRow(s, 0.55, 4.15, [
    ['146 CGWB wells', CYAN],
    ['ML · AUC 0.92', GREEN],
    ['VES physics', BLUE],
  ])
  s.addText('EH 611 — Near Surface Geophysics · course project', {
    x: 0.55, y: 4.95, w: 6, h: 0.3, fontFace: F, fontSize: 11, color: MUTED, margin: 0,
  })
  s.addNotes('AquaSense AI: an engineering decision-support system, not a demo website. Everything shown runs on published Central Ground Water Board data for Pune district.')
}

// ═══ 2. INTRODUCTION ════════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Introduction', 'What is AquaSense AI?')
  shot(s, 'home.png', 5.45, y + 0.12, 4.05, 'Live platform — home')
  bullets(s, 0.55, y + 0.15, 4.6, 3.0, [
    'A web platform that answers the three questions every borewell owner has: is there water, how deep, and what are my chances?',
    'Built for Pune district on Near Surface Geophysics (EH 611) principles: electrical resistivity, hydrogeology, aquifer mapping.',
    'Every prediction is explained factor by factor and traced to cited government data — no black boxes.',
    'Runs entirely in the browser: assessment, model training and PDF reports need no server.',
  ], { size: 13.5, gap: 10 })
  s.addNotes('Frame it as a product, then the science. The key differentiator: explainability and real data provenance.')
}

// ═══ 3. REAL PROBLEM ════════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'The real problem', 'Borewell failure is a national money pit')
  stat(s, 0.55, y + 0.1, 2.9, 1.28, '₹50k–2L', 'lost on every failed borewell — drilling is paid for whether or not water comes', RED)
  stat(s, 3.58, y + 0.1, 2.9, 1.28, '73.9%', "of Pune district's groundwater already developed (CGWB 2013 assessment)", AMBER)
  stat(s, 6.61, y + 0.1, 2.9, 1.28, '~50%', 'of the district is drought-prone rain-shadow terrain (Indapur, Baramati, Daund, Shirur…)', AMBER)
  stat(s, 0.55, y + 1.53, 2.9, 1.28, '2 talukas', 'semi-critical — Baramati (95.7%) & Purandhar (94.9%) — recharge now mandatory thinking', RED)
  stat(s, 3.58, y + 1.53, 2.9, 1.28, '65%', 'of the district area shows falling pre-monsoon water levels (2009–2018 trend)', AMBER)
  stat(s, 6.61, y + 1.53, 2.9, 1.28, '0 surveys', 'before most rural drills — sites picked by convenience or water-diviners', RED)
  s.addText('In Deccan basalt a productive fracture zone can sit 50 m from a dry hole — random siting is a gamble with a lakh-rupee stake.', {
    x: 0.55, y: y + 3.05, w: 8.96, h: 0.5, fontFace: F, fontSize: 13.5, italic: true, color: CYAN, margin: 0,
  })
  s.addNotes('All figures from the two CGWB reports. The 50-m point is the core physical reason siting matters: aquifers here are discrete weathered/fracture zones, not blankets.')
}

// ═══ 4. EXISTING CHALLENGES ═════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Existing challenges', 'Why the science rarely reaches the field')
  const items = [
    ['Random site selection', 'Spots chosen by convenience or copying a neighbour — never by hydrogeology.', RED],
    ['Invisible heterogeneity', 'Aquifer-II is thin, discrete fracture zones (0.5–12 m) — hit-or-miss without geophysics.', AMBER],
    ['No depth planning', 'Bores stop short of the saturated zone, or waste lakhs drilling dry massive basalt.', RED],
    ['Locked-up data', "CGWB's excellent well records sit in PDF annexures — invisible to the person about to drill.", CYAN],
    ['Costly consultants', 'Professional VES surveys and hydrogeologists exist, but access and awareness are limited.', AMBER],
    ['No feedback loop', 'Every failed bore is a data point that never reaches the next driller.', CYAN],
  ]
  items.forEach(([t, b, c], i) => {
    const x = 0.55 + (i % 3) * 3.03
    const yy = y + 0.1 + Math.floor(i / 3) * 1.62
    card(s, x, yy, 2.88, 1.47)
    s.addText(t, { x: x + 0.15, y: yy + 0.1, w: 2.6, h: 0.3, fontFace: F, fontSize: 13.5, bold: true, color: c, margin: 0 })
    s.addText(b, { x: x + 0.15, y: yy + 0.44, w: 2.6, h: 0.95, fontFace: F, fontSize: 10.5, color: BODY, margin: 0, valign: 'top' })
  })
  s.addNotes('The gap is not missing science — it is missing delivery. That framing sets up the solution slide.')
}

// ═══ 5. PROPOSED SOLUTION ═══════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Proposed solution', 'Put the whole decision pipeline in the browser')
  const cols = [
    ['1 · Real evidence', 'The complete CGWB exploration record — 146 wells — matched to the user’s exact location.', CYAN],
    ['2 · Transparent rules', 'Six weighted hydrogeological factors, each written out with its evidence. Auditable by a professor or a farmer.', BLUE],
    ['3 · Trained ML model', 'Logistic regression trained on 101 pump-tested wells predicts success probability with exact per-feature contributions.', GREEN],
    ['4 · Real physics', 'A 1-D Schlumberger VES engine inverts the user’s resistivity readings and finds the saturated layer.', AMBER],
  ]
  cols.forEach(([t, b, c], i) => {
    const x = 0.55 + i * 2.31
    card(s, x, y + 0.1, 2.16, 2.0)
    s.addText(t, { x: x + 0.14, y: y + 0.22, w: 1.9, h: 0.32, fontFace: F, fontSize: 13, bold: true, color: c, margin: 0 })
    s.addText(b, { x: x + 0.14, y: y + 0.58, w: 1.9, h: 1.42, fontFace: F, fontSize: 10.5, color: BODY, margin: 0, valign: 'top' })
  })
  card(s, 0.55, y + 2.35, 8.96, 0.78, CARD2)
  s.addText([
    { text: 'Headline output:  ', options: { color: MUTED, bold: true } },
    { text: 'probability = 0.55 × ML + 0.45 × rules', options: { color: CYAN, bold: true } },
    { text: '   →  verdict · depth window · yield class · confidence — every number explained.', options: { color: BODY } },
  ], { x: 0.75, y: y + 2.35, w: 8.6, h: 0.78, fontFace: F, fontSize: 13, valign: 'middle', margin: 0 })
  s.addNotes('Four evidence streams, one guided flow. The blend weights the calibrated model slightly above the rules.')
}

// ═══ 6. WHY PUNE ════════════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Study area', 'Why Pune district?')
  shot(s, 'map.png', 0.55, y + 0.12, 4.5, '146 CGWB wells · green ≥1 lps · red poor/dry · grey untested')
  bullets(s, 5.35, y + 0.15, 4.15, 3.3, [
    'Classic Deccan-trap hard rock — the hardest, most instructive terrain for borewell siting in India.',
    'Exceptional public data: a NAQUIM aquifer-mapping study + district report give 146 documented exploration wells.',
    'A natural laboratory: rainfall spans 474 mm (Daund) to 2,668 mm (Velhe) inside one district.',
    'High stakes: dense private-borewell market, two semi-critical talukas, falling water levels.',
    'Architecture is district-agnostic — adding districts is a data task, not a rebuild.',
  ], { size: 12.5, gap: 9 })
  s.addNotes('The map is live in the app — every marker is a real CGWB well with its pump-test result.')
}

// ═══ 7. OFFICIAL DATA SOURCES ═══════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Official data sources', 'Two published CGWB studies power everything')
  card(s, 0.55, y + 0.1, 4.42, 2.32)
  s.addText('CGWB NAQUIM — Aquifer Mapping & Management, Pune District', {
    x: 0.72, y: y + 0.22, w: 4.1, h: 0.52, fontFace: F, fontSize: 13.5, bold: true, color: CYAN, margin: 0,
  })
  bullets(s, 0.72, y + 0.82, 4.1, 1.55, [
    'Annexure-I: 146 exploration wells — coordinates, depths, water levels, aquifer geometry, pump-test yields',
    'Two-aquifer system characteristics (Table 5.1)',
    'Taluka groundwater resources, 2013 (Table 8.1)',
  ], { size: 10.5, gap: 5 })
  card(s, 5.13, y + 0.1, 4.42, 2.32)
  s.addText('CGWB (2013) — Ground Water Information, Pune District (1810/DBR/2009)', {
    x: 5.3, y: y + 0.22, w: 4.1, h: 0.52, fontFace: F, fontSize: 13.5, bold: true, color: CYAN, margin: 0,
  })
  bullets(s, 5.3, y + 0.82, 4.1, 1.55, [
    'Taluka rainfall normals 2003–2012',
    'Exploration ranges, dugwell yields by formation & elevation (Table-4)',
    'Yield-potential classes and drought-prone areas',
  ], { size: 10.5, gap: 5 })
  card(s, 0.55, y + 2.6, 9.0, 0.85, CARD2)
  s.addText([
    { text: 'Extraction rigour:  ', options: { bold: true, color: GREEN } },
    { text: 'script-parsed from the published PDFs, verified row by row (12 rows hand-corrected); source anomalies flagged in the dataset — never silently fixed. Full citations inside the app and every PDF report.', options: { color: BODY } },
  ], { x: 0.75, y: y + 2.6, w: 8.6, h: 0.85, fontFace: F, fontSize: 11.5, valign: 'middle', margin: 0 })
  s.addNotes('Both documents are Government of India publications. Mention the unit-ambiguity example (lps vs m3/hr) as evidence of careful cross-checking.')
}

// ═══ 8. SYSTEM ARCHITECTURE ═════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'System architecture', 'Three engines over one real data layer')
  const box = (x, yy, w, h, title, sub, c) => {
    card(s, x, yy, w, h)
    s.addText(title, { x: x + 0.1, y: yy + 0.08, w: w - 0.2, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: c, margin: 0 })
    s.addText(sub, { x: x + 0.1, y: yy + 0.4, w: w - 0.2, h: h - 0.5, fontFace: F, fontSize: 9.5, color: BODY, margin: 0, valign: 'top' })
  }
  // left: data layer
  box(0.55, y + 0.75, 2.25, 1.9, 'REAL DATA LAYER', '146 CGWB wells\n14 taluka layers\n2-aquifer system\n(TypeScript modules,\nfully cited)', CYAN)
  // middle: engines
  box(3.3, y + 0.1, 2.6, 1.02, 'EVIDENCE GATHERER', 'nearest wells ≤15 km → taluka → district medians · coverage grade', BLUE)
  box(3.3, y + 1.24, 2.6, 1.02, 'ML MODEL', 'logistic regression · 9 features · trained on 101 pump-tested wells', GREEN)
  box(3.3, y + 2.38, 2.6, 1.02, 'VES PHYSICS', 'Schlumberger 1-D forward (Stefanescu + Hankel) + inversion', AMBER)
  // right: output
  box(6.7, y + 0.75, 2.85, 1.9, 'BLENDED ASSESSMENT', '0.55 × ML + 0.45 × rules\nprobability · depth window · yield · confidence\nfactor breakdown · ML contributions · Q&A · PDF report', WHITE)
  // arrows — LINE shapes need non-negative w/h; use flips for direction
  const arrow = (x1, y1, x2, y2) =>
    s.addShape(pres.shapes.LINE, {
      x: Math.min(x1, x2), y: Math.min(y1, y2),
      w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
      flipH: x2 < x1, flipV: y2 < y1,
      line: { color: MUTED, width: 1.75, endArrowType: 'triangle' },
    })
  arrow(2.8, y + 1.7, 3.3, y + 0.61)
  arrow(2.8, y + 1.7, 3.3, y + 1.75)
  arrow(2.8, y + 1.7, 3.3, y + 2.89)
  arrow(5.9, y + 0.61, 6.7, y + 1.55)
  arrow(5.9, y + 1.75, 6.7, y + 1.7)
  arrow(5.9, y + 2.89, 6.7, y + 1.85)
  s.addText('User inputs (location, water level, VES readings) enter the evidence gatherer and the physics engine; no backend — everything runs client-side.', {
    x: 0.55, y: y + 3.52, w: 9, h: 0.3, fontFace: F, fontSize: 10.5, color: MUTED, margin: 0,
  })
  s.addNotes('Emphasize: one featurizer shared by training and prediction (no leakage), and the deterministic seeded training that ships as generated TypeScript.')
}

// ═══ 9. WORKFLOW ════════════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Workflow', 'From village name to drilling plan in four steps')
  const steps = [
    ['1', 'Location', 'Taluka + village, or click the exact plot on the wells map.', CYAN],
    ['2', 'What you know', 'Water level, bore depths, neighbours’ outcomes — all optional.', BLUE],
    ['3', 'Data match', 'Nearest CGWB wells shown; platform asks for VES readings when they will sharpen the answer.', AMBER],
    ['4', 'Assessment', 'Blended probability, depth window, yield, confidence — explained and exportable.', GREEN],
  ]
  steps.forEach(([n, t, b, c], i) => {
    const x = 0.55 + i * 2.36
    card(s, x, y + 0.15, 2.16, 1.78)
    s.addShape(pres.shapes.OVAL, { x: x + 0.14, y: y + 0.29, w: 0.42, h: 0.42, fill: { color: CARD2 }, line: { color: c, width: 1.5 } })
    s.addText(n, { x: x + 0.14, y: y + 0.29, w: 0.42, h: 0.42, fontFace: F, fontSize: 15, bold: true, color: c, align: 'center', valign: 'middle', margin: 0 })
    s.addText(t, { x: x + 0.66, y: y + 0.33, w: 1.45, h: 0.35, fontFace: F, fontSize: 13, bold: true, color: WHITE, margin: 0 })
    s.addText(b, { x: x + 0.14, y: y + 0.83, w: 1.9, h: 1.0, fontFace: F, fontSize: 10, color: BODY, margin: 0, valign: 'top' })
    if (i < 3) s.addText('→', { x: x + 2.14, y: y + 0.85, w: 0.24, h: 0.4, fontFace: F, fontSize: 16, color: CYAN, align: 'center', margin: 0 })
  })
  card(s, 0.55, y + 2.2, 9.0, 1.15, CARD2)
  s.addText([
    { text: 'The progressive ask:  ', options: { bold: true, color: AMBER } },
    { text: 'the platform requests resistivity data only after matching your inputs against the CGWB record — when the result sits in the uncertain band or coverage is sparse, a VES changes the decision; otherwise you can skip it and still get a data-backed answer.', options: { color: BODY } },
  ], { x: 0.75, y: y + 2.28, w: 8.6, h: 1.0, fontFace: F, fontSize: 12, valign: 'middle', margin: 0 })
  s.addNotes('This slide answers "how does a farmer actually use it". The progressive VES ask is the signature interaction.')
}

// ═══ 10. WEBSITE MODULES ════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Website modules', 'Nine pages, one product')
  const grid = [
    ['home.png', 'Home'],
    ['study.png', 'Study Area — 14 talukas'],
    ['map.png', 'Interactive wells map'],
    ['dashboard.png', 'Taluka dashboard'],
    ['mllab.png', 'ML Lab — model transparency'],
    ['report.png', 'PDF report generator'],
  ]
  grid.forEach(([f, cap], i) => {
    const x = 0.65 + (i % 3) * 3.1
    const yy = y + 0.1 + Math.floor(i / 3) * 2.0 // 2.0 step: caption clears the next row
    shot(s, f, x, yy, 2.55, cap)
  })
  s.addNotes('Also: the Analyze wizard (next slide), Data Sources registry with citations, and About. All dark-theme, responsive, client-side.')
}

// ═══ 11. LIVE DEMONSTRATION FLOW ════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Live demonstration', 'The guided assessment, end to end')
  shot(s, 'wizard.png', 0.55, y + 0.35, 2.95, 'Step 1–2 · location + what you know')
  shot(s, 'datamatch.png', 3.72, y + 0.35, 2.95, 'Step 3 · CGWB match + VES ask')
  shot(s, 'results.png', 6.89, y + 0.35, 2.95, 'Step 4 · explained assessment')
  s.addText('→', { x: 3.42, y: y + 1.05, w: 0.3, h: 0.4, fontFace: F, fontSize: 18, bold: true, color: CYAN, align: 'center', margin: 0 })
  s.addText('→', { x: 6.59, y: y + 1.05, w: 0.3, h: 0.4, fontFace: F, fontSize: 18, bold: true, color: CYAN, align: 'center', margin: 0 })
  card(s, 0.55, y + 2.75, 9.3, 0.85, CARD2)
  s.addText([
    { text: 'Demo case — Lavale (Mulshi):  ', options: { bold: true, color: GREEN } },
    { text: 'nearest CGWB well is Lavale itself (the district’s best: ~30.7 lps at 85 m). Verdict: Favourable, 72% probability, strike 10–20 m, drill 65–85 m.', options: { color: BODY } },
  ], { x: 0.75, y: y + 2.75, w: 8.9, h: 0.85, fontFace: F, fontSize: 12, valign: 'middle', margin: 0 })
  s.addNotes('For the live demo: Map → click Lavale → Analyze near this well → skip/enter water level 8 m → invert the example sounding → run. Total ~90 seconds.')
}

// ═══ 12. AI RECOMMENDATION ENGINE ═══════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'AI recommendation engine', 'Trained on real outcomes, explainable by design')
  // left: native chart of learned weights
  card(s, 0.55, y + 0.1, 5.1, 3.42)
  s.addText('Learned weights (standardized) — what drives success', {
    x: 0.75, y: y + 0.2, w: 4.7, h: 0.3, fontFace: F, fontSize: 12.5, bold: true, color: WHITE, margin: 0,
  })
  s.addChart(pres.charts.BAR, [{
    name: 'weight',
    labels: ['Aquifer-II thickness', 'GW dev. stage', 'Aquifer-I depth', 'Aq-II zone depth', 'Yield potential', 'Rainfall (log)', 'Drought-prone', 'WL recovery', 'Pre-monsoon WL'],
    values: [1.131, 0.127, 0.037, -0.061, -0.069, -0.106, -0.135, -0.220, -0.805],
  }], {
    x: 0.7, y: y + 0.55, w: 4.8, h: 2.85, barDir: 'bar',
    chartColors: [GREEN], invertedColors: [RED],
    chartArea: { fill: { color: CARD } },
    catAxisLabelColor: BODY, valAxisLabelColor: MUTED,
    catAxisLabelFontSize: 9, valAxisLabelFontSize: 9,
    catAxisLabelPos: 'low', // keep labels clear of bars crossing the zero axis
    valGridLine: { color: '26436B', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false, showValue: false,
    valAxisLineColor: '26436B', catAxisLineColor: '26436B',
  })
  // right: model card
  stat(s, 5.85, y + 0.1, 1.85, 1.05, '101', 'pump-tested wells (66 ✓ / 35 dry)', CYAN, 24)
  stat(s, 7.8, y + 0.1, 1.75, 1.05, '80%', 'validation accuracy (25 held-out wells)', GREEN, 24)
  stat(s, 5.85, y + 1.3, 1.85, 1.05, '0.92', 'ROC AUC — strong ranking power', GREEN, 24)
  stat(s, 7.8, y + 1.3, 1.75, 1.05, '0.88', 'F1 score at the 1 lps success threshold', GREEN, 24)
  card(s, 5.85, y + 2.5, 3.7, 1.02, CARD2)
  s.addText('Only pre-drilling knowables as features — the pump-test result never leaks in. Training is seeded and reproducible in the browser (ML Lab).', {
    x: 6.0, y: y + 2.5, w: 3.42, h: 1.02, fontFace: F, fontSize: 10.5, color: BODY, valign: 'middle', margin: 0,
  })
  s.addNotes('The weights match hydrogeological intuition: thick Aquifer-II fracture zones help most; a deep pre-monsoon water table hurts most. That agreement between ML and domain knowledge is the credibility argument.')
}

// ═══ 13. RESULTS ════════════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Results', 'Validated on held-out wells, sensible in the field')
  // case cards
  const cse = (x, title, verdict, vc, lines) => {
    card(s, x, y + 0.1, 4.42, 1.98)
    s.addText(title, { x: x + 0.16, y: y + 0.2, w: 4.1, h: 0.3, fontFace: F, fontSize: 13, bold: true, color: WHITE, margin: 0 })
    s.addText(verdict, { x: x + 0.16, y: y + 0.52, w: 4.1, h: 0.34, fontFace: F, fontSize: 15, bold: true, color: vc, margin: 0 })
    bullets(s, x + 0.16, y + 0.94, 4.1, 1.05, lines, { size: 10.5, gap: 4 })
  }
  cse(0.55, 'Lavale · Mulshi (ghat fringe)', '✓ Favourable — 72%', GREEN, [
    'ML 74% · rules 70% — engines agree',
    'Strike 10–20 m · drill 65–85 m · confidence 78%',
    'Matches reality: the CGWB Lavale well is the district’s best (~30.7 lps)',
  ])
  cse(5.13, 'Nimone · Shirur (rain shadow)', '◐ Marginal — 61%', AMBER, [
    'Drought-prone taluka at 89.6% development',
    'Platform explicitly asks for a VES before committing',
    'Assessment spread across talukas: 38–81% — the model discriminates',
  ])
  // validation strip
  card(s, 0.55, y + 2.32, 9.0, 1.05, CARD2)
  s.addText([
    { text: 'Validation (25 held-out wells):  ', options: { bold: true, color: CYAN } },
    { text: 'accuracy 80% · AUC 0.921 · precision 78% · recall 100% · F1 0.88   |   confusion: TP 18 · FP 5 · TN 2 · FN 0   |   30-check automated verification suite passes (dataset integrity, reproducibility, 28 structural assessment tests).', options: { color: BODY } },
  ], { x: 0.75, y: y + 2.32, w: 8.6, h: 1.05, fontFace: F, fontSize: 11.5, valign: 'middle', margin: 0 })
  s.addNotes('Be honest about FP=5/TN=2: on a small validation set the model over-predicts success at the 0.5 threshold — which is why the product reports calibrated probability blended with rules, never a bare yes/no.')
}

// ═══ 14. ADVANTAGES ═════════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Advantages', 'What makes this different')
  const items = [
    ['Real data, cited', 'Every number traces to a published CGWB table — citations in the UI and in every PDF report.', CYAN],
    ['Explainable twice over', 'Rule factors written in plain language and exact ML logit contributions, side by side.', GREEN],
    ['Physics inside', 'A real VES forward model + inversion — not a lookup table — interprets user soundings.', BLUE],
    ['Progressive by design', 'Works with just a taluka name; gets sharper with coordinates, water levels, VES.', AMBER],
    ['Zero infrastructure', 'Static site: assessment, training and reports run client-side. Free to host, private by default.', CYAN],
    ['Reproducible science', 'Seeded training, shipped as generated code; anyone can retrain and verify in the ML Lab.', GREEN],
  ]
  items.forEach(([t, b, c], i) => {
    const x = 0.55 + (i % 3) * 3.03
    const yy = y + 0.1 + Math.floor(i / 3) * 1.62
    card(s, x, yy, 2.88, 1.47)
    s.addText(t, { x: x + 0.15, y: yy + 0.1, w: 2.6, h: 0.3, fontFace: F, fontSize: 13, bold: true, color: c, margin: 0 })
    s.addText(b, { x: x + 0.15, y: yy + 0.44, w: 2.6, h: 0.95, fontFace: F, fontSize: 10.5, color: BODY, margin: 0, valign: 'top' })
  })
  s.addNotes('If asked "why not a bigger neural network": 101 samples. A linear model with domain features is the defensible choice, and interpretability is a product requirement here.')
}

// ═══ 15. LIMITATIONS ════════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Limitations', 'Stated honestly — in the app, too')
  bullets(s, 0.55, y + 0.15, 4.5, 3.3, [
    'Data vintage: resources 2013, water levels 2017 — current conditions may differ; the app says so everywhere.',
    '101 labelled wells is a small training set; confidence intervals on the metrics are wide.',
    'Taluka-level layers + nearest-well medians — no continuous spatial interpolation yet.',
    'Success threshold (1 lps) is a convention; sensitivity to it is unexplored.',
  ], { size: 12.5, gap: 9 })
  bullets(s, 5.35, y + 0.15, 4.2, 3.3, [
    'Pune-district only — the model must not be applied to other geology unretrained.',
    'The ML slightly over-predicts success at the 0.5 cut-off (FP 5 / TN 2 on validation) — mitigated by probability output + rule blend + confidence capping.',
    'VES interpretation assumes 1-D layered earth — dipping contacts and dykes need field judgement.',
    'Decision support, not a survey: an on-site VES/ERT and a licensed hydrogeologist remain essential.',
  ], { size: 12.5, gap: 9 })
  s.addNotes('Owning limitations is a strength in an academic setting; each one maps to a concrete future-scope item on the next slide.')
}

// ═══ 16. FUTURE SCOPE ═══════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Future scope', 'Each limitation has a concrete next step')
  const items = [
    ['Denser ground truth', 'Ingest GSDA well-census records via the built-in CSV pipeline; grow 101 → thousands of labelled wells.', CYAN],
    ['Live point data', 'IMD gridded rainfall + SRTM elevation/slope at the clicked point as model features.', BLUE],
    ['Spatial modelling', 'Kriging/co-kriging of water levels and yields; GSI lineament proximity for fracture targeting.', GREEN],
    ['Outcome feedback loop', 'Let drillers report actual results; periodic retraining with versioned model cards.', AMBER],
    ['More districts', 'The architecture is district-agnostic — replicate for other Deccan-trap districts as data allows.', CYAN],
    ['Field companion', 'Offline-capable mobile flow + Marathi localisation for on-site use by drilling crews.', BLUE],
  ]
  items.forEach(([t, b, c], i) => {
    const x = 0.55 + (i % 3) * 3.03
    const yy = y + 0.1 + Math.floor(i / 3) * 1.62
    card(s, x, yy, 2.88, 1.47)
    s.addText(t, { x: x + 0.15, y: yy + 0.1, w: 2.6, h: 0.3, fontFace: F, fontSize: 13, bold: true, color: c, margin: 0 })
    s.addText(b, { x: x + 0.15, y: yy + 0.44, w: 2.6, h: 0.95, fontFace: F, fontSize: 10.5, color: BODY, margin: 0, valign: 'top' })
  })
  s.addNotes('The CSV schema shipped in the ML Lab is the deliberate door for scaling the dataset — no code changes needed.')
}

// ═══ 17. CONCLUSION ═════════════════════════════════════════════════════
{
  const s = baseSlide()
  const y = header(s, 'Conclusion', 'Geophysics, delivered to the decision')
  s.addText(
    'AquaSense AI turns two published CGWB studies and the physics of EH 611 into a working decision-support product: a farmer types a village name and gets a cited, explained, probability-backed drilling recommendation — with the tool itself insisting on a confirmatory field survey.',
    { x: 0.55, y: y + 0.1, w: 9.0, h: 1.0, fontFace: F, fontSize: 15, color: BODY, margin: 0 },
  )
  stat(s, 0.55, y + 1.3, 2.9, 1.3, '146', 'real CGWB wells extracted, verified, mapped and modelled', CYAN)
  stat(s, 3.58, y + 1.3, 2.9, 1.3, 'AUC 0.92', 'validated success classifier — with every weight inspectable', GREEN)
  stat(s, 6.61, y + 1.3, 2.9, 1.3, '3 engines', 'evidence + rules + physics, blended and fully explained', BLUE)
  s.addText('Decision support, responsibly: data vintage disclosed, semi-critical talukas flagged, recharge encouraged, on-site surveys always recommended.', {
    x: 0.55, y: y + 2.85, w: 9.0, h: 0.5, fontFace: F, fontSize: 12.5, italic: true, color: AMBER, margin: 0,
  })
  s.addNotes('Close on the responsibility framing — it differentiates an engineering tool from a tech demo.')
}

// ═══ 18. THANK YOU ══════════════════════════════════════════════════════
{
  const s = baseSlide()
  s.addText('Thank you', {
    x: 0.55, y: 1.7, w: 8.9, h: 1.0, fontFace: F, fontSize: 54, bold: true, color: WHITE, margin: 0,
  })
  s.addText('Questions & live demo — the platform is running at localhost:3000', {
    x: 0.55, y: 2.75, w: 8.9, h: 0.45, fontFace: F, fontSize: 17, color: CYAN, margin: 0,
  })
  s.addText(
    'AquaSense AI · EH 611 Near Surface Geophysics\nData: Central Ground Water Board (NAQUIM Pune aquifer-mapping study; Ground Water Information, Pune District, 2013)\nDocumentation: technical docs · user manual · in-app Data Sources registry',
    { x: 0.55, y: 3.55, w: 8.9, h: 1.2, fontFace: F, fontSize: 12, color: MUTED, margin: 0 },
  )
  chipRow(s, 0.55, 4.85, [
    ['aquasense/docs', CYAN],
    ['ML Lab — reproduce the training live', GREEN],
  ])
  s.addNotes('Offer the 90-second live demo: map → Lavale → assessment.')
}

pres.writeFile({ fileName: OUT }).then(() => console.log('written:', OUT))
