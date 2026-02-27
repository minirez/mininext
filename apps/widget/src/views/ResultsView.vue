<script setup>
import { ref, computed } from 'vue'
import { useWidgetStore } from '../stores/widget'
import { useFormatters } from '../composables/useFormatters'
import { useTranslation } from '../composables/useTranslation'
const widgetStore = useWidgetStore()
const { formatCurrency, formatDateShort } = useFormatters()
const { t, locale } = useTranslation()

const searchResults = computed(() => widgetStore.searchResults)
const searchParams = computed(() => widgetStore.searchParams)
const nights = computed(() => widgetStore.nights)
const isLoading = computed(() => widgetStore.isLoading)
const errorMessage = computed(() => widgetStore.error)
const widgetConfig = computed(() => widgetStore.widgetConfig)
const resultsStale = computed(() => widgetStore.resultsStale)
const cancellationPolicy = computed(() => widgetStore.cancellationPolicy)

// Cancellation modal state
const showCancellationModal = ref(false)

function openCancellationModal() {
  showCancellationModal.value = true
}

function closeCancellationModal() {
  showCancellationModal.value = false
}

// Has any cancellation policy defined (free cancellation or rules)
const hasCancellationPolicy = computed(() => {
  const cp = cancellationPolicy.value
  return cp?.freeCancellation?.enabled || cp?.rules?.length > 0
})

// Has free cancellation
const hasFreeCancellation = computed(() => cancellationPolicy.value?.freeCancellation?.enabled)

// Promo code state
const promoOpen = ref(false)
const promoInput = ref('')
const promoResult = computed(() => widgetStore.promoResult)
const promoLoading = computed(() => widgetStore.promoLoading)
const promoCode = computed(() => widgetStore.promoCode)

// Auto-open promo section if there's already a valid code
if (promoCode.value && promoResult.value?.valid) {
  promoOpen.value = true
}

function handleApplyPromo() {
  if (!promoInput.value.trim()) return
  widgetStore.applyPromoCode(promoInput.value)
  promoOpen.value = true
}

function handleClearPromo() {
  promoInput.value = ''
  widgetStore.clearPromoCode()
}

function getPromoErrorMessage(error) {
  const key = `promo.errors.${error}`
  const translated = t(key)
  return translated !== key ? translated : t('promo.errors.INVALID_CODE')
}

function refreshResults() {
  widgetStore.search()
}

// Lightbox state
const lightboxOpen = ref(false)
const lightboxImages = ref([])
const lightboxIndex = ref(0)
const lightboxRoomName = ref('')

function selectOption(roomResult, option) {
  widgetStore.selectRoom(roomResult, option)
}

// Get localized value from a multilingual object
function getLocalizedValue(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  const lang = locale.value
  return obj[lang] || obj.en || obj.tr || Object.values(obj)[0] || ''
}

// Get room name with locale support
function getRoomName(roomType) {
  const name = roomType?.name
  if (!name) return roomType?.code || ''
  return getLocalizedValue(name)
}

// Get room specs (size, view, bed type)
function getRoomSpecs(roomType) {
  const specs = []
  if (roomType?.size) specs.push(`${roomType.size} m²`)
  if (roomType?.view) {
    const view = getLocalizedValue(roomType.view)
    if (view) specs.push(view)
  }
  if (roomType?.bedType) {
    const bed = getLocalizedValue(roomType.bedType)
    if (bed) specs.push(bed)
  }
  return specs.join(' • ') || ''
}

// Get room capacity info
function getRoomCapacity(roomType) {
  const cap = roomType.capacity || roomType.occupancy || {}
  return cap.maxAdults || cap.adults || cap.totalMaxGuests || 2
}

// Get room amenities
function getRoomAmenities(roomType) {
  return roomType?.amenities || []
}

// Get meal plan name
function getMealPlanName(mealPlan) {
  const name = mealPlan?.name
  if (!name) return mealPlan?.code || ''
  return getLocalizedValue(name) || mealPlan?.code || ''
}

// Get meal plan description based on code
function getMealPlanDesc(option) {
  const code = option.mealPlan?.code?.toLowerCase() || ''
  if (code.includes('ro') || code.includes('room')) return t('results.mealPlans.roomOnly')
  if (code.includes('bb') || code.includes('breakfast')) return t('results.mealPlans.breakfast')
  if (code.includes('hb') || code.includes('half')) return t('results.mealPlans.halfBoard')
  if (code.includes('fb') || code.includes('full')) return t('results.mealPlans.fullBoard')
  if (code.includes('ai') || code.includes('all')) return t('results.mealPlans.allInclusive')
  return ''
}

