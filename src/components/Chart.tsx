'use client'

// Minimal ECharts wrapper (avoids echarts-for-react peer issues with v6):
// init once, setOption on change, resize with the container.

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

export default function Chart({
  option,
  className = '',
  style,
}: {
  option: echarts.EChartsOption
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' })
    chartRef.current = chart
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true })
  }, [option])

  return <div ref={ref} className={className} style={{ minHeight: 260, ...style }} />
}

// ── shared dark-theme option fragments ─────────────────────────────────
export const AXIS_STYLE = {
  axisLine: { lineStyle: { color: '#2b4468' } },
  axisLabel: { color: '#8fa8c7' },
  splitLine: { lineStyle: { color: 'rgba(148,184,226,0.09)' } },
} as const

export const TOOLTIP_STYLE = {
  backgroundColor: '#0d1f3c',
  borderColor: 'rgba(255,255,255,0.15)',
  textStyle: { color: '#dbe7f5' },
} as const
