import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePartnerStore } from '@/stores/partner'
import partnerService from '@/services/partnerService'
import authService from '@/services/authService'

const DEFAULT_THEME_ID = 'mini'

export const ADMIN_THEME_IDS = [
  'mini', // default (Mini brand)
  'ocean',
  'nord',
  'graphite',
  'sand',
  'forest',
  'rose',
  'sunset',
  'lavender',
  'emerald',
  'citrus',
  'cyber',
  'slate',
  'coffee',
  'winter',
  'aurora',
  'candy',
  'abyss',
  'silk',
  'vintage'
]

// Backwards compatibility for old stored/theme values
const THEME_ALIASES = {
  'midnight-blue': 'mini',
  midnightBlue: 'mini'
}

const normalizeThemeId = themeId => {
  if (!themeId || typeof themeId !== 'string') return null
  const trimmed = themeId.trim()
  const mapped = THEME_ALIASES[trimmed] || trimmed
  return ADMIN_THEME_IDS.includes(mapped) ? mapped : null
}

const getLocalStorageKey = contextKey => `adminTheme:${contextKey}`

export const useThemeStore = defineStore('theme', () => {
  const authStore = useAuthStore()
  const partnerStore = usePartnerStore()

  const themeId = ref(DEFAULT_THEME_ID)
  const initialized = ref(false)

  const effectivePartnerId = computed(() => {
    // Partner users: theme is tied to their own accountId
    if (authStore.accountType === 'partner') {
      return authStore.user?.accountId || null
    }
    // Platform admin viewing as partner: use selected partner
    if (authStore.isPlatformAdmin && partnerStore.selectedPartner?._id) {
      return partnerStore.selectedPartner._id
    }
    return null
  })

  const contextKey = computed(() => {
    // Include user ID for user-level caching
    const userId = authStore.user?.id || authStore.user?._id
    if (userId) {
      return `user:${userId}`
    }
    return effectivePartnerId.value ? `partner:${effectivePartnerId.value}` : 'platform'
  })

  const applyTheme = nextThemeId => {
    const normalized = normalizeThemeId(nextThemeId) || DEFAULT_THEME_ID
    themeId.value = normalized
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = normalized
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(getLocalStorageKey(contextKey.value), normalized)
    }
  }

  const applyThemeFromLocalCache = () => {
    if (typeof window === 'undefined') return false
    const cached = localStorage.getItem(getLocalStorageKey(contextKey.value))
    const normalized = normalizeThemeId(cached)
    if (normalized) {
      applyTheme(normalized)
      return true
    }
    return false
  }

  const applyThemeForPlatformAdminSelectedPartner = async () => {
    const partnerId = partnerStore.selectedPartner?._id
    if (!partnerId) return

    const themeFromPartner = normalizeThemeId(partnerStore.selectedPartner?.branding?.adminTheme)
    if (themeFromPartner) {
      applyTheme(themeFromPartner)
      return
    }

    // Fall back to local cache first (fast, offline-friendly)
    if (applyThemeFromLocalCache()) return

    // Last resort: fetch partner once to resolve theme (handles first rollout / stale partner object)
    try {
      const response = await partnerService.getPartner(partnerId)
      const resolved = normalizeThemeId(response?.data?.branding?.adminTheme)
      if (resolved) {
        applyTheme(resolved)
        // Keep selectedPartner in-sync so subsequent switches are instant
        const updated = {
          ...partnerStore.selectedPartner,
          branding: {
            ...(partnerStore.selectedPartner?.branding || {}),
            adminTheme: resolved
          }
        }
        partnerStore.selectPartner(updated)
        return
      }
    } catch {
      // ignore and use default
    }

    applyTheme(DEFAULT_THEME_ID)
  }

  const applyThemeForPartnerUser = async () => {
    // Priority 1: User's personal preference (overrides partner branding)
    const userTheme = normalizeThemeId(authStore.user?.preferences?.adminTheme)
    if (userTheme) {
      applyTheme(userTheme)
      return
    }

    // Priority 2: Partner's branding theme (from account in authStore)
    const partnerTheme = normalizeThemeId(authStore.account?.branding?.adminTheme)
    if (partnerTheme) {
      applyTheme(partnerTheme)
      return
    }

    // Priority 3: Try local cache
    if (applyThemeFromLocalCache()) return

    // Priority 4: Fetch from API
    try {
      const response = await partnerService.getMyProfile()
      // First check user preferences from the response
      const userPref = normalizeThemeId(response?.data?.user?.preferences?.adminTheme)
      if (userPref) {
        applyTheme(userPref)
        return
      }
      // Fall back to partner branding
      const resolved = normalizeThemeId(response?.data?.branding?.adminTheme)
      if (resolved) {
        applyTheme(resolved)
        return
      }
    } catch {
      // ignore and use default
    }

    applyTheme(DEFAULT_THEME_ID)
  }

  const resolveAndApplyTheme = async () => {
    // Platform admin + selected partner
    if (authStore.isPlatformAdmin && partnerStore.hasSelectedPartner) {
      await applyThemeForPlatformAdminSelectedPartner()
      return
    }
    // Partner user
    if (authStore.accountType === 'partner') {
      await applyThemeForPartnerUser()
      return
    }

    // Platform view (or other account types): local cache or default
    if (!applyThemeFromLocalCache()) {
      applyTheme(DEFAULT_THEME_ID)
    }
  }

  const persistThemeToDb = async (newThemeId, partnerIdForAdmin = null) => {
    const normalized = normalizeThemeId(newThemeId)
    if (!normalized) return

    // Partner users: update their personal theme preference
    if (authStore.accountType === 'partner') {
      await authService.updateMyAdminTheme(normalized)
      // Update local authStore user preferences
      if (authStore.user) {
        authStore.user.preferences = {
          ...(authStore.user.preferences || {}),
          adminTheme: normalized
        }
      }
      return
    }

    // Platform admin viewing as a partner: update that partner's theme
    if (authStore.isPlatformAdmin && partnerIdForAdmin) {
      await partnerService.updatePartnerAdminTheme(partnerIdForAdmin, normalized)
      return
    }
  }

  const setTheme = async nextThemeId => {
    const normalized = normalizeThemeId(nextThemeId) || DEFAULT_THEME_ID
    applyTheme(normalized)

    // Persist to DB when a partner context exists
    if (authStore.accountType === 'partner') {
      try {
        await persistThemeToDb(normalized)
      } catch {
        // Keep UI updated even if persistence fails
      }
      return
    }

    if (authStore.isPlatformAdmin && partnerStore.selectedPartner?._id) {
      const partnerId = partnerStore.selectedPartner._id
      try {
        await persistThemeToDb(normalized, partnerId)
      } catch {
        // ignore; keep UI updated
      }

      // Keep partner selection in-sync so switching partners is instant
      const updated = {
        ...partnerStore.selectedPartner,
        branding: {
          ...(partnerStore.selectedPartner?.branding || {}),
          adminTheme: normalized
        }
      }
      partnerStore.selectPartner(updated)
    }
  }

  const initializeTheme = async () => {
    if (initialized.value) return
    initialized.value = true

    // Apply immediately from cache for fast first paint
    applyThemeFromLocalCache()

    // Resolve from DB / partner context (async)
    await resolveAndApplyTheme()

    // React to partner switching (platform admin) and login changes
    watch(
      () => [
        authStore.accountType,
        authStore.isPlatformAdmin,
        authStore.user?.accountId,
        authStore.user?.preferences?.adminTheme,
        partnerStore.selectedPartner?._id
      ],
      async () => {
        await resolveAndApplyTheme()
      }
    )
  }

  return {
    themeId,
    effectivePartnerId,
    contextKey,
    initializeTheme,
    setTheme
  }
})
