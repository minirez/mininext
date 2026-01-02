/**
 * PMS Context Composable
 *
 * Bu composable tüm PMS state yönetimini birleştirir:
 * - PMS kullanıcıları (pmsAuth store)
 * - Partner kullanıcıları (hotel store + auth store)
 *
 * Tüm PMS view ve component'leri bu composable'ı kullanmalıdır.
 * Prop drilling yerine provide/inject ile dağıtılır.
 *
 * Kullanım:
 *   // Provider (PMSLayout.vue)
 *   const pmsContext = usePmsContext()
 *   provide('pmsContext', pmsContext)
 *
 *   // Consumer (any child component)
 *   const { hotelId, user, hasPermission } = inject('pmsContext')
 */

import { ref, computed, watch, readonly, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useHotelStore } from '@/stores/hotel'

// PMS Auth store'u lazy import (circular dependency önlemek için)
let pmsAuthStore = null
const getPmsAuthStore = async () => {
  if (!pmsAuthStore) {
    const { usePmsAuthStore } = await import('@/stores/pms/pmsAuth')
    pmsAuthStore = usePmsAuthStore()
  }
  return pmsAuthStore
}

// Context mode enum
export const PMS_CONTEXT_MODE = {
  PMS_USER: 'pms_user',     // Direkt PMS kullanıcısı (pmsToken ile)
  PARTNER: 'partner',       // Partner kullanıcısı (normal token ile)
  ADMIN: 'admin'            // Platform admin (tüm yetkilere sahip)
}

// Singleton state (tüm component'ler aynı state'i paylaşır)
const _mode = ref(null)
const _initialized = ref(false)
const _initPromise = ref(null)

/**
 * PMS Context Composable
 */
