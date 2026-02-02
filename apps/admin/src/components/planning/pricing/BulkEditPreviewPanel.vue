<template>
  <Transition name="slide-up">
    <div
      v-if="show"
      class="absolute inset-0 bg-white dark:bg-slate-800 z-10 flex flex-col"
    >
      <!-- Preview Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-emerald-500 to-teal-600"
      >
        <div class="text-white">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <span class="material-icons">preview</span>
            {{ $t('planning.pricing.previewChanges') }}
          </h3>
          <p class="text-sm opacity-90 mt-0.5">
            {{ $t('planning.pricing.reviewBeforeApply') }}
          </p>
        </div>
        <button
          class="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
          @click="$emit('close')"
        >
          <span class="material-icons">arrow_back</span>
        </button>
      </div>

      <!-- Preview Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Impact Summary -->
        <div
          class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center"
            >
              <span class="material-icons text-2xl">info</span>
            </div>
            <div>
              <div class="text-lg font-bold text-gray-800 dark:text-white">
                {{ $t('planning.pricing.impactSummary') }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ previewSummary.totalCells }}
                {{ $t('planning.pricing.cellsWillBeUpdated') }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 mt-4">
            <div class="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">
                {{ previewSummary.roomTypes }}
              </div>
              <div class="text-xs text-gray-500">{{ $t('planning.pricing.roomTypes') }}</div>
            </div>
            <div class="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
              <div class="text-2xl font-bold text-orange-600">
                {{ previewSummary.mealPlans }}
              </div>
              <div class="text-xs text-gray-500">{{ $t('planning.pricing.mealPlans') }}</div>
            </div>
            <div class="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ previewSummary.days }}</div>
              <div class="text-xs text-gray-500">{{ $t('planning.pricing.days') }}</div>
            </div>
          </div>
        </div>

        <!-- Changes List -->
        <div class="space-y-4">
          <h4 class="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span class="material-icons text-amber-500">change_circle</span>
            {{ $t('planning.pricing.changesWillApply') }}
          </h4>

          <!-- Price Changes -->
          <div
            v-if="activeTab === 'price' && previewChanges.prices.length > 0"
            class="space-y-2"
          >
            <div
              v-for="(change, idx) in previewChanges.prices"
              :key="'price-' + idx"
              class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded bg-purple-500 text-white text-xs font-bold"
                    >{{ change.roomCode }}</span
                  >
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="getMealPlanColor(change.mealPlanCode)"
                    >{{ change.mealPlanCode }}</span
                  >
                </div>
                <span class="text-xs text-gray-500">{{
                  change.pricingType === 'per_person' ? 'OBP' : 'Unit'
                }}</span>
              </div>
              <div class="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <template v-if="change.pricingType === 'unit'">
                  <div v-if="change.pricePerNight !== null" class="flex items-center gap-2">
                    <span class="material-icons text-sm text-green-500">payments</span>
                    {{ $t('planning.pricing.pricePerNight') }}:
                    <strong>{{ change.pricePerNight }} {{ currency }}</strong>
                  </div>
                  <div v-if="change.extraAdult !== null" class="flex items-center gap-2">
                    <span class="material-icons text-sm text-blue-500">person_add</span>
                    {{ $t('planning.pricing.extraAdultShort') }}:
                    <strong>{{ change.extraAdult }} {{ currency }}</strong>
                  </div>
                  <div
                    v-if="change.singleSupplement !== null"
                    class="flex items-center gap-2"
                  >
                    <span class="material-icons text-sm text-indigo-500">person</span>
                    {{ $t('planning.pricing.singleSupplement') }}:
                    <strong>-{{ change.singleSupplement }} {{ currency }}</strong>
                  </div>
                </template>
                <template v-else>
                  <!-- Multiplier OBP - base price -->
                  <div v-if="change.pricePerNight !== null" class="flex items-center gap-2 mb-1">
                    <span class="material-icons text-sm text-purple-500">calculate</span>
                    {{ $t('planning.pricing.basePrice') }}:
                    <strong>{{ change.pricePerNight }} {{ currency }}</strong>
                    <span class="text-xs text-gray-400">({{ $t('planning.pricing.multiplierOBP') }})</span>
                  </div>
                  <!-- Standard OBP - occupancy pricing -->
                  <div
                    v-for="(price, pax) in change.occupancyPricing"
                    :key="pax"
                    class="inline-flex items-center gap-1 mr-3"
                  >
                    <span class="text-xs font-bold text-indigo-600">{{ pax }}P:</span>
                    <strong>{{ price }} {{ currency }}</strong>
                  </div>
                </template>
                <div
                  v-if="change.childPrices?.length > 0"
                  class="flex items-center gap-2 mt-1"
                >
                  <span class="material-icons text-sm text-pink-500">child_care</span>
                  {{ $t('planning.pricing.childPrices') }}:
                  <span v-for="(cp, ci) in change.childPrices" :key="ci" class="mr-2">
                    {{ ci + 1 }}. <strong>{{ cp }} {{ currency }}</strong>
                  </span>
                </div>
                <div v-if="change.extraInfant !== null" class="flex items-center gap-2 mt-1">
                  <span class="material-icons text-sm text-rose-500"
                    >baby_changing_station</span
                  >
                  {{ $t('planning.pricing.infant') }}:
                  <strong>{{ change.extraInfant }} {{ currency }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Inventory Changes -->
          <div v-if="activeTab === 'inventory'" class="space-y-2">
            <div
              class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
            >
              <div v-if="form.allotmentValue > 0" class="flex items-center gap-2 mb-2">
                <span class="material-icons text-blue-500">inventory_2</span>
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  {{ $t('planning.pricing.allotment') }}:
                  <strong>{{ allotmentModeLabel }} {{ form.allotmentValue }}</strong>
                </span>
              </div>
              <div v-if="form.minStay > 1" class="flex items-center gap-2 mb-2">
                <span class="material-icons text-purple-500">nights_stay</span>
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  {{ $t('planning.pricing.minStay') }}:
                  <strong>{{ form.minStay }} {{ $t('planning.pricing.nights') }}</strong>
                </span>
              </div>
              <div v-if="form.releaseDays > 0" class="flex items-center gap-2">
                <span class="material-icons text-orange-500">schedule</span>
                <span class="text-sm text-gray-700 dark:text-gray-300">
                  {{ $t('planning.pricing.releaseDays') }}:
                  <strong>{{ form.releaseDays }} {{ $t('planning.pricing.days') }}</strong>
                </span>
              </div>
            </div>
          </div>

          <!-- Restriction Changes -->
          <div v-if="activeTab === 'restrictions'" class="space-y-2">
            <div
              class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700"
            >
              <div v-if="form.stopSale" class="flex items-center gap-2 mb-2">
                <span class="material-icons text-red-500">block</span>
                <span class="text-sm font-medium text-red-600"
                  >{{ $t('planning.pricing.stopSale') }}: {{ $t('common.enabled') }}</span
                >
              </div>
              <div v-if="form.singleStop" class="flex items-center gap-2 mb-2">
                <span class="material-icons text-pink-500">person_off</span>
                <span class="text-sm font-medium text-pink-600"
                  >{{ $t('planning.pricing.singleStop') }}: {{ $t('common.enabled') }}</span
                >
              </div>
              <div v-if="form.closedToArrival" class="flex items-center gap-2 mb-2">
                <span class="material-icons text-orange-500">no_meeting_room</span>
                <span class="text-sm font-medium text-orange-600"
                  >CTA: {{ $t('common.enabled') }}</span
                >
              </div>
              <div v-if="form.closedToDeparture" class="flex items-center gap-2">
                <span class="material-icons text-orange-500">logout</span>
                <span class="text-sm font-medium text-orange-600"
                  >CTD: {{ $t('common.enabled') }}</span
                >
              </div>
              <div
                v-if="
                  !form.stopSale &&
                  !form.singleStop &&
                  !form.closedToArrival &&
                  !form.closedToDeparture
                "
                class="text-sm text-gray-500"
              >
                {{ $t('planning.pricing.noRestrictionsSet') }}
              </div>
            </div>
          </div>

          <!-- No Changes Warning -->
          <div
            v-if="!hasAnyChanges"
            class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700 flex items-center gap-3"
          >
            <span class="material-icons text-amber-500 text-2xl">warning</span>
            <div>
              <div class="font-medium text-amber-700 dark:text-amber-300">
                {{ $t('planning.pricing.noChangesDetected') }}
              </div>
              <div class="text-sm text-amber-600 dark:text-amber-400">
                {{ $t('planning.pricing.pleaseEnterValues') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Date Range Preview -->
        <div class="mt-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <h4
            class="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3"
          >
            <span class="material-icons text-blue-500">date_range</span>
            {{ $t('planning.pricing.dateRange') }}
          </h4>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ dateRangeSummary }}
          </div>
        </div>
      </div>

      <!-- Preview Footer -->
      <div
        class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
      >
        <button
          class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
          @click="$emit('close')"
        >
          <span class="material-icons text-sm">arrow_back</span>
          {{ $t('planning.pricing.backToEdit') }}
        </button>
        <button
          :disabled="saving || !hasAnyChanges"
          class="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/25"
          @click="$emit('confirm')"
        >
          <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
          <span v-else class="material-icons text-sm">check_circle</span>
          {{ saving ? $t('common.saving') : $t('planning.pricing.confirmAndApply') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  },
  activeTab: {
    type: String,
    required: true
  },
  form: {
    type: Object,
    required: true
  },
  previewSummary: {
    type: Object,
    required: true
  },
  previewChanges: {
    type: Object,
    required: true
  },
  hasAnyChanges: {
    type: Boolean,
    required: true
  },
  allotmentModeLabel: {
    type: String,
    default: ''
  },
  dateRangeSummary: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  getMealPlanColor: {
    type: Function,
    required: true
  }
})

defineEmits(['close', 'confirm'])
</script>

<style scoped>
/* Preview slide up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
