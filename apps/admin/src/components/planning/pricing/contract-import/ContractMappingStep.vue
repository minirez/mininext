<template>
  <div class="space-y-6">
    <!-- Contract Info Summary -->
    <div
      class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4"
    >
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-gray-500 dark:text-gray-400">{{
            $t('planning.pricing.contractImport.pricingTypeLabel')
          }}</span>
          <div class="flex items-center gap-2">
            <p class="font-medium text-gray-900 dark:text-white">
              {{
                hasMultiplierPricing
                  ? $t('planning.pricing.contractImport.pricingTypeMultiplier')
                  : hasOBPPricing
                    ? $t('planning.pricing.contractImport.pricingTypeOBP')
                    : $t('planning.pricing.contractImport.pricingTypeUnit')
              }}
            </p>
            <span
              v-if="hasOBPPricing && !hasMultiplierPricing"
              class="px-1.5 py-0.5 text-xs rounded bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 font-semibold"
              >OBP</span
            >
            <span
              v-if="hasMultiplierPricing"
              class="px-1.5 py-0.5 text-xs rounded bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 font-semibold"
              >{{ $t('planning.pricing.contractImport.multiplierBadge') }}</span
            >
          </div>
        </div>
        <div v-if="parsedData?.contractInfo?.childAgeRanges?.length">
          <span class="text-gray-500 dark:text-gray-400">{{
            $t('planning.pricing.contractImport.childAges')
          }}</span>
          <p class="font-medium text-gray-900 dark:text-white text-xs">
            {{
              parsedData.contractInfo.childAgeRanges.map(r => `${r.minAge}-${r.maxAge}`).join(', ')
            }}
          </p>
        </div>
        <div v-if="hasOBPPricing">
          <span class="text-gray-500 dark:text-gray-400">OBP</span>
          <p class="font-medium text-gray-900 dark:text-white text-xs">
            {{ obpOccupancyRange }}
          </p>
        </div>
      </div>
    </div>

    <!-- Season Info -->
    <div
      class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800"
    >
      <h4 class="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <span class="material-icons text-purple-600">event</span>
        {{ $t('planning.pricing.contractImport.seasonToCreate') }}
      </h4>
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <p class="text-lg font-bold text-purple-700 dark:text-purple-300">
            {{ seasonYear }} {{ $t('planning.pricing.contractImport.seasonSuffix') }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ formatDate(seasonStartDate) }} → {{ formatDate(seasonEndDate) }}
            <span class="text-xs text-gray-500"
              >({{ seasonDays }} {{ $t('planning.pricing.contractImport.daysCount') }})</span
            >
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ parsedData?.periods?.length || 0 }}
            {{ $t('planning.pricing.contractImport.periodCount') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Periods -->
    <div>
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-blue-600">payments</span>
        {{ $t('planning.pricing.contractImport.pricePeriods') }} ({{
          parsedData?.periods?.length || 0
        }})
      </h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        <div
          v-for="period in parsedData?.periods"
          :key="period.code"
          class="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm"
        >
          <span
            class="w-10 h-6 rounded text-xs flex items-center justify-center font-mono bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 shrink-0"
            >{{ period.code }}</span
          >
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">{{ period.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(period.startDate) }} → {{ formatDate(period.endDate) }}
            </p>
          </div>
          <!-- MinStay & ReleaseDay badges -->
          <div class="flex items-center gap-1 shrink-0">
            <span
              v-if="period.minStay > 1"
              class="px-1.5 py-0.5 text-xs rounded font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              :title="$t('planning.pricing.contractImport.defaultMinStay')"
            >
              {{ $t('planning.pricing.contractImport.minStayShort') }}:{{ period.minStay
              }}{{ $t('planning.pricing.contractImport.nightSuffix') }}
            </span>
            <span
              v-if="period.releaseDay > 0"
              class="px-1.5 py-0.5 text-xs rounded font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
              :title="'Release Day'"
            >
              {{ $t('planning.pricing.contractImport.releaseDayShort') }}:{{ period.releaseDay
              }}{{ $t('planning.pricing.contractImport.daySuffix') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Room Type Mappings -->
    <div>
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-green-600">hotel</span>
        {{ $t('planning.pricing.contractImport.roomMappings') }}
        <span class="text-xs font-normal text-gray-500"
          >({{ newRoomCount }} {{ $t('planning.pricing.contractImport.newLabel') }},
          {{ existingRoomCount }} {{ $t('planning.pricing.contractImport.existingLabel') }})</span
        >
        <span
          v-if="roomMappingPercentage > 0"
          class="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
          :class="
            roomMappingPercentage >= 80
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : roomMappingPercentage >= 50
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          "
        >
          %{{ roomMappingPercentage }} {{ $t('planning.pricing.contractImport.matched') }}
        </span>
      </h4>
      <div class="space-y-2 max-h-[28rem] overflow-y-auto">
        <div
          v-for="room in parsedData?.roomTypes"
          :key="room.contractName"
          class="flex items-center gap-3 p-3 rounded-lg"
          :class="
            room.isNewRoom
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-gray-50 dark:bg-slate-800'
          "
        >
          <div class="flex-1 min-w-0">
            <!-- Row 1: Room name + badges -->
            <div class="flex items-center gap-2 flex-wrap">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ room.contractName }}
              </p>
              <span
                v-if="room.isNewRoom"
                class="px-1.5 py-0.5 text-xs rounded bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                >{{ $t('planning.pricing.contractImport.newBadge') }}</span
              >
              <!-- Pricing Type Badge -->
              <span
                v-if="getRoomPricingBadge(room)"
                class="px-1.5 py-0.5 text-xs rounded font-semibold"
                :class="getRoomPricingBadge(room).class"
              >
                {{ getRoomPricingBadge(room).label }}
              </span>
              <!-- Room-level MinStay & ReleaseDay -->
              <span
                v-if="room.minStay && room.minStay > 1"
                class="px-1.5 py-0.5 text-xs rounded font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              >
                {{ $t('planning.pricing.contractImport.minStayShort') }}:{{ room.minStay
                }}{{ $t('planning.pricing.contractImport.nightSuffix') }}
              </span>
              <span
                v-if="room.releaseDay && room.releaseDay > 0"
                class="px-1.5 py-0.5 text-xs rounded font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
              >
                {{ $t('planning.pricing.contractImport.releaseDayShort') }}:{{ room.releaseDay
                }}{{ $t('planning.pricing.contractImport.daySuffix') }}
              </span>
            </div>

            <!-- Row 2: Capacity -->
            <p v-if="room.capacity" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span v-if="room.capacity.roomSize" class="mr-1"
                >{{ room.capacity.roomSize }}m² &bull;</span
              >
              {{ $t('planning.pricing.contractImport.defaultAdults') }}:
              {{ room.capacity.standardOccupancy || room.capacity.maxAdults || '?' }}
              {{ $t('planning.pricing.contractImport.adultSuffix') }}
              <template
                v-if="
                  room.capacity.maxAdults &&
                  room.capacity.maxAdults > (room.capacity.standardOccupancy || 0)
                "
              >
                ({{ $t('planning.pricing.contractImport.maxShort') }}
                {{ room.capacity.maxAdults }}AD
                <template v-if="room.capacity.maxChildren"
                  >+ {{ room.capacity.maxChildren }}CHD</template
                >)
              </template>
            </p>
          </div>
          <span class="material-icons text-gray-400">arrow_forward</span>
          <div class="flex-1">
            <select
              :value="roomMappings[room.contractName]"
              class="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
              @change="$emit('updateRoomMapping', room.contractName, $event.target.value)"
            >
              <option value="">{{ $t('planning.pricing.contractImport.skipRoom') }}</option>
              <optgroup
                v-if="existingRoomTypes.length"
                :label="$t('planning.pricing.contractImport.existingRooms')"
              >
                <option v-for="rt in existingRoomTypes" :key="rt.code" :value="rt.code">
                  {{ rt.code }} - {{ getLocalizedName(rt.name) }}
                </option>
              </optgroup>
              <optgroup
                v-if="room.isNewRoom && room.suggestedCode"
                :label="$t('planning.pricing.contractImport.newToCreate')"
              >
                <option :value="room.suggestedCode">
                  {{ room.suggestedCode }} - {{ room.contractName }} ({{
                    $t('planning.pricing.contractImport.newBadge')
                  }})
                </option>
              </optgroup>
            </select>
          </div>
          <div class="w-16 text-center">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="getConfidenceBadgeClass(room.confidence)"
            >
              {{ room.confidence }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Meal Plan Mappings -->
    <div>
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-amber-600">restaurant</span>
        {{ $t('planning.pricing.contractImport.mealPlanMappings') }}
        <span class="text-xs font-normal text-gray-500"
          >({{ newMealPlanCount }} {{ $t('planning.pricing.contractImport.newLabel') }},
          {{ existingMealPlanCount }}
          {{ $t('planning.pricing.contractImport.existingLabel') }})</span
        >
        <span
          v-if="mealPlanMappingPercentage > 0"
          class="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
          :class="
            mealPlanMappingPercentage >= 80
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : mealPlanMappingPercentage >= 50
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          "
        >
          %{{ mealPlanMappingPercentage }} {{ $t('planning.pricing.contractImport.matched') }}
        </span>
      </h4>
      <div class="space-y-2 max-h-48 overflow-y-auto">
        <div
          v-for="mp in parsedData?.mealPlans"
          :key="mp.contractName"
          class="flex items-center gap-3 p-3 rounded-lg"
          :class="
            mp.isNewMealPlan
              ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
              : 'bg-gray-50 dark:bg-slate-800'
          "
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ mp.contractName }}
              </p>
              <span
                v-if="mp.isNewMealPlan"
                class="px-1.5 py-0.5 text-xs rounded bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200"
                >{{ $t('planning.pricing.contractImport.newBadge') }}</span
              >
              <span v-if="mp.matchedCode" class="text-xs text-gray-500"
                >→ {{ mp.matchedCode }}</span
              >
            </div>
          </div>
          <span class="material-icons text-gray-400">arrow_forward</span>
          <div class="flex-1">
            <select
              :value="mealPlanMappings[mp.contractName]"
              class="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm"
              @change="$emit('updateMealPlanMapping', mp.contractName, $event.target.value)"
            >
              <option value="">{{ $t('planning.pricing.contractImport.skipMealPlan') }}</option>
              <optgroup
                v-if="existingMealPlans.length"
                :label="$t('planning.pricing.contractImport.existingMeals')"
              >
                <option v-for="plan in existingMealPlans" :key="plan.code" :value="plan.code">
                  {{ plan.code }} - {{ getLocalizedName(plan.name) }}
                </option>
              </optgroup>
              <optgroup
                v-if="mp.isNewMealPlan && mp.suggestedCode"
                :label="$t('planning.pricing.contractImport.newToCreate')"
              >
                <option :value="mp.suggestedCode">
                  {{ mp.suggestedCode }} - {{ mp.contractName }} ({{
                    $t('planning.pricing.contractImport.newBadge')
                  }})
                </option>
              </optgroup>
            </select>
          </div>
          <div class="w-16 text-center">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="getConfidenceBadgeClass(mp.confidence)"
            >
              {{ mp.confidence }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- EB Campaigns -->
    <div v-if="parsedData?.earlyBookingDiscounts?.length">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-orange-600">local_offer</span>
        {{ $t('planning.pricing.contractImport.campaignsTitle') }}
        ({{ parsedData.earlyBookingDiscounts.length }})
      </h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="(eb, idx) in parsedData.earlyBookingDiscounts"
          :key="idx"
          class="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
        >
          <div class="flex items-center gap-2 mb-1">
            <span
              class="px-2 py-0.5 text-sm font-bold rounded bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200"
              >%{{ eb.discountPercentage }}</span
            >
            <span class="font-medium text-gray-900 dark:text-white text-sm">{{
              eb.name || `EB %${eb.discountPercentage}`
            }}</span>
            <span
              v-if="eb.isCumulative"
              class="px-1.5 py-0.5 text-xs rounded bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
              >{{ $t('planning.pricing.contractImport.cumulative') }}</span
            >
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
            <p v-if="eb.salePeriod">
              <span class="text-gray-400 dark:text-gray-500"
                >{{ $t('planning.pricing.contractImport.salePeriod') }}:</span
              >
              {{ formatDate(eb.salePeriod.startDate) }} → {{ formatDate(eb.salePeriod.endDate) }}
            </p>
            <p v-if="eb.stayPeriod">
              <span class="text-gray-400 dark:text-gray-500"
                >{{ $t('planning.pricing.contractImport.stayPeriod') }}:</span
              >
              {{ formatDate(eb.stayPeriod.startDate) }} → {{ formatDate(eb.stayPeriod.endDate) }}
            </p>
            <p v-if="eb.paymentDueDate">
              <span class="text-gray-400 dark:text-gray-500"
                >{{ $t('planning.pricing.contractImport.paymentDue') }}:</span
              >
              {{ formatDate(eb.paymentDueDate) }}
              <template v-if="eb.paymentPercentage"> (%{{ eb.paymentPercentage }}) </template>
            </p>
            <p v-if="eb.conditions" class="text-gray-400 dark:text-gray-500 italic">
              {{ eb.conditions }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Options -->
    <div class="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-purple-600">settings</span>
        {{ $t('planning.pricing.contractImport.importOptions') }}
      </h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              :checked="importOptions.overwriteExisting"
              type="checkbox"
              class="w-4 h-4 rounded text-purple-600"
              @change="$emit('updateOption', 'overwriteExisting', $event.target.checked)"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              $t('planning.pricing.contractImport.overwriteExisting')
            }}</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              :checked="importOptions.createMissingRooms"
              type="checkbox"
              class="w-4 h-4 rounded text-green-600"
              @change="$emit('updateOption', 'createMissingRooms', $event.target.checked)"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              $t('planning.pricing.contractImport.createMissingRooms')
            }}</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              :checked="importOptions.createMissingMealPlans"
              type="checkbox"
              class="w-4 h-4 rounded text-amber-600"
              @change="$emit('updateOption', 'createMissingMealPlans', $event.target.checked)"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              $t('planning.pricing.contractImport.createMissingMealPlans')
            }}</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              :checked="importOptions.updateRoomCapacity"
              type="checkbox"
              class="w-4 h-4 rounded text-blue-600"
              @change="$emit('updateOption', 'updateRoomCapacity', $event.target.checked)"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              $t('planning.pricing.contractImport.updateCapacity')
            }}</span>
          </label>
        </div>
        <div class="space-y-3">
          <div class="flex items-center gap-4">
            <label class="text-sm text-gray-600 dark:text-gray-400 flex-1">{{
              $t('planning.pricing.contractImport.defaultAllotment')
            }}</label>
            <input
              :value="importOptions.defaultAllotment"
              type="number"
              min="1"
              max="100"
              class="w-20 px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-center"
              @input="$emit('updateOption', 'defaultAllotment', parseInt($event.target.value))"
            />
          </div>
          <div class="flex items-center gap-4">
            <label class="text-sm text-gray-600 dark:text-gray-400 flex-1">{{
              $t('planning.pricing.contractImport.defaultMinStay')
            }}</label>
            <input
              :value="importOptions.defaultMinStay"
              type="number"
              min="1"
              max="30"
              class="w-20 px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-center"
              @input="$emit('updateOption', 'defaultMinStay', parseInt($event.target.value))"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  parsedData: { type: Object, default: null },
  roomMappings: { type: Object, required: true },
  mealPlanMappings: { type: Object, required: true },
  importOptions: { type: Object, required: true },
  existingRoomTypes: { type: Array, required: true },
  existingMealPlans: { type: Array, required: true },
  hasOBPPricing: { type: Boolean, default: false },
  hasMultiplierPricing: { type: Boolean, default: false },
  obpOccupancyRange: { type: String, default: '' },
  seasonYear: { type: Number, required: true },
  seasonStartDate: { type: Date, default: null },
  seasonEndDate: { type: Date, default: null },
  seasonDays: { type: Number, default: 0 },
  newRoomCount: { type: Number, default: 0 },
  existingRoomCount: { type: Number, default: 0 },
  newMealPlanCount: { type: Number, default: 0 },
  existingMealPlanCount: { type: Number, default: 0 },
  roomMappingPercentage: { type: Number, default: 0 },
  mealPlanMappingPercentage: { type: Number, default: 0 },
  formatDate: { type: Function, required: true },
  getLocalizedName: { type: Function, required: true },
  getConfidenceBadgeClass: { type: Function, required: true },
  getRoomPricingDetails: { type: Function, default: () => null },
  formatPrice: { type: Function, default: v => v }
})

defineEmits(['updateRoomMapping', 'updateMealPlanMapping', 'updateOption'])

// Get pricing type badge for a room
const getRoomPricingBadge = room => {
  const details = props.getRoomPricingDetails(room)
  if (!details) return null

  if (details.pricingType === 'per_person_multiplier') {
    return {
      label: t('planning.pricing.contractImport.pricingTypeBadgeOBPx'),
      class: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
    }
  }
  if (details.pricingType === 'per_person') {
    return {
      label: t('planning.pricing.contractImport.pricingTypeBadgeOBP'),
      class: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
    }
  }
  return {
    label: t('planning.pricing.contractImport.pricingTypeBadgeUnit'),
    class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  }
}
</script>
