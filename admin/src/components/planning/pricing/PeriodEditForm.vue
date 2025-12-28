<template>
  <div class="period-edit-form">
    <!-- Period Info Header -->
    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="material-icons text-purple-600 dark:text-purple-400">date_range</span>
            <span class="font-bold text-gray-800 dark:text-white">
              {{ formatDisplayDate(period.startDate) }} - {{ formatDisplayDate(period.endDate) }}
            </span>
          </div>
          <div class="px-3 py-1 bg-purple-200 dark:bg-purple-800 rounded-full text-sm font-bold text-purple-800 dark:text-purple-200">
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
    <div class="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 mb-4">
      <div class="flex gap-1 overflow-x-auto pb-px">
        <button
          v-for="rt in roomTypes"
          :key="rt._id"
          type="button"
          @click="selectedRoomTab = rt._id"
          class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
          :class="[
            selectedRoomTab === rt._id
              ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300',
            rt.isBaseRoom ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
          ]"
        >
          <div class="flex items-center gap-1.5">
            <span v-if="rt.isBaseRoom" class="material-icons text-yellow-500 text-sm">star</span>
            <span class="font-bold">{{ rt.code }}</span>
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
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {{ currentRoomType.code }}
            </div>
            <div>
              <div class="font-medium text-gray-800 dark:text-white text-sm">{{ getRoomTypeName(currentRoomType) }}</div>
              <div class="text-xs text-gray-500 dark:text-slate-400">
                {{ currentRoomType.occupancy?.maxAdults || 2 }}+{{ currentRoomType.occupancy?.maxChildren || 2 }}
              </div>
            </div>
          </div>

          <!-- Allotment, MinStay, Release Inputs -->
          <div class="flex items-center gap-6">
            <!-- Allotment -->
            <div class="flex flex-col items-center">
              <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">{{ $t('planning.pricing.allotment') }}</span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="roomData[selectedRoomTab].allotment = Math.max(0, roomData[selectedRoomTab].allotment - 1)"
                  class="w-7 h-7 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
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
                  @click="roomData[selectedRoomTab].allotment++"
                  class="w-7 h-7 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>

            <!-- MinStay -->
            <div class="flex flex-col items-center">
              <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">{{ $t('planning.pricing.minStay') }}</span>
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
              <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase mb-1">Release</span>
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
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <!-- Header -->
            <thead>
              <tr class="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 w-48">
                  {{ currency }}
                </th>
                <th
                  v-for="mp in mealPlans"
                  :key="mp._id"
                  class="px-2 py-3 text-center"
                >
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
              <tr class="border-b border-gray-100 dark:border-slate-700 bg-green-50/50 dark:bg-green-900/10">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-green-600 text-lg">hotel</span>
                    <span class="font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.pricing.basePrice') }}</span>
                  </div>
                </td>
                <td
                  v-for="mp in mealPlans"
                  :key="mp._id"
                  class="px-2 py-3 text-center"
                >
                  <input
                    v-model.number="roomData[selectedRoomTab].prices[mp._id].pricePerNight"
                    type="number"
                    min="0"
                    step="1"
                    class="w-24 text-center text-lg font-bold border-2 rounded-lg px-2 py-1.5 transition-colors"
                    :class="roomData[selectedRoomTab].prices[mp._id]?.pricePerNight > 0
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'"
                    placeholder="0"
                  />
                </td>
              </tr>

              <!-- Extra Adult Row -->
              <tr class="border-b border-gray-100 dark:border-slate-700">
                <td class="px-4 py-2">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-amber-500 text-sm">person_add</span>
                    <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.extraAdultShort') }}</span>
                  </div>
                </td>
                <td
                  v-for="mp in mealPlans"
                  :key="mp._id"
                  class="px-2 py-2 text-center"
                >
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
                    <span class="text-gray-600 dark:text-slate-400">{{ childIndex }}. {{ $t('planning.pricing.child') }}</span>
                  </div>
                </td>
                <td
                  v-for="mp in mealPlans"
                  :key="mp._id"
                  class="px-2 py-2 text-center"
                >
                  <div class="flex items-center justify-center gap-1">
                    <span class="text-xs text-gray-400">+</span>
                    <input
                      v-model.number="roomData[selectedRoomTab].prices[mp._id].childOrderPricing[childIndex - 1]"
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
                    <span class="material-icons text-purple-500 text-sm">baby_changing_station</span>
                    <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.extraInfantShort') }}</span>
                  </div>
                </td>
                <td
                  v-for="mp in mealPlans"
                  :key="mp._id"
                  class="px-2 py-2 text-center"
                >
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
                    <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.pricing.singleOccupancy') }}</span>
                  </div>
                </td>
                <td
                  v-for="mp in mealPlans"
                  :key="mp._id"
                  class="px-2 py-2 text-center"
                >
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
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.quickFill') }}:</span>
        <button
          type="button"
          @click="copyFirstPriceToAllMealPlans"
          class="text-sm px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 transition-colors"
        >
          {{ $t('planning.pricing.copyToAllMealPlans') }}
        </button>
        <button
          type="button"
          @click="copyCurrentRoomToAll"
          class="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors"
        >
          {{ $t('planning.pricing.copyToAllRooms') }}
        </button>
      </div>
    </div>

    <!-- Footer Buttons -->
    <div class="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn-secondary"
      >
        {{ $t('common.cancel') }}
      </button>
      <button
        type="button"
        @click="handleSave"
        class="btn-primary flex items-center gap-2"
        :disabled="saving"
      >
        <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
        <span class="material-icons" v-else>check</span>
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

