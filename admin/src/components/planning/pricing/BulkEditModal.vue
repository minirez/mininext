<template>
  <Transition name="modal-fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop (no click to close) -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      ></div>

      <!-- Modal Content -->
      <div
        class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-purple-500 to-indigo-600">
          <div class="text-white">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <span class="material-icons">edit_note</span>
              {{ $t('planning.pricing.bulkEdit') }}
            </h3>
            <p class="text-sm opacity-90 mt-0.5">
              {{ selectedCells.length }} {{ $t('planning.pricing.cellsSelected') }}
            </p>
          </div>
          <button
            @click="close"
            class="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Selection Summary -->
          <div class="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div class="flex items-start justify-between">
              <div>
                <div class="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                  {{ $t('planning.pricing.selectedRange') }}
                </div>
                <div class="text-lg font-bold text-gray-800 dark:text-white">
                  {{ dateRangeSummary }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">{{ $t('planning.pricing.roomType') }}</div>
                <div class="flex flex-wrap gap-1 justify-end">
                  <span
                    v-for="rt in uniqueRoomTypes"
                    :key="rt._id"
                    class="px-2 py-0.5 bg-white dark:bg-slate-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm"
                  >
                    {{ rt.code }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-1 mt-3">
              <span
                v-for="mp in uniqueMealPlans"
                :key="mp._id"
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="getMealPlanColor(mp.code)"
              >
                {{ mp.code }}
              </span>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex gap-1 mb-6 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              :class="activeTab === tab.key
                ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800'"
            >
              <span class="material-icons text-lg">{{ tab.icon }}</span>
              <span class="hidden sm:inline">{{ tab.label }}</span>
            </button>
          </div>

          <!-- Tab: Price -->
          <div v-show="activeTab === 'price'" class="space-y-5">
            <!-- Price Mode -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {{ $t('planning.pricing.priceAction') }}
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="mode in priceModes"
                  :key="mode.value"
                  @click="form.priceMode = mode.value"
                  class="p-3 rounded-xl border-2 text-left transition-all"
                  :class="form.priceMode === mode.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
                >
                  <span class="material-icons text-lg mb-1" :class="form.priceMode === mode.value ? 'text-purple-600' : 'text-gray-400'">
                    {{ mode.icon }}
                  </span>
                  <div class="text-sm font-medium" :class="form.priceMode === mode.value ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'">
                    {{ mode.label }}
                  </div>
                </button>
              </div>
            </div>

            <!-- Room Type Tabs (when multiple rooms selected) -->
            <div v-if="uniqueRoomTypes.length > 1" class="border-b border-gray-200 dark:border-slate-700">
              <div class="flex gap-1 overflow-x-auto pb-px">
                <button
                  v-for="rt in uniqueRoomTypes"
                  :key="rt._id"
                  @click="selectedRoomTab = rt._id"
                  class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
                  :class="selectedRoomTab === rt._id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                >
                  <span class="w-8 h-6 rounded bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {{ rt.code }}
                  </span>
                  <span class="hidden sm:inline">{{ getRoomTypeName(rt) }}</span>
                  <!-- Price indicator -->
                  <span
                    v-if="hasRoomPrice(rt._id)"
                    class="w-2 h-2 rounded-full bg-green-500"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Price Entry Per Room + Meal Plan -->
            <div v-if="currentRoomId && roomPrices[currentRoomId]" class="space-y-4">
              <!-- Meal Plan Cards -->
              <div
                v-for="mp in uniqueMealPlans"
                :key="mp._id"
                v-show="roomPrices[currentRoomId]?.[mp._id]"
                class="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden"
              >
                <!-- Meal Plan Header -->
                <div class="bg-gray-50 dark:bg-slate-700 px-4 py-3 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2 py-0.5 rounded text-xs font-bold"
                      :class="getMealPlanColor(mp.code)"
                    >
                      {{ mp.code }}
                    </span>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ getMealPlanName(mp) }}</span>
                  </div>
                  <!-- Toggle expand -->
                  <button
                    type="button"
                    @click="toggleMealPlanExpand(mp._id)"
                    class="text-gray-400 hover:text-gray-600"
                  >
                    <span class="material-icons text-sm">
                      {{ expandedMealPlans[mp._id] ? 'expand_less' : 'expand_more' }}
                    </span>
                  </button>
                </div>

                <!-- Pricing Fields -->
                <div class="p-4 bg-white dark:bg-slate-800">
                  <!-- Base Price (always visible) -->
                  <div class="flex items-center gap-3 mb-3">
                    <label class="text-sm text-gray-600 dark:text-gray-400 w-28">{{ $t('planning.pricing.pricePerNight') }}</label>
                    <div class="flex items-center gap-2 flex-1">
                      <input
                        v-model.number="roomPrices[currentRoomId][mp._id].pricePerNight"
                        type="number"
                        min="0"
                        step="10"
                        class="form-input w-32 text-center font-bold"
                        :class="roomPrices[currentRoomId]?.[mp._id]?.pricePerNight > 0 ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400' : ''"
                        placeholder="0"
                      />
                      <span class="text-sm text-gray-400">{{ currency }}</span>
                    </div>
                  </div>

                  <!-- Extra Person Prices (expandable) -->
                  <div v-show="expandedMealPlans[mp._id]" class="space-y-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <!-- Extra Adult -->
                    <div class="flex items-center gap-3">
                      <label class="text-sm text-gray-500 dark:text-gray-400 w-28">{{ $t('planning.pricing.extraAdultShort') }}</label>
                      <div class="flex items-center gap-2">
                        <input
                          v-model.number="roomPrices[currentRoomId][mp._id].extraAdult"
                          type="number"
                          min="0"
                          class="form-input w-24 text-center text-sm"
                          placeholder="0"
                        />
                        <span class="text-xs text-gray-400">{{ currency }}</span>
                      </div>
                    </div>

                    <!-- Child Order Pricing -->
                    <div>
                      <div class="flex items-center mb-2">
                        <label class="text-sm text-gray-500 dark:text-gray-400">
                          {{ $t('planning.pricing.childOrderPricing') }}
                          <span class="text-xs text-purple-600 dark:text-purple-400 font-medium ml-1">{{ childAgeLabel }}</span>
                        </label>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div
                          v-for="childIndex in currentRoomMaxChildren"
                          :key="childIndex"
                          class="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2"
                        >
                          <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ childIndex }}. {{ $t('planning.pricing.child') }}</span>
                          <input
                            v-model.number="roomPrices[currentRoomId][mp._id].childOrderPricing[childIndex - 1]"
                            type="number"
                            min="0"
                            class="form-input flex-1 w-20 text-center text-sm py-1"
                            placeholder="0"
                          />
                          <span class="text-xs text-gray-400">{{ currency }}</span>
                        </div>
                      </div>
                      <p class="text-xs text-gray-400 mt-1 italic">{{ $t('planning.pricing.childPricingHint') }}</p>
                    </div>

                    <!-- Extra Infant -->
                    <div class="flex items-center gap-3">
                      <label class="text-sm text-gray-500 dark:text-gray-400 w-28">
                        {{ $t('planning.pricing.extraInfantShort') }}
                        <span class="text-xs text-purple-600 dark:text-purple-400 font-medium">{{ infantAgeLabel }}</span>
                      </label>
                      <div class="flex items-center gap-2">
                        <input
                          v-model.number="roomPrices[currentRoomId][mp._id].extraInfant"
                          type="number"
                          min="0"
                          class="form-input w-24 text-center text-sm"
                          placeholder="0"
                        />
                        <span class="text-xs text-gray-400">{{ currency }}</span>
                      </div>
                    </div>

                    <!-- Single Occupancy Discount -->
                    <div class="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                      <label class="text-sm text-gray-500 dark:text-gray-400 w-28 flex items-center gap-1">
                        <span class="material-icons text-blue-500 text-sm">person</span>
                        {{ $t('planning.pricing.singleOccupancy') }}
                      </label>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-400">-</span>
                        <input
                          v-model.number="roomPrices[currentRoomId][mp._id].singleSupplement"
                          type="number"
                          min="0"
                          class="form-input w-24 text-center text-sm"
                          placeholder="0"
                        />
                        <span class="text-xs text-gray-400">{{ currency }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="expandAllMealPlans"
                  class="text-xs px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                >
                  <span class="material-icons text-sm">unfold_more</span>
                  {{ $t('planning.pricing.expandAll') }}
                </button>
                <button
                  v-if="uniqueMealPlans.length > 1"
                  @click="copyFirstMealPlanToAll"
                  class="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                >
                  <span class="material-icons text-sm">content_copy</span>
                  {{ $t('planning.pricing.copyToAllMealPlans') }}
                </button>
                <button
                  v-if="uniqueRoomTypes.length > 1"
                  @click="copyCurrentRoomToAll"
                  class="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 flex items-center gap-1"
                >
                  <span class="material-icons text-sm">content_copy</span>
                  {{ $t('planning.pricing.copyToAllRooms') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Inventory -->
          <div v-show="activeTab === 'inventory'" class="space-y-5">
            <!-- Allotment -->
            <div class="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <label class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <span class="material-icons text-blue-600">inventory_2</span>
                    {{ $t('planning.pricing.allotment') }}
                  </label>
                  <p class="text-xs text-gray-500 mt-1">{{ $t('planning.pricing.allotmentHint') }}</p>
                </div>
              </div>

              <!-- Allotment Mode Buttons -->
              <div class="flex justify-center gap-1 mb-4 bg-white dark:bg-slate-700 rounded-xl p-1">
                <button
                  v-for="mode in allotmentModes"
                  :key="mode.value"
                  @click="form.allotmentMode = mode.value"
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  :class="form.allotmentMode === mode.value
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-600'"
                >
                  <span class="material-icons text-lg">{{ mode.icon }}</span>
                  <span class="hidden sm:inline">{{ mode.label }}</span>
                </button>
              </div>

              <div class="flex items-center justify-center gap-4">
                <button
                  @click="form.allotmentValue = Math.max(0, form.allotmentValue - 1)"
                  class="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <span class="material-icons">remove</span>
                </button>
                <input
                  v-model.number="form.allotmentValue"
                  type="number"
                  min="0"
                  class="w-24 text-center text-3xl font-bold border-2 border-blue-300 dark:border-blue-700 rounded-xl py-3 bg-white dark:bg-slate-800"
                />
                <button
                  @click="form.allotmentValue++"
                  class="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <span class="material-icons">add</span>
                </button>
              </div>
            </div>

            <!-- Stay Requirements -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <label class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-2">
                  <span class="material-icons text-purple-600 text-lg">nights_stay</span>
                  {{ $t('planning.pricing.minStay') }}
                </label>
                <div class="flex items-center gap-2">
                  <input v-model.number="form.minStay" type="number" min="1" max="30" class="form-input" />
                  <span class="text-sm text-gray-500">{{ $t('planning.pricing.nights') }}</span>
                </div>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <label class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-2">
                  <span class="material-icons text-orange-600 text-lg">schedule</span>
                  {{ $t('planning.pricing.releaseDays') }}
                </label>
                <div class="flex items-center gap-2">
                  <input v-model.number="form.releaseDays" type="number" min="0" class="form-input" />
                  <span class="text-sm text-gray-500">{{ $t('planning.pricing.daysBeforeArrival') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Restrictions -->
          <div v-show="activeTab === 'restrictions'" class="space-y-4">
            <!-- Stop Sale -->
            <div
              class="p-5 rounded-xl border-2 cursor-pointer transition-all"
              :class="form.stopSale
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
              @click="form.stopSale = !form.stopSale"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
                  :class="form.stopSale ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'"
                >
                  <span class="material-icons text-2xl">block</span>
                </div>
                <div class="flex-1">
                  <div class="font-bold text-lg" :class="form.stopSale ? 'text-red-600' : 'text-gray-700 dark:text-slate-300'">
                    {{ $t('planning.pricing.stopSale') }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.stopSaleHint') }}</div>
                </div>
                <div class="w-12 h-7 rounded-full transition-colors" :class="form.stopSale ? 'bg-red-500' : 'bg-gray-300 dark:bg-slate-600'">
                  <div
                    class="w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform"
                    :class="form.stopSale ? 'translate-x-6' : 'translate-x-1'"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Single Stop -->
            <div
              class="p-5 rounded-xl border-2 cursor-pointer transition-all"
              :class="form.singleStop
                ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
              @click="form.singleStop = !form.singleStop"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
                  :class="form.singleStop ? 'bg-pink-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'"
                >
                  <span class="material-icons text-2xl">person_off</span>
                </div>
                <div class="flex-1">
                  <div class="font-bold text-lg" :class="form.singleStop ? 'text-pink-600' : 'text-gray-700 dark:text-slate-300'">
                    {{ $t('planning.pricing.singleStop') }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.singleStopHint') }}</div>
                </div>
                <div class="w-12 h-7 rounded-full transition-colors" :class="form.singleStop ? 'bg-pink-500' : 'bg-gray-300 dark:bg-slate-600'">
                  <div
                    class="w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform"
                    :class="form.singleStop ? 'translate-x-6' : 'translate-x-1'"
                  ></div>
                </div>
              </div>
            </div>

            <!-- CTA/CTD -->
            <div class="grid grid-cols-2 gap-4">
              <div
                class="p-4 rounded-xl border-2 cursor-pointer transition-all"
                :class="form.closedToArrival
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
                @click="form.closedToArrival = !form.closedToArrival"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    :class="form.closedToArrival ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'"
                  >
                    <span class="material-icons">no_meeting_room</span>
                  </div>
                  <div>
                    <div class="font-medium" :class="form.closedToArrival ? 'text-orange-600' : 'text-gray-700 dark:text-slate-300'">
                      CTA
                    </div>
                    <div class="text-xs text-gray-500">{{ $t('planning.pricing.closedToArrival') }}</div>
                  </div>
                </div>
              </div>

              <div
                class="p-4 rounded-xl border-2 cursor-pointer transition-all"
                :class="form.closedToDeparture
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
                @click="form.closedToDeparture = !form.closedToDeparture"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    :class="form.closedToDeparture ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'"
                  >
                    <span class="material-icons">logout</span>
                  </div>
                  <div>
                    <div class="font-medium" :class="form.closedToDeparture ? 'text-orange-600' : 'text-gray-700 dark:text-slate-300'">
                      CTD
                    </div>
                    <div class="text-xs text-gray-500">{{ $t('planning.pricing.closedToDeparture') }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <span class="material-icons text-sm">info</span>
            {{ $t('planning.pricing.bulkEditHint') }}
          </div>
          <div class="flex gap-3">
            <button
              @click="close"
              class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              @click="save"
              :disabled="saving"
              class="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/25"
            >
              <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
              <span class="material-icons text-sm" v-else>check</span>
              {{ saving ? $t('common.saving') : $t('planning.pricing.applyChanges') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  hotelId: { type: String, required: true },
  selectedCells: { type: Array, default: () => [] },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  rates: { type: Array, default: () => [] },
  market: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { t, locale } = useI18n()
const toast = useToast()

const saving = ref(false)
const activeTab = ref('price')

const tabs = computed(() => [
  { key: 'price', label: t('planning.pricing.pricePerNight'), icon: 'payments' },
  { key: 'inventory', label: t('planning.pricing.allotment'), icon: 'inventory_2' },
  { key: 'restrictions', label: t('planning.pricing.restrictions'), icon: 'block' }
])

const priceModes = computed(() => [
  { value: 'set', label: t('planning.pricing.setValue'), icon: 'edit' },
  { value: 'increase', label: t('planning.pricing.increaseBy'), icon: 'add_circle' },
  { value: 'decrease', label: t('planning.pricing.decreaseBy'), icon: 'remove_circle' },
  { value: 'percent_increase', label: t('planning.pricing.increasePercent'), icon: 'trending_up' },
  { value: 'percent_decrease', label: t('planning.pricing.decreasePercent'), icon: 'trending_down' }
])

const allotmentModes = computed(() => [
  { value: 'set', label: t('planning.pricing.setValue'), icon: 'edit' },
  { value: 'increase', label: t('planning.pricing.increaseBy'), icon: 'add_circle' },
  { value: 'decrease', label: t('planning.pricing.decreaseBy'), icon: 'remove_circle' }
])

const form = reactive({
  // Price
  priceMode: 'set',
  priceValue: 0,
  updateExtras: false,
  extraAdult: 0,
  childOrderPricing: [], // [1st child price, 2nd child price, ...]
  extraInfant: 0,
  // Inventory
  allotmentMode: 'set',
  allotmentValue: 10,
  minStay: 1,
  releaseDays: 0,
  // Restrictions
  stopSale: false,
  singleStop: false,
  closedToArrival: false,
  closedToDeparture: false
})

// Room tabs for per-room pricing
const selectedRoomTab = ref(null)
// Structure: { roomTypeId: { mealPlanId: { pricePerNight, extraAdult, extraInfant, singleSupplement, childOrderPricing: [] } } }
const roomPrices = reactive({})
const expandedMealPlans = reactive({})

const currentRoomId = computed(() => {
  if (uniqueRoomTypes.value.length <= 1) return uniqueRoomTypes.value[0]?._id
  return selectedRoomTab.value || uniqueRoomTypes.value[0]?._id
})

const hasRoomPrice = (roomTypeId) => {
  const prices = roomPrices[roomTypeId]
  if (!prices) return false
  return Object.values(prices).some(p => p?.pricePerNight > 0)
}

const getRoomTypeName = (rt) => {
  if (!rt) return ''
  return rt.name?.[locale.value] || rt.name?.en || rt.name?.tr || ''
}

const getMealPlanName = (mp) => {
  if (!mp) return ''
  return mp.name?.[locale.value] || mp.name?.en || mp.name?.tr || ''
}

// Meal plan expand/collapse
const toggleMealPlanExpand = (mpId) => {
  expandedMealPlans[mpId] = !expandedMealPlans[mpId]
}

const expandAllMealPlans = () => {
  for (const mp of uniqueMealPlans.value) {
    expandedMealPlans[mp._id] = true
  }
}

// Get max children for current room type
const currentRoomMaxChildren = computed(() => {
  const roomId = currentRoomId.value
  if (!roomId) return 0
  const roomType = props.roomTypes.find(rt => rt._id === roomId)
  return roomType?.occupancy?.maxChildren ?? 2 // Default 2 if not set
})

// Check if can add more children for a meal plan
const canAddChildForMealPlan = (mpId) => {
  const currentRoom = currentRoomId.value
  if (!currentRoom || !roomPrices[currentRoom]?.[mpId]) return false
  const currentCount = roomPrices[currentRoom][mpId].childOrderPricing?.length || 0
  return currentCount < currentRoomMaxChildren.value
}

// Child pricing per meal plan
const addChildPriceForMealPlan = (mpId) => {
  const currentRoom = currentRoomId.value
  if (!currentRoom || !roomPrices[currentRoom]?.[mpId]) return

  // Check max children limit
  if (!canAddChildForMealPlan(mpId)) return

  if (!roomPrices[currentRoom][mpId].childOrderPricing) {
    roomPrices[currentRoom][mpId].childOrderPricing = []
  }
  roomPrices[currentRoom][mpId].childOrderPricing.push(0)
}

const removeChildPriceForMealPlan = (mpId, index) => {
  const currentRoom = currentRoomId.value
  if (!currentRoom || !roomPrices[currentRoom]?.[mpId]?.childOrderPricing) return
  roomPrices[currentRoom][mpId].childOrderPricing.splice(index, 1)
}

const copyFirstMealPlanToAll = () => {
  const currentRoom = currentRoomId.value
  if (!currentRoom || !roomPrices[currentRoom]) return

  const mealPlans = uniqueMealPlans.value
  if (mealPlans.length < 2) return

  const firstMp = mealPlans[0]._id
  const firstData = roomPrices[currentRoom][firstMp]
  if (!firstData) return

  for (const mp of mealPlans) {
    if (mp._id !== firstMp) {
      roomPrices[currentRoom][mp._id] = {
        pricePerNight: firstData.pricePerNight || 0,
        extraAdult: firstData.extraAdult || 0,
        extraInfant: firstData.extraInfant || 0,
        singleSupplement: firstData.singleSupplement || 0,
        childOrderPricing: [...(firstData.childOrderPricing || [])]
      }
    }
  }
}

const copyCurrentRoomToAll = () => {
  const currentRoom = currentRoomId.value
  if (!currentRoom || !roomPrices[currentRoom]) return

  for (const rt of uniqueRoomTypes.value) {
    if (rt._id !== currentRoom) {
      if (!roomPrices[rt._id]) {
        roomPrices[rt._id] = {}
      }
      for (const mp of uniqueMealPlans.value) {
        const srcData = roomPrices[currentRoom][mp._id]
        roomPrices[rt._id][mp._id] = {
          pricePerNight: srcData?.pricePerNight || 0,
          extraAdult: srcData?.extraAdult || 0,
          extraInfant: srcData?.extraInfant || 0,
          singleSupplement: srcData?.singleSupplement || 0,
          childOrderPricing: [...(srcData?.childOrderPricing || [])]
        }
      }
    }
  }
}

// Initialize roomPrices when modal opens
// Empty string = don't update, 0 = free, >0 = set price
const initRoomPrices = () => {
  for (const rt of uniqueRoomTypes.value) {
    if (!roomPrices[rt._id]) {
      roomPrices[rt._id] = {}
    }
    // Get max children for this room type
    const maxChildren = rt.occupancy?.maxChildren ?? 2
    for (const mp of uniqueMealPlans.value) {
      if (!roomPrices[rt._id][mp._id]) {
        roomPrices[rt._id][mp._id] = {
          pricePerNight: '',  // Empty = don't update
          extraAdult: '',
          extraInfant: '',
          singleSupplement: '',
          // Pre-populate child pricing array with empty strings
          childOrderPricing: Array(maxChildren).fill('')
        }
      }
    }
  }
  // Set default room tab
  if (uniqueRoomTypes.value.length > 0 && !selectedRoomTab.value) {
    selectedRoomTab.value = uniqueRoomTypes.value[0]._id
  }
}

// Child pricing helpers
const addChildPrice = () => {
  form.childOrderPricing.push(0)
}

const removeChildPrice = (index) => {
  form.childOrderPricing.splice(index, 1)
}

const currency = computed(() => props.market?.currency || 'EUR')

// Age ranges from market (with defaults)
const childAgeRange = computed(() => {
  const range = props.market?.childAgeRange
  if (range?.min != null && range?.max != null) {
    return { min: range.min, max: range.max }
  }
  return { min: 3, max: 12 } // Default child age
})

const infantAgeRange = computed(() => {
  const range = props.market?.infantAgeRange
  if (range?.min != null && range?.max != null) {
    return { min: range.min, max: range.max }
  }
  return { min: 0, max: 2 } // Default infant age
})

const childAgeLabel = computed(() => `(${childAgeRange.value.min}-${childAgeRange.value.max} ${t('planning.markets.yearsShort')})`)
const infantAgeLabel = computed(() => `(${infantAgeRange.value.min}-${infantAgeRange.value.max} ${t('planning.markets.yearsShort')})`)

const uniqueRoomTypes = computed(() => {
  const ids = [...new Set(props.selectedCells.map(c => c.roomTypeId))]
  return props.roomTypes.filter(rt => ids.includes(rt._id))
})

const uniqueMealPlans = computed(() => {
  const ids = [...new Set(props.selectedCells.map(c => c.mealPlanId))]
  return props.mealPlans.filter(mp => ids.includes(mp._id))
})

const dateRangeSummary = computed(() => {
  if (props.selectedCells.length === 0) return ''

  const dates = props.selectedCells.map(c => c.date).sort()
  const first = dates[0]
  const last = dates[dates.length - 1]

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString(
      locale.value === 'tr' ? 'tr-TR' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric' }
    )
  }

  const dayCount = [...new Set(dates)].length

  if (first === last) {
    return formatDate(first)
  }

  return `${formatDate(first)} - ${formatDate(last)} (${dayCount} ${locale.value === 'tr' ? 'gün' : 'days'})`
})

const getMealPlanColor = (code) => {
  const colors = {
    'RO': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'BB': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'HB': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    'FB': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'AI': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'UAI': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const close = () => {
  emit('update:modelValue', false)
}

const save = async () => {
  saving.value = true

  try {
    // Build update fields based on active tab
    const updateFields = {}

    // Restrictions tab
    if (activeTab.value === 'restrictions') {
      updateFields.stopSale = form.stopSale
      updateFields.singleStop = form.singleStop
      updateFields.closedToArrival = form.closedToArrival
      updateFields.closedToDeparture = form.closedToDeparture
    }

    // Inventory tab
    if (activeTab.value === 'inventory') {
      updateFields.allotment = calculateAllotmentValue(0) // Will be handled per-cell in backend
      updateFields.minStay = form.minStay
      updateFields.releaseDays = form.releaseDays
    }

    // Price tab - per-room + per-mealplan pricing
    if (activeTab.value === 'price') {
      // Check if we have any prices set (empty string = don't update, 0 = free, >0 = set price)
      // A value is "set" if it's not an empty string
      const isValueSet = (val) => val !== '' && val !== null && val !== undefined

      let hasAnyPrice = false
      const roomKeys = Object.keys(roomPrices)

      for (const rtId of roomKeys) {
        const mpKeys = Object.keys(roomPrices[rtId] || {})
        for (const mpId of mpKeys) {
          const priceData = roomPrices[rtId][mpId]
          // Check if any field has a value set (including 0)
          const hasBasePrice = isValueSet(priceData?.pricePerNight)
          const hasExtraAdult = isValueSet(priceData?.extraAdult)
          const hasExtraInfant = isValueSet(priceData?.extraInfant)
          const hasChildPricing = priceData?.childOrderPricing?.some(p => isValueSet(p))
          const hasSingleSupplement = isValueSet(priceData?.singleSupplement)

          if (hasBasePrice || hasExtraAdult || hasExtraInfant || hasChildPricing || hasSingleSupplement) {
            hasAnyPrice = true
            break
          }
        }
        if (hasAnyPrice) break
      }

      console.log('hasAnyPrice:', hasAnyPrice)
      if (hasAnyPrice) {
        // Process per room type and meal plan
        const uniqueDates = [...new Set(props.selectedCells.map(c => c.date))].sort()
        console.log('uniqueDates (sorted):', uniqueDates.length, 'dates')
        console.log('First 5 dates:', uniqueDates.slice(0, 5))
        console.log('Last 5 dates:', uniqueDates.slice(-5))
        let totalUpdates = 0

        for (const rtId of Object.keys(roomPrices)) {
          for (const mpId of Object.keys(roomPrices[rtId])) {
            const priceData = roomPrices[rtId][mpId]
            // Process if any pricing is set (empty = don't update, 0 = free)
            const hasBasePrice = isValueSet(priceData?.pricePerNight)
            const hasExtraAdult = isValueSet(priceData?.extraAdult)
            const hasExtraInfant = isValueSet(priceData?.extraInfant)
            const hasChildPricing = priceData?.childOrderPricing?.some(p => isValueSet(p))
            const hasSingleSupplement = isValueSet(priceData?.singleSupplement)

            if (hasBasePrice || hasExtraAdult || hasExtraInfant || hasChildPricing || hasSingleSupplement) {
              // Build cells for this room+mealplan combination
              const cells = uniqueDates.map(date => ({
                date,
                roomTypeId: rtId,
                mealPlanId: mpId
              }))
              console.log('Sending cells:', cells.length, 'pricePerNight:', priceData.pricePerNight, 'marketId:', props.market?._id)

              // Build update fields - only include fields with actual values (not empty string)
              const priceUpdateFields = {}

              // Include base price if set
              if (isValueSet(priceData.pricePerNight)) {
                priceUpdateFields.pricePerNight = Number(priceData.pricePerNight)
              }

              // Include extra person pricing if set
              if (isValueSet(priceData.extraAdult)) {
                priceUpdateFields.extraAdult = Number(priceData.extraAdult)
              }
              if (isValueSet(priceData.extraInfant)) {
                priceUpdateFields.extraInfant = Number(priceData.extraInfant)
              }
              // Only include child pricing values that are set
              if (priceData.childOrderPricing?.some(p => isValueSet(p))) {
                priceUpdateFields.childOrderPricing = priceData.childOrderPricing.map(p =>
                  isValueSet(p) ? Number(p) : null
                )
              }
              // Include single supplement if set
              if (isValueSet(priceData.singleSupplement)) {
                priceUpdateFields.singleSupplement = Number(priceData.singleSupplement)
              }

              try {
                console.log(`Calling API for RT:${rtId.slice(-6)} MP:${mpId.slice(-6)} with ${cells.length} cells`)
                console.log('First cell date:', cells[0]?.date, 'Last cell date:', cells[cells.length - 1]?.date)
                const result = await planningService.bulkUpdateByDates(
                  props.hotelId,
                  cells,
                  priceUpdateFields,
                  props.market?._id
                )
                console.log('API result:', JSON.stringify(result?.data))
                totalUpdates += (result?.data?.created || 0) + (result?.data?.updated || 0) + (result?.data?.split || 0)
              } catch (err) {
                console.error('API error for RT/MP:', rtId.slice(-6), mpId.slice(-6), err.message || err)
                toast.error(`Error: ${err.message || 'Unknown error'}`)
              }
            }
          }
        }

        console.log('totalUpdates:', totalUpdates)
        if (totalUpdates > 0) {
          toast.success(t('planning.pricing.bulkUpdateSuccess') + ` (${totalUpdates})`)
          emit('saved')
          close()
          return
        }
      }
    }

    // For restrictions and inventory tabs, use new date-based endpoint
    if (activeTab.value !== 'price') {
      const result = await planningService.bulkUpdateByDates(
        props.hotelId,
        props.selectedCells,
        updateFields,
        props.market?._id
      )
      const count = (result?.data?.created || 0) + (result?.data?.updated || 0) + (result?.data?.split || 0)
      toast.success(t('planning.pricing.bulkUpdateSuccess') + ` (${count})`)
      emit('saved')
      close()
      return
    }

    // Fallback - no valid updates
    toast.warning(t('planning.pricing.noChangesToApply'))
  } catch (error) {
    console.error('Bulk edit error:', error)
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const calculatePriceValue = (currentValue) => {
  const value = form.priceValue || 0

  switch (form.priceMode) {
    case 'set':
      return value
    case 'increase':
      return currentValue + value
    case 'decrease':
      return Math.max(0, currentValue - value)
    case 'percent_increase':
      return Math.round(currentValue * (1 + value / 100))
    case 'percent_decrease':
      return Math.max(0, Math.round(currentValue * (1 - value / 100)))
    default:
      return value
  }
}

const calculateAllotmentValue = (currentValue) => {
  const value = form.allotmentValue || 0

  switch (form.allotmentMode) {
    case 'set':
      return value
    case 'increase':
      return currentValue + value
    case 'decrease':
      return Math.max(0, currentValue - value)
    default:
      return value
  }
}

// Reset form when modal opens
watch(() => props.modelValue, (val) => {
  if (val) {
    activeTab.value = 'price'
    form.priceMode = 'set'
    form.priceValue = 0
    form.updateExtras = false
    form.extraAdult = 0
    form.childOrderPricing = []
    form.extraInfant = 0
    form.allotmentMode = 'set'
    form.allotmentValue = 10
    form.minStay = 1
    form.releaseDays = 0
    form.stopSale = false
    form.singleStop = false
    form.closedToArrival = false
    form.closedToDeparture = false

    // Reset room prices and expanded state
    selectedRoomTab.value = null
    for (const key of Object.keys(roomPrices)) {
      delete roomPrices[key]
    }
    for (const key of Object.keys(expandedMealPlans)) {
      delete expandedMealPlans[key]
    }

    // Initialize room prices after nextTick
    nextTick(() => {
      initRoomPrices()
    })
  }
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from .relative,
.modal-fade-leave-to .relative {
  transform: scale(0.95);
}
</style>
