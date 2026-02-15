/**
 * Widget State Persistence Composable
 * Handles localStorage save/restore/migration for widget state.
 * Extracted from widget store for better separation of concerns.
 */
import { ref } from 'vue'

const STATE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const STALE_THRESHOLD = 60 * 60 * 1000 // 1 hour

export function useWidgetPersistence(hotelCodeGetter) {
  let saveTimer = null
  const resultsStale = ref(false)

  function getStorageKey() {
    const code = typeof hotelCodeGetter === 'function' ? hotelCodeGetter() : hotelCodeGetter
    return `maxirez_widget_${code}`
  }

  function saveState(stateGetter) {
    const code = typeof hotelCodeGetter === 'function' ? hotelCodeGetter() : hotelCodeGetter
    if (!code) return

    try {
      const state = { ...stateGetter(), savedAt: Date.now() }
      localStorage.setItem(getStorageKey(), JSON.stringify(state))
    } catch {
      // localStorage full or unavailable
    }
  }

  function debouncedSave(stateGetter) {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveState(stateGetter), 300)
  }

  function migrateFromSessionStorage() {
    try {
      const key = getStorageKey()
      const raw = sessionStorage.getItem(key)
      if (raw) {
        localStorage.setItem(key, raw)
        sessionStorage.removeItem(key)
      }
    } catch {
      // ignore
    }
  }

  function restoreState() {
    try {
      const raw = localStorage.getItem(getStorageKey())
      if (!raw) return null

      const saved = JSON.parse(raw)

      // Expire after TTL
      if (Date.now() - saved.savedAt > STATE_TTL) {
        localStorage.removeItem(getStorageKey())
        return null
      }

      // Mark results as stale if saved more than 1 hour ago
      if (saved.searchResults && Date.now() - saved.savedAt > STALE_THRESHOLD) {
        resultsStale.value = true
      }

      return saved
    } catch {
      return null
    }
  }

  function clearSavedState() {
    try {
      localStorage.removeItem(getStorageKey())
    } catch {
      // ignore
    }
  }

  return {
    resultsStale,
    saveState,
    debouncedSave,
    migrateFromSessionStorage,
    restoreState,
    clearSavedState
  }
}
