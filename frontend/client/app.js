/**
 * Casaway client bootstrap.
 *
 * Loads depots and route trajectories from the /api/routes endpoints, renders
 * them on the Leaflet map (depot markers + gold #E5C158 polylines) and keeps
 * an IndexedDB snapshot so the PWA still boots offline. Every network call
 * degrades gracefully: API -> IndexedDB/localStorage snapshot -> bundled list.
 */
import { DEFAULT_ZOOM, STATION_FOCUS_ZOOM, GOLD } from './js/constants.js'
import { el } from './js/dom.js'
import { createMap, focusOn, fitLayer, recenter } from './js/map.js'
import { STATIONS, formatDistance, distanceMeters } from './js/stations.js'
import { mountStationMarkers, styleStationMarkers } from './js/markers.js'
import { createStationList } from './js/sidebar.js'
import { createRoutePanel } from './js/routePanel.js'
import { buildRoutePopup, routesForStation } from './js/routes.js'
import { registerServiceWorker, watchConnectivity, setupInstallPrompt } from './js/pwa.js'
import { readSnapshot, writeSnapshot } from './js/offline.js'

const API_BASE = '/api/routes'
const SNAPSHOT_KEY = 'route-catalogue'
const REQUEST_TIMEOUT_MS = 6000
const NEARBY_RADIUS_METERS = 2500
const SEARCH_DEBOUNCE_MS = 300

const ROUTE_LINE_STYLE = {
  color: GOLD,
  opacity: 0.95,
  weight: 5,
  lineCap: 'round',
  lineJoin: 'round',
  className: 'route-line',
}

/* ---------------------------------------------------------------- *
 * API functions
 * ---------------------------------------------------------------- */

/** GET /api/routes with timeout + JSON error handling. */
export async function fetchRoutes() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(API_BASE, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-cache',
    })
    if (!response.ok) throw new Error(`Route catalogue unavailable (${response.status})`)
    const payload = await response.json()
    if (!Array.isArray(payload)) throw new Error('Route catalogue is malformed')
    return payload
  } finally {
    clearTimeout(timer)
  }
}

/** GET /api/routes/search?district=... — server-side district/station search. */
export async function searchRoutes(district) {
  const response = await fetch(`${API_BASE}/search?district=${encodeURIComponent(district)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-cache',
  })
  if (!response.ok) throw new Error(`District search failed (${response.status})`)
  return response.json()
}

/** GET /api/routes/nearby?lat=...&lng=...&maxDistance=... — MongoDB $near results. */
export async function findNearestDepots(lat, lng, maxDistance = NEARBY_RADIUS_METERS) {
  const query = new URLSearchParams({ lat: String(lat), lng: String(lng), maxDistance: String(maxDistance) })
  const response = await fetch(`${API_BASE}/nearby?${query}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-cache',
  })
  if (!response.ok) throw new Error(`Nearby lookup failed (${response.status})`)
  return response.json()
}

/**
 * Loads the catalogue, persisting successful responses to IndexedDB and
 * falling back to the last snapshot when the API is unreachable.
 */
async function loadCatalogue() {
  try {
    const docs = await fetchRoutes()
    await writeSnapshot(SNAPSHOT_KEY, docs)
    return { docs, source: 'network' }
  } catch (error) {
    const snapshot = await readSnapshot(SNAPSHOT_KEY)
    if (snapshot && Array.isArray(snapshot.value) && snapshot.value.length) {
      return { docs: snapshot.value, source: 'cache', savedAt: snapshot.savedAt, error }
    }
    return { docs: [], source: 'unavailable', error }
  }
}

/* ---------------------------------------------------------------- *
 * View models (Mongo documents -> sidebar/map shapes)
 * ---------------------------------------------------------------- */

/** Trajectory length in meters; coordinates are GeoJSON [lng, lat]. */
function trajectoryLengthMeters(coordinates) {
  let total = 0
  for (let index = 1; index < coordinates.length; index += 1) {
    const [lngA, latA] = coordinates[index - 1]
    const [lngB, latB] = coordinates[index]
    total += distanceMeters([latA, lngA], [latB, lngB])
  }
  return total
}

