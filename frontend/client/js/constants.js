export const APP_NAME = 'Casaway'
export const APP_TAGLINE = 'Casablanca Taxi Navigator'
export const DISCLAIMER = 'Casaway is an independent open-source project and is not affiliated with Casa Transport or local transit authorities.'

export const CASABLANCA_CENTER = [33.5731, -7.5898]
export const DEFAULT_ZOOM = 12
export const STATION_FOCUS_ZOOM = 14
export const MAX_ROUTE_ZOOM = 14

// OpenStreetMap standard tiles need no API key (CARTO raster tiles now require one).
// styles.css darkens them to keep the night-map look.
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export const ROUTE_MANIFEST_URL = '/routes/manifest.json'

export const GOLD = '#e5c158'
export const TAXI_FILTERS = {
  ALL: 'all',
  GRAND: 'grand',
  PETIT: 'petit',
}

export const TAXI_LABELS = {
  grand: 'Grand taxi',
  petit: 'Petit taxi',
  all: 'All stations',
}

export const METERS_PER_KILOMETER = 1000
