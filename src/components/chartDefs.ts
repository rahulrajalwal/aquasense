// ECharts option builders shared by Analyze / Dashboard / VES panels.

import type { EChartsOption } from 'echarts'
import type { FactorScore } from '@/lib/engine/assessReal'
import type { VESReading } from '@/lib/types'
import type { SoundingPoint } from '@/lib/physics/ves'
import type { EpochStat, TrainedModel } from '@/lib/ml/logreg'

const AXIS = {
  axisLine: { lineStyle: { color: '#2b4468' } },
  axisLabel: { color: '#8fa8c7', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(148,184,226,0.09)' } },
}
const TOOLTIP = {
  backgroundColor: '#0d1f3c',
  borderColor: 'rgba(255,255,255,0.15)',
  textStyle: { color: '#dbe7f5', fontSize: 12 },
}

export function probabilityGauge(value: number, label = 'Groundwater probability'): EChartsOption {
  const color = value >= 65 ? '#34d399' : value >= 45 ? '#fbbf24' : '#fb7185'
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        radius: '95%',
        pointer: { show: false },
        progress: {
          show: true,
          width: 16,
          roundCap: true,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#22d3ee' },
                { offset: 1, color },
              ],
            },
          },
        },
        axisLine: { roundCap: true, lineStyle: { width: 16, color: [[1, 'rgba(148,184,226,0.12)']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#fff',
          fontSize: 34,
          fontWeight: 700,
          offsetCenter: [0, '-5%'],
        },
        title: { offsetCenter: [0, '28%'], color: '#8fa8c7', fontSize: 12 },
        data: [{ value, name: label }],
      },
    ],
  }
}

export function confidenceGauge(value: number): EChartsOption {
  return probabilityGauge(value, 'Confidence score')
}

export function factorBars(factors: FactorScore[]): EChartsOption {
  const sorted = [...factors].reverse()
  return {
    grid: { left: 8, right: 46, top: 10, bottom: 10, containLabel: true },
    tooltip: {
      ...TOOLTIP,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (p: unknown) => {
        const items = p as { dataIndex: number }[]
        const f = sorted[items[0].dataIndex]
        return `<b>${f.label}</b><br/>Score ${f.score}/100 · weight ${f.weightPct}%<br/>Contribution: <b>${f.contribution} pts</b>`
      },
    },
    xAxis: { type: 'value', max: 100, ...AXIS },
    yAxis: {
      type: 'category',
      data: sorted.map((f) => `${f.label}  (${f.weightPct}%)`),
      ...AXIS,
      axisLabel: { color: '#c3d4ea', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((f) => ({
          value: f.score,
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: f.score >= 70 ? '#34d399' : f.score >= 50 ? '#22d3ee' : f.score >= 35 ? '#fbbf24' : '#fb7185',
          },
        })),
        barWidth: 14,
        label: { show: true, position: 'right', color: '#8fa8c7', fontSize: 11, formatter: '{c}' },
        backgroundStyle: { color: 'rgba(148,184,226,0.08)', borderRadius: [0, 6, 6, 0] },
        showBackground: true,
      },
    ],
  }
}

/** Taluka comparison bars (rainfall, stage %, …) with one highlighted. */
export function talukaBars(
  rows: { name: string; value: number; highlight?: boolean }[],
  unit: string,
  color: [string, string] = ['#22d3ee', '#1d4ed8'],
): EChartsOption {
  return {
    grid: { left: 8, right: 30, top: 10, bottom: 8, containLabel: true },
    tooltip: {
      ...TOOLTIP,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v) => `${v} ${unit}`,
    },
    xAxis: { type: 'value', ...AXIS },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.name),
      ...AXIS,
      axisLabel: { color: '#c3d4ea', fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        barWidth: 11,
        data: rows.map((r) => ({
          value: r.value,
          itemStyle: {
            borderRadius: [0, 5, 5, 0],
            color: r.highlight
              ? '#fbbf24'
              : {
                  type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                  colorStops: [
                    { offset: 0, color: color[1] },
                    { offset: 1, color: color[0] },
                  ],
                },
          },
        })),
        label: { show: true, position: 'right', color: '#8fa8c7', fontSize: 10, formatter: '{c}' },
      },
    ],
  }
}

