'use client'

// The final engineering-decision box that closes the VES → ML workflow.

import type { FieldValidation } from '@/lib/engine/assessReal'

export default function FieldValidationBox({ fv }: { fv: FieldValidation }) {
  const tone = fv.favourable
    ? 'border-emerald-400/40 bg-emerald-400/10'
    : fv.finalStatus.startsWith('Conditionally')
      ? 'border-amber-400/40 bg-amber-400/10'
      : 'border-rose-400/40 bg-rose-400/10'
  const accent = fv.favourable ? 'text-emerald-300' : fv.finalStatus.startsWith('Conditionally') ? 'text-amber-300' : 'text-rose-300'

  const rows: [string, string][] = [
    ['Recommended drilling depth', `${fv.recommendedDepthM[0]}–${fv.recommendedDepthM[1]} m`],
    ['Expected aquifer', fv.expectedAquifer],
    ['Expected yield', fv.expectedYield],
    ['Confidence score', `${fv.confidencePct}%`],
    ['Suggested verification', fv.verification],
    ['Recommended next step', fv.recommendedNextStep],
    ['Final status', fv.finalStatus],
  ]

  return (
    <div className={`rounded-2xl border p-5 ${tone}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`text-lg ${accent}`}>◆</span>
        <h3 className="text-base font-bold text-white">Field Validation Recommendation</h3>
      </div>
      <dl className="space-y-2">
        {rows.map(([k, v], i) => (
          <div key={k} className="flex items-start gap-3 text-sm">
            <span className={`mt-0.5 shrink-0 ${accent}`}>✓</span>
            <dt className="w-40 shrink-0 text-slate-400">{k}</dt>
            <dd className={`font-medium ${i === rows.length - 1 ? accent : 'text-slate-100'}`}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-white/10 pt-2 text-[11px] leading-relaxed text-slate-400">
        This recommendation originates from the Electrical Resistivity Survey (VES) interpretation — resistivity →
        subsurface layers → aquifer detection → parameters → machine-learning prediction → engineering decision.
      </p>
    </div>
  )
}
