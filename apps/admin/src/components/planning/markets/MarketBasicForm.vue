<template>
  <div class="space-y-6">
    <!-- Status Toggle - Prominent at Top -->
    <div
      class="flex items-center justify-between p-4 bg-gradient-to-r rounded-xl"
      :class="
        formData.status === 'active'
          ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'
          : 'from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-slate-700'
      "
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="formData.status === 'active' ? 'bg-green-500' : 'bg-gray-400'"
        >
          <span class="material-icons text-white text-xl">
            {{ formData.status === 'active' ? 'check' : 'pause' }}
          </span>
        </div>
        <div>
          <p
            class="font-semibold"
            :class="
              formData.status === 'active'
                ? 'text-green-700 dark:text-green-400'
                : 'text-gray-600 dark:text-slate-400'
            "
          >
            {{
              formData.status === 'active'
                ? $t('planning.markets.statusActive')
                : $t('planning.markets.statusInactive')
            }}
          </p>
          <p
            class="text-xs"
            :class="
              formData.status === 'active'
                ? 'text-green-600 dark:text-green-500'
                : 'text-gray-500 dark:text-slate-500'
            "
          >
            {{
              formData.status === 'active'
                ? $t('planning.markets.statusActiveHint')
                : $t('planning.markets.statusInactiveHint')
            }}
          </p>
        </div>
      </div>
      <!-- Switch Toggle -->
      <button
        type="button"
        class="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
        :class="
          formData.status === 'active'
            ? 'bg-green-500 focus:ring-green-500'
            : 'bg-gray-300 dark:bg-slate-600 focus:ring-gray-400'
        "
        @click="toggleStatus"
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
      :languages="ADMIN_LANGUAGES"
      :label="$t('planning.markets.name') + ' *'"
    />

    <!-- Child Age Settings -->
    <div
      class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800"
    >
      <!-- Header with Switch -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="material-icons text-pink-500">child_care</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.markets.ageSettings')
          }}</label>
        </div>
        <!-- Inherit from Hotel Switch -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500 dark:text-slate-400">{{
            $t('planning.markets.inheritFromHotel')
          }}</span>
          <button
            type="button"
            class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="
              formData.childAgeSettings.inheritFromHotel
                ? 'bg-pink-500 focus:ring-pink-500'
                : 'bg-gray-300 dark:bg-slate-600 focus:ring-gray-400'
            "
            @click="
              formData.childAgeSettings.inheritFromHotel =
                !formData.childAgeSettings.inheritFromHotel
            "
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
              :class="
                formData.childAgeSettings.inheritFromHotel ? 'translate-x-6' : 'translate-x-0'
              "
            ></span>
          </button>
        </div>
      </div>

      <p class="text-xs text-gray-500 dark:text-slate-400 mb-4">
        {{ $t('planning.markets.ageSettingsHint') }}
      </p>

      <!-- When inheriting from hotel: Show hotel settings (read-only) -->
      <div
        v-if="formData.childAgeSettings.inheritFromHotel"
        class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          <span class="material-icons text-xs">link</span>
          {{ $t('planning.markets.usingHotelSettings') }}
        </p>
        <div v-if="hotelChildAgeGroups.length" class="space-y-2">
          <div
            v-for="group in hotelChildAgeGroups"
            :key="group.code"
            class="flex items-center gap-4 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
          >
            <span
              class="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium w-28"
              :class="
                group.code === 'infant'
                  ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                  : group.code === 'first'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              "
            >
              <span class="material-icons text-sm">
                {{ group.code === 'infant' ? 'baby_changing_station' : 'child_care' }}
              </span>
              {{ $t(`planning.childGroups.${group.code}`) }}
            </span>
            <span class="text-sm text-gray-600 dark:text-slate-300">
              {{ group.minAge }} — {{ group.maxAge }} {{ $t('planning.markets.years') }}
            </span>
          </div>
        </div>
        <p v-else class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <span class="material-icons text-xs">warning</span>
          {{ $t('planning.markets.noChildGroups') }}
        </p>
      </div>

      <!-- When NOT inheriting: Editable child age groups (like hotel form) -->
      <div v-else>
        <!-- Header with Add Button -->
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ $t('planning.markets.customAgeGroups') }}
          </p>
          <button
            v-if="formData.childAgeSettings.childAgeGroups.length < 3"
            type="button"
            class="px-3 py-1.5 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors flex items-center gap-1"
            @click="addChildAgeGroup"
          >
            <span class="material-icons text-sm">add</span>
            {{ $t('planning.markets.addAgeGroup') }}
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="(group, index) in formData.childAgeSettings.childAgeGroups"
            :key="group.code"
            class="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
          >
            <!-- Age Group Badge -->
            <div class="w-28 flex-shrink-0">
              <span
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                :class="
                  group.code === 'infant'
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                    : group.code === 'first'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                "
              >
                <span class="material-icons text-sm">
                  {{ group.code === 'infant' ? 'baby_changing_station' : 'child_care' }}
                </span>
                {{ $t(`planning.childGroups.${group.code}`) }}
              </span>
            </div>

            <!-- Age Range Inputs -->
            <div class="flex items-center gap-2">
              <div class="w-16">
                <input
                  :value="group.minAge"
                  type="number"
                  min="0"
                  max="17"
                  class="form-input text-sm py-1.5 text-center bg-gray-100 dark:bg-slate-600 cursor-not-allowed"
                  disabled
                  readonly
                />
                <span class="text-[10px] text-gray-400 block text-center">min</span>
              </div>

              <span class="text-gray-400 font-bold">—</span>

              <div class="w-16">
                <input
                  v-model.number="group.maxAge"
                  type="number"
                  :min="group.minAge"
                  max="17"
                  class="form-input text-sm py-1.5 text-center"
                  @change="onMaxAgeChange(index)"
                />
                <span class="text-[10px] text-gray-400 block text-center">max</span>
              </div>

              <span class="text-sm text-gray-500">{{ $t('planning.markets.years') }}</span>
            </div>

            <div class="flex-1"></div>

            <!-- Delete Button -->
            <button
              v-if="formData.childAgeSettings.childAgeGroups.length > 1"
              type="button"
              class="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              :title="$t('common.delete')"
              @click="removeChildAgeGroup(index)"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>

        <p
          v-if="!formData.childAgeSettings.childAgeGroups.length"
          class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-3"
        >
          <span class="material-icons text-xs">warning</span>
          {{ $t('planning.markets.noChildGroups') }}
        </p>

        <p class="text-xs text-gray-500 dark:text-slate-400 mt-3 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.markets.maxAgeGroupsHint') }}
        </p>
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
          class="relative p-4 rounded-xl border-2 transition-all duration-200 text-center group"
          :class="
            formData.currency === curr.code
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg shadow-purple-500/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
          "
          @click="formData.currency = curr.code"
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
            :class="
              formData.currency === curr.code
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600'
            "
          >
            {{ curr.symbol }}
          </div>

          <!-- Currency Code -->
          <div
            class="text-sm font-semibold transition-colors"
            :class="
              formData.currency === curr.code
                ? 'text-purple-700 dark:text-purple-300'
                : 'text-gray-700 dark:text-slate-300'
            "
          >
            {{ curr.code }}
          </div>

          <!-- Currency Name -->
          <div
            class="text-xs mt-1 transition-colors"
            :class="
              formData.currency === curr.code
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-slate-500'
            "
          >
            {{ curr.name[locale] || curr.name.en }}
          </div>
        </button>
      </div>
    </div>

    <!-- Active Products Section -->
    <div
      v-if="roomTypes.length || mealPlans.length"
      class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-4"
    >
      <div class="flex items-center gap-2">
        <span class="material-icons text-blue-500">inventory_2</span>
        <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
          $t('planning.markets.activeProducts')
        }}</label>
      </div>
      <p class="text-xs text-gray-500 dark:text-slate-400">
        {{ $t('planning.markets.activeProductsHint') }}
      </p>

      <!-- Active Room Types -->
      <div
        v-if="roomTypes.length"
        class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-blue-500 text-sm">hotel</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.markets.activeRoomTypes')
          }}</label>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="rt in roomTypes"
            :key="rt._id"
            class="relative flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
            :class="
              formData.activeRoomTypes.includes(rt._id)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            "
          >
            <input
              v-model="formData.activeRoomTypes"
              type="checkbox"
              :value="rt._id"
              class="sr-only"
            />
            <span class="font-medium">{{ rt.code }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{
              rt.name?.[locale] || rt.name?.tr
            }}</span>
          </label>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.markets.emptyMeansAll') }}
        </p>
      </div>

      <!-- Active Meal Plans -->
      <div
        v-if="mealPlans.length"
        class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-green-500 text-sm">restaurant</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.markets.activeMealPlans')
          }}</label>
        </div>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="mp in mealPlans"
            :key="mp._id"
            class="relative flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
            :class="
              formData.activeMealPlans.includes(mp._id)
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            "
          >
            <input
              v-model="formData.activeMealPlans"
              type="checkbox"
              :value="mp._id"
              class="sr-only"
            />
            <span class="font-medium">{{ mp.code }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{
              mp.name?.[locale] || mp.name?.tr
            }}</span>
          </label>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.markets.emptyMeansAll') }}
        </p>
      </div>
    </div>

    <!-- Payment Methods Section -->
    <div
      class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-4"
    >
      <div class="flex items-center gap-2">
        <span class="material-icons text-emerald-500">payments</span>
        <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
          $t('planning.markets.paymentMethods')
        }}</label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Credit Card -->
        <div
          class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-blue-500 text-sm">credit_card</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
                $t('planning.markets.creditCard')
              }}</label>
            </div>
            <button
              type="button"
              class="relative w-10 h-5 rounded-full transition-colors duration-300"
              :class="
                formData.paymentMethods.creditCard.enabled
                  ? 'bg-emerald-500'
                  : 'bg-gray-300 dark:bg-slate-600'
              "
              @click="
                formData.paymentMethods.creditCard.enabled =
                  !formData.paymentMethods.creditCard.enabled
              "
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="
                  formData.paymentMethods.creditCard.enabled ? 'translate-x-5' : 'translate-x-0'
                "
              ></span>
            </button>
          </div>
        </div>

        <!-- Bank Transfer -->
        <div
          class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-orange-500 text-sm">account_balance</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
                $t('planning.markets.bankTransfer')
              }}</label>
            </div>
            <button
              type="button"
              class="relative w-10 h-5 rounded-full transition-colors duration-300"
              :class="
                formData.paymentMethods.bankTransfer.enabled
                  ? 'bg-emerald-500'
                  : 'bg-gray-300 dark:bg-slate-600'
              "
              @click="
                formData.paymentMethods.bankTransfer.enabled =
                  !formData.paymentMethods.bankTransfer.enabled
              "
            >
              <span
                class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="
                  formData.paymentMethods.bankTransfer.enabled ? 'translate-x-5' : 'translate-x-0'
                "
              ></span>
            </button>
          </div>
          <!-- Bank Transfer Options -->
          <div
            v-if="formData.paymentMethods.bankTransfer.enabled"
            class="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-700"
          >
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{
                $t('planning.markets.releaseDays')
              }}</label>
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
              <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{
                $t('planning.markets.discountRate')
              }}</label>
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
    <div
      class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-icons text-amber-500">family_restroom</span>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
              $t('planning.markets.childrenAllowed')
            }}</label>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('planning.markets.childrenAllowedHint') }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="relative w-12 h-6 rounded-full transition-colors duration-300"
          :class="formData.childrenAllowed ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-600'"
          @click="formData.childrenAllowed = !formData.childrenAllowed"
        >
          <span
            class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
            :class="formData.childrenAllowed ? 'translate-x-6' : 'translate-x-0'"
          ></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CURRENCIES } from '@/data/countries'
