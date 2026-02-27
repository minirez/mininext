<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ $t('migration.resMigration.title') }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
        {{ $t('migration.resMigration.description') }}
      </p>
    </div>

    <!-- Stepper -->
    <Stepper
      v-model="currentStep"
      :steps="steps"
      :clickable="false"
      :linear="true"
      :show-navigation="false"
      color="purple"
      class="mb-8"
    />

    <!-- Step 1: Mapping -->
    <div v-if="currentStep === 0" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: Partner Selection -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ $t('migration.resMigration.selectPartner') }}
          </h2>

          <input
            v-model="partnerSearch"
            type="text"
            class="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            :placeholder="$t('migration.resMigration.searchPartner')"
            @input="debouncedFetchPartners"
          />

          <div v-if="loadingPartners" class="flex justify-center py-8">
            <span class="material-icons animate-spin text-purple-600">refresh</span>
          </div>
          <div v-else-if="!partners.length" class="text-center py-8 text-gray-500">
            {{ $t('migration.resMigration.noPartners') }}
          </div>
          <div v-else class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="partner in partners"
              :key="partner._id"
              class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors"
              :class="
                selectedPartner?._id === partner._id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
              "
              @click="selectPartner(partner)"
            >
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ partner.companyName }}</p>
                <p v-if="partner.email" class="text-sm text-gray-500 dark:text-slate-400">
                  {{ partner.email }}
                </p>
              </div>
              <span
                v-if="selectedPartner?._id === partner._id"
                class="material-icons text-purple-600"
                >check_circle</span
              >
            </div>
          </div>
        </div>

        <!-- Right: Legacy Hotels with Mapping -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ $t('migration.resMigration.legacyHotels') }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
            {{ $t('migration.resMigration.legacyHotelsDesc') }}
          </p>

          <!-- Connection status -->
          <div
            v-if="connectingLegacy"
            class="flex items-center gap-2 py-8 justify-center text-gray-500"
          >
            <span class="material-icons animate-spin text-purple-600">refresh</span>
            {{ $t('migration.resMigration.connecting') }}
          </div>

          <!-- Loading legacy hotels -->
          <div v-else-if="loadingLegacyHotels" class="flex justify-center py-8">
            <span class="material-icons animate-spin text-purple-600">refresh</span>
            <span class="ml-2 text-gray-500">{{ $t('migration.resMigration.loadingLegacy') }}</span>
          </div>

          <!-- No hotels -->
          <div v-else-if="!legacyAccounts.length" class="text-center py-8 text-gray-500">
            {{ $t('migration.resMigration.noLegacyHotels') }}
          </div>

          <!-- Legacy hotels grouped by account -->
          <div v-else class="space-y-4 max-h-[500px] overflow-y-auto">
            <div v-for="account in legacyAccountsFiltered" :key="account.accountId">
              <h3
                class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2"
              >
                {{ account.accountName }}
              </h3>

              <div class="space-y-2">
                <div
                  v-for="hotel in account.hotels"
                  :key="account.accountId"
                  class="p-3 rounded-lg border border-gray-200 dark:border-slate-600"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <span class="font-medium text-gray-900 dark:text-white text-sm">
                        {{ hotel.hotelName || `Hotel #${hotel.legacyHotelId}` }}
                      </span>
                      <span class="ml-2 text-xs text-gray-400 dark:text-slate-500">
                        ({{ hotel.bookingCount }} {{ $t('migration.resMigration.bookings') }})
                      </span>
                    </div>
                  </div>

                  <!-- New hotel select -->
                  <select
                    v-model="hotelMappings[account.accountId]"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    :disabled="!selectedPartner || loadingNewHotels"
                  >
                    <option value="">
                      {{
                        loadingNewHotels
                          ? $t('migration.resMigration.loadingNewHotels')
                          : $t('migration.resMigration.selectHotel')
                      }}
                    </option>
                    <option v-for="nh in newHotels" :key="nh._id" :value="nh._id">
                      {{ nh.name }} ({{ nh.roomTypes.length }} RT / {{ nh.mealPlans.length }} MP)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Check-in date filter -->
      <div
        v-if="mappedCount > 0"
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="material-icons text-gray-400 text-sm">filter_alt</span>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
              {{ $t('migration.resMigration.minCheckInLabel') }}
            </label>
          </div>
          <input
            v-model="minCheckIn"
            type="date"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <span class="text-xs text-gray-400 dark:text-slate-500">
            {{ $t('migration.resMigration.minCheckInHint') }}
          </span>
          <button
            v-if="minCheckIn"
            class="text-xs text-red-500 hover:text-red-700 underline"
            @click="minCheckIn = ''"
          >
            {{ $t('common.clear') }}
          </button>
        </div>
      </div>

      <!-- Mapping summary & next button -->
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-slate-400">
          <span v-if="mappedCount > 0">
            {{ $t('migration.resMigration.mappedCount', { count: mappedCount }) }}
            &middot;
            {{ $t('migration.resMigration.totalBookings', { count: totalBookingsToMigrate }) }}
            <span v-if="minCheckIn" class="text-purple-600">
              &middot; {{ $t('migration.resMigration.filteredBy', { date: minCheckIn }) }}
            </span>
          </span>
        </div>
        <button
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          :disabled="mappedCount === 0"
          @click="goToConfirm"
        >
          {{ $t('migration.resMigration.steps.confirm') }}
          <span class="material-icons text-sm align-middle ml-1">arrow_forward</span>
        </button>
      </div>
    </div>

    <!-- Step 2: Confirm -->
    <div v-if="currentStep === 1" class="space-y-6">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ $t('migration.resMigration.confirmTitle') }}
        </h2>

        <div class="space-y-4">
          <div
            v-for="mapping in activeMappings"
            :key="mapping.legacyHotelId"
            class="p-4 rounded-lg border border-gray-200 dark:border-slate-600"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <span class="material-icons text-gray-400">hotel</span>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ mapping.legacyHotelName }}
                  </p>
                  <p class="text-xs text-gray-400">Legacy #{{ mapping.legacyHotelId }}</p>
                </div>
              </div>
              <span class="material-icons text-purple-500">arrow_forward</span>
              <div class="text-right">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ mapping.newHotelName }}
                </p>
                <p class="text-xs text-gray-400">
                  {{ mapping.bookingCount }} {{ $t('migration.resMigration.bookings') }}
                </p>
              </div>
            </div>

            <!-- Room type & meal plan auto-mapping preview -->
            <div
              class="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700"
            >
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase mb-1">
                  {{ $t('migration.resMigration.roomMapping') }}
                </p>
                <p class="text-sm text-gray-600 dark:text-slate-300">
                  {{ mapping.newHotel.roomTypes.length }}
                  {{ $t('migration.hotels.rooms') }}
                  <span class="text-green-500">{{ $t('migration.resMigration.autoMatched') }}</span>
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase mb-1">
                  {{ $t('migration.resMigration.mealPlanMapping') }}
                </p>
                <p class="text-sm text-gray-600 dark:text-slate-300">
                  {{ mapping.newHotel.mealPlans.length }}
                  {{ $t('migration.hotels.mealPlans') }}
                  <span class="text-green-500">{{ $t('migration.resMigration.autoMatched') }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-icons text-purple-600">summarize</span>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ $t('migration.resMigration.summary') }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">{{ $t('migration.migrate.totalHotels') }}:</span>
              <span class="ml-2 font-medium text-gray-900 dark:text-white">{{
                activeMappings.length
              }}</span>
            </div>
            <div>
              <span class="text-gray-500"
                >{{ $t('migration.resMigration.totalReservations') }}:</span
              >
              <span class="ml-2 font-medium text-gray-900 dark:text-white">{{
                totalBookingsToMigrate
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-between">
        <button
          class="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          @click="currentStep = 0"
        >
          <span class="material-icons text-sm align-middle mr-1">arrow_back</span>
          {{ $t('migration.resMigration.steps.mapping') }}
        </button>
        <button
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          @click="showConfirm = true"
        >
          <span class="material-icons text-sm align-middle mr-1">rocket_launch</span>
          {{ $t('migration.resMigration.startMigration') }}
        </button>
      </div>
    </div>

    <!-- Step 3: Progress -->
    <div v-if="currentStep === 2" class="space-y-6">
      <!-- Progress card per hotel -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            <span v-if="migrationStatus === 'running'">
              <span class="material-icons animate-spin text-purple-600 align-middle mr-2"
                >refresh</span
              >
              {{ $t('migration.resMigration.migrating') }}
            </span>
            <span v-else-if="migrationStatus === 'completed'" class="text-green-600">
              <span class="material-icons align-middle mr-2">check_circle</span>
              {{ $t('migration.resMigration.completed') }}
            </span>
            <span v-else-if="migrationStatus === 'failed'" class="text-red-600">
              <span class="material-icons align-middle mr-2">error</span>
              {{ $t('migration.resMigration.failed') }}
            </span>
            <span v-else-if="migrationStatus === 'partial'" class="text-amber-600">
              <span class="material-icons align-middle mr-2">warning</span>
              {{ $t('migration.resMigration.partial') }}
            </span>
          </h2>
        </div>

        <!-- Per-hotel progress -->
        <div class="space-y-3">
          <div
            v-for="(hp, idx) in hotelProgress"
            :key="idx"
            class="p-3 rounded-lg border"
            :class="
              hp.status === 'completed'
                ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20'
                : hp.status === 'failed'
                  ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20'
                  : hp.status === 'running'
                    ? 'border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-slate-600'
            "
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-sm text-gray-900 dark:text-white">
                {{ hp.hotelName }}
              </span>
              <span class="text-xs text-gray-500">
                <span v-if="hp.status === 'running'">
                  {{ hp.current }}/{{ hp.total }} {{ $t('migration.resMigration.processing') }}
                </span>
                <span v-else-if="hp.status === 'completed'" class="text-green-600">
                  {{ hp.migrated }} {{ $t('migration.migrate.progress.success') }}
                  <span v-if="hp.failed">
                    / {{ hp.failed }} {{ $t('migration.migrate.progress.failed') }}</span
                  >
                </span>
                <span v-else-if="hp.status === 'failed'" class="text-red-600">
                  {{ $t('migration.resMigration.failed') }}
                </span>
                <span v-else class="text-gray-400">
                  {{ $t('migration.migrate.progress.waiting') }}
                </span>
              </span>
            </div>

            <!-- Progress bar -->
            <div
              v-if="hp.status === 'running' || hp.status === 'completed'"
              class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2"
            >
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="hp.status === 'completed' ? 'bg-green-500' : 'bg-purple-500'"
                :style="{
                  width: hp.total > 0 ? `${Math.round((hp.current / hp.total) * 100)}%` : '0%'
                }"
              />
            </div>
          </div>
        </div>

        <!-- Final summary -->
        <div
          v-if="migrationStatus !== 'running'"
          class="mt-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg"
        >
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ finalSummary.totalReservations }}
              </p>
              <p class="text-xs text-gray-500">
                {{ $t('migration.resMigration.totalReservations') }}
              </p>
            </div>
            <div>
              <p class="text-2xl font-bold text-green-600">
                {{ finalSummary.migratedReservations }}
              </p>
              <p class="text-xs text-gray-500">{{ $t('migration.resMigration.migrated') }}</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-red-600">{{ finalSummary.failedReservations }}</p>
              <p class="text-xs text-gray-500">{{ $t('migration.resMigration.failedCount') }}</p>
            </div>
          </div>
        </div>

        <!-- Errors -->
        <div v-if="allErrors.length" class="mt-4">
          <details class="group">
            <summary class="cursor-pointer text-sm font-medium text-red-600 hover:text-red-700">
              <span class="material-icons text-sm align-middle mr-1">error_outline</span>
              {{ $t('migration.resMigration.errors') }} ({{ allErrors.length }})
            </summary>
            <div class="mt-2 max-h-48 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <p
                v-for="(err, i) in allErrors"
                :key="i"
                class="text-xs text-red-600 dark:text-red-400 mb-1"
              >
                {{ err }}
              </p>
            </div>
          </details>
        </div>
      </div>

      <!-- New migration button -->
      <div v-if="migrationStatus !== 'running'" class="flex justify-center">
        <button
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          @click="resetWizard"
        >
          <span class="material-icons text-sm align-middle mr-1">replay</span>
          {{ $t('migration.resMigration.newMigration') }}
        </button>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model="showConfirm"
      type="info"
      icon="import_export"
      :title="$t('migration.resMigration.confirmTitle')"
      :message="$t('migration.resMigration.confirmMessage')"
      :confirm-text="$t('migration.resMigration.startMigration')"
      :cancel-text="$t('common.cancel')"
      @confirm="doStartMigration"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Stepper from '@/components/ui/navigation/Stepper.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import migrationService from '@/services/migrationService'