const props = defineProps({
  hotelId: { type: String, required: true },
  period: { type: Object, required: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  market: { type: Object, default: null },
  existingRates: { type: Array, default: () => [] }
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

const calculateNights = computed(() => {
  if (!props.period?.startDate || !props.period?.endDate) return 0
  const start = new Date(props.period.startDate)
  const end = new Date(props.period.endDate)
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
})

// Methods
const getRoomTypeName = (roomType) => {
  if (!roomType) return ''
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || ''
}

const getMealPlanBg = (code) => {
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

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getMaxChildrenForRoom = (roomTypeId) => {
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

    roomData[rt._id] = {
      prices: {},
      allotment: existingRate?.allotment ?? props.period.allotment ?? 10,
      minStay: existingRate?.minStay ?? props.period.minStay ?? 1,
      releaseDays: existingRate?.releaseDays ?? props.period.releaseDays ?? 0
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
          childOrderPricing: existingMpRate.childOrderPricing?.length ? [...existingMpRate.childOrderPricing] : Array(maxChildren).fill(0),
          extraInfant: existingMpRate.extraInfant || 0,
          singleSupplement: existingMpRate.singleSupplement || 0
        }
      } else {
        // Use period data for first meal plan, empty for others
        const isFirstMp = mp._id === props.mealPlans[0]?._id
        roomData[rt._id].prices[mp._id] = {
          pricePerNight: isFirstMp ? (props.period.pricePerNight || 0) : 0,
          extraAdult: isFirstMp ? (props.period.extraAdult || 0) : 0,
          childOrderPricing: isFirstMp && props.period.childOrderPricing?.length
            ? [...props.period.childOrderPricing]
            : Array(maxChildren).fill(0),
          extraInfant: isFirstMp ? (props.period.extraInfant || 0) : 0,
          singleSupplement: isFirstMp ? (props.period.singleSupplement || 0) : 0
        }
      }
    })
  })

  // Set first room as selected
  if (props.roomTypes.length > 0 && !selectedRoomTab.value) {
    selectedRoomTab.value = props.roomTypes[0]._id
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

    // For each room type that has prices
    props.roomTypes.forEach(rt => {
      const data = roomData[rt._id]
      if (!data) return

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

        promises.push(planningService.createRate(props.hotelId, rateData))
      })
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
watch([() => props.roomTypes, () => props.mealPlans, () => props.period], () => {
  initializeRoomData()
}, { immediate: true, deep: true })

onMounted(() => {
  initializeRoomData()
})
</script>