import { ADMIN_LANGUAGES } from '@/constants/languages'
import MultiLangInput from '@/components/common/MultiLangInput.vue'

const { locale } = useI18n()

const props = defineProps({
  market: { type: Object, required: true },
  hotel: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  isNew: { type: Boolean, default: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] }
})

// No emits needed

// Get hotel's child age groups
const hotelChildAgeGroups = computed(() => props.hotel?.childAgeGroups || [])

// Initialize child age groups from hotel
const initChildAgeGroups = () => {
  return hotelChildAgeGroups.value.map(g => ({
    code: g.code,
    minAge: g.minAge,
    maxAge: g.maxAge
  }))
}

// Use ADMIN_LANGUAGES (TR, EN only) for market names
const createMultiLangObject = () => {
  const obj = {}
  ADMIN_LANGUAGES.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

const formData = ref({
  code: '',
  name: createMultiLangObject(),
  currency: 'EUR',
  status: 'active',
  childAgeSettings: {
    inheritFromHotel: true,
    childAgeGroups: [] // Will be initialized from hotel's childAgeGroups
  },
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

// Watch for inherit toggle to initialize groups when switching to custom
watch(
  () => formData.value.childAgeSettings.inheritFromHotel,
  newVal => {
    if (!newVal && formData.value.childAgeSettings.childAgeGroups.length === 0) {
      formData.value.childAgeSettings.childAgeGroups = initChildAgeGroups()
    }
  }
)

// When hotel's childAgeGroups become available, initialize if needed
watch(
  hotelChildAgeGroups,
  newGroups => {
    if (newGroups.length > 0 && formData.value.childAgeSettings.childAgeGroups.length === 0) {
      formData.value.childAgeSettings.childAgeGroups = initChildAgeGroups()
    }
  },
  { immediate: true }
)

// Add new child age group
const addChildAgeGroup = () => {
  const groups = formData.value.childAgeSettings.childAgeGroups
  if (groups.length >= 3) return

  const existingCodes = groups.map(g => g.code)
  let newCode = 'second' // Default to second

  if (!existingCodes.includes('infant')) {
    newCode = 'infant'
  } else if (!existingCodes.includes('first')) {
    newCode = 'first'
  } else if (!existingCodes.includes('second')) {
    newCode = 'second'
  }

  // Calculate minAge based on last group's maxAge
  const lastGroup = groups[groups.length - 1]
  const newMinAge = lastGroup ? lastGroup.maxAge + 1 : 0

  groups.push({
    code: newCode,
    minAge: newMinAge,
    maxAge: Math.min(newMinAge + 5, 17)
  })
}

// Remove child age group
const removeChildAgeGroup = index => {
  const groups = formData.value.childAgeSettings.childAgeGroups
  if (groups.length <= 1) return
  groups.splice(index, 1)
  // Update minAge for remaining groups
  groups.forEach((g, i) => {
    if (i === 0) {
      g.minAge = 0 // First group always starts at 0
    } else {
      g.minAge = groups[i - 1].maxAge + 1
    }
  })
}

// When maxAge changes, update next group's minAge
const onMaxAgeChange = index => {
  const groups = formData.value.childAgeSettings.childAgeGroups
  const currentGroup = groups[index]

  // Ensure maxAge is at least minAge
  if (currentGroup.maxAge < currentGroup.minAge) {
    currentGroup.maxAge = currentGroup.minAge
  }

  // Update next group's minAge if exists
  if (index < groups.length - 1) {
    groups[index + 1].minAge = currentGroup.maxAge + 1
    // Ensure next group's maxAge is valid
    if (groups[index + 1].maxAge < groups[index + 1].minAge) {
      groups[index + 1].maxAge = groups[index + 1].minAge
    }
  }
}

const toggleStatus = () => {
  formData.value.status = formData.value.status === 'active' ? 'inactive' : 'active'
}

// Sync with props
watch(
  () => props.market,
  newVal => {
    if (newVal) {
      // Extract IDs from activeRoomTypes and activeMealPlans (could be ObjectIds or populated objects)
      const extractIds = arr =>
        (arr || []).map(item => (typeof item === 'object' ? item._id : item))

      // Load child age settings
      const marketGroups = newVal.childAgeSettings?.childAgeGroups || []

      formData.value = {
        code: newVal.code || '',
        name: { ...createMultiLangObject(), ...newVal.name },
        currency: newVal.currency || 'EUR',
        status: newVal.status || 'active',
        childAgeSettings: {
          inheritFromHotel: newVal.childAgeSettings?.inheritFromHotel ?? true,
          childAgeGroups: marketGroups.length > 0 ? marketGroups : initChildAgeGroups()
        },
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
    } else {
      // Initialize child age groups from hotel when creating new market
      if (formData.value.childAgeSettings.childAgeGroups.length === 0) {
        formData.value.childAgeSettings.childAgeGroups = initChildAgeGroups()
      }
    }
  },
  { immediate: true, deep: true }
)

const getFormData = () => {
  return {
    code: formData.value.code.toUpperCase(),
    name: formData.value.name,
    currency: formData.value.currency,
    status: formData.value.status,
    childAgeSettings: formData.value.childAgeSettings,
    activeRoomTypes: formData.value.activeRoomTypes,
    activeMealPlans: formData.value.activeMealPlans,
    paymentMethods: formData.value.paymentMethods,
    childrenAllowed: formData.value.childrenAllowed
  }
}

const isValid = () => {
  return true
}

defineExpose({ getFormData, isValid })
</script>
