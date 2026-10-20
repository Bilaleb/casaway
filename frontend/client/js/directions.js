/**
 * Directions to a depot.
 *
 * Builds a Google Maps turn-by-turn URL (universal: opens the Maps app on a
 * phone, the web app on a laptop/tablet) from the user's position — when we
 * have one — to the depot coordinates. No API key, works offline-degraded.
 */
import { el } from './dom.js'

export function directionsUrl([lat, lng], from = null) {
  const params = new URLSearchParams({ api: '1', destination: `${lat},${lng}`, travelmode: 'driving' })
  if (from) params.set('origin', `${from[0]},${from[1]}`)
  return `https://www.google.com/maps/dir/?${params}`
}

/** A real <a> so popups/sheets get a native, accessible link. */
export function directionsLink(station, from = null, { className = 'dir-link', label = 'Directions' } = {}) {
  const [lat, lng] = station.coordinates
  return el('a', {
    className,
    text: label,
    attrs: {
      href: directionsUrl([lat, lng], from),
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': `Directions to ${station.name}`,
    },
  })
}
