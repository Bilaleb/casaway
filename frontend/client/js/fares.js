/**
 * Grand Taxi fare dataset + fare state for Casaway.
 *
 * Mirrors backend/config/fares.js so fares render even when the API (and its
 * seeded Mongo fares) is unreachable — the app's offline-first rule.
 *
 * Casablanca regulations encoded here:
 *  - Fares are charged PER SEAT (6 passenger seats per Grand Taxi).
 *  - Night rates apply after 20:00 (+~50% over the day rate).
 *  - "Courssa" = one passenger buys all 6 seats: per-seat rate x 6.
 *
 * The store holds two global choices — mode (day/night) and seat count — so
 * every surface (marker price tags, popups, sidebar, detail sheet) shows the
 * same numbers. app.js registers the single change handler that re-renders
 * those surfaces; widgets stay subscription-free.
 */

export const SEATS_PER_TAXI = 6
export const NIGHT_START_HOUR = 20 // 20:00 — night rates kick in
export const CURRENCY = 'MAD'
export const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6]

const STORAGE_KEY = 'casaway-fare-mode'
const SEATS_KEY = 'casaway-fare-seats'

/** Regulated per-seat fares for the top 20 Casablanca depots. */
export const FARES = [
  { depotName: 'Place de la Concorde (L-Hammam / Bd Lalla Yacout)', origin: 'Place de la Concorde', destination: 'Oulfa / Maarif', baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 6.5, estimatedTimeMins: 18 },
  { depotName: 'Station Casa-Port', origin: 'Station Casa-Port', destination: 'Ain Sebaa / Bernoussi', baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 7.5, estimatedTimeMins: 20 },
  { depotName: 'Station Casa-Voyageurs', origin: 'Station Casa-Voyageurs', destination: 'Centre Ville / Derb Sultan', baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 3.5, estimatedTimeMins: 12 },
  { depotName: 'Station Garage Allal (Derb Sultan)', origin: 'Station Garage Allal', destination: 'Mediouna / Bouskoura', baseDayPriceMAD: 11.0, baseNightPriceMAD: 16.5, estimatedDistanceKM: 9.0, estimatedTimeMins: 25 },
  { depotName: 'Station Rond-Point Bachkou', origin: 'Station Rond-Point Bachkou', destination: 'Facultés / Oulfa', baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 4.0, estimatedTimeMins: 13 },
  { depotName: 'Station L-Oulfa (Terminus / Bd Moulay Rachid)', origin: 'Station L-Oulfa', destination: 'Maarif / Concorde', baseDayPriceMAD: 8.5, baseNightPriceMAD: 13.0, estimatedDistanceKM: 9.0, estimatedTimeMins: 24 },
  { depotName: 'Station Sidi Bernoussi (Bd Imam Ali)', origin: 'Station Sidi Bernoussi', destination: 'Mohammedia', baseDayPriceMAD: 11.0, baseNightPriceMAD: 16.5, estimatedDistanceKM: 14.0, estimatedTimeMins: 32 },
  { depotName: 'Station Ain Sebaa (L-Gara / Near Train Station)', origin: 'Station Ain Sebaa (L-Gara)', destination: 'Centre Ville', baseDayPriceMAD: 7.5, baseNightPriceMAD: 11.0, estimatedDistanceKM: 6.0, estimatedTimeMins: 17 },
  { depotName: 'Station Maarif (Bd Bir Anzarane / Twin Center)', origin: 'Station Maarif (Bir Anzarane)', destination: 'Hay Hassani', baseDayPriceMAD: 7.5, baseNightPriceMAD: 11.0, estimatedDistanceKM: 4.5, estimatedTimeMins: 14 },
  { depotName: 'Station Hay Hassani (SOUK / Terminus)', origin: 'Station Hay Hassani', destination: 'Lissasfa / Errahma', baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 7.0, estimatedTimeMins: 19 },
  { depotName: "Station Lissasfa (Route d'El Jadida / Rond Point)", origin: 'Station Lissasfa', destination: 'Had Soualem / Errahma', baseDayPriceMAD: 10.0, baseNightPriceMAD: 15.0, estimatedDistanceKM: 11.0, estimatedTimeMins: 28 },
  { depotName: 'Station Derb Omar / Bd Mohammed V', origin: 'Station Derb Omar', destination: 'Ain Sebaa', baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 6.5, estimatedTimeMins: 18 },
  { depotName: 'Station Sidi Moumen (Terminus Tramway Anassi)', origin: 'Station Sidi Moumen (Anassi)', destination: 'Tit Mellil', baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 13.0, estimatedTimeMins: 30 },
  { depotName: 'Station Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)', origin: 'Station Hay Mohammadi', destination: 'Casa-Port', baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 5.5, estimatedTimeMins: 16 },
  { depotName: 'Station Sbata (Rond Point Jamila)', origin: 'Station Sbata (Jamila)', destination: 'Garage Allal', baseDayPriceMAD: 7.5, baseNightPriceMAD: 11.0, estimatedDistanceKM: 4.5, estimatedTimeMins: 14 },
  { depotName: 'Station Ain Chock (Bd Baghdad / Near Faculté)', origin: 'Station Ain Chock', destination: 'Bachkou / Derb Sultan', baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 5.0, estimatedTimeMins: 15 },
  { depotName: 'Station Errahma (Ville Nouvelle / Main Roundabout)', origin: 'Station Errahma', destination: 'Oulfa / Lissasfa', baseDayPriceMAD: 9.0, baseNightPriceMAD: 13.5, estimatedDistanceKM: 9.5, estimatedTimeMins: 25 },
  { depotName: 'Station Tit Mellil (Centre)', origin: 'Station Tit Mellil', destination: 'Bernoussi / Garage Allal', baseDayPriceMAD: 11.0, baseNightPriceMAD: 16.5, estimatedDistanceKM: 14.0, estimatedTimeMins: 33 },
  { depotName: 'Station Sidi Maalouf (Near Technopark)', origin: 'Station Sidi Maalouf', destination: 'Technopark / Bachkou', baseDayPriceMAD: 6.5, baseNightPriceMAD: 10.0, estimatedDistanceKM: 4.0, estimatedTimeMins: 12 },
  { depotName: 'Station Sidi Bernoussi - Tram Terminus', origin: 'Station Sidi Bernoussi Tramway', destination: 'Zone Industrielle', baseDayPriceMAD: 9.5, baseNightPriceMAD: 14.0, estimatedDistanceKM: 5.0, estimatedTimeMins: 15 },
].map((fare) => ({ ...fare, currency: CURRENCY }))

