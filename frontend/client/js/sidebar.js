import { el, replaceChildren } from './dom.js'
import { filterStations } from './stations.js'

function localizeTaxiType(type, t) {
  return t('taxiTypeName', type)
}

function stationRow(station, isActive, onSelect, t) {
  const taxiType = localizeTaxiType(station.taxiType, t)
  const name = t('placeName', station.name)
  const district = t('placeName', station.district)
  return el('button', {
    className: isActive ? 'station-button is-active' : 'station-button',
    attrs: {
      type: 'button',
      'aria-pressed': String(isActive),
      'aria-label': `${name}, ${district}, ${taxiType}`,
    },
    on: { click: () => onSelect(station.id) },
  }, [
    el('span', { className: 'station-number', text: String(station.id).padStart(2, '0') }),
    el('span', { className: 'station-main' }, [
      el('span', { className: 'station-name', text: name }),
      el('span', { className: 'station-sub', text: `${district} · ${taxiType}` }),
    ]),
    el('span', { className: 'station-dot', attrs: { 'aria-hidden': 'true' } }),
  ])
}

export function createStationList({ listElement, emptyMessage, onSelect, t = (key) => key }) {
  return {
    /** Renders the filtered depot list and returns the stations it displayed. */
    render(stations, { query = '', taxiType = 'all', activeId = null } = {}) {
      const shown = filterStations(stations, query, taxiType, (value) => t('placeName', value))

      if (!shown.length) {
        const message = typeof emptyMessage === 'function' ? emptyMessage() : emptyMessage
        replaceChildren(listElement, [el('p', { className: 'no-results', text: message })])
        return shown
      }

      replaceChildren(listElement, shown.map((station) => stationRow(station, station.id === activeId, onSelect, t)))
      return shown
    },
  }
}
