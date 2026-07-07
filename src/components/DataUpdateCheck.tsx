'use client'

// Dataset update checker: when online, compares the bundled dataset version
// against the manifest of the latest published build; notifies if a newer
// official dataset is available and falls back silently to the bundled
// (official) data when offline or unreachable.

import { useCallback, useEffect, useState } from 'react'
import { LOCAL_MANIFEST, REMOTE_MANIFEST_URL, OFFICIAL_UPDATE_PORTALS } from '@/lib/data/manifest'
import { DATA_LAST_VERIFIED } from '@/lib/data/real/hydro'
import { Badge } from '@/components/ui'

export type UpdateStatus = 'checking' | 'latest' | 'update-available' | 'offline'

const THROTTLE_KEY = 'aquasense.updateCheck.v1'
const THROTTLE_MS = 12 * 60 * 60 * 1000 // auto-check at most twice a day

interface CheckResult {
  status: UpdateStatus
  remoteVersion?: number
  remoteSummary?: string
  checkedAt?: string
}

async function fetchRemote(): Promise<CheckResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { status: 'offline', checkedAt: new Date().toISOString() }
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 7000)
  try {
    const res = await fetch(REMOTE_MANIFEST_URL, { signal: ctrl.signal, cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    const remote = (await res.json()) as { datasetVersion?: number; summary?: string }
    const rv = Number(remote.datasetVersion ?? 0)
    return {
      status: rv > LOCAL_MANIFEST.datasetVersion ? 'update-available' : 'latest',
      remoteVersion: rv,
      remoteSummary: remote.summary,
      checkedAt: new Date().toISOString(),
    }
  } catch {
    return { status: 'offline', checkedAt: new Date().toISOString() }
  } finally {
    clearTimeout(timer)
  }
}

export function useDataUpdate(auto = true) {
  const [result, setResult] = useState<CheckResult>({ status: 'checking' })

  const check = useCallback(async (force = false) => {
    if (!force) {
      try {
        const cached = JSON.parse(window.localStorage.getItem(THROTTLE_KEY) ?? 'null') as
          | (CheckResult & { at: number })
          | null
        if (cached && Date.now() - cached.at < THROTTLE_MS && cached.status !== 'checking') {
          setResult(cached)
          return
        }
      } catch {
        /* ignore corrupted cache */
      }
    }
    setResult({ status: 'checking' })
    const r = await fetchRemote()
    setResult(r)
    try {
      window.localStorage.setItem(THROTTLE_KEY, JSON.stringify({ ...r, at: Date.now() }))
    } catch {
      /* storage unavailable */
    }
  }, [])

  useEffect(() => {
    if (auto) void check(false)
  }, [auto, check])

  return { ...result, check }
}

/** Slim site-wide banner — renders only when a newer dataset is published. */
export function UpdateBanner() {
  const { status } = useDataUpdate(true)
  if (status !== 'update-available') return null
  return (
    <div className="border-b border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-center text-[11px] font-medium text-emerald-200 sm:text-xs">
      A newer official dataset is available in the latest version of AquaSense —{' '}
      <a href="https://github.com/rahulrajalwal" target="_blank" rel="noreferrer" className="font-bold underline">
        get the update
      </a>
      . Until then, assessments use the bundled official survey data.
    </div>
  )
}

/** Full status card for the Data Sources page. */
export function UpdateStatusCard() {
  const { status, remoteSummary, check } = useDataUpdate(true)

  const statusLine = {
    checking: ['Checking for newer official datasets…', 'slate'],
    latest: ['You have the latest bundled dataset — no newer version published.', 'green'],
    'update-available': [`Newer dataset published: ${remoteSummary ?? 'see the latest release'}.`, 'amber'],
    offline: ['Offline / update server unreachable — using the bundled official dataset (full functionality).', 'slate'],
  }[status] as [string, 'slate' | 'green' | 'amber']

  return (
    <div className="glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-white">Dataset version & updates</h3>
        <div className="flex items-center gap-2">
          <Badge tone={statusLine[1]}>
            {status === 'checking' ? 'checking…' : status === 'latest' ? 'up to date' : status === 'update-available' ? 'update available' : 'offline fallback'}
          </Badge>
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => void check(true)}>
            Check now
          </button>
        </div>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
        <div className="flex justify-between gap-3 sm:block">
          <dt className="text-slate-500">Bundled dataset version</dt>
          <dd className="text-slate-300 sm:mt-0.5">
            v{LOCAL_MANIFEST.datasetVersion} · released {LOCAL_MANIFEST.releasedAt}
          </dd>
        </div>
        <div className="flex justify-between gap-3 sm:block">
          <dt className="text-slate-500">Sources last verified as latest available</dt>
          <dd className="text-slate-300 sm:mt-0.5">{DATA_LAST_VERIFIED}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">{statusLine[0]}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        <span className="text-slate-500">Watch for newer official surveys:</span>
        {OFFICIAL_UPDATE_PORTALS.map((p) => (
          <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">
            {p.name} ↗
          </a>
        ))}
      </div>
    </div>
  )
}
