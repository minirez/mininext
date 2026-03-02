/**
 * Price quote & promo code composable
 */
export function usePricing() {
  const api = useApi()

  const priceQuote = ref<any>(null)
  const loading = ref(false)

  async function getPriceQuote(hotelCode: string, params: {
    checkIn: string
    checkOut: string
    roomTypeCode: string
    mealPlanCode: string
    adults: number
    children?: number[]
  }) {
    loading.value = true
    try {
      const res = await api.post<{ success: boolean; data: any }>(
        `/api/public/hotels/${hotelCode}/price-quote`,
        params,
      )
      if (res.success && res.data) {
        priceQuote.value = res.data
      }
      return res.data
    } catch (err) {
      console.error('[usePricing] quote error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function applyPromo(hotelCode: string, params: {
    code: string
    checkIn: string
    checkOut: string
    roomTypeCode: string
    mealPlanCode: string
  }) {
    try {
      const res = await api.post<{ success: boolean; data: any }>(
        `/api/public/hotels/${hotelCode}/apply-promo`,
        params,
      )
      return res.success ? res.data : null
    } catch (err) {
      console.error('[usePricing] promo error:', err)
      return null
    }
  }

  return { priceQuote, loading, getPriceQuote, applyPromo }
}
