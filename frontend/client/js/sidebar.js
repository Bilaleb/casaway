import { el, replaceChildren } from './dom.js'
import { filterStations } from './stations.js'

function stationRow(station, isActive, onSelect) {
  return el('button', {
    className: isActive ? 'station-button is-active' : 'station-button',
    attrs: {
      type: 'button',
      'aria-pressed': String(isActive),
      'aria-label': `${station.name}, ${station.district}, ${station.taxiType}`,
    },
    on: { click: () => onSelect(station.id) },
  }, [
    el('span', { className: 'station-number', text: String(station.id).padStart(2, '0') }),
    el('span', { className: 'station-main' }, [
      el('span', { className: 'station-name', text: station.name }),
      el('span', { className: 'station-sub', text: `${station.district} · ${station.taxiType}` }),
    ]),
    el('span', { className: 'station-dot', attrs: { 'aria-hidden': 'true' } }),
  ])
}

export function createStationList({ listElement, emptyMessage, onSelect }) {
  return {
    /** Renders the filtered depot list and returns the stations it displayed. */
    render(stations, { query = '', taxiType = 'all', activeId = null } = {}) {
      const shown = filterStations(stations, query, taxiType)

      if (!shown.length) {
        replaceChildren(listElement, [el('p', { className: 'no-results', text: emptyMessage })])
        return shown
      }

      replaceChildren(listElement, shown.map((station) => stationRow(station, station.id === activeId, onSelect)))
      return shown
    },
  }
}