import partnerService from '@/services/partnerService'
import { useSocket } from '@/composables/useSocket'

const { t } = useI18n()
const { join, leave, on } = useSocket()

// Stepper
const currentStep = ref(0)
const steps = computed(() => [
  { label: t('migration.resMigration.steps.mapping'), icon: 'link' },
  { label: t('migration.resMigration.steps.confirm'), icon: 'checklist' },
  { label: t('migration.resMigration.steps.progress'), icon: 'rocket_launch' }
])

// Partners
const partners = ref([])
const selectedPartner = ref(null)
const partnerSearch = ref('')
const loadingPartners = ref(false)
let partnerSearchTimer = null

// Legacy hotels
const legacyAccounts = ref([])
const loadingLegacyHotels = ref(false)
const connectingLegacy = ref(false)

// New hotels
const newHotels = ref([])
const loadingNewHotels = ref(false)

// Mappings: { legacyHotelId: newHotelId }
const hotelMappings = ref({})

// Check-in date filter
const minCheckIn = ref('')

// Confirm
const showConfirm = ref(false)

// Progress
const operationId = ref(null)
const migrationStatus = ref('running')
const hotelProgress = ref([])
const finalSummary = ref({ totalReservations: 0, migratedReservations: 0, failedReservations: 0 })
const allErrors = ref([])
const socketHandlers = ref({})