/** CGWB wells: depth vs yield scatter (log yield), colored by outcome. */
export function wellScatter(
  wells: { village: string; depthM: number | null; yieldLps: number | null }[],
): EChartsOption {
  const pts = wells.filter((w) => w.depthM !== null && w.yieldLps !== null)
  return {
    grid: { left: 8, right: 20, top: 36, bottom: 8, containLabel: true },
    tooltip: {
      ...TOOLTIP,
      trigger: 'item',
      formatter: (p: unknown) => {
        const d = p as { dataIndex: number }
        const w = pts[d.dataIndex]
        return `<b>${w.village}</b><br/>drilled ${w.depthM} m · yield ${w.yieldLps}`
      },
    },
    xAxis: {
      type: 'value',
      name: 'drilled depth (m)',
      nameLocation: 'middle',
      nameGap: 26,
      nameTextStyle: { color: '#8fa8c7' },
      ...AXIS,
    },
    yAxis: {
      type: 'log',
      logBase: 10,
      min: 0.03,
      name: 'yield (lps, log)',
      nameTextStyle: { color: '#8fa8c7', fontSize: 10 },
      ...AXIS,
    },
    series: [
      {
        type: 'scatter',
        symbolSize: 10,
        data: pts.map((w) => ({
          value: [w.depthM, Math.max(0.04, w.yieldLps!)],
          itemStyle: {
            color: w.yieldLps! >= 1 ? '#34d399' : '#fb7185',
            borderColor: '#0d1f3c',
            borderWidth: 1.5,
          },
        })),
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: 'rgba(251,191,36,0.6)', type: 'dashed' },
          label: { color: '#fbbf24', formatter: 'success ≥ 1 lps', fontSize: 10 },
          data: [{ yAxis: 1 }],
        },
      },
    ],
  }
}

export function rainfallChart(labels: string[], values: number[]): EChartsOption {
  return {
    grid: { left: 8, right: 16, top: 30, bottom: 8, containLabel: true },
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    xAxis: { type: 'category', data: labels, ...AXIS },
    yAxis: {
      type: 'value',
      name: 'mm',
      nameTextStyle: { color: '#8fa8c7', fontSize: 10 },
      ...AXIS,
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: '55%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#22d3ee' },
              { offset: 1, color: '#1d4ed8' },
            ],
          },
        },
      },
    ],
  }
}

/** Training curves: train/validation log-loss per epoch. */
export function lossChart(history: EpochStat[]): EChartsOption {
  return {
    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
    legend: { textStyle: { color: '#8fa8c7' }, top: 0 },
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    xAxis: { type: 'category', name: 'epoch', nameTextStyle: { color: '#8fa8c7' }, data: history.map((h) => String(h.epoch)), ...AXIS },
    yAxis: { type: 'value', name: 'log-loss', nameTextStyle: { color: '#8fa8c7', fontSize: 10 }, ...AXIS },
    series: [
      {
        name: 'Training loss',
        type: 'line',
        showSymbol: false,
        data: history.map((h) => Math.round(h.trainLoss * 1000) / 1000),
        lineStyle: { color: '#22d3ee', width: 2.5 },
        itemStyle: { color: '#22d3ee' },
      },
      {
        name: 'Validation loss',
        type: 'line',
        showSymbol: false,
        data: history.map((h) => Math.round(h.valLoss * 1000) / 1000),
        lineStyle: { color: '#fbbf24', width: 2.5, type: 'dashed' },
        itemStyle: { color: '#fbbf24' },
      },
    ],
  }
}

/** Learned model weights (standardized space), sorted by |weight|. */
export function weightsChart(model: TrainedModel): EChartsOption {
  const rows = model.featureNames
    .map((name, j) => ({ name, w: model.weights[j] }))
    .sort((a, b) => Math.abs(a.w) - Math.abs(b.w))
  return {
    grid: { left: 8, right: 40, top: 10, bottom: 10, containLabel: true },
    tooltip: {
      ...TOOLTIP,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (p: unknown) => {
        const it = (p as { dataIndex: number }[])[0]
        const r = rows[it.dataIndex]
        return `<b>${r.name}</b><br/>standardized weight: ${r.w.toFixed(3)}<br/>${r.w >= 0 ? 'pushes probability UP' : 'pushes probability DOWN'}`
      },
    },
    xAxis: { type: 'value', ...AXIS },
    yAxis: { type: 'category', data: rows.map((r) => r.name), ...AXIS, axisLabel: { color: '#c3d4ea', fontSize: 11 } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        data: rows.map((r) => ({
          value: Math.round(r.w * 1000) / 1000,
          itemStyle: { color: r.w >= 0 ? '#34d399' : '#fb7185', borderRadius: r.w >= 0 ? [0, 5, 5, 0] : [5, 0, 0, 5] },
        })),
        label: { show: true, position: 'right', color: '#8fa8c7', fontSize: 10 },
      },
    ],
  }
}

