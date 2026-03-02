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
    results.value = []
    loading.value = false
    totalResults.value = 0
    currentPage.value = 1
    resetFilters()
  }

  return {
    location, city, country, checkIn, checkOut,
    adults, children, rooms, currency, countryCode,
    results, loading, totalResults, currentPage,
    filters, sortBy,
    nights, totalGuests,
    setDates, addChild, removeChild, setChildAge,
    resetFilters, reset,
  }
})