// Computed
const legacyAccountsFiltered = computed(() => {
  return legacyAccounts.value.filter(a => a.hotels && a.hotels.length > 0)
})

const mappedCount = computed(() => {
  return Object.values(hotelMappings.value).filter(v => v).length
})

const totalBookingsToMigrate = computed(() => {
  let total = 0
  for (const account of legacyAccounts.value) {
    if (hotelMappings.value[account.accountId]) {
      for (const hotel of account.hotels) {
        total += hotel.bookingCount
      }
    }
  }
  return total
})

const activeMappings = computed(() => {
  const result = []
  for (const account of legacyAccounts.value) {
    const newHotelId = hotelMappings.value[account.accountId]
    if (!newHotelId) continue
    const newHotel = newHotels.value.find(h => h._id === newHotelId)
    if (!newHotel) continue
    for (const hotel of account.hotels) {
      result.push({
        legacyHotelId: hotel.legacyHotelId,
        legacyHotelName: hotel.hotelName || `Hotel #${hotel.legacyHotelId}`,
        newHotelId,
        newHotelName: newHotel.name,
        newHotel,
        bookingCount: hotel.bookingCount,
        accountId: account.accountId
      })
    }
  }
  return result
})

// Methods
async function fetchPartners() {
  loadingPartners.value = true
  try {
    const params = { limit: 100 }
    if (partnerSearch.value) params.search = partnerSearch.value
    const res = await partnerService.getPartners(params)
    partners.value = res.data?.partners || []
  } catch {
    partners.value = []
  } finally {
    loadingPartners.value = false
  }
}