/** Calibration: predicted vs observed success rate per probability bin. */
export function calibrationChart(model: TrainedModel): EChartsOption {
  const bins = model.valMetrics.calibration.filter((b) => b.count > 0 && b.observed >= 0)
  return {
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    legend: { textStyle: { color: '#8fa8c7' }, top: 0 },
    tooltip: {
      ...TOOLTIP,
      trigger: 'item',
      formatter: (p: unknown) => {
        const d = p as { seriesName: string; dataIndex: number; value: [number, number] }
        if (d.seriesName !== 'Validation bins') return ''
        const b = bins[d.dataIndex]
        return `predicted ${(b.predicted * 100).toFixed(0)}% → observed ${(b.observed * 100).toFixed(0)}%<br/>${b.count} wells in bin`
      },
    },
    xAxis: { type: 'value', min: 0, max: 1, name: 'predicted', nameTextStyle: { color: '#8fa8c7' }, ...AXIS },
    yAxis: { type: 'value', min: 0, max: 1, name: 'observed', nameTextStyle: { color: '#8fa8c7', fontSize: 10 }, ...AXIS },
    series: [
      {
        name: 'Perfect calibration',
        type: 'line',
        showSymbol: false,
        data: [
          [0, 0],
          [1, 1],
        ],
        lineStyle: { color: 'rgba(148,184,226,0.4)', type: 'dashed', width: 1.5 },
        itemStyle: { color: 'rgba(148,184,226,0.4)' },
      },
      {
        name: 'Validation bins',
        type: 'scatter',
        symbolSize: (v: unknown, params: { dataIndex: number }) => 8 + Math.min(14, bins[params.dataIndex].count / 4),
        data: bins.map((b) => [b.predicted, b.observed]),
        itemStyle: { color: '#22d3ee', borderColor: '#0d1f3c', borderWidth: 1.5 },
      },
    ],
  }
}

/** Log-log sounding chart: measured points + fitted model curve. Scroll or
 *  pinch to zoom, drag to pan (dataZoom on both log axes). */
export function soundingChart(readings: VESReading[], fitted: SoundingPoint[], measuredLabel = 'Field readings'): EChartsOption {
  return {
    grid: { left: 8, right: 20, top: 40, bottom: 40, containLabel: true },
    legend: { textStyle: { color: '#8fa8c7' }, top: 0 },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
      { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
      { type: 'slider', xAxisIndex: 0, height: 16, bottom: 8, borderColor: 'transparent', backgroundColor: 'rgba(148,184,226,0.06)', fillerColor: 'rgba(34,211,238,0.15)', handleStyle: { color: '#22d3ee' }, textStyle: { color: '#8fa8c7', fontSize: 9 }, moveHandleStyle: { color: '#22d3ee' } },
    ],
    tooltip: {
      ...TOOLTIP,
      trigger: 'item',
      formatter: (p: unknown) => {
        const d = (p as { value: [number, number]; seriesName: string })
        return `${d.seriesName}<br/>AB/2 = ${d.value[0].toFixed(1)} m<br/>ρa = ${d.value[1].toFixed(1)} Ω·m`
      },
    },
    xAxis: {
      type: 'log',
      name: 'AB/2 (m)',
      nameLocation: 'middle',
      nameGap: 26,
      nameTextStyle: { color: '#8fa8c7' },
      ...AXIS,
    },
    yAxis: {
      type: 'log',
      name: 'Apparent resistivity ρa (Ω·m)',
      nameTextStyle: { color: '#8fa8c7', fontSize: 10 },
      ...AXIS,
    },
    series: [
      {
        name: 'Fitted layered model',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: fitted.map((p) => [p.s, p.rhoA]),
        lineStyle: { color: '#22d3ee', width: 2.5 },
        itemStyle: { color: '#22d3ee' },
        zlevel: 1,
      },
      {
        name: measuredLabel,
        type: 'scatter',
        symbolSize: 9,
        data: readings.map((r) => [r.s, r.rhoA]),
        itemStyle: { color: '#fbbf24', borderColor: '#0d1f3c', borderWidth: 1.5 },
        zlevel: 2,
      },
    ],
  }
}