export function usePmsContext() {
  const authStore = useAuthStore()
  const hotelStore = useHotelStore()

  // ============================================================================
  // CONTEXT MODE DETECTION
  // ============================================================================

  /**
   * Context mode'u belirle
   */
  const detectMode = async () => {
    // Check for PMS token first
    const pmsToken = localStorage.getItem('pmsToken')
    if (pmsToken) {
      _mode.value = PMS_CONTEXT_MODE.PMS_USER
      return PMS_CONTEXT_MODE.PMS_USER
    }

    // Check for regular auth
    if (authStore.isAuthenticated) {
      if (authStore.user?.role === 'admin' || authStore.user?.role === 'superadmin') {
        _mode.value = PMS_CONTEXT_MODE.ADMIN
        return PMS_CONTEXT_MODE.ADMIN
      }
      if (authStore.user?.role === 'partner' || authStore.user?.partnerId) {
        _mode.value = PMS_CONTEXT_MODE.PARTNER
        return PMS_CONTEXT_MODE.PARTNER
      }
    }

    _mode.value = null
    return null
  }

  /**
   * Context'i initialize et
   */
  const initialize = async () => {
    if (_initialized.value) return
    if (_initPromise.value) return _initPromise.value

    _initPromise.value = (async () => {
      try {
        await detectMode()
        _initialized.value = true
      } catch (error) {
        console.error('[PmsContext] Initialization failed:', error)
        _initialized.value = false
        throw error
      } finally {
        _initPromise.value = null
      }
    })()

    return _initPromise.value
  }

  // ============================================================================
  // COMPUTED PROPERTIES (Unified API)
  // ============================================================================

  /**
   * Current mode
   */
  const mode = computed(() => _mode.value)

  /**
   * Is PMS user mode?
   * Note: Performs synchronous check for immediate access before initialize()
   */
  const isPmsUser = computed(() => {
    // If mode is already detected, use it
    if (_mode.value !== null) {
      return _mode.value === PMS_CONTEXT_MODE.PMS_USER
    }
    // Otherwise check localStorage directly
    return !!localStorage.getItem('pmsToken')
  })

  /**
   * Is Partner mode?
   */
  const isPartner = computed(() => _mode.value === PMS_CONTEXT_MODE.PARTNER)

  /**
   * Is Admin mode?
   */
  const isAdmin = computed(() => _mode.value === PMS_CONTEXT_MODE.ADMIN)

  /**
   * Current hotel ID (unified)
   * Note: Performs synchronous mode detection for immediate access before initialize()
   */
  const hotelId = computed(() => {
    // Check PMS user directly from localStorage (synchronous check for immediate access)
    const pmsToken = localStorage.getItem('pmsToken')
    if (pmsToken) {
      const pmsHotel = JSON.parse(localStorage.getItem('pmsCurrentHotel') || 'null')
      return pmsHotel?._id || pmsHotel?.id || null
    }
    // Fallback to hotelStore for Partner/Admin
    return hotelStore.hotelId
  })

  /**
   * Current hotel object (unified)
   * Note: Performs synchronous mode detection for immediate access before initialize()
   */
  const currentHotel = computed(() => {
    // Check PMS user directly from localStorage (synchronous check for immediate access)
    const pmsToken = localStorage.getItem('pmsToken')
    if (pmsToken) {
      return JSON.parse(localStorage.getItem('pmsCurrentHotel') || 'null')
    }
    return hotelStore.selectedHotel
  })

  /**
   * Hotel name
   */
  const hotelName = computed(() => {
    return currentHotel.value?.name || currentHotel.value?.hotelName || null
  })

  /**
   * Has hotel selected?
   */
  const hasHotel = computed(() => !!hotelId.value)

  /**
   * Current user (unified)
   */
  const user = computed(() => {
    if (_mode.value === PMS_CONTEXT_MODE.PMS_USER) {
      return JSON.parse(localStorage.getItem('pmsUser') || 'null')
    }
    return authStore.user
  })

  /**
   * User full name
   */
  const userName = computed(() => {
    const u = user.value
    if (!u) return null
    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || null
  })

  /**
   * Is authenticated for PMS?
   */
  const isAuthenticated = computed(() => {
    if (!_mode.value) return false

    if (_mode.value === PMS_CONTEXT_MODE.PMS_USER) {
      const token = localStorage.getItem('pmsToken')
      const pmsUser = localStorage.getItem('pmsUser')
      const pmsHotel = localStorage.getItem('pmsCurrentHotel')
      return !!token && !!pmsUser && !!pmsHotel
    }

    return authStore.isAuthenticated && hasHotel.value
  })

  /**
   * Current user's role
   */
  const role = computed(() => {
    if (_mode.value === PMS_CONTEXT_MODE.PMS_USER) {
      const pmsHotel = JSON.parse(localStorage.getItem('pmsCurrentHotel') || 'null')
      return pmsHotel?.role || null
    }
    return authStore.user?.role || null
  })

  /**
   * Current user's permissions
   */
  const permissions = computed(() => {
    if (_mode.value === PMS_CONTEXT_MODE.PMS_USER) {
      const pmsHotel = JSON.parse(localStorage.getItem('pmsCurrentHotel') || 'null')
      return pmsHotel?.permissions || []
    }
    // Partner ve Admin her zaman full permission
    return ['*']
  })

  /**
   * Available hotels (for switching)
   */
  const availableHotels = computed(() => {
    if (_mode.value === PMS_CONTEXT_MODE.PMS_USER) {
      return JSON.parse(localStorage.getItem('pmsAssignedHotels') || '[]')
    }
    // Partner için hotelService'den alınmalı (bu composable dışında)
    return []
  })

  /**
   * Has multiple hotels?
   */
  const hasMultipleHotels = computed(() => availableHotels.value.length > 1)

  // ============================================================================
  // PERMISSION HELPERS
  // ============================================================================

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    // Admin and Partner always have all permissions
    if (_mode.value === PMS_CONTEXT_MODE.ADMIN || _mode.value === PMS_CONTEXT_MODE.PARTNER) {
      return true
    }

    // PMS User - check role first
    if (role.value === 'pms_admin') return true

    // Check specific permission
    return permissions.value.includes(permission) || permissions.value.includes('*')
  }

  /**
   * Check if user has any of the specified permissions
   * @param {string[]} perms - Permissions to check
   * @returns {boolean}
   */
  const hasAnyPermission = (perms) => {
    if (_mode.value === PMS_CONTEXT_MODE.ADMIN || _mode.value === PMS_CONTEXT_MODE.PARTNER) {
      return true
    }
    if (role.value === 'pms_admin') return true

    return perms.some(p => permissions.value.includes(p) || permissions.value.includes('*'))
  }

  /**
   * Check if user has all of the specified permissions
   * @param {string[]} perms - Permissions to check
   * @returns {boolean}
   */
  const hasAllPermissions = (perms) => {
    if (_mode.value === PMS_CONTEXT_MODE.ADMIN || _mode.value === PMS_CONTEXT_MODE.PARTNER) {
      return true
    }
    if (role.value === 'pms_admin') return true

    return perms.every(p => permissions.value.includes(p) || permissions.value.includes('*'))
  }

  // ============================================================================
  // HOTEL MANAGEMENT
  // ============================================================================

  /**
   * Set/select hotel
   * @param {Object} hotel - Hotel object
   */
  const setHotel = async (hotel) => {
    if (_mode.value === PMS_CONTEXT_MODE.PMS_USER) {
      // PMS user - use pmsAuth store
      try {
        const store = await getPmsAuthStore()
        await store.switchHotel(hotel._id || hotel.id)
      } catch (error) {
        console.error('[PmsContext] Switch hotel failed:', error)
        throw error
      }
    } else {
      // Partner - use hotel store
      hotelStore.setHotel(hotel)
    }
  }

  /**
   * Clear hotel selection
   */
  const clearHotel = () => {
    if (_mode.value !== PMS_CONTEXT_MODE.PMS_USER) {
      hotelStore.clearHotel()
    }
  }

  // ============================================================================
  // WATCHERS
  // ============================================================================

  // Watch for auth changes
  watch(
    () => authStore.isAuthenticated,
    () => {
      detectMode()
    }
  )

  // Watch for hotel store changes (Partner mode)
  watch(
    () => hotelStore.selectedHotel,
    (newHotel) => {
      if (_mode.value === PMS_CONTEXT_MODE.PARTNER || _mode.value === PMS_CONTEXT_MODE.ADMIN) {
        // Trigger reactivity for dependent components
        console.log('[PmsContext] Hotel changed:', newHotel?.name)
      }
    }
  )

  // ============================================================================
  // DEBUG
  // ============================================================================

  const debug = () => {
    console.group('[PmsContext Debug]')
    console.log('Mode:', _mode.value)
    console.log('Initialized:', _initialized.value)
    console.log('Hotel ID:', hotelId.value)
    console.log('Hotel Name:', hotelName.value)
    console.log('User:', user.value)
    console.log('Role:', role.value)
    console.log('Permissions:', permissions.value)
    console.log('Is Authenticated:', isAuthenticated.value)
    console.groupEnd()
    return {
      mode: _mode.value,
      hotelId: hotelId.value,
      user: user.value,
      role: role.value
    }
  }

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Initialization
    initialize,
    detectMode,

    // Mode
    mode: readonly(mode),
    isPmsUser,
    isPartner,
    isAdmin,

    // Hotel
    hotelId,
    currentHotel,
    hotelName,
    hasHotel,
    availableHotels,
    hasMultipleHotels,
    setHotel,
    clearHotel,

    // User
    user,
    userName,
    isAuthenticated,
    role,
    permissions,

    // Permission helpers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Debug
    debug
  }
}

// ============================================================================
// PROVIDE/INJECT KEY
// ============================================================================

export const PMS_CONTEXT_KEY = Symbol('pmsContext')

/**
 * Use PMS Context from injection (for child components)
 * Call this in components that are children of PmsProvider.
 *
 * @returns {ReturnType<typeof usePmsContext>}
 *
 * @example
 * import { usePmsContextInjection } from '@/composables/usePmsContext'
 *
 * const { hotelId, user, hasPermission } = usePmsContextInjection()
 * if (hasPermission('reservations.create')) {
 *   // show create button
 * }
 */
export function usePmsContextInjection() {
  // Default değer vererek Vue uyarısını önle
  const context = inject(PMS_CONTEXT_KEY, null)

  if (!context) {
    // Context yoksa fallback olarak usePmsContext kullan
    return usePmsContext()
  }

  return context
}

export default usePmsContext
