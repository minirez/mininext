import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'
import { useRelativePricing } from '@/composables/useRelativePricing'

/**
 * Composable for Rate Form logic
 * Manages pricing, restrictions, and related calculations
 */
export function useRateFormLogic(props, emit) {
  const { t, locale } = useI18n()
  const toast = useToast()

  // State
  const saving = ref(false)
  const currentStep = ref(0)
  const selectedRoomTab = ref('')
  const allowEditCalculated = ref(false)

  const steps = [
    { key: 'period', label: 'Period' },
    { key: 'pricing', label: 'Pricing' }
  ]

  // Date range ref object
  const dateRange = ref({ start: '', end: '' })

  // Form data (global settings)
  const form = reactive({
    season: ''
  })

  // Room prices: { roomTypeId: { mealPlanId: { pricePerNight, extraAdult, childOrderPricing[], extraInfant, pricingType, occupancyPricing } } }
  const roomPrices = reactive({})

  // Room restrictions: { roomTypeId: { allotment, minStay, maxStay, releaseDays, stopSale, closedToArrival, closedToDeparture, singleSupplement } }
  const roomRestrictions = reactive({})

  // Currency from selected market
  const currency = computed(() => props.market?.currency || 'EUR')

  // Filtered room types and meal plans based on selected season
  const filteredRoomTypes = computed(() => {
    if (!form.season) return props.roomTypes

    const season = props.seasons.find(s => s._id === form.season)
    if (!season) return props.roomTypes

    // If season has activeRoomTypes defined, filter by them
    if (season.activeRoomTypes?.length > 0) {
      const activeIds = season.activeRoomTypes.map(rt => (typeof rt === 'object' ? rt._id : rt))
      return props.roomTypes.filter(rt => activeIds.includes(rt._id))
    }

    // Otherwise, check market's activeRoomTypes
    if (props.market?.activeRoomTypes?.length > 0) {
      const activeIds = props.market.activeRoomTypes.map(rt => (typeof rt === 'object' ? rt._id : rt))
      return props.roomTypes.filter(rt => activeIds.includes(rt._id))
    }

    return props.roomTypes
  })

  const filteredMealPlans = computed(() => {
    if (!form.season) return props.mealPlans

    const season = props.seasons.find(s => s._id === form.season)
    if (!season) return props.mealPlans

    // If season has activeMealPlans defined, filter by them
    if (season.activeMealPlans?.length > 0) {
      const activeIds = season.activeMealPlans.map(mp => (typeof mp === 'object' ? mp._id : mp))
      return props.mealPlans.filter(mp => activeIds.includes(mp._id))
    }

    // Otherwise, check market's activeMealPlans
    if (props.market?.activeMealPlans?.length > 0) {
      const activeIds = props.market.activeMealPlans.map(mp => (typeof mp === 'object' ? mp._id : mp))
      return props.mealPlans.filter(mp => activeIds.includes(mp._id))
    }

    return props.mealPlans
  })

  // Relative pricing composable
  const roomTypesRef = computed(() => props.roomTypes)
  const mealPlansRef = computed(() => props.mealPlans)
  const {
    baseRoom,
    baseMealPlan,
    isBaseCell
  } = useRelativePricing(roomTypesRef, mealPlansRef)

  // Check if explicit base room is set (user clicked the star)
  const hasExplicitBaseRoom = computed(() => props.roomTypes.some(rt => rt.isBaseRoom === true))

  // Is current tab the base room?
  const isCurrentRoomBase = computed(() => {
    if (!hasExplicitBaseRoom.value) return false
    return baseRoom.value?._id === selectedRoomTab.value
  })

  // Check if a cell is calculated (not the base cell, when relative pricing is active)
  const isCalculatedCell = (roomId, mealPlanId) => {
    if (!hasExplicitBaseRoom.value) return false
    // If it's the base cell, it's not calculated
    if (isBaseCell(roomId, mealPlanId)) return false
    return true
  }

  // Calculate relative prices when base room prices change
  const calculateRelativePrices = () => {
    // Only calculate if base room is explicitly set
    if (!hasExplicitBaseRoom.value) return
    if (!baseRoom.value) return

    const baseRoomId = baseRoom.value._id
    const baseMealPlanId = baseMealPlan.value?._id

    // Get the base cell price (base room + base meal plan)
    const baseCellData = roomPrices[baseRoomId]?.[baseMealPlanId]
    if (!baseCellData?.pricePerNight || baseCellData.pricePerNight <= 0) return

    const baseCellPrice = baseCellData.pricePerNight

    // Helper function to calculate price with adjustments
    const applyAdjustments = (price, roomAdj, mealAdj) => {
      // First apply room adjustment, then meal plan adjustment
      const afterRoom = price * (1 + (roomAdj || 0) / 100)
      const afterMeal = afterRoom * (1 + (mealAdj || 0) / 100)
      return Math.round(afterMeal * 100) / 100
    }

    // Calculate for all combinations
    props.roomTypes.forEach(room => {
      props.mealPlans.forEach(meal => {
        // Skip the base cell (base room + base meal plan)
        if (room._id === baseRoomId && meal._id === baseMealPlanId) return

        // Ensure the structure exists
        if (!roomPrices[room._id]) roomPrices[room._id] = {}
        if (!roomPrices[room._id][meal._id]) {
          const maxChildren = room.occupancy?.maxChildren ?? 2
          roomPrices[room._id][meal._id] = {
            pricePerNight: 0,
            extraAdult: 0,
            childOrderPricing: Array(maxChildren).fill(0),
            extraInfant: 0,
            singleSupplement: 0
          }
        }

        // Get adjustments
        const roomAdj = room.priceAdjustment || 0
        const mealAdj = meal.priceAdjustment || 0

        // Calculate relative price
        roomPrices[room._id][meal._id].pricePerNight = applyAdjustments(
          baseCellPrice,
          roomAdj,
          mealAdj
        )

        // Also calculate extra adult if base has it
        if (baseCellData.extraAdult > 0) {
          roomPrices[room._id][meal._id].extraAdult = applyAdjustments(
            baseCellData.extraAdult,
            roomAdj,
            mealAdj
          )
        }

        // Calculate child prices
        if (baseCellData.childOrderPricing?.length > 0) {
          baseCellData.childOrderPricing.forEach((childPrice, idx) => {
            if (childPrice > 0 && roomPrices[room._id][meal._id].childOrderPricing) {
              roomPrices[room._id][meal._id].childOrderPricing[idx] = applyAdjustments(
                childPrice,
                roomAdj,
                mealAdj
              )
            }
          })
        }

        // Calculate infant price
        if (baseCellData.extraInfant > 0) {
          roomPrices[room._id][meal._id].extraInfant = applyAdjustments(
            baseCellData.extraInfant,
            roomAdj,
            mealAdj
          )
        }

        // Calculate single supplement
        if (baseCellData.singleSupplement > 0) {
          roomPrices[room._id][meal._id].singleSupplement = applyAdjustments(
            baseCellData.singleSupplement,
            roomAdj,
            mealAdj
          )
        }
      })
    })
  }

  // Current room type
  const currentRoomType = computed(() =>
    filteredRoomTypes.value.find(rt => rt._id === selectedRoomTab.value)
  )

  // Helper to get child age bounds from childAgeGroups
  const getAgeRangesFromGroups = groups => {
    if (!groups || groups.length === 0) return null
    const infant = groups.find(g => g.code === 'infant')
    const childGroups = groups.filter(g => g.code !== 'infant')
    const lastChild = childGroups.length > 0 ? childGroups[childGroups.length - 1] : null
    return {
      infantMaxAge: infant?.maxAge ?? null,
      childMaxAge: lastChild?.maxAge ?? null
    }
  }

  // Age settings with source (Season > Market > Hotel)
  const ageSettings = computed(() => {
    const hotel = props.hotel
    const market = props.market
    const selectedSeasonId = form.season
    const season = selectedSeasonId ? props.seasons.find(s => s._id === selectedSeasonId) : null

    // Default from hotel's childAgeGroups
    const hotelAges = getAgeRangesFromGroups(hotel?.childAgeGroups)
    let childMaxAge = hotelAges?.childMaxAge ?? hotel?.policies?.maxChildAge ?? 12
    let infantMaxAge = hotelAges?.infantMaxAge ?? hotel?.policies?.maxBabyAge ?? 2
    let childSource = 'hotel'
    let infantSource = 'hotel'

    // Override from market if not inheriting from hotel
    if (
      market?.childAgeSettings?.inheritFromHotel === false &&
      market?.childAgeSettings?.childAgeGroups?.length
    ) {
      const marketAges = getAgeRangesFromGroups(market.childAgeSettings.childAgeGroups)
      if (marketAges?.childMaxAge != null) {
        childMaxAge = marketAges.childMaxAge
        childSource = 'market'
      }
      if (marketAges?.infantMaxAge != null) {
        infantMaxAge = marketAges.infantMaxAge
        infantSource = 'market'
      }
    }

    // Override from season if not inheriting from market
    if (
      season?.childAgeSettings?.inheritFromMarket === false &&
      season?.childAgeSettings?.childAgeGroups?.length
    ) {
      const seasonAges = getAgeRangesFromGroups(season.childAgeSettings.childAgeGroups)
      if (seasonAges?.childMaxAge != null) {
        childMaxAge = seasonAges.childMaxAge
        childSource = 'season'
      }
      if (seasonAges?.infantMaxAge != null) {
        infantMaxAge = seasonAges.infantMaxAge
        infantSource = 'season'
      }
    }

    return {
      childMaxAge,
      infantMaxAge,
      childSource,
      infantSource
    }
  })

  // Max children for current room (for table rows)
  const maxChildrenForCurrentRoom = computed(() => {
    return currentRoomType.value?.occupancy?.maxChildren ?? 2
  })

  // Max adults for current room (for OBP rows)
  const maxAdultsForCurrentRoom = computed(() => {
    return currentRoomType.value?.occupancy?.maxAdults ?? 4
  })

  // Get effective minAdults for a room considering override hierarchy:
  // RoomType (base) -> Market (override) -> Season (override)
  const getEffectiveMinAdults = roomTypeId => {
    const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
    if (!roomType) return 1

    const baseMinAdults = roomType.occupancy?.minAdults || 1

    // Check Market override
    let marketOverride = null
    if (props.market?.pricingOverrides?.length > 0) {
      const override = props.market.pricingOverrides.find(po => {
        const rtId = typeof po.roomType === 'object' ? po.roomType._id : po.roomType
        return rtId === roomTypeId && po.useMinAdultsOverride
      })
      if (override) {
        marketOverride = override.minAdults
      }
    }

    // Check Season override (most specific wins)
    let seasonOverride = null
    if (form.season) {
      const season = props.seasons.find(s => s._id === form.season)
      if (season?.pricingOverrides?.length > 0) {
        const override = season.pricingOverrides.find(po => {
          const rtId = typeof po.roomType === 'object' ? po.roomType._id : po.roomType
          return rtId === roomTypeId && po.useMinAdultsOverride
        })
        if (override) {
          seasonOverride = override.minAdults
        }
      }
    }

    // Priority: Season > Market > RoomType
    return seasonOverride || marketOverride || baseMinAdults
  }

  // Min adults for current room (considering override hierarchy)
  const minAdultsForCurrentRoom = computed(() => {
    if (!currentRoomType.value) return 1
    return getEffectiveMinAdults(currentRoomType.value._id)
  })

  // Adults range for current room (minAdults to maxAdults)
  const adultsRangeForCurrentRoom = computed(() => {
    const range = []
    for (let i = minAdultsForCurrentRoom.value; i <= maxAdultsForCurrentRoom.value; i++) {
      range.push(i)
    }
    return range
  })

  // Get effective pricing type for a room considering override hierarchy:
  // RoomType (base) -> Market (override) -> Season (override)
  const getEffectivePricingType = roomTypeId => {
    const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
    if (!roomType) return 'unit'

    const basePricingType = roomType.pricingType || 'unit'

    // Check Market override
    let marketOverride = null
    if (props.market?.pricingOverrides?.length > 0) {
      const override = props.market.pricingOverrides.find(po => {
        const rtId = typeof po.roomType === 'object' ? po.roomType._id : po.roomType
        return rtId === roomTypeId && po.usePricingTypeOverride
      })
      if (override) {
        marketOverride = override.pricingType
      }
    }

    // Check Season override (most specific wins)
    let seasonOverride = null
    if (form.season) {
      const season = props.seasons.find(s => s._id === form.season)
      if (season?.pricingOverrides?.length > 0) {
        const override = season.pricingOverrides.find(po => {
          const rtId = typeof po.roomType === 'object' ? po.roomType._id : po.roomType
          return rtId === roomTypeId && po.usePricingTypeOverride
        })
        if (override) {
          seasonOverride = override.pricingType
        }
      }
    }

    // Priority: Season > Market > RoomType
    return seasonOverride || marketOverride || basePricingType
  }

  // Current room's pricing type (considering override hierarchy)
  const currentRoomPricingType = computed(() => {
    if (!currentRoomType.value) return 'unit'
    return getEffectivePricingType(currentRoomType.value._id)
  })

  // Check if current room uses multiplier system
  const currentRoomUsesMultipliers = computed(() => {
    const rt = currentRoomType.value
    // Both conditions must be true:
    // 1. Effective pricing type is per_person (considering override hierarchy)
    // 2. Room has useMultipliers enabled
    return currentRoomPricingType.value === 'per_person' && rt?.useMultipliers === true
  })

  // Get active combinations for multiplier OBP (filtered by minAdults)
  const currentRoomCombinations = computed(() => {
    const rt = currentRoomType.value
    const table = rt?.multiplierTemplate?.combinationTable || []
    const minAdults = minAdultsForCurrentRoom.value
    // Filter by isActive and adults >= minAdults
    return table.filter(c => c.isActive !== false && c.adults >= minAdults)
  })

  // Format combination key with age ranges: "1+3 (0-2, 3-6, 3-6)"
  const formatCombinationKey = combo => {
    const adults = combo.adults
    const children = combo.children || []

    if (children.length === 0) {
      return `${adults}`
    }

    // Get age ranges from hotel's childAgeGroups
    const ageGroups = props.hotel?.childAgeGroups || []

    const getAgeRange = ageGroupCode => {
      const group = ageGroups.find(g => g.code === ageGroupCode)
      if (group) {
        return `${group.minAge}-${group.maxAge}`
      }
      // Fallback if not found
      const fallbacks = {
        infant: '0-2',
        first: '3-6',
        second: '7-11',
        third: '12-17'
      }
      return fallbacks[ageGroupCode] || ageGroupCode
    }

    const ageRanges = children.map(c => getAgeRange(c.ageGroup))
    return `${adults}+${children.length} (${ageRanges.join(', ')})`
  }

  const calculateNights = computed(() => {
    if (!dateRange.value.start || !dateRange.value.end) return 0
    const [sy, sm, sd] = dateRange.value.start.split('-').map(Number)
    const [ey, em, ed] = dateRange.value.end.split('-').map(Number)
    const start = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 0
  })

  // Check if a room has any prices set (handles unit, standard OBP, and multiplier OBP)
  const hasRoomPrices = roomTypeId => {
    const prices = roomPrices[roomTypeId]
    if (!prices) return false

    // Get effective pricing type considering override hierarchy
    const pricingType = getEffectivePricingType(roomTypeId)

    // Get effective minAdults considering override hierarchy
    const minAdults = getEffectiveMinAdults(roomTypeId)

    // Check if room uses multipliers
    const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
    const usesMultipliers = pricingType === 'per_person' && roomType?.useMultipliers === true

    return Object.values(prices).some(mp => {
      if (usesMultipliers) {
        // Multiplier OBP: Check pricePerNight (base price)
        return mp.pricePerNight > 0
      } else if (pricingType === 'per_person') {
        // Standard OBP: Check if minAdults and minAdults+1 person prices are set
        // (e.g., if minAdults=2, check 2 and 3 person prices)
        return mp.occupancyPricing?.[minAdults] > 0 && mp.occupancyPricing?.[minAdults + 1] > 0
      } else {
        // Unit: Check pricePerNight
        return mp.pricePerNight > 0
      }
    })
  }

  // Check if ALL filtered rooms have at least one meal plan price (required)
  // When base room pricing is active, only base room needs prices (others are calculated)
  const allRoomsHavePrices = computed(() => {
    if (hasExplicitBaseRoom.value) {
      // Only base room needs to have prices
      return baseRoom.value ? hasRoomPrices(baseRoom.value._id) : false
    }
    return filteredRoomTypes.value.every(rt => hasRoomPrices(rt._id))
  })

  // Get filtered rooms that are missing prices
  // When base room pricing is active, only check base room
  const roomsMissingPrices = computed(() => {
    if (hasExplicitBaseRoom.value) {
      // Only base room matters
      if (baseRoom.value && !hasRoomPrices(baseRoom.value._id)) {
        return [baseRoom.value]
      }
      return []
    }
    return filteredRoomTypes.value.filter(rt => !hasRoomPrices(rt._id))
  })

  // Get all seasons' combined min/max dates for DateRangePicker bounds
  const allSeasonsMinDate = computed(() => {
    let minDate = null
    props.seasons.forEach(season => {
      season.dateRanges?.forEach(range => {
        const start = new Date(range.startDate)
        if (!minDate || start < minDate) minDate = start
      })
    })
    return minDate
  })

  const allSeasonsMaxDate = computed(() => {
    let maxDate = null
    props.seasons.forEach(season => {
      season.dateRanges?.forEach(range => {
        const end = new Date(range.endDate)
        if (!maxDate || end > maxDate) maxDate = end
      })
    })
    return maxDate
  })

  // Disabled dates (dates outside any season) - for DateRangePickerInline
  const disabledDates = computed(() => {
    // We'll pass the season ranges to the picker component
    // For now, return null as the picker doesn't support this yet
    return null
  })

  // Auto-detect season based on selected date range
  const detectedSeason = computed(() => {
    if (!dateRange.value.start || !dateRange.value.end) return null

    const selectedStart = new Date(dateRange.value.start)
    const selectedEnd = new Date(dateRange.value.end)
    selectedStart.setHours(0, 0, 0, 0)
    selectedEnd.setHours(0, 0, 0, 0)

    // Find season that contains the entire selected range
    for (const season of props.seasons) {
      const matchingRange = season.dateRanges?.some(range => {
        const rangeStart = new Date(range.startDate)
        const rangeEnd = new Date(range.endDate)
        rangeStart.setHours(0, 0, 0, 0)
        rangeEnd.setHours(0, 0, 0, 0)
        return selectedStart >= rangeStart && selectedEnd <= rangeEnd
      })
      if (matchingRange) return season
    }
    return null
  })

  const canProceed = computed(() => {
    if (currentStep.value === 0) {
      // Must have dates
      if (!dateRange.value.start || !dateRange.value.end) return false
      // Must have a detected season (dates within a season)
      if (!detectedSeason.value) return false
      return true
    }
    if (currentStep.value === 1) {
      return allRoomsHavePrices.value
    }
    return true
  })

  // Methods
  const getRoomTypeName = roomType => {
    if (!roomType) return ''
    return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || ''
  }

  const getMealPlanBg = code => {
    const colors = {
      RO: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      BB: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      HB: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      FB: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      AI: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      UAI: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
    }
    return colors[code] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }

  const formatDisplayDate = dateStr => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}.${month}.${year}`
  }

  // Get max children for a room type
  const getMaxChildrenForRoom = roomTypeId => {
    const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
    return roomType?.occupancy?.maxChildren ?? 2
  }

  // Initialize prices and restrictions for all room types (use all props, not filtered)
  const initializeRoomData = () => {
    props.roomTypes.forEach(rt => {
      const maxChildren = getMaxChildrenForRoom(rt._id)

      // Get pricing type from room type (set in room type form)
      const roomPricingType = rt.pricingType || 'unit'

      // Initialize prices
      if (!roomPrices[rt._id]) {
        roomPrices[rt._id] = {}
      }
      props.mealPlans.forEach(mp => {
        if (!roomPrices[rt._id][mp._id]) {
          // Initialize occupancy pricing object
          const occupancyPricing = {}
          for (let i = 1; i <= 10; i++) {
            occupancyPricing[i] = 0
          }

          roomPrices[rt._id][mp._id] = {
            pricePerNight: 0,
            extraAdult: 0,
            childOrderPricing: Array(maxChildren).fill(0),
            extraInfant: 0,
            singleSupplement: 0,
            pricingType: roomPricingType,
            occupancyPricing
          }
        } else {
          // Add missing fields
          if (!roomPrices[rt._id][mp._id].childOrderPricing) {
            roomPrices[rt._id][mp._id].childOrderPricing = Array(maxChildren).fill(0)
          }
          if (roomPrices[rt._id][mp._id].singleSupplement === undefined) {
            roomPrices[rt._id][mp._id].singleSupplement = 0
          }
          // Update pricingType from room type
          roomPrices[rt._id][mp._id].pricingType = roomPricingType
          if (!roomPrices[rt._id][mp._id].occupancyPricing) {
            const occupancyPricing = {}
            for (let i = 1; i <= 10; i++) {
              occupancyPricing[i] = 0
            }
            roomPrices[rt._id][mp._id].occupancyPricing = occupancyPricing
          }
        }
      })

      // Initialize restrictions
      if (!roomRestrictions[rt._id]) {
        roomRestrictions[rt._id] = {
          allotment: 10,
          minStay: 1,
          maxStay: 30,
          releaseDays: 0,
          stopSale: false,
          singleStop: false,
          closedToArrival: false,
          closedToDeparture: false,
          singleSupplement: 0
        }
      }
    })

    // Set first filtered room as selected if not set or current selection is not in filtered list
    updateSelectedRoomTab()
  }

  // Update selected room tab when filter changes
  const updateSelectedRoomTab = () => {
    const filtered = filteredRoomTypes.value
    if (filtered.length === 0) {
      selectedRoomTab.value = ''
      return
    }

    // If current selection is not in filtered list, select first one
    if (!selectedRoomTab.value || !filtered.find(rt => rt._id === selectedRoomTab.value)) {
      selectedRoomTab.value = filtered[0]._id
    }
  }

  // Format season dates for display in legend
  const formatSeasonDates = season => {
    if (!season?.dateRanges?.length) return ''
    const range = season.dateRanges[0]
    const start = new Date(range.startDate)
    const end = new Date(range.endDate)
    return `${start.getDate()}.${start.getMonth() + 1} - ${end.getDate()}.${end.getMonth() + 1}`
  }

  // Copy first meal plan price to all meal plans (current room) - uses filtered
  const copyFirstPriceToAllMealPlans = () => {
    const firstMealPlan = filteredMealPlans.value[0]
    if (!firstMealPlan || !roomPrices[selectedRoomTab.value]?.[firstMealPlan._id]) return

    const source = roomPrices[selectedRoomTab.value][firstMealPlan._id]
    filteredMealPlans.value.forEach(mp => {
      if (mp._id !== firstMealPlan._id) {
        roomPrices[selectedRoomTab.value][mp._id] = { ...source }
      }
    })
    toast.success(t('planning.pricing.copiedToMealPlans'))
  }

  // Copy current room's prices and restrictions to all rooms - uses filtered
  const copyCurrentRoomToAll = () => {
    const sourcePrice = roomPrices[selectedRoomTab.value]
    const sourceRestrictions = roomRestrictions[selectedRoomTab.value]
    if (!sourcePrice) return

    filteredRoomTypes.value.forEach(rt => {
      if (rt._id !== selectedRoomTab.value) {
        // Copy prices
        roomPrices[rt._id] = {}
        filteredMealPlans.value.forEach(mp => {
          roomPrices[rt._id][mp._id] = { ...sourcePrice[mp._id] }
        })

        // Copy restrictions (allotment, minStay, releaseDays)
        if (sourceRestrictions) {
          roomRestrictions[rt._id] = {
            ...roomRestrictions[rt._id],
            allotment: sourceRestrictions.allotment,
            minStay: sourceRestrictions.minStay,
            releaseDays: sourceRestrictions.releaseDays
          }
        }
      }
    })
    toast.success(t('planning.pricing.copiedToRooms'))
  }

  // Update room prices for a specific room (handles reactive object properly)
  const updateRoomPricesForRoom = (roomId, newPrices) => {
    roomPrices[roomId] = newPrices
  }

  // Update room restrictions for a specific room (handles reactive object properly)
  const updateRoomRestrictionsForRoom = (roomId, newRestrictions) => {
    roomRestrictions[roomId] = newRestrictions
  }

  const nextStep = () => {
    if (canProceed.value && currentStep.value < steps.length - 1) {
      currentStep.value++
    }
  }

  const handleSave = async () => {
    if (!canProceed.value) {
      toast.error(t('validation.required'))
      return
    }

    if (!props.market?._id) {
      toast.error(t('planning.pricing.selectMarket'))
      return
    }

    saving.value = true
    try {
      const promises = []

      // Create rates for each filtered room type that has prices
      filteredRoomTypes.value.forEach(rt => {
        const prices = roomPrices[rt._id]
        const restrictions = roomRestrictions[rt._id]
        const pricingType = getEffectivePricingType(rt._id) // Get from override hierarchy

        // Check if room uses multipliers
        const usesMultipliers = pricingType === 'per_person' && rt.useMultipliers === true

        // For each filtered meal plan that has valid pricing
        filteredMealPlans.value.forEach(mp => {
          const mealPlanPrice = prices?.[mp._id]

          // Check if this meal plan has valid prices based on pricing type
          let hasValidPrice = false
          if (usesMultipliers) {
            // Multiplier OBP: need pricePerNight (base price)
            hasValidPrice = mealPlanPrice?.pricePerNight > 0
          } else if (pricingType === 'per_person') {
            // Standard OBP: need at least 1 and 2 person prices
            hasValidPrice =
              mealPlanPrice?.occupancyPricing?.[1] > 0 && mealPlanPrice?.occupancyPricing?.[2] > 0
          } else {
            // Unit: need pricePerNight
            hasValidPrice = mealPlanPrice?.pricePerNight > 0
          }

          if (hasValidPrice) {
            const data = {
              roomType: rt._id,
              mealPlan: mp._id,
              market: props.market._id,
              startDate: dateRange.value.start,
              endDate: dateRange.value.end,
              season: form.season || undefined,
              pricingType: pricingType,
              currency: currency.value,
              allotment: restrictions?.allotment ?? 10,
              minStay: restrictions?.minStay || 1,
              maxStay: restrictions?.maxStay || 30,
              releaseDays: restrictions?.releaseDays || 0,
              stopSale: restrictions?.stopSale || false,
              singleStop: restrictions?.singleStop || false,
              closedToArrival: restrictions?.closedToArrival || false,
              closedToDeparture: restrictions?.closedToDeparture || false
            }

            if (usesMultipliers) {
              // Multiplier OBP: include pricePerNight as base price
              // occupancyPricing, childOrderPricing, extraInfant will be calculated from multiplierTemplate
              data.pricePerNight = mealPlanPrice.pricePerNight
              data.occupancyPricing = {} // Will be calculated from adultMultipliers
              data.childOrderPricing = [] // Will be calculated from childMultipliers
              data.extraInfant = 0 // Will be calculated from infantMultiplier
              data.extraAdult = 0
              data.singleSupplement = 0
            } else if (pricingType === 'per_person') {
              // Standard OBP: include occupancyPricing, clear unit-based fields
              data.occupancyPricing = {}
              for (let i = 1; i <= 10; i++) {
                if (mealPlanPrice.occupancyPricing?.[i] > 0) {
                  data.occupancyPricing[i] = mealPlanPrice.occupancyPricing[i]
                }
              }
              data.childOrderPricing = mealPlanPrice.childOrderPricing || []
              data.extraInfant = mealPlanPrice.extraInfant || 0
              data.pricePerNight = 0
              data.extraAdult = 0
              data.singleSupplement = 0
            } else {
              // Unit: include unit-based pricing fields
              data.pricePerNight = mealPlanPrice.pricePerNight
              data.singleSupplement = mealPlanPrice.singleSupplement || 0
              data.extraAdult = mealPlanPrice.extraAdult || 0
              data.childOrderPricing = mealPlanPrice.childOrderPricing || []
              data.extraInfant = mealPlanPrice.extraInfant || 0
            }

            if (!data.season) delete data.season

            promises.push(planningService.createRate(props.hotel._id, data))
          }
        })
      })

      if (promises.length === 0) {
        toast.error(t('planning.pricing.atLeastOnePrice'))
        return
      }

      await Promise.all(promises)
      toast.success(t('planning.pricing.ratesCreated', { count: promises.length }))
      emit('saved')
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.operationFailed'))
    } finally {
      saving.value = false
    }
  }

  // Fetch last rate for this market and set suggested next period
  const fetchLastRateAndSetDates = async () => {
    if (!props.market?._id || !props.hotel?._id) return

    try {
      const response = await planningService.getRates(props.hotel._id, {
        market: props.market._id
      })

      // Handle response format
      let rates = []
      if (response.success) {
        if (Array.isArray(response.data)) {
          rates = response.data
        } else if (response.data?.rates) {
          rates = response.data.rates
        }
      }

      if (rates.length > 0) {
        // Daily rate model: each rate has a single 'date' field
        // Find the rate with the latest date
        const sortedRates = [...rates].sort((a, b) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateB - dateA // Sort descending
        })

        const lastRate = sortedRates[0]
        const lastDate = new Date(lastRate.date)

        // Set start date to day after last rate
        const nextStartDate = new Date(lastDate)
        nextStartDate.setDate(nextStartDate.getDate() + 1)

        // Set end date to 30 days later (default duration)
        const nextEndDate = new Date(nextStartDate)
        nextEndDate.setDate(nextEndDate.getDate() + 29)

        // Format dates as YYYY-MM-DD
        const formatDate = date => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        dateRange.value.start = formatDate(nextStartDate)
        dateRange.value.end = formatDate(nextEndDate)
      } else {
        // No existing rates - start from first day of last season
        const formatDate = date => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        // Find the last season (by end date)
        let lastSeason = null
        let lastSeasonEndDate = null

        props.seasons.forEach(season => {
          season.dateRanges?.forEach(range => {
            const endDate = new Date(range.endDate)
            if (!lastSeasonEndDate || endDate > lastSeasonEndDate) {
              lastSeasonEndDate = endDate
              lastSeason = { season, range }
            }
          })
        })

        if (lastSeason) {
          // Start from the first day of the last season's range
          const startDate = new Date(lastSeason.range.startDate)
          const endDate = new Date(lastSeason.range.endDate)

          dateRange.value.start = formatDate(startDate)
          dateRange.value.end = formatDate(endDate)
        } else {
          // No seasons either - default to today + 30 days
          const today = new Date()
          const endDate = new Date(today)
          endDate.setDate(endDate.getDate() + 30)

          dateRange.value.start = formatDate(today)
          dateRange.value.end = formatDate(endDate)
        }
      }
    } catch (error) {
      console.error('Error fetching last rate:', error)
      // Set default dates on error
      const today = new Date()
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 30)

      const formatDate = date => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      dateRange.value.start = formatDate(today)
      dateRange.value.end = formatDate(endDate)
    }
  }

  // Setup watchers
  const setupWatchers = () => {
    // Watch for data changes
    watch(
      [() => props.roomTypes, () => props.mealPlans],
      () => {
        initializeRoomData()
      },
      { immediate: true, deep: true }
    )

    // Watch base cell (base room + base meal plan) prices and trigger relative calculation
    watch(
      () => {
        if (!baseRoom.value || !baseMealPlan.value) return null
        // Watch the base cell specifically
        const baseCell = roomPrices[baseRoom.value._id]?.[baseMealPlan.value._id]
        return JSON.stringify(baseCell)
      },
      () => {
        // Trigger calculation whenever base cell price changes
        calculateRelativePrices()
      },
      { deep: true }
    )

    // Watch for season change to update filtered room types
    watch(
      () => form.season,
      () => {
        updateSelectedRoomTab()
      }
    )

    // Auto-update form.season when detectedSeason changes
    watch(detectedSeason, newSeason => {
      if (newSeason) {
        form.season = newSeason._id
      } else {
        form.season = ''
      }
    })
  }

  return {
    // State
    saving,
    currentStep,
    selectedRoomTab,
    allowEditCalculated,
    steps,
    dateRange,
    form,
    roomPrices,
    roomRestrictions,
    currency,

    // Computed - filtering
    filteredRoomTypes,
    filteredMealPlans,

    // Computed - relative pricing
    baseRoom,
    baseMealPlan,
    hasExplicitBaseRoom,
    isCurrentRoomBase,

    // Computed - room type info
    currentRoomType,
    currentRoomPricingType,
    currentRoomUsesMultipliers,
    currentRoomCombinations,
    maxChildrenForCurrentRoom,
    maxAdultsForCurrentRoom,
    minAdultsForCurrentRoom,
    adultsRangeForCurrentRoom,
    ageSettings,

    // Computed - dates & seasons
    allSeasonsMinDate,
    allSeasonsMaxDate,
    disabledDates,
    detectedSeason,
    calculateNights,

    // Computed - validation
    canProceed,
    allRoomsHavePrices,
    roomsMissingPrices,

    // Methods - helpers
    isBaseCell,
    isCalculatedCell,
    hasRoomPrices,
    getRoomTypeName,
    getMealPlanBg,
    formatDisplayDate,
    formatSeasonDates,
    formatCombinationKey,
    getEffectivePricingType,
    getEffectiveMinAdults,

    // Methods - actions
    initializeRoomData,
    updateSelectedRoomTab,
    updateRoomPricesForRoom,
    updateRoomRestrictionsForRoom,
    copyFirstPriceToAllMealPlans,
    copyCurrentRoomToAll,
    nextStep,
    handleSave,
    fetchLastRateAndSetDates,
    setupWatchers
  }
}
