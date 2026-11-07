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

function modeToggle(t) {
  const active = fareMode()
  return el('div', { className: 'fare-toggle', attrs: { role: 'group', 'aria-label': t('rateSelection') } },
    [['day', t('day')], ['night', t('nightPlus50')]].map(([mode, label]) =>
      el('button', {
        className: `fare-mode${mode === active ? ' is-active' : ''}`,
        text: label,
        attrs: { type: 'button', 'aria-pressed': String(mode === active), 'data-mode': mode },
        on: { click: () => setFareMode(mode) },
      })
    ))
}

function seatSelector(t) {
  const active = fareSeats()
  return el('div', { className: 'fare-seats' }, [
    el('span', { className: 'fare-label', text: t('seats') }),
    el('div', { className: 'fare-seat-options', attrs: { role: 'group', 'aria-label': t('passengerSeats') } },
      SEAT_OPTIONS.map((count) =>
        el('button', {
          className: `fare-seat${count === active ? ' is-active' : ''}`,
          text: String(count),
          dataset: { seat: String(count) },
          attrs: {
            type: 'button',
            'aria-pressed': String(count === active),
            'aria-label': t('seatCount', count),
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
export function buildFareWidget(station, t = (key) => key) {
  const fare = fareForStation(station)
  if (!fare) {
    return el('div', { className: 'fare-widget is-empty' }, [
      el('p', { className: 'fare-eyebrow', text: t('grandTaxiFare') }),
      el('p', { className: 'fare-note', text: t('fareNotListed') }),
    ])
  }

  const mode = fareMode()
  const seats = fareSeats()
  const perSeat = seatPrice(fare, mode)

  return el('div', { className: 'fare-widget', dataset: { mode, seats: String(seats) } }, [
    el('div', { className: 'fare-head' }, [
      el('span', { className: 'fare-eyebrow', text: t(mode === 'night' ? 'nightFare' : 'dayFare') }),
      modeToggle(t),
    ]),
    el('p', { className: 'fare-route', text: `${fare.origin || station.name} → ${fare.destination}` }),
    seatSelector(t),
    el('div', { className: 'fare-lines' }, [
      fareLine(t('perSeat'), formatMAD(perSeat), { key: 'seat' }),
      fareLine(t('totalSeats', seats), formatMAD(fareTotal(fare, mode, seats)), { className: 'is-total', key: 'total' }),
      fareLine(t('courssaFullTaxi', SEATS_PER_TAXI), formatMAD(courssaTotal(fare, mode)), { className: 'is-courssa', key: 'courssa' }),
    ]),
    el('p', {
      className: 'fare-note',
      text: t('regulatedFareNote', fare.estimatedDistanceKM, fare.estimatedTimeMins),
    }),
  ])
}

/** Sidebar state before a depot is selected: the global toggle + fare range. */
export function buildFareOverview(t = (key) => key) {
  const mode = fareMode()
  return el('div', { className: 'fare-widget fare-overview', dataset: { mode } }, [
    el('div', { className: 'fare-head' }, [
      el('span', { className: 'fare-eyebrow', text: t('perSeat') }),
      modeToggle(t),
    ]),
    el('p', { className: 'fare-route', text: t('pickDepotFare') }),
    fareLine(t('regulatedRange'), formatMADRange(mode), { className: 'is-total' }),
    el('p', {
      className: 'fare-note',
      text: t('courssaNote', SEATS_PER_TAXI),
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
export function updateFareWidget(root, station, t = (key) => key) {
  const fare = fareForStation(station)
  if (!fare || !root || !root.classList.contains('fare-widget')) return false
  const mode = fareMode()
  const seats = fareSeats()

  const eyebrow = root.querySelector('.fare-eyebrow')
  if (eyebrow) eyebrow.textContent = t(mode === 'night' ? 'nightFare' : 'dayFare')

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
  setLine('seat', t('perSeat'), formatMAD(seatPrice(fare, mode)))
  setLine('total', t('totalSeats', seats), formatMAD(fareTotal(fare, mode, seats)))
  setLine('courssa', t('courssaFullTaxi', SEATS_PER_TAXI), formatMAD(courssaTotal(fare, mode)))

  root.dataset.mode = mode
  root.dataset.seats = String(seats)
  return true
}
