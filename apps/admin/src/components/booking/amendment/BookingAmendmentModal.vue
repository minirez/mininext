<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 transition-opacity" @click="handleClose"></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div
        class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('booking.amendment.title') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ booking?.bookingNumber }}
            </p>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            @click="handleClose"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- Step Indicator -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
          <div class="flex items-center justify-center space-x-4">
            <template v-for="(step, index) in steps" :key="step.key">
              <!-- Step -->
              <div
                class="flex items-center"
                :class="{ 'cursor-pointer': index < currentStep }"
                @click="goToStep(index)"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                  :class="getStepClass(index)"
                >
                  <span v-if="index < currentStep" class="material-icons text-sm">check</span>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span
                  class="ml-2 text-sm font-medium hidden sm:inline"
                  :class="
                    index === currentStep
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                >
                  {{ $t(`booking.amendment.${step.label}`) }}
                </span>
              </div>
              <!-- Connector -->
              <div
                v-if="index < steps.length - 1"
                class="w-8 sm:w-16 h-0.5"
                :class="index < currentStep ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'"
              ></div>
            </template>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-400">{{ $t('common.loading') }}</span>
          </div>

          <template v-else>
            <!-- Step 1: Overview -->
            <AmendmentOverview
              v-if="currentStep === 0"
              :booking="booking"
              :original-data="originalData"
            />

            <!-- Step 2: Dates & Rooms -->
            <AmendmentDatesRooms
              v-else-if="currentStep === 1"
              :booking="booking"
              :form-data="formData"
              :available-room-types="availableRoomTypes"
              :available-meal-plans="availableMealPlans"
              :preview-data="previewData"
              :checking-availability="checkingAvailability"
              @update:form-data="updateFormData"
              @check-availability="checkAvailability"
            />

            <!-- Step 3: Guests -->
            <AmendmentGuests
              v-else-if="currentStep === 2"
              :booking="booking"
              :form-data="formData"
              @update:form-data="updateFormData"
            />

            <!-- Step 4: Review -->
            <AmendmentReview
              v-else-if="currentStep === 3"
              :booking="booking"
              :original-data="originalData"
              :preview-data="previewData"
              :form-data="formData"
              :available-room-types="availableRoomTypes"
              :available-meal-plans="availableMealPlans"
              @adjust-price="showPriceAdjustment = true"
            />

            <!-- Step 5: Confirm -->
            <AmendmentConfirm
              v-else-if="currentStep === 4"
              :preview-data="previewData"
              :form-data="formData"
              :price-adjustment="priceAdjustment"
              @update:reason="formData.reason = $event"
            />
          </template>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
        >
          <button
            v-if="currentStep > 0"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            @click="prevStep"
          >
            <span class="material-icons text-sm mr-1 align-middle">arrow_back</span>
            {{ $t('common.back') }}
          </button>
          <div v-else></div>

          <div class="flex items-center gap-3">
            <button
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              @click="handleClose"
            >
              {{ $t('common.cancel') }}
            </button>

            <button
              v-if="currentStep < steps.length - 1"
              :disabled="!canProceed"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="nextStep"
            >
              {{ $t('common.next') }}
              <span class="material-icons text-sm ml-1 align-middle">arrow_forward</span>
            </button>

            <button
              v-else
              :disabled="!canApply || applying"
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              @click="applyAmendment"
            >
              <span
                v-if="applying"
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
              ></span>
              <span class="material-icons text-sm mr-1">check</span>
              {{ $t('booking.amendment.confirmButton') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Price Adjustment Modal -->
    <PriceAdjustmentModal
      v-if="showPriceAdjustment"
      :price-difference="previewData?.priceDifference"
      :adjustment="priceAdjustment"
      @close="showPriceAdjustment = false"
      @apply="handlePriceAdjustment"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import {
  getBookingForAmendment,
  previewAmendment,
  applyBookingAmendment
} from '@/services/bookingService'
import AmendmentOverview from './steps/AmendmentOverview.vue'
import AmendmentDatesRooms from './steps/AmendmentDatesRooms.vue'
import AmendmentGuests from './steps/AmendmentGuests.vue'
import AmendmentReview from './steps/AmendmentReview.vue'
import AmendmentConfirm from './steps/AmendmentConfirm.vue'
import PriceAdjustmentModal from './PriceAdjustmentModal.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  bookingId: { type: String, required: true }
})

const emit = defineEmits(['close', 'updated'])

const { t } = useI18n()
const toast = useToast()

