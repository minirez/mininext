/**
 * Fetch prices for multiple hotels in parallel (concurrency limited)
 */
export function useHotelPrices() {
  const api = useApi()
  const searchStore = useSearchStore()

  const priceMap = ref<Record<string, {
    loading: boolean
    price?: number
    perNight?: number
    currency?: string
    available?: boolean
    mealPlan?: string
    error?: boolean
  }>>({})

  const fetching = ref(false)

  function extractMealPlanName(mealPlan: any): string {
    if (!mealPlan?.name) return ''
    if (typeof mealPlan.name === 'string') return mealPlan.name
    // Multilang object — pick current locale or fallback to en/tr
    return mealPlan.name.en || mealPlan.name.tr || Object.values(mealPlan.name).find((v: any) => v) || ''
  }

  function findCheapestOption(rooms: any[]) {
    let cheapest: any = null
    for (const room of rooms) {
      const options = room.options || room.mealPlans || []
      for (const opt of options) {
        // Skip unavailable options
        if (opt.available === false) continue
        if (opt.issues?.length) continue

        // Support both pricing structures: opt.pricing (API) and opt.prices (legacy)
        const pricing = opt.pricing || opt.prices
        if (!pricing) continue

        const total = pricing.finalTotal || pricing.total || 0
        const perNight = pricing.avgPerNight || pricing.perNight || (total / (searchStore.nights || 1))
        const currency = pricing.currency || searchStore.currency

        if (total > 0 && (!cheapest || total < cheapest.price)) {
          cheapest = {
            price: total,
            perNight,
            currency,
            mealPlan: extractMealPlanName(opt.mealPlan),
            available: true,
          }
        }
      }
    }
    return cheapest || { available: false }
  }

  async function fetchPricesForHotels(hotelCodes: string[]) {
    if (!searchStore.hasDates) return
    fetching.value = true

    const queue = [...hotelCodes]
    const concurrent = 3

    async function processNext() {
      while (queue.length) {
        const code = queue.shift()!
        priceMap.value[code] = { loading: true }
        try {
          const res = await api.post<any>(`/api/public/hotels/${code}/search`, {
            checkIn: searchStore.checkIn,
            checkOut: searchStore.checkOut,
            adults: searchStore.adults,
            children: searchStore.children,
            currency: searchStore.currency,
            countryCode: searchStore.countryCode,
          })
          const rooms = res.success && res.data ? (res.data.rooms || res.data.results || []) : []
          if (rooms.length) {
            const cheapest = findCheapestOption(rooms)
            priceMap.value[code] = { loading: false, ...cheapest }
          } else {
            priceMap.value[code] = { loading: false, available: false }
          }
        } catch {
          priceMap.value[code] = { loading: false, error: true }
        }
      }
    }

    await Promise.all(Array.from({ length: concurrent }, processNext))
    fetching.value = false
  }

  function clearPrices() {
    priceMap.value = {}
  }

  return { priceMap, fetching, fetchPricesForHotels, clearPrices }
}
