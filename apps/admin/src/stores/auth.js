import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/authService'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token = ref(localStorage.getItem('token') || null)
  const refreshTokenValue = ref(localStorage.getItem('refreshToken') || null)
  const requires2FA = ref(false)
  const forcePasswordChange = ref(JSON.parse(localStorage.getItem('forcePasswordChange')) || false)
  const tempCredentials = ref(null)
  const isRefreshing = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || null)
  const userEmail = computed(() => user.value?.email || '')
  const accountType = computed(() => user.value?.accountType || '')
  const isAdmin = computed(() => userRole.value === 'admin')
  const isPlatformAdmin = computed(() => accountType.value === 'platform' && userRole.value === 'admin')

  // Actions
  async function login(credentials) {
    try {
      const response = await authService.login(credentials)

      // Check if 2FA is required
      if (!response.success && response.requiresTwoFactor) {
        tempCredentials.value = credentials
        requires2FA.value = true
        return { requires2FA: true }
      }

      if (response.success && response.data) {
        // Update state
        token.value = response.data.accessToken
        refreshTokenValue.value = response.data.refreshToken
        user.value = response.data.user
        forcePasswordChange.value = response.data.forcePasswordChange || false

        // Store in localStorage
        localStorage.setItem('token', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('forcePasswordChange', JSON.stringify(response.data.forcePasswordChange || false))

        // Return forcePasswordChange status along with success
        return { success: true, forcePasswordChange: response.data.forcePasswordChange || false }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // Verify 2FA
  async function verify2FA(twoFactorToken) {
    try {
      if (!tempCredentials.value) {
        throw new Error('No pending 2FA verification')
      }

      const response = await authService.login({
        ...tempCredentials.value,
        twoFactorToken
      })

      if (response.success && response.data) {
        token.value = response.data.accessToken
        refreshTokenValue.value = response.data.refreshToken
        user.value = response.data.user
        forcePasswordChange.value = response.data.forcePasswordChange || false

        localStorage.setItem('token', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('forcePasswordChange', JSON.stringify(response.data.forcePasswordChange || false))

        // Clear temp data
        tempCredentials.value = null
        requires2FA.value = false

        return { success: true, forcePasswordChange: response.data.forcePasswordChange || false }
      } else {
        throw new Error(response.message || '2FA verification failed')
      }
    } catch (error) {
      console.error('2FA verification failed:', error)
      throw error
    }
  }

  function logout() {
    token.value = null
    refreshTokenValue.value = null
    user.value = null
    forcePasswordChange.value = false

    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('forcePasswordChange')

    router.push({ name: 'login' })
  }

  function clearForcePasswordChange() {
    forcePasswordChange.value = false
    localStorage.setItem('forcePasswordChange', JSON.stringify(false))
  }

  // Refresh access token using refresh token
  async function refreshAccessToken() {
    if (isRefreshing.value) {
      // Wait for ongoing refresh to complete
      return new Promise((resolve) => {
        const checkRefresh = setInterval(() => {
          if (!isRefreshing.value) {
            clearInterval(checkRefresh)
            resolve(token.value)
          }
        }, 100)
      })
    }

    if (!refreshTokenValue.value) {
      logout()
      return null
    }

    isRefreshing.value = true

    try {
      const response = await authService.refreshToken(refreshTokenValue.value)

      if (response.success && response.data?.accessToken) {
        token.value = response.data.accessToken
        localStorage.setItem('token', response.data.accessToken)
        return response.data.accessToken
      } else {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      return null
    } finally {
      isRefreshing.value = false
    }
  }

  async function checkAuth() {
    if (!token.value) return

    try {
      const response = await authService.me()
      if (response.success && response.data) {
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
      } else {
        throw new Error('Token verification failed')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      logout()
    }
  }

  function updateUser(userData) {
    if (userData) {
      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))
    }
  }

  return {
    // State
    user,
    token,
    refreshTokenValue,
    requires2FA,
    forcePasswordChange,
    tempCredentials,
    isRefreshing,
    // Getters
    isAuthenticated,
    userRole,
    userEmail,
    accountType,
    isAdmin,
    isPlatformAdmin,
    // Actions
    login,
    verify2FA,
    logout,
    checkAuth,
    updateUser,
    refreshAccessToken,
    clearForcePasswordChange
  }
})