function debouncedFetchPartners() {
  clearTimeout(partnerSearchTimer)
  partnerSearchTimer = setTimeout(fetchPartners, 300)
}

async function selectPartner(partner) {
  selectedPartner.value = partner
  hotelMappings.value = {}
  loadingNewHotels.value = true
  try {
    const res = await migrationService.getNewSystemHotels(partner._id)
    newHotels.value = res.data || []
  } catch {
    newHotels.value = []
  } finally {
    loadingNewHotels.value = false
  }
}

async function fetchLegacyHotels() {
  // First ensure legacy connection
  connectingLegacy.value = true
  try {
    const status = await migrationService.getStatus()
    if (!status.data?.connected) {
      await migrationService.connectLegacy()
    }
  } catch {
    // Connection might already exist
  } finally {
    connectingLegacy.value = false
  }

  loadingLegacyHotels.value = true
  try {
    const res = await migrationService.getLegacyHotelsWithBookings()
    legacyAccounts.value = res.data || []
  } catch {
    legacyAccounts.value = []
  } finally {
    loadingLegacyHotels.value = false
  }
}

function goToConfirm() {
  if (mappedCount.value === 0) return
  currentStep.value = 1
}

async function doStartMigration() {
  showConfirm.value = false
  currentStep.value = 2
  migrationStatus.value = 'running'
  allErrors.value = []

  // Initialize hotel progress
  hotelProgress.value = activeMappings.value.map(m => ({
    hotelName: m.newHotelName,
    legacyHotelId: m.legacyHotelId,
    status: 'waiting',
    current: 0,
    total: m.bookingCount,
    migrated: 0,
    failed: 0
  }))

  const payload = {
    partnerId: selectedPartner.value._id,
    hotelMappings: activeMappings.value.map(m => ({
      legacyHotelId: m.legacyHotelId,
      newHotelId: m.newHotelId,
      accountId: m.accountId
    })),
    ...(minCheckIn.value ? { minCheckIn: minCheckIn.value } : {})
  }

  try {
    const res = await migrationService.startReservationMigration(payload)
    operationId.value = res.data.operationId

    // Join socket room
    join(operationId.value)
    setupSocketListeners(operationId.value)
  } catch (err) {
    migrationStatus.value = 'failed'
    allErrors.value.push(err.response?.data?.message || err.message)
  }
}

