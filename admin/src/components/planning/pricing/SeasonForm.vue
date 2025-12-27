<template>
  <div class="space-y-6">
    <!-- Code -->
    <div>
      <label class="form-label">{{ $t('planning.pricing.seasonCode') }} <span class="text-red-500">*</span></label>
      <input v-model="form.code" type="text" class="form-input uppercase" maxlength="10" />
    </div>

    <!-- Name (Multilingual) -->
    <MultiLangInput
      v-model="form.name"
      :languages="SUPPORTED_LANGUAGES"
      :label="$t('planning.pricing.seasonName') + ' *'"
    />

    <!-- Color & Priority -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="form-label">{{ $t('planning.pricing.color') }}</label>
        <div class="flex items-center gap-3">
          <input v-model="form.color" type="color" class="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
          <input v-model="form.color" type="text" class="form-input flex-1" placeholder="#6366f1" />
        </div>
      </div>
      <div>
        <label class="form-label">{{ $t('planning.pricing.priority') }}</label>
        <input v-model.number="form.priority" type="number" min="0" max="100" class="form-input" />
        <p class="text-xs text-gray-500 mt-1">{{ $t('planning.pricing.priorityHint') }}</p>
      </div>
    </div>

    <!-- Date Ranges -->
    <div>
      <label class="form-label">{{ $t('planning.pricing.dateRanges') }}</label>
      <div class="space-y-3">
        <div
          v-for="(range, index) in form.dateRanges"
          :key="index"
          class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
        >
          <div class="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 mb-1 block">{{ $t('planning.pricing.startDate') }}</label>
              <DatePicker
                v-model="range.startDate"
                allow-past
                :max-date="range.endDate || null"
                :placeholder="$t('planning.pricing.startDate')"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 mb-1 block">{{ $t('planning.pricing.endDate') }}</label>
              <DatePicker
                v-model="range.endDate"
                allow-past
                :min-date="range.startDate || null"
                :placeholder="$t('planning.pricing.endDate')"
              />
            </div>
          </div>
          <button
            v-if="form.dateRanges.length > 1"
            @click="removeDateRange(index)"
            type="button"
            class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded self-end mb-1"
          >
            <span class="material-icons">close</span>
          </button>
        </div>
        <button
          @click="addDateRange"
          type="button"
          class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('planning.pricing.addDateRange') }}
        </button>
      </div>
    </div>

    <!-- Product Override Section -->
    <div v-if="filteredRoomTypes.length || filteredMealPlans.length" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
      <div class="flex items-center gap-2">
        <span class="material-icons text-blue-500">inventory_2</span>
        <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.productOverride') }}</label>
      </div>
      <p class="text-xs text-gray-500 dark:text-slate-400">
        {{ $t('planning.seasons.productOverrideHint') }}
      </p>

      <!-- Active Room Types Override -->
      <div v-if="filteredRoomTypes.length" class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-blue-500 text-sm">hotel</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.activeRoomTypes') }}</label>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="rt in filteredRoomTypes"
            :key="rt._id"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
            :class="form.activeRoomTypes.includes(rt._id)
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
          >
            <input
              type="checkbox"
              :value="rt._id"
              v-model="form.activeRoomTypes"
              class="sr-only"
            />
            <span class="font-medium">{{ rt.code }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{ rt.name?.[locale] || rt.name?.tr }}</span>
          </label>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.seasons.emptyInheritsMarket') }}
        </p>
      </div>

      <!-- Active Meal Plans Override -->
      <div v-if="filteredMealPlans.length" class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-green-500 text-sm">restaurant</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.activeMealPlans') }}</label>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="mp in filteredMealPlans"
            :key="mp._id"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
            :class="form.activeMealPlans.includes(mp._id)
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
          >
            <input
              type="checkbox"
              :value="mp._id"
              v-model="form.activeMealPlans"
              class="sr-only"
            />
            <span class="font-medium">{{ mp.code }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{ mp.name?.[locale] || mp.name?.tr }}</span>
          </label>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.seasons.emptyInheritsMarket') }}
        </p>
      </div>
    </div>

    <!-- Child Age Override Section -->
    <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-pink-500">child_care</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.childAgeOverride') }}</label>
        </div>
        <!-- Inherit Toggle -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.inheritFromMarket') }}</span>
          <button
            type="button"
            @click="form.childAgeSettings.inheritFromMarket = !form.childAgeSettings.inheritFromMarket"
            class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="form.childAgeSettings.inheritFromMarket
              ? 'bg-pink-500 focus:ring-pink-500'
              : 'bg-gray-300 dark:bg-slate-600 focus:ring-gray-400'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="form.childAgeSettings.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </div>

      <!-- Market Settings Display (when inheriting) -->
      <div v-if="form.childAgeSettings.inheritFromMarket" class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600">
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          <span class="material-icons text-xs">link</span>
          {{ $t('planning.seasons.usingMarketSettings') }}
        </p>
        <div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-slate-400">
          <span v-if="market.childAgeRange?.max">
            {{ $t('planning.markets.childAgeRange') }}: {{ market.childAgeRange.min || 0 }}-{{ market.childAgeRange.max }}
          </span>
          <span v-if="market.infantAgeRange?.max">
            {{ $t('planning.markets.infantAgeRange') }}: {{ market.infantAgeRange.min || 0 }}-{{ market.infantAgeRange.max }}
          </span>
          <span v-if="!market.childAgeRange?.max && !market.infantAgeRange?.max" class="text-amber-600">
            {{ $t('planning.seasons.marketUsesHotelSettings') }}
          </span>
        </div>
      </div>

      <!-- Custom Age Settings (when not inheriting) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Infant Age Range -->
        <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-icons text-purple-500 text-sm">baby_changing_station</span>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.infantAgeRange') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="form.childAgeSettings.infantAgeRange.min"
              type="number"
              min="0"
              max="5"
              class="form-input w-16 text-center"
              placeholder="0"
            />
            <span class="text-gray-500">-</span>
            <input
              v-model.number="form.childAgeSettings.infantAgeRange.max"
              type="number"
              min="0"
              max="5"
              class="form-input w-16 text-center"
              placeholder="2"
            />
            <span class="text-sm text-gray-500">{{ $t('planning.markets.years') }}</span>
          </div>
        </div>

        <!-- Child Age Range -->
        <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-icons text-pink-500 text-sm">child_care</span>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.childAgeRange') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="form.childAgeSettings.childAgeRange.min"
              type="number"
              min="0"
              max="17"
              class="form-input w-16 text-center"
              placeholder="3"
            />
            <span class="text-gray-500">-</span>
            <input
              v-model.number="form.childAgeSettings.childAgeRange.max"
              type="number"
              min="1"
              max="17"
              class="form-input w-16 text-center"
              placeholder="12"
            />
            <span class="text-sm text-gray-500">{{ $t('planning.markets.years') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Settings Override Section -->
    <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-emerald-500">payments</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.paymentSettings') }}</label>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.inheritFromMarket') }}</span>
          <button
            type="button"
            @click="form.paymentSettings.inheritFromMarket = !form.paymentSettings.inheritFromMarket"
            class="relative w-12 h-6 rounded-full transition-colors duration-300"
            :class="form.paymentSettings.inheritFromMarket ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'"
          >
            <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="form.paymentSettings.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'"></span>
          </button>
        </div>
      </div>

      <!-- Market Settings Display (when inheriting) -->
      <div v-if="form.paymentSettings.inheritFromMarket" class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600">
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          <span class="material-icons text-xs">link</span>
          {{ $t('planning.seasons.usingMarketSettings') }}
        </p>
        <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-slate-400">
          <span class="flex items-center gap-1">
            <span class="material-icons text-sm" :class="market.paymentMethods?.creditCard?.enabled !== false ? 'text-green-500' : 'text-red-500'">
              {{ market.paymentMethods?.creditCard?.enabled !== false ? 'check_circle' : 'cancel' }}
            </span>
            {{ $t('planning.markets.creditCard') }}
          </span>
          <span class="flex items-center gap-1">
            <span class="material-icons text-sm" :class="market.paymentMethods?.bankTransfer?.enabled !== false ? 'text-green-500' : 'text-red-500'">
              {{ market.paymentMethods?.bankTransfer?.enabled !== false ? 'check_circle' : 'cancel' }}
            </span>
            {{ $t('planning.markets.bankTransfer') }}
          </span>
        </div>
      </div>

      <!-- Custom Payment Settings (when not inheriting) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Credit Card -->
        <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-blue-500 text-sm">credit_card</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.creditCard') }}</label>
            </div>
            <button
              type="button"
              @click="form.paymentSettings.creditCard.enabled = !form.paymentSettings.creditCard.enabled"
              class="relative w-10 h-5 rounded-full transition-colors duration-300"
              :class="form.paymentSettings.creditCard.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'"
            >
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="form.paymentSettings.creditCard.enabled ? 'translate-x-5' : 'translate-x-0'"></span>
            </button>
          </div>
        </div>

        <!-- Bank Transfer -->
        <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-orange-500 text-sm">account_balance</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.bankTransfer') }}</label>
            </div>
            <button
              type="button"
              @click="form.paymentSettings.bankTransfer.enabled = !form.paymentSettings.bankTransfer.enabled"
              class="relative w-10 h-5 rounded-full transition-colors duration-300"
              :class="form.paymentSettings.bankTransfer.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'"
            >
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="form.paymentSettings.bankTransfer.enabled ? 'translate-x-5' : 'translate-x-0'"></span>
            </button>
          </div>
          <div v-if="form.paymentSettings.bankTransfer.enabled" class="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{ $t('planning.markets.releaseDays') }}</label>
              <input v-model.number="form.paymentSettings.bankTransfer.releaseDays" type="number" min="0" max="60" class="form-input w-16 text-center text-sm py-1" />
              <span class="text-xs text-gray-400">{{ $t('common.days') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{ $t('planning.markets.discountRate') }}</label>
              <input v-model.number="form.paymentSettings.bankTransfer.discountRate" type="number" min="0" max="50" class="form-input w-16 text-center text-sm py-1" />
              <span class="text-xs text-gray-400">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Children Allowed Override Section -->
    <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-amber-500">family_restroom</span>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.childrenAllowed') }}</label>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.childrenAllowedHint') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.inheritFromMarket') }}</span>
          <button
            type="button"
            @click="form.childrenSettings.inheritFromMarket = !form.childrenSettings.inheritFromMarket"
            class="relative w-12 h-6 rounded-full transition-colors duration-300"
            :class="form.childrenSettings.inheritFromMarket ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-600'"
          >
            <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="form.childrenSettings.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'"></span>
          </button>
        </div>
      </div>

      <!-- Market Setting Display (when inheriting) -->
      <div v-if="form.childrenSettings.inheritFromMarket" class="mt-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded border border-gray-200 dark:border-slate-600">
        <span class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
          <span class="material-icons text-xs">link</span>
          {{ $t('planning.seasons.usingMarketSettings') }}:
          <span class="font-medium" :class="market.childrenAllowed !== false ? 'text-green-600' : 'text-red-600'">
            {{ market.childrenAllowed !== false ? $t('common.yes') : $t('common.no') }}
          </span>
        </span>
      </div>

      <!-- Custom Setting (when not inheriting) -->
      <div v-else class="mt-3 flex items-center gap-3">
        <span class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.seasons.allowChildren') }}:</span>
        <button
          type="button"
          @click="form.childrenSettings.allowed = !form.childrenSettings.allowed"
          class="relative w-12 h-6 rounded-full transition-colors duration-300"
          :class="form.childrenSettings.allowed ? 'bg-green-500' : 'bg-red-500'"
        >
          <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
            :class="form.childrenSettings.allowed ? 'translate-x-6' : 'translate-x-0'"></span>
        </button>
        <span class="text-sm font-medium" :class="form.childrenSettings.allowed ? 'text-green-600' : 'text-red-600'">
          {{ form.childrenSettings.allowed ? $t('common.yes') : $t('common.no') }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">{{ $t('common.cancel') }}</button>
      <button type="button" @click="handleSave" class="btn-primary" :disabled="saving">
        {{ saving ? $t('common.loading') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'
import DatePicker from '@/components/common/DatePicker.vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'

const props = defineProps({
  hotel: { type: Object, required: true },
  season: { type: Object, default: null },
  market: { type: Object, required: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()
const saving = ref(false)

// Filter room types and meal plans based on market's active selections
// If market has empty array, all are active; otherwise only show selected ones
const filteredRoomTypes = computed(() => {
  const marketActiveIds = (props.market?.activeRoomTypes || []).map(id => typeof id === 'object' ? id._id : id)
  if (marketActiveIds.length === 0) {
    return props.roomTypes // All active
  }
  return props.roomTypes.filter(rt => marketActiveIds.includes(rt._id))
})

const filteredMealPlans = computed(() => {
  const marketActiveIds = (props.market?.activeMealPlans || []).map(id => typeof id === 'object' ? id._id : id)
  if (marketActiveIds.length === 0) {
    return props.mealPlans // All active
  }
  return props.mealPlans.filter(mp => marketActiveIds.includes(mp._id))
})

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  color: '#6366f1',
  priority: 0,
  dateRanges: [{ startDate: '', endDate: '' }],
  activeRoomTypes: [],
  activeMealPlans: [],
  childAgeSettings: {
    inheritFromMarket: true,
    childAgeRange: { min: null, max: null },
    infantAgeRange: { min: null, max: null }
  },
  paymentSettings: {
    inheritFromMarket: true,
    creditCard: { enabled: true },
    bankTransfer: { enabled: true, releaseDays: 3, discountRate: 0 }
  },
  childrenSettings: {
    inheritFromMarket: true,
    allowed: true
  }
})

const addDateRange = () => {
  form.dateRanges.push({ startDate: '', endDate: '' })
}

const removeDateRange = (index) => {
  form.dateRanges.splice(index, 1)
}

const formatDateForInput = (date) => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

const handleSave = async () => {
  // Check if at least one language has a name
  const hasName = SUPPORTED_LANGUAGES.some(l => form.name[l]?.trim())
  if (!form.code || !hasName) {
    toast.error(t('validation.required'))
    return
  }

  // Prepare form data
  const formData = {
    ...form,
    market: props.market._id
  }

  saving.value = true
  try {
    if (props.season) {
      await planningService.updateSeason(props.hotel._id, props.season._id, formData)
      toast.success(t('planning.pricing.seasonUpdated'))
    } else {
      await planningService.createSeason(props.hotel._id, formData)
      toast.success(t('planning.pricing.seasonCreated'))
    }
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (props.season) {
    // Extract IDs from arrays (could be ObjectIds or populated objects)
    const extractIds = (arr) => (arr || []).map(item => typeof item === 'object' ? item._id : item)

    form.code = props.season.code || ''
    form.name = { ...createMultiLangObject(), ...props.season.name }
    form.color = props.season.color || '#6366f1'
    form.priority = props.season.priority || 0
    form.dateRanges = props.season.dateRanges?.length
      ? props.season.dateRanges.map(r => ({
          startDate: formatDateForInput(r.startDate),
          endDate: formatDateForInput(r.endDate)
        }))
      : [{ startDate: '', endDate: '' }]
    form.activeRoomTypes = extractIds(props.season.activeRoomTypes)
    form.activeMealPlans = extractIds(props.season.activeMealPlans)
    form.childAgeSettings = {
      inheritFromMarket: props.season.childAgeSettings?.inheritFromMarket ?? true,
      childAgeRange: {
        min: props.season.childAgeSettings?.childAgeRange?.min ?? null,
        max: props.season.childAgeSettings?.childAgeRange?.max ?? null
      },
      infantAgeRange: {
        min: props.season.childAgeSettings?.infantAgeRange?.min ?? null,
        max: props.season.childAgeSettings?.infantAgeRange?.max ?? null
      }
    }
    form.paymentSettings = {
      inheritFromMarket: props.season.paymentSettings?.inheritFromMarket ?? true,
      creditCard: { enabled: props.season.paymentSettings?.creditCard?.enabled ?? true },
      bankTransfer: {
        enabled: props.season.paymentSettings?.bankTransfer?.enabled ?? true,
        releaseDays: props.season.paymentSettings?.bankTransfer?.releaseDays ?? 3,
        discountRate: props.season.paymentSettings?.bankTransfer?.discountRate ?? 0
      }
    }
    form.childrenSettings = {
      inheritFromMarket: props.season.childrenSettings?.inheritFromMarket ?? true,
      allowed: props.season.childrenSettings?.allowed ?? true
    }
  }
})
</script>