function deriveDestination(name) {
  const match = String(name).match(/\bto\b\s+(.+)$/i)
  return match ? match[1].replace(/\s*\(.*\)$/, '').trim() : ''
}

function toRouteViewModel(doc) {
  const coordinates = doc.trajectory?.coordinates || []
  const meters = coordinates.length > 1 ? trajectoryLengthMeters(coordinates) : null
  return {
    id: doc._id,
    title: doc.name,
    origin: doc.depotName,
    destination: deriveDestination(doc.name) || doc.district,
    taxiType: doc.taxiType,
    fareEstimate: Number.isFinite(doc.fareEstimate) ? `${doc.fareEstimate} MAD` : 'Not available',
    distanceKm: meters ? (meters / 1000).toFixed(1) : null,
    majorStops: [doc.district],
    district: doc.district,
    trajectory: coordinates,
    depotName: doc.depotName,
  }
}

function stationFromDoc(doc, id) {
  return {
    id,
    apiId: doc._id,
    name: doc.depotName || doc.name,
    district: doc.district,
    taxiType: doc.taxiType,
    coordinates: [doc.location.coordinates[1], doc.location.coordinates[0]],
    destinations: [],
  }
}

/** One depot marker per depot, even when several routes share it. */
function toStationViewModels(docs) {
  const depots = new Map()
  docs.forEach((doc) => {
    if (!doc.location?.coordinates || depots.has(doc.depotName)) return
    depots.set(doc.depotName, stationFromDoc(doc, 0))
  })
  // Alphabetical order keeps the numbering stable across loads.
  return [...depots.values()]
    .sort((first, second) => first.name.localeCompare(second.name))
    .map((station, index) => ({ ...station, id: index + 1 }))
}

function stationFromBundled(station) {
  return {
    id: station.id,
    apiId: null,
    name: station.name,
    district: station.district,
    taxiType: station.taxiType,
    coordinates: station.coordinates,
    destinations: [...station.destinations],
  }
}

/* ---------------------------------------------------------------- *
 * App state + boot
 * ---------------------------------------------------------------- */

const dom = {
  menuToggle: document.querySelector('#menu-toggle'),
  sidebar: document.querySelector('#sidebar'),
  offlineBanner: document.querySelector('#offline-banner'),
  stationSearch: document.querySelector('#station-search'),
  taxiFilter: document.querySelector('#taxi-filter'),
  routeSelect: document.querySelector('#route-select'),
  routeInfo: document.querySelector('#route-info'),
  routeState: document.querySelector('#route-state'),
  routeCount: document.querySelector('#route-count'),
  resetView: document.querySelector('#reset-view'),
  locateNearest: document.querySelector('#locate-nearest'),
  depotCount: document.querySelector('#depot-count'),
  installBanner: document.querySelector('#install-banner'),
  installHint: document.querySelector('#install-hint'),
  installAction: document.querySelector('#install-action'),
  dismissInstall: document.querySelector('#dismiss-install'),
}

const map = createMap('map')
const stationList = createStationList({
  listElement: document.querySelector('#station-list'),
  emptyMessage: 'No depots match this search.',
  onSelect: (id) => selectStation(id, true),
})
const routePanel = createRoutePanel({
  selectElement: dom.routeSelect,
  infoElement: dom.routeInfo,
  statusElement: dom.routeState,
  countElement: dom.routeCount,
  onSelect: (id) => showRoute(routes.find((route) => route.id === id)),
})

let stations = []
let routes = []
let activeStationId = null
let activeRouteLayer = null
let userPositionLayer = null
let markerLayer = null
let markerById = new Map()
let searchToken = 0
let userPosition = null
let nearbyRequestInFlight = false
let locationUnavailable = false

function setStatus(message, options = {}) {
  routePanel.setStatus(message, options)
}

function remountMarkers(nextStations) {
  if (markerLayer) map.removeLayer(markerLayer)
  const mounted = mountStationMarkers(map, nextStations, (station) => selectStation(station.id, false))
  markerLayer = mounted.layer
  markerById = mounted.markerById
}

