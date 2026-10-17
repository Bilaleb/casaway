import { el, replaceChildren } from './dom.js'

const QUEUE_KEY = 'casaway-feedback-queue'
const ENDPOINT = '/api/feedback'

function readQueue() {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // Private mode: the report stays in the form state only.
  }
}

/** Sends one report; resolves true on stored, false on rejected/unreachable. */
async function send(payload) {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Wires the native <dialog> feedback form: client-side validation on top of
 * the HTML5 constraints, a POST to /api/feedback, and an offline queue that
 * retries (on `online` and on the next open) when the API is unreachable.
 */
export function setupFeedbackForm({ dialog, form, status, submitButton, datalist }) {
  let statusTimer = null

  function setStatus(message, { tone = 'muted', sticky = false } = {}) {
    status.textContent = message
    status.className = `form-status tone-${tone}`
    clearTimeout(statusTimer)
    if (!sticky) statusTimer = setTimeout(() => { status.textContent = '' }, 6000)
  }

  async function flushQueue() {
    const queue = readQueue()
    if (!queue.length) return
    const remaining = []
    for (const payload of queue) {
      if (!(await send(payload))) remaining.push(payload)
    }
    writeQueue(remaining)
    return queue.length - remaining.length
  }

  /** Populate the subject datalist from the live station/route names. */
  function setSubjects(names) {
    replaceChildren(datalist, names.map((name) => el('option', { attrs: { value: name } })))
  }

  function open({ subject = '', kind = '' } = {}) {
    if (form.elements.subject && subject) form.elements.subject.value = subject
    if (form.elements.kind && kind) form.elements.kind.value = kind
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    void flushQueue()
    form.elements.details?.focus()
  }

  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close())
  // Click on the backdrop (the dialog element itself, outside the form) closes.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close()
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!form.reportValidity()) return

    const payload = {
      kind: form.elements.kind.value,
      subject: form.elements.subject.value.trim().slice(0, 160),
      details: form.elements.details.value.trim(),
      email: form.elements.email.value.trim(),
      context: { path: location.pathname, userAgent: navigator.userAgent.slice(0, 300) },
    }

    submitButton.disabled = true
    submitButton.textContent = 'Sending…'
    const stored = await send(payload)
    submitButton.disabled = false
    submitButton.textContent = 'Send report'

    if (stored) {
      const sent = await flushQueue()
      setStatus(
        sent > 0 ? `Thanks — your report and ${sent} queued report${sent > 1 ? 's' : ''} were sent.` : 'Thanks — your report was sent.',
        { tone: 'ok' }
      )
      form.reset()
      setTimeout(() => dialog.close(), 900)
      return
    }

    const queue = readQueue()
    queue.push(payload)
    writeQueue(queue.slice(-20))
    setStatus('You appear to be offline — your report is saved and will be sent automatically.', { tone: 'warn', sticky: true })
    form.reset()
    setTimeout(() => dialog.close(), 1400)
  })

  window.addEventListener('online', () => { void flushQueue() })

  return { open, setSubjects, flushQueue }
}