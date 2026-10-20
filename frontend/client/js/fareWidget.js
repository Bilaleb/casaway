/**
 * Fare calculator widget — used in map popups, the depot sidebar and the
 * detail sheet.
 *
 * Contents: a Day/Night rate toggle (writes the global fare store, so every
 * marker price tag and surface updates in real time), a 1–6 seat selector,
 * the running total, and the "Courssa" full-taxi buyout (per-seat rate x 6).
 * The widget reads all state from the store, so app.js can simply rebuild it
 * when the fare state changes — no per-widget subscriptions to leak.
 */
import { el } from './dom.js'
import {
  FARES,
  SEATS_PER_TAXI,
  SEAT_OPTIONS,
  courssaTotal,
  fareForStation,
  fareMode,
  fareSeats,
  fareTotal,
  formatMAD,
  seatPrice,
  setFareMode,
  setFareSeats,
} from './fares.js'

const modeLabels = { day: 'Day', night: 'Night +50%' }

function modeToggle() {
  const active = fareMode()
  return el('div', { className: 'fare-toggle', attrs: { role: 'group', 'aria-label': 'Day or night rate' } },
    Object.entries(modeLabels).map(([mode, label]) =>
      el('button', {
        className: `fare-mode${mode === active ? ' is-active' : ''}`,
        text: label,
        attrs: { type: 'button', 'aria-pressed': String(mode === active), 'data-mode': mode },
        on: { click: () => setFareMode(mode) },
      })
    ))
}

function seatSelector() {
  const active = fareSeats()
  return el('div', { className: 'fare-seats' }, [
    el('span', { className: 'fare-label', text: 'Seats' }),
    el('div', { className: 'fare-seat-options', attrs: { role: 'group', 'aria-label': 'Passenger seats (1 to 6)' } },
      SEAT_OPTIONS.map((count) =>
        el('button', {
          className: `fare-seat${count === active ? ' is-active' : ''}`,
          text: String(count),
          dataset: { seat: String(count) },
          attrs: {
            type: 'button',
            'aria-pressed': String(count === active),
            'aria-label': `${count} seat${count === 1 ? '' : 's'}`,
          },
          on: { click: () => setFareSeats(count) },
        })
      )),
  ])
}

function fareLine(label, value, { className = '', key = '' } = {}) {
  return el('div', { className: `fare-line ${className}`.trim(), dataset: key ? { key } : {} }, [
    el('span', { text: label }),
    el('b', { text: value }),
  ])
}

/** Full calculator for one depot. Returns null-shown state when unpriced. */
export function buildFareWidget(station) {
  const fare = fareForStation(station)
  if (!fare) {
    return el('div', { className: 'fare-widget is-empty' }, [
      el('p', { className: 'fare-eyebrow', text: 'Grand taxi fare' }),
      el('p', { className: 'fare-note', text: 'Official fare not listed for this dépôt yet.' }),
    ])
  }

  const mode = fareMode()
  const seats = fareSeats()
  const perSeat = seatPrice(fare, mode)

  return el('div', { className: 'fare-widget', dataset: { mode, seats: String(seats) } }, [
    el('div', { className: 'fare-head' }, [
      el('span', { className: 'fare-eyebrow', text: mode === 'night' ? 'Night fare' : 'Day fare' }),
      modeToggle(),
    ]),
    el('p', { className: 'fare-route', text: `${fare.origin || station.name} → ${fare.destination}` }),
    seatSelector(),
    el('div', { className: 'fare-lines' }, [
      fareLine('Per seat', formatMAD(perSeat), { key: 'seat' }),
      fareLine(`Total · ${seats} seat${seats === 1 ? '' : 's'}`, formatMAD(fareTotal(fare, mode, seats)), { className: 'is-total', key: 'total' }),
      fareLine(`Courssa · full taxi (${SEATS_PER_TAXI} seats)`, formatMAD(courssaTotal(fare, mode)), { className: 'is-courssa', key: 'courssa' }),
    ]),
    el('p', {
      className: 'fare-note',
      text: `Regulated Casablanca fare · night rate after 20:00 · est. ${fare.estimatedDistanceKM} km ≈ ${fare.estimatedTimeMins} min`,
    }),
  ])
}

/** Sidebar state before a depot is selected: the global toggle + fare range. */
export function buildFareOverview() {
  const mode = fareMode()
  return el('div', { className: 'fare-widget fare-overview', dataset: { mode } }, [
    el('div', { className: 'fare-head' }, [
      el('span', { className: 'fare-eyebrow', text: 'Per-seat fares' }),
      modeToggle(),
    ]),
    el('p', { className: 'fare-route', text: 'Pick a dépôt to calculate its fare — 6 seats per grand taxi.' }),
    fareLine('Regulated range', formatMADRange(mode), { className: 'is-total' }),
    el('p', {
      className: 'fare-note',
      text: `Courssa = all ${SEATS_PER_TAXI} seats · night rate after 20:00`,
    }),
  ])
}

function formatMADRange(mode) {
  const prices = FARES.map((fare) => seatPrice(fare, mode))
  return `${Math.min(...prices).toFixed(2)} – ${Math.max(...prices).toFixed(2)} MAD`
}

/**
 * Mutates an already-rendered widget in place — no nodes are replaced.
 *
 * Leaflet closes a popup when the DOM inside it is swapped while it is open
 * (setContent/setIcon), so the live day/night + seat refresh path uses this
 * instead of rebuilding: texts and pressed-states are written onto the
 * existing elements.
 */
export function updateFareWidget(root, station) {
  const fare = fareForStation(station)
  if (!fare || !root || !root.classList.contains('fare-widget')) return false
  const mode = fareMode()
  const seats = fareSeats()

  const eyebrow = root.querySelector('.fare-eyebrow')
  if (eyebrow) eyebrow.textContent = mode === 'night' ? 'Night fare' : 'Day fare'

  root.querySelectorAll('.fare-mode').forEach((button) => {
    const isActive = button.dataset.mode === mode
    button.classList.toggle('is-active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
  })
  root.querySelectorAll('.fare-seat').forEach((button) => {
    const isActive = Number(button.dataset.seat) === seats
    button.classList.toggle('is-active', isActive)
    button.setAttribute('aria-pressed', String(isActive))
  })

  const setLine = (key, label, value) => {
    const row = root.querySelector(`.fare-line[data-key="${key}"]`)
    if (!row) return
    const span = row.querySelector('span')
    const bold = row.querySelector('b')
    if (span) span.textContent = label
    if (bold) bold.textContent = value
  }
  setLine('seat', 'Per seat', formatMAD(seatPrice(fare, mode)))
  setLine('total', `Total · ${seats} seat${seats === 1 ? '' : 's'}`, formatMAD(fareTotal(fare, mode, seats)))
  setLine('courssa', `Courssa · full taxi (${SEATS_PER_TAXI} seats)`, formatMAD(courssaTotal(fare, mode)))

  root.dataset.mode = mode
  root.dataset.seats = String(seats)
  return true
}
