'use client'

// Small shared UI primitives used across pages.

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Scroll-into-view fade/rise animation wrapper. `?static=1` disables the
 *  animation (used for automated screenshots / print). */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  if (typeof window !== 'undefined' && window.location.search.includes('static=1')) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeading({
  kicker,
  title,
  sub,
}: {
  kicker: string
  title: string
  sub?: string
}) {
  return (
    <div className="mb-8">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">{kicker}</div>
      <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      {sub && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">{sub}</p>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  unit?: string
  hint?: string
  tone?: 'default' | 'good' | 'warn' | 'bad'
}) {
  const tones = {
    default: 'text-cyan-300',
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    bad: 'text-rose-400',
  }
  return (
    <div className="glass p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1.5 text-2xl font-bold ${tones[tone]}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-slate-400">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs leading-snug text-slate-500">{hint}</div>}
    </div>
  )
}

export function Badge({
  children,
  tone = 'cyan',
}: {
  children: ReactNode
  tone?: 'cyan' | 'green' | 'amber' | 'red' | 'slate'
}) {
  const map = {
    cyan: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',
    green: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    red: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
    slate: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  }
  return <span className={`chip ${map[tone]}`}>{children}</span>
}

export function PageHeader({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-2 pt-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">{kicker}</div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        {sub && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">{sub}</p>}
      </motion.div>
    </div>
  )
}