function setupSocketListeners(opId) {
  socketHandlers.value.started = on('resmig:started', data => {
    if (data.operationId !== opId) return
  })

  socketHandlers.value.hotelStart = on('resmig:hotel:start', data => {
    if (data.operationId !== opId) return
    const hp = hotelProgress.value[data.hotelIndex]
    if (hp) {
      hp.status = 'running'
      hp.hotelName = data.hotelName || hp.hotelName
    }
  })

  socketHandlers.value.hotelProgress = on('resmig:hotel:progress', data => {
    if (data.operationId !== opId) return
    const hp = hotelProgress.value[data.hotelIndex]
    if (hp) {
      hp.current = data.current
      hp.total = data.total
      hp.migrated = data.migrated
    }
  })

  socketHandlers.value.hotelComplete = on('resmig:hotel:complete', data => {
    if (data.operationId !== opId) return
    const hp = hotelProgress.value[data.hotelIndex]
    if (hp) {
      hp.status = data.status === 'success' ? 'completed' : 'failed'
      if (data.stats) {
        hp.current = data.stats.total
        hp.total = data.stats.total
        hp.migrated = data.stats.migrated
        hp.failed = data.stats.failed
      }
      if (data.errors?.length) {
        allErrors.value.push(...data.errors)
      }
    }
  })

  socketHandlers.value.complete = on('resmig:complete', data => {
    if (data.operationId !== opId) return
    migrationStatus.value = data.status
    finalSummary.value = data.summary || finalSummary.value
    cleanupSocket()
  })
}

function cleanupSocket() {
  if (operationId.value) {
    leave(operationId.value)
  }
  Object.values(socketHandlers.value).forEach(unsub => {
    if (typeof unsub === 'function') unsub()
  })
  socketHandlers.value = {}
}

function resetWizard() {
  currentStep.value = 0
  hotelMappings.value = {}
  minCheckIn.value = ''
  migrationStatus.value = 'running'
  hotelProgress.value = []
  finalSummary.value = { totalReservations: 0, migratedReservations: 0, failedReservations: 0 }
  allErrors.value = []
  operationId.value = null
}

// Lifecycle
onMounted(() => {
  fetchPartners()
  fetchLegacyHotels()
})

onUnmounted(() => {
  cleanupSocket()
  clearTimeout(partnerSearchTimer)
})
</script>
