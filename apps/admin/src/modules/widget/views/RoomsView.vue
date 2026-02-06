<template>
  <div class="rooms-view">
    <!-- Room Selection Tabs -->
    <div class="room-tabs-wrapper">
      <div class="room-tabs">
        <button
          v-for="(room, index) in store.search.rooms"
          :key="index"
          class="room-tab"
          :class="{
            'is-active': activeRoomIndex === index,
            'is-completed': selectedRooms[index]
          }"
          @click="setActiveRoom(index)"
        >
          <span class="room-tab-label">{{ $t('widget.room') }} {{ index + 1 }}</span>
          <span v-if="selectedRooms[index]" class="room-tab-check">
            <WidgetIcon name="check" :size="14" />
          </span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="rooms-loading">
      <Spinner size="lg" />
      <p>{{ $t('widget.loadingRooms') }}</p>
    </div>

    <!-- No Results -->
    <div v-else-if="!searchResults.available || roomTypes.length === 0" class="rooms-empty">
      <div class="rooms-empty-icon">
        <WidgetIcon name="calendar-x" :size="48" />
      </div>
      <h3>{{ $t('widget.noRoomsAvailable') }}</h3>
      <p>{{ $t('widget.tryDifferentDates') }}</p>
      <button class="btn-back" @click="goBack">
        <WidgetIcon name="arrow-left" :size="18" />
        {{ $t('widget.modifySearch') }}
      </button>
    </div>

    <!-- Room Cards -->
    <div v-else class="rooms-list">
      <div
        v-for="roomType in roomTypes"
        :key="roomType.roomType?.code || roomType._id"
        class="room-card"
        :class="{
          'is-selected': isRoomTypeSelected(roomType),
          'is-unavailable': !isRoomAvailable(roomType)
        }"
      >
        <!-- Top Section: Image & Info -->
        <div class="room-card-top">
          <!-- Thumbnail -->
          <div class="room-thumbnail" @click="openGallery(roomType)">
            <img
              v-if="getRoomImage(roomType)"
              :src="getRoomImage(roomType)"
              :alt="getRoomName(roomType)"
              class="room-thumbnail-img"
              loading="lazy"
            />
            <div v-else class="room-thumbnail-placeholder">
              <WidgetIcon name="bed" :size="32" />
            </div>

            <!-- Badges -->
            <div class="room-thumbnail-badges">
              <div v-if="getRoomImages(roomType).length > 1" class="thumbnail-badge">
                <WidgetIcon name="image" :size="12" />
                <span>{{ getRoomImages(roomType).length }}</span>
              </div>
              <div class="thumbnail-badge">
                <WidgetIcon name="users" :size="12" />
                <span>{{ getMaxOccupancy(roomType) }}</span>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="room-info">
            <p class="room-category">{{ getRoomCategory(roomType) }}</p>
            <h3 class="room-name">{{ getRoomName(roomType) }}</h3>
            <p class="room-specs">{{ getRoomSpecs(roomType) }}</p>

            <!-- Amenities -->
            <div v-if="getRoomAmenities(roomType).length" class="room-amenities">
              <div
                v-for="amenity in getRoomAmenities(roomType).slice(0, 3)"
                :key="amenity"
                class="amenity-chip"
              >
                <WidgetIcon :name="getAmenityIcon(amenity)" :size="14" />
                <span>{{ formatAmenity(amenity) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Unavailable Message -->
        <div v-if="!isRoomAvailable(roomType)" class="room-unavailable-box">
          <WidgetIcon name="info" :size="20" />
          <p>{{ getUnavailabilityReason(roomType) }}</p>
        </div>

        <!-- Meal Plan Options -->
        <div v-else-if="hasAvailableOptions(roomType)" class="room-options">
          <label
            v-for="option in getAvailableOptions(roomType)"
            :key="option.mealPlan?.code || option.mealPlan?._id"
            class="meal-option"
            :class="{ 'is-selected': isOptionSelected(roomType, option) }"
          >
            <input
              type="radio"
              :name="`room-${activeRoomIndex}-${roomType.roomType?.code || roomType._id}`"
              :checked="isOptionSelected(roomType, option)"
              @change="selectOption(roomType, option)"
              class="meal-radio"
            />
            <div class="meal-content">
              <div class="meal-header">
                <div class="meal-info">
                  <p class="meal-name">{{ getMealPlanName(option.mealPlan) }}</p>
                  <p class="meal-desc">{{ getMealPlanDesc(option) }}</p>
                </div>
                <div class="meal-price">
                  <span v-if="option.pricing?.totalDiscount > 0" class="price-original">
                    {{ formatPrice(option.pricing.originalTotal) }}
                  </span>
                  <span class="price-final" :class="{ 'has-discount': option.pricing?.totalDiscount > 0 }">
                    {{ formatPrice(option.pricing?.finalTotal) }}
                  </span>
                </div>
              </div>
              <!-- Campaign Badge -->
              <div v-if="option.campaigns?.length" class="meal-campaigns">
                <span
                  v-for="campaign in option.campaigns"
                  :key="campaign.code"
                  class="campaign-badge"
                >
                  {{ campaign.discountText || campaign.name }}
                </span>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Sticky Bottom Bar -->
    <div v-if="canProceed" class="bottom-bar">
      <div class="bottom-bar-content">
        <div class="bottom-price">
          <span class="bottom-price-label">{{ $t('widget.totalFor', { nights: nightCount }, nightCount) }}</span>
          <span class="bottom-price-amount">{{ formatPrice(totalPrice) }}</span>
        </div>
        <button class="btn-continue" @click="goToGuests">
          {{ $t('widget.continueToGuests') }}
          <WidgetIcon name="arrow-right" :size="20" />
        </button>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <Teleport to="body">
      <div v-if="lightboxOpen" class="lightbox-overlay" @click="closeLightbox">
        <div class="lightbox-container" @click.stop>
          <button class="lightbox-close" @click="closeLightbox">
            <WidgetIcon name="x" :size="24" />
          </button>

          <div class="lightbox-main">
            <button
              v-if="lightboxImages.length > 1"
              class="lightbox-nav lightbox-prev"
              @click="prevImage"
              :disabled="lightboxIndex === 0"
            >
              <WidgetIcon name="chevron-left" :size="32" />
            </button>

            <div class="lightbox-image-wrapper">
              <img
                :src="lightboxImages[lightboxIndex]?.url || lightboxImages[lightboxIndex]"
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
              <WidgetIcon name="chevron-right" :size="32" />
            </button>
          </div>

          <div class="lightbox-footer">
            <span class="lightbox-room-name">{{ lightboxRoomName }}</span>
            <span class="lightbox-counter">{{ lightboxIndex + 1 }} / {{ lightboxImages.length }}</span>
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
              <img :src="img?.url || img" :alt="`Image ${idx + 1}`" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Spinner from '@/components/ui/feedback/Spinner.vue'
import WidgetIcon from '../components/WidgetIcon.vue'

const store = inject('widgetStore')
const api = inject('widgetApi')
const router = useRouter()
const { t, locale } = useI18n()

const isLoading = ref(false)
const activeRoomIndex = ref(0)

// Lightbox state
const lightboxOpen = ref(false)
const lightboxImages = ref([])
const lightboxIndex = ref(0)
const lightboxRoomName = ref('')

// Computed
const searchResults = computed(() => store.searchResults)
const roomTypes = computed(() => searchResults.value.roomTypes || [])
const selectedRooms = computed(() => store.selectedRooms)
const canProceed = computed(() => store.canProceedToGuests)

const nightCount = computed(() => {
  if (!store.search.checkIn || !store.search.checkOut) return 1
  const checkIn = new Date(store.search.checkIn)
  const checkOut = new Date(store.search.checkOut)
  const diff = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 1
})

const totalPrice = computed(() => {
  return selectedRooms.value.reduce((sum, room) => {
    return sum + (room?.pricing?.finalTotal || 0)
  }, 0)
})

// Helper functions
function getRoomName(roomType) {
  const rt = roomType.roomType || roomType
  const name = rt?.name
  if (!name) return rt?.code || ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

function getRoomCategory(roomType) {
  const rt = roomType.roomType || roomType
  return rt?.category || rt?.type || 'Standard Room'
}

function getRoomSpecs(roomType) {
  const rt = roomType.roomType || roomType
  const specs = []

  if (rt?.size) specs.push(`${rt.size}m²`)
  if (rt?.view) {
    const view = typeof rt.view === 'object'
      ? (rt.view[locale.value] || rt.view.en || Object.values(rt.view)[0])
      : rt.view
    if (view) specs.push(view)
  }
  if (rt?.bedType) {
    const bed = typeof rt.bedType === 'object'
      ? (rt.bedType[locale.value] || rt.bedType.en || Object.values(rt.bedType)[0])
      : rt.bedType
    if (bed) specs.push(bed)
  }

  return specs.join(' • ') || ''
}

function getRoomDescription(roomType) {
  const rt = roomType.roomType || roomType
  const desc = rt?.description
  if (!desc) return ''
  if (typeof desc === 'object') {
    return desc[locale.value] || desc.en || desc.tr || Object.values(desc)[0] || ''
  }
  return desc
}

function getRoomImage(roomType) {
  const rt = roomType.roomType || roomType
  const images = rt?.images || []
  if (images.length === 0) return null
  return images[0]?.url || images[0]
}

function getRoomImages(roomType) {
  const rt = roomType.roomType || roomType
  return rt?.images || []
}

function getRoomAmenities(roomType) {
  const rt = roomType.roomType || roomType
  return rt?.amenities || []
}

function getMaxOccupancy(roomType) {
  const rt = roomType.roomType || roomType
  return rt?.occupancy?.maxAdults || rt?.occupancy?.totalMaxGuests || 2
}

function getMealPlanName(mealPlan) {
  const name = mealPlan?.name
  if (!name) return mealPlan?.code || ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || mealPlan?.code || ''
  }
  return name
}

function getMealPlanDesc(option) {
  // Generate a short description based on meal plan
  const code = option.mealPlan?.code?.toLowerCase() || ''
  if (code.includes('ro') || code.includes('room')) return locale.value === 'tr' ? 'Sadece konaklama' : 'Room only rate'
  if (code.includes('bb') || code.includes('breakfast')) return locale.value === 'tr' ? 'Kahvaltı dahil' : 'Breakfast included'
  if (code.includes('hb') || code.includes('half')) return locale.value === 'tr' ? 'Yarım pansiyon' : 'Half board'
  if (code.includes('fb') || code.includes('full')) return locale.value === 'tr' ? 'Tam pansiyon' : 'Full board'
  if (code.includes('ai') || code.includes('all')) return locale.value === 'tr' ? 'Her şey dahil' : 'All inclusive'
  return ''
}

function formatPrice(amount) {
  if (!amount && amount !== 0) return ''
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: store.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatAmenity(amenity) {
  const key = `amenities.${amenity}`
  const translated = t(key)
  if (translated !== key) return translated
  return amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

function getAmenityIcon(amenity) {
  const icons = {
    wifi: 'wifi',
    airConditioning: 'snowflake',
    ac: 'snowflake',
    tv: 'tv',
    minibar: 'wine',
    safe: 'lock',
    balcony: 'sun',
    seaView: 'waves',
    bathtub: 'bath',
    shower: 'droplets',
    hairDryer: 'wind',
    coffeemaker: 'coffee',
    iron: 'shirt',
    roomService: 'bell',
    parking: 'car',
    pool: 'waves',
    spa: 'sparkles',
    gym: 'dumbbell',
    restaurant: 'utensils',
    bar: 'wine',
    kitchen: 'utensils',
    kitchenette: 'utensils'
  }
  return icons[amenity] || 'check'
}

function isRoomAvailable(roomType) {
  if (roomType.capacityExceeded) return false
  const options = roomType.options || []
  return options.some(o => o.available !== false && o.pricing)
}

function getUnavailabilityReason(roomType) {
  const options = roomType.options || []

  for (const option of options) {
    if (option.available === false || !option.pricing) {
      const issues = option.availability?.issues || option.priceResult?.availability?.issues || []

      for (const issue of issues) {
        if (issue.type === 'minStay' || issue.reason === 'minStay') {
          return t('widget.minStayRequired', { nights: issue.required || issue.minNights || 2 })
        }
        if (issue.type === 'releaseDays' || issue.reason === 'releaseDays') {
          return t('widget.releaseDaysRequired', { days: issue.required || issue.releaseDays || 2 })
        }
        if (issue.type === 'stopSale' || issue.reason === 'stopSale') {
          return t('widget.stopSale')
        }
        if (issue.type === 'noInventory' || issue.reason === 'noInventory') {
          return t('widget.noInventory')
        }
        if (issue.type === 'closedToArrival' || issue.reason === 'closedToArrival') {
          return t('widget.closedToArrival')
        }
        if (issue.type === 'closedToDeparture' || issue.reason === 'closedToDeparture') {
          return t('widget.closedToDeparture')
        }
      }
    }
  }

  const roomIssues = roomType.availability?.issues || []
  for (const issue of roomIssues) {
    if (issue.type === 'minStay' || issue.reason === 'minStay') {
      return t('widget.minStayRequired', { nights: issue.required || 2 })
    }
    if (issue.type === 'releaseDays' || issue.reason === 'releaseDays') {
      return t('widget.releaseDaysRequired', { days: issue.required || 2 })
    }
    if (issue.type === 'stopSale' || issue.reason === 'stopSale') {
      return t('widget.stopSale')
    }
  }

  if (roomType.capacityExceeded) {
    return roomType.capacityMessage || t('widget.capacityExceeded')
  }

  return t('widget.roomNotAvailable')
}

function hasAvailableOptions(roomType) {
  const options = roomType.options || []
  return options.some(o => o.available !== false && o.pricing)
}

function getAvailableOptions(roomType) {
  const options = roomType.options || []
  return options.filter(o => o.available !== false && o.pricing)
}

function isRoomTypeSelected(roomType) {
  const rt = roomType.roomType || roomType
  const rtId = rt?._id || rt?.code
  return selectedRooms.value.some(r => {
    const selectedRtId = r?.roomType?._id || r?.roomType?.code || r?.roomTypeId
    return selectedRtId === rtId
  })
}

function isOptionSelected(roomType, option) {
  const rt = roomType.roomType || roomType
  const rtId = rt?._id || rt?.code
  const mpId = option.mealPlan?._id || option.mealPlan?.code

  const room = selectedRooms.value[activeRoomIndex.value]
  if (!room) return false

  const selectedRtId = room.roomType?._id || room.roomType?.code || room.roomTypeId
  const selectedMpId = room.mealPlan?._id || room.mealPlan?.code || room.mealPlanId

  return selectedRtId === rtId && selectedMpId === mpId
}

function setActiveRoom(index) {
  activeRoomIndex.value = index
}

function selectOption(roomType, option) {
  const rt = roomType.roomType || roomType

  store.selectRoom(
    activeRoomIndex.value,
    rt,
    option.mealPlan,
    option.pricing
  )

  // Move to next room if available
  const nextUnselected = store.search.rooms.findIndex(
    (_, i) => i > activeRoomIndex.value && !selectedRooms.value[i]
  )
  if (nextUnselected !== -1) {
    activeRoomIndex.value = nextUnselected
  }
}

// Lightbox functions
function openGallery(roomType) {
  const images = getRoomImages(roomType)
  if (images.length === 0) return

  lightboxImages.value = images
  lightboxIndex.value = 0
  lightboxRoomName.value = getRoomName(roomType)
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

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

function handleKeydown(e) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
}

function goBack() {
  router.push({ name: 'widget-search' })
}

function goToGuests() {
  if (canProceed.value) {
    router.push({ name: 'widget-guests' })
  }
}

// Load room data if needed
onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)

  if (!searchResults.value.available || roomTypes.value.length === 0) {
    if (store.search.checkIn && store.search.checkOut) {
      isLoading.value = true
      try {
        const searchParams = {
          checkIn: store.search.checkIn,
          checkOut: store.search.checkOut,
          rooms: store.search.rooms.map(room => ({
            adults: room.adults,
            children: room.children
          })),
          currency: store.market.currency,
          countryCode: store.market.countryCode
        }

        const results = await api.searchAvailability(store.config.hotelCode, searchParams)

        store.setSearchResults({
          available: results?.results?.length > 0,
          roomTypes: results?.results || [],
          error: null
        })
      } catch (err) {
        store.setSearchResults({
          available: false,
          roomTypes: [],
          error: err.message
        })
      } finally {
        isLoading.value = false
      }
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Variables */
.rooms-view {
  --color-primary: var(--widget-primary, #7c3aed);
  --color-primary-light: var(--widget-primary-50, #f5f3ff);
  --color-bg: #f7f6f8;
  --color-surface: #ffffff;
  --color-text: #130e1b;
  --color-text-sub: #694d99;
  --color-border: #e5e7eb;
  --color-success: #10b981;
  --color-warning: #f59e0b;

  width: 100%;
  padding-bottom: 100px;
}

.dark .rooms-view {
  --color-bg: #171121;
  --color-surface: #231b30;
  --color-text: #f9f8fc;
  --color-text-sub: #b0a2c9;
  --color-border: #374151;
}

/* Tabs */
.room-tabs-wrapper {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--color-bg);
  padding-top: 0.5rem;
  margin: -1rem -1rem 1rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

.room-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  gap: 2rem;
}

.room-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 3px solid transparent;
  background: none;
  border-left: none;
  border-right: none;
  border-top: none;
  cursor: pointer;
  transition: all 150ms ease;
  color: var(--color-text-sub);
  flex: 1;
  justify-content: center;
}

.room-tab.is-active {
  border-bottom-color: var(--color-primary);
  color: var(--color-text);
}

.room-tab.is-completed:not(.is-active) {
  color: var(--color-success);
}

.room-tab-label {
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.025em;
}

.room-tab-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--color-success);
  color: white;
  border-radius: 50%;
}

/* Loading & Empty */
.rooms-loading,
.rooms-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.rooms-empty-icon {
  width: 5rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-border);
  border-radius: 50%;
  color: var(--color-text-sub);
  margin-bottom: 1.25rem;
}

.rooms-empty h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.rooms-empty p {
  font-size: 0.875rem;
  color: var(--color-text-sub);
  margin-bottom: 1.5rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: opacity 150ms ease;
}

.btn-back:hover {
  opacity: 0.9;
}

/* Room List */
.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Room Card */
.room-card {
  background: var(--color-surface);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: all 200ms ease;
}

.room-card.is-selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.room-card.is-unavailable {
  opacity: 0.7;
  filter: grayscale(0.5);
  pointer-events: none;
}

/* Room Card Top */
.room-card-top {
  display: flex;
  padding: 1rem;
  padding-bottom: 0;
  gap: 1rem;
}

/* Thumbnail */
.room-thumbnail {
  position: relative;
  width: 7rem;
  height: 7rem;
  flex-shrink: 0;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #e5e7eb;
  cursor: pointer;
}

.room-thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease;
}

.room-thumbnail:hover .room-thumbnail-img {
  transform: scale(1.05);
}

.room-thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.room-thumbnail-badges {
  position: absolute;
  bottom: 0.25rem;
  left: 0.25rem;
  display: flex;
  gap: 0.25rem;
}

.thumbnail-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.375rem;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: white;
}

