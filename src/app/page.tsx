import Link from 'next/link'
import { Reveal, SectionHeading, Badge } from '@/components/ui'

const PROBLEM_STATS = [
  { value: '₹50k–2L', label: 'lost per failed borewell' },
  { value: '146', label: 'real CGWB exploration wells power this platform' },
  { value: '73.9%', label: 'of Pune district’s groundwater already developed (CGWB 2013)' },
  { value: '2', label: 'talukas semi-critical: Baramati & Purandhar' },
]

const FAIL_REASONS = [
  {
    title: 'Random site selection',
    body: 'Drilling spots are picked by convenience, water-diviners, or copying a neighbour — not by hydrogeology. In Deccan basalt, a productive fracture zone can be 50 m from a dry one.',
    icon: 'M12 2v20M2 12h20',
  },
  {
    title: 'No depth planning',
    body: 'Without knowing where the saturated zone starts and ends, bores stop short of water or waste lakhs drilling into dry massive basalt far below the aquifer.',
    icon: 'M12 3v14m0 0l-4-4m4 4l4-4M5 21h14',
  },
  {
    title: 'Ignoring the aquifer type',
    body: 'Weathered basalt, alluvial sand, and laterite profiles store water completely differently. The same drilling plan cannot serve all three.',
    icon: 'M3 7h18M3 12h18M3 17h18',
  },
  {
    title: 'No recharge thinking',
    body: 'Even a good bore fails if extraction outruns monsoon recharge. Rainfall, slope, and land use decide whether the well survives its fifth summer.',
    icon: 'M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3',
  },
]

const GEO_HELPS = [
  {
    title: 'Electrical Resistivity (VES)',
    body: 'Saturated weathered basalt shows a distinct ~20–45 Ω·m signature between resistive dry cover and massive basalt. A Schlumberger sounding maps layer depths before any drilling.',
  },
  {
    title: 'Hydrogeological mapping',
    body: 'Aquifer type, water-table depth, and well-census evidence turn “is there water?” into a measurable, mappable question.',
  },
  {
    title: 'Terrain & recharge analysis',
    body: 'Elevation, slope, rainfall and land use control where the monsoon actually infiltrates — and therefore where wells keep working.',
  },
  {
    title: 'Decision-support AI',
    body: 'AquaSense fuses all factors into a transparent probability, depth window, and yield class — with every number explained.',
  },
]

// the one-line message: geophysics first, AI last
const PIPELINE = ['Electrical Resistivity Survey (VES)', 'Subsurface Interpretation', 'Aquifer Detection', 'Machine Learning', 'Borewell Recommendation']

export default function Home() {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="hero-grid absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <Reveal>
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge tone="cyan">Geophysics-driven site assessment</Badge>
              <Badge tone="green">Built on CGWB · NAQUIM open data</Badge>
            </div>
            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
              Stop drilling blind.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                Find groundwater scientifically.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              AquaSense AI recommends <b className="text-white">where to drill a borewell, how deep, and with what
              chance of success</b> — and it <b className="text-cyan-300">starts with a geophysical survey, not with
              AI</b>. An Electrical Resistivity Survey (VES) images the subsurface; machine learning is the final
              decision-support step.
            </p>
            {/* the central message: geophysics-first pipeline */}
            <div className="mt-7 flex flex-wrap items-center gap-x-1 gap-y-2 text-xs font-semibold sm:text-sm">
              {PIPELINE.map((p, i) => (
                <span key={p} className="flex items-center gap-1">
                  <span className={`rounded-lg border px-2.5 py-1.5 ${i === 0 ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : i === PIPELINE.length - 1 ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                    {p}
                  </span>
                  {i < PIPELINE.length - 1 && <span className="text-cyan-400">→</span>}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/analyze" className="btn-primary">
                Start the VES assessment
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
              <Link href="/map" className="btn-ghost">
                Explore the map
              </Link>
            </div>
          </Reveal>

          {/* problem stats strip */}
          <Reveal delay={0.15}>
            <div className="mt-16 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {PROBLEM_STATS.map((s) => (
                <div key={s.label} className="glass p-4">
                  <div className="text-2xl font-extrabold text-cyan-300">{s.value}</div>
                  <div className="mt-1 text-xs leading-snug text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-600">
              Figures from CGWB “Ground Water Information, Pune District” (2013) and the NAQUIM aquifer-mapping study —
              full citations on the Data Sources page.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <SectionHeading
            kicker="The real problem"
            title="Why borewells fail"
            sub="Across India, borewells are drilled with no subsurface information at all. In Deccan-trap terrain the aquifer is a thin weathered/fractured layer — miss it laterally or vertically and the bore is dry. Each failure burns savings, electricity, and confidence in groundwater itself."
          />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {FAIL_REASONS.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.07}>
              <div className="glass h-full p-6 transition hover:border-cyan-400/30 hover:shadow-glow">
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-3 text-cyan-300">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d={r.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW GEOPHYSICS HELPS ─────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal>
            <SectionHeading
              kicker="The science"
              title="How near-surface geophysics changes the odds"
              sub="Groundwater in basalt is invisible from the surface but not to physics. Resistivity contrasts between dry cover, saturated weathered rock, and massive basalt let us image the aquifer before spending a rupee on drilling."
            />
          </Reveal>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {GEO_HELPS.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.07}>
                <div className="glass h-full p-5">
                  <div className="mb-2 font-mono text-xs font-bold text-cyan-400">{String(i + 1).padStart(2, '0')}</div>
                  <h3 className="font-semibold text-white">{g.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{g.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* resistivity strip illustration */}
          <Reveal delay={0.15}>
            <div className="glass mt-8 overflow-hidden">
              <div className="border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Typical Deccan-trap resistivity column (illustrative)
              </div>
              <div className="grid grid-cols-4 text-center text-[11px] sm:text-xs">
                {[
                  ['Topsoil', '8–25 Ω·m', 'bg-amber-500/25 text-amber-200'],
                  ['Weathered basalt — AQUIFER', '20–45 Ω·m', 'bg-cyan-500/25 text-cyan-100'],
                  ['Fractured basalt', '40–110 Ω·m', 'bg-sky-600/25 text-sky-200'],
                  ['Massive basalt', '300–2000 Ω·m', 'bg-slate-500/25 text-slate-300'],
                ].map(([name, rho, cls]) => (
                  <div key={name} className={`px-2 py-5 ${cls}`}>
                    <div className="font-semibold">{name}</div>
                    <div className="mt-1 font-mono opacity-80">{rho}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── OBJECTIVES ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <SectionHeading kicker="Objectives" title="What this platform delivers" />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Groundwater probability', 'A transparent 0–95 % score built from six weighted hydrogeological factors — never a black box.'],
            ['Depth & yield guidance', 'A recommended drilling window and expected yield class anchored to the local aquifer geometry.'],
            ['Explained recommendations', 'Every output comes with plain-language reasoning and the field surveys to run before drilling.'],
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.07}>
              <div className="glass h-full border-l-2 border-l-cyan-400/60 p-6">
                <h3 className="font-semibold text-white">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="glass-strong relative overflow-hidden p-10 text-center sm:p-14">
            <div className="hero-grid absolute inset-0" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white sm:text-4xl">
                Ready to see the methodology in action?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 sm:text-base">
                Pick a village in Pune district and watch the engine turn geology, rainfall and well evidence into an
                explained drilling recommendation.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/analyze" className="btn-primary">Start the analysis</Link>
                <Link href="/study-area" className="btn-ghost">Read about the study area</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