function renderStationList() {
  const shown = stationList.render(stations, {
    query: dom.stationSearch.value,
    taxiType: dom.taxiFilter.value,
    activeId: activeStationId,
  })
  if (dom.depotCount) dom.depotCount.textContent = `${shown.length} station${shown.length === 1 ? '' : 's'} mapped`
  return shown
}

function refreshRouteCatalogue() {
  const visible = activeStationId ? routesForStation(routes, activeStationId) : routes
  routePanel.setCatalogue(visible)
  return visible
}

function selectStation(id, moveMap) {
  const previousId = activeStationId
  if (previousId === id) {
    activeStationId = null
  } else {
    activeStationId = id
    const station = stations.find((item) => item.id === id)
    if (station && moveMap) {
      focusOn(map, station.coordinates, STATION_FOCUS_ZOOM)
      markerById.get(id)?.openPopup()
    }
    // Choosing a place asks (once) for location and lists nearby taxi depots.
    offerNearbyDepots()
  }
  styleStationMarkers(markerById, stations, activeStationId, previousId)
  const visible = refreshRouteCatalogue()
  renderStationList()
  if (activeStationId && visible.length) showRoute(visible[0])
  if (!activeStationId) clearRoute()
  return visible
}

function clearRoute() {
  if (activeRouteLayer) {
    map.removeLayer(activeRouteLayer)
    activeRouteLayer = null
  }
}

function trajectoryEndpoint(label, place) {
  return el('div', {}, [el('b', { text: label }), el('br'), place])
}

/** Draws a stored GeoJSON trajectory as a gold polyline linking its start and end points. */
function showRoute(route) {
  clearRoute()
  if (!route || !route.trajectory || route.trajectory.length < 2) {
    if (route) setStatus('This depot has no stored trajectory yet.')
    return
  }
  setStatus('Loading route trace…')
  const geometry = { type: 'LineString', coordinates: route.trajectory }
  const trace = L.geoJSON(geometry, { style: () => ROUTE_LINE_STYLE })
    .bindPopup(buildRoutePopup(route), { maxWidth: 320, minWidth: 240 })

  const first = route.trajectory[0]
  const last = route.trajectory[route.trajectory.length - 1]
  const startMarker = L.circleMarker([first[1], first[0]], {
    radius: 6, color: '#fff7dd', weight: 2, fillColor: GOLD, fillOpacity: 1,
  }).bindPopup(trajectoryEndpoint('Start', route.origin), { maxWidth: 240 })
  const endMarker = L.circleMarker([last[1], last[0]], {
    radius: 6, color: GOLD, weight: 3, fillColor: '#0b0f19', fillOpacity: 1,
  }).bindPopup(trajectoryEndpoint('End', route.destination), { maxWidth: 240 })

  const group = L.featureGroup([trace, startMarker, endMarker]).addTo(map)
  activeRouteLayer = group
  routePanel.showRoute(route)
  fitLayer(map, group)
  setStatus(`Trace loaded · ${route.distanceKm ? `${route.distanceKm} km` : 'distance unknown'} · illustrative geometry, not an official itinerary.`)
}

/* ---------------------------------------------------------------- *
 * Interactions
 * ---------------------------------------------------------------- */

async function runSearch(query) {
  const token = ++searchToken
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) {
    stations = allStationPool
    remountMarkers(stations)
    renderStationList()
    return stations
  }
  try {
    const docs = await searchRoutes(trimmed)
    if (token !== searchToken) return null
    const matched = docs.map((doc) => {
      const existing = allStationPool.find((station) => station.name === (doc.depotName || doc.name))
      if (existing) return existing
      const station = stationFromDoc(doc, allStationPool.length + 1)
      allStationPool.push(station)
      return station
    })
    stations = matched
    remountMarkers(stations)
    renderStationList()
    if (stations.length) frameStations(stations)
    setStatus(`${stations.length} depot${stations.length === 1 ? '' : 's'} match “${trimmed}”.`)
    return stations
  } catch (error) {
    if (token !== searchToken) return null
    // Offline or API down: keep the sidebar usable with local filtering.
    stations = allStationPool
    remountMarkers(stations)
    renderStationList()
    setStatus(`District search unavailable — filtering locally. (${error.message})`, { error: false })
    return stations
  }
}

