import { GOLD, ROUTE_MANIFEST_URL } from './constants.js'
import { el } from './dom.js'

const GPX_LINE_STYLE = {
  color: GOLD,
  opacity: 0.95,
  weight: 5,
  lineCap: 'round',
  lineJoin: 'round',
  className: 'route-line',
}

const GPX_MARKER_STYLE = {
  startIconUrl: '',
  endIconUrl: '',
  shadowUrl: '',
  wptIconUrls: {},
}

export async function loadRouteCatalogue() {
  const response = await fetch(ROUTE_MANIFEST_URL, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Route catalogue unavailable (${response.status})`)
  const payload = await response.json()
  const routes = Array.isArray(payload) ? payload : payload.routes
  if (!Array.isArray(routes)) throw new Error('Route catalogue is malformed')
  return routes.filter((route) => route && route.id && route.gpx)
}

export function routesForStation(routes, stationId) {
  if (!stationId) return routes
  return routes.filter((route) => route.originStationId === stationId || route.destinationStationId === stationId)
}

export function describeRoute(route) {
  return [route.taxiType, route.distanceKm ? `${route.distanceKm} km` : null, route.durationMin ? `about ${route.durationMin} min` : null]
    .filter(Boolean)
    .join(' · ')
}

function infoRow(label, value) {
  return el('span', { className: 'popup-row' }, [
    el('b', { text: label }),
    ' ',
    value,
    el('br'),
  ])
}

export function buildRoutePopup(route) {
  return el('div', {}, [
    el('h3', { className: 'popup-title', text: route.title }),
    el('p', { className: 'popup-meta', text: describeRoute(route) || 'Illustrative taxi route' }),
    el('p', { className: 'popup-destinations' }, [
      infoRow('Origin', route.origin),
      infoRow('Destination', route.destination),
      infoRow('Major stops', (route.majorStops || []).join(' · ') || 'Not available'),
    ]),
  ])
}

/**
 * Draws one GPX trajectory. The layer is returned immediately so callers can
 * remove it before drawing the next route.
 */
export function drawRoute(map, route, { onLoaded, onError } = {}) {
  const layer = new L.GPX(route.gpx, {
    async: true,
    polyline_options: GPX_LINE_STYLE,
    marker_options: GPX_MARKER_STYLE,
  })

  layer.bindPopup(buildRoutePopup(route), { maxWidth: 320, minWidth: 240 })
  layer.on('click', (event) => layer.openPopup(event.latlng))
  layer.on('loaded', (event) => onLoaded?.(event.target))
  layer.on('error', () => onError?.(route))
  layer.addTo(map)
  return layer
}
