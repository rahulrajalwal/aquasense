// Client-side PDF assessment report (jsPDF), generated from a RealAssessment.

import { jsPDF } from 'jspdf'
import type { RealAssessment } from './engine/assessReal'
import { wellOutcome } from './data/real/wells'
import { AQUIFERS, CITATIONS, DATA_VINTAGE_NOTE } from './data/real/hydro'
import { PRETRAINED_REAL } from './ml/pretrainedReal'
import { INTERPRETATION_DISCLAIMER } from './physics/geoelectrics'
import { soundingCurve } from './physics/ves'

const NAVY: [number, number, number] = [13, 31, 60]
const CYAN: [number, number, number] = [8, 145, 178]
const BODY: [number, number, number] = [55, 65, 81]
const MUTED: [number, number, number] = [120, 134, 156]
const AMBER: [number, number, number] = [180, 120, 10]

const M = 18
const W = 210
const CW = W - 2 * M

export function buildReportDoc(a: RealAssessment): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 0

  // jsPDF's built-in Helvetica is WinAnsi-only, so Greek/maths glyphs (Ω, ρ,
  // ≈, →, ≥…) render as garbage AND corrupt line metrics. Sanitise every
  // string to ASCII-safe equivalents at draw time.
  const san = (v: unknown): string =>
    String(v)
      .replace(/Ω/g, 'ohm')
      .replace(/ρ/g, 'rho')
      .replace(/ₐ/g, 'a')
      .replace(/₁/g, '1').replace(/₂/g, '2').replace(/₃/g, '3')
      .replace(/≈/g, '~')
      .replace(/→/g, '->')
      .replace(/≥/g, '>=').replace(/≤/g, '<=')
      .replace(/×/g, 'x')
      .replace(/\s*[✓✔]/g, '').replace(/[✗✘]/g, 'x')
      // strip any remaining arrows / dingbats / geometric symbols / emoji
      .replace(/[←-⇿⌀-➿⬀-⯿\uD800-\uDFFF]/g, '')
  const _text = doc.text.bind(doc)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(doc as any).text = (t: unknown, ...rest: unknown[]) => _text((Array.isArray(t) ? t.map(san) : san(t)) as string, ...(rest as [number, number]))
  const _split = doc.splitTextToSize.bind(doc)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(doc as any).splitTextToSize = (t: unknown, ...rest: unknown[]) => _split(san(t), ...(rest as [number]))

  const ensure = (h: number) => {
    if (y + h > 279) {
      doc.addPage()
      y = 20
    }
  }

  const heading = (text: string) => {
    ensure(18)
    y += 8
    doc.setFillColor(...CYAN)
    doc.rect(M, y - 4, 1.6, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12.5)
    doc.setTextColor(...NAVY)
    doc.text(text, M + 4.5, y)
    y += 7
  }

  const para = (text: string, size = 9.5, color = BODY) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, CW)
    for (const line of lines) {
      ensure(5)
      doc.text(line, M, y)
      y += 4.6
    }
    y += 1.5
  }

  const kvRows = (rows: [string, string][], keyW = 58) => {
    doc.setFontSize(9.5)
    for (const [k, val] of rows) {
      const lines = doc.splitTextToSize(val, CW - keyW)
      ensure(5 * lines.length + 1)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...MUTED)
      doc.text(k, M, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BODY)
      doc.text(lines, M + keyW, y)
      y += 4.8 * lines.length + 0.6
    }
    y += 1.5
  }

  const tableHeader = (cols: [string, number][]) => {
    ensure(9)
    doc.setFillColor(232, 240, 250)
    doc.rect(M, y - 4, CW, 6.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...NAVY)
    let x = M + 2
    for (const [label, w] of cols) {
      doc.text(label, x, y)
      x += w
    }
    y += 6
  }

  const tableRow = (cells: string[], cols: [string, number][], zebra: boolean) => {
    const cellLines = cells.map((c, i) => doc.splitTextToSize(c, cols[i][1] - 4))
    const h = Math.max(...cellLines.map((l) => l.length)) * 4.2 + 2.4
    ensure(h)
    if (zebra) {
      doc.setFillColor(246, 249, 253)
      doc.rect(M, y - 3.6, CW, h, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...BODY)
    let x = M + 2
    cellLines.forEach((lines, i) => {
      doc.text(lines, x, y)
      x += cols[i][1]
    })
    y += h
  }

  const site = a.input.placeName || `${a.taluka.name} site`

  // ═══ header band ═══════════════════════════════════════════════════
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 42, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(19)
  doc.text('AquaSense AI', M, 16)
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 220, 240)
  doc.text('Borewell Site Assessment Report', M, 23)
  doc.setFontSize(8.5)
  doc.setTextColor(190, 205, 225)
  doc.text(`${site}, ${a.taluka.name} Taluka, Pune District, Maharashtra`, M, 30)
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · Report AQS-${a.taluka.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    M,
    35,
  )
  doc.setFillColor(34, 150, 190)
  doc.rect(0, 42, W, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)
  doc.text(
    'ANALYSIS BUILT ON CGWB / NAQUIM PUNE-DISTRICT DATA · DECISION SUPPORT ONLY — CONFIRM WITH AN ON-SITE SURVEY BEFORE DRILLING',
    W / 2,
    46,
    { align: 'center' },
  )
  y = 58

  const vi = a.interpretation

  // small helpers for the geological figures
  const hexToRgb = (h: string): [number, number, number] => {
    const n = parseInt(h.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const drawCrossSection = () => {
    const boxH = 66
    ensure(boxH + 8)
    const x0 = M + 12
    const colW = 32
    const top0 = y
    const lastFinite = [...vi.layers].reverse().find((l) => l.bottomM !== null)?.bottomM ?? vi.maxDepthM
    const depthMax = Math.max(vi.maxDepthM, (lastFinite ?? 30) * 1.1, 20)
    const yOf = (d: number) => top0 + (Math.min(d, depthMax) / depthMax) * boxH
    vi.layers.forEach((l) => {
      const t = yOf(l.topM)
      const b = l.bottomM === null ? top0 + boxH : yOf(l.bottomM)
      doc.setFillColor(...hexToRgb(l.color))
      doc.rect(x0, t, colW, Math.max(b - t, 1.4), 'F')
    })
    doc.setDrawColor(180, 190, 205)
    doc.setLineWidth(0.2)
    doc.rect(x0, top0, colW, boxH)
    doc.setFontSize(6.5)
    doc.setTextColor(...MUTED)
    const step = depthMax > 120 ? 40 : depthMax > 60 ? 20 : 10
    for (let d = 0; d <= depthMax; d += step) doc.text(`${d}`, x0 - 2, yOf(d) + 1, { align: 'right' })
    doc.text('m', x0 - 2, top0 - 1, { align: 'right' })
    const wt = vi.derived.waterTableM
    if (wt > 0 && wt < depthMax) {
      doc.setDrawColor(56, 160, 210)
      doc.setLineWidth(0.5)
      doc.line(x0 - 1, yOf(wt), x0 + colW + 1, yOf(wt))
      doc.setTextColor(40, 120, 170)
      doc.setFontSize(6)
      doc.text(`WT ${wt} m`, x0 + colW + 1.5, yOf(wt) + 1)
    }
    let ly = top0 + 3
    const lx = x0 + colW + 20
    vi.layers.forEach((l) => {
      doc.setFillColor(...hexToRgb(l.color))
      doc.rect(lx, ly - 2.6, 3, 3, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...BODY)
      const rng = l.bottomM === null ? `${l.topM}+ m` : `${l.topM}–${l.bottomM} m`
      doc.text(`${l.rockLabel}  ·  ${rng}  ·  ${l.resistivity.toFixed(0)} Ω·m`, lx + 4.5, ly)
      ly += 5.4
    })
    y = top0 + boxH + 7
  }

  // log–log VES sounding curve (field surveys only): measured points + fit
  const drawSoundingCurve = () => {
    if (!vi.readings || !vi.readings.length) return
    const boxH = 50
    const boxW = CW - 28
    ensure(boxH + 12)
    const x0 = M + 16
    const top0 = y
    const rd = vi.readings
    const xs = rd.map((r) => r.s)
    const fitted = vi.fittedLayers ? soundingCurve(vi.fittedLayers, Math.min(...xs) * 0.85, Math.max(...xs) * 1.15, 40) : []
    const ally = [...rd.map((r) => r.rhoA), ...fitted.map((p) => p.rhoA)]
    const lxMin = Math.log10(Math.min(...xs) * 0.85)
    const lxMax = Math.log10(Math.max(...xs) * 1.15)
    const lyMin = Math.log10(Math.max(1, Math.min(...ally) * 0.8))
    const lyMax = Math.log10(Math.max(...ally) * 1.2)
    const px = (s: number) => x0 + ((Math.log10(s) - lxMin) / (lxMax - lxMin)) * boxW
    const py = (r: number) => top0 + boxH - ((Math.log10(r) - lyMin) / (lyMax - lyMin)) * boxH
    doc.setDrawColor(205, 214, 226)
    doc.setLineWidth(0.2)
    doc.rect(x0, top0, boxW, boxH)
    // decade gridlines + labels
    doc.setFontSize(6)
    doc.setTextColor(...MUTED)
    for (let e = Math.ceil(lyMin); e <= Math.floor(lyMax); e++) {
      const yy = py(Math.pow(10, e))
      doc.setDrawColor(232, 238, 246)
      doc.line(x0, yy, x0 + boxW, yy)
      doc.text(`${Math.pow(10, e)}`, x0 - 1.5, yy + 1, { align: 'right' })
    }
    for (let e = Math.ceil(lxMin); e <= Math.floor(lxMax); e++) {
      const xx = px(Math.pow(10, e))
      doc.text(`${Math.pow(10, e)}`, xx, top0 + boxH + 3.5, { align: 'center' })
    }
    // fitted model curve
    if (fitted.length) {
      doc.setDrawColor(34, 150, 190)
      doc.setLineWidth(0.6)
      for (let i = 1; i < fitted.length; i++) doc.line(px(fitted[i - 1].s), py(fitted[i - 1].rhoA), px(fitted[i].s), py(fitted[i].rhoA))
    }
    // measured points
    doc.setFillColor(214, 158, 20)
    rd.forEach((r) => doc.circle(px(r.s), py(r.rhoA), 0.85, 'F'))
    doc.setFontSize(6.5)
    doc.setTextColor(...MUTED)
    doc.text('AB/2 (m) — log', x0 + boxW / 2, top0 + boxH + 7, { align: 'center' })
    doc.text('rhoa (Ohm-m, log)', x0 - 12, top0 - 1.5)
    doc.setFillColor(214, 158, 20)
    doc.circle(x0 + boxW - 44, top0 + 2.5, 0.85, 'F')
    doc.text('measured', x0 + boxW - 41, top0 + 3.5)
    doc.setDrawColor(34, 150, 190)
    doc.setLineWidth(0.6)
    doc.line(x0 + boxW - 20, top0 + 2.5, x0 + boxW - 14, top0 + 2.5)
    doc.text('fitted', x0 + boxW - 12.5, top0 + 3.5)
    y = top0 + boxH + 11
  }

  // horizontal bar chart of the rule-engine factor scores
  const drawFactorBars = () => {
    const rowH = 6.6
    const labelW = 50
    const barX = M + labelW
    const barW = CW - labelW - 12
    a.factors.forEach((f) => {
      ensure(rowH)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.6)
      doc.setTextColor(...BODY)
      doc.text(doc.splitTextToSize(f.label, labelW - 2)[0], M, y + 0.8)
      doc.setFillColor(232, 238, 246)
      doc.roundedRect(barX, y - 2.6, barW, 3.4, 1, 1, 'F')
      const col: [number, number, number] = f.score >= 70 ? [52, 168, 120] : f.score >= 50 ? [34, 150, 190] : f.score >= 35 ? [214, 158, 20] : [216, 80, 100]
      doc.setFillColor(...col)
      doc.roundedRect(barX, y - 2.6, Math.max(1, (barW * f.score) / 100), 3.4, 1, 1, 'F')
      doc.setFontSize(7)
      doc.setTextColor(...MUTED)
      doc.text(`${f.score} · ${f.weightPct}%`, barX + barW + 2, y + 0.6)
      y += rowH
    })
    y += 2
  }

  // ═══ 1. Site information & inputs ══════════════════════════════════
  heading('1. Site information & inputs')
  kvRows([
    ['State / District', 'Maharashtra / Pune'],
    ['Taluka', a.taluka.name],
    ['Village / location', site],
    ['Coordinates', a.input.lat !== null ? `${a.input.lat.toFixed(4)}° N, ${a.input.lon!.toFixed(4)}° E` : 'Not provided (taluka-level assessment)'],
    ['Reported water table', a.input.knownWaterTableM !== '' ? `${a.input.knownWaterTableM} m bgl` : 'Not provided — CGWB local median used'],
    ['Nearby bore depth', a.input.nearbyBoreDepthM !== '' ? `${a.input.nearbyBoreDepthM} m` : 'Not provided'],
    ['Nearby bore outcomes', a.input.nearbyOutcome === 'unknown' ? 'Not known' : a.input.nearbyOutcome.replace('-', ' ')],
    ['VES survey source', a.paramSource === 'ves-survey' ? 'Field sounding uploaded & inverted' : 'Official CGWB interpreted layers'],
    ['Terrain', a.taluka.terrain],
  ])

  // ═══ 2. Official government data ═══════════════════════════════════
  heading('2. Official government survey data')
  for (const c of CITATIONS) para(`• ${c.full}`, 8.5)
  para(
    `${a.taluka.name}: normal rainfall ≈ ${a.taluka.rainfallMm} mm/yr; stage of groundwater development ${a.taluka.stagePct}% (${a.taluka.category}, 2013 taluka assessment — district-wide the 2023 GSDA/CGWB assessment reports the 50–70% band with 8 stressed talukas); ` +
      `aquifer yield potential "${a.taluka.yieldPotential}" (CGWB Table-8)${a.taluka.droughtProne ? '; classified drought-prone' : ''}. ` +
      `${a.evidence.talukaTested.length} pump-tested CGWB wells in the taluka` +
      (a.evidence.talukaSuccessRate !== null ? `, of which ${Math.round(a.evidence.talukaSuccessRate * 100)}% reached the 1 lps success threshold.` : '.'),
  )
  const wellsToShow = a.evidence.nearby.length
    ? a.evidence.nearby.map((n) => ({ w: n.well, tag: `${n.km} km` }))
    : a.evidence.talukaTested.slice(0, 6).map((w) => ({ w, tag: '—' }))
  if (wellsToShow.length) {
    const wCols: [string, number][] = [['CGWB well (village)', 46], ['Dist.', 16], ['Drilled', 18], ['WL pre', 18], ['Yield', 22], ['Aq-I', 16], ['Aq-II', 16], ['Outcome', 22]]
    tableHeader(wCols)
    wellsToShow.forEach(({ w, tag }, i) =>
      tableRow(
        [`${w.village} (${w.type})`, tag, w.depthM !== null ? `${w.depthM} m` : '—', w.preSwlM !== null ? `${w.preSwlM} m` : '—', w.yieldRaw, w.aq1BottomM !== null ? `${w.aq1BottomM}` : '—', w.aq2BottomM !== null ? `${w.aq2BottomM}` : '—', w.yieldLps === null ? 'untested' : wellOutcome(w) === 1 ? 'SUCCESS' : 'poor/dry'],
        wCols,
        i % 2 === 0,
      ),
    )
  }
  para(
    `${AQUIFERS.aq1.name}: ${AQUIFERS.aq1.depthRangeM[0]}–${AQUIFERS.aq1.depthRangeM[1]} m bgl. ${AQUIFERS.aq2.name}: ${AQUIFERS.aq2.depthRangeM[0]}–${AQUIFERS.aq2.depthRangeM[1]} m bgl; success depends on discrete fracture zones (NAQUIM).`,
    8.5, MUTED,
  )

  // ═══ 3. Uploaded VES survey & method ═══════════════════════════════
  heading('3. VES survey & method')
  para(
    a.paramSource === 'ves-survey'
      ? 'A field Schlumberger Vertical Electrical Sounding was uploaded for this plot and inverted into a layered-earth model.'
      : 'No field sounding was uploaded, so the official CGWB interpreted layers for this area were used as the geophysical basis. Uploading a plot-specific sounding would sharpen the result.',
  )
  para(vi.methodology, 9, NAVY)
  ensure(6)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...CYAN)
  doc.text('Why electrical resistivity survey works', M, y); y += 5
  para('• A current is injected into the ground through two electrodes and the voltage drop is measured across another pair; the ratio, scaled by geometry, gives the apparent resistivity.', 8.5)
  para('• Saturated weathered/fractured rock has low resistivity because pore water (with dissolved salts) conducts electricity.', 8.5)
  para('• Compact, unfractured basalt has high resistivity because it has almost no connected pore space to carry current.', 8.5)
  para('• Increasing the electrode spacing AB/2 drives the current deeper, so larger spacings investigate greater depths — the sounding is read shallow-to-deep.', 8.5)
  para('• Because each lithology has a characteristic resistivity range, the layered resistivity profile maps to a geological column.', 8.5)

  // ═══ 4. Apparent resistivity table ═════════════════════════════════
  heading('4. Apparent resistivity data')
  if (vi.readings && vi.readings.length) {
    para(
      vi.source === 'inverted'
        ? 'Field readings — apparent resistivity ρa at each half-spacing AB/2:'
        : 'Representative apparent-resistivity dataset, reconstructed from the official CGWB interpreted layers for the interpretation workflow (not original field readings):',
      8.5,
    )
    const rCols: [string, number][] = [['#', 12], ['AB/2 (m)', 40], ['ρa (Ω·m)', 40]]
    tableHeader(rCols)
    vi.readings.forEach((rd, i) => tableRow([`${i + 1}`, `${rd.s}`, rd.rhoA.toFixed(1)], rCols, i % 2 === 0))
  } else {
    para('Not available for this location.', 9, MUTED)
  }

  // ═══ 5. VES curve ══════════════════════════════════════════════════
  heading('5. VES sounding curve')
  para(
    vi.source === 'inverted'
      ? `Apparent resistivity (ρa) vs half-spacing (AB/2) on log–log axes. The best-fit ${vi.layers.length}-layer model (line) reproduces the measured points at ${vi.rmsLogPct}% RMS misfit (${vi.quality} resolution).`
      : `Representative apparent-resistivity curve reconstructed from the official CGWB interpreted layers (log–log axes). It shows the sounding the published ${vi.layers.length}-layer model would produce — it is not original field data.`,
  )
  drawSoundingCurve()

  // ═══ 6. Curve type ═════════════════════════════════════════════════
  heading('6. Curve-type identification')
  if (vi.curveType) {
    kvRows([
      ['Detected type', vi.curveType.name],
      ['Confidence', `${vi.curveType.confidence}%`],
      ['Hydrogeological meaning', vi.curveType.meaning],
    ])
  } else {
    para('Not enough layers to classify a standard curve type.', 9, MUTED)
  }

  // ═══ 7. Layer inversion — best-fit model ═══════════════════════════
  heading('7. Layer inversion — best-fit model')
  para('Estimated layer resistivity and thickness, with the confidence that each measured resistivity matches its assigned reference band:', 8.5)
  const lCols: [string, number][] = [['Depth (m bgl)', 38], ['ρ (Ω·m)', 22], ['Thickness (m)', 30], ['Fit', 18], ['Interpreted layer', 54]]
  tableHeader(lCols)
  vi.layers.forEach((l, i) =>
    tableRow(
      [l.bottomM === null ? `${l.topM} → (half-space)` : `${l.topM}–${l.bottomM}`, l.resistivity.toFixed(0), l.thicknessM === null ? '—' : `${l.thicknessM}`, `${l.matchConfidence}%`, l.rockLabel],
      lCols,
      i % 2 === 0,
    ),
  )

  // ═══ 8. Layer interpretation (reasoning) ═══════════════════════════
  heading('8. Layer interpretation — reasoning')
  vi.layers.forEach((l) => {
    ensure(8)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...CYAN)
    doc.text(`${l.rockLabel}  (${l.resistivity.toFixed(0)} Ω·m)`, M, y); y += 4.4
    l.reasoning.forEach((r) => para(`${r.step} → ${r.text}`, 8.3))
    y += 0.5
  })

  // ═══ 9. Geological cross-section ═══════════════════════════════════
  heading('9. Geological cross-section')
  drawCrossSection()

  // ═══ 10. Hydrogeological / aquifer parameters ══════════════════════
  heading('10. Hydrogeological parameters (auto-extracted from the VES)')
  kvRows([
    ['Water table', `≈ ${vi.derived.waterTableM} m bgl`],
    ['Aquifer-I bottom (weathered)', `≈ ${vi.derived.aq1BottomM} m`],
    ['Aquifer-II depth (fractured)', `≈ ${vi.derived.aq2BottomM} m`],
    ['Aquifer-II productive thickness', `≈ ${vi.derived.aq2ThickM} m`],
  ])
  para('These parameters are derived directly from the resistivity interpretation, not entered by hand, and are the aquifer inputs to the machine-learning model.', 8.5, NAVY)

  // ═══ 11. Machine-learning analysis ═════════════════════════════════
  heading('11. Machine-learning analysis')
  para(
    `Logistic-regression classifier trained on ${PRETRAINED_REAL.nTrain + PRETRAINED_REAL.nVal} pump-tested CGWB wells ` +
      `(validation accuracy ${(PRETRAINED_REAL.valMetrics.accuracy * 100).toFixed(0)}%, AUC ${PRETRAINED_REAL.valMetrics.auc.toFixed(2)}, F1 ${PRETRAINED_REAL.valMetrics.f1.toFixed(2)}). ` +
      'It is the final decision-support stage over the VES-derived parameters. Largest feature contributions for this site (signed logits):',
  )
  const mCols: [string, number][] = [['Feature', 90], ['Contribution', 40], ['Direction', 44]]
  tableHeader(mCols)
  a.mlContributions.slice(0, 6).forEach((c, i) => tableRow([c.name, c.logit.toFixed(3), c.logit >= 0 ? 'raises probability' : 'lowers probability'], mCols, i % 2 === 0))
  para('Transparent rule-engine factor scores (over the same evidence) — score · weight:', 8.5)
  drawFactorBars()
  a.factors.forEach((f) => para(`• ${f.label}: ${f.detail}`, 7.8, MUTED))

  // ═══ 12. Groundwater prediction ════════════════════════════════════
  heading('12. Groundwater prediction')
  ensure(16)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...NAVY)
  doc.text(`Groundwater success probability: ${a.probability}%  (ML ${a.mlProbability}% · rules ${a.ruleProbability}%)`, M, y)
  y += 3
  doc.setFillColor(226, 232, 240)
  doc.roundedRect(M, y, CW, 5, 2, 2, 'F')
  const pc: [number, number, number] = a.probability >= 65 ? [52, 168, 120] : a.probability >= 45 ? [214, 158, 20] : [216, 80, 100]
  doc.setFillColor(...pc)
  doc.roundedRect(M, y, (CW * a.probability) / 100, 5, 2, 2, 'F')
  y += 11
  kvRows([
    ['Verdict', a.verdict.toUpperCase()],
    ['Expected water strike', `${a.waterStrikeM[0]}–${a.waterStrikeM[1]} m below ground`],
    ['Recommended drilling depth', `${a.recommendedDepthM[0]}–${a.recommendedDepthM[1]} m`],
    ['Expected aquifer', a.aquiferType],
    ['Expected yield', `${a.yieldCategory} (~${a.yieldLph[0].toLocaleString()}–${a.yieldLph[1].toLocaleString()} litres/hour)`],
    ['Confidence', `${a.confidencePct}% (${a.confidence}) — coverage ${a.evidence.coverage}`],
  ])
  para(a.verdictText)

  // ═══ 13. Engineering recommendation ════════════════════════════════
  heading('13. Engineering recommendation')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...CYAN)
  ensure(6); doc.text('Why this drilling depth', M, y); y += 5
  a.depthRationale.forEach((s, i) => {
    const lines = doc.splitTextToSize(`${i + 1}.  ${s}`, CW - 2)
    ensure(4.8 * lines.length + 1)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...BODY)
    doc.text(lines, M, y); y += 4.8 * lines.length + 1
  })
  y += 1
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...CYAN)
  ensure(6); doc.text('Before you drill', M, y); y += 5
  a.nextSteps.forEach((s, i) => {
    const lines = doc.splitTextToSize(`${i + 1}.  ${s}`, CW - 2)
    ensure(4.8 * lines.length + 1)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...BODY)
    doc.text(lines, M, y); y += 4.8 * lines.length + 1
  })

  // ═══ 14. Field validation ══════════════════════════════════════════
  heading('14. Field validation recommendation')
  const fv = a.fieldValidation
  kvRows([
    ['Recommended depth', `Drill between ${fv.recommendedDepthM[0]}–${fv.recommendedDepthM[1]} m`],
    ['Expected aquifer', fv.expectedAquifer],
    ['Expected yield', fv.expectedYield],
    ['Confidence score', `${fv.confidencePct}%`],
    ['Suggested verification', fv.verification],
    ['Recommended next step', fv.recommendedNextStep],
    ['Final status', fv.finalStatus],
  ])

  // ═══ 15. Conclusion & disclaimer ═══════════════════════════════════
  heading('15. Conclusion & disclaimer')
  para(
    `${site} is assessed as ${a.verdict.toUpperCase()} with an estimated ${a.probability}% probability of striking usable groundwater in the ` +
      `${a.recommendedDepthM[0]}–${a.recommendedDepthM[1]} m window. The recommendation originates from the Electrical Resistivity Survey interpretation: ` +
      `resistivity → layers → aquifer detection → parameters → machine-learning prediction → engineering decision. A confirmatory field VES at the exact plot is essential before drilling.`,
  )
  para(INTERPRETATION_DISCLAIMER, 8.5, MUTED)
  para(
    'DISCLAIMER: This report is decision support generated from published CGWB/NAQUIM datasets and site inputs supplied by the user. ' +
      'It is not a substitute for an on-site geophysical survey or the judgement of a licensed hydrogeologist. ' +
      DATA_VINTAGE_NOTE + ' Comply with groundwater-authority regulations, especially in semi-critical talukas.',
    8.5, AMBER,
  )

  // footers
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(`AquaSense AI · CGWB-data-backed assessment · ${site}`, M, 291)
    doc.text(`Page ${p} of ${pages}`, W - M, 291, { align: 'right' })
  }

  return doc
}

/** Build the report and trigger a browser download. */
export function generateReport(a: RealAssessment): void {
  const site = a.input.placeName || `${a.taluka.name} site`
  buildReportDoc(a).save(`AquaSense_${site.replace(/[^\w]+/g, '_')}_Report.pdf`)
}