// Full depot pool (search narrows the visible set; the pool keeps ids stable).
let allStationPool = []

function frameStations(subset) {
  const bounds = L.latLngBounds(subset.map((station) => station.coordinates))
  if (bounds.isValid()) map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 14, duration: 0.6 })
}

async function locateNearest() {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported by this browser.', { error: true })
    return
  }
  setStatus('Locating you…')
  try {
    const position = await geolocate({ enableHighAccuracy: true, timeout: 10000 })
    userPosition = position
    drawUserPosition(position)
    const { depots, source } = await nearbyDepotsFor(position)
    if (!depots.length) {
      setStatus(`No depots found within ${(NEARBY_RADIUS_METERS / 1000).toFixed(1)} km of you.`, { error: true })
      return
    }
    const nearest = depots[0]
    setStatus(
      `Nearest depot ${source === 'api' ? '(API $near)' : '(offline estimate)'}: ${nearest.station.name} · ${formatDistance(nearest.meters)}`
    )
    selectStation(nearest.station.id, true)
  } catch (error) {
    setStatus(`Could not read your location (${error.message}).`, { error: true })
  }
}

function geolocate({ timeout = 8000, enableHighAccuracy = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('geolocation is not supported'))
    navigator.geolocation.getCurrentPosition(
      (position) => resolve([position.coords.latitude, position.coords.longitude]),
      (error) => reject(error),
      { enableHighAccuracy, timeout, maximumAge: 300000 }
    )
  })
}

/** One fix per session; a denial is remembered so we never nag on every click. */
async function ensureUserPosition() {
  if (userPosition) return userPosition
  if (locationUnavailable) return null
  try {
    userPosition = await geolocate()
    return userPosition
  } catch {
    locationUnavailable = true
    return null
  }
}

function drawUserPosition([latitude, longitude]) {
  if (userPositionLayer) map.removeLayer(userPositionLayer)
  userPositionLayer = L.featureGroup([
    L.circleMarker([latitude, longitude], { radius: 7, color: GOLD, fillColor: GOLD, fillOpacity: 0.9, weight: 2 }),
    L.circle([latitude, longitude], { radius: NEARBY_RADIUS_METERS, color: GOLD, weight: 1, opacity: 0.5, fillOpacity: 0.05 }),
  ]).addTo(map)
}

/** Nearest depots from the API ($near); offline, an estimate from cached depots. */
async function nearbyDepotsFor([latitude, longitude], maxDistance = NEARBY_RADIUS_METERS) {
  try {
    const depots = await findNearestDepots(latitude, longitude, maxDistance)
    // Several documents can share one depot location — show each station once.
    const seen = new Set()
    const entries = []
    for (const doc of depots) {
      const station = allStationPool.find((item) => item.name === (doc.depotName || doc.name))
      if (!station || seen.has(station.id)) continue
      seen.add(station.id)
      entries.push({
        station,
        meters: doc.distanceMeters ?? distanceMeters([latitude, longitude], [doc.location.coordinates[1], doc.location.coordinates[0]]),
      })
    }
    return { source: 'api', depots: entries }
  } catch {
    return {
      source: 'local',
      depots: allStationPool
        .map((station) => ({ station, meters: distanceMeters([latitude, longitude], station.coordinates) }))
        .sort((first, second) => first.meters - second.meters)
        .slice(0, 5),
    }
  }
}

function nearbyPopupContent(depots, source) {
  const rows = depots.slice(0, 4).map(({ station, meters }) =>
    el('button', {
      className: 'nearby-row',
      attrs: { type: 'button', 'aria-label': `Show ${station.name}, ${formatDistance(meters)} away` },
      on: { click: () => { map.closePopup(); selectStation(station.id, true) } },
    }, [
      el('span', { className: 'nearby-name', text: station.name }),
      el('span', { className: 'nearby-distance', text: formatDistance(meters) }),
    ])
  )
  return el('div', { className: 'nearby-popup' }, [
    el('h3', { className: 'popup-title', text: 'Taxi depots near you' }),
    el('p', { className: 'popup-meta', text: source === 'api' ? 'Live from the Casaway API' : 'Offline estimate from cached depots' }),
    ...rows,
  ])
}

