// Client-side PDF assessment report (jsPDF), generated from a RealAssessment.

import { jsPDF } from 'jspdf'
import type { RealAssessment } from './engine/assessReal'
import { wellOutcome } from './data/real/wells'
import { AQUIFERS, CITATIONS, DATA_VINTAGE_NOTE } from './data/real/hydro'
import { PRETRAINED_REAL } from './ml/pretrainedReal'

const NAVY: [number, number, number] = [13, 31, 60]
const CYAN: [number, number, number] = [8, 145, 178]
const BODY: [number, number, number] = [55, 65, 81]
const MUTED: [number, number, number] = [120, 134, 156]
const AMBER: [number, number, number] = [180, 120, 10]

const M = 18
const W = 210
const CW = W - 2 * M

export function generateReport(a: RealAssessment): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 0

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

  // ═══ 1. location & inputs ══════════════════════════════════════════
  heading('1. Site & inputs provided')
  kvRows([
    ['Location', `${site}, ${a.taluka.name} taluka, Pune district, Maharashtra`],
    ['Coordinates', a.input.lat !== null ? `${a.input.lat.toFixed(4)}° N, ${a.input.lon!.toFixed(4)}° E` : 'Not provided (taluka-level assessment)'],
    ['Reported water table', a.input.knownWaterTableM !== '' ? `${a.input.knownWaterTableM} m bgl` : 'Not provided — CGWB local median used'],
    ['Nearby bore depth', a.input.nearbyBoreDepthM !== '' ? `${a.input.nearbyBoreDepthM} m` : 'Not provided'],
    ['Nearby bore outcomes', a.input.nearbyOutcome === 'unknown' ? 'Not known' : a.input.nearbyOutcome.replace('-', ' ')],
    ['VES sounding', a.input.ves ? `Provided — aquifer ~${a.input.ves.rho.toFixed(0)} Ω·m, ${a.input.ves.thickM.toFixed(1)} m thick from ${a.input.ves.topM.toFixed(1)} m` : 'Not provided'],
  ])

  // ═══ 2. data sources ═══════════════════════════════════════════════
  heading('2. Data sources')
  for (const c of CITATIONS) para(`• ${c.full}`, 8.5)
  para(DATA_VINTAGE_NOTE, 8, MUTED)

  // ═══ 3. local CGWB evidence ════════════════════════════════════════
  heading('3. Local CGWB evidence')
  para(
    `${a.taluka.name}: normal rainfall ≈ ${a.taluka.rainfallMm} mm/yr; stage of groundwater development ${a.taluka.stagePct}% (${a.taluka.category}, 2013 taluka assessment — district-wide the 2023 GSDA/CGWB assessment reports the 50–70% band with 8 stressed talukas); ` +
      `aquifer yield potential "${a.taluka.yieldPotential}" (CGWB Table-8)${a.taluka.droughtProne ? '; classified drought-prone' : ''}. ` +
      `${a.evidence.talukaTested.length} pump-tested CGWB wells in the taluka` +
      (a.evidence.talukaSuccessRate !== null
        ? `, of which ${Math.round(a.evidence.talukaSuccessRate * 100)}% reached the 1 lps success threshold.`
        : '.'),
  )
  const wellsToShow = a.evidence.nearby.length
    ? a.evidence.nearby.map((n) => ({ w: n.well, tag: `${n.km} km` }))
    : a.evidence.talukaTested.slice(0, 6).map((w) => ({ w, tag: '—' }))
  if (wellsToShow.length) {
    const wCols: [string, number][] = [
      ['CGWB well (village)', 46],
      ['Dist.', 16],
      ['Drilled', 18],
      ['WL pre', 18],
      ['Yield', 22],
      ['Aq-I', 16],
      ['Aq-II', 16],
      ['Outcome', 22],
    ]
    tableHeader(wCols)
    wellsToShow.forEach(({ w, tag }, i) =>
      tableRow(
        [
          `${w.village} (${w.type})`,
          tag,
          w.depthM !== null ? `${w.depthM} m` : '—',
          w.preSwlM !== null ? `${w.preSwlM} m` : '—',
          w.yieldRaw,
          w.aq1BottomM !== null ? `${w.aq1BottomM}` : '—',
          w.aq2BottomM !== null ? `${w.aq2BottomM}` : '—',
          w.yieldLps === null ? 'untested' : wellOutcome(w) === 1 ? 'SUCCESS' : 'poor/dry',
        ],
        wCols,
        i % 2 === 0,
      ),
    )
  }

  // ═══ 4. aquifer setting ════════════════════════════════════════════
  heading('4. Aquifer setting (NAQUIM)')
  para(
    `${AQUIFERS.aq1.name}: ${AQUIFERS.aq1.depthRangeM[0]}–${AQUIFERS.aq1.depthRangeM[1]} m bgl, yields ${AQUIFERS.aq1.yieldM3PerDay[0]}–${AQUIFERS.aq1.yieldM3PerDay[1]} m³/day. ` +
      `${AQUIFERS.aq2.name}: ${AQUIFERS.aq2.depthRangeM[0]}–${AQUIFERS.aq2.depthRangeM[1]} m bgl; success depends on discrete fracture zones. ` +
      `Local CGWB logs here put Aquifer-I to ~${a.evidence.medAq1M} m and Aquifer-II zones near ~${a.evidence.medAq2M} m (median thickness ${a.evidence.medAq2ThickM} m).`,
  )

  // ═══ 5. results ════════════════════════════════════════════════════
  heading('5. Assessment result')
  ensure(16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...NAVY)
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

  // ═══ 6. factors ════════════════════════════════════════════════════
  heading('6. Rule-engine factor breakdown')
  const fCols: [string, number][] = [
    ['Factor', 46],
    ['Weight', 16],
    ['Score', 16],
    ['Notes', 96],
  ]
  tableHeader(fCols)
  a.factors.forEach((f, i) => tableRow([f.label, `${f.weightPct}%`, `${f.score}/100`, f.detail], fCols, i % 2 === 0))

  // ═══ 7. ML model ═══════════════════════════════════════════════════
  heading('7. Machine-learning model')
  para(
    `Logistic-regression classifier trained on ${PRETRAINED_REAL.nTrain + PRETRAINED_REAL.nVal} pump-tested CGWB wells from the NAQUIM Pune annexure ` +
      `(validation: accuracy ${(PRETRAINED_REAL.valMetrics.accuracy * 100).toFixed(0)}%, AUC ${PRETRAINED_REAL.valMetrics.auc.toFixed(2)}, F1 ${PRETRAINED_REAL.valMetrics.f1.toFixed(2)} on ${PRETRAINED_REAL.nVal} held-out wells). ` +
      'Largest contributions for this site (signed logits):',
  )
  const mCols: [string, number][] = [
    ['Feature', 90],
    ['Contribution', 40],
    ['Direction', 44],
  ]
  tableHeader(mCols)
  a.mlContributions.slice(0, 6).forEach((c, i) =>
    tableRow([c.name, c.logit.toFixed(3), c.logit >= 0 ? 'raises probability' : 'lowers probability'], mCols, i % 2 === 0),
  )

  // ═══ 8. interpretation ═════════════════════════════════════════════
  heading('8. Engineering interpretation')
  for (const e of a.explanations) {
    ensure(10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...CYAN)
    const qLines = doc.splitTextToSize(e.q, CW)
    doc.text(qLines, M, y)
    y += 4.6 * qLines.length + 0.5
    para(e.a, 9)
  }

  // ═══ 9. actions ════════════════════════════════════════════════════
  heading('9. Recommended actions before drilling')
  a.nextSteps.forEach((s, i) => {
    const lines = doc.splitTextToSize(`${i + 1}.  ${s}`, CW - 2)
    ensure(4.8 * lines.length + 1)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...BODY)
    doc.text(lines, M, y)
    y += 4.8 * lines.length + 1
  })

  // ═══ 10. disclaimer ════════════════════════════════════════════════
  heading('10. Conclusion & disclaimer')
  para(
    `${site} is assessed as ${a.verdict.toUpperCase()} with an estimated ${a.probability}% probability of striking usable groundwater in the ` +
      `${a.recommendedDepthM[0]}–${a.recommendedDepthM[1]} m window. A confirmatory Vertical Electrical Sounding at the exact plot is essential before drilling.`,
  )
  para(
    'DISCLAIMER: This report is decision support generated from published CGWB/NAQUIM datasets and site inputs supplied by the user. ' +
      'It is not a substitute for an on-site geophysical survey or the judgement of a licensed hydrogeologist. ' +
      DATA_VINTAGE_NOTE +
      ' Comply with groundwater-authority regulations, especially in semi-critical talukas.',
    8.5,
    AMBER,
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

  doc.save(`AquaSense_${(site).replace(/[^\w]+/g, '_')}_Report.pdf`)
}
