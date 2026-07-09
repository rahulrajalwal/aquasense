'use client'

// The full Near-Surface-Geophysics provenance chain, shown as a checklist so
// the user can see exactly how the recommendation was obtained: official data
// → VES → interpretation → aquifer detection → parameters → ML → decision.

const STEPS = [
  'Study Area selected',
  'Official survey data loaded',
  'VES survey loaded',
  'VES curve generated',
  'Geological layers interpreted',
  'Aquifers detected',
  'Hydrogeological parameters generated',
  'Machine-learning prediction completed',
  'Engineering recommendation generated',
] as const

export default function WorkflowProgress({
  doneUpTo = STEPS.length,
  title = 'How this recommendation was obtained',
}: {
  doneUpTo?: number
  title?: string
}) {
  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="text-emerald-300">✔</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{title}</span>
      </div>
      <ol className="flex flex-wrap gap-x-1.5 gap-y-2 p-4">
        {STEPS.map((s, i) => {
          const done = i < doneUpTo
          return (
            <li key={s} className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  done
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                    : 'border-white/10 bg-white/5 text-slate-500'
                }`}
              >
                <span className={done ? 'text-emerald-300' : 'text-slate-600'}>{done ? '✔' : i + 1}</span>
                {s}
              </span>
              {i < STEPS.length - 1 && <span className="text-cyan-500/50">→</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
