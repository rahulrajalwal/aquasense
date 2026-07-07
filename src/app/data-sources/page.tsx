'use client'

import { PageHeader, Reveal, Badge } from '@/components/ui'
import { DATASETS, STATUS_LABELS, REGISTRY_LAST_VERIFIED, type DatasetMeta } from '@/lib/data/datasets'
import { CITATIONS, DATA_VINTAGE_NOTE, LATEST_ASSESSMENT } from '@/lib/data/real/hydro'
import { UpdateStatusCard } from '@/components/DataUpdateCheck'

function statusTone(d: DatasetMeta): 'green' | 'cyan' | 'slate' {
  return d.status === 'integrated' ? 'green' : d.status === 'live' ? 'cyan' : 'slate'
}

export default function DataSourcesPage() {
  const active = DATASETS.filter((d) => d.status !== 'planned')
  const planned = DATASETS.filter((d) => d.status === 'planned')

  return (
    <div>
      <PageHeader
        kicker="Data sources"
        title="Dataset Registry & Citations"
        sub={`Everything the platform runs on, with full provenance — only official government / authorized-organization surveys, verified as the latest publicly available on ${REGISTRY_LAST_VERIFIED}. Every dataset below carries its source, survey year, publication date, resolution and licence.`}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5 text-sm leading-relaxed text-slate-300">
            <b className="text-cyan-300">Citations.</b>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-400">
              {CITATIONS.map((c) => (
                <li key={c.id}>• {c.full}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">{DATA_VINTAGE_NOTE}</p>
            <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
              <b>2023 assessment update:</b> {LATEST_ASSESSMENT.note}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-4">
            <UpdateStatusCard />
          </div>
        </Reveal>

        <h2 className="mt-10 text-lg font-bold text-white">Integrated & live</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {active.map((d, i) => (
            <Reveal key={d.id} delay={i * 0.05}>
              <DatasetCard d={d} />
            </Reveal>
          ))}
        </div>

        <h2 className="mt-12 text-lg font-bold text-white">Planned expansions</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {planned.map((d, i) => (
            <Reveal key={d.id} delay={i * 0.04}>
              <DatasetCard d={d} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}

function DatasetCard({ d }: { d: DatasetMeta }) {
  return (
    <div className="glass h-full p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-white">{d.name}</h3>
        <Badge tone={statusTone(d)}>{STATUS_LABELS[d.status]}</Badge>
      </div>
      <div className="mt-1 text-xs text-slate-500">{d.provider}</div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {(
          [
            ['Kind', d.kind],
            ['Coverage', d.coverage],
            ['Resolution', d.resolution],
            ['Survey year', d.year],
            ['Published', d.published ?? '—'],
            ['License', d.license],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-slate-300">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">{d.note}</p>
      {d.url && (
        <a
          href={d.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs font-semibold text-cyan-300 hover:underline"
        >
          {d.url} ↗
        </a>
      )}
    </div>
  )
}
