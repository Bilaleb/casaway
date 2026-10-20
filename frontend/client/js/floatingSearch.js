import { el, replaceChildren } from './dom.js'

/**
 * Floating search bar that sits above the map.
 *
 * Implements the WAI-ARIA 1.2 combobox pattern: the input owns a listbox of
 * suggestions, arrow keys move an "active option", Enter selects it and
 * Escape dismisses the list. Every label is written through textContent, so
 * station names can never inject markup (match highlighting re-uses that
 * guarantee by splitting into <mark> + text nodes).
 */
export function createFloatingSearch({ input, list, emptyStatus, getStations, onSelect, onQuery }) {
  let options = []
  let activeIndex = -1

  /** Splits `label` around the first occurrence of `needle`, wrapping it in <mark>. */
  function highlightParts(label, needle) {
    const at = label.toLocaleLowerCase().indexOf(needle)
    if (!needle || at < 0) return [label]
    const before = label.slice(0, at)
    const hit = label.slice(at, at + needle.length)
    const after = label.slice(at + needle.length)
    return [before, el('mark', { text: hit }), after].filter(Boolean)
  }

  function suggestionRow(station, needle, index) {
    return el('li', {
      className: 'suggestion-row',
      attrs: { role: 'option', id: `search-option-${index}`, 'aria-selected': 'false' },
      dataset: { index: String(index) },
    }, [
      el('span', { className: 'suggestion-name' }, highlightParts(station.name, needle)),
      el('span', { className: 'suggestion-meta', text: `${station.district} · ${station.taxiType}` }),
    ])
  }

  function close() {
    activeIndex = -1
    options = []
    list.hidden = true
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    if (emptyStatus) emptyStatus.textContent = ''
  }

  function markActive(nextIndex) {
    const rows = list.querySelectorAll('[role="option"]')
    rows.forEach((row, index) => {
      const isActive = index === nextIndex
      row.classList.toggle('is-active', isActive)
      row.setAttribute('aria-selected', String(isActive))
      if (isActive) {
        input.setAttribute('aria-activedescendant', row.id)
        row.scrollIntoView({ block: 'nearest' })
      }
    })
    if (nextIndex < 0) input.removeAttribute('aria-activedescendant')
    activeIndex = nextIndex
  }

  function render(stationList, needle) {
    if (!stationList.length) {
      close()
      if (emptyStatus && needle) emptyStatus.textContent = `No dépôts match “${needle}”.`
      return
    }
    options = stationList
    replaceChildren(list, stationList.map((station, index) => suggestionRow(station, needle, index)))
    list.hidden = false
    input.setAttribute('aria-expanded', 'true')
    markActive(-1)
  }

  function computeSuggestions(needle) {
    const pool = getStations() || []
    if (!needle) return []
    const lower = needle.toLocaleLowerCase()
    return pool
      .filter((station) =>
        station.name.toLocaleLowerCase().includes(lower) ||
        station.district.toLocaleLowerCase().includes(lower) ||
        station.destinations.some((target) => target.toLocaleLowerCase().includes(lower)))
      .slice(0, 6)
  }

  function choose(index) {
    const station = options[index]
    if (!station) return
    close()
    input.value = station.name
    onQuery(station.name)
    onSelect(station.id)
  }

  input.addEventListener('input', () => {
    const needle = input.value.trim()
    void onQuery(input.value)
    render(computeSuggestions(needle), needle.toLocaleLowerCase())
  })

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close()
      return
    }
    if (event.key === 'Enter') {
      if (options.length) {
        event.preventDefault()
        choose(activeIndex >= 0 ? activeIndex : 0)
      }
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!options.length) return
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex = (activeIndex + delta + options.length) % options.length
      markActive(nextIndex)
    }
  })

  // Focus leaving the field (to a suggestion or elsewhere) dismisses the list;
  // option clicks mousedown before blur, so hide on click instead of blur.
  input.addEventListener('blur', () => setTimeout(close, 120))
  input.addEventListener('focus', () => {
    const needle = input.value.trim()
    if (needle) render(computeSuggestions(needle), needle.toLocaleLowerCase())
  })

  list.addEventListener('mousedown', (event) => {
    const row = event.target.closest('[data-index]')
    if (!row) return
    event.preventDefault()
    choose(Number(row.dataset.index))
  })

  return { close }
}