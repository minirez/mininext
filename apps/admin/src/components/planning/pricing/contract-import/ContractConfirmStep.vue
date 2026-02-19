<template>
  <div class="space-y-4">
    <!-- Importing State -->
    <div v-if="isImporting" class="flex flex-col items-center justify-center py-12">
      <div
        class="w-16 h-16 rounded-full border-4 border-green-200 border-t-green-600 animate-spin"
      ></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">
        {{ $t('planning.pricing.contractImport.importing') }}
      </p>
    </div>

    <!-- Success State -->
    <div v-else-if="importResult" class="text-center py-6">
      <div
        class="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-4xl text-green-600 dark:text-green-400">check_circle</span>
      </div>
      <h4 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
        {{ $t('planning.pricing.contractImport.importSuccess') }}
      </h4>

      <!-- Detailed Results -->
      <div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ importResult.roomsCreated || 0 }}
          </p>
          <p class="text-xs text-green-600/70">
            {{ $t('planning.pricing.contractImport.newRoomsCreated') }}
          </p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ importResult.roomsUpdated || 0 }}
          </p>
          <p class="text-xs text-blue-600/70">
            {{ $t('planning.pricing.contractImport.roomsUpdatedLabel') }}
          </p>
        </div>
        <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {{ importResult.mealPlansCreated || 0 }}
          </p>
          <p class="text-xs text-amber-600/70">
            {{ $t('planning.pricing.contractImport.newMealPlansCreated') }}
          </p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ importResult.seasonsCreated || 0 }}
          </p>
          <p class="text-xs text-purple-600/70">
            {{ $t('planning.pricing.contractImport.newSeasonsCreated') }}
          </p>
        </div>
      </div>

      <!-- Campaign Results -->
      <div
        v-if="importResult.campaignsCreated > 0"
        class="mt-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3"
      >
        <p class="text-lg font-bold text-orange-600 dark:text-orange-400">
          {{ importResult.campaignsCreated }}
        </p>
        <p class="text-xs text-orange-600/70">
          {{ $t('planning.pricing.contractImport.campaignsCreatedLabel') }}
        </p>
      </div>

      <!-- Rates -->
      <div class="mt-4 bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {{ $t('planning.pricing.contractImport.rateRecords') }}
        </h5>
        <div class="flex justify-center gap-6">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ importResult.ratesCreated || importResult.created || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('planning.pricing.contractImport.created') }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ importResult.ratesUpdated || importResult.updated || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('planning.pricing.contractImport.updated') }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {{ importResult.ratesSkipped || importResult.skipped || 0 }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t('planning.pricing.contractImport.skipped') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview State -->
    <div v-else class="space-y-4">
      <!-- Import Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ parsedData?.periods?.length || 0 }}
          </p>
          <p class="text-xs text-blue-600/70">
            {{ $t('planning.pricing.contractImport.periods') }}
          </p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ mappedRoomCount }}
          </p>
          <p class="text-xs text-green-600/70">
            {{ $t('planning.pricing.contractImport.room') }}
          </p>
        </div>
        <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {{ mappedMealPlanCount }}
          </p>
          <p class="text-xs text-amber-600/70">
            {{ $t('planning.pricing.contractImport.mealPlan') }}
          </p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ validPricingCount }}
          </p>
          <p class="text-xs text-purple-600/70">
            {{ $t('planning.pricing.contractImport.price') }}
          </p>
        </div>
      </div>

      <!-- Room Tabs -->
      <div class="bg-gray-50 dark:bg-slate-800 rounded-xl overflow-hidden">
        <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          <button
            v-for="(room, index) in parsedData?.roomTypes || []"
            :key="room.contractName"
            class="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
            :class="
              selectedRoomTab === index
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            "
            @click="$emit('update:selectedRoomTab', index)"
          >
            {{ room.contractName }}
            <span
              class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
              :class="
                getRoomPricingCount(room) > 0
                  ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                  : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
              "
            >
              {{ getRoomPricingCount(room) }}
            </span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-4 max-h-[32rem] overflow-auto">
          <div v-if="parsedData?.roomTypes?.[selectedRoomTab]">
            <!-- Room Header with Capacity -->
            <div class="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium text-purple-700 dark:text-purple-300">{{
                    parsedData.roomTypes[selectedRoomTab].contractName
                  }}</span>
                  <span
                    v-if="parsedData.roomTypes[selectedRoomTab].matchedCode"
                    class="text-xs text-gray-500"
                  >
                    → {{ parsedData.roomTypes[selectedRoomTab].matchedCode }}
                  </span>
                  <!-- Pricing type badge -->
                  <span
                    v-if="parsedData.contractInfo?.pricingType"
                    class="px-1.5 py-0.5 text-xs rounded font-semibold"
                    :class="
                      parsedData.contractInfo.pricingType === 'per_person'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    "
                  >
                    {{
                      parsedData.contractInfo.pricingType === 'per_person'
                        ? 'OBP'
                        : parsedData.contractInfo.pricingType === 'per_person_multiplier'
                          ? 'OBPx'
                          : 'Unit'
                    }}
                  </span>
                </div>
                <span class="text-sm text-purple-600 dark:text-purple-400"
                  >{{ getRoomPricingCount(parsedData.roomTypes[selectedRoomTab]) }}
                  {{ $t('planning.pricing.contractImport.price') }}</span
                >
              </div>
              <!-- Room Capacity Details -->
              <div
                v-if="selectedRoomCapacity"
                class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400"
              >
                <span v-if="selectedRoomCapacity.roomSize">
                  <span class="material-icons text-xs align-middle text-gray-400">straighten</span>
                  {{ selectedRoomCapacity.roomSize }}m²
                </span>
                <span>
                  <span class="material-icons text-xs align-middle text-gray-400">person</span>
                  {{ $t('planning.pricing.contractImport.defaultAdults') }}:
                  <strong>{{
                    selectedRoomCapacity.standardOccupancy || selectedRoomCapacity.maxAdults || '?'
                  }}</strong>
                  {{ $t('planning.pricing.contractImport.adultSuffix') }}
                </span>
                <span v-if="selectedRoomCapacity.maxAdults">
                  <span class="material-icons text-xs align-middle text-gray-400">group</span>
                  {{ $t('planning.pricing.contractImport.maxShort') }}:
                  <strong>{{ selectedRoomCapacity.maxAdults }}</strong> AD
                </span>
                <span v-if="selectedRoomCapacity.maxChildren">
                  <span class="material-icons text-xs align-middle text-gray-400">child_care</span>
                  {{ $t('planning.pricing.contractImport.maxShort') }}:
                  <strong>{{ selectedRoomCapacity.maxChildren }}</strong> CHD
                </span>
                <span v-if="selectedRoomCapacity.maxInfants">
                  <span class="material-icons text-xs align-middle text-gray-400"
                    >baby_changing_station</span
                  >
                  <strong>{{ selectedRoomCapacity.maxInfants }}</strong> INF
                </span>
                <span v-if="selectedRoomCapacity.maxOccupancy">
                  <span class="material-icons text-xs align-middle text-gray-400">groups</span>
                  {{ $t('planning.pricing.contractImport.totalMax') }}:
                  <strong>{{ selectedRoomCapacity.maxOccupancy }}</strong>
                </span>
              </div>
              <!-- Room-level MinStay / ReleaseDay -->
              <div
                v-if="selectedRoom?.minStay || selectedRoom?.releaseDay"
                class="flex items-center gap-2 mt-1"
              >
                <span
                  v-if="selectedRoom.minStay && selectedRoom.minStay > 1"
                  class="px-1.5 py-0.5 text-xs rounded font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                >
                  {{ $t('planning.pricing.contractImport.minStayShort') }}:{{ selectedRoom.minStay
                  }}{{ $t('planning.pricing.contractImport.nightSuffix') }}
                </span>
                <span
                  v-if="selectedRoom.releaseDay && selectedRoom.releaseDay > 0"
                  class="px-1.5 py-0.5 text-xs rounded font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
                >
                  {{ $t('planning.pricing.contractImport.releaseDayShort') }}:{{
                    selectedRoom.releaseDay
                  }}{{ $t('planning.pricing.contractImport.daySuffix') }}
                </span>
              </div>
            </div>

            <!-- Price Table -->
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-gray-100 dark:bg-slate-700 z-10">
                <tr
                  class="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600"
                >
                  <th class="py-2 pr-4 font-semibold">
                    {{ $t('planning.pricing.contractImport.period') }}
                  </th>
                  <th class="py-2 pr-4 font-semibold">
                    {{ $t('planning.pricing.contractImport.dateRange') }}
                  </th>
                  <th
                    v-for="mp in parsedData?.mealPlans || []"
                    :key="mp.contractName"
                    class="py-2 pr-4 text-right font-semibold"
                  >
                    {{ mp.matchedCode || mp.contractName }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr
                  v-for="period in parsedData?.periods"
                  :key="period.code"
                  class="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td class="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                    {{ period.code }}
                    <span class="text-xs text-gray-400 ml-1">{{ period.name }}</span>
                  </td>
                  <td class="py-2 pr-4 text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(period.startDate) }} - {{ formatDate(period.endDate) }}
                  </td>
                  <td
                    v-for="mp in parsedData?.mealPlans || []"
                    :key="mp.contractName"
                    class="py-2 pr-4 text-right"
                  >
                    <template
                      v-if="getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)"
                    >
                      <!-- OBP price display -->
                      <div
                        v-if="
                          getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period).isOBP
                        "
                        class="text-right"
                      >
                        <span
                          class="text-[8px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-1 rounded font-semibold"
                          >OBP</span
                        >
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          <template
                            v-for="(price, pax) in getPriceForCell(
                              parsedData.roomTypes[selectedRoomTab],
                              mp,
                              period
                            ).occupancyPricing"
                            :key="pax"
                          >
                            <div v-if="price !== null && price !== undefined">
                              {{ pax }}P:
                              <span class="font-bold text-green-600 dark:text-green-400">{{
                                price
                              }}</span>
                            </div>
                          </template>
                        </div>
                      </div>
                      <!-- Unit price display with popover -->
                      <div v-else class="relative inline-block">
                        <button
                          class="font-bold text-green-600 dark:text-green-400 hover:underline cursor-pointer"
                          @click="togglePricePopover(period.code, mp.contractName)"
                        >
                          {{
                            getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period).price
                          }}
                          <span class="text-xs font-normal text-gray-400">{{
                            parsedData?.contractInfo?.currency || 'EUR'
                          }}</span>
                        </button>
                        <!-- Unit Price Popover -->
                        <div
                          v-if="activePricePopover === `${period.code}|${mp.contractName}`"
                          class="absolute z-30 right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 p-3 text-xs text-left"
                        >
                          <div class="flex items-center justify-between mb-2">
                            <span class="font-semibold text-gray-900 dark:text-white">
                              {{ period.code }} -
                              {{ $t('planning.pricing.contractImport.extraPricesTitle') }}
                            </span>
                            <button
                              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              @click="activePricePopover = null"
                            >
                              <span class="material-icons text-sm">close</span>
                            </button>
                          </div>
                          <div class="space-y-1.5">
                            <div class="flex justify-between">
                              <span class="text-gray-500 dark:text-gray-400">{{
                                $t('planning.pricing.contractImport.basePrice')
                              }}</span>
                              <span class="font-medium text-gray-900 dark:text-white">{{
                                formatCurrency(
                                  getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)
                                    .price
                                )
                              }}</span>
                            </div>
                            <div
                              v-if="
                                getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)
                                  .singleSupplement > 0
                              "
                              class="flex justify-between"
                            >
                              <span class="text-gray-500 dark:text-gray-400">{{
                                $t('planning.pricing.contractImport.singlePrice')
                              }}</span>
                              <span class="font-medium text-gray-900 dark:text-white">{{
                                formatCurrency(
                                  getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)
                                    .price -
                                    getPriceForCell(
                                      parsedData.roomTypes[selectedRoomTab],
                                      mp,
                                      period
                                    ).singleSupplement
                                )
                              }}</span>
                            </div>
                            <div
                              v-if="
                                getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)
                                  .extraAdult > 0
                              "
                              class="flex justify-between"
                            >
                              <span class="text-emerald-600 dark:text-emerald-400"
                                >+{{ $t('planning.pricing.contractImport.extraAdult') }}</span
                              >
                              <span class="font-medium text-emerald-600 dark:text-emerald-400">{{
                                formatCurrency(
                                  getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)
                                    .extraAdult
                                )
                              }}</span>
                            </div>
                            <template
                              v-for="(childPrice, idx) in getPriceForCell(
                                parsedData.roomTypes[selectedRoomTab],
                                mp,
                                period
                              ).extraChild || []"
                              :key="idx"
                            >
                              <div v-if="childPrice > 0" class="flex justify-between">
                                <span class="text-cyan-600 dark:text-cyan-400"
                                  >+{{ $t('planning.pricing.contractImport.extraChild') }}
                                  {{ idx + 1 }}</span
                                >
                                <span class="font-medium text-cyan-600 dark:text-cyan-400">{{
                                  formatCurrency(childPrice)
                                }}</span>
                              </div>
                            </template>
                            <div
                              v-if="
                                getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)
                                  .extraInfant > 0
                              "
                              class="flex justify-between"
                            >
                              <span class="text-pink-600 dark:text-pink-400"
                                >+{{ $t('planning.pricing.contractImport.extraInfant') }}</span
                              >
                              <span class="font-medium text-pink-600 dark:text-pink-400">{{
                                formatCurrency(
                                  getPriceForCell(parsedData.roomTypes[selectedRoomTab], mp, period)
                                    .extraInfant
                                )
                              }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                    <span v-else class="text-red-400 dark:text-red-500">--</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              v-if="getRoomPricingCount(parsedData.roomTypes[selectedRoomTab]) === 0"
              class="text-center py-8"
            >
              <span class="material-icons text-4xl text-red-400">error</span>
              <p class="mt-2 text-red-600 dark:text-red-400 font-medium">
                {{ $t('planning.pricing.contractImport.noPriceData') }}
              </p>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <span class="material-icons text-4xl text-gray-300">inventory_2</span>
            <p class="mt-2 text-gray-500">
              {{ $t('planning.pricing.contractImport.noRoomFound') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Missing Prices Warning -->
      <div
        v-if="missingPricesCount > 0"
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
      >
        <div class="flex items-center gap-2">
          <span class="material-icons text-amber-600">warning</span>
          <p class="text-sm text-amber-700 dark:text-amber-400">
            <strong>{{ missingPricesCount }}</strong>
            {{ $t('planning.pricing.contractImport.missingCombinations') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isImporting: { type: Boolean, default: false },
  importResult: { type: Object, default: null },
  parsedData: { type: Object, default: null },
  selectedRoomTab: { type: Number, default: 0 },
  mappedRoomCount: { type: Number, default: 0 },
  mappedMealPlanCount: { type: Number, default: 0 },
  validPricingCount: { type: Number, default: 0 },
  missingPricesCount: { type: Number, default: 0 },
  formatDate: { type: Function, required: true },
  getRoomPricingCount: { type: Function, required: true },
  getPriceForCell: { type: Function, required: true }
})

defineEmits(['update:selectedRoomTab'])

// Price popover state
const activePricePopover = ref(null)

const togglePricePopover = (periodCode, mealName) => {
  const key = `${periodCode}|${mealName}`
  activePricePopover.value = activePricePopover.value === key ? null : key
}

// Selected room shorthand
const selectedRoom = computed(() => props.parsedData?.roomTypes?.[props.selectedRoomTab] || null)
const selectedRoomCapacity = computed(() => selectedRoom.value?.capacity || null)

// Format currency
const formatCurrency = value => {
  if (!value && value !== 0) return '-'
  const currency = props.parsedData?.contractInfo?.currency || 'EUR'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}
</script>
