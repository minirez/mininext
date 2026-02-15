/**
 * Hotel Store
 * Manages selected hotel state across the application
 * Stores hotel selection per partner
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import hotelService from '@/services/hotelService'
import { storeLogger } from '@/utils/logger'

const STORAGE_KEY_PREFIX = 'selected_hotel_'

export const useHotelStore = defineStore('hotel', () => {
  // State
  const selectedHotel = ref(null)
  const currentPartnerId = ref(null)

  // Helper to get storage key for a partner
  const getStorageKey = partnerId => `${STORAGE_KEY_PREFIX}${partnerId}`

  // Load hotel for a specific partner from localStorage
  const loadHotelForPartner = partnerId => {
    if (typeof window === 'undefined' || !partnerId) {
      selectedHotel.value = null
      return
    }

    const stored = localStorage.getItem(getStorageKey(partnerId))
    if (stored) {
      try {
        selectedHotel.value = JSON.parse(stored)
      } catch {
        localStorage.removeItem(getStorageKey(partnerId))
        selectedHotel.value = null
      }
    } else {
      selectedHotel.value = null
    }
  }

  // Computed
  const hasSelectedHotel = computed(() => !!selectedHotel.value)
  const hotelId = computed(() => selectedHotel.value?._id)
  const hotelName = computed(() => selectedHotel.value?.name)

  // Actions
  const setHotel = hotel => {
    selectedHotel.value = hotel
    if (currentPartnerId.value) {
      if (hotel) {
        localStorage.setItem(getStorageKey(currentPartnerId.value), JSON.stringify(hotel))
      } else {
        localStorage.removeItem(getStorageKey(currentPartnerId.value))
      }
    }
  }

  const setPartner = partnerId => {
    currentPartnerId.value = partnerId
    loadHotelForPartner(partnerId)
  }

  const clearHotel = () => {
    selectedHotel.value = null
    if (currentPartnerId.value) {
      localStorage.removeItem(getStorageKey(currentPartnerId.value))
    }
  }

  // Refresh hotel data from API
  const refreshHotel = async () => {
    if (!selectedHotel.value?._id) return

    try {
      const response = await hotelService.getHotel(selectedHotel.value._id)
      if (response.success && response.data) {
        setHotel(response.data)
      }
    } catch (error) {
      storeLogger.error('Failed to refresh hotel:', error)
    }
  }

  return {
    // State
    selectedHotel,
    currentPartnerId,
    // Computed
    hasSelectedHotel,
    hotelId,
    hotelName,
    // Actions
    setHotel,
    setPartner,
    clearHotel,
    loadHotelForPartner,
    refreshHotel
  }
})
