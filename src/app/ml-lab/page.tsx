'use client'

// Model Lab — full transparency into the production model: the real CGWB
// dataset it was trained on, its validation metrics, its learned weights,
// and the ability to reproduce training (or extend the dataset) right in
// the browser.

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageHeader, Badge, StatCard, SectionHeading } from '@/components/ui'
import Chart from '@/components/Chart'
import { lossChart, weightsChart, calibrationChart, wellScatter } from '@/components/chartDefs'
import { realTrainingExamples, REAL_FEATURE_NAMES } from '@/lib/ml/realFeatures'
import { parseRealCsv, REAL_CSV_SCHEMA, REAL_EXAMPLE_CSV } from '@/lib/ml/realCsv'
import { trainLogReg, type TrainedModel, type EpochStat } from '@/lib/ml/logreg'
import { PRETRAINED_REAL } from '@/lib/ml/pretrainedReal'
import { CGWB_WELLS, testedWells, wellOutcome } from '@/lib/data/real/wells'

export default function MlLabPage() {
  const [history, setHistory] = useState<EpochStat[]>([])
  const [sessionModel, setSessionModel] = useState<TrainedModel | null>(null)
  const [training, setTraining] = useState(false)
  const [extraCount, setExtraCount] = useState(0)
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const extraRef = useRef<ReturnType<typeof parseRealCsv>['examples']>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tested = testedWells()
  const succ = tested.filter((w) => wellOutcome(w) === 1).length
  const m = PRETRAINED_REAL.valMetrics

  const train = () => {
    if (training) return
    setTraining(true)
    setHistory([])
    setTimeout(() => {
      const base = realTrainingExamples().map(({ x, y }) => ({ x, y }))
      const examples = [...base, ...extraRef.current]
      const result = trainLogReg(examples, {
        datasetTag:
          extraRef.current.length > 0
            ? `CGWB Pune wells + ${extraRef.current.length} user records (n=${examples.length})`
            : `CGWB Pune exploration wells (n=${examples.length}, NAQUIM Annexure-I)`,
        featureNames: [...REAL_FEATURE_NAMES],
        seed: 11,
        epochs: 800,
        learningRate: 0.35,
        l2: 0.03,
      })
      const full = result.history
      const step = Math.max(1, Math.ceil(full.length / 30))
      let shown = 0
      timerRef.current = setInterval(() => {
        shown = Math.min(full.length, shown + step)
        setHistory(full.slice(0, shown))
        if (shown >= full.length && timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
          setSessionModel(result.model)
          setTraining(false)
        }
      }, 60)
    }, 30)
  }

  const onCsv = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const { examples, errors } = parseRealCsv(String(reader.result ?? ''))
      setCsvErrors(errors)
      if (examples.length > 0) {
        extraRef.current = examples
        setExtraCount(examples.length)
        setSessionModel(null)
        setHistory([])
      }
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([REAL_EXAMPLE_CSV], { type: 'text/csv' }))
    a.download = 'aquasense_well_records_template.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const shown = sessionModel ?? PRETRAINED_REAL

  return (
    <div>
      <PageHeader
        kicker="Model lab"
        title="Inside the Prediction Model"
        sub="The production classifier is trained on real pump-tested CGWB wells from the NAQUIM Pune study. This page shows exactly what it learned, how well it validates, and lets you reproduce — or extend — the training in your browser."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* production model card */}
        <div className="glass mt-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">Production model</h3>
              <Badge tone="green">{PRETRAINED_REAL.datasetTag}</Badge>
              <Badge tone="slate">logistic regression · {REAL_FEATURE_NAMES.length} features</Badge>
            </div>
            <span className="text-xs text-slate-500">
              shipped with the app · deterministic training (seed 11)
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Training wells" value={String(PRETRAINED_REAL.nTrain)} hint={`+ ${PRETRAINED_REAL.nVal} held out`} />
            <StatCard label="Validation accuracy" value={`${(m.accuracy * 100).toFixed(0)}%`} tone="good" />
            <StatCard label="ROC AUC" value={m.auc.toFixed(2)} tone={m.auc >= 0.8 ? 'good' : 'warn'} hint="0.5 = random, 1 = perfect" />
            <StatCard label="Recall" value={`${(m.recall * 100).toFixed(0)}%`} hint="successes found" />
            <StatCard label="F1 score" value={m.f1.toFixed(2)} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Features are pre-drilling knowables only (taluka layers + water level + aquifer geometry from CGWB logs) —
            the pump-test result never leaks into the inputs. The same featurizer runs at prediction time on the{' '}
            <Link href="/analyze" className="text-cyan-400 underline">assessment page</Link>.
          </p>
        </div>

        {/* dataset */}
        <div className="mt-10">
          <SectionHeading
            kicker="Training data"
            title="The real dataset"
            sub={`${CGWB_WELLS.length} CGWB exploration/observation wells; ${tested.length} carry a pump-test result and form the training set (${succ} success ≥1 lps / ${tested.length - succ} poor-dry). Depth vs yield below shows why this problem is genuinely hard.`}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass p-5">
              <h3 className="text-sm font-semibold text-white">All pump-tested wells — depth vs yield</h3>
              <Chart
                option={wellScatter(tested.map((w) => ({ village: w.village, depthM: w.depthM, yieldLps: w.yieldLps })))}
                style={{ minHeight: 330 }}
              />
            </div>
            <div className="glass overflow-hidden">
              <div className="border-b border-white/10 px-5 py-3 text-sm font-semibold text-white">
                Sample records (full data on the <Link href="/map" className="text-cyan-400 underline">map</Link> &{' '}
                <Link href="/dashboard" className="text-cyan-400 underline">dashboard</Link>)
              </div>
              <div className="max-h-[330px] overflow-auto">
                <table className="w-full whitespace-nowrap text-xs">
                  <thead className="sticky top-0 bg-panel text-left uppercase tracking-wider text-slate-500">
                    <tr>
                      {['Village', 'Taluka', 'WL pre (m)', 'Aq-II (m)', 'Thick (m)', 'Yield', 'Outcome'].map((h) => (
                        <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tested.slice(0, 25).map((w) => (
                      <tr key={w.sno} className="border-t border-white/5 text-slate-300">
                        <td className="px-3 py-1.5">{w.village}</td>
                        <td className="px-3 py-1.5 text-slate-500">{w.taluka}</td>
                        <td className="px-3 py-1.5 font-mono">{w.preSwlM ?? '—'}</td>
                        <td className="px-3 py-1.5 font-mono">{w.aq2BottomM ?? '—'}</td>
                        <td className="px-3 py-1.5 font-mono">{w.aq2ThickM ?? '—'}</td>
                        <td className="px-3 py-1.5 font-mono">{w.yieldRaw}</td>
                        <td className="px-3 py-1.5">
                          <Badge tone={wellOutcome(w) === 1 ? 'green' : 'red'}>{wellOutcome(w) === 1 ? 'success' : 'poor/dry'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* what it learned */}
        <div className="mt-10">
          <SectionHeading
            kicker="Interpretability"
            title="What the model learned"
            sub="Standardized weights — fully inspectable. Aquifer-II zone thickness dominates positively; a deep pre-monsoon water level is the strongest negative. Both match hydrogeological expectation."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass p-5">
              <h3 className="text-sm font-semibold text-white">Learned weights {sessionModel ? '(your session model)' : '(production)'}</h3>
              <Chart option={weightsChart(shown)} style={{ minHeight: 320 }} />
            </div>
            <div className="glass p-5">
              <h3 className="text-sm font-semibold text-white">Validation calibration</h3>
              <p className="mt-0.5 text-xs text-slate-500">Predicted probability vs observed success rate (held-out wells).</p>
              <Chart option={calibrationChart(shown)} style={{ minHeight: 300 }} />
            </div>
          </div>
        </div>

        {/* reproduce / extend */}
        <div className="mt-10">
          <SectionHeading
            kicker="Reproduce & extend"
            title="Train it yourself"
            sub="Training runs fully in your browser in under a second. Reproduce the production model, or add your own drilled-well records via CSV and see how the metrics move. Session experiments never alter the production model."
          />
          <div className="glass p-5">
            <div className="flex flex-wrap items-center gap-3">
              <button id="btn-train" className="btn-primary" onClick={train} disabled={training}>
                {training ? 'Training…' : extraCount > 0 ? `Train with +${extraCount} user records` : 'Reproduce production training'}
              </button>
              <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={training}>
                Add well records (CSV)
              </button>
              <button className="btn-ghost !px-3 !py-2 text-xs" onClick={downloadTemplate}>
                CSV template
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onCsv(f)
                  e.target.value = ''
                }}
              />
              <span className="text-xs text-slate-500">800 epochs · lr 0.35 (decaying) · L2 0.03 · 75/25 split</span>
            </div>

            {csvErrors.length > 0 && (
              <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-xs leading-relaxed text-rose-200">
                <b>CSV problems:</b>
                <ul className="mt-1 list-inside list-disc">
                  {csvErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">Learning curves</h3>
                  <Chart option={lossChart(history)} style={{ minHeight: 280 }} />
                </div>
                {sessionModel && !training && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h3 className="text-sm font-semibold text-white">Session-model validation</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <StatCard label="Accuracy" value={`${(sessionModel.valMetrics.accuracy * 100).toFixed(0)}%`} />
                      <StatCard label="AUC" value={sessionModel.valMetrics.auc.toFixed(2)} />
                      <StatCard label="F1" value={sessionModel.valMetrics.f1.toFixed(2)} />
                      <StatCard
                        label="Confusion"
                        value={`${sessionModel.valMetrics.cm.tp}/${sessionModel.valMetrics.cm.fp}/${sessionModel.valMetrics.cm.tn}/${sessionModel.valMetrics.cm.fn}`}
                        hint="TP / FP / TN / FN"
                      />
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                      {extraCount > 0
                        ? 'Includes your CSV records. Charts above now show this session model.'
                        : 'Same data, same seed — this reproduces the shipped production model exactly.'}
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* schema */}
          <div className="glass mt-6 overflow-x-auto">
            <div className="border-b border-white/10 px-5 py-3 text-sm font-semibold text-white">
              CSV schema for additional well records
            </div>
            <table className="w-full text-xs">
              <thead className="bg-white/[0.03] text-left uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Column</th>
                  <th className="px-4 py-2.5 font-semibold">Required</th>
                  <th className="px-4 py-2.5 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {REAL_CSV_SCHEMA.map((c) => (
                  <tr key={c.name} className="border-t border-white/5">
                    <td className="px-4 py-2 font-mono text-cyan-200">{c.name}</td>
                    <td className="px-4 py-2">{c.required ? <Badge tone="cyan">required</Badge> : <Badge tone="slate">optional</Badge>}</td>
                    <td className="px-4 py-2 leading-relaxed text-slate-400">{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
