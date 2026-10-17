import { el } from './dom.js'

/** Average Casablanca urban speed used for duration estimates (km/h). */
const AVG_URBAN_SPEED_KMH = 22

/**
 * Pure function: distance in km -> whole minutes, rounded to a readable step.
 * `null` in, `null` out — callers show "Not available".
 */
export function estimateDurationMin(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null
  return Math.max(2, Math.round((distanceKm / AVG_URBAN_SPEED_KMH) * 60))
}

/**
 * Maps a stored taxiType ("Grand Taxi", "Grand & Petit Taxi", ...) onto the
 * rider-facing transit options: Large Taxi, Small Taxi and Bus. Bus lines are
 * not part of the Casaway dataset yet, so that chip renders as honestly
 * unavailable instead of pretending to offer a service.
 */
export function transitOptions(taxiType = '') {
  return [
    { key: 'large', label: 'Large Taxi', available: /grand/i.test(taxiType) },
    { key: 'small', label: 'Small Taxi', available: /petit/i.test(taxiType) },
    { key: 'bus', label: 'Bus', available: false, note: 'Casa bus lines — coming soon' },
  ]
}

export function transitChips(taxiType) {
  const chips = transitOptions(taxiType).map((option) =>
    el('span', {
      className: `transit-chip${option.available ? ' is-available' : ''}`,
      attrs: {
        'aria-disabled': option.available ? 'false' : 'true',
        title: option.available ? option.label : (option.note || 'Not available'),
      },
    }, [
      el('span', { className: 'transit-dot', attrs: { 'aria-hidden': 'true' } }),
      option.label,
      option.available ? null : el('span', { className: 'transit-when', text: ' soon' }),
    ])
  )
  return el('div', { className: 'transit-chips', attrs: { role: 'group', 'aria-label': 'Available transit options' } }, chips)
}

export function durationLabel(distanceKm) {
  const minutes = estimateDurationMin(distanceKm)
  return minutes ? `≈ ${minutes} min` : 'Not available'
}