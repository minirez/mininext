/**
 * Single hotel detail API calls
 */
export function useHotelDetail(slug: string | Ref<string>) {
  const api = useApi()

  const hotel = ref<any>(null)
  const roomTypes = ref<any[]>([])
  const mealPlans = ref<any[]>([])
  const campaigns = ref<any[]>([])
  const loading = ref(false)

  async function fetchHotel() {
    loading.value = true
    try {
      const code = unref(slug)
      const res = await api.get<{ success: boolean; data: any }>(`/api/public/hotels/${code}`)
      if (res.success && res.data) {
        hotel.value = res.data
      }
    } catch (err) {
      console.error('[useHotelDetail] fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchRoomTypes() {
    try {
      const code = unref(slug)
      const res = await api.get<{ success: boolean; data: any }>(`/api/public/hotels/${code}/room-types`)
      if (res.success && res.data) {
        roomTypes.value = Array.isArray(res.data) ? res.data : res.data.roomTypes || []
      }
    } catch (err) {
      console.error('[useHotelDetail] room types error:', err)
    }
  }

  async function fetchMealPlans() {
    try {
      const code = unref(slug)
      const res = await api.get<{ success: boolean; data: any }>(`/api/public/hotels/${code}/meal-plans`)
      if (res.success && res.data) {
        mealPlans.value = Array.isArray(res.data) ? res.data : res.data.mealPlans || []
      }
    } catch (err) {
      console.error('[useHotelDetail] meal plans error:', err)
    }
  }

  async function fetchCampaigns() {
    try {
      const code = unref(slug)
      const res = await api.get<{ success: boolean; data: any }>(`/api/public/hotels/${code}/campaigns`)
      if (res.success && res.data) {
        campaigns.value = Array.isArray(res.data) ? res.data : res.data.campaigns || []
      }
    } catch (err) {
      console.error('[useHotelDetail] campaigns error:', err)
    }
  }

  const profileSections = computed(() => {
    if (!hotel.value?.profile) return []
    const profile = hotel.value.profile
    const sections = [
      'overview', 'facilities', 'dining', 'spaWellness', 'beachPool',
      'sportsEntertainment', 'familyKids', 'honeymoon', 'importantInfo', 'location',
    ]
    return sections.filter(key => {
      const content = profile[key]?.content
      if (!content) return false
      if (Array.isArray(content)) return content.some((i: any) => i.value)
      if (typeof content === 'object') return Object.values(content).some(v => v)
      if (typeof content === 'string') return content.length > 0
      return false
    })
  })

  return {
    hotel, roomTypes, mealPlans, campaigns, loading,
    profileSections,
    fetchHotel, fetchRoomTypes, fetchMealPlans, fetchCampaigns,
  }
}
