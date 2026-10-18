/**
 * Dark/light theme switch.
 *
 * The chosen theme is stamped on <html data-theme> before first paint by the
 * inline boot script in index.html (no flash); this module keeps the toggle
 * button, the aria-label, the theme-color meta tag and localStorage in sync.
 * Until the user explicitly picks a theme, OS changes are followed live.
 */

const STORAGE_KEY = 'casaway-theme'
const THEME_COLOR = { dark: '#0b0f19', light: '#f6f4ee' }

export function storedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null // private mode: theme lives for this session only
  }
}

export function currentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme, { persist = false } = {}) {
  document.documentElement.dataset.theme = theme
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* private mode */ }
  }
  const toggle = document.querySelector('#theme-toggle')
  if (toggle) {
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[theme])
}

export function setupTheme() {
  const toggle = document.querySelector('#theme-toggle')
  const saved = storedTheme()
  applyTheme(saved || currentTheme())

  toggle?.addEventListener('click', () => {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', { persist: true })
  })

  if (!saved && window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    media.addEventListener?.('change', (event) => applyTheme(event.matches ? 'light' : 'dark'))
  }
}
