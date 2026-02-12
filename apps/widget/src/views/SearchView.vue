<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWidgetStore } from '../stores/widget'
import { useTranslation } from '../composables/useTranslation'
import DateRangePicker from '../components/DateRangePicker.vue'

const widgetStore = useWidgetStore()
const { t } = useTranslation()

const checkIn = computed({
  get: () => widgetStore.searchParams.checkIn,
  set: val => (widgetStore.searchParams.checkIn = val)
})

const checkOut = computed({
  get: () => widgetStore.searchParams.checkOut,
  set: val => (widgetStore.searchParams.checkOut = val)
})

const adults = computed({
  get: () => widgetStore.searchParams.adults,
  set: val => (widgetStore.searchParams.adults = parseInt(val))
})

const childrenCount = ref(widgetStore.searchParams.children?.length || 0)
const childAges = ref([...widgetStore.searchParams.children])
const showGuestSelector = ref(false)

const isLoading = computed(() => widgetStore.isLoading)
const errorMessage = computed(() => widgetStore.error)
const hotelInfo = computed(() => widgetStore.hotelInfo)

// Booking rules: min/max advance days
const widgetConfig = computed(() => widgetStore.widgetConfig)

const minDate = computed(() => {
  const today = new Date()
  const days = widgetConfig.value?.minAdvanceBookingDays || 0
  if (days > 0) today.setDate(today.getDate() + days)
  return today.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const days = widgetConfig.value?.maxAdvanceBookingDays
  if (!days) return null
  const today = new Date()
  today.setDate(today.getDate() + days)
  return today.toISOString().split('T')[0]
})

// Guest summary text
const guestSummary = computed(() => {
  let text = `${adults.value} ${t('search.adultLabel')}`
  if (childrenCount.value > 0) {
    text += `, ${childrenCount.value} ${t('search.childLabel')}`
  }
  return text
})

function updateAdults(delta) {
  const newVal = adults.value + delta
  if (newVal >= 1 && newVal <= 10) {
    adults.value = newVal
  }
}

function updateChildren(delta) {
  const newCount = childrenCount.value + delta
  if (newCount >= 0 && newCount <= 6) {
    childrenCount.value = newCount
    while (childAges.value.length < newCount) {
      childAges.value.push(0)
    }
    childAges.value = childAges.value.slice(0, newCount)
    widgetStore.searchParams.children = [...childAges.value]
  }
}

function updateChildAge(index, age) {
  childAges.value[index] = parseInt(age)
  widgetStore.searchParams.children = [...childAges.value]
}

async function search() {
  await widgetStore.search()
}

// Set default dates if not set
onMounted(() => {
  if (!checkIn.value) {
    const minDays = widgetConfig.value?.minAdvanceBookingDays || 0
    const start = new Date()
    start.setDate(start.getDate() + Math.max(minDays, 1))
    checkIn.value = start.toISOString().split('T')[0]
  }
  if (!checkOut.value) {
    const checkout = new Date(checkIn.value)
    checkout.setDate(checkout.getDate() + 2)
    checkOut.value = checkout.toISOString().split('T')[0]
  }
})
</script>

<template>
  <div class="search-view">
    <!-- Hotel Hero Card -->
    <div v-if="hotelInfo?.images?.length" class="hero-card">
      <img
        :src="widgetStore.resolveAssetUrl(hotelInfo.images[0].url || hotelInfo.images[0])"
        :alt="hotelInfo.name"
      />
      <div class="hero-overlay">
        <h2 class="hero-title">{{ hotelInfo.name }}</h2>
        <p v-if="hotelInfo.location?.city" class="hero-location">
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {{ hotelInfo.location.city
          }}{{ hotelInfo.location.country ? `, ${hotelInfo.location.country}` : '' }}
        </p>
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

    <form @submit.prevent="search" class="search-form">
      <!-- Date Selection -->
      <div class="form-group">
        <label class="form-label">{{ t('search.dates') }}</label>
        <DateRangePicker
          :check-in="checkIn"
          :check-out="checkOut"
          :min-date="minDate"
          :max-date="maxDate"
          @update:check-in="val => (checkIn = val)"
          @update:check-out="val => (checkOut = val)"
        />
      </div>

      <!-- Guest Selector -->
      <div class="form-group">
        <label class="form-label">{{ t('search.guests') }}</label>
        <div
          :class="['guest-selector', { open: showGuestSelector }]"
          @click="showGuestSelector = !showGuestSelector"
        >
          <div class="guest-selector-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span class="guest-selector-text">{{ guestSummary }}</span>
          </div>
          <svg
            class="guest-selector-arrow"
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
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <!-- Guest Controls Dropdown -->
        <div :class="['guest-controls', { show: showGuestSelector }]">
          <!-- Adults -->
          <div class="guest-row">
            <div>
              <div class="guest-row-label">{{ t('search.adultLabel') }}</div>
              <div class="guest-row-sublabel">{{ t('search.adultDesc') }}</div>
            </div>
            <div class="guest-counter">
              <button type="button" @click.stop="updateAdults(-1)" :disabled="adults <= 1">
                −
              </button>
              <span>{{ adults }}</span>
              <button type="button" @click.stop="updateAdults(1)" :disabled="adults >= 10">
                +
              </button>
            </div>
          </div>

          <!-- Children -->
          <div class="guest-row">
            <div>
              <div class="guest-row-label">{{ t('search.childLabel') }}</div>
              <div class="guest-row-sublabel">{{ t('search.childDesc') }}</div>
            </div>
            <div class="guest-counter">
              <button type="button" @click.stop="updateChildren(-1)" :disabled="childrenCount <= 0">
                −
              </button>
              <span>{{ childrenCount }}</span>
              <button type="button" @click.stop="updateChildren(1)" :disabled="childrenCount >= 6">
                +
              </button>
            </div>
          </div>

          <!-- Child Ages -->
          <div v-if="childrenCount > 0" class="child-ages-section">
            <div class="guest-row-label">{{ t('search.childAges') }}</div>
            <div class="child-ages-grid">
              <select
                v-for="(age, index) in childAges"
                :key="index"
                :value="age"
                @change="updateChildAge(index, $event.target.value)"
                @click.stop
                class="form-input child-age-select"
              >
                <option v-for="a in 18" :key="a - 1" :value="a - 1">
                  {{ a - 1 }} {{ t('search.ageLabel') }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Button -->
      <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="isLoading">
        <span v-if="isLoading" class="spinner"></span>
        <template v-else>
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
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          {{ t('search.searchButton') }}
        </template>
      </button>
    </form>
  </div>
</template>

<!-- All styles in widget.css for Shadow DOM compatibility -->
