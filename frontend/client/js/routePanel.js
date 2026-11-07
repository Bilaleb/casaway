import { el, replaceChildren } from './dom.js'

function statRow(label, value) {
  return el('div', {}, [
    el('span', { className: 'route-stat-label', text: label }),
    el('span', { className: 'route-stat-value', text: value }),
  ])
}

export function createRoutePanel({ selectElement, infoElement, statusElement, countElement, onSelect, t = (key) => key }) {
  selectElement.addEventListener('change', () => onSelect(selectElement.value))

  function setCatalogue(routes) {
    replaceChildren(selectElement, routes.map((route) => el('option', { text: route.title, attrs: { value: route.id } })))
    selectElement.disabled = routes.length === 0
    countElement.textContent = `GPX / ${String(routes.length).padStart(2, '0')}`
  }

  function showRoute(route) {
    if (!route) return
    selectElement.value = route.id
    replaceChildren(infoElement, [
      statRow(t('origin'), route.origin || t('unavailable')),
      statRow(t('destination'), route.destination || t('unavailable')),
      statRow(t('distance'), route.distanceKm ? `${route.distanceKm} km` : t('unavailable')),
      statRow(t('duration'), route.durationMin ? `≈ ${route.durationMin} min` : t('unavailable')),
      el('div', { className: 'route-stops' }, [
        el('span', { className: 'route-stat-label', text: t('majorStops') }),
        el('span', { className: 'route-stat-value', text: (route.majorStops || []).join(' · ') || t('unavailable') }),
      ]),
    ])
  }

  function setStatus(message, { error = false } = {}) {
    statusElement.textContent = message
    statusElement.classList.toggle('error', error)
  }

  return { setCatalogue, showRoute, setStatus }
}
