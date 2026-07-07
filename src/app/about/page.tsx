'use client'

import { PageHeader, Reveal, SectionHeading } from '@/components/ui'
import { CITATIONS } from '@/lib/data/real/hydro'
import { PRETRAINED_REAL } from '@/lib/ml/pretrainedReal'

const STACK = [
  ['Next.js 14 + React 18', 'App-router pages, server/client component split'],
  ['TypeScript', 'Typed domain model: wells, talukas, aquifers, assessments'],
  ['Tailwind CSS', 'Dark-navy engineering theme, glassmorphism, responsive'],
  ['Leaflet', 'Interactive CGWB wells map on dark CARTO/OSM tiles'],
  ['Apache ECharts', 'Gauges, sounding curves, factor & comparison charts'],
  ['Framer Motion', 'Wizard transitions and scroll reveals'],
  ['jsPDF', 'Client-side cited PDF assessment reports'],
]

export default function AboutPage() {
  const m = PRETRAINED_REAL.valMetrics
  return (
    <div>
      <PageHeader
        kicker="About"
        title="About AquaSense AI"
        sub="A decision-support platform for borewell siting in Pune district, developed by Rahul Meena. It packages the science that de-risks drilling — resistivity sounding, aquifer mapping, well-census evidence — into one guided assessment anyone can run."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* mission */}
        <Reveal>
          <div className="glass mt-6 grid gap-6 p-6 md:grid-cols-3">
            {[
              ['The problem', 'Thousands of borewells fail every year in India because sites are chosen without subsurface investigation. Each failure costs ₹50,000–₹2,00,000 — and in Deccan basalt, a productive fracture zone can be 50 m from a dry one.'],
              ['The approach', 'Ask the user only what they know, fill the rest from the published CGWB record, and run two engines side by side: transparent hydrogeological rules and a machine-learning model trained on real pump-tested wells.'],
              ['The discipline', 'No black boxes and no invented data: every number traces to a cited CGWB/NAQUIM table or to physics, every prediction decomposes into visible factors, and the tool always says what it does not know.'],
            ].map(([t, b]) => (
              <div key={t}>
                <h3 className="font-semibold text-cyan-300">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{b}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* how it works */}
        <div className="mt-14">
          <Reveal>
            <SectionHeading kicker="Under the hood" title="How an assessment is produced" />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['1 · Evidence', 'Your location is matched against 146 documented CGWB exploration wells and taluka layers: rainfall normals, resource stress, yield potential, aquifer geometry.'],
              ['2 · Rule engine', 'Six weighted, fully-written-out factors score the site from that evidence — the reasoning a hydrogeologist would give, made explicit.'],
              [`3 · ML model`, `A logistic-regression classifier trained on ${PRETRAINED_REAL.nTrain + PRETRAINED_REAL.nVal} pump-tested CGWB wells (validation AUC ${m.auc.toFixed(2)}, accuracy ${(m.accuracy * 100).toFixed(0)}%) predicts success probability with exact per-feature contributions.`],
              ['4 · Physics', 'If you provide VES readings, a real 1-D Schlumberger inversion (Stefanescu recursion + Hankel filter) identifies the saturated layer and feeds the verdict.'],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 0.06}>
                <div className="glass h-full p-5">
                  <div className="text-sm font-bold text-cyan-300">{t}</div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* science + data */}
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <Reveal>
            <div className="glass h-full p-6">
              <h3 className="font-semibold text-white">Scientific basis</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                The resistivity core follows the standard treatment of DC methods: Schlumberger array geometry, apparent
                resistivity, the Stefanescu recursion for the layered-earth kernel, Hankel-transform evaluation
                (201-point Werthmüller–Key–Slob filter), H/A/K/Q curve families, and Archie&apos;s-law reasoning about why
                saturated weathered basalt is conductive (~20–45 Ω·m) while massive basalt is not.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass h-full p-6">
              <h3 className="font-semibold text-white">Data & citations</h3>
              <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-400">
                {CITATIONS.map((c) => (
                  <li key={c.id}>• {c.full}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Extraction from the published PDFs was script-parsed and row-by-row verified; source anomalies (e.g.
                coordinate typos) are flagged in the dataset rather than silently corrected. See the Data Sources page
                for the full registry.
              </p>
            </div>
          </Reveal>
        </div>

        {/* stack */}
        <div className="mt-14">
          <Reveal>
            <SectionHeading kicker="Technology" title="Stack" />
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STACK.map(([t, b], i) => (
              <Reveal key={t} delay={i * 0.05}>
                <div className="glass h-full p-4">
                  <div className="text-sm font-semibold text-cyan-300">{t}</div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-500">{b}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* responsible use */}
        <Reveal>
          <div className="mt-14 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-6 text-sm leading-relaxed text-amber-200/90">
            <b>Responsible-use note.</b> AquaSense provides decision support from published data — it does not replace
            an on-site geophysical survey or a licensed hydrogeologist, and its data vintage (assessments 2013, water
            levels 2017) means current conditions may differ. Groundwater is a stressed common resource: respect
            authority regulations (especially in semi-critical Baramati and Purandhar), and pair every new bore with
            recharge structures.
          </div>
        </Reveal>
      </div>
    </div>
  )
}
