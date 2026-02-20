/**
 * Booking Store - Search Actions
 * Hotel search and selection
 */

import bookingService from '@/services/bookingService'
import { storeLogger } from '@/utils/logger'

/**
 * Create search actions with store state refs
 */
export function createSearchActions(state, getters) {
  const { search, searchResults, payment, cancellationGuaranteeConfig, loading, error } = state
  const { isSearchValid } = getters

  /**
   * Search hotels with prices
   */
  async function searchHotels() {
    if (!isSearchValid.value) {
      error.value = 'Lütfen tarih aralığı seçin'
      return false
    }

    loading.value.hotels = true
    error.value = null

    try {
      const response = await bookingService.searchHotelsWithPrices({
        tourismRegionIds: search.value.tourismRegionIds,
        hotelIds: search.value.hotelIds,
        checkIn: search.value.dateRange.start,
        checkOut: search.value.dateRange.end,
        adults: search.value.adults,
        children: search.value.children,
        countryCode: search.value.countryCode,
        channel: search.value.channel,
        salesChannel: search.value.channel?.toLowerCase() || 'b2c'
      })

      if (response.success) {
        searchResults.value.hotels = response.data.hotels

        // Store unavailable hotels from debug info
        if (response.data.debug && response.data.debug.length > 0) {
          storeLogger.debug('Hotel Search Debug Info:', response.data.debug)
          searchResults.value.unavailableHotels = response.data.debug
        } else {
          searchResults.value.unavailableHotels = []
        }

        // Auto-select first hotel if only one
        if (response.data.hotels.length === 1) {
          await selectHotel(response.data.hotels[0]._id)
        }
        return true
      } else {
        error.value = response.message
        return false
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return false
    } finally {
      loading.value.hotels = false
    }
  }

  /**
   * Select hotel and load its rooms
   */
  async function selectHotel(hotelId) {
    if (!hotelId) {
      searchResults.value.selectedHotelId = null
      searchResults.value.selectedHotelRooms = []
      searchResults.value.selectedHotel = null
      searchResults.value.selectedMarket = null
      return
    }

    loading.value.rooms = true
    searchResults.value.selectedHotelId = hotelId
    searchResults.value.selectedHotel = searchResults.value.hotels.find(h => h._id === hotelId)

    try {
      const response = await bookingService.searchAvailability({
        hotelId,
        checkIn: search.value.dateRange.start,
        checkOut: search.value.dateRange.end,
        adults: search.value.adults,
        children: search.value.children,
        countryCode: search.value.countryCode,
        salesChannel: search.value.channel?.toLowerCase() || 'b2c'
      })

      if (response.success) {
        searchResults.value.selectedHotelRooms = response.data.results
        // Store market info from search response
        if (response.data.search?.market) {
          searchResults.value.selectedMarket = response.data.search.market
        }
        // Store cancellation guarantee config
        if (response.data.search?.cancellationGuarantee) {
          cancellationGuaranteeConfig.value = response.data.search.cancellationGuarantee
        }
        // Set payment methods from hotel
        if (searchResults.value.selectedHotel?.paymentMethods) {
          payment.value.acceptedMethods = searchResults.value.selectedHotel.paymentMethods
        }
      }
    } catch (err) {
      storeLogger.error('Error loading hotel rooms:', err)
      searchResults.value.selectedHotelRooms = []
    } finally {
      loading.value.rooms = false
    }
  }

  /**
   * Set date range
   */
  function setDateRange(start, end) {
    search.value.dateRange.start = start
    search.value.dateRange.end = end
  }

  /**
   * Set guests count
   */
  function setGuestsCount(adults, children = []) {
    search.value.adults = adults
    search.value.children = children
  }

  /**
   * Set payment method
   */
  function setPaymentMethod(method) {
    payment.value.method = method
  }

  return {
    searchHotels,
    selectHotel,
    setDateRange,
    setGuestsCount,
    setPaymentMethod
  }
}
