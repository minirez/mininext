import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_PREFIX = 'pmsHotel_'

export const usePmsStore = defineStore('pms', () => {
  // State
  const isPmsMode = ref(JSON.parse(localStorage.getItem('isPmsMode')) || false)
  const selectedPmsHotel = ref(JSON.parse(localStorage.getItem('selectedPmsHotel')) || null)
  const currentPartnerId = ref(localStorage.getItem('pmsCurrentPartnerId') || null)

  // Getters
  const hasSelectedHotel = computed(() => !!selectedPmsHotel.value)
  const hotelId = computed(() => selectedPmsHotel.value?._id || null)
  const hotelName = computed(() => selectedPmsHotel.value?.name || '')

  // Actions
  function enterPmsMode() {
    isPmsMode.value = true
    localStorage.setItem('isPmsMode', 'true')
  }

  function exitPmsMode() {
    isPmsMode.value = false
    localStorage.setItem('isPmsMode', 'false')
  }

  function setHotel(hotel) {
    selectedPmsHotel.value = hotel
    localStorage.setItem('selectedPmsHotel', JSON.stringify(hotel))
    // Partner bazlı kaydet
    if (currentPartnerId.value && hotel) {
      localStorage.setItem(STORAGE_PREFIX + currentPartnerId.value, JSON.stringify(hotel))
    }
  }

  function clearHotel() {
    selectedPmsHotel.value = null
    localStorage.removeItem('selectedPmsHotel')
  }

  /**
   * Partner değiştiğinde çağrılır.
   * O partner için daha önce seçilmiş oteli localStorage'dan yükler.
   */
  function switchPartner(partnerId) {
    if (!partnerId) {
      clearHotel()
      currentPartnerId.value = null
      localStorage.removeItem('pmsCurrentPartnerId')
      return
    }

    currentPartnerId.value = partnerId
    localStorage.setItem('pmsCurrentPartnerId', partnerId)

    // Bu partner için kayıtlı otel var mı?
    const stored = localStorage.getItem(STORAGE_PREFIX + partnerId)
    if (stored) {
      try {
        const hotel = JSON.parse(stored)
        selectedPmsHotel.value = hotel
        localStorage.setItem('selectedPmsHotel', JSON.stringify(hotel))
        return
      } catch {
        localStorage.removeItem(STORAGE_PREFIX + partnerId)
      }
    }

    // Kayıtlı otel yoksa temizle
    clearHotel()
  }

  return {
    isPmsMode,
    selectedPmsHotel,
    currentPartnerId,
    hasSelectedHotel,
    hotelId,
    hotelName,
    enterPmsMode,
    exitPmsMode,
    setHotel,
    clearHotel,
    switchPartner
  }
})
