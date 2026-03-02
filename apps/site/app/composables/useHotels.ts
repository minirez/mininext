/**
 * Hotel listing API calls with reactive filters
 */
export function useHotels() {
  const api = useApi()
  const searchStore = useSearchStore()
  const partner = usePartnerStore()

  const hotels = ref<any[]>([])
  const loading = ref(false)
  const totalHotels = ref(0)
  const totalPages = ref(0)

  async function fetchHotels(params?: Record<string, any>) {
    loading.value = true
    try {
      const query: Record<string, any> = {
        partner: partner.partnerId,
        page: searchStore.currentPage,
        limit: 20,
        ...params,
      }

      if (searchStore.filters.stars.length) {
        query.stars = searchStore.filters.stars.join(',')
      }
      if (searchStore.filters.types.length) {
        query.type = searchStore.filters.types.join(',')
      }
      if (searchStore.filters.amenities.length) {
        query.amenities = searchStore.filters.amenities.join(',')
      }
      if (searchStore.city) {
        query.city = searchStore.city
      }
      if (searchStore.sortBy && searchStore.sortBy !== 'default') {
        query.sort = searchStore.sortBy
      }

      const res = await api.get<{ success: boolean; data: any }>('/api/public/hotels', query)
      if (res.success && res.data) {
        hotels.value = res.data.hotels || []
        totalHotels.value = res.data.pagination?.total || 0
        totalPages.value = res.data.pagination?.pages || 0
      }
    } catch (err) {
      console.error('[useHotels] fetch error:', err)
      hotels.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    hotels,
    loading,
    totalHotels,
    totalPages,
    fetchHotels,
  }
}
