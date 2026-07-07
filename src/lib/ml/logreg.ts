// Phase 2 — logistic regression, trained in the browser.
//
// Chosen over tree ensembles / neural nets on purpose: the project's core
// rule is "no black boxes", and a linear model in standardized feature
// space decomposes every prediction into exact per-feature contributions
// (weight × z-score) that the UI can display next to the rule engine's
// own explanations. Dependency-free and fast enough to train live.

export interface TrainingExample {
  x: number[]
  y: 0 | 1
}

export interface ConfusionMatrix {
  tp: number
  fp: number
  tn: number
  fn: number
}

export interface CalibrationBin {
  mid: number // bin centre (predicted prob)
  predicted: number // mean predicted prob in bin
  observed: number // observed success rate in bin
  count: number
}

export interface Metrics {
  n: number
  accuracy: number
  auc: number
  precision: number
  recall: number
  f1: number
  cm: ConfusionMatrix
  calibration: CalibrationBin[]
}

export interface TrainedModel {
  version: 1
  featureNames: string[]
  /** weights in STANDARDIZED feature space */
  weights: number[]
  bias: number
  means: number[]
  stds: number[]
  datasetTag: string
  trainedAt: string // ISO
  nTrain: number
  nVal: number
  epochs: number
  valMetrics: Metrics
}

export interface EpochStat {
  epoch: number
  trainLoss: number
  valLoss: number
  valAcc: number
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

/** mulberry32 — small seeded PRNG so training runs are reproducible. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function standardizer(X: number[][]): { means: number[]; stds: number[] } {
  const d = X[0].length
  const means = new Array(d).fill(0)
  const stds = new Array(d).fill(0)
  for (const row of X) for (let j = 0; j < d; j++) means[j] += row[j]
  for (let j = 0; j < d; j++) means[j] /= X.length
  for (const row of X) for (let j = 0; j < d; j++) stds[j] += (row[j] - means[j]) ** 2
  for (let j = 0; j < d; j++) {
    stds[j] = Math.sqrt(stds[j] / X.length)
    if (stds[j] < 1e-9) stds[j] = 1 // constant feature → leave unscaled
  }
  return { means, stds }
}

const zRow = (x: number[], means: number[], stds: number[]) =>
  x.map((v, j) => (v - means[j]) / stds[j])

function logLoss(P: number[], y: (0 | 1)[]): number {
  let s = 0
  for (let i = 0; i < P.length; i++) {
    const p = Math.min(1 - 1e-12, Math.max(1e-12, P[i]))
    s += y[i] === 1 ? -Math.log(p) : -Math.log(1 - p)
  }
  return s / P.length
}

/** Rank-based AUC with tie handling. */
export function computeAuc(scores: number[], y: (0 | 1)[]): number {
  const idx = scores.map((s, i) => i).sort((a, b) => scores[a] - scores[b])
  const ranks = new Array(scores.length).fill(0)
  let i = 0
  while (i < idx.length) {
    let j = i
    while (j + 1 < idx.length && scores[idx[j + 1]] === scores[idx[i]]) j++
    const avg = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) ranks[idx[k]] = avg
    i = j + 1
  }
  const nPos = y.filter((v) => v === 1).length
  const nNeg = y.length - nPos
  if (nPos === 0 || nNeg === 0) return 0.5
  let rankSum = 0
  for (let k = 0; k < y.length; k++) if (y[k] === 1) rankSum += ranks[k]
  return (rankSum - (nPos * (nPos + 1)) / 2) / (nPos * nNeg)
}

