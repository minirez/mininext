/**
 * Composable for Bulk Edit Modal business logic
 * Extracted from BulkEditModal.vue for better maintainability
 */
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useDate } from '@/composables/useDate'
import planningService from '@/services/planningService'

export function useBulkEditLogic(props, emit) {
  const { t, locale } = useI18n()
  const toast = useToast()
  const { formatDisplayDate } = useDate()

  // State
  const saving = ref(false)
  const activeTab = ref('price')
  const showPreview = ref(false)

  // Form state
  const form = reactive({
    // Price
    priceMode: 'set',
    priceValue: 0,
    updateExtras: false,
    extraAdult: 0,
    childOrderPricing: [],
    extraInfant: 0,
    // Inventory
    allotmentMode: 'set',
    allotmentValue: 10,
    minStay: 1,
    releaseDays: 0,
    // Restrictions
    stopSale: false,
    singleStop: false,
    closedToArrival: false,
    closedToDeparture: false
  })

  // Room tabs for per-room pricing
  const selectedRoomTab = ref(null)
  // Structure: { roomTypeId: { mealPlanId: { pricePerNight, extraAdult, extraInfant, singleSupplement, childOrderPricing: [] } } }
  const roomPrices = reactive({})
  const expandedMealPlans = reactive({})

  // Computed options
  const tabs = computed(() => [
    { key: 'price', label: t('planning.pricing.pricePerNight'), icon: 'payments' },
    { key: 'inventory', label: t('planning.pricing.allotment'), icon: 'inventory_2' },
    { key: 'restrictions', label: t('planning.pricing.restrictions'), icon: 'block' }
  ])

  const priceModes = computed(() => [
    { value: 'set', label: t('planning.pricing.setValue'), icon: 'edit' },
    { value: 'increase', label: t('planning.pricing.increaseBy'), icon: 'add_circle' },
    { value: 'decrease', label: t('planning.pricing.decreaseBy'), icon: 'remove_circle' },
    { value: 'percent_increase', label: t('planning.pricing.increasePercent'), icon: 'trending_up' },
    { value: 'percent_decrease', label: t('planning.pricing.decreasePercent'), icon: 'trending_down' }
  ])

  const allotmentModes = computed(() => [
    { value: 'set', label: t('planning.pricing.setValue'), icon: 'edit' },
    { value: 'increase', label: t('planning.pricing.increaseBy'), icon: 'add_circle' },
    { value: 'decrease', label: t('planning.pricing.decreaseBy'), icon: 'remove_circle' }
  ])

  // Unique selections
  const uniqueRoomTypes = computed(() => {
    const ids = [...new Set(props.selectedCells.map(c => c.roomTypeId))]
    return props.roomTypes.filter(rt => ids.includes(rt._id))
  })

  const uniqueMealPlans = computed(() => {
    const ids = [...new Set(props.selectedCells.map(c => c.mealPlanId))]
    return props.mealPlans.filter(mp => ids.includes(mp._id))
  })

  const currentRoomId = computed(() => {
    if (uniqueRoomTypes.value.length <= 1) return uniqueRoomTypes.value[0]?._id
    return selectedRoomTab.value || uniqueRoomTypes.value[0]?._id
  })

  // Get effective pricing type considering Market overrides
  const getEffectivePricingType = roomTypeId => {
    const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
    if (!roomType) return 'unit'

    const basePricingType = roomType.pricingType || 'unit'

    // Check Market override
    if (props.market?.pricingOverrides?.length > 0) {
      const override = props.market.pricingOverrides.find(po => {
        const rtId = typeof po.roomType === 'object' ? po.roomType._id : po.roomType
        return rtId === roomTypeId && po.usePricingTypeOverride
      })
      if (override) {
        return override.pricingType
      }
    }

    return basePricingType
  }

  // Current room's pricing type (considering Market override)
  const currentRoomPricingType = computed(() => {
    const roomId = currentRoomId.value
    if (!roomId) return 'unit'
    return getEffectivePricingType(roomId)
  })

  // Current room type object
  const currentRoomType = computed(() => {
    const roomId = currentRoomId.value
    if (!roomId) return null
    return props.roomTypes.find(r => r._id === roomId)
  })

  // Check if current room uses multiplier system
  const currentRoomUsesMultipliers = computed(() => {
    const rt = currentRoomType.value
    return currentRoomPricingType.value === 'per_person' && rt?.useMultipliers === true
  })

  // Get active combinations for multiplier OBP
  const currentRoomCombinations = computed(() => {
    const rt = currentRoomType.value
    const table = rt?.multiplierTemplate?.combinationTable || []
    return table.filter(c => c.isActive !== false)
  })

  // Current room name for display
  const currentRoomTypeName = computed(() => {
    const roomId = currentRoomId.value
    if (!roomId) return ''
    const rt = props.roomTypes.find(r => r._id === roomId)
    return getRoomTypeName(rt)
  })

  // Get max children for current room type
  const currentRoomMaxChildren = computed(() => {
    const roomId = currentRoomId.value
    if (!roomId) return 0
    const roomType = props.roomTypes.find(rt => rt._id === roomId)
    return roomType?.occupancy?.maxChildren ?? 2
  })

  const currency = computed(() => props.market?.currency || 'EUR')

  // Get child age groups from market
  const marketChildAgeGroups = computed(() => {
    const market = props.market
    if (
      market?.childAgeSettings?.inheritFromHotel === false &&
      market?.childAgeSettings?.childAgeGroups?.length
    ) {
      return market.childAgeSettings.childAgeGroups
    }
    return []
  })

  // Age ranges from market's childAgeGroups (with defaults)
  const childAgeRange = computed(() => {
    const groups = marketChildAgeGroups.value
    const childGroups = groups.filter(g => g.code !== 'infant')
    if (childGroups.length > 0) {
      const firstChild = childGroups[0]
      const lastChild = childGroups[childGroups.length - 1]
      return { min: firstChild.minAge, max: lastChild.maxAge }
    }
    return { min: 3, max: 12 }
  })

  const infantAgeRange = computed(() => {
    const groups = marketChildAgeGroups.value
    const infant = groups.find(g => g.code === 'infant')
    if (infant) {
      return { min: infant.minAge, max: infant.maxAge }
    }
    return { min: 0, max: 2 }
  })

  const childAgeLabel = computed(
    () =>
      `(${childAgeRange.value.min}-${childAgeRange.value.max} ${t('planning.markets.yearsShort')})`
  )
  const infantAgeLabel = computed(
    () =>
      `(${infantAgeRange.value.min}-${infantAgeRange.value.max} ${t('planning.markets.yearsShort')})`
  )

  const dateRangeSummary = computed(() => {
    if (props.selectedCells.length === 0) return ''

    const dates = props.selectedCells.map(c => c.date).sort()
    const first = dates[0]
    const last = dates[dates.length - 1]
    const dayCount = [...new Set(dates)].length

    if (first === last) {
      return formatDisplayDate(first)
    }

    return `${formatDisplayDate(first)} - ${formatDisplayDate(last)} (${dayCount} ${locale.value === 'tr' ? 'gün' : 'days'})`
  })

  // Allotment mode label
  const allotmentModeLabel = computed(() => {
    const labels = {
      set: t('planning.pricing.setTo'),
      increase: t('planning.pricing.increaseBy'),
      decrease: t('planning.pricing.decreaseBy')
    }
    return labels[form.allotmentMode] || ''
  })

  // Preview summary computed
  const previewSummary = computed(() => {
    const uniqueDates = [...new Set(props.selectedCells.map(c => c.date))]
    return {
      totalCells: props.selectedCells.length,
      roomTypes: uniqueRoomTypes.value.length,
      mealPlans: uniqueMealPlans.value.length,
      days: uniqueDates.length
    }
  })

  // Helper functions
  const isValueSet = val => val !== '' && val !== null && val !== undefined

  const getRoomTypeName = rt => {
    if (!rt) return ''
    return rt.name?.[locale.value] || rt.name?.en || rt.name?.tr || ''
  }

  const getMealPlanName = mp => {
    if (!mp) return ''
    return mp.name?.[locale.value] || mp.name?.en || mp.name?.tr || ''
  }

  const getMealPlanColor = code => {
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

  // Format combination key with age ranges
  const formatCombinationKey = combo => {
    const adults = combo.adults
    const children = combo.children || []

    if (children.length === 0) {
      return `${adults}`
    }

    const ageGroups = props.childAgeGroups || []

    const getAgeRange = ageGroupCode => {
      const group = ageGroups.find(g => g.code === ageGroupCode)
      if (group) {
        return `${group.minAge}-${group.maxAge}`
      }
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

  const hasRoomPrice = roomTypeId => {
    const prices = roomPrices[roomTypeId]
    if (!prices) return false
    const pricingType = getEffectivePricingType(roomTypeId)
    const roomType = props.roomTypes.find(r => r._id === roomTypeId)
    const usesMultipliers = pricingType === 'per_person' && roomType?.useMultipliers === true

    return Object.values(prices).some(p => {
      if (pricingType === 'per_person' && usesMultipliers) {
        return p?.pricePerNight > 0
      }
      if (pricingType === 'per_person') {
        return p?.occupancyPricing?.[1] > 0 || p?.occupancyPricing?.[2] > 0
      }
      return p?.pricePerNight > 0
    })
  }

  // Initialize roomPrices when modal opens
  const initRoomPrices = () => {
    for (const rt of uniqueRoomTypes.value) {
      if (!roomPrices[rt._id]) {
        roomPrices[rt._id] = {}
      }
      const maxChildren = rt.occupancy?.maxChildren ?? 2
      const maxAdults = rt.occupancy?.maxAdults ?? 4
      const pricingType = getEffectivePricingType(rt._id)

      for (const mp of uniqueMealPlans.value) {
        if (!roomPrices[rt._id][mp._id]) {
          const occupancyPricing = {}
          for (let i = 1; i <= maxAdults; i++) {
            occupancyPricing[i] = ''
          }

          roomPrices[rt._id][mp._id] = {
            pricingType,
            pricePerNight: '',
            extraAdult: '',
            extraInfant: '',
            singleSupplement: '',
            childOrderPricing: Array(maxChildren).fill(''),
            occupancyPricing
          }
        }
      }
    }
    if (uniqueRoomTypes.value.length > 0 && !selectedRoomTab.value) {
      selectedRoomTab.value = uniqueRoomTypes.value[0]._id
    }
  }

  // Copy functions
  const copyFirstMealPlanToAll = () => {
    const currentRoom = currentRoomId.value
    if (!currentRoom || !roomPrices[currentRoom]) return

    const mealPlans = uniqueMealPlans.value
    if (mealPlans.length < 2) return

    const firstMp = mealPlans[0]._id
    const firstData = roomPrices[currentRoom][firstMp]
    if (!firstData) return

    for (const mp of mealPlans) {
      if (mp._id !== firstMp) {
        roomPrices[currentRoom][mp._id] = {
          pricingType: firstData.pricingType || 'unit',
          pricePerNight: firstData.pricePerNight || '',
          extraAdult: firstData.extraAdult || '',
          extraInfant: firstData.extraInfant || '',
          singleSupplement: firstData.singleSupplement || '',
          childOrderPricing: [...(firstData.childOrderPricing || [])],
          occupancyPricing: { ...(firstData.occupancyPricing || {}) }
        }
      }
    }
  }

  const copyCurrentRoomToAll = () => {
    const currentRoom = currentRoomId.value
    if (!currentRoom || !roomPrices[currentRoom]) return

    for (const rt of uniqueRoomTypes.value) {
      if (rt._id !== currentRoom) {
        if (!roomPrices[rt._id]) {
          roomPrices[rt._id] = {}
        }
        const targetPricingType = getEffectivePricingType(rt._id)

        for (const mp of uniqueMealPlans.value) {
          const srcData = roomPrices[currentRoom][mp._id]
          roomPrices[rt._id][mp._id] = {
            pricingType: targetPricingType,
            pricePerNight: srcData?.pricePerNight || '',
            extraAdult: srcData?.extraAdult || '',
            extraInfant: srcData?.extraInfant || '',
            singleSupplement: srcData?.singleSupplement || '',
            childOrderPricing: [...(srcData?.childOrderPricing || [])],
            occupancyPricing: { ...(srcData?.occupancyPricing || {}) }
          }
        }
      }
    }
  }

  const calculateAllotmentValue = currentValue => {
    const value = form.allotmentValue || 0

    switch (form.allotmentMode) {
      case 'set':
        return value
      case 'increase':
        return currentValue + value
      case 'decrease':
        return Math.max(0, currentValue - value)
      default:
        return value
    }
  }

  // Preview changes computed
  const previewChanges = computed(() => {
    const changes = {
      prices: [],
      inventory: null,
      restrictions: null
    }

    if (activeTab.value === 'price') {
      for (const rtId of Object.keys(roomPrices)) {
        const roomType = props.roomTypes.find(rt => rt._id === rtId)
        const pricingType = getEffectivePricingType(rtId)

        for (const mpId of Object.keys(roomPrices[rtId] || {})) {
          const mealPlan = props.mealPlans.find(mp => mp._id === mpId)
          const priceData = roomPrices[rtId][mpId]

          let hasValues = false
          const change = {
            roomCode: roomType?.code || rtId.slice(-6),
            mealPlanCode: mealPlan?.code || mpId.slice(-6),
            pricingType,
            pricePerNight: null,
            extraAdult: null,
            singleSupplement: null,
            occupancyPricing: {},
            childPrices: [],
            extraInfant: null
          }

          if (pricingType === 'per_person') {
            // Check if this room uses multipliers (multiplier-based OBP)
            const usesMultipliers = roomType?.useMultipliers === true
            if (usesMultipliers) {
              // Multiplier OBP uses pricePerNight as base price
              if (isValueSet(priceData?.pricePerNight)) {
                change.pricePerNight = Number(priceData.pricePerNight)
                hasValues = true
              }
            } else {
              // Standard OBP uses occupancyPricing
              for (const [pax, price] of Object.entries(priceData?.occupancyPricing || {})) {
                if (isValueSet(price)) {
                  change.occupancyPricing[pax] = Number(price)
                  hasValues = true
                }
              }
            }
          } else {
            if (isValueSet(priceData?.pricePerNight)) {
              change.pricePerNight = Number(priceData.pricePerNight)
              hasValues = true
            }
            if (isValueSet(priceData?.extraAdult)) {
              change.extraAdult = Number(priceData.extraAdult)
              hasValues = true
            }
            if (isValueSet(priceData?.singleSupplement)) {
              change.singleSupplement = Number(priceData.singleSupplement)
              hasValues = true
            }
          }

          if (priceData?.childOrderPricing?.some(p => isValueSet(p))) {
            change.childPrices = priceData.childOrderPricing
              .filter(p => isValueSet(p))
              .map(p => Number(p))
            hasValues = true
          }

          if (isValueSet(priceData?.extraInfant)) {
            change.extraInfant = Number(priceData.extraInfant)
            hasValues = true
          }

          if (hasValues) {
            changes.prices.push(change)
          }
        }
      }
    }

    return changes
  })

  // Has any changes
  const hasAnyChanges = computed(() => {
    if (activeTab.value === 'price') {
      return previewChanges.value.prices.length > 0
    }
    if (activeTab.value === 'inventory') {
      return form.allotmentValue > 0 || form.minStay > 1 || form.releaseDays > 0
    }
    if (activeTab.value === 'restrictions') {
      return form.stopSale || form.singleStop || form.closedToArrival || form.closedToDeparture
    }
    return false
  })

  // Close modal
  const close = () => {
    emit('update:modelValue', false)
  }

  // Show preview panel
  const showPreviewPanel = () => {
    showPreview.value = true
  }

  // Save function
  const save = async () => {
    saving.value = true

    try {
      const updateFields = {}

      // Restrictions tab
      if (activeTab.value === 'restrictions') {
        updateFields.stopSale = form.stopSale
        updateFields.singleStop = form.singleStop
        updateFields.closedToArrival = form.closedToArrival
        updateFields.closedToDeparture = form.closedToDeparture
      }

      // Inventory tab
      if (activeTab.value === 'inventory') {
        updateFields.allotment = calculateAllotmentValue(0)
        updateFields.minStay = form.minStay
        updateFields.releaseDays = form.releaseDays
      }

      // Price tab - per-room + per-mealplan pricing
      if (activeTab.value === 'price') {
        let hasAnyPrice = false
        const roomKeys = Object.keys(roomPrices)

        for (const rtId of roomKeys) {
          const pricingType = getEffectivePricingType(rtId)
          const mpKeys = Object.keys(roomPrices[rtId] || {})
          const roomType = props.roomTypes.find(r => r._id === rtId)
          const usesMultipliers = pricingType === 'per_person' && roomType?.useMultipliers === true

          for (const mpId of mpKeys) {
            const priceData = roomPrices[rtId][mpId]

            if (pricingType === 'per_person' && usesMultipliers) {
              if (isValueSet(priceData?.pricePerNight)) {
                hasAnyPrice = true
                break
              }
            } else if (pricingType === 'per_person') {
              const hasOccupancyPrice = Object.values(priceData?.occupancyPricing || {}).some(p =>
                isValueSet(p)
              )
              if (hasOccupancyPrice) {
                hasAnyPrice = true
                break
              }
              const hasExtraInfant = isValueSet(priceData?.extraInfant)
              const hasChildPricing = priceData?.childOrderPricing?.some(p => isValueSet(p))
              if (hasExtraInfant || hasChildPricing) {
                hasAnyPrice = true
                break
              }
            } else {
              const hasBasePrice = isValueSet(priceData?.pricePerNight)
              const hasExtraAdult = isValueSet(priceData?.extraAdult)
              const hasSingleSupplement = isValueSet(priceData?.singleSupplement)
              if (hasBasePrice || hasExtraAdult || hasSingleSupplement) {
                hasAnyPrice = true
                break
              }
              const hasExtraInfant = isValueSet(priceData?.extraInfant)
              const hasChildPricing = priceData?.childOrderPricing?.some(p => isValueSet(p))
              if (hasExtraInfant || hasChildPricing) {
                hasAnyPrice = true
                break
              }
            }
          }
          if (hasAnyPrice) break
        }

        if (hasAnyPrice) {
          const uniqueDates = [...new Set(props.selectedCells.map(c => c.date))].sort()
          let totalUpdates = 0

          for (const rtId of Object.keys(roomPrices)) {
            const pricingType = getEffectivePricingType(rtId)

            for (const mpId of Object.keys(roomPrices[rtId])) {
              const priceData = roomPrices[rtId][mpId]

              let hasValues = false
              const roomType = props.roomTypes.find(r => r._id === rtId)
              const usesMultipliers =
                pricingType === 'per_person' && roomType?.useMultipliers === true

              if (pricingType === 'per_person' && usesMultipliers) {
                hasValues = isValueSet(priceData?.pricePerNight)
              } else if (pricingType === 'per_person') {
                hasValues = Object.values(priceData?.occupancyPricing || {}).some(p =>
                  isValueSet(p)
                )
                hasValues =
                  hasValues ||
                  isValueSet(priceData?.extraInfant) ||
                  priceData?.childOrderPricing?.some(p => isValueSet(p))
              } else {
                hasValues =
                  isValueSet(priceData?.pricePerNight) ||
                  isValueSet(priceData?.extraAdult) ||
                  isValueSet(priceData?.singleSupplement)
                hasValues =
                  hasValues ||
                  isValueSet(priceData?.extraInfant) ||
                  priceData?.childOrderPricing?.some(p => isValueSet(p))
              }

              if (hasValues) {
                const cells = uniqueDates.map(date => ({
                  date,
                  roomTypeId: rtId,
                  mealPlanId: mpId
                }))

                const priceUpdateFields = {
                  pricingType
                }

                if (pricingType === 'per_person' && usesMultipliers) {
                  if (isValueSet(priceData.pricePerNight)) {
                    priceUpdateFields.pricePerNight = Number(priceData.pricePerNight)
                  }
                  priceUpdateFields.occupancyPricing = {}
                  priceUpdateFields.childOrderPricing = []
                  priceUpdateFields.extraInfant = 0
                  priceUpdateFields.extraAdult = 0
                  priceUpdateFields.singleSupplement = 0
                } else if (pricingType === 'per_person') {
                  const occupancyPricing = {}
                  for (const [pax, price] of Object.entries(priceData.occupancyPricing || {})) {
                    if (isValueSet(price)) {
                      occupancyPricing[pax] = Number(price)
                    }
                  }
                  if (Object.keys(occupancyPricing).length > 0) {
                    priceUpdateFields.occupancyPricing = occupancyPricing
                  }
                  priceUpdateFields.pricePerNight = 0
                  priceUpdateFields.extraAdult = 0
                  priceUpdateFields.singleSupplement = 0

                  if (isValueSet(priceData.extraInfant)) {
                    priceUpdateFields.extraInfant = Number(priceData.extraInfant)
                  }
                  if (priceData.childOrderPricing?.some(p => isValueSet(p))) {
                    priceUpdateFields.childOrderPricing = priceData.childOrderPricing.map(p =>
                      isValueSet(p) ? Number(p) : null
                    )
                  }
                } else {
                  if (isValueSet(priceData.pricePerNight)) {
                    priceUpdateFields.pricePerNight = Number(priceData.pricePerNight)
                  }
                  if (isValueSet(priceData.extraAdult)) {
                    priceUpdateFields.extraAdult = Number(priceData.extraAdult)
                  }
                  if (isValueSet(priceData.singleSupplement)) {
                    priceUpdateFields.singleSupplement = Number(priceData.singleSupplement)
                  }

                  if (isValueSet(priceData.extraInfant)) {
                    priceUpdateFields.extraInfant = Number(priceData.extraInfant)
                  }
                  if (priceData.childOrderPricing?.some(p => isValueSet(p))) {
                    priceUpdateFields.childOrderPricing = priceData.childOrderPricing.map(p =>
                      isValueSet(p) ? Number(p) : null
                    )
                  }
                }

                try {
                  const result = await planningService.bulkUpdateByDates(
                    props.hotelId,
                    cells,
                    priceUpdateFields,
                    props.market?._id
                  )
                  totalUpdates +=
                    (result?.data?.created || 0) +
                    (result?.data?.updated || 0) +
                    (result?.data?.split || 0)
                } catch (err) {
                  console.error(
                    'API error for RT/MP:',
                    rtId.slice(-6),
                    mpId.slice(-6),
                    err.message || err
                  )
                  toast.error(`Error: ${err.message || 'Unknown error'}`)
                }
              }
            }
          }

          if (totalUpdates > 0) {
            toast.success(t('planning.pricing.bulkUpdateSuccess') + ` (${totalUpdates})`)
            emit('saved')
            close()
            return
          }
        }
      }

      // For restrictions and inventory tabs
      if (activeTab.value !== 'price') {
        const result = await planningService.bulkUpdateByDates(
          props.hotelId,
          props.selectedCells,
          updateFields,
          props.market?._id
        )
        const count =
          (result?.data?.created || 0) + (result?.data?.updated || 0) + (result?.data?.split || 0)
        toast.success(t('planning.pricing.bulkUpdateSuccess') + ` (${count})`)
        emit('saved')
        close()
        return
      }

      // Fallback - no valid updates
      toast.warning(t('planning.pricing.noChangesToApply'))
    } catch (error) {
      console.error('Bulk edit error:', error)
      toast.error(error.response?.data?.message || t('common.operationFailed'))
    } finally {
      saving.value = false
    }
  }

  // Confirm and save
  const confirmSave = async () => {
    await save()
  }

  // Reset form
  const resetForm = () => {
    activeTab.value = 'price'
    showPreview.value = false
    form.priceMode = 'set'
    form.priceValue = 0
    form.updateExtras = false
    form.extraAdult = 0
    form.childOrderPricing = []
    form.extraInfant = 0
    form.allotmentMode = 'set'
    form.allotmentValue = 10
    form.minStay = 1
    form.releaseDays = 0
    form.stopSale = false
    form.singleStop = false
    form.closedToArrival = false
    form.closedToDeparture = false

    selectedRoomTab.value = null
    for (const key of Object.keys(roomPrices)) {
      delete roomPrices[key]
    }
    for (const key of Object.keys(expandedMealPlans)) {
      delete expandedMealPlans[key]
    }

    nextTick(() => {
      initRoomPrices()
    })
  }

  // Watch for modal open
  watch(
    () => props.modelValue,
    val => {
      if (val) {
        resetForm()
      }
    }
  )

  return {
    // State
    saving,
    activeTab,
    showPreview,
    form,
    selectedRoomTab,
    roomPrices,
    expandedMealPlans,

    // Computed options
    tabs,
    priceModes,
    allotmentModes,

    // Computed selections
    uniqueRoomTypes,
    uniqueMealPlans,
    currentRoomId,
    currentRoomType,
    currentRoomTypeName,
    currentRoomPricingType,
    currentRoomUsesMultipliers,
    currentRoomCombinations,
    currentRoomMaxChildren,

    // Computed values
    currency,
    childAgeLabel,
    infantAgeLabel,
    dateRangeSummary,
    allotmentModeLabel,
    previewSummary,
    previewChanges,
    hasAnyChanges,

    // Helper functions
    isValueSet,
    getRoomTypeName,
    getMealPlanName,
    getMealPlanColor,
    formatCombinationKey,
    hasRoomPrice,
    getEffectivePricingType,

    // Action functions
    initRoomPrices,
    copyFirstMealPlanToAll,
    copyCurrentRoomToAll,
    calculateAllotmentValue,
    close,
    showPreviewPanel,
    save,
    confirmSave,
    resetForm
  }
}