const faresByDepot = new Map(FARES.map((fare) => [fare.depotName, fare]))
const normalize = (value) => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')

/**
 * Looks up a depot's regulated fare. Exact depot name first (both the bundled
 * list and the API use the canonical names), then a normalized-prefix
 * fallback so slight naming drift still resolves.
 */
export function fareForStation(station) {
  if (!station) return null
  if (station.fare && Number.isFinite(station.fare.baseDayPriceMAD)) return station.fare
  const exact = faresByDepot.get(station.name) || faresByDepot.get(station.depotName)
  if (exact) return exact
  const needle = normalize(station.name || station.depotName || '')
  if (!needle) return null
  for (const [key, fare] of faresByDepot) {
    const normalizedKey = normalize(key)
    if (needle.startsWith(normalizedKey.slice(0, 16)) || normalizedKey.startsWith(needle.slice(0, 16))) return fare
  }
  return null
}

/* ------------------------------------------------------------------ *
 * Fare math (per-seat prices, totals, Courssa buyout)
 * ------------------------------------------------------------------ */

export function isNightHour(hour = new Date().getHours()) {
  return hour >= NIGHT_START_HOUR
}

export function defaultFareMode() {
  return isNightHour() ? 'night' : 'day'
}

/** Per-seat price for the active rate. */
export function seatPrice(fare, mode) {
  if (!fare) return null
  return mode === 'night' ? fare.baseNightPriceMAD : fare.baseDayPriceMAD
}

/** Total for `seats` passengers: per-seat rate x seats. */
export function fareTotal(fare, mode, seats) {
  const price = seatPrice(fare, mode)
  return price === null ? null : Math.round(price * seats * 100) / 100
}

/** "Courssa": one passenger buys every seat in the taxi (rate x 6). */
export function courssaTotal(fare, mode) {
  return fareTotal(fare, mode, SEATS_PER_TAXI)
}

export function formatMAD(amount) {
  return amount === null || amount === undefined ? '—' : `${amount.toFixed(2)} ${CURRENCY}`
}

/* ------------------------------------------------------------------ *
 * Global fare store (mode + seats). One handler, set by app.js.
 * ------------------------------------------------------------------ */

let mode = null
let seats = 1
let handler = null
let notifyScheduled = false

/**
 * Notifies the app-level renderer AFTER the current event finishes dispatch.
 * Refreshing synchronously would swap a popup's DOM while the very click that
 * triggered it is still bubbling — the removed button makes the click fall
 * through to the map and close the popup. A microtask runs post-dispatch, so
 * the click completes on intact DOM and rapid changes coalesce into one pass.
 */
function notify() {
  if (notifyScheduled) return
  notifyScheduled = true
  queueMicrotask(() => {
    notifyScheduled = false
    handler?.({ mode: fareMode(), seats: fareSeats() })
  })
}

function readStoredMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'day' || saved === 'night' ? saved : null
  } catch {
    return null // private mode: the clock decides each session
  }
}

function readStoredSeats() {
  try {
    const saved = Number(localStorage.getItem(SEATS_KEY))
    return Number.isInteger(saved) && saved >= 1 && saved <= SEATS_PER_TAXI ? saved : 1
  } catch {
    return 1
  }
}

export function fareMode() {
  if (!mode) mode = readStoredMode() || defaultFareMode()
  return mode
}

export function fareSeats() {
  if (!seats) seats = readStoredSeats()
  return seats
}

/** Switches day/night (or seat count) and notifies the app-level renderer. */
export function setFareMode(next) {
  if (next !== 'day' && next !== 'night') return
  if (next === fareMode()) return
  mode = next
  try { localStorage.setItem(STORAGE_KEY, mode) } catch { /* private mode */ }
  notify()
}

export function setFareSeats(next) {
  const value = Number(next)
  if (!Number.isInteger(value) || value < 1 || value > SEATS_PER_TAXI || value === fareSeats()) return
  seats = value
  try { localStorage.setItem(SEATS_KEY, String(seats)) } catch { /* private mode */ }
  notify()
}

/** app.js registers the single surface-refresh callback here. */
export function onFareChange(callback) {
  handler = callback
}
