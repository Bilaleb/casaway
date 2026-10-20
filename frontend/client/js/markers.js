import { el, joinWithSeparator } from './dom.js'
import { fareForStation, fareMode, seatPrice, formatMAD } from './fares.js'
import { buildFareWidget } from './fareWidget.js'
import { directionsButton } from './directions.js'

/** Current per-seat price tag ("8.00 MAD") or null for unpriced depots. */
export function stationPriceTag(station) {
  const fare = fareForStation(station)
  const price = seatPrice(fare, fareMode())
  return price === null ? null : formatMAD(price)
}

export function buildStationIcon(station, isActive = false) {
  const priceTag = stationPriceTag(station)
  const badge = el('span', {
    className: [
      'taxi-marker',
      station.taxiType.includes('&') ? 'mixed' : '',
      isActive ? 'is-active' : '',
    ].filter(Boolean).join(' '),
    text: station.id,
  })
  const pin = el('span', { className: 'marker-pin' }, [badge])
  if (priceTag) {
    pin.append(el('span', { className: 'fare-tag', text: priceTag }))
  }
  return L.divIcon({
    className: '',
    html: pin,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -13],
  })
}

/**
 * Updates a marker's price tag in place (text only, node kept).
 *
 * Swapping a marker's icon while its popup is open makes Leaflet drop the
 * popup, so the day/night refresh prefers this; returns false only when the
 * tag's presence changed and a full icon rebuild is unavoidable.
 */
export function updateStationPriceTag(marker, station) {
  const icon = marker.getElement?.()
  if (!icon) return false
  const tag = icon.querySelector('.fare-tag')
  const next = stationPriceTag(station)
  if (next === null) return !tag // priced -> unpriced: rebuild
  if (!tag) return false // unpriced -> priced: rebuild
  tag.textContent = next
  return true
}

export function buildStationPopup(station) {
  const children = [
    el('h3', { className: 'popup-title', text: station.name }),
    el('p', { className: 'popup-meta', text: `${station.district} · ${station.taxiType}` }),
  ]
  if (station.destinations?.length) {
    children.push(
      el('p', { className: 'popup-destinations' }, [
        el('b', { text: 'Destinations' }),
        el('br'),
        joinWithSeparator(station.destinations),
      ]),
    )
  }
  children.push(buildFareWidget(station))
  children.push(
    el('div', { className: 'popup-actions' }, [directionsButton(station, { label: 'Show directions' })]),
  )
  return el('div', {}, children)
}

// Phones get ONE detail surface: the bottom sheet. Binding a Leaflet popup
// as well meant two overlapping panels on a small screen, so markers only
// bind popups where there is room for them.
const POPUP_MEDIA = '(min-width: 761px)'

export function mountStationMarkers(map, stations, onSelect) {
  const layer = L.featureGroup().addTo(map)
  const markerById = new Map()
  const allowsPopups = window.matchMedia(POPUP_MEDIA).matches

  for (const station of stations) {
    const marker = L.marker(station.coordinates, {
      icon: buildStationIcon(station),
      title: station.name,
      alt: `${station.taxiType}: ${station.name}`,
    })
    if (allowsPopups) marker.bindPopup(buildStationPopup(station), { maxWidth: 280 })
    marker.on('click', () => onSelect(station.id)).addTo(layer)
    markerById.set(station.id, marker)
  }

  return { layer, markerById }
}

export function styleStationMarkers(markerById, stations, activeId, previousId) {
  for (const id of [previousId, activeId]) {
    if (id === null || id === undefined) continue
    const station = stations.find((item) => item.id === id)
    const marker = markerById.get(id)
    if (station && marker) marker.setIcon(buildStationIcon(station, id === activeId))
  }
}
