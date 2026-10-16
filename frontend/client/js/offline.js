const DB_NAME = 'casaway-offline'
const DB_VERSION = 1
const STORE = 'snapshots'

let databasePromise = null

function openDatabase() {
  if (databasePromise) return databasePromise
  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB is unavailable'))
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('IndexedDB open blocked'))
  })
  return databasePromise
}

const localStorageFallbackKey = (key) => `casaway-snapshot-${key}`

/**
 * Persists the last good API payload so the PWA can boot offline.
 * Falls back to localStorage when IndexedDB is blocked (private tabs, etc.).
 */
export async function writeSnapshot(key, value) {
  const record = { value, savedAt: new Date().toISOString() }
  try {
    const database = await openDatabase()
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite')
      transaction.objectStore(STORE).put(record, key)
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    return true
  } catch {
    try {
      localStorage.setItem(localStorageFallbackKey(key), JSON.stringify(record))
      return true
    } catch {
      return false
    }
  }
}

/** Reads a previously stored snapshot, or null when none exists. */
export async function readSnapshot(key) {
  try {
    const database = await openDatabase()
    const record = await new Promise((resolve, reject) => {
      const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
    if (record) return record
  } catch {
    // fall through to the localStorage fallback below
  }
  try {
    return JSON.parse(localStorage.getItem(localStorageFallbackKey(key)) || 'null')
  } catch {
    return null
  }
}
