<template>
  <div class="compact-search">
    <!-- Date Range -->
    <div class="compact-search-field">
      <label class="compact-search-label">
        <WidgetIcon name="calendar" :size="16" />
        {{ $t('widget.checkIn') }} - {{ $t('widget.checkOut') }}
      </label>
      <div class="compact-search-dates">
        <input
          type="date"
          :value="store.search.checkIn"
          :min="minDate"
          class="compact-date-input"
          @change="updateCheckIn($event.target.value)"
        />
        <span class="compact-date-separator">→</span>
        <input
          type="date"
          :value="store.search.checkOut"
          :min="minCheckOut"
          class="compact-date-input"
          @change="updateCheckOut($event.target.value)"
        />
      </div>
      <span v-if="nights > 0" class="compact-nights">
        {{ nights }} {{ $t('widget.nights') }}
      </span>
    </div>

    <!-- Guests -->
    <div class="compact-search-field">
      <label class="compact-search-label">
        <WidgetIcon name="users" :size="16" />
        {{ $t('widget.guests') }}
      </label>
      <button
        class="compact-guests-button"
        @click="toggleGuestSelector"
      >
        <span>
          {{ totalAdults }} {{ $t('widget.adults') }}
          <template v-if="totalChildren > 0">
            , {{ totalChildren }} {{ $t('widget.children') }}
          </template>
        </span>
        <WidgetIcon name="chevron-down" :size="16" />
      </button>

      <!-- Guest Selector Dropdown -->
      <Transition name="dropdown">
        <div v-if="showGuestSelector" class="compact-guest-dropdown">
          <div
            v-for="(room, index) in store.search.rooms"
            :key="index"
            class="compact-room-row"
          >
            <div class="compact-room-header">
              <span class="compact-room-title">
                {{ $t('widget.room') }} {{ index + 1 }}
              </span>
              <button
                v-if="store.search.rooms.length > 1"
                class="compact-remove-room"
                @click="removeRoom(index)"
              >
                <WidgetIcon name="x" :size="14" />
              </button>
            </div>

            <!-- Adults -->
            <div class="compact-guest-row">
              <span class="compact-guest-label">{{ $t('widget.adults') }}</span>
              <div class="compact-counter">
                <button
                  class="compact-counter-btn"
                  :disabled="room.adults <= 1"
                  @click="updateAdults(index, room.adults - 1)"
                >
                  <WidgetIcon name="minus" :size="14" />
                </button>
                <span class="compact-counter-value">{{ room.adults }}</span>
                <button
                  class="compact-counter-btn"
                  :disabled="room.adults >= 4"
                  @click="updateAdults(index, room.adults + 1)"
                >
                  <WidgetIcon name="plus" :size="14" />
                </button>
              </div>
            </div>

            <!-- Children -->
            <div class="compact-guest-row">
              <span class="compact-guest-label">{{ $t('widget.children') }}</span>
              <div class="compact-counter">
                <button
                  class="compact-counter-btn"
                  :disabled="room.children.length === 0"
                  @click="removeChild(index)"
                >
                  <WidgetIcon name="minus" :size="14" />
                </button>
                <span class="compact-counter-value">{{ room.children.length }}</span>
                <button
                  class="compact-counter-btn"
                  :disabled="room.children.length >= 3"
                  @click="addChild(index)"
                >
                  <WidgetIcon name="plus" :size="14" />
                </button>
              </div>
            </div>

            <!-- Child Ages -->
            <div v-if="room.children.length > 0" class="compact-child-ages">
              <div
                v-for="(age, childIndex) in room.children"
                :key="childIndex"
                class="compact-age-select"
              >
                <label>{{ $t('widget.childAge', { n: childIndex + 1 }) }}</label>
                <select
                  :value="age"
                  @change="updateChildAge(index, childIndex, Number($event.target.value))"
                >
                  <option v-for="a in 18" :key="a - 1" :value="a - 1">
                    {{ a - 1 }} {{ $t('widget.yearsOld') }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Add Room -->
          <button
            v-if="store.search.rooms.length < 5"
            class="compact-add-room"
            @click="addRoom"
          >
            <WidgetIcon name="plus" :size="16" />
            {{ $t('widget.addRoom') }}
          </button>

          <!-- Done Button -->
          <button class="compact-done-btn" @click="showGuestSelector = false">
            {{ $t('common.done') }}
          </button>
        </div>
      </Transition>
    </div>

    <!-- Search Button -->
    <button
      class="compact-search-button"
      :disabled="!canSearch"
      @click="handleSearch"
    >
      <WidgetIcon name="search" :size="18" />
      <span>{{ $t('widget.search') }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import WidgetIcon from './WidgetIcon.vue'

const emit = defineEmits(['search'])
const store = inject('widgetStore')
const { t } = useI18n()

const showGuestSelector = ref(false)

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

// Computed
const nights = computed(() => store.nights)
const totalAdults = computed(() => store.totalAdults)
const totalChildren = computed(() => store.totalChildren)

const canSearch = computed(() => {
  return store.search.checkIn &&
         store.search.checkOut &&
         nights.value > 0 &&
         nights.value <= 30
})

// Methods
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function updateCheckIn(value) {
  store.updateSearch({ checkIn: value })

  // Adjust checkout if needed
  if (store.search.checkOut && value >= store.search.checkOut) {
    const newCheckOut = new Date(value)
    newCheckOut.setDate(newCheckOut.getDate() + 1)
    store.updateSearch({ checkOut: formatDate(newCheckOut) })
  }
}

function updateCheckOut(value) {
  store.updateSearch({ checkOut: value })
}

function toggleGuestSelector() {
  showGuestSelector.value = !showGuestSelector.value
}

function updateAdults(roomIndex, value) {
  store.updateRoomOccupancy(roomIndex, 'adults', value)
}

function addChild(roomIndex) {
  const room = store.search.rooms[roomIndex]
  if (room.children.length < 3) {
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

function handleSearch() {
  if (canSearch.value) {
    emit('search')
  }
}

// Close dropdown on outside click
function handleClickOutside(e) {
  if (!e.target.closest('.compact-search-field')) {
    showGuestSelector.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.compact-search {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

:deep(.dark) .compact-search {
  background: #1f2937;
}

@media (min-width: 768px) {
  .compact-search {
    flex-direction: row;
    align-items: flex-end;
  }
}

.compact-search-field {
  flex: 1;
  position: relative;
}

.compact-search-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.compact-search-dates {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.compact-date-input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  color: #111827;
}

:deep(.dark) .compact-date-input {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.compact-date-separator {
  color: #9ca3af;
}

.compact-nights {
  display: block;
  font-size: 0.75rem;
  color: var(--widget-primary, #7c3aed);
  margin-top: 0.25rem;
}

.compact-guests-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  color: #111827;
  cursor: pointer;
  transition: border-color 150ms ease;
}

.compact-guests-button:hover {
  border-color: var(--widget-primary, #7c3aed);
}

:deep(.dark) .compact-guests-button {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

/* Guest Selector Dropdown */
.compact-guest-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  z-index: 100;
  padding: 1rem;
}

:deep(.dark) .compact-guest-dropdown {
  background: #1f2937;
  border-color: #374151;
}

.compact-room-row {
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.dark) .compact-room-row {
  border-bottom-color: #374151;
}

.compact-room-row:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.compact-room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.compact-room-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #111827;
}

:deep(.dark) .compact-room-title {
  color: white;
}

.compact-remove-room {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  border-radius: 9999px;
  cursor: pointer;
}

.compact-guest-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.compact-guest-label {
  font-size: 0.875rem;
  color: #374151;
}

:deep(.dark) .compact-guest-label {
  color: #d1d5db;
}

.compact-counter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.compact-counter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 150ms ease;
}

.compact-counter-btn:hover:not(:disabled) {
  border-color: var(--widget-primary, #7c3aed);
  color: var(--widget-primary, #7c3aed);
}

.compact-counter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.dark) .compact-counter-btn {
  background: #374151;
  border-color: #4b5563;
  color: #d1d5db;
}

.compact-counter-value {
  min-width: 1.5rem;
  text-align: center;
  font-weight: 600;
  color: #111827;
}

:deep(.dark) .compact-counter-value {
  color: white;
}

/* Child Ages */
.compact-child-ages {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e5e7eb;
}

:deep(.dark) .compact-child-ages {
  border-top-color: #374151;
}

.compact-age-select {
  flex: 1;
  min-width: 80px;
}

.compact-age-select label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.compact-age-select select {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  background: white;
  color: #111827;
}

:deep(.dark) .compact-age-select select {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.compact-add-room {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem;
  border: 1px dashed #d1d5db;
  border-radius: 0.5rem;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 150ms ease;
  margin-top: 1rem;
}

.compact-add-room:hover {
  border-color: var(--widget-primary, #7c3aed);
  color: var(--widget-primary, #7c3aed);
}

.compact-done-btn {
  width: 100%;
  padding: 0.625rem;
  background: var(--widget-primary, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
}

/* Search Button */
.compact-search-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: var(--widget-primary, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
  white-space: nowrap;
}

.compact-search-button:hover:not(:disabled) {
  background: var(--widget-primary-600, #9333ea);
}

.compact-search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 150ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
