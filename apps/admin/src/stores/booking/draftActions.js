/**
 * Booking Store - Draft Actions
 * Draft management: localStorage + API persistence
 */

import bookingService from '@/services/bookingService'
import * as storageService from '@/services/bookingStorageService'
import { storeLogger } from '@/utils/logger'

/**
 * Create draft actions with store state refs
 */
export function createDraftActions(state, getters, helpers) {
  const {
    currentPhase,
    search,
    searchResults,
    cart,
    guests,
    payment,
    specialRequests,
    invoiceDetails,
    cancellationGuarantee,
    cancellationGuaranteeConfig,
    draftBookingNumber,
    draftData,
    lastSavedAt,
    allotmentError,
    bookingResult,
    loading,
    error
  } = state
  const { canProceedToCheckout } = getters
  const { initializeRoomGuests } = helpers

  // ==================== LOCALSTORAGE PERSISTENCE ====================

  /**
   * Save Phase 1 state to localStorage
   */
  function saveToLocalStorage() {
    if (currentPhase.value !== 1 || draftBookingNumber.value) {
      return // Don't save if in Phase 2 or already have a draft
    }

    storageService.savePhase1Data({
      search: search.value,
      searchResults: {
        hotels: searchResults.value.hotels,
        selectedHotelId: searchResults.value.selectedHotelId,
        selectedHotelRooms: searchResults.value.selectedHotelRooms,
        selectedHotel: searchResults.value.selectedHotel
      },
      cart: cart.value
    })
  }

  /**
   * Load Phase 1 state from localStorage
   */
  function loadFromLocalStorage() {
    const data = storageService.loadPhase1Data()
    if (!data) return false

    if (data.search) {
      search.value = data.search
    }
    if (data.searchResults) {
      searchResults.value = data.searchResults
    }
    if (data.cart) {
      cart.value = data.cart
      // Reinitialize room guests for loaded cart
      cart.value.forEach((_, index) => {
        initializeRoomGuests(index)
      })
    }

    storeLogger.debug('Loaded booking state from localStorage')
    return true
  }

  /**
   * Check if has saved Phase 1 data
   */
  function hasLocalStorageData() {
    return storageService.hasPhase1Data()
  }

  // ==================== DRAFT MANAGEMENT ====================

  /**
   * Create draft when transitioning to Phase 2
   */
  async function createDraft() {
    if (!canProceedToCheckout.value) {
      error.value = 'Sepetinizde en az bir oda olmalı'
      return null
    }

    loading.value.draft = true
    error.value = null

    try {
      const firstItem = cart.value[0]

      const response = await bookingService.createDraft({
        searchCriteria: {
          ...search.value,
          cancellationGuaranteeConfig: cancellationGuaranteeConfig.value || undefined
        },
        hotel: firstItem.hotelId,
        // Market info from cart
        market: firstItem.market?._id,
        marketCode: firstItem.market?.code,
        checkIn: search.value.dateRange.start,
        checkOut: search.value.dateRange.end,
        rooms: cart.value.map((item, index) => ({
          roomType: item.roomType._id,
          roomTypeCode: item.roomType.code,
          roomTypeName: item.roomType.name,
          mealPlan: item.mealPlan._id,
          mealPlanCode: item.mealPlan.code,
          mealPlanName: item.mealPlan.name,
          adults: item.adults,
          children: item.children,
          guests: guests.value.roomGuests[index] || [],
          pricing: item.pricing,
          customDiscount: item.customDiscount,
          dailyBreakdown: item.dailyBreakdown,
          campaigns: item.campaigns,
          // Rate type information
          rateType: item.rateType || 'refundable',
          nonRefundableDiscount: item.nonRefundableDiscount || 0
        }))
      })

      if (response.success) {
        draftBookingNumber.value = response.data.bookingNumber
        draftData.value = response.data
        lastSavedAt.value = new Date()

        // Clear localStorage since we now have a DB draft
        storageService.clearPhase1Data()

        storeLogger.debug('Draft created:', draftBookingNumber.value)
        return response.data
      } else {
        error.value = response.message
        return null
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    } finally {
      loading.value.draft = false
    }
  }

  /**
   * Update draft (auto-save)
   */
  async function updateDraft() {
    if (!draftBookingNumber.value) return

    try {
      await bookingService.updateDraft(draftBookingNumber.value, {
        leadGuest: guests.value.leadGuest,
        contact: {
          email: guests.value.leadGuest.email,
          phone: guests.value.leadGuest.phone,
          countryCode: search.value.countryCode
        },
        invoiceDetails: invoiceDetails.value,
        payment: { method: payment.value.method },
        specialRequests: specialRequests.value,
        cancellationGuarantee: cancellationGuarantee.value
          ? { purchased: true }
          : { purchased: false },
        rooms: cart.value.map((item, index) => ({
          adults: item.adults,
          children: item.children,
          guests: guests.value.roomGuests[index] || []
        }))
      })

      lastSavedAt.value = new Date()
      storeLogger.debug('Draft auto-saved')
    } catch (err) {
      storeLogger.error('Draft save error:', err)
    }
  }

  /**
   * Load draft from API
   */
  async function loadDraft(bookingNumber) {
    loading.value.draft = true
    error.value = null

    try {
      const response = await bookingService.getDraft(bookingNumber)

      if (response.success) {
        const draft = response.data

        // Set draft info
        draftBookingNumber.value = draft.bookingNumber
        draftData.value = draft
        currentPhase.value = draft.currentPhase || 2

        // Restore search criteria
        if (draft.searchCriteria) {
          // Extract cancellationGuaranteeConfig before spreading into search
          if (draft.searchCriteria.cancellationGuaranteeConfig) {
            cancellationGuaranteeConfig.value = draft.searchCriteria.cancellationGuaranteeConfig
          }
          // Spread search criteria but exclude cancellationGuaranteeConfig (it's not a search param)
          const { cancellationGuaranteeConfig: _cgc, ...searchData } = draft.searchCriteria
          search.value = {
            ...search.value,
            ...searchData,
            dateRange: {
              start: draft.checkIn,
              end: draft.checkOut
            }
          }
        }

        // Fallback: if no config saved in draft, default to enabled (Mongoose schema defaults)
        if (!cancellationGuaranteeConfig.value) {
          cancellationGuaranteeConfig.value = { enabled: true, rate: 1 }
        }

        // Restore cart
        if (draft.rooms) {
          cart.value = draft.rooms.map(room => ({
            hotelId: draft.hotel?._id,
            hotelName: draft.hotel?.name,
            roomType: room.roomType,
            mealPlan: room.mealPlan,
            adults: room.adults || draft.searchCriteria?.adults || draft.totalAdults || 2,
            children: room.children || draft.searchCriteria?.children || [],
            pricing: room.pricing,
            campaigns: room.campaigns || [],
            dailyBreakdown: room.dailyBreakdown || []
          }))
        }

        // Restore guests
        if (draft.leadGuest) {
          guests.value.leadGuest = {
            ...guests.value.leadGuest,
            ...draft.leadGuest,
            // Keep default title if draft has empty title
            title: draft.leadGuest.title || guests.value.leadGuest.title || 'mr'
          }
        }
        if (draft.rooms) {
          guests.value.roomGuests = draft.rooms.map((room, index) => {
            // If room has guests data, use it but apply default titles if empty
            if (room.guests && room.guests.length > 0) {
              let adultIndex = 0
              return room.guests.map(guest => {
                if (guest.type === 'adult') {
                  const defaultTitle = adultIndex === 0 ? 'mr' : adultIndex === 1 ? 'mrs' : ''
                  adultIndex++
                  return {
                    ...guest,
                    title: guest.title || defaultTitle
                  }
                }
                return guest
              })
            }
            // Otherwise, initialize guests based on cart
            const cartRoom = cart.value[index]
            if (!cartRoom) return []

            const roomGuests = []
            // Add adults - Default titles: 1st adult = mr, 2nd adult = mrs
            for (let i = 0; i < (cartRoom.adults || 2); i++) {
              roomGuests.push({
                type: 'adult',
                title: i === 0 ? 'mr' : i === 1 ? 'mrs' : '',
                firstName: '',
                lastName: '',
                nationality: 'TR',
                birthDate: '',
                tcNumber: '',
                passportNumber: '',
                age: null,
                isLead: index === 0 && i === 0
              })
            }
            // Add children
            ;(cartRoom.children || []).forEach(age => {
              roomGuests.push({
                type: age < 2 ? 'infant' : 'child',
                title: '',
                firstName: '',
                lastName: '',
                nationality: 'TR',
                birthDate: '',
                tcNumber: '',
                passportNumber: '',
                age: age,
                isLead: false
              })
            })
            return roomGuests
          })
        }

        // Restore invoice details
        if (draft.invoiceDetails) {
          invoiceDetails.value = draft.invoiceDetails
        }

        // Restore payment method
        if (draft.payment?.method) {
          payment.value.method = draft.payment.method
        }

        // Restore contact to leadGuest
        if (draft.contact) {
          guests.value.leadGuest.email = draft.contact.email || ''
          guests.value.leadGuest.phone = draft.contact.phone || ''
        }

        // Restore special requests
        if (draft.specialRequests) {
          specialRequests.value = draft.specialRequests
        }

        // Set selected hotel info
        if (draft.hotel) {
          searchResults.value.selectedHotelId = draft.hotel._id
          searchResults.value.selectedHotel = draft.hotel
        }

        storeLogger.debug('Draft loaded:', bookingNumber)
        return draft
      } else {
        error.value = response.message
        return null
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Draft yüklenemedi'
      return null
    } finally {
      loading.value.draft = false
    }
  }

  /**
   * Delete draft
   */
  async function deleteDraft() {
    if (!draftBookingNumber.value) return

    try {
      await bookingService.deleteDraft(draftBookingNumber.value)
      draftBookingNumber.value = null
      draftData.value = null
      storeLogger.debug('Draft deleted')
    } catch (err) {
      storeLogger.error('Draft delete error:', err)
    }
  }

  /**
   * Complete draft (final booking)
   * @param {Object} [options={}] - Optional body data (e.g. { createPaymentLink, sendEmail, sendSms })
   */
  async function completeDraft(options = {}) {
    if (!draftBookingNumber.value) {
      error.value = 'Draft bulunamadı'
      return null
    }

    loading.value.booking = true
    error.value = null
    allotmentError.value = null

    try {
      // First save current state
      await updateDraft()

      // Then complete (pass options as body data)
      const response = await bookingService.completeDraft(draftBookingNumber.value, options)

      if (response.success) {
        bookingResult.value = response.data
        storeLogger.debug('Booking completed:', response.data.bookingNumber)
        return response.data
      } else {
        error.value = response.message
        return null
      }
    } catch (err) {
      const errorData = err.response?.data

      // Handle allotment error specially
      if (errorData?.error?.code === 'ALLOTMENT_NOT_AVAILABLE') {
        allotmentError.value = errorData.error
        error.value = 'Seçilen tarihlerde yeterli kontenjan kalmadı'
      } else if (errorData?.error?.code === 'VALIDATION_FAILED') {
        error.value = 'Lütfen tüm gerekli alanları doldurun'
      } else {
        error.value = errorData?.message || err.message
      }
      return null
    } finally {
      loading.value.booking = false
    }
  }

  /**
   * Update invoice details
   */
  function updateInvoiceDetails(data) {
    invoiceDetails.value = { ...invoiceDetails.value, ...data }
  }

  return {
    // localStorage persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    hasLocalStorageData,
    // Draft management
    createDraft,
    updateDraft,
    loadDraft,
    deleteDraft,
    completeDraft,
    updateInvoiceDetails
  }
}
