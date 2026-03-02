/**
 * Market detection composable - detect visitor country & currency
 */
export function useMarket() {
  const api = useApi()
  const searchStore = useSearchStore()

  const detected = ref(false)
  const detectedCountry = ref('')
  const detectedCurrency = ref('')

  async function detectMarket() {
    if (detected.value) return

    try {
      const res = await api.get<{ success: boolean; data: any }>('/api/public/detect-market')
      if (res.success && res.data) {
        detectedCountry.value = res.data.countryCode || 'TR'
        detectedCurrency.value = res.data.currency || 'TRY'
        searchStore.countryCode = detectedCountry.value
        searchStore.currency = detectedCurrency.value
        detected.value = true
      }
    } catch {
      // Fallback to Turkish market
      detectedCountry.value = 'TR'
      detectedCurrency.value = 'TRY'
      detected.value = true
    }
  }

  return { detected, detectedCountry, detectedCurrency, detectMarket }
}
