/**
 * Pricing Tab Composable
 * Contains all state, computed properties, and methods for PricingTab
 */
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useDate } from '@/composables/useDate'
import planningService from '@/services/planningService'
import { useAuthStore } from '@/stores/auth'

export function usePricingTab(props) {
  const { t, locale } = useI18n()
  const { formatShortDate, formatDisplayDate, calculateDays } = useDate()
  const toast = useToast()
  const authStore = useAuthStore()

  // ===================
  // STATE
  // ===================

  // Data
  const rates = ref([])
  const overrides = ref([])
  const occupancy = ref({})
  const seasons = ref([])
  const roomTypes = ref([])
  const mealPlans = ref([])
  const markets = ref([])

  // Loading
  const loadingRates = ref(false)
  const loadingSeasons = ref(false)
  const loadingPriceList = ref(false)

  // Calendar refresh key
  const calendarKey = ref(0)

  // Price List Data
  const priceListData = ref([])

  // UI State
  const viewMode = ref('calendar')
  const showSeasonPanel = ref(false)
  const timelineYear = ref(new Date().getFullYear())
  const showSeasonForm = ref(false)
  const showRateModal = ref(false)
  const showDeleteModal = ref(false)
  const selectedMarket = ref(null)
  const editingSeason = ref(null)
  const editingRate = ref(null)
  const deleteTarget = ref(null)
  const deleteType = ref(null)
  const deleting = ref(false)
  const bulkEditCells = ref([])
  const showBulkEditModal = ref(false)
  const showPriceQueryModal = ref(false)
  const showForecastModal = ref(false)
  const showPeriodEditModal = ref(false)
  const showContractImport = ref(false)
  const editingPeriod = ref(null)
  const calendarRef = ref(null)

  // Delete pricing data state
  const showDeleteConfirm = ref(false)
  const isDeleting = ref(false)

  // Current calendar month - load from localStorage if available
  const getStoredMonth = () => {
    try {
      const stored = localStorage.getItem('planning_calendar_month')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.year && parsed.month) {
          return parsed
        }
      }
    } catch {
      // ignore
    }
    return {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    }
  }

  const currentMonth = ref(getStoredMonth())

  // Watch for month changes and save to localStorage
  watch(
    currentMonth,
    newVal => {
      try {
        localStorage.setItem('planning_calendar_month', JSON.stringify(newVal))
      } catch {
        // ignore
      }
    },
    { deep: true }
  )

  // Filters
  const filters = reactive({
    roomType: '',
    mealPlan: ''
  })

  // ===================
  // COMPUTED
  // ===================

  // Seasons that overlap with current displayed month
  const currentMonthSeasons = computed(() => {
    if (!seasons.value.length || !currentMonth.value) return []

    const year = currentMonth.value.year
    const month = currentMonth.value.month
    const monthStart = new Date(year, month - 1, 1)
    const monthEnd = new Date(year, month, 0)

    return seasons.value.filter(season => {
      if (!season.dateRanges?.length) return false

      return season.dateRanges.some(range => {
        const rangeStart = new Date(range.startDate)
        const rangeEnd = new Date(range.endDate)
        return rangeStart <= monthEnd && rangeEnd >= monthStart
      })
    })
  })

  // Filtered room types based on market's and current month's seasons' active room types
  const filteredRoomTypes = computed(() => {
    if (!selectedMarket.value) return roomTypes.value

    let activeIds = selectedMarket.value.activeRoomTypes || []
    let marketFiltered = roomTypes.value

    if (activeIds.length > 0) {
      const normalizedMarketIds = activeIds.map(id => (typeof id === 'object' ? id._id : id))
      marketFiltered = roomTypes.value.filter(rt => normalizedMarketIds.includes(rt._id))
    }

    if (currentMonthSeasons.value.length > 0) {
      const seasonRoomTypeIds = new Set()
      let hasSeasonWithActiveRooms = false

      for (const season of currentMonthSeasons.value) {
        if (season.activeRoomTypes && season.activeRoomTypes.length > 0) {
          hasSeasonWithActiveRooms = true
          season.activeRoomTypes.forEach(id => {
            const normalizedId = typeof id === 'object' ? id._id : id
            seasonRoomTypeIds.add(normalizedId)
          })
        }
      }

      if (hasSeasonWithActiveRooms) {
        return marketFiltered.filter(rt => seasonRoomTypeIds.has(rt._id))
      }
    }

    return marketFiltered
  })

  // Filtered meal plans based on market's and current month's seasons' active meal plans
  const filteredMealPlans = computed(() => {
    let activeMPs = mealPlans.value.filter(mp => mp.status !== 'inactive')

    if (!selectedMarket.value) return activeMPs

    const marketActiveIds = selectedMarket.value.activeMealPlans || []
    let marketFiltered = activeMPs

    if (marketActiveIds.length > 0) {
      const normalizedMarketIds = marketActiveIds.map(id => (typeof id === 'object' ? id._id : id))
      marketFiltered = activeMPs.filter(mp => normalizedMarketIds.includes(mp._id))
    }

    if (currentMonthSeasons.value.length > 0) {
      const seasonMealPlanIds = new Set()
      let hasSeasonWithActiveMealPlans = false

      for (const season of currentMonthSeasons.value) {
        if (season.activeMealPlans && season.activeMealPlans.length > 0) {
          hasSeasonWithActiveMealPlans = true
          season.activeMealPlans.forEach(id => {
            const normalizedId = typeof id === 'object' ? id._id : id
            seasonMealPlanIds.add(normalizedId)
          })
        }
      }

      if (hasSeasonWithActiveMealPlans) {
        return marketFiltered.filter(mp => seasonMealPlanIds.has(mp._id))
      }
    }

    return marketFiltered
  })

  // Period List Data
  const periodListData = computed(() => {
    if (!filters.mealPlan) return []

    const mpData = priceListData.value.find(item => {
      const mpId = item.mealPlan?._id || item.mealPlan
      return mpId === filters.mealPlan
    })

    if (!mpData || !mpData.periods) return []

    return mpData.periods
  })

  // Today's position on timeline (percentage)
  const todayPosition = computed(() => {
    const year = timelineYear.value
    const yearStart = new Date(year, 0, 1).getTime()
    const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime()
    const yearDuration = yearEnd - yearStart
    const today = new Date().getTime()

    if (today < yearStart || today > yearEnd) return -1
    return ((today - yearStart) / yearDuration) * 100
  })

  // All season ranges combined for single timeline view
  const allSeasonRanges = computed(() => {
    const year = timelineYear.value
    const yearStart = new Date(year, 0, 1).getTime()
    const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime()
    const yearDuration = yearEnd - yearStart

    const ranges = []

    for (const season of seasons.value) {
      if (!season.dateRanges?.length) continue

      for (const range of season.dateRanges) {
        const start = new Date(range.startDate).getTime()
        const end = new Date(range.endDate).getTime()

        if (end < yearStart || start > yearEnd) continue

        const clampedStart = Math.max(start, yearStart)
        const clampedEnd = Math.min(end, yearEnd)

        const left = ((clampedStart - yearStart) / yearDuration) * 100
        const width = ((clampedEnd - clampedStart) / yearDuration) * 100

        const startDate = new Date(range.startDate)
        const endDate = new Date(range.endDate)
        const dateLabel = `${startDate.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}`

        ranges.push({
          season,
          left,
          width,
          dateLabel,
          color: season.color || '#6366f1'
        })
      }
    }

    return ranges.sort((a, b) => a.left - b.left)
  })

  // ===================
  // HELPERS
  // ===================

  const getSeasonName = season => {
    return season.name?.[locale.value] || season.name?.tr || season.name?.en || season.code
  }

  const getRoomTypeName = roomType => {
    if (!roomType) return ''
    return (
      roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code || ''
    )
  }

  const formatSeasonDates = season => {
    if (!season.dateRanges?.length) return '-'
    const range = season.dateRanges[0]
    return `${formatShortDate(range.startDate)} - ${formatShortDate(range.endDate)}`
  }

  const getMonthShortName = month => {
    const date = new Date(2024, month - 1, 1)
    return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' })
  }

  const getSelectedRoomTypeName = () => {
    if (!filters.roomType) return ''
    const rt = roomTypes.value.find(r => r._id === filters.roomType)
    if (!rt) return ''
    return rt.name?.[locale.value] || rt.name?.tr || rt.name?.en || rt.code || ''
  }

  const getSelectedMealPlanCode = () => {
    if (!filters.mealPlan) return ''
    const mp = mealPlans.value.find(m => m._id === filters.mealPlan)
    return mp?.code || ''
  }

  const getMealPlanActiveColor = code => {
    const colors = {
      RO: 'bg-gray-600 shadow-gray-600/30',
      BB: 'bg-amber-500 shadow-amber-500/30',
      HB: 'bg-orange-500 shadow-orange-500/30',
      FB: 'bg-blue-500 shadow-blue-500/30',
      AI: 'bg-purple-500 shadow-purple-500/30',
      UAI: 'bg-indigo-600 shadow-indigo-600/30'
    }
    return colors[code] || 'bg-amber-500 shadow-amber-500/30'
  }

  const formatPeriodDate = formatDisplayDate
  const getPeriodDays = calculateDays

  // ===================
  // API CALLS
  // ===================

  const fetchSeasons = async () => {
    if (!selectedMarket.value?._id) {
      seasons.value = []
      return
    }

    loadingSeasons.value = true
    try {
      const response = await planningService.getSeasons(props.hotel._id, selectedMarket.value._id)
      if (response.success) {
        seasons.value = response.data.sort((a, b) => {
          const aStart = a.dateRanges?.[0]?.startDate || ''
          const bStart = b.dateRanges?.[0]?.startDate || ''
          return aStart.localeCompare(bStart)
        })
      }
    } catch (error) {
      console.error('Error fetching seasons:', error)
    } finally {
      loadingSeasons.value = false
    }
  }

  const fetchRates = async (params = {}) => {
    loadingRates.value = true
    try {
      const queryParams = { ...params }

      if (selectedMarket.value) {
        queryParams.market = selectedMarket.value._id
      }

      if (viewMode.value === 'calendar') {
        const year = currentMonth.value.year
        const month = currentMonth.value.month

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        queryParams.startDate = startDate
        queryParams.endDate = endDate
      }

      const response =
        viewMode.value === 'calendar'
          ? await planningService.getRatesCalendar(props.hotel._id, queryParams)
          : await planningService.getRates(props.hotel._id, queryParams)

      if (response.success) {
        if (Array.isArray(response.data)) {
          rates.value = response.data
          overrides.value = []
          occupancy.value = {}
        } else if (response.data && typeof response.data === 'object') {
          rates.value = response.data.rates || []
          overrides.value = response.data.overrides || []
          occupancy.value = response.data.occupancy || {}
        }
        calendarKey.value++
      }
    } catch {
      toast.error(t('common.fetchError'))
    } finally {
      loadingRates.value = false
    }
  }

  const fetchPriceList = async () => {
    if (!filters.roomType || !filters.mealPlan || !selectedMarket.value) {
      priceListData.value = []
      return
    }

    loadingPriceList.value = true
    try {
      const params = {
        roomType: filters.roomType,
        mealPlan: filters.mealPlan,
        market: selectedMarket.value._id
      }

      const response = await planningService.getRatesPriceList(props.hotel._id, params)
      if (response.success) {
        priceListData.value = response.data
      }
    } catch (error) {
      console.error('Error fetching price list:', error)
      priceListData.value = []
    } finally {
      loadingPriceList.value = false
    }
  }

  const fetchDependencies = async () => {
    try {
      const [rtRes, mpRes, mRes] = await Promise.all([
        planningService.getRoomTypes(props.hotel._id),
        planningService.getMealPlans(props.hotel._id),
        planningService.getMarkets(props.hotel._id)
      ])

      if (rtRes.success) roomTypes.value = rtRes.data
      if (mpRes.success) mealPlans.value = mpRes.data
      if (mRes.success) {
        markets.value = mRes.data
        if (mRes.data.length > 0 && !selectedMarket.value) {
          selectedMarket.value = mRes.data[0]
        }
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error)
    }
  }

  // ===================
  // EVENT HANDLERS
  // ===================

  const handleCalendarRefresh = params => {
    if (params?.year && params?.month) {
      currentMonth.value = { year: params.year, month: params.month }
    }
    fetchRates()
  }

  const openBulkModal = () => {
    if (!selectedMarket.value) {
      toast.error(t('planning.pricing.selectMarket'))
      return
    }
    editingRate.value = null
    bulkEditCells.value = []
    showRateModal.value = true
  }

  const openBulkEditModal = cells => {
    bulkEditCells.value = cells
    showBulkEditModal.value = true
  }

  const handleBulkEditSaved = () => {
    showBulkEditModal.value = false
    bulkEditCells.value = []
    fetchRates()
  }

  const openPeriodEdit = period => {
    editingPeriod.value = period
    showPeriodEditModal.value = true
  }

  const handlePeriodEditSaved = () => {
    showPeriodEditModal.value = false
    editingPeriod.value = null
    // Refresh both period list and calendar rates
    fetchPriceList()
    fetchRates()
  }

  const handleAIExecuted = () => {
    fetchRates()
    if (viewMode.value === 'period') {
      fetchPriceList()
    }
    bulkEditCells.value = []
    if (calendarRef.value?.clearSelection) {
      calendarRef.value.clearSelection()
    }
  }

  const handleContractImported = async () => {
    showContractImport.value = false
    await fetchDependencies()
    fetchRates()
    if (viewMode.value === 'period') {
      fetchPriceList()
    }
  }

  const deleteAllPricingData = async () => {
    if (!selectedMarket.value) return

    isDeleting.value = true
    try {
      const result = await planningService.deleteMarketPricingData(
        props.hotel._id,
        selectedMarket.value._id
      )
      toast.success(
        `${result.data.seasonsDeleted} sezon ve ${result.data.ratesDeleted} fiyat silindi`
      )
      showDeleteConfirm.value = false
      await Promise.all([
        fetchSeasons(),
        fetchRates(),
        viewMode.value === 'period' ? fetchPriceList() : null
      ])
    } catch (error) {
      toast.error('Silme işlemi başarısız: ' + (error.response?.data?.message || error.message))
    } finally {
      isDeleting.value = false
    }
  }

  const handleSelectionChange = cells => {
    bulkEditCells.value = cells
  }

  const clearCalendarSelection = () => {
    bulkEditCells.value = []
    if (calendarRef.value?.clearSelection) {
      calendarRef.value.clearSelection()
    }
  }

  const editSeason = season => {
    editingSeason.value = season
    showSeasonForm.value = true
  }

  const handleSeasonSaved = () => {
    showSeasonForm.value = false
    editingSeason.value = null
    fetchSeasons()
  }

  const confirmDeleteSeason = season => {
    deleteTarget.value = season
    deleteType.value = 'season'
    showDeleteModal.value = true
  }

  const handleRateSaved = () => {
    showRateModal.value = false
    editingRate.value = null
    bulkEditCells.value = []
    fetchRates()
  }

  const executeDelete = async () => {
    deleting.value = true
    try {
      if (deleteType.value === 'season') {
        await planningService.deleteSeason(props.hotel._id, deleteTarget.value._id)
        toast.success(t('planning.pricing.seasonDeleted'))
        fetchSeasons()
      } else if (deleteType.value === 'rate') {
        await planningService.deleteRate(props.hotel._id, deleteTarget.value._id)
        toast.success(t('planning.pricing.rateDeleted'))
        fetchRates()
      }
      showDeleteModal.value = false
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.deleteFailed'))
    } finally {
      deleting.value = false
    }
  }

  // ===================
  // WATCHERS
  // ===================

  const setupWatchers = () => {
    watch(selectedMarket, () => {
      fetchSeasons()
      fetchRates()

      nextTick(() => {
        if (filters.roomType && !filteredRoomTypes.value.find(rt => rt._id === filters.roomType)) {
          filters.roomType = filteredRoomTypes.value[0]?._id || ''
        }
        if (filters.mealPlan && !filteredMealPlans.value.find(mp => mp._id === filters.mealPlan)) {
          filters.mealPlan = filteredMealPlans.value[0]?._id || ''
        }
      })

      if (viewMode.value === 'period') {
        fetchPriceList()
      }
    })

    watch(viewMode, newMode => {
      if (newMode === 'period') {
        if (!filters.roomType && filteredRoomTypes.value.length > 0) {
          filters.roomType = filteredRoomTypes.value[0]._id
        }
        if (!filters.mealPlan && filteredMealPlans.value.length > 0) {
          filters.mealPlan = filteredMealPlans.value[0]._id
        }
        fetchPriceList()
      }
    })

    watch(
      () => filters.roomType,
      () => {
        if (viewMode.value === 'period') {
          fetchPriceList()
        }
      }
    )

    watch(
      () => filters.mealPlan,
      () => {
        if (viewMode.value === 'period') {
          fetchPriceList()
        }
      }
    )

    watch(
      () => props.hotel?._id,
      newId => {
        if (newId) {
          fetchDependencies()
          fetchSeasons()
          fetchRates()
        }
      },
      { immediate: true }
    )

    watch(
      () => props.active,
      (isActive, wasActive) => {
        if (isActive && !wasActive) {
          fetchDependencies()
          fetchRates()
          if (viewMode.value === 'period') {
            fetchPriceList()
          }
        }
      }
    )

    watch(
      () => props.refreshTrigger,
      (newVal, oldVal) => {
        if (newVal !== oldVal && props.active) {
          fetchDependencies()
          fetchRates()
        }
      }
    )
  }

  return {
    // State
    rates,
    overrides,
    occupancy,
    seasons,
    roomTypes,
    mealPlans,
    markets,
    loadingRates,
    loadingSeasons,
    loadingPriceList,
    calendarKey,
    priceListData,
    viewMode,
    showSeasonPanel,
    timelineYear,
    showSeasonForm,
    showRateModal,
    showDeleteModal,
    selectedMarket,
    editingSeason,
    editingRate,
    deleteTarget,
    deleteType,
    deleting,
    bulkEditCells,
    showBulkEditModal,
    showPriceQueryModal,
    showForecastModal,
    showPeriodEditModal,
    showContractImport,
    editingPeriod,
    calendarRef,
    showDeleteConfirm,
    isDeleting,
    currentMonth,
    filters,

    // Computed
    currentMonthSeasons,
    filteredRoomTypes,
    filteredMealPlans,
    periodListData,
    todayPosition,
    allSeasonRanges,

    // Helpers
    getSeasonName,
    getRoomTypeName,
    formatSeasonDates,
    getMonthShortName,
    getSelectedRoomTypeName,
    getSelectedMealPlanCode,
    getMealPlanActiveColor,
    formatPeriodDate,
    getPeriodDays,

    // API
    fetchSeasons,
    fetchRates,
    fetchPriceList,
    fetchDependencies,

    // Event Handlers
    handleCalendarRefresh,
    openBulkModal,
    openBulkEditModal,
    handleBulkEditSaved,
    openPeriodEdit,
    handlePeriodEditSaved,
    handleAIExecuted,
    handleContractImported,
    deleteAllPricingData,
    handleSelectionChange,
    clearCalendarSelection,
    editSeason,
    handleSeasonSaved,
    confirmDeleteSeason,
    handleRateSaved,
    executeDelete,

    // Watchers
    setupWatchers,

    // Stores
    authStore,

    // i18n
    t,
    locale
  }
}
