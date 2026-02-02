<template>
  <div class="period-edit-form">
    <!-- Period Info Header -->
    <div
      class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-800"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="material-icons text-purple-600 dark:text-purple-400">date_range</span>
            <span class="font-bold text-gray-800 dark:text-white">
              {{ formatDisplayDate(period.startDate) }} - {{ formatDisplayDate(period.endDate) }}
            </span>
          </div>
          <div
            class="px-3 py-1 bg-purple-200 dark:bg-purple-800 rounded-full text-sm font-bold text-purple-800 dark:text-purple-200"
          >
            {{ calculateNights }} {{ $t('planning.pricing.nights') }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="material-icons text-green-600 text-sm">payments</span>
          <span class="font-bold text-green-600">{{ currency }}</span>
        </div>
      </div>
    </div>

    <!-- Room Type Tabs -->
    <div
      class="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 mb-4"
    >
      <div class="flex gap-1 overflow-x-auto pb-px">
        <button
          v-for="rt in roomTypes"
          :key="rt._id"
          type="button"
          class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
          :class="[
            selectedRoomTab === rt._id
              ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300',
            rt.isBaseRoom ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
          ]"
          @click="selectedRoomTab = rt._id"
        >
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-1">
              <span v-if="rt.isBaseRoom" class="material-icons text-yellow-500 text-sm">star</span>
              <span class="font-bold">{{ rt.code }}</span>
            </div>
            <!-- Pricing Type Tag - below room code -->
            <span
              class="px-1 py-0 rounded text-[8px] font-medium mt-0.5"
              :class="getPricingTypeClass(rt)"
            >
              {{ getPricingTypeLabel(rt) }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Selected Room Content -->
    <div v-if="selectedRoomTab && currentRoomType && roomData[selectedRoomTab]" class="space-y-4">
      <!-- Room Info with Allotment, MinStay, Release -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <!-- Room Info -->
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm"
            >
              {{ currentRoomType.code }}
            </div>
            <div>
              <div class="font-medium text-gray-800 dark:text-white text-sm">
                {{ getRoomTypeName(currentRoomType) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-slate-400">
                {{ currentRoomType.occupancy?.maxAdults ?? 2 }}+{{
                  currentRoomType.occupancy?.maxChildren ?? 0
                }}
              </div>
            </div>
          </div>

          <!-- Allotment, MinStay, Release Inputs -->
          <div class="flex items-center gap-6">
            <!-- Allotment -->
            <div class="flex flex-col items-center">
              <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">{{
                $t('planning.pricing.allotment')
              }}</span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="w-7 h-7 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                  @click="
                    roomData[selectedRoomTab].allotment = Math.max(
                      0,
                      roomData[selectedRoomTab].allotment - 1
                    )
                  "
                >
                  <span class="material-icons text-sm">remove</span>
                </button>
                <input
                  v-model.number="roomData[selectedRoomTab].allotment"
                  type="number"
                  min="0"
                  class="w-14 text-center text-sm font-bold border-2 border-blue-300 dark:border-blue-700 rounded-lg py-1.5 bg-white dark:bg-slate-800"
                />
                <button
                  type="button"
                  class="w-7 h-7 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                  @click="roomData[selectedRoomTab].allotment++"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>

            <!-- MinStay -->
            <div class="flex flex-col items-center">
              <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">{{
                $t('planning.pricing.minStay')
              }}</span>
              <div class="flex items-center gap-1">
                <input
                  v-model.number="roomData[selectedRoomTab].minStay"
                  type="number"
                  min="1"
                  max="30"
                  class="w-14 text-center text-sm font-bold border-2 border-purple-300 dark:border-purple-700 rounded-lg py-1.5 bg-white dark:bg-slate-800"
                />
                <span class="text-xs text-gray-400">{{ $t('planning.pricing.nightsShort') }}</span>
              </div>
            </div>

            <!-- Release Days -->
            <div class="flex flex-col items-center">
              <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1"
                >Release</span
              >
              <div class="flex items-center gap-1">
                <input
                  v-model.number="roomData[selectedRoomTab].releaseDays"
                  type="number"
                  min="0"
                  class="w-14 text-center text-sm font-bold border-2 border-amber-300 dark:border-amber-700 rounded-lg py-1.5 bg-white dark:bg-slate-800"
                />
                <span class="text-xs text-gray-400">{{ $t('planning.pricing.daysShort') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Meal Plan Pricing Table -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <!-- Header -->
            <thead>
              <tr
                class="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
              >
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 w-48"
                >
                  {{ currency }}
                </th>
                <th v-for="mp in mealPlans" :key="mp._id" class="px-2 py-3 text-center">
                  <div
                    class="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold"
                    :class="getMealPlanBg(mp.code)"
                  >
                    {{ mp.code }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Base Price Row -->
              <tr
                class="border-b border-gray-100 dark:border-slate-700"
                :class="
                  currentRoomUsesMultipliers
                    ? 'bg-purple-50/50 dark:bg-purple-900/10'
                    : 'bg-green-50/50 dark:bg-green-900/10'
                "
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="material-icons text-lg"
                      :class="currentRoomUsesMultipliers ? 'text-purple-600' : 'text-green-600'"
                    >
                      {{ currentRoomUsesMultipliers ? 'calculate' : 'hotel' }}
                    </span>
                    <span class="font-medium text-gray-700 dark:text-slate-300">
                      {{
                        currentRoomUsesMultipliers
                          ? 'Baz Fiyat'
                          : currentRoomPricingType === 'per_person'
                            ? 'Kişi Başı Fiyat'
                            : $t('planning.pricing.pricePerNight')
                      }}
                    </span>
                  </div>
                </td>
                <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-3 text-center">
                  <input
                    v-model.number="roomData[selectedRoomTab].prices[mp._id].pricePerNight"
                    type="number"
                    min="0"
                    step="1"
                    class="w-24 text-center text-lg font-bold border-2 rounded-lg px-2 py-1.5 transition-colors"
                    :class="
                      roomData[selectedRoomTab].prices[mp._id]?.pricePerNight > 0
                        ? currentRoomUsesMultipliers
                          ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                    "
                    placeholder="0"
                  />
                </td>
              </tr>

              <!-- Multiplier OBP: Combination Table Preview -->
              <tr
                v-if="currentRoomUsesMultipliers"
                class="border-b border-gray-100 dark:border-slate-700"
              >
                <td :colspan="mealPlans.length + 1" class="p-0">
                  <div class="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20">
                    <div
                      class="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1"
                    >
                      <span class="material-icons text-sm">table_chart</span>
                      Tüm Kombinasyonlar (Çarpan × Baz Fiyat)
                    </div>
                    <div
                      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[200px] overflow-y-auto"
                    >
                      <div
                        v-for="combo in activeCombinations"
                        :key="combo.key"
                        class="flex flex-col text-xs bg-white dark:bg-slate-800 rounded px-2 py-1.5"
                      >
                        <!-- Line 1: Combination key -->
                        <span class="text-indigo-600 dark:text-indigo-400 font-medium">
                          {{ formatCombinationKey(combo) }}
                        </span>
                        <!-- Line 2: Multiplier and price -->
                        <div class="flex items-center justify-between mt-0.5">
                          <span class="text-gray-400 text-[10px]"
                            >×{{ combo.overrideMultiplier || combo.calculatedMultiplier }}</span
                          >
                          <span
                            class="font-bold"
                            :class="getFirstMealPlanPrice > 0 ? 'text-green-600' : 'text-gray-400'"
                          >
                            {{
                              getFirstMealPlanPrice > 0
                                ? Math.round(
                                    getFirstMealPlanPrice *
                                      (combo.overrideMultiplier || combo.calculatedMultiplier)
                                  ).toLocaleString()
                                : '-'
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="text-[10px] text-gray-500 mt-2">
                      * Fiyatlar ilk pansiyon ({{ mealPlans[0]?.code }}) için gösterilmektedir
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Extra pricing rows (only for Unit and standard OBP, NOT for multiplier OBP) -->
              <template v-if="!currentRoomUsesMultipliers">
                <!-- Extra Adult Row -->
                <tr class="border-b border-gray-100 dark:border-slate-700">
                  <td class="px-4 py-2">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-amber-500 text-sm">person_add</span>
                      <span class="text-gray-600 dark:text-slate-400">{{
                        $t('planning.pricing.extraAdultShort')
                      }}</span>
                    </div>
                  </td>
                  <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-2 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <span class="text-xs text-gray-400">+</span>
                      <input
                        v-model.number="roomData[selectedRoomTab].prices[mp._id].extraAdult"
                        type="number"
                        min="0"
                        class="w-20 text-center text-sm border rounded-lg px-2 py-1 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                        placeholder="0"
                      />
                    </div>
                  </td>
                </tr>

                <!-- Child Order Pricing Rows -->
                <tr
                  v-for="childIndex in maxChildrenForCurrentRoom"
                  :key="'child-' + childIndex"
                  class="border-b border-gray-100 dark:border-slate-700"
                >
                  <td class="px-4 py-2">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-pink-500 text-sm">child_care</span>
                      <span class="text-gray-600 dark:text-slate-400"
                        >{{ childIndex }}. {{ $t('planning.pricing.child') }}</span
                      >
                    </div>
                  </td>
                  <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-2 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <span class="text-xs text-gray-400">+</span>
                      <input
                        v-model.number="
                          roomData[selectedRoomTab].prices[mp._id].childOrderPricing[childIndex - 1]
                        "
                        type="number"
                        min="0"
                        class="w-20 text-center text-sm border rounded-lg px-2 py-1 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                        placeholder="0"
                      />
                    </div>
                  </td>
                </tr>

                <!-- Extra Infant Row -->
                <tr class="border-b border-gray-100 dark:border-slate-700">
                  <td class="px-4 py-2">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-purple-500 text-sm"
                        >baby_changing_station</span
                      >
                      <span class="text-gray-600 dark:text-slate-400">{{
                        $t('planning.pricing.extraInfantShort')
                      }}</span>
                    </div>
                  </td>
                  <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-2 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <span class="text-xs text-gray-400">+</span>
                      <input
                        v-model.number="roomData[selectedRoomTab].prices[mp._id].extraInfant"
                        type="number"
                        min="0"
                        class="w-20 text-center text-sm border rounded-lg px-2 py-1 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                        placeholder="0"
                      />
                    </div>
                  </td>
                </tr>

                <!-- Single Occupancy Discount Row -->
                <tr class="bg-blue-50/50 dark:bg-blue-900/10">
                  <td class="px-4 py-2">
                    <div class="flex items-center gap-2">
                      <span class="material-icons text-blue-500 text-sm">person</span>
                      <span class="text-gray-600 dark:text-slate-400">{{
                        $t('planning.pricing.singleOccupancy')
                      }}</span>
                    </div>
                  </td>
                  <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-2 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <span class="text-xs text-gray-400">−</span>
                      <input
                        v-model.number="roomData[selectedRoomTab].prices[mp._id].singleSupplement"
                        type="number"
                        min="0"
                        class="w-20 text-center text-sm border rounded-lg px-2 py-1 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                        placeholder="0"
                      />
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Multiplier OBP Info Row -->
              <tr v-if="currentRoomUsesMultipliers" class="bg-purple-50/50 dark:bg-purple-900/10">
                <td :colspan="mealPlans.length + 1" class="px-4 py-3 text-center">
                  <div
                    class="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400"
                  >
                    <span class="material-icons text-sm">info</span>
                    <span class="text-sm"
                      >Bu oda çarpanlı kişi bazlı fiyatlandırma kullanıyor. Ek fiyatlar çarpanlardan
                      hesaplanır.</span
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-slate-400"
          >{{ $t('planning.pricing.quickFill') }}:</span
        >
        <button
          type="button"
          class="text-sm px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 transition-colors"
          @click="copyFirstPriceToAllMealPlans"
        >
          {{ $t('planning.pricing.copyToAllMealPlans') }}
        </button>
        <button
          type="button"
          class="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors"
          @click="copyCurrentRoomToAll"
        >
          {{ $t('planning.pricing.copyToAllRooms') }}
        </button>
      </div>

      <!-- Multiplier Override Section (for OBP rooms with multipliers) -->
      <div v-if="currentRoomUsesMultipliers" class="mt-6">
        <!-- Override Toggle Header -->
        <div
          class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                <span class="material-icons text-white">calculate</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('planning.pricing.multiplierOverride') }}
                </h4>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ $t('planning.pricing.multiplierOverrideHint') }}
                </p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="roomData[selectedRoomTab].useMultiplierOverride"
                type="checkbox"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
              ></div>
              <span
                class="ms-2 text-sm font-medium"
                :class="
                  roomData[selectedRoomTab].useMultiplierOverride
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-slate-400'
                "
              >
                {{
                  roomData[selectedRoomTab].useMultiplierOverride
                    ? $t('common.active')
                    : $t('common.inactive')
                }}
              </span>
            </label>
          </div>

          <!-- Info when disabled -->
          <div
            v-if="!roomData[selectedRoomTab].useMultiplierOverride"
            class="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg"
          >
            <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
              <span class="material-icons text-sm text-blue-500">info</span>
              {{ $t('planning.pricing.usingRoomMultipliers') }}
            </p>
          </div>
        </div>

        <!-- Multiplier Template (when override enabled) -->
        <div v-if="roomData[selectedRoomTab].useMultiplierOverride" class="mt-4">
          <MultiplierTemplate
            v-model="roomData[selectedRoomTab].multiplierOverride"
            :occupancy="currentRoomType.occupancy"
            :child-age-groups="childAgeGroups"
            :currency="currency"
          />
        </div>
      </div>
    </div>

    <!-- Footer Buttons -->
    <div
      class="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-slate-700"
    >
      <button type="button" class="btn-secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </button>
      <button
        type="button"
        class="btn-primary flex items-center gap-2"
        :disabled="saving"
        @click="handleSave"
      >
        <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
        <span v-else class="material-icons">check</span>
        {{ saving ? $t('common.saving') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'
import MultiplierTemplate from '@/components/planning/rooms/MultiplierTemplate.vue'

const props = defineProps({
  hotelId: { type: String, required: true },
  period: { type: Object, required: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  market: { type: Object, default: null },
  existingRates: { type: Array, default: () => [] },
  childAgeGroups: { type: Array, default: () => [] },
  selectedRoomType: { type: String, default: '' }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()

const saving = ref(false)
const selectedRoomTab = ref('')

// Room data: { roomTypeId: { prices: { mealPlanId: {...} }, allotment, minStay, releaseDays } }
const roomData = reactive({})

const currency = computed(() => props.market?.currency || 'EUR')

const currentRoomType = computed(() => props.roomTypes.find(rt => rt._id === selectedRoomTab.value))

const maxChildrenForCurrentRoom = computed(() => {
  return currentRoomType.value?.occupancy?.maxChildren ?? 2
})

// Check if current room uses OBP with multipliers
const currentRoomUsesMultipliers = computed(() => {
  const rt = currentRoomType.value
  return rt?.pricingType === 'per_person' && rt?.useMultipliers === true
})

// Get current room pricing type
const currentRoomPricingType = computed(() => {
  return currentRoomType.value?.pricingType || 'unit'
})

// Get active combinations for current room
const activeCombinations = computed(() => {
  const rt = currentRoomType.value
  const table = rt?.multiplierTemplate?.combinationTable || []
  return table.filter(c => c.isActive !== false)
})

// Get first meal plan price for combination preview
const getFirstMealPlanPrice = computed(() => {
  if (!props.mealPlans?.length || !selectedRoomTab.value) return 0
  const firstMpId = props.mealPlans[0]?._id
  return roomData[selectedRoomTab.value]?.prices?.[firstMpId]?.pricePerNight || 0
})

// Format combination key for display: "2+2 (0-2, 3-12)"
const formatCombinationKey = combo => {
  const adults = combo.adults
  const children = combo.children || []

  if (children.length === 0) {
    return `${adults}`
  }

  // Get age ranges from childAgeGroups prop
  const ageGroups = props.childAgeGroups || []

  const getAgeRange = ageGroupCode => {
    const group = ageGroups.find(g => g.code === ageGroupCode)
    if (group) {
      return `${group.minAge}-${group.maxAge}`
    }
    // Fallback if not found
    const fallbacks = {
      infant: '0-2',
      first: '3-6',
      second: '7-11',
      third: '12-17'
    }
    return fallbacks[ageGroupCode] || ageGroupCode
  }

  const ageRanges = children.map(c => getAgeRange(c.ageGroup))
  return `${adults}+${children.length} (${ageRanges.join(', ')})`
}

const calculateNights = computed(() => {
  if (!props.period?.startDate || !props.period?.endDate) return 0
  const start = new Date(props.period.startDate)
  const end = new Date(props.period.endDate)
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
})

// Methods
const getRoomTypeName = roomType => {
  if (!roomType) return ''
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || ''
}

const getMealPlanBg = code => {
  const colors = {
    RO: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    BB: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    HB: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    FB: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    AI: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    UAI: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

// Get pricing type label for room type
const getPricingTypeLabel = rt => {
  if (rt.pricingType === 'per_person') {
    return rt.useMultipliers ? 'OBP×' : 'OBP'
  }
  return 'Unit'
}

// Get pricing type CSS class for room type
const getPricingTypeClass = rt => {
  if (rt.pricingType === 'per_person') {
    if (rt.useMultipliers) {
      return 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300'
    }
    return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300'
  }
  return 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300'
}

const formatDisplayDate = dateStr => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getMaxChildrenForRoom = roomTypeId => {
  const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
  return roomType?.occupancy?.maxChildren ?? 2
}

// Initialize room data from period and existing rates
const initializeRoomData = () => {
  props.roomTypes.forEach(rt => {
    const maxChildren = getMaxChildrenForRoom(rt._id)

    // Try to find existing rate for this room
    const existingRate = props.existingRates.find(r => {
      const rRoomId = r.roomType?._id || r.roomType
      return rRoomId === rt._id
    })

    // Check if room uses OBP with multipliers
    const usesMultipliers = rt.pricingType === 'per_person' && rt.useMultipliers === true

    roomData[rt._id] = {
      prices: {},
      allotment: existingRate?.allotment ?? props.period.allotment ?? 10,
      minStay: existingRate?.minStay ?? props.period.minStay ?? 1,
      releaseDays: existingRate?.releaseDays ?? props.period.releaseDays ?? 0,
      // Multiplier override for OBP rooms
      useMultiplierOverride: existingRate?.useMultiplierOverride ?? false,
      multiplierOverride: usesMultipliers
        ? (existingRate?.multiplierOverride ??
          JSON.parse(JSON.stringify(rt.multiplierTemplate || {})))
        : null
    }

    // Initialize prices for each meal plan
    props.mealPlans.forEach(mp => {
      // Try to find existing rate for this room/meal combination
      const existingMpRate = props.existingRates.find(r => {
        const rRoomId = r.roomType?._id || r.roomType
        const rMealId = r.mealPlan?._id || r.mealPlan
        return rRoomId === rt._id && rMealId === mp._id
      })

      if (existingMpRate) {
        roomData[rt._id].prices[mp._id] = {
          pricePerNight: existingMpRate.pricePerNight || 0,
          extraAdult: existingMpRate.extraAdult || 0,
          childOrderPricing: existingMpRate.childOrderPricing?.length
            ? [...existingMpRate.childOrderPricing]
            : Array(maxChildren).fill(0),
          extraInfant: existingMpRate.extraInfant || 0,
          singleSupplement: existingMpRate.singleSupplement || 0
        }
      } else {
        // Use period data for first meal plan, empty for others
        const isFirstMp = mp._id === props.mealPlans[0]?._id
        roomData[rt._id].prices[mp._id] = {
          pricePerNight: isFirstMp ? props.period.pricePerNight || 0 : 0,
          extraAdult: isFirstMp ? props.period.extraAdult || 0 : 0,
          childOrderPricing:
            isFirstMp && props.period.childOrderPricing?.length
              ? [...props.period.childOrderPricing]
              : Array(maxChildren).fill(0),
          extraInfant: isFirstMp ? props.period.extraInfant || 0 : 0,
          singleSupplement: isFirstMp ? props.period.singleSupplement || 0 : 0
        }
      }
    })
  })

  // Set the selected room tab based on passed prop or default to first room
  if (props.roomTypes.length > 0 && !selectedRoomTab.value) {
    // If a specific room type was selected in the filter, use it
    if (props.selectedRoomType && props.roomTypes.find(rt => rt._id === props.selectedRoomType)) {
      selectedRoomTab.value = props.selectedRoomType
    } else {
      selectedRoomTab.value = props.roomTypes[0]._id
    }
  }
}

// Copy first meal plan price to all meal plans (current room)
const copyFirstPriceToAllMealPlans = () => {
  const firstMealPlan = props.mealPlans[0]
  if (!firstMealPlan || !roomData[selectedRoomTab.value]?.prices[firstMealPlan._id]) return

  const source = roomData[selectedRoomTab.value].prices[firstMealPlan._id]
  props.mealPlans.forEach(mp => {
    if (mp._id !== firstMealPlan._id) {
      roomData[selectedRoomTab.value].prices[mp._id] = {
        ...source,
        childOrderPricing: [...source.childOrderPricing]
      }
    }
  })
  toast.success(t('planning.pricing.copiedToMealPlans'))
}

// Copy current room's prices to all rooms
const copyCurrentRoomToAll = () => {
  const source = roomData[selectedRoomTab.value]
  if (!source) return

  props.roomTypes.forEach(rt => {
    if (rt._id !== selectedRoomTab.value) {
      roomData[rt._id] = {
        ...source,
        prices: {}
      }
      props.mealPlans.forEach(mp => {
        roomData[rt._id].prices[mp._id] = {
          ...source.prices[mp._id],
          childOrderPricing: [...(source.prices[mp._id]?.childOrderPricing || [])]
        }
      })
    }
  })
  toast.success(t('planning.pricing.copiedToRooms'))
}

const handleSave = async () => {
  saving.value = true
  try {
    const promises = []

    // Only save for the currently selected room tab
    const rt = props.roomTypes.find(r => r._id === selectedRoomTab.value)
    if (!rt) {
      toast.error(t('planning.pricing.selectRoomType'))
      saving.value = false
      return
    }

    const data = roomData[rt._id]
    if (!data) {
      toast.error(t('planning.pricing.noDataForRoom'))
      saving.value = false
      return
    }

    // For each meal plan
    props.mealPlans.forEach(mp => {
      const priceData = data.prices[mp._id]
      if (!priceData || priceData.pricePerNight <= 0) return

      const rateData = {
        roomType: rt._id,
        mealPlan: mp._id,
        market: props.market._id,
        startDate: props.period.startDate,
        endDate: props.period.endDate,
        pricePerNight: priceData.pricePerNight,
        singleSupplement: priceData.singleSupplement || 0,
        extraAdult: priceData.extraAdult || 0,
        childOrderPricing: priceData.childOrderPricing || [],
        extraInfant: priceData.extraInfant || 0,
        currency: currency.value,
        allotment: data.allotment ?? 10,
        minStay: data.minStay || 1,
        releaseDays: data.releaseDays || 0
      }

      // Add multiplier override if room uses OBP with multipliers
      const usesMultipliers = rt.pricingType === 'per_person' && rt.useMultipliers === true
      if (usesMultipliers) {
        rateData.useMultiplierOverride = data.useMultiplierOverride || false
        if (data.useMultiplierOverride && data.multiplierOverride) {
          rateData.multiplierOverride = data.multiplierOverride
        }
      }

      promises.push(planningService.createRate(props.hotelId, rateData))
    })

    if (promises.length === 0) {
      toast.error(t('planning.pricing.atLeastOnePrice'))
      saving.value = false
      return
    }

    await Promise.all(promises)
    toast.success(t('planning.pricing.ratesUpdated'))
    emit('saved')
  } catch (error) {
    console.error('Error saving period:', error)
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Watch for prop changes
watch(
  [() => props.roomTypes, () => props.mealPlans, () => props.period],
  () => {
    initializeRoomData()
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  initializeRoomData()
})
</script>
