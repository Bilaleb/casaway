import { replaceChildren } from './dom.js'

/**
 * Draggable bottom-sheet panel for route/station details (mobile-first).
 *
 * Snap points are expressed as *visible heights* in px so the sheet works at
 * any viewport size: `peek` shows the handle + heading, `half` ~46% of the
 * map, `full` ~86%. Dragging maps pointer deltas onto the same units, and
 * release picks the nearest snap (or the next one when a flick is fast).
 *
 * Accessibility: the grab handle is a real <button aria-expanded>, ArrowUp /
 * ArrowDown walk the snap points, and every snap change is announced through
 * aria-expanded so screen readers hear the panel grow/shrink.
 */
export function createBottomSheet({ element, grab, close, eyebrow, title, body, onStateChange }) {
  const MIN_VISIBLE = 84
  let state = 'peek'
  let drag = null

  const snapNames = ['peek', 'half', 'full']

  function wrapHeight() {
    return element.parentElement?.clientHeight || window.innerHeight
  }

  function visibleFor(name) {
    const sheetHeight = element.offsetHeight
    const targets = {
      peek: MIN_VISIBLE,
      half: Math.round(wrapHeight() * 0.46),
      full: Math.round(wrapHeight() * 0.86),
    }
    return Math.min(targets[name], sheetHeight)
  }

  function applyTransform(visiblePx) {
    const hidden = element.offsetHeight - visiblePx
    element.style.transform = `translateY(${Math.max(0, hidden)}px)`
  }

  function setState(name, { persist = true } = {}) {
    state = name
    applyTransform(visibleFor(name))
    const expanded = name !== 'peek'
    grab.setAttribute('aria-expanded', String(expanded))
    grab.setAttribute(
      'aria-label',
      expanded ? 'Collapse details panel' : 'Expand details panel'
    )
    if (persist) onStateChange?.(name)
  }

  function currentVisible() {
    const match = /translateY\((-?[\d.]+)px\)/.exec(element.style.transform || '')
    const offset = match ? Number(match[1]) : 0
    return element.offsetHeight - offset
  }

  /* ---------------- Drag ---------------- */

  grab.addEventListener('pointerdown', (event) => {
    drag = { pointerId: event.pointerId, startY: event.clientY, startVisible: currentVisible(), lastY: event.clientY, lastTime: performance.now() }
    // Synthetic/test pointers have no active capture target — never let that
    // abort the drag setup.
    try { grab.setPointerCapture(event.pointerId) } catch { /* best effort */ }
    element.classList.add('is-dragging')
  })

  grab.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return
    const deltaY = event.clientY - drag.startY
    // Finger down slides the sheet down (less visible); finger up reveals more.
    const visible = Math.min(Math.max(drag.startVisible - deltaY, MIN_VISIBLE), element.offsetHeight)
    applyTransform(visible)
    drag.lastY = event.clientY
    drag.lastTime = performance.now()
  })

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return
    const visible = currentVisible()
    // Flicks bias the choice toward the snap the finger was travelling to.
    const samples = snapNames.map((name) => Math.abs(visibleFor(name) - visible))
    let target = snapNames[samples.indexOf(Math.min(...samples))]
    const elapsed = Math.max(1, performance.now() - drag.lastTime)
    const velocity = (event.clientY - drag.lastY) / elapsed
    if (Math.abs(velocity) > 0.6) {
      const order = velocity < 0 ? ['peek', 'half', 'full'] : ['full', 'half', 'peek']
      const from = order.indexOf(target)
      target = order[Math.min(from + 1, order.length - 1)]
    }
    drag = null
    element.classList.remove('is-dragging')
    setState(target)
  }

  grab.addEventListener('pointerup', endDrag)
  grab.addEventListener('pointercancel', endDrag)

  // Plain click (no drag): peek ⇄ half, which is the common one-handed move.
  let pressStart = null
  grab.addEventListener('pointerdown', (event) => { pressStart = { y: event.clientY, t: performance.now() } })
  grab.addEventListener('click', (event) => {
    if (pressStart) {
      const moved = Math.abs(event.clientY - pressStart.y)
      const held = performance.now() - pressStart.t
      pressStart = null
      // A drag already snapped the sheet; ignore the synthetic click.
      if (moved > 8 || held > 400) return
    }
    const name = snapNames[snapNames.indexOf(state)]
    setState(name === 'peek' ? 'half' : 'peek')
  })

  grab.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    const order = ['peek', 'half', 'full']
    const index = order.indexOf(state)
    if (event.key === 'ArrowUp') setState(order[Math.min(index + 1, order.length - 1)])
    else if (event.key === 'ArrowDown') setState(order[Math.max(index - 1, 0)])
    else setState(index === 0 ? 'half' : 'peek')
  })

  close.addEventListener('click', () => hide())

  window.addEventListener('resize', () => {
    if (!element.hidden) setState(state, { persist: false })
  })

  /* ---------------- Public API ---------------- */

  function present({ eyebrow: eyebrowText, title: titleText, content, openAt = 'half' }) {
    eyebrow.textContent = eyebrowText
    title.textContent = titleText
    replaceChildren(body, content)
    element.hidden = false
    // Measure after unhide so snapping uses real heights.
    requestAnimationFrame(() => setState(openAt))
  }

  function hide() {
    element.hidden = true
    onStateChange?.('hidden')
  }

  return { present, hide, getState: () => state }
}