/** Asks for location (first time only) and shows taxi depots around the user. */
async function offerNearbyDepots() {
  if (nearbyRequestInFlight) return
  nearbyRequestInFlight = true
  try {
    const position = await ensureUserPosition()
    if (!position) return
    drawUserPosition(position)
    const { depots, source } = await nearbyDepotsFor(position)
    if (!depots.length) return
    L.popup({ maxWidth: 300, minWidth: 240 })
      .setLatLng(position)
      .setContent(nearbyPopupContent(depots, source))
      .openOn(map)
  } finally {
    nearbyRequestInFlight = false
  }
}

let searchDebounce = null
dom.stationSearch?.addEventListener('input', (event) => {
  clearTimeout(searchDebounce)
  const query = event.target.value
  // Local filter first for instant feedback, then the server district search.
  renderStationList()
  searchDebounce = setTimeout(() => runSearch(query), SEARCH_DEBOUNCE_MS)
})
dom.taxiFilter?.addEventListener('change', () => renderStationList())
dom.resetView?.addEventListener('click', () => {
  activeStationId = null
  refreshRouteCatalogue()
  renderStationList()
  clearRoute()
  recenter(map)
})
dom.locateNearest?.addEventListener('click', locateNearest)
dom.menuToggle?.addEventListener('click', () => {
  const open = dom.sidebar.classList.toggle('is-open')
  dom.menuToggle.setAttribute('aria-expanded', String(open))
  setTimeout(() => map.invalidateSize(), 60)
})

/* ---------------------------------------------------------------- *
 * Boot
 * ---------------------------------------------------------------- */

/**
 * Warms the service worker cache with the exact (hashed) bundle URLs this
 * build uses, so an offline reload can boot the app even on first install.
 */
async function warmShellCache() {
  if (!('caches' in window)) return
  try {
    const cache = await caches.open('casaway-v2')
    await cache.addAll(['/', '/styles.css', '/manifest.json', import.meta.url])
  } catch {
    // A cache miss must never block startup; offline falls back to the snapshot.
  }
}

async function bootstrap() {
  registerServiceWorker()
  watchConnectivity(dom.offlineBanner)
  setupInstallPrompt({
    banner: dom.installBanner,
    hint: dom.installHint,
    action: dom.installAction,
    dismiss: dom.dismissInstall,
  })

  const { docs, source, savedAt } = await loadCatalogue()
  allStationPool = docs.length ? toStationViewModels(docs) : STATIONS.map(stationFromBundled)
  stations = allStationPool
  routes = docs.map(toRouteViewModel).filter((route) => route.trajectory.length > 1)

  for (const route of routes) {
    route.originStationId = allStationPool.find((station) => station.name === route.depotName)?.id
    route.destinationStationId = allStationPool.find((station) => station.name === route.destination)?.id
  }
  for (const route of routes) {
    const station = allStationPool.find((item) => item.id === route.originStationId)
    if (station && route.destination && !station.destinations.includes(route.destination)) {
      station.destinations.push(route.destination)
    }
  }

  remountMarkers(stations)
  renderStationList()
  refreshRouteCatalogue()
  if (routes.length) showRoute(routes[0])

  if (source === 'network') {
    setStatus(`${routes.length} route trace${routes.length === 1 ? '' : 's'} · ${stations.length} depots loaded from the Casaway API.`)
    warmShellCache()
  } else if (source === 'cache') {
    setStatus(`Offline — showing the snapshot saved ${new Date(savedAt).toLocaleString()}.`, { error: false })
  } else {
    setStatus('The route API is unreachable and no snapshot exists. Showing the bundled depot list.', { error: true })
  }

  if (stations.length) showAllStationsFallback()
}

function showAllStationsFallback() {
  const bounds = L.latLngBounds(stations.map((station) => station.coordinates))
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [35, 35], maxZoom: DEFAULT_ZOOM })
}

bootstrap().catch((error) => {
  console.error('Casaway failed to start', error)
  setStatus(`Casaway could not start: ${error.message}`, { error: true })
})

// Keep the map sized when the sidebar drawer opens/closes on mobile.
window.addEventListener('resize', () => map.invalidateSize())
