import { el, joinWithSeparator } from './dom.js'

export function buildStationIcon(station, isActive = false) {
  const badge = el('span', {
    className: [
      'taxi-marker',
      station.taxiType.includes('&') ? 'mixed' : '',
      isActive ? 'is-active' : '',
    ].filter(Boolean).join(' '),
    text: station.id,
  })
  return L.divIcon({
    className: '',
    html: badge,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -13],
  })
}

export function buildStationPopup(station) {
  return el('div', {}, [
    el('h3', { className: 'popup-title', text: station.name }),
    el('p', { className: 'popup-meta', text: `${station.district} · ${station.taxiType}` }),
    el('p', { className: 'popup-destinations' }, [
      el('b', { text: 'Destinations' }),
      el('br'),
      joinWithSeparator(station.destinations),
    ]),
  ])
}

export function mountStationMarkers(map, stations, onSelect) {
  const layer = L.featureGroup().addTo(map)
  const markerById = new Map()

  for (const station of stations) {
    const marker = L.marker(station.coordinates, {
      icon: buildStationIcon(station),
      title: station.name,
      alt: `${station.taxiType}: ${station.name}`,
    })
      .bindPopup(buildStationPopup(station), { maxWidth: 280 })
      .on('click', () => onSelect(station.id))
      .addTo(layer)
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
