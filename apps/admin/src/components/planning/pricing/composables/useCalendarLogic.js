import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'

/**
 * Composable for MonthlyCalendar logic
 * Handles date calculations, selection, inline editing, copy/paste, and keyboard shortcuts
 */
export function useCalendarLogic(props, emit) {
  const { t, locale } = useI18n()
  const toast = useToast()

  // ============================================
  // Date Helpers
  // ============================================

  const formatDateToString = date => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const parseDateString = dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // ============================================
  // State
  // ============================================

  // Current month/year
  const getInitialDate = () => {
    if (props.initialMonth?.year && props.initialMonth?.month) {
      return new Date(props.initialMonth.year, props.initialMonth.month - 1, 1)
    }
    return new Date()
  }

  const currentDate = ref(getInitialDate())
  const selectedCells = ref([])
  const copiedWeek = ref(null)

  // Inline edit mode
  const inlineEditMode = ref(false)
  const inlineEditPrices = reactive({})
  const inlineRelativePricing = ref(true)
  const inlineAllowEditCalculated = ref(false)

  // Allotment monitoring
  const showAllotmentModal = ref(false)
  const highlightedAllotmentLevel = ref(null)

  // ============================================
  // Computed Properties
  // ============================================

  const currency = computed(() => props.market?.currency || 'EUR')

  const filteredMealPlans = computed(() => {
    return props.mealPlans.filter(mp => mp.status === 'active')
  })

  const baseRoom = computed(() => props.roomTypes.find(rt => rt.isBaseRoom) || null)

  const baseMealPlan = computed(() => {
    const found = props.mealPlans.find(mp => mp.isBaseMealPlan)
    if (found) return found
    return baseRoom.value ? props.mealPlans[0] : null
  })

  const hasBaseRoom = computed(() => props.roomTypes.some(rt => rt.isBaseRoom === true))

  const monthYearLabel = computed(() => {
    const months =
      locale.value === 'tr'
        ? [
            'Ocak',
            'Subat',
            'Mart',
            'Nisan',
            'Mayis',
            'Haziran',
            'Temmuz',
            'Agustos',
            'Eylul',
            'Ekim',
            'Kasim',
            'Aralik'
          ]
        : [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
          ]

    return `${months[currentDate.value.getMonth()]} ${currentDate.value.getFullYear()}`
  })

  const daysInMonth = computed(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    return new Date(year, month + 1, 0).getDate()
  })

  const calendarDays = computed(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekdaysShort =
      locale.value === 'tr'
        ? ['Paz', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 1; i <= daysInMonth.value; i++) {
      const date = new Date(year, month, i)
      const dayOfWeek = date.getDay()

      days.push({
        date: formatDateToString(date),
        dayNumber: i,
        weekday: weekdaysShort[dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today
      })
    }

    return days
  })

  const getSelectionDateRange = computed(() => {
    if (selectedCells.value.length === 0) return ''

    const dates = selectedCells.value.map(c => c.date).sort()
    const first = dates[0]
    const last = dates[dates.length - 1]

    const formatDateStr = dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US')
    }

    if (first === last) {
      return formatDateStr(first)
    }

    return `${formatDateStr(first)} - ${formatDateStr(last)}`
  })

  // Helper: get available rooms for a rate considering occupancy
  const getAvailableRooms = (rateInfo, roomTypeId, date) => {
    const total = rateInfo?.allotment ?? 0
    const key = `${date}_${roomTypeId}`
    const booked = props.occupancy?.[key] || 0
    return Math.max(0, total - booked)
  }

  // Allotment stats (occupancy-aware)
  const allotmentStats = computed(() => {
    const stats = { critical: 0, low: 0, normal: 0, stopSale: 0, totalCells: 0 }

    for (const rt of props.roomTypes) {
      for (const mp of filteredMealPlans.value) {
        for (let day = 1; day <= daysInMonth.value; day++) {
          const date = formatDateKey(
            currentDate.value.getFullYear(),
            currentDate.value.getMonth() + 1,
            day
          )
          const rateInfo = getRateForCell(rt._id, mp._id, date)

          if (rateInfo) {
            stats.totalCells++
            const available = getAvailableRooms(rateInfo, rt._id, date)

            if (rateInfo.stopSale) {
              stats.stopSale++
            } else if (available === 0) {
              stats.critical++
            } else if (available <= 3) {
              stats.low++
            } else {
              stats.normal++
            }
          }
        }
      }
    }

    return stats
  })

  const allotmentDetails = computed(() => {
    const details = []

    for (const rt of props.roomTypes) {
      for (const mp of filteredMealPlans.value) {
        const detail = {
          key: `${rt._id}-${mp._id}`,
          roomCode: rt.code,
          mealPlanCode: mp.code,
          critical: 0,
          low: 0,
          stopSale: 0
        }

        for (let day = 1; day <= daysInMonth.value; day++) {
          const date = formatDateKey(
            currentDate.value.getFullYear(),
            currentDate.value.getMonth() + 1,
            day
          )
          const rateInfo = getRateForCell(rt._id, mp._id, date)

          if (rateInfo) {
            const available = getAvailableRooms(rateInfo, rt._id, date)
            if (rateInfo.stopSale) {
              detail.stopSale++
            } else if (available === 0) {
              detail.critical++
            } else if (available <= 3) {
              detail.low++
            }
          }
        }

        if (detail.critical > 0 || detail.low > 0 || detail.stopSale > 0) {
          details.push(detail)
        }
      }
    }

    return details.sort(
      (a, b) => b.critical + b.low + b.stopSale - (a.critical + a.low + a.stopSale)
    )
  })

  // ============================================
  // Methods
  // ============================================

  const getRateForCell = (roomTypeId, mealPlanId, dateStr) => {
    return (
      props.rates.find(rate => {
        const rtId = rate.roomType?._id || rate.roomType
        const mpId = rate.mealPlan?._id || rate.mealPlan

        if (rtId !== roomTypeId || mpId !== mealPlanId) return false

        const rateDateStr = rate.date?.substring?.(0, 10) || ''
        return rateDateStr === dateStr
      }) || null
    )
  }

  const isBaseCellFn = (roomTypeId, mealPlanId) => {
    if (!hasBaseRoom.value || !inlineRelativePricing.value) return false
    return baseRoom.value._id === roomTypeId && baseMealPlan.value?._id === mealPlanId
  }

  const isCalculatedCell = (roomTypeId, mealPlanId) => {
    if (!hasBaseRoom.value || !inlineRelativePricing.value) return false
    return !isBaseCellFn(roomTypeId, mealPlanId)
  }

  // Navigation
  const previousMonth = () => {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() - 1)
    currentDate.value = newDate
    emit('refresh', { year: newDate.getFullYear(), month: newDate.getMonth() + 1 })
  }

  const nextMonth = () => {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() + 1)
    currentDate.value = newDate
    emit('refresh', { year: newDate.getFullYear(), month: newDate.getMonth() + 1 })
  }

  const goToToday = () => {
    currentDate.value = new Date()
    emit('refresh', {
      year: currentDate.value.getFullYear(),
      month: currentDate.value.getMonth() + 1
    })
  }

  // Selection
  const clearSelection = () => {
    selectedCells.value = []
  }

  const selectRange = (start, end) => {
    const startDate = parseDateString(start.date)
    const endDate = parseDateString(end.date)
    const minDate = startDate < endDate ? startDate : endDate
    const maxDate = startDate > endDate ? startDate : endDate

    const newSelection = []

    if (start.roomTypeId === end.roomTypeId && start.mealPlanId === end.mealPlanId) {
      const current = new Date(minDate)
      while (current <= maxDate) {
        const dateStr = formatDateToString(current)
        const rate = getRateForCell(start.roomTypeId, start.mealPlanId, dateStr)
        newSelection.push({
          roomTypeId: start.roomTypeId,
          mealPlanId: start.mealPlanId,
          date: dateStr,
          rateId: rate?._id || null
        })
        current.setDate(current.getDate() + 1)
      }
    }

    selectedCells.value = newSelection
  }

  const highlightAllotmentLevel = level => {
    highlightedAllotmentLevel.value = highlightedAllotmentLevel.value === level ? null : level

    if (highlightedAllotmentLevel.value) {
      const cells = []
      for (const rt of props.roomTypes) {
        for (const mp of filteredMealPlans.value) {
          for (let day = 1; day <= daysInMonth.value; day++) {
            const date = formatDateKey(
              currentDate.value.getFullYear(),
              currentDate.value.getMonth() + 1,
              day
            )
            const rateInfo = getRateForCell(rt._id, mp._id, date)

            if (rateInfo) {
              const available = getAvailableRooms(rateInfo, rt._id, date)
              let matches = false
              if (level === 'critical' && !rateInfo.stopSale && available === 0) matches = true
              if (level === 'low' && !rateInfo.stopSale && available > 0 && available <= 3)
                matches = true
              if (level === 'stopSale' && rateInfo.stopSale) matches = true

              if (matches) {
                cells.push({ roomTypeId: rt._id, mealPlanId: mp._id, date })
              }
            }
          }
        }
      }
      selectedCells.value = cells
      emit('selection-change', cells)
      if (cells.length > 0) {
        toast.info(t('planning.pricing.cellsSelected', { count: cells.length }))
      }
    } else {
      selectedCells.value = []
      emit('selection-change', [])
    }
  }

  // Copy/Paste
  const copyWeek = () => {
    if (selectedCells.value.length === 0) {
      toast.warning(t('planning.pricing.selectCellsToCopy'))
      return
    }

    const dates = [...new Set(selectedCells.value.map(c => c.date))].sort()
    const combinations = []
    const seen = new Set()

    for (const cell of selectedCells.value) {
      const key = `${cell.roomTypeId}-${cell.mealPlanId}`
      if (!seen.has(key)) {
        seen.add(key)
        combinations.push({ roomTypeId: cell.roomTypeId, mealPlanId: cell.mealPlanId })
      }
    }

    const rateData = []
    for (const combo of combinations) {
      for (const date of dates) {
        const rate = getRateForCell(combo.roomTypeId, combo.mealPlanId, date)
        if (rate) {
          rateData.push({
            dayOffset: dates.indexOf(date),
            roomTypeId: combo.roomTypeId,
            mealPlanId: combo.mealPlanId,
            pricePerNight: rate.pricePerNight,
            allotment: rate.allotment,
            minStay: rate.minStay,
            stopSale: rate.stopSale,
            singleStop: rate.singleStop,
            closedToArrival: rate.closedToArrival,
            closedToDeparture: rate.closedToDeparture
          })
        }
      }
    }

    copiedWeek.value = {
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      duration: dates.length,
      combinations,
      rateData
    }

    toast.success(t('planning.pricing.weekCopied'))
  }

  const pasteWeek = async () => {
    if (!copiedWeek.value) {
      toast.warning(t('planning.pricing.noWeekToPaste'))
      return
    }

    if (selectedCells.value.length === 0) {
      toast.warning(t('planning.pricing.selectTargetCell'))
      return
    }

    const targetCells = [...selectedCells.value].sort((a, b) => a.date.localeCompare(b.date))
    const targetStartDate = parseDateString(targetCells[0].date)

    try {
      for (const rateInfo of copiedWeek.value.rateData) {
        const targetDate = new Date(targetStartDate)
        targetDate.setDate(targetDate.getDate() + rateInfo.dayOffset)
        const targetDateStr = formatDateToString(targetDate)

        const existingRate = getRateForCell(rateInfo.roomTypeId, rateInfo.mealPlanId, targetDateStr)

        const rateData = {
          pricePerNight: rateInfo.pricePerNight,
          allotment: rateInfo.allotment,
          minStay: rateInfo.minStay,
          stopSale: rateInfo.stopSale,
          singleStop: rateInfo.singleStop,
          closedToArrival: rateInfo.closedToArrival,
          closedToDeparture: rateInfo.closedToDeparture
        }

        if (existingRate?._id) {
          await planningService.quickUpdateRate(props.hotelId, existingRate._id, rateData)
        } else {
          await planningService.createRate(props.hotelId, {
            ...rateData,
            roomType: rateInfo.roomTypeId,
            mealPlan: rateInfo.mealPlanId,
            market: props.market?._id,
            startDate: targetDateStr,
            endDate: targetDateStr,
            currency: currency.value
          })
        }
      }

      toast.success(t('planning.pricing.weekPasted'))
      emit('refresh')
      clearSelection()
    } catch (error) {
      console.error('Paste week error:', error)
      toast.error(t('common.operationFailed'))
    }
  }

  // Quick actions
  const quickAction = async (field, value) => {
    if (selectedCells.value.length === 0) return

    try {
      for (const cell of selectedCells.value) {
        const rate = getRateForCell(cell.roomTypeId, cell.mealPlanId, cell.date)
        if (rate) {
          await planningService.quickUpdateRate(props.hotelId, rate._id, { [field]: value })
        }
      }

      toast.success(t('planning.pricing.quickUpdateSuccess'))
      emit('refresh')
      clearSelection()
    } catch {
      toast.error(t('common.operationFailed'))
    }
  }

  // Inline edit mode
  const toggleInlineEditMode = () => {
    if (inlineEditMode.value) {
      saveInlineEditPrices()
    } else {
      populateInlineEditPrices()
    }
    inlineEditMode.value = !inlineEditMode.value
  }

  const populateInlineEditPrices = () => {
    Object.keys(inlineEditPrices).forEach(key => delete inlineEditPrices[key])

    for (const roomType of props.roomTypes) {
      for (const mealPlan of filteredMealPlans.value) {
        for (const day of calendarDays.value) {
          const rate = getRateForCell(roomType._id, mealPlan._id, day.date)
          const key = `${roomType._id}-${mealPlan._id}-${day.date}`
          inlineEditPrices[key] = rate?.pricePerNight || ''
        }
      }
    }
  }

  const getInlineEditPrice = (roomTypeId, mealPlanId, date) => {
    const key = `${roomTypeId}-${mealPlanId}-${date}`
    return inlineEditPrices[key]
  }

  const setInlineEditPrice = (roomTypeId, mealPlanId, date, value) => {
    const key = `${roomTypeId}-${mealPlanId}-${date}`
    inlineEditPrices[key] = value
  }

  const handleInlineChange = (roomTypeId, mealPlanId, date, value) => {
    setInlineEditPrice(roomTypeId, mealPlanId, date, value)

    if (inlineRelativePricing.value && hasBaseRoom.value && isBaseCellFn(roomTypeId, mealPlanId)) {
      const basePrice = parseFloat(value) || 0
      if (basePrice <= 0) return

      props.roomTypes.forEach(room => {
        props.mealPlans.forEach(meal => {
          if (isBaseCellFn(room._id, meal._id)) return

          const roomAdj = room.priceAdjustment || 0
          const mealAdj = meal.priceAdjustment || 0

          const afterRoom = basePrice * (1 + roomAdj / 100)
          const afterMeal = afterRoom * (1 + mealAdj / 100)
          const calculatedPrice = Math.round(afterMeal * 100) / 100

          const key = `${room._id}-${meal._id}-${date}`
          inlineEditPrices[key] = calculatedPrice
        })
      })
    }
  }

  const saveInlineEditPrices = async () => {
    const updates = []

    for (const [key, price] of Object.entries(inlineEditPrices)) {
      if (price === '' || price === null || price === undefined) continue

      const parts = key.split('-')
      const rtId = parts[0]
      const mpId = parts[1]
      const dateStr = parts.slice(2).join('-')

      const existingRate = getRateForCell(rtId, mpId, dateStr)
      const numPrice = Number(price)

      if (isNaN(numPrice) || numPrice < 0) continue

      if (existingRate) {
        if (existingRate.pricePerNight !== numPrice) {
          updates.push({
            type: 'update',
            rateId: existingRate._id,
            data: { pricePerNight: numPrice }
          })
        }
      } else if (numPrice > 0) {
        updates.push({
          type: 'create',
          data: {
            roomType: rtId,
            mealPlan: mpId,
            market: props.market?._id,
            startDate: dateStr,
            endDate: dateStr,
            pricePerNight: numPrice,
            currency: currency.value
          }
        })
      }
    }

    if (updates.length === 0) {
      return
    }

    try {
      for (const update of updates) {
        if (update.type === 'update') {
          await planningService.quickUpdateRate(props.hotelId, update.rateId, update.data)
        } else {
          await planningService.createRate(props.hotelId, update.data)
        }
      }
      toast.success(t('planning.pricing.inlineEditSaved', { count: updates.length }))
      emit('refresh')
    } catch {
      toast.error(t('common.operationFailed'))
    }
  }

  const cancelInlineEdit = () => {
    inlineEditMode.value = false
    Object.keys(inlineEditPrices).forEach(key => delete inlineEditPrices[key])
  }

  // Watch for month changes
  watch(currentDate, () => {
    clearSelection()
  })

  // Watch for selection changes
  watch(
    () => [...selectedCells.value],
    newVal => {
      emit('selection-change', newVal)
    }
  )

  return {
    // State
    currentDate,
    selectedCells,
    copiedWeek,
    inlineEditMode,
    inlineEditPrices,
    inlineRelativePricing,
    inlineAllowEditCalculated,
    showAllotmentModal,
    highlightedAllotmentLevel,

    // Computed
    currency,
    filteredMealPlans,
    baseRoom,
    baseMealPlan,
    hasBaseRoom,
    monthYearLabel,
    daysInMonth,
    calendarDays,
    getSelectionDateRange,
    allotmentStats,
    allotmentDetails,

    // Methods
    formatDateToString,
    formatDateKey,
    parseDateString,
    getRateForCell,
    isBaseCellFn,
    isCalculatedCell,
    previousMonth,
    nextMonth,
    goToToday,
    clearSelection,
    selectRange,
    highlightAllotmentLevel,
    copyWeek,
    pasteWeek,
    quickAction,
    toggleInlineEditMode,
    populateInlineEditPrices,
    getInlineEditPrice,
    setInlineEditPrice,
    handleInlineChange,
    saveInlineEditPrices,
    cancelInlineEdit
  }
}
