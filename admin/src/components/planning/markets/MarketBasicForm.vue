<template>
  <div class="space-y-6">
    <!-- Status Toggle - Prominent at Top -->
    <div class="flex items-center justify-between p-4 bg-gradient-to-r rounded-xl"
         :class="formData.status === 'active'
           ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'
           : 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-slate-700'">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center"
             :class="formData.status === 'active' ? 'bg-green-500' : 'bg-gray-400'">
          <span class="material-icons text-white text-xl">
            {{ formData.status === 'active' ? 'check' : 'pause' }}
          </span>
        </div>
        <div>
          <p class="font-semibold" :class="formData.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'">
            {{ formData.status === 'active' ? $t('planning.markets.statusActive') : $t('planning.markets.statusInactive') }}
          </p>
          <p class="text-xs" :class="formData.status === 'active' ? 'text-green-600 dark:text-green-500' : 'text-gray-500 dark:text-slate-500'">
            {{ formData.status === 'active' ? $t('planning.markets.statusActiveHint') : $t('planning.markets.statusInactiveHint') }}
          </p>
        </div>
      </div>
      <!-- Switch Toggle -->
      <button
        type="button"
        @click="toggleStatus"
        class="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
        :class="formData.status === 'active'
          ? 'bg-green-500 focus:ring-green-500'
          : 'bg-gray-300 dark:bg-slate-600 focus:ring-gray-400'"
      >
        <span
          class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300"
          :class="formData.status === 'active' ? 'translate-x-7' : 'translate-x-0'"
        ></span>
      </button>
    </div>

    <!-- Market Code -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {{ $t('planning.markets.code') }} *
      </label>
      <input
        v-model="formData.code"
        type="text"
        class="form-input w-full uppercase"
        :placeholder="$t('planning.markets.codePlaceholder')"
        maxlength="10"
        required
      />
      <p class="mt-1 text-xs text-gray-500 dark:text-slate-500">
        {{ $t('planning.markets.codeHint') }}
      </p>
    </div>

    <!-- Market Name (Multilingual) -->
    <MultiLangInput
      v-model="formData.name"
      :languages="SUPPORTED_LANGUAGES"
      :label="$t('planning.markets.name') + ' *'"
    />

    <!-- Age Settings -->
    <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
      <!-- Header with Switch -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="material-icons text-pink-500">child_care</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.ageSettings') }}</label>
        </div>
        <!-- Enable Switch -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.useMarketAgeSettings') }}</span>
          <button
            type="button"
            @click="formData.useCustomAgeSettings = !formData.useCustomAgeSettings"
            class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="formData.useCustomAgeSettings
              ? 'bg-pink-500 focus:ring-pink-500'
              : 'bg-gray-300 dark:bg-slate-600 focus:ring-gray-400'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="formData.useCustomAgeSettings ? 'translate-x-6' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </div>

      <!-- When switch is OFF: Show hotel settings (read-only) -->
      <div v-if="!formData.useCustomAgeSettings" class="mt-3">
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-3">
          {{ $t('planning.markets.ageSettingsDisabledHint') }}
        </p>

        <!-- Hotel Age Settings Display -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Infant (Hotel) -->
          <div class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-icons text-purple-400 text-sm">baby_changing_station</span>
              <label class="text-sm font-medium text-gray-500 dark:text-slate-400">{{ $t('planning.markets.infantAgeRange') }}</label>
              <span class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {{ $t('planning.markets.hotelSetting') }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="form-input w-16 text-center bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed">0</span>
              <span class="text-gray-400">-</span>
              <span class="form-input w-16 text-center bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed">{{ hotelAgeSettings.infantMax }}</span>
              <span class="text-sm text-gray-400">{{ $t('planning.markets.years') }}</span>
            </div>
          </div>

          <!-- Child (Hotel) -->
          <div class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-icons text-pink-400 text-sm">child_care</span>
              <label class="text-sm font-medium text-gray-500 dark:text-slate-400">{{ $t('planning.markets.childAgeRange') }}</label>
              <span class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {{ $t('planning.markets.hotelSetting') }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="form-input w-16 text-center bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed">{{ hotelAgeSettings.childMin }}</span>
              <span class="text-gray-400">-</span>
              <span class="form-input w-16 text-center bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed">{{ hotelAgeSettings.childMax }}</span>
              <span class="text-sm text-gray-400">{{ $t('planning.markets.years') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- When switch is ON: Editable age range inputs -->
      <div v-else class="space-y-4 mt-3">
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
          {{ $t('planning.markets.ageSettingsHint') }}
        </p>

        <!-- Copy from Hotel Button -->
        <button
          v-if="!hasAgeValues"
          type="button"
          @click="copyHotelAgeSettings"
          class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 mb-3"
        >
          <span class="material-icons text-sm">content_copy</span>
          {{ $t('planning.markets.copyFromHotel') }}
        </button>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Infant Age Range (First - because it starts from 0) -->
          <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-icons text-purple-500 text-sm">baby_changing_station</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.infantAgeRange') }}</label>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="formData.infantAgeRange.min"
                type="number"
                min="0"
                max="5"
                class="form-input w-16 text-center"
                placeholder="0"
              />
              <span class="text-gray-500">-</span>
              <input
                v-model.number="formData.infantAgeRange.max"
                type="number"
                min="0"
                max="5"
                class="form-input w-16 text-center"
                :class="{ 'border-red-500': ageValidation.hasError }"
                placeholder="2"
              />
              <span class="text-sm text-gray-500">{{ $t('planning.markets.years') }}</span>
            </div>
            <p class="text-xs text-gray-400 dark:text-slate-500 mt-1">
              {{ $t('planning.markets.infantHint') }}
            </p>
          </div>

          <!-- Child Age Range -->
          <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-icons text-pink-500 text-sm">child_care</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.childAgeRange') }}</label>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="formData.childAgeRange.min"
                type="number"
                min="0"
                max="17"
                class="form-input w-16 text-center"
                :class="{ 'border-red-500': ageValidation.hasError }"
                placeholder="3"
              />
              <span class="text-gray-500">-</span>
              <input
                v-model.number="formData.childAgeRange.max"
                type="number"
                min="1"
                max="17"
                class="form-input w-16 text-center"
                placeholder="12"
              />
              <span class="text-sm text-gray-500">{{ $t('planning.markets.years') }}</span>
            </div>
            <p class="text-xs text-gray-400 dark:text-slate-500 mt-1">
              {{ $t('planning.markets.childHint') }}
            </p>
          </div>
        </div>

        <!-- Validation Error -->
        <div v-if="ageValidation.hasError" class="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <span class="material-icons text-red-500 text-lg">error</span>
          <div>
            <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ $t('planning.markets.ageGapError') }}</p>
            <p class="text-xs text-red-600 dark:text-red-500 mt-0.5">{{ ageValidation.message }}</p>
          </div>
        </div>

        <!-- Success indicator when valid -->
        <div v-else-if="ageValidation.isComplete" class="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <span class="material-icons text-green-500 text-lg">check_circle</span>
          <p class="text-sm text-green-700 dark:text-green-400">{{ $t('planning.markets.ageRangeValid') }}</p>
        </div>
      </div>
    </div>

    <!-- Currency Selection - Beautiful Cards -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
        {{ $t('planning.markets.currency') }} *
      </label>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="curr in CURRENCIES"
          :key="curr.code"
          type="button"
          @click="formData.currency = curr.code"
          class="relative p-4 rounded-xl border-2 transition-all duration-200 text-center group"
          :class="formData.currency === curr.code
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg shadow-purple-500/20'
            : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'"
        >
          <!-- Selected indicator -->
          <div
            v-if="formData.currency === curr.code"
            class="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
          >
            <span class="material-icons text-white text-sm">check</span>
          </div>

          <!-- Currency Symbol -->
          <div
            class="text-3xl font-bold mb-1 transition-colors"
            :class="formData.currency === curr.code ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600'"
          >
            {{ curr.symbol }}
          </div>

          <!-- Currency Code -->
          <div
            class="text-sm font-semibold transition-colors"
            :class="formData.currency === curr.code ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-slate-300'"
          >
            {{ curr.code }}
          </div>

          <!-- Currency Name -->
          <div
            class="text-xs mt-1 transition-colors"
            :class="formData.currency === curr.code ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-slate-500'"
          >
            {{ curr.name[locale] || curr.name.en }}
          </div>
        </button>
      </div>
    </div>

    <!-- Active Products Section -->
    <div v-if="roomTypes.length || mealPlans.length" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-4">
      <div class="flex items-center gap-2">
        <span class="material-icons text-blue-500">inventory_2</span>
        <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.activeProducts') }}</label>
      </div>
      <p class="text-xs text-gray-500 dark:text-slate-400">
        {{ $t('planning.markets.activeProductsHint') }}
      </p>

      <!-- Active Room Types -->
      <div v-if="roomTypes.length" class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-blue-500 text-sm">hotel</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.activeRoomTypes') }}</label>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="rt in roomTypes"
            :key="rt._id"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
            :class="formData.activeRoomTypes.includes(rt._id)
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
          >
            <input
              type="checkbox"
              :value="rt._id"
              v-model="formData.activeRoomTypes"
              class="sr-only"
            />
            <span class="font-medium">{{ rt.code }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{ rt.name?.[locale] || rt.name?.tr }}</span>
          </label>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.markets.emptyMeansAll') }}
        </p>
      </div>

      <!-- Active Meal Plans -->
      <div v-if="mealPlans.length" class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-green-500 text-sm">restaurant</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.activeMealPlans') }}</label>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="mp in mealPlans"
            :key="mp._id"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
            :class="formData.activeMealPlans.includes(mp._id)
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
          >
            <input
              type="checkbox"
              :value="mp._id"
              v-model="formData.activeMealPlans"
              class="sr-only"
            />
            <span class="font-medium">{{ mp.code }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{ mp.name?.[locale] || mp.name?.tr }}</span>
          </label>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.markets.emptyMeansAll') }}
        </p>
      </div>
    </div>

    <!-- Payment Methods Section -->
    <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-4">
      <div class="flex items-center gap-2">
        <span class="material-icons text-emerald-500">payments</span>
        <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.paymentMethods') }}</label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Credit Card -->
        <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-blue-500 text-sm">credit_card</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.creditCard') }}</label>
            </div>
            <button
              type="button"
              @click="formData.paymentMethods.creditCard.enabled = !formData.paymentMethods.creditCard.enabled"
              class="relative w-10 h-5 rounded-full transition-colors duration-300"
              :class="formData.paymentMethods.creditCard.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'"
            >
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="formData.paymentMethods.creditCard.enabled ? 'translate-x-5' : 'translate-x-0'"></span>
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
              @click="formData.paymentMethods.bankTransfer.enabled = !formData.paymentMethods.bankTransfer.enabled"
              class="relative w-10 h-5 rounded-full transition-colors duration-300"
              :class="formData.paymentMethods.bankTransfer.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'"
            >
              <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="formData.paymentMethods.bankTransfer.enabled ? 'translate-x-5' : 'translate-x-0'"></span>
            </button>
          </div>
          <!-- Bank Transfer Options -->
          <div v-if="formData.paymentMethods.bankTransfer.enabled" class="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{ $t('planning.markets.releaseDays') }}</label>
              <input
                v-model.number="formData.paymentMethods.bankTransfer.releaseDays"
                type="number"
                min="0"
                max="60"
                class="form-input w-16 text-center text-sm py-1"
              />
              <span class="text-xs text-gray-400">{{ $t('common.days') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{ $t('planning.markets.discountRate') }}</label>
              <input
                v-model.number="formData.paymentMethods.bankTransfer.discountRate"
                type="number"
                min="0"
                max="50"
                class="form-input w-16 text-center text-sm py-1"
              />
              <span class="text-xs text-gray-400">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Children Allowed Section -->
    <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-amber-500">family_restroom</span>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.childrenAllowed') }}</label>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.childrenAllowedHint') }}</p>
          </div>
        </div>
        <button
          type="button"
          @click="formData.childrenAllowed = !formData.childrenAllowed"
          class="relative w-12 h-6 rounded-full transition-colors duration-300"
          :class="formData.childrenAllowed ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-600'"
        >
          <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
            :class="formData.childrenAllowed ? 'translate-x-6' : 'translate-x-0'"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CURRENCIES } from '@/data/countries'
import MultiLangInput from '@/components/common/MultiLangInput.vue'

const props = defineProps({
  market: { type: Object, required: true },
  hotel: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  isNew: { type: Boolean, default: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] }
})

// Hotel age settings (for display when switch is OFF)
const hotelAgeSettings = computed(() => {
  const policies = props.hotel?.policies
  return {
    infantMax: policies?.maxBabyAge ?? 2,
    childMin: (policies?.maxBabyAge ?? 2) + 1,
    childMax: policies?.maxChildAge ?? 12
  }
})

const { t, locale } = useI18n()

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

const formData = ref({
  code: '',
  name: createMultiLangObject(),
  currency: 'EUR',
  status: 'active',
  useCustomAgeSettings: false,
  childAgeRange: { min: null, max: null },
  infantAgeRange: { min: null, max: null },
  activeRoomTypes: [],
  activeMealPlans: [],
  // Payment methods
  paymentMethods: {
    creditCard: { enabled: true },
    bankTransfer: { enabled: true, releaseDays: 3, discountRate: 0 }
  },
  // Children allowed
  childrenAllowed: true
})

// Check if any age values are set
const hasAgeValues = computed(() => {
  const infant = formData.value.infantAgeRange
  const child = formData.value.childAgeRange
  return infant.min !== null || infant.max !== null || child.min !== null || child.max !== null
})

// Copy age settings from hotel
const copyHotelAgeSettings = () => {
  formData.value.infantAgeRange = { min: 0, max: hotelAgeSettings.value.infantMax }
  formData.value.childAgeRange = { min: hotelAgeSettings.value.childMin, max: hotelAgeSettings.value.childMax }
}

// Age validation computed
const ageValidation = computed(() => {
  if (!formData.value.useCustomAgeSettings) {
    return { hasError: false, isComplete: false, message: '' }
  }

  const infant = formData.value.infantAgeRange
  const child = formData.value.childAgeRange

  // Check if any values are entered
  const hasInfant = infant.min !== null && infant.max !== null
  const hasChild = child.min !== null && child.max !== null

  // Both must be filled when switch is on
  if (!hasInfant && !hasChild) {
    return { hasError: false, isComplete: false, message: '' }
  }

  // If only infant is set, child must start from infant.max + 1
  if (hasInfant && hasChild) {
    const expectedChildMin = infant.max + 1

    // Check for gap
    if (child.min > expectedChildMin) {
      const gapStart = infant.max + 1
      const gapEnd = child.min - 1
      return {
        hasError: true,
        isComplete: false,
        message: t('planning.markets.ageGapMessage', { gapStart, gapEnd })
      }
    }

    // Check for overlap
    if (child.min <= infant.max) {
      return {
        hasError: true,
        isComplete: false,
        message: t('planning.markets.ageOverlapMessage', { infantMax: infant.max, childMin: child.min })
      }
    }

    // Valid!
    return { hasError: false, isComplete: true, message: '' }
  }

  // Partial entry
  return { hasError: false, isComplete: false, message: '' }
})

const toggleStatus = () => {
  formData.value.status = formData.value.status === 'active' ? 'inactive' : 'active'
}

// Sync with props
watch(() => props.market, (newVal) => {
  if (newVal) {
    // Determine if custom age settings are being used
    const hasCustomAgeSettings = (newVal.childAgeRange?.max != null) || (newVal.infantAgeRange?.max != null)

    // Extract IDs from activeRoomTypes and activeMealPlans (could be ObjectIds or populated objects)
    const extractIds = (arr) => (arr || []).map(item => typeof item === 'object' ? item._id : item)

    formData.value = {
      code: newVal.code || '',
      name: { ...createMultiLangObject(), ...newVal.name },
      currency: newVal.currency || 'EUR',
      status: newVal.status || 'active',
      useCustomAgeSettings: hasCustomAgeSettings,
      childAgeRange: { min: newVal.childAgeRange?.min ?? null, max: newVal.childAgeRange?.max ?? null },
      infantAgeRange: { min: newVal.infantAgeRange?.min ?? null, max: newVal.infantAgeRange?.max ?? null },
      activeRoomTypes: extractIds(newVal.activeRoomTypes),
      activeMealPlans: extractIds(newVal.activeMealPlans),
      paymentMethods: {
        creditCard: { enabled: newVal.paymentMethods?.creditCard?.enabled ?? true },
        bankTransfer: {
          enabled: newVal.paymentMethods?.bankTransfer?.enabled ?? true,
          releaseDays: newVal.paymentMethods?.bankTransfer?.releaseDays ?? 3,
          discountRate: newVal.paymentMethods?.bankTransfer?.discountRate ?? 0
        }
      },
      childrenAllowed: newVal.childrenAllowed ?? true
    }
  }
}, { immediate: true, deep: true })

const getFormData = () => {
  // If custom age settings are disabled, send null to clear them
  const ageData = formData.value.useCustomAgeSettings
    ? {
        childAgeRange: formData.value.childAgeRange,
        infantAgeRange: formData.value.infantAgeRange
      }
    : {
        childAgeRange: { min: null, max: null },
        infantAgeRange: { min: null, max: null }
      }

  return {
    code: formData.value.code.toUpperCase(),
    name: formData.value.name,
    currency: formData.value.currency,
    status: formData.value.status,
    activeRoomTypes: formData.value.activeRoomTypes,
    activeMealPlans: formData.value.activeMealPlans,
    paymentMethods: formData.value.paymentMethods,
    childrenAllowed: formData.value.childrenAllowed,
    ...ageData
  }
}

const isValid = () => {
  // Check age validation if custom settings are enabled
  if (formData.value.useCustomAgeSettings && ageValidation.value.hasError) {
    return false
  }
  return true
}

defineExpose({ getFormData, isValid })
</script>
