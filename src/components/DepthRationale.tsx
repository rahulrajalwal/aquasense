'use client'

// The engineering reasoning for the recommended drilling depth — shallow
// seasonal water first, then continue to the deeper productive fracture zone.

export default function DepthRationale({ steps }: { steps: string[] }) {
  return (
    <div className="glass p-5">
      <h3 className="font-semibold text-white">Why drill to this depth?</h3>
      <ol className="mt-3 space-y-2.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-300">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 font-mono text-xs font-bold text-cyan-300">
              {i === steps.length - 1 ? '✓' : i + 1}
            </span>
            <span className={i === steps.length - 1 ? 'font-medium text-cyan-100' : ''}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