export function computeMetrics(P: number[], y: (0 | 1)[]): Metrics {
  const cm: ConfusionMatrix = { tp: 0, fp: 0, tn: 0, fn: 0 }
  for (let i = 0; i < P.length; i++) {
    const pred = P[i] >= 0.5 ? 1 : 0
    if (pred === 1 && y[i] === 1) cm.tp++
    else if (pred === 1 && y[i] === 0) cm.fp++
    else if (pred === 0 && y[i] === 0) cm.tn++
    else cm.fn++
  }
  const accuracy = (cm.tp + cm.tn) / Math.max(1, P.length)
  const precision = cm.tp / Math.max(1, cm.tp + cm.fp)
  const recall = cm.tp / Math.max(1, cm.tp + cm.fn)
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

  const NB = 5
  const calibration: CalibrationBin[] = []
  for (let b = 0; b < NB; b++) {
    const lo = b / NB
    const hi = (b + 1) / NB
    const members = P.map((p, i) => ({ p, y: y[i] })).filter(
      (m) => m.p >= lo && (b === NB - 1 ? m.p <= hi : m.p < hi),
    )
    calibration.push({
      mid: (lo + hi) / 2,
      predicted: members.length ? members.reduce((s, m) => s + m.p, 0) / members.length : (lo + hi) / 2,
      // -1 marks an empty bin (kept JSON-serializable; consumers filter count > 0)
      observed: members.length ? members.reduce((s, m) => s + m.y, 0) / members.length : -1,
      count: members.length,
    })
  }

  return { n: P.length, accuracy, auc: computeAuc(P, y), precision, recall, f1, cm, calibration }
}

export interface TrainOptions {
  epochs?: number
  learningRate?: number
  l2?: number
  valFraction?: number
  seed?: number
  datasetTag: string
  featureNames: string[]
}

export interface TrainResult {
  model: TrainedModel
  history: EpochStat[]
}

export function trainLogReg(examples: TrainingExample[], opts: TrainOptions): TrainResult {
  const { epochs = 600, learningRate = 0.4, l2 = 0.015, valFraction = 0.25, seed = 7 } = opts
  if (examples.length < 20) throw new Error('Need at least 20 examples to train')

  const rand = rng(seed)
  const data = shuffled(examples, rand)
  const nVal = Math.max(5, Math.round(data.length * valFraction))
  const val = data.slice(0, nVal)
  const train = data.slice(nVal)

  const { means, stds } = standardizer(train.map((e) => e.x))
  const Xt = train.map((e) => zRow(e.x, means, stds))
  const yt = train.map((e) => e.y)
  const Xv = val.map((e) => zRow(e.x, means, stds))
  const yv = val.map((e) => e.y)

  const d = Xt[0].length
  const w = new Array(d).fill(0)
  let b = 0
  const history: EpochStat[] = []

  const predictAll = (X: number[][]) =>
    X.map((row) => sigmoid(row.reduce((s, v, j) => s + v * w[j], b)))

  for (let ep = 1; ep <= epochs; ep++) {
    const lr = learningRate / (1 + ep / 300) // mild decay
    const P = predictAll(Xt)
    const gw = new Array(d).fill(0)
    let gb = 0
    for (let i = 0; i < Xt.length; i++) {
      const err = P[i] - yt[i]
      gb += err
      const row = Xt[i]
      for (let j = 0; j < d; j++) gw[j] += err * row[j]
    }
    for (let j = 0; j < d; j++) w[j] -= lr * (gw[j] / Xt.length + l2 * w[j])
    b -= lr * (gb / Xt.length)

    if (ep % 5 === 0 || ep === 1 || ep === epochs) {
      const Pv = predictAll(Xv)
      history.push({
        epoch: ep,
        trainLoss: logLoss(P, yt),
        valLoss: logLoss(Pv, yv),
        valAcc: Pv.filter((p, i) => (p >= 0.5 ? 1 : 0) === yv[i]).length / Pv.length,
      })
    }
  }

  const valMetrics = computeMetrics(predictAll(Xv), yv)
  const model: TrainedModel = {
    version: 1,
    featureNames: opts.featureNames,
    weights: w,
    bias: b,
    means,
    stds,
    datasetTag: opts.datasetTag,
    trainedAt: new Date().toISOString(),
    nTrain: train.length,
    nVal: val.length,
    epochs,
    valMetrics,
  }
  return { model, history }
}

export function predictProba(model: TrainedModel, x: number[]): number {
  const z = zRow(x, model.means, model.stds)
  return sigmoid(z.reduce((s, v, j) => s + v * model.weights[j], model.bias))
}

export interface Contribution {
  name: string
  /** signed logit contribution (weight × z-value) */
  logit: number
}

/** Exact decomposition of one prediction: logit = bias + Σ contributions. */
export function contributions(model: TrainedModel, x: number[]): Contribution[] {
  const z = zRow(x, model.means, model.stds)
  return model.featureNames
    .map((name, j) => ({ name, logit: model.weights[j] * z[j] }))
    .sort((a, b) => Math.abs(b.logit) - Math.abs(a.logit))
}
