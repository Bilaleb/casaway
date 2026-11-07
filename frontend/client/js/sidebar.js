import { el, replaceChildren } from './dom.js'
import { filterStations } from './stations.js'

function localizeTaxiType(type, t) {
  return type
    .replace(/Grand & Petit Taxi/gi, t('mixedTaxi'))
    .replace(/Grand Taxi/gi, t('grandTaxi'))
    .replace(/Petit Taxi/gi, t('petitTaxi'))
}

function stationRow(station, isActive, onSelect, t) {
  const taxiType = localizeTaxiType(station.taxiType, t)
  return el('button', {
    className: isActive ? 'station-button is-active' : 'station-button',
    attrs: {
      type: 'button',
      'aria-pressed': String(isActive),
      'aria-label': `${station.name}, ${station.district}, ${taxiType}`,
    },
    on: { click: () => onSelect(station.id) },
  }, [
    el('span', { className: 'station-number', text: String(station.id).padStart(2, '0') }),
    el('span', { className: 'station-main' }, [
      el('span', { className: 'station-name', text: station.name }),
      el('span', { className: 'station-sub', text: `${station.district} · ${taxiType}` }),
    ]),
    el('span', { className: 'station-dot', attrs: { 'aria-hidden': 'true' } }),
  ])
}

export function createStationList({ listElement, emptyMessage, onSelect, t = (key) => key }) {
  return {
    /** Renders the filtered depot list and returns the stations it displayed. */
    render(stations, { query = '', taxiType = 'all', activeId = null } = {}) {
      const shown = filterStations(stations, query, taxiType)

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
