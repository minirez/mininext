export const useSearchStore = defineStore('search', () => {
  const location = ref('')
  const city = ref('')
  const country = ref('')
  const checkIn = ref('')
  const checkOut = ref('')
  const adults = ref(2)
  const children = ref<number[]>([])
  const rooms = ref(1)
  const currency = ref('TRY')
  const countryCode = ref('TR')
  const selectedDestination = ref<{ city: string; country?: string; slug?: string } | null>(null)

  // Search results
  const results = ref<any[]>([])
  const loading = ref(false)
  const totalResults = ref(0)
  const currentPage = ref(1)

  // Filters
  const filters = ref({
    stars: [] as number[],
    types: [] as string[],
    amenities: [] as string[],
    priceMin: 0,
    priceMax: 0,
  })

  // Sort
  const sortBy = ref('default')

  const nights = computed(() => {
    if (!checkIn.value || !checkOut.value) return 0
    const start = new Date(checkIn.value)
    const end = new Date(checkOut.value)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  })

  const hasDates = computed(() => !!checkIn.value && !!checkOut.value)

  const totalGuests = computed(() => adults.value + children.value.length)

  function setDates(ci: string, co: string) {
    checkIn.value = ci
    checkOut.value = co
  }

  function addChild(age: number = 5) {
    children.value.push(age)
  }

  function removeChild(index: number) {
    children.value.splice(index, 1)
  }

  function setChildAge(index: number, age: number) {
    children.value[index] = age
  }

  function persistToStorage() {
    if (import.meta.client) {
      localStorage.setItem('mini_search', JSON.stringify({
        checkIn: checkIn.value,
        checkOut: checkOut.value,
        adults: adults.value,
        children: children.value,
        rooms: rooms.value,
        currency: currency.value,
        countryCode: countryCode.value,
        location: location.value,
        city: city.value,
        country: country.value,
        selectedDestination: selectedDestination.value,
      }))
    }
  }

  function hydrateFromStorage() {
    if (import.meta.client) {
      const raw = localStorage.getItem('mini_search')
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        const today = new Date().toISOString().split('T')[0]
        if (data.checkIn && data.checkIn >= today) {
          checkIn.value = data.checkIn
          checkOut.value = data.checkOut
        }
        if (data.adults) adults.value = data.adults
        if (data.children) children.value = data.children
        if (data.rooms) rooms.value = data.rooms
        if (data.currency) currency.value = data.currency
        if (data.countryCode) countryCode.value = data.countryCode
        if (data.location) location.value = data.location
        if (data.city) city.value = data.city
        if (data.country) country.value = data.country
        if (data.selectedDestination) selectedDestination.value = data.selectedDestination
      } catch {}
    }
  }

  // Auto-persist on changes
  watch(
    [checkIn, checkOut, adults, children, rooms, currency, countryCode, location, city, country, selectedDestination],
    persistToStorage,
    { deep: true },
  )

  function resetFilters() {
    filters.value = { stars: [], types: [], amenities: [], priceMin: 0, priceMax: 0 }
    sortBy.value = 'default'
  }

  function reset() {
    location.value = ''
    city.value = ''
    country.value = ''
    checkIn.value = ''
    checkOut.value = ''
    adults.value = 2
    children.value = []
    rooms.value = 1
    selectedDestination.value = null
    results.value = []
    loading.value = false
    totalResults.value = 0
    currentPage.value = 1
    resetFilters()
  }

  return {
    location, city, country, checkIn, checkOut,
    adults, children, rooms, currency, countryCode,
    selectedDestination,
    results, loading, totalResults, currentPage,
    filters, sortBy,
    nights, hasDates, totalGuests,
    setDates, addChild, removeChild, setChildAge,
    persistToStorage, hydrateFromStorage,
    resetFilters, reset,
  }
})