// Steps definition
const steps = [
  { key: 'overview', label: 'stepOverview' },
  { key: 'dates-rooms', label: 'stepDatesRooms' },
  { key: 'guests', label: 'stepGuests' },
  { key: 'review', label: 'stepReview' },
  { key: 'confirm', label: 'stepConfirm' }
]

// State
const currentStep = ref(0)
const loading = ref(false)
const applying = ref(false)
const checkingAvailability = ref(false)
const showPriceAdjustment = ref(false)

// Data
const booking = ref(null)
const originalData = ref(null)
const availableRoomTypes = ref([])
const availableMealPlans = ref([])
const previewData = ref(null)
const priceAdjustment = ref({
  waived: false,
  adjustedAmount: null,
  reason: ''
})

// Form data
const formData = ref({
  checkIn: null,
  checkOut: null,
  rooms: [],
  leadGuest: null,
  contact: null,
  invoiceDetails: null,
  specialRequests: '',
  reason: ''
})

// Computed
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: // Overview - always can proceed
      return true
    case 1: // Dates & Rooms - need availability check
      return previewData.value?.availability?.allAvailable !== false
    case 2: // Guests - need all adult guests info
      // Check lead guest
      if (!formData.value.leadGuest?.firstName || !formData.value.leadGuest?.lastName) {
        return false
      }
      // Check all rooms have all adult guests filled
      for (const room of formData.value.rooms || []) {
        const adults = room.guests?.filter(g => g.type === 'adult') || []
        const requiredAdults = room.adults || 2
        // Must have enough adult guests
        if (adults.length < requiredAdults) {
          return false
        }
        // All adults must have firstName and lastName
        for (const adult of adults) {
          if (!adult.firstName?.trim() || !adult.lastName?.trim()) {
            return false
          }
        }
      }
      return true
    case 3: // Review - always can proceed
      return true
    default:
      return true
  }
})

const canApply = computed(() => {
  // Need reason (min 10 chars)
  return formData.value.reason?.trim()?.length >= 10
})

// Methods
const getStepClass = index => {
  if (index < currentStep.value) {
    return 'bg-indigo-600 text-white'
  } else if (index === currentStep.value) {
    return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600'
  } else {
    return 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
  }
}

const goToStep = index => {
  if (index < currentStep.value) {
    currentStep.value = index
  }
}

