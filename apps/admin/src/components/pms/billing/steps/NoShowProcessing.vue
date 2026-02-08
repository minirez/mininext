<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-2xl text-red-600 dark:text-red-400">person_off</span>
      </div>
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ $t('billing.nightAudit.noShow.title') }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('billing.nightAudit.noShow.description') }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    </div>

    <!-- No No-Shows -->
    <div
      v-else-if="noShows.length === 0"
      class="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-3xl text-green-600 dark:text-green-400">celebration</span>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
        {{ $t('billing.nightAudit.noShow.great') }}!
      </h3>
      <p class="text-gray-500 dark:text-slate-400">
        {{ $t('billing.nightAudit.noShow.noNoShows') }}
      </p>
    </div>

    <!-- No-Show List -->
    <div v-else class="space-y-4">
      <!-- Quick Actions -->
      <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ processedCount }} / {{ noShows.length }}
          {{ $t('billing.nightAudit.noShow.processed') }}
        </span>
        <div class="flex items-center gap-2">
          <button
            :disabled="allProcessed"
            class="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="markAllNoShow"
          >
            {{ $t('billing.nightAudit.noShow.markAllNoShow') }}
          </button>
          <button
            :disabled="allProcessed"
            class="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="skipAll"
          >
            {{ $t('billing.nightAudit.noShow.skipAll') }}
          </button>
        </div>
      </div>

      <!-- Reservation Cards -->
      <TransitionGroup name="list" tag="div" class="space-y-4">
        <div
          v-for="noShow in noShows"
          :key="noShow.booking"
          class="bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300"
          :class="getCardClass(noShow)"
        >
          <div class="p-4">
            <div class="flex items-start justify-between gap-4">
              <!-- Guest Info -->
              <div class="flex items-start gap-3 min-w-0">
                <div
                  class="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0"
                >
                  <span class="text-lg font-medium text-gray-600 dark:text-gray-400">
                    {{ getInitials(noShow.guestName) }}
                  </span>
                </div>
                <div class="min-w-0">
                  <h4 class="font-medium text-gray-900 dark:text-white truncate">
                    {{ noShow.guestName }}
                  </h4>
                  <p class="text-sm text-gray-500 dark:text-slate-400">
                    {{ noShow.bookingNumber }}
                  </p>
                  <div class="flex flex-wrap items-center gap-2 mt-2">
                    <span class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">
                      {{ noShow.roomCount }} {{ $t('billing.nightAudit.noShow.rooms') }}
                    </span>
                    <span class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">
                      {{ noShow.nights }} {{ $t('billing.nightAudit.noShow.nights') }}
                    </span>
                    <span
                      class="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded"
                    >
                      {{ formatCurrency(noShow.totalAmount) }}
                    </span>
                    <span
                      v-if="noShow.source"
                      class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                    >
                      {{ noShow.source }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Status Badge -->
              <div v-if="actions[noShow.booking]" class="flex-shrink-0">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getActionBadgeClass(actions[noShow.booking])"
                >
                  {{ getActionLabel(actions[noShow.booking]) }}
                </span>
              </div>
            </div>

            <!-- Guarantee Info -->
            <div
              v-if="noShow.guarantee"
              class="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700"
            >
              <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                <span class="material-icons text-base">credit_card</span>
                <span
                  >{{ $t('billing.nightAudit.noShow.guarantee') }}:
                  {{ getGuaranteeLabel(noShow.guarantee) }}</span
                >
              </div>
            </div>

            <!-- Action Buttons -->
            <div
              v-if="!actions[noShow.booking]"
              class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700"
            >
              <button
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                @click="setAction(noShow.booking, 'no_show')"
              >
                <span class="material-icons text-lg">person_off</span>
                No-Show
              </button>
              <button
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                @click="setAction(noShow.booking, 'extended')"
              >
                <span class="material-icons text-lg">schedule</span>
                {{ $t('billing.nightAudit.noShow.hold') }}
              </button>
              <button
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                @click="setAction(noShow.booking, 'cancelled')"
              >
                <span class="material-icons text-lg">cancel</span>
                {{ $t('common.cancel') }}
              </button>
              <button
                class="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm rounded-lg transition-colors"
                @click="setAction(noShow.booking, 'skipped')"
              >
                <span class="material-icons text-lg">skip_next</span>
              </button>
            </div>

            <!-- Undo Button -->
            <div
              v-else
              class="flex items-center justify-end mt-4 pt-4 border-t border-gray-100 dark:border-slate-700"
            >
              <button
                class="flex items-center gap-1 px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                @click="undoAction(noShow.booking)"
              >
                <span class="material-icons text-lg">undo</span>
                {{ $t('common.undo') }}
              </button>
            </div>
          </div>

          <!-- Charge Info (for no_show action) -->
          <div
            v-if="actions[noShow.booking] === 'no_show' && noShow.chargePolicy"
            class="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-900/30 rounded-b-xl"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="text-red-700 dark:text-red-400">
                {{ getChargePolicyLabel(noShow.chargePolicy) }}
              </span>
              <span class="font-medium text-red-700 dark:text-red-400">
                {{ formatCurrency(noShow.chargeAmount || 0) }}
              </span>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Actions -->
    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500 dark:text-slate-400">
          <template v-if="noShows.length > 0">
            {{ processedCount }} / {{ noShows.length }}
            {{ $t('billing.nightAudit.noShow.reservationsProcessed') }}
          </template>
          <template v-else>
            {{ $t('billing.nightAudit.noShow.noReservationsToProcess') }}
          </template>
        </p>

        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            @click="emit('back')"
          >
            <span class="material-icons">arrow_back</span>
            {{ $t('common.back') }}
          </button>

          <button
            :disabled="loading || completing || (noShows.length > 0 && !allProcessed)"
            class="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
            @click="handleContinue"
          >
            <span v-if="completing" class="material-icons animate-spin">refresh</span>
            {{ completing ? $t('common.saving') : $t('common.continue') }}
            <span v-if="!completing" class="material-icons">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import * as nightAuditService from '@/services/pms/nightAuditService'

const { t } = useI18n()

const props = defineProps({
  audit: {
    type: Object,
    required: true
  },
  hotelId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['complete', 'back', 'refresh'])

const toast = useToast()

// State
const loading = ref(true)
const completing = ref(false)
const noShows = ref([])
const actions = ref({})

// Computed
const processedCount = computed(() => {
  return Object.keys(actions.value).length
})

const allProcessed = computed(() => {
  return noShows.value.length > 0 && processedCount.value === noShows.value.length
})

// Methods
const formatCurrency = amount => {
  return nightAuditService.formatCurrency(amount)
}

const getInitials = name => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getCardClass = noShow => {
  const action = actions.value[noShow.booking]
  if (!action) {
    return 'border-gray-200 dark:border-slate-700'
  }
  switch (action) {
    case 'no_show':
      return 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
    case 'cancelled':
      return 'border-gray-300 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-700/30 opacity-75'
    case 'extended':
      return 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
    case 'skipped':
      return 'border-gray-200 dark:border-slate-700 opacity-60'
    default:
      return 'border-gray-200 dark:border-slate-700'
  }
}

const getActionBadgeClass = action => {
  switch (action) {
    case 'no_show':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'cancelled':
      return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400'
    case 'extended':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'skipped':
      return 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-500'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400'
  }
}

const getActionLabel = action => {
  const labels = {
    no_show: 'No-Show',
    cancelled: t('billing.nightAudit.noShow.cancelled'),
    extended: t('billing.nightAudit.noShow.holding'),
    skipped: t('billing.nightAudit.noShow.skipped')
  }
  return labels[action] || action
}

const getGuaranteeLabel = guarantee => {
  const labels = {
    credit_card: t('billing.nightAudit.noShow.guarantees.creditCard'),
    bank_transfer: t('billing.nightAudit.noShow.guarantees.bankTransfer'),
    deposit: t('billing.nightAudit.noShow.guarantees.deposit'),
    none: t('billing.nightAudit.noShow.guarantees.none')
  }
  return labels[guarantee] || guarantee
}

const getChargePolicyLabel = policy => {
  const labels = {
    none: t('billing.nightAudit.noShow.chargePolicy.none'),
    first_night: t('billing.nightAudit.noShow.chargePolicy.firstNight'),
    full_amount: t('billing.nightAudit.noShow.chargePolicy.fullAmount'),
    custom: t('billing.nightAudit.noShow.chargePolicy.custom')
  }
  return labels[policy] || policy
}

const setAction = (id, action) => {
  actions.value[id] = action
}

const undoAction = id => {
  delete actions.value[id]
}

const markAllNoShow = () => {
  noShows.value.forEach(noShow => {
    if (!actions.value[noShow.booking]) {
      actions.value[noShow.booking] = 'no_show'
    }
  })
}

const skipAll = () => {
  noShows.value.forEach(noShow => {
    if (!actions.value[noShow.booking]) {
      actions.value[noShow.booking] = 'skipped'
    }
  })
}

const fetchNoShows = async () => {
  if (!props.hotelId) return

  try {
    loading.value = true
    const response = await nightAuditService.getNoShows(props.hotelId)
    noShows.value = response.data?.noShows || []
  } catch (error) {
    console.error('Failed to fetch no-shows:', error)
    toast.error(t('billing.nightAudit.noShow.messages.loadFailed'))
  } finally {
    loading.value = false
  }
}

const handleContinue = async () => {
  if (noShows.value.length > 0 && !allProcessed.value) {
    toast.warning(t('billing.nightAudit.noShow.messages.processAll'))
    return
  }

  try {
    completing.value = true

    // Prepare actions data
    const actionsData = Object.entries(actions.value).map(([bookingId, action]) => {
      const noShow = noShows.value.find(n => n.booking === bookingId)
      return {
        bookingId,
        action,
        chargeType: action === 'no_show' ? noShow?.chargePolicy || 'first_night' : 'none',
        chargeAmount: action === 'no_show' ? noShow?.chargeAmount || 0 : 0
      }
    })

    await nightAuditService.processNoShows(props.hotelId, actionsData)
    emit('complete')
  } catch (error) {
    console.error('Failed to process no-shows:', error)
    toast.error(error.response?.data?.message || t('billing.nightAudit.noShow.messages.saveFailed'))
  } finally {
    completing.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchNoShows()
})
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