// Check if room is available
function isRoomAvailable(roomResult) {
  if (roomResult.capacityExceeded) return false
  const options = roomResult.options || []
  return options.some(o => o.available !== false && o.pricing)
}

// Get unavailability reason
function getUnavailabilityReason(roomResult) {
  const options = roomResult.options || []

  for (const option of options) {
    if (option.available === false || !option.pricing) {
      const issues = option.issues || option.availability?.issues || []

      for (const issue of issues) {
        if (issue.type === 'minStay' || issue.reason === 'minStay') {
          return t('results.unavailable.minStay', {
            nights: issue.required || issue.minNights || 2
          })
        }
        if (issue.type === 'releaseDays' || issue.reason === 'releaseDays') {
          return t('results.unavailable.releaseDays', {
            days: issue.required || issue.releaseDays || 2
          })
        }
        if (issue.type === 'stopSale' || issue.reason === 'stopSale') {
          return t('results.unavailable.stopSale')
        }
        if (issue.type === 'noInventory' || issue.reason === 'noInventory') {
          return t('results.unavailable.noInventory')
        }
        if (issue.type === 'closedToArrival') {
          return t('results.unavailable.closedToArrival')
        }
        if (issue.type === 'closedToDeparture') {
          return t('results.unavailable.closedToDeparture')
        }
      }
    }
  }

  if (roomResult.capacityExceeded) {
    return roomResult.capacityMessage || t('results.unavailable.capacityExceeded')
  }

  return t('results.unavailable.default')
}

// Get amenity icon
function getAmenityIcon(amenity) {
  const icons = {
    wifi: 'wifi',
    airConditioning: 'ac_unit',
    ac: 'ac_unit',
    tv: 'tv',
    minibar: 'local_bar',
    safe: 'lock',
    balcony: 'balcony',
    seaView: 'waves',
    pool: 'pool',
    spa: 'spa',
    gym: 'fitness_center',
    restaurant: 'restaurant',
    parking: 'local_parking',
    kitchen: 'kitchen',
    kitchenette: 'countertops'
  }
  return icons[amenity] || 'check_circle'
}

// Format amenity name
function formatAmenity(amenity) {
  const key = `results.amenities.${amenity}`
  const translated = t(key)
  if (translated === key) {
    return amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }
  return translated
}

// Get room images
function getRoomImages(roomType) {
  return roomType?.images || []
}

// Open lightbox
function openLightbox(roomType) {
  const images = getRoomImages(roomType)
  if (images.length === 0) return

  lightboxImages.value = images
  lightboxIndex.value = 0
  lightboxRoomName.value = getRoomName(roomType)
  lightboxOpen.value = true
}

// Close lightbox
function closeLightbox() {
  lightboxOpen.value = false
}

// Navigate lightbox
function nextImage() {
  if (lightboxIndex.value < lightboxImages.value.length - 1) {
    lightboxIndex.value++
  }
}

function prevImage() {
  if (lightboxIndex.value > 0) {
    lightboxIndex.value--
  }
}
</script>

