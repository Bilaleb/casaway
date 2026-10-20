/**
 * In-app directions to a depot — the "way" is shown ON the Casaway map
 * instead of redirecting riders to Google Maps.
 *
 * The driving route comes from the public OSRM router (no API key, CORS-
 * enabled); if it is unreachable the caller degrades to a straight-line
 * estimate, so directions always render inside the app. The button merely
 * dispatches a `casaway:directions` event — app.js owns the map layer,
 * geolocation origin and summary toast.
 */
import { el } from './dom.js'
import { distanceMeters } from './stations.js'

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'
const REQUEST_TIMEOUT_MS = 6000
const AVG_URBAN_SPEED_KMH = 22

/**
 * Fetches a driving route from `from` to `to` ([lat,lng] positions).
 * Always resolves with { coordinates, meters, seconds, source } where
 * coordinates are Leaflet-ordered [lat,lng] positions.
 */
export async function fetchDirections(from, to) {
  const query = `${from[1]},${from[0]};${to[1]},${to[0]}`
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(`${OSRM_URL}/${query}?overview=full&geometries=geojson`, {
        signal: controller.signal,
        cache: 'no-cache',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`router responded ${response.status}`)
      const payload = await response.json()
      const route = payload.routes?.[0]
      if (!route?.geometry?.coordinates?.length || !Number.isFinite(route.distance)) {
        throw new Error('router returned no route')
      }
      return {
        coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        meters: route.distance,
        seconds: route.duration,
        source: 'road',
      }
    } finally {
      clearTimeout(timer)
    }
  } catch {
    const meters = distanceMeters(from, to)
    return {
      coordinates: [from, to],
      meters,
      seconds: (meters / 1000 / AVG_URBAN_SPEED_KMH) * 3600,
      source: 'straight',
    }
  }
}

/** Formats metres for the summary toast (metres below 1 km). */
export function formatRouteDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

/**
 * A real <button> that asks app.js to plot directions to `station`.
 * Works identically inside Leaflet popups, the sidebar sheet and any panel.
 */
export function directionsButton(station, { className = 'dir-link', label = 'Show directions' } = {}) {
  return el('button', {
    className,
    text: label,
    attrs: { type: 'button', 'aria-label': `Show directions to ${station.name} on the map` },
    on: {
      click: () =>
        document.dispatchEvent(new CustomEvent('casaway:directions', { detail: { stationId: station.id } })),
    },
  })
}
