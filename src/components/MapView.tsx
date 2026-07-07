'use client'

// Leaflet map of the real CGWB exploration wells, Pune district.

import { Fragment, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Polygon, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { locatedWells, wellOutcome, nearestWells, type CgwbWell } from '@/lib/data/real/wells'
import { TALUKA_NAME_TO_ID, talukaByIdReal } from '@/lib/data/real/talukas'

export const outcomeColor = (w: CgwbWell) =>
  w.yieldLps === null ? '#94a3b8' : wellOutcome(w) === 1 ? '#34d399' : '#fb7185'

/** Dashed hull around the documented wells — the data extent. */
function dataExtent(): [number, number][] {
  const ws = locatedWells()
  const lats = ws.map((w) => w.lat!)
  const lons = ws.map((w) => w.lon!)
  const pad = 0.08
  const s = Math.min(...lats) - pad
  const n = Math.max(...lats) + pad
  const w = Math.min(...lons) - pad
  const e = Math.max(...lons) + pad
  return [
    [s, w],
    [n - 0.15, w + 0.04],
    [n, (w + e) / 2],
    [n - 0.04, e],
    [s + 0.12, e - 0.03],
    [s, (w + e) / 2],
  ]
}

function FlyTo({ well }: { well: CgwbWell | null }) {
  const map = useMap()
  useEffect(() => {
    if (well && well.lat !== null) map.flyTo([well.lat, well.lon!], 12, { duration: 0.9 })
  }, [well, map])
  return null
}

function ClickProbe() {
  const [pt, setPt] = useState<{ lat: number; lng: number } | null>(null)
  useMapEvents({
    click(e) {
      setPt(e.latlng)
    },
  })
  const near = useMemo(() => (pt ? nearestWells(pt.lat, pt.lng, 1) : []), [pt])

  if (!pt) return null
  const n = near[0]
  const talukaId = n ? TALUKA_NAME_TO_ID[n.well.taluka] : undefined
  return (
    <CircleMarker
      center={[pt.lat, pt.lng]}
      radius={6}
      pathOptions={{ color: '#67e8f9', weight: 2, fillColor: '#67e8f9', fillOpacity: 0.4 }}
    >
      <Popup>
        <div className="min-w-[200px] text-xs leading-relaxed">
          <b>Selected point</b>
          <br />
          {pt.lat.toFixed(4)}°N, {pt.lng.toFixed(4)}°E
          {n && (
            <>
              <br />
              Nearest CGWB well: <b>{n.well.village}</b> ({n.km} km,{' '}
              {n.well.yieldLps === null ? 'not tested' : `yield ${n.well.yieldRaw}`})
            </>
          )}
          <div className="mt-2">
            <Link
              href={`/analyze?taluka=${talukaId ?? ''}&lat=${pt.lat.toFixed(4)}&lon=${pt.lng.toFixed(4)}`}
              className="font-semibold text-cyan-300 underline"
            >
              Analyze this exact spot →
            </Link>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  )
}

export default function MapView({
  selectedSno,
  onSelect,
}: {
  selectedSno: number | null
  onSelect: (sno: number) => void
}) {
  const wells = locatedWells()
  const selected = wells.find((w) => w.sno === selectedSno) ?? null

  return (
    <MapContainer center={[18.55, 74.1]} zoom={9} className="h-full w-full rounded-2xl" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <Polygon
        positions={dataExtent()}
        pathOptions={{ color: '#38bdf8', weight: 1.5, dashArray: '6 8', fillColor: '#38bdf8', fillOpacity: 0.03 }}
      >
        <Tooltip sticky>CGWB exploration-data extent (approximate)</Tooltip>
      </Polygon>

      <FlyTo well={selected} />
      <ClickProbe />

      {wells.map((w) => {
        const isSel = w.sno === selectedSno
        const talukaId = TALUKA_NAME_TO_ID[w.taluka]
        const taluka = talukaByIdReal(talukaId ?? '')
        return (
          <Fragment key={w.sno}>
            <CircleMarker
              center={[w.lat!, w.lon!]}
              radius={isSel ? 12 : w.type === 'EW' ? 8 : 6}
              pathOptions={{
                color: '#fff',
                weight: isSel ? 2.5 : 1.2,
                fillColor: outcomeColor(w),
                fillOpacity: 0.85,
              }}
              eventHandlers={{ click: () => onSelect(w.sno) }}
            >
              <Tooltip>
                {w.village} ({w.type})
              </Tooltip>
              <Popup>
                <div className="min-w-[220px] text-xs leading-relaxed">
                  <div className="text-sm font-bold">
                    {w.village} <span className="font-normal opacity-70">· CGWB {w.type}</span>
                  </div>
                  <div className="opacity-70">
                    {w.taluka} taluka · {w.lat!.toFixed(4)}°N, {w.lon!.toFixed(4)}°E
                  </div>
                  <hr className="my-1.5 border-white/20" />
                  Drilled: <b>{w.depthM ?? '—'} m</b>
                  <br />
                  Pre-monsoon water level: {w.preSwlM ?? '—'} m bgl
                  <br />
                  Pump-test yield:{' '}
                  <b style={{ color: outcomeColor(w) }}>
                    {w.yieldLps === null ? 'not tested' : w.yieldRaw}
                  </b>
                  <br />
                  Aquifer-I to {w.aq1BottomM ?? '—'} m · Aquifer-II ~{w.aq2BottomM ?? '—'} m (
                  {w.aq2ThickM ?? '—'} m thick)
                  {w.note && <div className="mt-1 opacity-60">{w.note}</div>}
                  <div className="mt-2">
                    <Link
                      href={`/analyze?taluka=${talukaId ?? ''}&place=${encodeURIComponent(w.village)}&lat=${w.lat}&lon=${w.lon}`}
                      className="font-semibold text-cyan-300 underline"
                    >
                      Analyze near this well →
                    </Link>
                  </div>
                  {taluka && (
                    <div className="mt-1 opacity-60">
                      {taluka.name}: {taluka.rainfallMm} mm/yr · development {taluka.stagePct}%
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        )
      })}
    </MapContainer>
  )
}
