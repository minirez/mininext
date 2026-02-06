<template>
  <div class="search-view">
    <div class="search-view-header">
      <h2 class="search-view-title">{{ $t('widget.selectDates') }}</h2>
      <p class="search-view-subtitle">{{ $t('widget.selectDatesDescription') }}</p>
    </div>

    <!-- Hotel Info Card -->
    <div v-if="hotel" class="hotel-info-card">
      <img
        v-if="hotel.images?.[0]?.url"
        :src="hotel.images[0].url"
        :alt="hotelName"
        class="hotel-info-image"
      />
      <div class="hotel-info-content">
        <h3 class="hotel-info-name">{{ hotelName }}</h3>
        <div v-if="hotel.stars" class="hotel-info-stars">
          <WidgetIcon
            v-for="i in hotel.stars"
            :key="i"
            name="star-filled"
            :size="14"
            class="star-icon"
          />
        </div>
        <p v-if="hotelAddress" class="hotel-info-address">
          <WidgetIcon name="map-pin" :size="16" />
          {{ hotelAddress }}
        </p>
      </div>
    </div>

    <!-- Search Form -->
    <div class="search-form">
      <!-- Date Range -->
      <div class="search-form-section">
        <h3 class="search-form-section-title">
          <WidgetIcon name="calendar" :size="20" class="section-icon" />
          {{ $t('widget.dates') }}
        </h3>

        <div class="date-inputs">
          <div class="date-input-group">
            <label class="date-input-label">{{ $t('widget.checkIn') }}</label>
            <input
              type="date"
              :value="store.search.checkIn"
              :min="minDate"
              class="date-input"
              @change="updateCheckIn($event.target.value)"
            />
          </div>

          <div class="date-input-group">
            <label class="date-input-label">{{ $t('widget.checkOut') }}</label>
            <input
              type="date"
              :value="store.search.checkOut"
              :min="minCheckOut"
              class="date-input"
              @change="updateCheckOut($event.target.value)"
            />
          </div>
        </div>

        <p v-if="nights > 0" class="nights-display">
          <WidgetIcon name="moon" :size="16" />
          {{ nights }} {{ $t('widget.nights') }}
        </p>
      </div>

      <!-- Rooms & Guests -->
      <div class="search-form-section">
        <h3 class="search-form-section-title">
          <WidgetIcon name="users" :size="20" class="section-icon" />
          {{ $t('widget.roomsAndGuests') }}
        </h3>

        <div class="rooms-list">
          <div
            v-for="(room, index) in store.search.rooms"
            :key="index"
            class="room-config"
          >
            <div class="room-config-header">
              <span class="room-config-title">
                <WidgetIcon name="bed" :size="18" class="room-icon" />
                {{ $t('widget.room') }} {{ index + 1 }}
              </span>
              <button
                v-if="store.search.rooms.length > 1"
                class="room-remove-btn"
                @click="removeRoom(index)"
              >
                <WidgetIcon name="x" :size="14" />
              </button>
            </div>

            <div class="room-config-body">
              <!-- Adults -->
              <div class="guest-counter">
                <div class="guest-counter-info">
                  <span class="guest-counter-label">{{ $t('widget.adults') }}</span>
                  <span class="guest-counter-hint">18+</span>
                </div>
                <div class="guest-counter-controls">
                  <button
                    class="counter-btn"
                    :disabled="room.adults <= 1"
                    @click="updateAdults(index, room.adults - 1)"
                  >
                    <WidgetIcon name="minus" :size="16" />
                  </button>
                  <span class="counter-value">{{ room.adults }}</span>
                  <button
                    class="counter-btn"
                    :disabled="room.adults >= 6"
                    @click="updateAdults(index, room.adults + 1)"
                  >
                    <WidgetIcon name="plus" :size="16" />
                  </button>
                </div>
              </div>

              <!-- Children -->
              <div class="guest-counter">
                <div class="guest-counter-info">
                  <span class="guest-counter-label">{{ $t('widget.children') }}</span>
                  <span class="guest-counter-hint">0-17</span>
                </div>
                <div class="guest-counter-controls">
                  <button
                    class="counter-btn"
                    :disabled="room.children.length === 0"
                    @click="removeChild(index)"
                  >
                    <WidgetIcon name="minus" :size="16" />
                  </button>
                  <span class="counter-value">{{ room.children.length }}</span>
                  <button
                    class="counter-btn"
                    :disabled="room.children.length >= 4"
                    @click="addChild(index)"
                  >
                    <WidgetIcon name="plus" :size="16" />
                  </button>
                </div>
              </div>

              <!-- Child Ages -->
              <div v-if="room.children.length > 0" class="child-ages">
                <div
                  v-for="(age, childIndex) in room.children"
                  :key="childIndex"
                  class="child-age-input"
                >
                  <label>{{ $t('widget.childAge', { n: childIndex + 1 }) }}</label>
                  <select
                    :value="age"
                    class="age-select"
                    @change="updateChildAge(index, childIndex, Number($event.target.value))"
                  >
                    <option v-for="a in 18" :key="a - 1" :value="a - 1">
                      {{ a - 1 }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Room Button -->
          <button
            v-if="store.search.rooms.length < 5"
            class="add-room-btn"
            @click="addRoom"
          >
            <WidgetIcon name="plus" :size="18" />
            {{ $t('widget.addRoom') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Search Button -->
    <div class="search-action">
      <button
        class="search-btn"
        :disabled="!canSearch || isLoading"
        @click="handleSearch"
      >
        <Spinner v-if="isLoading" size="sm" color="white" />
        <template v-else>
          <WidgetIcon name="search" :size="20" />
          {{ $t('widget.searchAvailability') }}
        </template>
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="search-error">
      <WidgetIcon name="alert-circle" :size="20" />
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Spinner from '@/components/ui/feedback/Spinner.vue'
import WidgetIcon from '../components/WidgetIcon.vue'

const store = inject('widgetStore')
const api = inject('widgetApi')
const router = useRouter()
const { t, locale } = useI18n()

const isLoading = ref(false)
const error = ref(null)

// Hotel info
const hotel = computed(() => store.hotel)
const hotelName = computed(() => {
  const name = hotel.value?.name
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
})

const hotelAddress = computed(() => {
  const address = hotel.value?.address
  if (!address) return ''
  const parts = [address.city, address.country].filter(Boolean)
  return parts.join(', ')
})

// Date constraints
const minDate = computed(() => {
  const today = new Date()
  return formatDate(today)
})

const minCheckOut = computed(() => {
  if (!store.search.checkIn) return minDate.value
  const checkIn = new Date(store.search.checkIn)
  checkIn.setDate(checkIn.getDate() + 1)
  return formatDate(checkIn)
})

const nights = computed(() => store.nights)

const canSearch = computed(() => store.canProceedToRooms)

// Methods
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function updateCheckIn(value) {
  store.updateSearch({ checkIn: value })

  if (store.search.checkOut && value >= store.search.checkOut) {
    const newCheckOut = new Date(value)
    newCheckOut.setDate(newCheckOut.getDate() + 1)
    store.updateSearch({ checkOut: formatDate(newCheckOut) })
  }
}

function updateCheckOut(value) {
  store.updateSearch({ checkOut: value })
}

function updateAdults(roomIndex, value) {
  store.updateRoomOccupancy(roomIndex, 'adults', value)
}

function addChild(roomIndex) {
  const room = store.search.rooms[roomIndex]
  if (room.children.length < 4) {
    store.updateRoomOccupancy(roomIndex, 'children', [...room.children, 5])
  }
}

function removeChild(roomIndex) {
  const room = store.search.rooms[roomIndex]
  if (room.children.length > 0) {
    const newChildren = [...room.children]
    newChildren.pop()
    store.updateRoomOccupancy(roomIndex, 'children', newChildren)
  }
}

function updateChildAge(roomIndex, childIndex, age) {
  const room = store.search.rooms[roomIndex]
  const newChildren = [...room.children]
  newChildren[childIndex] = age
  store.updateRoomOccupancy(roomIndex, 'children', newChildren)
}

function addRoom() {
  store.addRoom()
}

function removeRoom(index) {
  store.removeRoom(index)
}

async function handleSearch() {
  if (!canSearch.value) return

  isLoading.value = true
  error.value = null

  try {
    // Prepare search params for each room
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

    // API returns { hotel, search, results: [...] }
    if (results && results.results?.length > 0) {
      store.setSearchResults({
        available: true,
        roomTypes: results.results,
        error: null
      })

      // Navigate to rooms
      router.push({ name: 'widget-rooms' })
    } else {
      store.setSearchResults({
        available: false,
        roomTypes: [],
        error: t('widget.noAvailability')
      })
      error.value = t('widget.noAvailability')
    }
  } catch (err) {
    error.value = err.message || t('widget.searchError')
    store.setSearchResults({
      available: false,
      roomTypes: [],
      error: err.message
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.search-view {
  max-width: 600px;
  margin: 0 auto;
}

.search-view-header {
  text-align: center;
  margin-bottom: 2rem;
}

.search-view-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

:deep(.dark) .search-view-title {
  color: white;
}

.search-view-subtitle {
  color: #6b7280;
  font-size: 0.9375rem;
}

/* Hotel Info Card */
.hotel-info-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

:deep(.dark) .hotel-info-card {
  background: #1f2937;
}

.hotel-info-image {
  width: 100px;
  height: 80px;
  object-fit: cover;
  border-radius: 0.5rem;
}

.hotel-info-content {
  flex: 1;
}

.hotel-info-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

:deep(.dark) .hotel-info-name {
  color: white;
}

.hotel-info-stars {
  display: flex;
  gap: 0.125rem;
  margin-bottom: 0.5rem;
}

.star-icon {
  color: #fbbf24;
}

.hotel-info-address {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Search Form */
.search-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-form-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
}

:deep(.dark) .search-form-section {
  background: #1f2937;
  border-color: #374151;
}

.search-form-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

:deep(.dark) .search-form-section-title {
  color: white;
}

.section-icon {
  color: var(--widget-primary, #7c3aed);
}

/* Date Inputs */
.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.date-input-group {
  display: flex;
  flex-direction: column;
}

.date-input-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.375rem;
}

.date-input {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  background: white;
  color: #111827;
}

.date-input:focus {
  outline: none;
  border-color: var(--widget-primary, #7c3aed);
  box-shadow: 0 0 0 3px var(--widget-primary-100, #f3e8ff);
}

:deep(.dark) .date-input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.nights-display {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--widget-primary, #7c3aed);
  font-weight: 500;
}

/* Rooms List */
.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-config {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

:deep(.dark) .room-config {
  border-color: #374151;
}

.room-config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.dark) .room-config-header {
  background: #374151;
  border-bottom-color: #4b5563;
}

.room-config-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  color: #111827;
}

:deep(.dark) .room-config-title {
  color: white;
}

.room-icon {
  color: var(--widget-primary, #7c3aed);
}

.room-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 150ms ease;
}

.room-remove-btn:hover {
  background: #fecaca;
}

.room-config-body {
  padding: 1rem;
}

/* Guest Counter */
.guest-counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
}

.guest-counter:not(:last-child) {
  border-bottom: 1px solid #f3f4f6;
}

:deep(.dark) .guest-counter:not(:last-child) {
  border-bottom-color: #374151;
}

.guest-counter-info {
  display: flex;
  flex-direction: column;
}

.guest-counter-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #111827;
}

:deep(.dark) .guest-counter-label {
  color: white;
}

.guest-counter-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.guest-counter-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.counter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 150ms ease;
}

.counter-btn:hover:not(:disabled) {
  border-color: var(--widget-primary, #7c3aed);
  color: var(--widget-primary, #7c3aed);
}

.counter-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

:deep(.dark) .counter-btn {
  background: #374151;
  border-color: #4b5563;
  color: #d1d5db;
}

.counter-value {
  min-width: 1.5rem;
  text-align: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

:deep(.dark) .counter-value {
  color: white;
}

/* Child Ages */
.child-ages {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #e5e7eb;
}

:deep(.dark) .child-ages {
  border-top-color: #374151;
}

.child-age-input {
  flex: 1;
  min-width: 100px;
}

.child-age-input label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.375rem;
}

.age-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  color: #111827;
}

:deep(.dark) .age-select {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

/* Add Room Button */
.add-room-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  background: transparent;
  color: #6b7280;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
}

.add-room-btn:hover {
  border-color: var(--widget-primary, #7c3aed);
  color: var(--widget-primary, #7c3aed);
}

/* Search Action */
.search-action {
  margin-top: 1.5rem;
}

.search-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: var(--widget-primary, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1.0625rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.search-btn:hover:not(:disabled) {
  background: var(--widget-primary-600, #9333ea);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Error */
.search-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.875rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 0.9375rem;
}
</style>
