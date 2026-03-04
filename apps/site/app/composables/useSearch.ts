/**
 * Availability search composable
 */
export function useAvailabilitySearch() {
  const api = useApi()
  const searchStore = useSearchStore()

  const availableRooms = ref<any[]>([])
  const searching = ref(false)
  const searchError = ref('')
  const cancellationPolicy = ref<any>(null)

  async function searchAvailability(hotelCode: string, params?: Record<string, any>) {
    searching.value = true
    searchError.value = ''
    try {
      const body = {
        checkIn: params?.checkIn || searchStore.checkIn,
        checkOut: params?.checkOut || searchStore.checkOut,
        adults: params?.adults || searchStore.adults,
        children: params?.children || searchStore.children,
        currency: params?.currency || searchStore.currency,
        countryCode: params?.countryCode || searchStore.countryCode,
        ...params,
      }

      const res = await api.post<{ success: boolean; data: any }>(
        `/api/public/hotels/${hotelCode}/search`,
        body,
      )
      if (res.success && res.data) {
        availableRooms.value = res.data.rooms || res.data.results || []

        // Extract payment config from search response
        const bookingStore = useBookingStore()
        const search = res.data.search || res.data
        if (search?.paymentTerms) bookingStore.paymentTerms = search.paymentTerms
        if (search?.cancellationGuarantee) bookingStore.cancellationGuaranteeConfig = search.cancellationGuarantee
        if (search?.bankTransferDiscount) bookingStore.bankTransferDiscount = search.bankTransferDiscount
        if (search?.bankTransferReleaseDays != null) bookingStore.bankTransferReleaseDays = search.bankTransferReleaseDays
        if (search?.cancellationPolicy) cancellationPolicy.value = search.cancellationPolicy
      }
    } catch (err: any) {
      console.error('[useSearch] error:', err)
      searchError.value = err?.message || 'Search failed'
      availableRooms.value = []
    } finally {
      searching.value = false
    }
  }

  return {
    availableRooms,
    searching,
    searchError,
    cancellationPolicy,
    searchAvailability,
  }
}
