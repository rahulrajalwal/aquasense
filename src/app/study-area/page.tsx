'use client'

import Link from 'next/link'
import { PageHeader, Reveal, SectionHeading, Badge, StatCard } from '@/components/ui'
import { TALUKAS_REAL, TALUKA_NAME_TO_ID } from '@/lib/data/real/talukas'
import { CGWB_WELLS } from '@/lib/data/real/wells'
import { AQUIFERS, DUGWELL_YIELDS, DISTRICT_OVERVIEW } from '@/lib/data/real/hydro'

export default function StudyAreaPage() {
  const tested = CGWB_WELLS.filter((w) => w.yieldLps !== null).length

  return (
    <div>
      <PageHeader
        kicker="Study area"
        title="Pune District, Maharashtra"
        sub={`15,642 km² of Deccan Volcanic Province across 14 talukas — from >2,600 mm/yr on the Sahyadri crest (Velhe) to 474 mm/yr in the rain shadow (Daund). Groundwater lives almost entirely in weathered and fractured basalt horizons, which is why siting a borewell here is genuinely hard — and why CGWB has drilled and documented ${CGWB_WELLS.length} exploration wells across the district.`}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* headline stats */}
        <Reveal delay={0.05}>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Talukas covered" value="14" hint="entire Pune district" />
            <StatCard label="CGWB wells in dataset" value={String(CGWB_WELLS.length)} hint={`${tested} pump-tested`} />
            <StatCard
              label="Rainfall span"
              value={`${Math.min(...TALUKAS_REAL.map((t) => t.rainfallMm))}–${Math.max(...TALUKAS_REAL.map((t) => t.rainfallMm))}`}
              unit="mm/yr"
              hint="taluka normals, CGWB 2003–12"
            />
            <StatCard
              label="District GW development"
              value={`${DISTRICT_OVERVIEW.resources2013.stagePct}%`}
              hint="2013 assessment · 2 talukas semi-critical"
              tone="warn"
            />
          </div>
        </Reveal>

        {/* taluka grid */}
        <div className="mt-14">
          <Reveal>
            <SectionHeading
              kicker="Coverage"
              title="Fourteen talukas, three hydrogeological worlds"
              sub="Ghat crest (extreme rain, thin aquifers) → central plateau (moderate everything) → eastern rain shadow (scarce recharge, deep water). Values below are from the CGWB reports; click a taluka to assess a site there."
            />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TALUKAS_REAL.map((t, i) => {
              const wells = CGWB_WELLS.filter((w) => TALUKA_NAME_TO_ID[w.taluka] === t.id)
              return (
                <Reveal key={t.id} delay={Math.min(i * 0.05, 0.3)}>
                  <div className="glass flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white">{t.name}</h3>
                      <Badge tone={t.category === 'Semi-Critical' ? 'amber' : 'green'}>{t.category}</Badge>
                    </div>
                    <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-400">{t.terrain}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-xs">
                      <dt className="text-slate-500">Rainfall</dt>
                      <dd className="font-mono text-slate-300">{t.rainfallMm} mm/yr</dd>
                      <dt className="text-slate-500">GW development</dt>
                      <dd className="font-mono text-slate-300">{t.stagePct}%</dd>
                      <dt className="text-slate-500">Yield potential</dt>
                      <dd className="text-slate-300">{t.yieldPotential}</dd>
                      <dt className="text-slate-500">CGWB wells</dt>
                      <dd className="font-mono text-slate-300">{wells.length}</dd>
                    </dl>
                    <div className="mt-3 flex gap-2">
                      <Link href={`/analyze?taluka=${t.id}`} className="btn-primary flex-1 !py-2 text-xs">
                        Assess a site here
                      </Link>
                      {t.droughtProne && <Badge tone="amber">drought-prone</Badge>}
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>

        {/* aquifer system */}
        <div className="mt-14">
          <Reveal>
            <SectionHeading
              kicker="Hydrogeology"
              title="The two-aquifer basalt system (NAQUIM)"
              sub="CGWB's aquifer mapping delineates two stacked aquifers in the Deccan basalt, plus thin alluvium along the rivers. Knowing which one your bore targets decides its depth, cost and reliability."
            />
          </Reveal>
          <div className="grid gap-4 lg:grid-cols-3">
            <Reveal>
              <div className="glass h-full border-l-2 border-l-cyan-400 p-6">
                <h3 className="font-semibold text-white">Aquifer-I · 9–30 m</h3>
                <p className="mt-1 text-xs font-medium text-cyan-300">Weathered / jointed basalt (phreatic)</p>
                <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-400">
                  <li>• Water level {AQUIFERS.aq1.swlRangeM[0]}–{AQUIFERS.aq1.swlRangeM[1]} m bgl</li>
                  <li>• Yield {AQUIFERS.aq1.yieldM3PerDay[0]}–{AQUIFERS.aq1.yieldM3PerDay[1]} m³/day (dugwells)</li>
                  <li>• Transmissivity {AQUIFERS.aq1.transmissivityM2PerDay[0]}–{AQUIFERS.aq1.transmissivityM2PerDay[1]} m²/day</li>
                  <li>• {AQUIFERS.aq1.note}</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.07}>
              <div className="glass h-full border-l-2 border-l-blue-400 p-6">
                <h3 className="font-semibold text-white">Aquifer-II · 48–175 m</h3>
                <p className="mt-1 text-xs font-medium text-blue-300">Jointed / fractured basalt (semi-confined)</p>
                <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-400">
                  <li>• Piezometric level {AQUIFERS.aq2.swlRangeM[0]}–{AQUIFERS.aq2.swlRangeM[1]} m bgl</li>
                  <li>• Fracture zones {AQUIFERS.aq2.fractureThickM[0]}–{AQUIFERS.aq2.fractureThickM[1]} m thick — hit or miss</li>
                  <li>• Transmissivity {AQUIFERS.aq2.transmissivityM2PerDay[0]}–{AQUIFERS.aq2.transmissivityM2PerDay[1]} m²/day</li>
                  <li>• {AQUIFERS.aq2.note}</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.14}>
              <div className="glass h-full border-l-2 border-l-amber-400 p-6">
                <h3 className="font-semibold text-white">Alluvium · 2–32 m</h3>
                <p className="mt-1 text-xs font-medium text-amber-300">Sand & gravel river ribbons</p>
                <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-400">
                  <li>• Yield {AQUIFERS.alluvium.yieldM3PerDay[0]}–{AQUIFERS.alluvium.yieldM3PerDay[1]} m³/day</li>
                  <li>• {AQUIFERS.alluvium.note}</li>
                  <li>• Limited extent, so treated as a local bonus rather than a mapped layer.</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        {/* dugwell yields + resistivity guide */}
        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <div className="glass h-full overflow-hidden">
              <div className="border-b border-white/10 px-5 py-4">
                <h3 className="font-semibold text-white">Dugwell yield by formation (CGWB Table-4)</h3>
                <p className="mt-0.5 text-xs text-slate-500">Yields fall as you climb — elevation is a real predictor.</p>
              </div>
              <table className="w-full text-xs">
                <thead className="text-left uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-2 font-semibold">Formation</th>
                    <th className="px-3 py-2 font-semibold">Yield (lpm/day)</th>
                    <th className="px-3 py-2 font-semibold">Elevation (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {DUGWELL_YIELDS.map((r) => (
                    <tr key={r.formation} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-2.5 leading-relaxed text-slate-300">{r.formation}</td>
                      <td className="px-3 py-2.5 font-mono text-cyan-200">
                        {r.yieldLpmDay[0]}–{r.yieldLpmDay[1]}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-400">
                        {r.elevationM[0]}–{r.elevationM[1]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass h-full overflow-hidden">
              <div className="border-b border-white/10 px-5 py-4">
                <h3 className="font-semibold text-white">Reading a VES in Deccan basalt</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  The resistivity signatures the sounding module looks for (DC-resistivity interpretation).
                </p>
              </div>
              <div className="grid grid-cols-4 text-center text-[11px] sm:text-xs">
                {[
                  ['Topsoil', '8–25 Ω·m', 'bg-amber-500/25 text-amber-200'],
                  ['Saturated weathered basalt — TARGET', '20–45 Ω·m', 'bg-cyan-500/25 text-cyan-100'],
                  ['Fractured basalt', '40–110 Ω·m', 'bg-sky-600/25 text-sky-200'],
                  ['Massive basalt', '300–2000 Ω·m', 'bg-slate-500/25 text-slate-300'],
                ].map(([name, rho, cls]) => (
                  <div key={name} className={`px-2 py-6 ${cls}`}>
                    <div className="font-semibold">{name}</div>
                    <div className="mt-1 font-mono opacity-80">{rho}</div>
                  </div>
                ))}
              </div>
              <p className="px-5 py-4 text-xs leading-relaxed text-slate-400">
                A classic H-type curve — resistive cover, conductive saturated middle, resistive basement — is the
                textbook borewell signature here. The assessment’s VES step inverts your readings and checks exactly
                this.
              </p>
            </div>
          </Reveal>
        </div>

        {/* CTA */}
        <Reveal>
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
            <div>
              <h3 className="font-semibold text-white">Browse the 146 documented CGWB wells</h3>
              <p className="mt-1 text-sm text-slate-400">Green = pump-tested success, red = poor/dry, grey = untested.</p>
            </div>
            <Link href="/map" className="btn-primary">Open the wells map</Link>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