/* Room Info */
.room-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.room-category {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.125rem;
}

.room-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
  margin-bottom: 0.25rem;
}

.room-specs {
  font-size: 0.75rem;
  color: var(--color-text-sub);
  margin-bottom: 0.75rem;
}

/* Amenities */
.room-amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;
}

.amenity-chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-bg);
  border-radius: 0.375rem;
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--color-text);
}

.amenity-chip svg {
  color: var(--color-primary);
}

/* Unavailable Box */
.room-unavailable-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 0.5rem;
  color: #92400e;
}

.dark .room-unavailable-box {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fbbf24;
}

.room-unavailable-box p {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.4;
}

/* Room Options */
.room-options {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Meal Option */
.meal-option {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 150ms ease;
}

.meal-option:hover {
  background: rgba(0,0,0,0.02);
}

.dark .meal-option:hover {
  background: rgba(255,255,255,0.02);
}

.meal-option.is-selected {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.dark .meal-option.is-selected {
  background: rgba(124, 58, 237, 0.15);
}

/* Radio Button */
.meal-radio {
  appearance: none;
  -webkit-appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  margin-top: 0.125rem;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 150ms ease;
  position: relative;
}

.meal-radio:checked {
  border-color: var(--color-primary);
  background: radial-gradient(circle, var(--color-primary) 40%, transparent 40%);
}

/* Meal Content */
.meal-content {
  flex: 1;
  min-width: 0;
}

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.meal-info {
  flex: 1;
  min-width: 0;
}

.meal-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.125rem;
}

.meal-desc {
  font-size: 0.75rem;
  color: var(--color-text-sub);
}

.meal-price {
  text-align: right;
  flex-shrink: 0;
}

.price-original {
  display: block;
  font-size: 0.75rem;
  color: #9ca3af;
  text-decoration: line-through;
  text-decoration-color: #ef4444;
}

.price-final {
  display: block;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
}

.price-final.has-discount {
  color: var(--color-primary);
}

/* Campaign Badge */
.meal-campaigns {
  margin-top: 0.5rem;
}

.campaign-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.dark .campaign-badge {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

/* Bottom Bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  z-index: 50;
}

.bottom-bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 32rem;
  margin: 0 auto;
}

.bottom-price {
  display: flex;
  flex-direction: column;
}

.bottom-price-label {
  font-size: 0.75rem;
  color: var(--color-text-sub);
}

.bottom-price-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}

.btn-continue {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
  transition: all 150ms ease;
}

.btn-continue:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0,0,0,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.lightbox-container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.lightbox-close {
  position: absolute;
  top: -3rem;
  right: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background 150ms ease;
  z-index: 10;
}

.lightbox-close:hover {
  background: rgba(255,255,255,0.2);
}

.lightbox-main {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

.lightbox-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 0.5rem;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 150ms ease;
}

.lightbox-nav:hover:not(:disabled) {
  background: rgba(255,255,255,0.2);
}

.lightbox-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.lightbox-prev {
  left: 0;
}

.lightbox-next {
  right: 0;
}

.lightbox-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  color: white;
}

.lightbox-room-name {
  font-size: 1rem;
  font-weight: 600;
}

.lightbox-counter {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.7);
}

.lightbox-thumbnails {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  padding-top: 0.5rem;
  overflow-x: auto;
}

.lightbox-thumb {
  width: 4rem;
  height: 3rem;
  flex-shrink: 0;
  padding: 0;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  overflow: hidden;
  opacity: 0.5;
  transition: all 150ms ease;
}

.lightbox-thumb:hover {
  opacity: 0.8;
}

.lightbox-thumb.is-active {
  border-color: white;
  opacity: 1;
}

.lightbox-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (min-width: 768px) {
  .lightbox-thumb {
    width: 5rem;
    height: 3.5rem;
  }

  .lightbox-prev {
    left: 1rem;
  }

  .lightbox-next {
    right: 1rem;
  }
}
</style>
