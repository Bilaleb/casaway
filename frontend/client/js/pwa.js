export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Casaway service worker registration failed', error)
    })
  })
}

export function watchConnectivity(bannerElement) {
  const update = () => {
    bannerElement.hidden = navigator.onLine
  }
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
  update()
}

const A2HS_DISMISS_KEY = 'casaway-a2hs-dismissed-at'
const A2HS_RESHOW_MS = 7 * 24 * 60 * 60 * 1000 // re-offer after a week

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

function recentlyDismissed() {
  const dismissedAt = Number(localStorage.getItem(A2HS_DISMISS_KEY) || 0)
  return Date.now() - dismissedAt < A2HS_RESHOW_MS
}

/**
 * Shows the bottom install banner with platform-specific copy:
 * - iOS Safari has no beforeinstallprompt, so we teach Share → Add to Home Screen.
 * - Chromium/Android get the native install prompt through the Install button.
 */
export function setupInstallPrompt({ banner, hint, action, dismiss }) {
  if (!banner || isStandalone() || recentlyDismissed()) return

  const hidePermanently = () => {
    banner.hidden = true
    try { localStorage.setItem(A2HS_DISMISS_KEY, String(Date.now())) } catch { /* private mode */ }
  }

  dismiss?.addEventListener('click', hidePermanently)

  if (isIos()) {
    hint.textContent = 'For a better experience, add Casaway to your Home Screen: tap the Share button, then “Add to Home Screen”.'
    if (action) {
      action.textContent = 'Got it'
      action.addEventListener('click', hidePermanently)
    }
    setTimeout(() => { banner.hidden = false }, 2000)
    return
  }

  let deferredPrompt = null
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    setTimeout(() => { banner.hidden = false }, 1200)
  })

  action?.addEventListener('click', async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    hidePermanently()
  })

  window.addEventListener('appinstalled', hidePermanently)
}
