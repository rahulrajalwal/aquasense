'use client'

// Shared client state: the site the user last analyzed. Persisted to
// localStorage so the Dashboard and Report pages continue from the
// Analyze page's result.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { SiteInput } from '@/lib/engine/assessReal'
import { talukaByIdReal } from '@/lib/data/real/talukas'

const KEY = 'aquasense.site.v4'

export const DEFAULT_SITE: SiteInput = {
  talukaId: 'haveli',
  placeName: '',
  lat: null,
  lon: null,
  knownWaterTableM: '',
  nearbyBoreDepthM: '',
  nearbyOutcome: 'unknown',
  ves: null,
}

interface AppState {
  site: SiteInput | null
  setSite: (s: SiteInput | null) => void
  hydrated: boolean
}

const Ctx = createContext<AppState>({ site: null, setSite: () => {}, hydrated: false })

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [site, setSiteRaw] = useState<SiteInput | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (raw) {
        const s = JSON.parse(raw) as SiteInput
        if (s && talukaByIdReal(s.talukaId)) setSiteRaw({ ...DEFAULT_SITE, ...s })
      }
    } catch {
      /* corrupted state — start fresh */
    }
    setHydrated(true)
  }, [])

  const setSite = (s: SiteInput | null) => {
    setSiteRaw(s)
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s))
    else window.localStorage.removeItem(KEY)
  }

  return <Ctx.Provider value={{ site, setSite, hydrated }}>{children}</Ctx.Provider>
}

export const useAppState = () => useContext(Ctx)
