import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="text-base font-bold text-white">AquaSense AI</div>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
            AI-powered borewell site recommendation for Pune district, built on near-surface geophysics and
            published CGWB / NAQUIM datasets.
          </p>
          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Developed by</div>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-sm font-bold text-cyan-200 ring-1 ring-cyan-400/30">
                RM
              </span>
              <div>
                <div className="text-sm font-semibold text-slate-200">Rahul Meena</div>
                <a
                  href="https://github.com/rahulrajalwal"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-cyan-300"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                  </svg>
                  github.com/rahulrajalwal
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Platform</div>
          <div className="grid grid-cols-2 gap-1">
            {[
              ['/study-area', 'Study Area'],
              ['/map', 'Interactive Map'],
              ['/analyze', 'Analyze'],
              ['/dashboard', 'Dashboard'],
              ['/data-sources', 'Data Sources'],
              ['/report', 'Report'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="py-1 text-slate-400 transition hover:text-cyan-300">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="text-xs leading-relaxed text-slate-500">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Disclaimer</div>
          Assessments are decision support built on published CGWB/NAQUIM data — not a substitute for an on-site
          geophysical survey (VES/ERT) or a licensed hydrogeologist. Respect groundwater regulations, especially in
          stressed talukas.
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-center text-[11px] text-slate-600">
        © {new Date().getFullYear()} Rahul Meena · AquaSense AI · Data: Central Ground Water Board & GSDA (Govt. of
        India / Govt. of Maharashtra)
      </div>
    </footer>
  )
}
