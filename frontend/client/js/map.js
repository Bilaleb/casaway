import { CASABLANCA_CENTER, DEFAULT_ZOOM, MAX_ROUTE_ZOOM, TILE_URL, TILE_ATTRIBUTION } from './constants.js'

// `L` is provided by the Leaflet script tag that loads before this module.
export function createMap(elementId) {
  const map = L.map(elementId, { zoomControl: false, preferCanvas: true })
  map.setView(CASABLANCA_CENTER, DEFAULT_ZOOM)
  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map)
  return map
}

export function focusOn(map, coordinates, zoom) {
  map.flyTo(coordinates, Math.max(map.getZoom(), zoom), { duration: 0.55 })
}

/** Fits the viewport to any Leaflet layer that exposes getBounds(). */
export function fitLayer(map, layer, { padding = [56, 56], maxZoom = MAX_ROUTE_ZOOM, duration = 0.7 } = {}) {
  const bounds = layer?.getBounds?.()
  if (!bounds || !bounds.isValid()) return false
  map.flyToBounds(bounds, { padding, maxZoom, duration })
  return true
}

/** Frames every depot at once. */
export function showAllStations(map, layer) {
  return fitLayer(map, layer, { padding: [35, 35], maxZoom: DEFAULT_ZOOM, duration: 0.65 })
}

export function recenter(map) {
  map.flyTo(CASABLANCA_CENTER, DEFAULT_ZOOM, { duration: 0.65 })
}
            