<template>
  <div class="results-view">
    <!-- Search Summary Card -->
    <div class="search-summary-card">
      <button class="back-btn" @click="widgetStore.goBack()" type="button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <div class="summary-dates">
        <div class="summary-date">
          <span class="summary-date-label">{{ t('common.checkIn') }}</span>
          <span class="summary-date-value">{{ formatDateShort(searchParams.checkIn) }}</span>
        </div>
        <div class="summary-divider">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
        <div class="summary-date">
          <span class="summary-date-label">{{ t('common.checkOut') }}</span>
          <span class="summary-date-value">{{ formatDateShort(searchParams.checkOut) }}</span>
        </div>
      </div>
      <div class="summary-info">
        <span class="summary-nights">{{ nights }} {{ t('common.night') }}</span>
        <span class="summary-guests">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          {{ searchParams.adults
          }}{{ searchParams.children.length > 0 ? `+${searchParams.children.length}` : '' }}
        </span>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error">
      <svg
        class="alert-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Stale Results Banner -->
    <div v-if="resultsStale && !isLoading" class="stale-results-banner">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ t('results.staleResults') }}</span>
      <button @click="refreshResults">{{ t('results.refreshPrices') }}</button>
    </div>

    <!-- Promo Code Section -->
    <div class="promo-section">
      <!-- Toggle link -->
      <div v-if="!promoOpen && !promoCode" class="promo-toggle" @click="promoOpen = true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 12 20 22 4 22 4 12"></polyline>
          <rect x="2" y="7" width="20" height="5"></rect>
          <line x1="12" y1="22" x2="12" y2="7"></line>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
        </svg>
        {{ t('promo.toggle') }}
      </div>

      <!-- Promo Input -->
      <div v-if="promoOpen && !(promoCode && promoResult?.valid)" class="promo-input-row">
        <input
          v-model="promoInput"
          type="text"
          class="form-input promo-input"
          :placeholder="t('promo.placeholder')"
          @keyup.enter="handleApplyPromo"
          :disabled="promoLoading"
        />
        <button
          class="btn btn-primary promo-apply-btn"
          @click="handleApplyPromo"
          :disabled="!promoInput.trim() || promoLoading"
        >
          <div v-if="promoLoading" class="spinner spinner-sm"></div>
          <span v-else>{{ t('promo.apply') }}</span>
        </button>
      </div>

      <!-- Promo Success -->
      <div v-if="promoCode && promoResult?.valid" class="promo-success">
        <div class="promo-success-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>
            <span class="promo-campaign-name">{{ promoResult.campaign.name }}</span>
            <span class="promo-discount-text">{{ promoResult.campaign.discountText }}</span>
          </div>
        </div>
        <button class="promo-clear-btn" @click="handleClearPromo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Promo Error -->
      <div v-if="promoResult && !promoResult.valid" class="promo-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ getPromoErrorMessage(promoResult.error) }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>{{ t('results.searching') }}</span>
    </div>

    <!-- Results -->
    <div v-else-if="searchResults?.results?.length" class="results-list">
      <div
        v-for="roomResult in searchResults.results"
        :key="roomResult.roomType.code"
        class="room-card-v2"
        :class="{ 'is-unavailable': !isRoomAvailable(roomResult) }"
      >
        <!-- Top Section: Image & Info -->
        <div class="room-card-top">
          <!-- Thumbnail -->
          <div class="room-thumbnail" @click="openLightbox(roomResult.roomType)">
            <img
              v-if="roomResult.roomType.images?.length"
              :src="
                widgetStore.resolveAssetUrl(
                  roomResult.roomType.images[0].url || roomResult.roomType.images[0]
                )
              "
              :alt="getRoomName(roomResult.roomType)"
              class="room-thumbnail-img"
            />
            <div v-else class="room-thumbnail-placeholder">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M2 4v16M2 8h18a2 2 0 012 2v10M2 17h20M6 8v9" />
              </svg>
            </div>

            <!-- Badges -->
            <div class="room-thumbnail-badges">
              <div v-if="getRoomImages(roomResult.roomType).length > 1" class="thumbnail-badge">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                {{ getRoomImages(roomResult.roomType).length }}
              </div>
              <div v-if="widgetConfig?.showRoomCapacity !== false" class="thumbnail-badge">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                {{ getRoomCapacity(roomResult.roomType) }}
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="room-info">
            <h3 class="room-name">{{ getRoomName(roomResult.roomType) }}</h3>
            <p v-if="getRoomSpecs(roomResult.roomType)" class="room-specs">
              {{ getRoomSpecs(roomResult.roomType) }}
            </p>

            <!-- Amenities -->
            <div v-if="getRoomAmenities(roomResult.roomType).length" class="room-amenities">
              <div
                v-for="amenity in getRoomAmenities(roomResult.roomType).slice(0, 3)"
                :key="amenity"
                class="amenity-chip"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {{ formatAmenity(amenity) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Unavailable Message -->
        <div v-if="!isRoomAvailable(roomResult)" class="room-unavailable-box">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{{ getUnavailabilityReason(roomResult) }}</p>
        </div>

        <!-- Meal Plan Options -->
        <div v-else class="room-options-v2">
          <div
            v-for="option in roomResult.options.filter(o => o.pricing)"
            :key="option.mealPlan.code"
            class="meal-option-v2"
          >
            <!-- Meal Info -->
            <div class="meal-content">
              <div class="meal-header">
                <div class="meal-info">
                  <p class="meal-name">{{ getMealPlanName(option.mealPlan) }}</p>
                  <p class="meal-desc">{{ getMealPlanDesc(option) }}</p>
                </div>
                <div class="meal-price">
                  <span
                    v-if="option.pricing.totalDiscount > 0 && widgetConfig?.showOriginalPrice"
                    class="price-original"
                  >
                    {{ formatCurrency(option.pricing.originalTotal) }}
                  </span>
                  <span
                    class="price-final"
                    :class="{ 'has-discount': option.pricing.totalDiscount > 0 }"
                  >
                    {{ formatCurrency(option.pricing.finalTotal) }}
                  </span>
                </div>
              </div>

              <!-- Footer: Tags + Select Button -->
              <div class="meal-footer">
                <div class="meal-tags">
                  <!-- Cancellation Link -->
                  <span
                    v-if="hasFreeCancellation"
                    class="cancellation-link"
                    @click.stop="openCancellationModal()"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    {{ t('results.freeCancellation') }}
                  </span>
                  <span
                    v-else-if="hasCancellationPolicy"
                    class="cancellation-link cancellation-link--nonrefundable"
                    @click.stop="openCancellationModal()"
                  >
                    {{ t('results.nonRefundable') }}
                  </span>

                  <!-- Campaign Badge -->
                  <span
                    v-for="campaign in option.campaigns?.length && widgetConfig?.showCampaigns
                      ? option.campaigns
                      : []"
                    :key="campaign.code"
                    class="campaign-badge-v2"
                  >
                    {{ campaign.discountText || campaign.name }}
                  </span>
                </div>

                <!-- Select Button -->
                <button
                  class="meal-select-btn"
                  @click="selectOption(roomResult, option)"
                  type="button"
                >
                  {{ t('results.select') }}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-else class="no-results">
      <div class="no-results-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </div>
      <h3 class="no-results-title">{{ t('results.noResults') }}</h3>
      <p class="no-results-text">{{ t('results.noResultsDesc') }}</p>
      <button class="btn btn-primary" @click="widgetStore.goBack()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        {{ t('results.changeDates') }}
      </button>
    </div>

    <!-- Cancellation Policy Modal -->
    <div
      v-if="showCancellationModal"
      class="cancellation-modal-overlay"
      @click.self="closeCancellationModal"
    >
      <div class="cancellation-modal">
        <div class="cancellation-modal-header">
          <h3 class="cancellation-modal-title">{{ t('cancellation.title') }}</h3>
          <button class="cancellation-modal-close" @click="closeCancellationModal" type="button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="cancellation-modal-body">
          <!-- Free cancellation highlight -->
          <div v-if="hasFreeCancellation" class="cancellation-free">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{{
              t('cancellation.freeUntil', {
                days: cancellationPolicy.freeCancellation.daysBeforeCheckIn
              })
            }}</span>
          </div>

          <!-- Non-refundable notice -->
          <div
            v-if="!hasFreeCancellation && !cancellationPolicy?.rules?.length"
            class="cancellation-nonrefundable"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>{{ t('cancellation.nonRefundable') }}</span>
          </div>

          <!-- Rules -->
          <div v-if="cancellationPolicy?.rules?.length" class="cancellation-rules">
            <div
              v-for="(rule, index) in cancellationPolicy.rules"
              :key="index"
              class="cancellation-rule"
            >
              <span class="rule-period">
                {{
                  rule.daysBeforeCheckIn === 0
                    ? t('cancellation.onCheckinDay')
                    : t('cancellation.daysBeforeCheckin', { days: rule.daysBeforeCheckIn })
                }}
              </span>
              <span
                class="rule-refund"
                :class="{
                  full: rule.refundPercent === 100,
                  partial: rule.refundPercent > 0 && rule.refundPercent < 100,
                  none: rule.refundPercent === 0
                }"
              >
                %{{ rule.refundPercent }} {{ t('cancellation.refund') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox (no teleport for Shadow DOM compatibility) -->
    <div v-if="lightboxOpen" class="lightbox-overlay" @click="closeLightbox">
      <div class="lightbox-container" @click.stop>
        <button class="lightbox-close" @click="closeLightbox">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="lightbox-main">
          <button
            v-if="lightboxImages.length > 1"
            class="lightbox-nav lightbox-prev"
            @click="prevImage"
            :disabled="lightboxIndex === 0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div class="lightbox-image-wrapper">
            <img
              :src="
                widgetStore.resolveAssetUrl(
                  lightboxImages[lightboxIndex]?.url || lightboxImages[lightboxIndex]
                )
              "
              :alt="lightboxRoomName"
              class="lightbox-image"
            />
          </div>

          <button
            v-if="lightboxImages.length > 1"
            class="lightbox-nav lightbox-next"
            @click="nextImage"
            :disabled="lightboxIndex === lightboxImages.length - 1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div class="lightbox-footer">
          <span class="lightbox-room-name">{{ lightboxRoomName }}</span>
          <span class="lightbox-counter"
            >{{ lightboxIndex + 1 }} / {{ lightboxImages.length }}</span
          >
        </div>

        <!-- Thumbnails -->
        <div v-if="lightboxImages.length > 1" class="lightbox-thumbnails">
          <button
            v-for="(img, idx) in lightboxImages"
            :key="idx"
            class="lightbox-thumb"
            :class="{ 'is-active': idx === lightboxIndex }"
            @click="lightboxIndex = idx"
          >
            <img :src="widgetStore.resolveAssetUrl(img?.url || img)" :alt="`Image ${idx + 1}`" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Styles are in widget.css for Shadow DOM compatibility -->
