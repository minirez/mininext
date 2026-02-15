import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import siteSettingsService from '@/services/siteSettingsService'
import { getImageUrl } from '@/utils/imageUrl'
import { storeLogger } from '@/utils/logger'

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  const settings = ref(null)
  const loading = ref(false)
  const loaded = ref(false)

  // Computed values for easy access
  const favicon = computed(() => settings.value?.general?.favicon || null)
  const logo = computed(() => settings.value?.general?.logo || null)

  // Get favicon URL with proper base path
  const faviconUrl = computed(() => {
    if (!favicon.value) return '/favicon-96x96.png'
    return getImageUrl(favicon.value)
  })

  // Get logo URL with proper base path
  const logoUrl = computed(() => {
    if (!logo.value) return null
    return getImageUrl(logo.value)
  })

  const fetchSettings = async () => {
    if (loading.value) return

    loading.value = true
    try {
      const response = await siteSettingsService.getSiteSettings()
      if (response.success) {
        settings.value = response.data
        loaded.value = true
      }
    } catch (error) {
      storeLogger.error('Failed to fetch site settings:', error)
    } finally {
      loading.value = false
    }
  }

  // Update local settings after save
  const updateSettings = newSettings => {
    settings.value = { ...settings.value, ...newSettings }
  }

  // Update only general section
  const updateGeneral = generalData => {
    if (settings.value) {
      settings.value.general = { ...settings.value.general, ...generalData }
    }
  }

  const reset = () => {
    settings.value = null
    loaded.value = false
  }

  return {
    settings,
    loading,
    loaded,
    favicon,
    logo,
    faviconUrl,
    logoUrl,
    fetchSettings,
    updateSettings,
    updateGeneral,
    reset
  }
})
