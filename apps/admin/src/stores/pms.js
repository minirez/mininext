import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePmsStore = defineStore('pms', () => {
  // State
  const isPmsMode = ref(JSON.parse(localStorage.getItem('isPmsMode')) || false)
  const selectedPmsHotel = ref(JSON.parse(localStorage.getItem('selectedPmsHotel')) || null)

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
    selectedPmsHotel.value = null
    localStorage.setItem('isPmsMode', 'false')
    localStorage.removeItem('selectedPmsHotel')
  }

  function setHotel(hotel) {
    selectedPmsHotel.value = hotel
    localStorage.setItem('selectedPmsHotel', JSON.stringify(hotel))
  }

  function clearHotel() {
    selectedPmsHotel.value = null
    localStorage.removeItem('selectedPmsHotel')
  }

  return {
    isPmsMode,
    selectedPmsHotel,
    hasSelectedHotel,
    hotelId,
    hotelName,
    enterPmsMode,
    exitPmsMode,
    setHotel,
    clearHotel
  }
})
