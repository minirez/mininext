/**
 * Campaign Form Composable
 * Extracts all logic from CampaignForm.vue for better maintainability
 */
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'

export const SUPPORTED_LANGUAGES = [
  'tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg',
  'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az'
]

export const WEEKDAYS = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun'
}

export const CAMPAIGN_TYPES = [
  'early_bird',
  'last_minute',
  'long_stay',
  'promotional',
  'seasonal',
  'honeymoon',
  'family',
  'weekend',
  'midweek',
  'loyalty'
]

const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

export function useCampaignForm(props, emit) {
  const { t, locale } = useI18n()
  const toast = useToast()
  const saving = ref(false)

  // Validation error states
  const validationErrors = reactive({
    name: false,
    type: false,
    markets: false,
    mealPlans: false,
    roomTypes: false,
    stayDates: false,
    bookingDates: false
  })

  // Form state
  const form = reactive({
    code: '',
    name: createMultiLangObject(),
    type: '',
    status: 'active',
    visibility: { b2c: true, b2b: true },
    combinable: false,
    calculationType: 'cumulative',
    calculationOrder: 0,
    applicationType: 'stay',
    freeNightsEnabled: false,
    discount: {
      type: 'percentage',
      value: 10,
      freeNights: { stayNights: 7, freeNights: 1 }
    },
    conditions: {
      minNights: 1,
      applicableMarkets: [],
      applicableMealPlans: [],
      applicableRoomTypes: []
    },
    stayDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    bookingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  })

  // Date range models
  const stayDateRange = ref({ start: null, end: null })
  const bookingDateRange = ref({ start: null, end: null })

  // Preview state
  const previewPrice = ref(1000)
  const previewNights = ref(7)
  const previewResult = ref(null)

  // Conflict detection
  const conflictingCampaigns = computed(() => {
    if (!stayDateRange.value.start || !stayDateRange.value.end) return []
    if (!form.conditions.applicableMarkets.length) return []

    const currentStart = new Date(stayDateRange.value.start)
    const currentEnd = new Date(stayDateRange.value.end)
    const currentId = props.campaign?._id

    const conflicts = []

    for (const campaign of props.allCampaigns) {
      if (campaign._id === currentId) continue
      if (campaign.status !== 'active') continue
      if (campaign.combinable && form.combinable) continue

      const campStart = new Date(campaign.stayWindow?.startDate)
      const campEnd = new Date(campaign.stayWindow?.endDate)
      const datesOverlap = currentStart <= campEnd && currentEnd >= campStart

      if (!datesOverlap) continue

      const campMarkets = campaign.conditions?.applicableMarkets || []
      const marketOverlap = form.conditions.applicableMarkets.some(
        m => campMarkets.includes(m) || campMarkets.length === 0
      )

      if (!marketOverlap) continue

      const campRooms = campaign.conditions?.applicableRoomTypes || []
      const currentRooms = form.conditions.applicableRoomTypes || []
      let roomOverlap = true
      if (campRooms.length > 0 && currentRooms.length > 0) {
        roomOverlap = currentRooms.some(r => campRooms.includes(r))
      }

      if (!roomOverlap) continue

      const campMeals = campaign.conditions?.applicableMealPlans || []
      const currentMeals = form.conditions.applicableMealPlans || []
      let mealOverlap = true
      if (campMeals.length > 0 && currentMeals.length > 0) {
        mealOverlap = currentMeals.some(m => campMeals.includes(m))
      }

      if (!mealOverlap) continue

      conflicts.push({
        _id: campaign._id,
        code: campaign.code,
        name: campaign.name?.[locale.value] || campaign.name?.tr || campaign.name?.en || campaign.code,
        type: campaign.type,
        combinable: campaign.combinable,
        stayWindow: campaign.stayWindow,
        discountValue: campaign.discount?.value,
        discountType: campaign.discount?.type
      })
    }

    return conflicts
  })

  const hasConflicts = computed(() => conflictingCampaigns.value.length > 0)

  // Format price helper
  const formatPrice = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value)
  }

  // Calculate preview
  const calculatePreview = () => {
    const price = previewPrice.value || 0
    const nights = previewNights.value || 1
    const totalPrice = price * nights

    let discountAmount = 0
    let freeNightsCount = 0
    let discountText = ''

    if (nights < form.conditions.minNights) {
      previewResult.value = {
        originalPrice: totalPrice,
        discountAmount: 0,
        finalPrice: totalPrice,
        savingsPercent: 0,
        freeNights: 0,
        discountText: t('planning.campaigns.minNightsNotMet', { min: form.conditions.minNights })
      }
      return
    }

    if (form.freeNightsEnabled) {
      const stayReq = form.discount.freeNights.stayNights || 7
      const freeNightsGiven = form.discount.freeNights.freeNights || 1

      if (nights >= stayReq) {
        const sets = Math.floor(nights / stayReq)
        freeNightsCount = sets * freeNightsGiven
        discountAmount = freeNightsCount * price
        discountText = `${freeNightsCount} ${t('planning.campaigns.freeNightsLabel')}`
      }
    } else if (form.discount.type === 'percentage') {
      discountAmount = totalPrice * (form.discount.value / 100)
      discountText = `${form.discount.value}% ${t('planning.campaigns.off')}`
    } else if (form.discount.type === 'fixed') {
      discountAmount = form.discount.value * nights
      discountText = `${formatPrice(form.discount.value)} ${t('planning.campaigns.perNight')}`
    }

    const finalPrice = Math.max(0, totalPrice - discountAmount)
    const savingsPercent = totalPrice > 0 ? Math.round((discountAmount / totalPrice) * 100) : 0

    previewResult.value = {
      originalPrice: totalPrice,
      discountAmount,
      finalPrice,
      savingsPercent,
      freeNights: freeNightsCount,
      discountText
    }
  }

  // Toggle functions
  const toggleMarket = (id) => {
    const idx = form.conditions.applicableMarkets.indexOf(id)
    if (idx > -1) {
      form.conditions.applicableMarkets.splice(idx, 1)
    } else {
      form.conditions.applicableMarkets.push(id)
    }
  }

  const toggleAllMarkets = () => {
    if (form.conditions.applicableMarkets.length === props.markets.length) {
      form.conditions.applicableMarkets = []
    } else {
      form.conditions.applicableMarkets = props.markets.map(m => m._id)
    }
  }

  const toggleMealPlan = (id) => {
    const idx = form.conditions.applicableMealPlans.indexOf(id)
    if (idx > -1) {
      form.conditions.applicableMealPlans.splice(idx, 1)
    } else {
      form.conditions.applicableMealPlans.push(id)
    }
  }

  const toggleAllMealPlans = () => {
    if (form.conditions.applicableMealPlans.length === props.mealPlans.length) {
      form.conditions.applicableMealPlans = []
    } else {
      form.conditions.applicableMealPlans = props.mealPlans.map(mp => mp._id)
    }
  }

  const toggleRoomType = (id) => {
    const idx = form.conditions.applicableRoomTypes.indexOf(id)
    if (idx > -1) {
      form.conditions.applicableRoomTypes.splice(idx, 1)
    } else {
      form.conditions.applicableRoomTypes.push(id)
    }
  }

  const toggleAllRoomTypes = () => {
    if (form.conditions.applicableRoomTypes.length === props.roomTypes.length) {
      form.conditions.applicableRoomTypes = []
    } else {
      form.conditions.applicableRoomTypes = props.roomTypes.map(rt => rt._id)
    }
  }

  const toggleStayDay = (day) => {
    const idx = form.stayDays.indexOf(day)
    if (idx > -1) form.stayDays.splice(idx, 1)
    else form.stayDays.push(day)
  }

  const toggleBookingDay = (day) => {
    const idx = form.bookingDays.indexOf(day)
    if (idx > -1) form.bookingDays.splice(idx, 1)
    else form.bookingDays.push(day)
  }

  const toggleStatus = () => {
    form.status = form.status === 'active' ? 'inactive' : 'active'
  }

  // Validation
  const validateForm = () => {
    let isValid = true

    Object.keys(validationErrors).forEach(key => {
      validationErrors[key] = false
    })

    const hasName = SUPPORTED_LANGUAGES.some(lang => form.name[lang]?.trim())
    if (!hasName) {
      validationErrors.name = true
      isValid = false
    }

    if (!form.type) {
      validationErrors.type = true
      isValid = false
    }

    if (!form.conditions.applicableMarkets.length) {
      validationErrors.markets = true
      isValid = false
    }

    if (!form.conditions.applicableMealPlans.length) {
      validationErrors.mealPlans = true
      isValid = false
    }

    if (!form.conditions.applicableRoomTypes.length) {
      validationErrors.roomTypes = true
      isValid = false
    }

    if (!stayDateRange.value.start || !stayDateRange.value.end) {
      validationErrors.stayDates = true
      isValid = false
    }

    if (!bookingDateRange.value.start || !bookingDateRange.value.end) {
      validationErrors.bookingDates = true
      isValid = false
    }

    return isValid
  }

  // Save handler
  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    saving.value = true
    try {
      const firstFilledName = SUPPORTED_LANGUAGES.map(l => form.name[l]).find(n => n?.trim()) || ''

      const data = {
        ...form,
        code: firstFilledName.substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
        bookingWindow: {
          startDate: bookingDateRange.value.start,
          endDate: bookingDateRange.value.end
        },
        stayWindow: {
          startDate: stayDateRange.value.start,
          endDate: stayDateRange.value.end
        }
      }

      if (!form.freeNightsEnabled) {
        data.discount.type = 'percentage'
      } else {
        data.discount.type = 'free_nights'
      }

      if (props.campaign) {
        await planningService.updateCampaign(props.hotel._id, props.campaign._id, data)
        toast.success(t('planning.campaigns.updated'))
      } else {
        await planningService.createCampaign(props.hotel._id, data)
        toast.success(t('planning.campaigns.created'))
      }
      emit('saved')
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.operationFailed'))
    } finally {
      saving.value = false
    }
  }

  // Initialize from existing campaign
  const formatDateForInput = (date) => {
    if (!date) return null
    return new Date(date).toISOString().split('T')[0]
  }

  const initialize = () => {
    if (props.campaign) {
      form.code = props.campaign.code || ''
      form.name = { ...createMultiLangObject(), ...props.campaign.name }
      form.type = props.campaign.type || ''
      form.status = props.campaign.status || 'active'
      form.visibility = { b2c: true, b2b: true, ...props.campaign.visibility }
      form.combinable = props.campaign.combinable || false
      form.calculationType = props.campaign.calculationType || 'cumulative'
      form.calculationOrder = props.campaign.calculationOrder || 0
      form.applicationType = props.campaign.applicationType || 'stay'
      form.freeNightsEnabled = props.campaign.discount?.type === 'free_nights'
      form.discount = { ...form.discount, ...props.campaign.discount }
      form.conditions = { ...form.conditions, ...props.campaign.conditions }
      form.stayDays = props.campaign.stayDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      form.bookingDays = props.campaign.bookingDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

      stayDateRange.value = {
        start: formatDateForInput(props.campaign.stayWindow?.startDate),
        end: formatDateForInput(props.campaign.stayWindow?.endDate)
      }
      bookingDateRange.value = {
        start: formatDateForInput(props.campaign.bookingWindow?.startDate),
        end: formatDateForInput(props.campaign.bookingWindow?.endDate)
      }
    }
  }

  return {
    // State
    saving,
    form,
    validationErrors,
    stayDateRange,
    bookingDateRange,
    previewPrice,
    previewNights,
    previewResult,

    // Computed
    conflictingCampaigns,
    hasConflicts,

    // Constants
    weekdays: WEEKDAYS,
    campaignTypes: CAMPAIGN_TYPES,
    supportedLanguages: SUPPORTED_LANGUAGES,

    // Methods
    toggleStatus,
    toggleMarket,
    toggleAllMarkets,
    toggleMealPlan,
    toggleAllMealPlans,
    toggleRoomType,
    toggleAllRoomTypes,
    toggleStayDay,
    toggleBookingDay,
    calculatePreview,
    formatPrice,
    handleSave,
    initialize,

    // i18n
    locale
  }
}