const nextStep = async () => {
  // Before leaving step 1, check availability if dates/rooms changed
  if (currentStep.value === 1 && !previewData.value) {
    await checkAvailability()
    // If still no preview data after check, don't proceed
    if (!previewData.value) {
      toast.error(t('booking.amendment.previewError'))
      return
    }
  }

  // Before going to review step, ensure we have preview data
  if (currentStep.value === 2 && !previewData.value) {
    await checkAvailability()
    if (!previewData.value) {
      toast.error(t('booking.amendment.previewError'))
      return
    }
  }

  if (currentStep.value < steps.length - 1 && canProceed.value) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleClose = () => {
  emit('close')
}

const updateFormData = updates => {
  formData.value = { ...formData.value, ...updates }
  // Reset preview when form changes
  previewData.value = null
}

const loadBookingData = async () => {
  if (!props.bookingId) {
    console.error('No booking ID provided')
    toast.error(t('booking.amendment.loadError'))
    return
  }

  loading.value = true
  try {
    const response = await getBookingForAmendment(props.bookingId)

    // API response: { success, data: { booking, availableRoomTypes, ... } }
    const apiData = response.data || response

    if (!apiData?.booking) {
      console.error('Invalid API response:', response)
      throw new Error('Invalid booking data')
    }

    booking.value = apiData.booking
    originalData.value = JSON.parse(JSON.stringify(apiData.booking)) // Deep clone
    availableRoomTypes.value = apiData.availableRoomTypes || []
    availableMealPlans.value = apiData.availableMealPlans || []

    // Initialize form with current values
    const b = apiData.booking

    formData.value = {
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      rooms: (b.rooms || []).map(r => ({
        roomTypeId: r.roomType?._id || r.roomType,
        mealPlanId: r.mealPlan?._id || r.mealPlan,
        adults: r.guests?.filter(g => g.type === 'adult').length || r.adults || 2,
        children: r.guests?.filter(g => g.type === 'child').map(g => g.age) || r.children || [],
        guests: r.guests || [],
        rateType: r.rateType || 'refundable'
      })),
      leadGuest: b.leadGuest ? { ...b.leadGuest } : {},
      contact: b.contact ? { ...b.contact } : {},
      invoiceDetails: b.invoiceDetails ? { ...b.invoiceDetails } : null,
      specialRequests: b.specialRequests || '',
      reason: ''
    }
  } catch (error) {
    console.error('Error loading booking:', error)

    // Show user-friendly error message
    const errorMessage =
      error.response?.data?.message || error.response?.data?.error || error.message

    const errorMessages = {
      BOOKING_NOT_FOUND: 'Rezervasyon bulunamadı',
      BOOKING_CANNOT_BE_AMENDED:
        'Bu rezervasyon düzenlenemez. Sadece bekleyen, onaylı veya giriş yapmış rezervasyonlar düzenlenebilir.',
      PARTNER_CONTEXT_REQUIRED: 'Partner seçimi gerekli'
    }

    const userMessage =
      errorMessages[errorMessage] || errorMessage || t('booking.amendment.loadError')
    toast.error(userMessage)
    handleClose()
  } finally {
    loading.value = false
  }
}

const checkAvailability = async () => {
  checkingAvailability.value = true
  try {
    const response = await previewAmendment(props.bookingId, {
      checkIn: formData.value.checkIn,
      checkOut: formData.value.checkOut,
      rooms: formData.value.rooms,
      leadGuest: formData.value.leadGuest,
      contact: formData.value.contact,
      invoiceDetails: formData.value.invoiceDetails,
      specialRequests: formData.value.specialRequests
    })

    previewData.value = response.data

    if (!response.data.availability?.allAvailable) {
      toast.warning(t('booking.amendment.availabilityIssues'))
      // Show specific error messages
      response.data.availability?.issues?.forEach(issue => {
        console.error('Availability issue:', issue)
        if (issue.error) {
          toast.error(`Oda ${issue.roomIndex + 1}: ${issue.message}`)
        }
      })
    }
  } catch (error) {
    console.error('Error checking availability:', error)

    // Show user-friendly error message
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      t('booking.amendment.previewError')

    // Map known error codes to user-friendly messages
    const errorMessages = {
      BOOKING_NOT_FOUND: 'Rezervasyon bulunamadı',
      BOOKING_CANNOT_BE_AMENDED: 'Bu rezervasyon düzenlenemez',
      BOOKING_HOTEL_NOT_FOUND: 'Rezervasyonun oteli bulunamadı',
      BOOKING_MARKET_NOT_FOUND:
        'Rezervasyonun pazarı bulunamadı. Lütfen yönetici ile iletişime geçin.',
      NO_MARKET_AVAILABLE: 'Bu otel için aktif bir pazar bulunamadı',
      NO_RATES_FOUND: 'Seçilen tarihler için fiyat bilgisi bulunamadı',
      PARTNER_CONTEXT_REQUIRED: 'Partner seçimi gerekli'
    }

    const userMessage = errorMessages[errorMessage] || errorMessage
    toast.error(userMessage)
  } finally {
    checkingAvailability.value = false
  }
}

const handlePriceAdjustment = adjustment => {
  priceAdjustment.value = adjustment
  showPriceAdjustment.value = false
}

const applyAmendment = async () => {
  if (!canApply.value) return

  applying.value = true
  try {
    const response = await applyBookingAmendment(props.bookingId, {
      checkIn: formData.value.checkIn,
      checkOut: formData.value.checkOut,
      rooms: formData.value.rooms,
      leadGuest: formData.value.leadGuest,
      contact: formData.value.contact,
      invoiceDetails: formData.value.invoiceDetails,
      specialRequests: formData.value.specialRequests,
      reason: formData.value.reason,
      priceDifferenceAdjustment: priceAdjustment.value.waived
        ? {
            waived: true,
            adjustedAmount: 0,
            reason: priceAdjustment.value.reason
          }
        : priceAdjustment.value.adjustedAmount
          ? {
              waived: false,
              adjustedAmount: priceAdjustment.value.adjustedAmount,
              reason: priceAdjustment.value.reason
            }
          : null
    })

    toast.success(t('booking.amendment.success'))
    emit('updated', response.data)
    handleClose()
  } catch (error) {
    console.error('Error applying amendment:', error)
    toast.error(error.response?.data?.message || t('booking.amendment.applyError'))
  } finally {
    applying.value = false
  }
}

// Load data on mount (for v-if usage)
onMounted(() => {
  if (props.show && props.bookingId) {
    currentStep.value = 0
    previewData.value = null
    priceAdjustment.value = { waived: false, adjustedAmount: null, reason: '' }
    loadBookingData()
  }
})

// Watch for modal open (for v-show usage or prop changes)
watch(
  () => props.show,
  newVal => {
    if (newVal && props.bookingId) {
      currentStep.value = 0
      previewData.value = null
      priceAdjustment.value = { waived: false, adjustedAmount: null, reason: '' }
      loadBookingData()
    }
  }
)
</script>
