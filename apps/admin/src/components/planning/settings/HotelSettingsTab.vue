<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
    </div>

    <template v-else>
      <!-- Save Button Top -->
      <div class="flex justify-end">
        <button class="btn-primary" :disabled="saving" @click="saveSettings">
          <span v-if="saving" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ $t('common.saving') }}
          </span>
          <span v-else class="flex items-center gap-2">
            <span class="material-icons text-sm">save</span>
            {{ $t('common.save') }}
          </span>
        </button>
      </div>

      <!-- Visibility Settings -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3
          class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"
        >
          <span class="material-icons text-purple-500">visibility</span>
          {{ $t('planning.settings.visibility') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('planning.settings.visibilityDesc') }}
        </p>

        <div class="flex flex-wrap gap-6">
          <!-- B2C Visibility -->
          <label class="flex items-center cursor-pointer">
            <input
              v-model="form.visibility.b2c"
              type="checkbox"
              class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
            />
            <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
              <span class="font-medium">{{ $t('hotels.basic.b2cVisible') }}</span>
              <span class="block text-xs text-gray-500 dark:text-slate-400">{{
                $t('planning.settings.b2cVisibleDesc')
              }}</span>
            </span>
          </label>

          <!-- B2B Visibility -->
          <label class="flex items-center cursor-pointer">
            <input
              v-model="form.visibility.b2b"
              type="checkbox"
              class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
            />
            <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
              <span class="font-medium">{{ $t('hotels.basic.b2bVisible') }}</span>
              <span class="block text-xs text-gray-500 dark:text-slate-400">{{
                $t('planning.settings.b2bVisibleDesc')
              }}</span>
            </span>
          </label>
        </div>
      </div>

      <!-- Child Age Settings -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3
          class="text-lg font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2"
        >
          <span class="material-icons text-blue-500">child_care</span>
          {{ $t('hotels.policies.childAgeSettings') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('hotels.policies.childAgeSettingsDesc') }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <!-- Max Baby Age -->
          <div>
            <label class="form-label">{{ $t('hotels.policies.maxBabyAge') }}</label>
            <input
              v-model.number="form.policies.maxBabyAge"
              type="number"
              min="0"
              max="5"
              class="form-input"
            />
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('hotels.policies.maxBabyAgeHelp') }}
            </p>
          </div>

          <!-- Max Child Age -->
          <div>
            <label class="form-label">{{ $t('hotels.policies.maxChildAge') }}</label>
            <input
              v-model.number="form.policies.maxChildAge"
              type="number"
              min="0"
              max="18"
              class="form-input"
            />
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('hotels.policies.maxChildAgeHelp') }}
            </p>
          </div>
        </div>

        <!-- Child Age Groups -->
        <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h4 class="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                <span class="material-icons text-sm text-indigo-500">category</span>
                {{ $t('planning.settings.childAgeGroups') }}
              </h4>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {{ $t('planning.settings.childAgeGroupsDesc') }}
              </p>
            </div>
            <button
              v-if="form.childAgeGroups.length < 3"
              type="button"
              class="px-3 py-1.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
              @click="addChildAgeGroup"
            >
              <span class="material-icons text-sm">add</span>
              {{ $t('planning.settings.addAgeGroup') }}
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(ageGroup, index) in form.childAgeGroups"
              :key="index"
              class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <!-- Age Group Name -->
              <div class="w-32 flex-shrink-0">
                <span
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                  :class="
                    ageGroup.code === 'infant'
                      ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                      : ageGroup.code === 'first'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  "
                >
                  <span class="material-icons text-sm">
                    {{ ageGroup.code === 'infant' ? 'baby_changing_station' : 'child_care' }}
                  </span>
                  {{ getAgeGroupName(ageGroup.code) }}
                </span>
              </div>

              <!-- Age Range -->
              <div class="flex items-center gap-2">
                <div class="w-16">
                  <input
                    :value="ageGroup.minAge"
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
                    v-model.number="ageGroup.maxAge"
                    type="number"
                    :min="ageGroup.minAge"
                    max="17"
                    class="form-input text-sm py-1.5 text-center"
                    @change="onMaxAgeChange(index)"
                  />
                  <span class="text-[10px] text-gray-400 block text-center">max</span>
                </div>

                <span class="text-sm text-gray-500 dark:text-slate-400">{{
                  $t('planning.settings.years')
                }}</span>
              </div>

              <div class="flex-1"></div>

              <!-- Delete Button -->
              <button
                v-if="form.childAgeGroups.length > 1"
                type="button"
                class="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                :title="$t('common.delete')"
                @click="removeChildAgeGroup(index)"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>
          </div>

          <p class="text-xs text-gray-500 dark:text-slate-400 mt-3">
            <span class="material-icons text-xs align-middle">info</span>
            {{ $t('planning.settings.maxAgeGroupsNote') }}
          </p>
        </div>
      </div>

      <!-- Cancellation Policy -->
      <div
        class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
      >
        <!-- Header -->
        <div
          class="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span class="material-icons text-purple-600 dark:text-purple-400">event_busy</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">
              {{ $t('hotels.policies.cancellation') }}
            </h3>
          </div>
          <button
            type="button"
            class="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            @click="addRule"
          >
            <span class="material-icons text-sm">add</span>
            {{ $t('hotels.policies.addRule') }}
          </button>
        </div>

        <!-- Free Cancellation Toggle -->
        <div
          class="px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between bg-green-50/50 dark:bg-green-900/10"
        >
          <div class="flex items-center gap-3">
            <span class="material-icons text-green-600 dark:text-green-400">verified</span>
            <div>
              <span class="text-sm font-medium text-gray-800 dark:text-white">{{
                $t('hotels.policies.freeCancellation')
              }}</span>
              <span
                v-if="form.policies.freeCancellation.enabled"
                class="ml-2 text-xs text-green-600 dark:text-green-400"
              >
                ({{ form.policies.freeCancellation.daysBeforeCheckIn }}+
                {{ $t('hotels.policies.days') }})
              </span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <input
              v-if="form.policies.freeCancellation.enabled"
              v-model.number="form.policies.freeCancellation.daysBeforeCheckIn"
              type="number"
              min="1"
              max="30"
              class="w-16 px-2 py-1 text-sm text-center border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
            />
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="form.policies.freeCancellation.enabled"
                type="checkbox"
                class="sr-only peer"
              />
              <div
                class="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"
              ></div>
            </label>
          </div>
        </div>

        <!-- Rules Table -->
        <div class="divide-y divide-gray-200 dark:divide-slate-600">
          <!-- Empty State -->
          <div v-if="form.policies.cancellationRules.length === 0" class="px-4 py-8 text-center">
            <span class="material-icons text-3xl text-gray-300 dark:text-slate-600">rule</span>
            <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
              {{ $t('hotels.policies.noRules') }}
            </p>
            <p class="text-xs text-gray-400 dark:text-slate-500">
              {{ $t('hotels.policies.noRulesHelp') }}
            </p>
          </div>

          <!-- Rule Rows -->
          <div
            v-for="(rule, index) in sortedRules"
            :key="index"
            class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group"
          >
            <!-- Timeline Dot -->
            <div class="flex-shrink-0">
              <div
                class="w-3 h-3 rounded-full"
                :class="
                  rule.refundPercent === 100
                    ? 'bg-green-500'
                    : rule.refundPercent > 0
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                "
              ></div>
            </div>

            <!-- Days -->
            <div class="flex items-center gap-2 min-w-[140px]">
              <input
                v-model.number="rule.daysBeforeCheckIn"
                type="number"
                min="0"
                max="365"
                class="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                @change="sortRulesDebounced"
              />
              <span class="text-sm text-gray-600 dark:text-slate-400">{{
                $t('hotels.policies.daysPlus')
              }}</span>
            </div>

            <!-- Arrow -->
            <span class="material-icons text-gray-400 text-sm">arrow_forward</span>

            <!-- Refund -->
            <div class="flex items-center gap-2 min-w-[120px]">
              <input
                v-model.number="rule.refundPercent"
                type="number"
                min="0"
                max="100"
                class="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
              />
              <span class="text-sm text-gray-600 dark:text-slate-400"
                >% {{ $t('hotels.policies.refund') }}</span
              >
            </div>

            <!-- Visual Badge -->
            <div class="flex-1">
              <span
                class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                    rule.refundPercent === 100,
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                    rule.refundPercent > 0 && rule.refundPercent < 100,
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                    rule.refundPercent === 0
                }"
              >
                {{
                  rule.refundPercent === 100
                    ? $t('hotels.policies.fullRefund')
                    : rule.refundPercent === 0
                      ? $t('hotels.policies.noRefund')
                      : $t('hotels.policies.partialRefund')
                }}
              </span>
            </div>

            <!-- Delete -->
            <button
              type="button"
              class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-all"
              @click="removeRule(index)"
            >
              <span class="material-icons text-lg">close</span>
            </button>
          </div>
        </div>

        <!-- Quick Add Presets -->
        <div
          class="px-4 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-slate-600"
        >
          <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
            {{ $t('hotels.policies.quickAdd') }}:
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
              @click="addPreset('flexible')"
            >
              {{ $t('hotels.policies.presetFlexible') }}
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
              @click="addPreset('moderate')"
            >
              {{ $t('hotels.policies.presetModerate') }}
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              @click="addPreset('strict')"
            >
              {{ $t('hotels.policies.presetStrict') }}
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-slate-300 rounded hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors"
              @click="addPreset('nonRefundable')"
            >
              {{ $t('hotels.policies.presetNonRefundable') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Save Button Bottom -->
      <div class="flex justify-end">
        <button class="btn-primary" :disabled="saving" @click="saveSettings">
          <span v-if="saving" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ $t('common.saving') }}
          </span>
          <span v-else class="flex items-center gap-2">
            <span class="material-icons text-sm">save</span>
            {{ $t('common.save') }}
          </span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import hotelService from '@/services/hotelService'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const loading = ref(false)
const saving = ref(false)

// Age group names
const AGE_GROUP_NAMES = {
  infant: { tr: 'Bebek', en: 'Infant' },
  first: { tr: '1. Tip Çocuk', en: 'Child Type 1' },
  second: { tr: '2. Tip Çocuk', en: 'Child Type 2' }
}

const getAgeGroupName = code => {
  return AGE_GROUP_NAMES[code]?.tr || code
}

// Default child age groups
const getDefaultChildAgeGroups = () => [
  { code: 'infant', name: AGE_GROUP_NAMES.infant, minAge: 0, maxAge: 2, order: 0 },
  { code: 'first', name: AGE_GROUP_NAMES.first, minAge: 3, maxAge: 12, order: 1 }
]

const form = ref({
  visibility: {
    b2c: true,
    b2b: true
  },
  policies: {
    maxBabyAge: 2,
    maxChildAge: 12,
    freeCancellation: { enabled: false, daysBeforeCheckIn: 1 },
    cancellationRules: []
  },
  childAgeGroups: getDefaultChildAgeGroups()
})

// Watch for hotel changes
watch(
  () => props.hotel,
  newHotel => {
    if (newHotel) {
      form.value = {
        visibility: {
          b2c: newHotel.visibility?.b2c ?? true,
          b2b: newHotel.visibility?.b2b ?? true
        },
        policies: {
          maxBabyAge: newHotel.policies?.maxBabyAge ?? 2,
          maxChildAge: newHotel.policies?.maxChildAge ?? 12,
          freeCancellation: {
            enabled: newHotel.policies?.freeCancellation?.enabled || false,
            daysBeforeCheckIn: newHotel.policies?.freeCancellation?.daysBeforeCheckIn || 1
          },
          cancellationRules: (newHotel.policies?.cancellationRules || []).map(r => ({
            daysBeforeCheckIn: r.daysBeforeCheckIn || 0,
            refundPercent: r.refundPercent || 0
          }))
        },
        childAgeGroups:
          newHotel.childAgeGroups?.length > 0
            ? newHotel.childAgeGroups.map(g => ({
                code: g.code,
                name: { tr: g.name?.tr || '', en: g.name?.en || '' },
                minAge: g.minAge,
                maxAge: g.maxAge,
                order: g.order || 0
              }))
            : getDefaultChildAgeGroups()
      }
    }
  },
  { immediate: true, deep: true }
)

// Add new child age group
const addChildAgeGroup = () => {
  if (form.value.childAgeGroups.length >= 3) return

  const existingCodes = form.value.childAgeGroups.map(g => g.code)
  let newCode = 'second'

  if (!existingCodes.includes('infant')) {
    newCode = 'infant'
  } else if (!existingCodes.includes('first')) {
    newCode = 'first'
  } else if (!existingCodes.includes('second')) {
    newCode = 'second'
  }

  const lastGroup = form.value.childAgeGroups[form.value.childAgeGroups.length - 1]
  const newMinAge = lastGroup ? lastGroup.maxAge + 1 : 0

  form.value.childAgeGroups.push({
    code: newCode,
    name: AGE_GROUP_NAMES[newCode],
    minAge: newMinAge,
    maxAge: Math.min(newMinAge + 5, 17),
    order: form.value.childAgeGroups.length
  })
}

// Remove child age group
const removeChildAgeGroup = index => {
  if (form.value.childAgeGroups.length <= 1) return
  form.value.childAgeGroups.splice(index, 1)
  form.value.childAgeGroups.forEach((g, i) => {
    g.order = i
    if (i === 0) {
      g.minAge = 0
    } else {
      g.minAge = form.value.childAgeGroups[i - 1].maxAge + 1
    }
  })
}

// When maxAge changes
const onMaxAgeChange = index => {
  const groups = form.value.childAgeGroups
  const currentGroup = groups[index]

  if (currentGroup.maxAge < currentGroup.minAge) {
    currentGroup.maxAge = currentGroup.minAge
  }

  if (index < groups.length - 1) {
    groups[index + 1].minAge = currentGroup.maxAge + 1
    if (groups[index + 1].maxAge < groups[index + 1].minAge) {
      groups[index + 1].maxAge = groups[index + 1].minAge
    }
  }
}

// Cancellation rules - sorted by days descending
const sortedRules = computed(() => {
  return [...form.value.policies.cancellationRules].sort(
    (a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn
  )
})

let sortTimeout = null
const sortRulesDebounced = () => {
  if (sortTimeout) clearTimeout(sortTimeout)
  sortTimeout = setTimeout(() => {
    form.value.policies.cancellationRules.sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
  }, 500)
}

const addRule = () => {
  const rules = form.value.policies.cancellationRules
  const lastDays = rules.length > 0 ? Math.max(...rules.map(r => r.daysBeforeCheckIn)) + 7 : 7

  rules.push({ daysBeforeCheckIn: lastDays, refundPercent: 50 })
  rules.sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
}

const removeRule = index => {
  const rules = form.value.policies.cancellationRules
  const sorted = sortedRules.value[index]
  const actualIndex = rules.findIndex(
    r =>
      r.daysBeforeCheckIn === sorted.daysBeforeCheckIn && r.refundPercent === sorted.refundPercent
  )
  if (actualIndex > -1) rules.splice(actualIndex, 1)
}

const addPreset = type => {
  const p = form.value.policies
  switch (type) {
    case 'flexible':
      p.cancellationRules = [
        { daysBeforeCheckIn: 1, refundPercent: 100 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
      p.freeCancellation = { enabled: true, daysBeforeCheckIn: 1 }
      break
    case 'moderate':
      p.cancellationRules = [
        { daysBeforeCheckIn: 7, refundPercent: 100 },
        { daysBeforeCheckIn: 3, refundPercent: 50 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
      p.freeCancellation = { enabled: true, daysBeforeCheckIn: 7 }
      break
    case 'strict':
      p.cancellationRules = [
        { daysBeforeCheckIn: 14, refundPercent: 100 },
        { daysBeforeCheckIn: 7, refundPercent: 50 },
        { daysBeforeCheckIn: 3, refundPercent: 25 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
      p.freeCancellation = { enabled: true, daysBeforeCheckIn: 14 }
      break
    case 'nonRefundable':
      p.cancellationRules = [{ daysBeforeCheckIn: 0, refundPercent: 0 }]
      p.freeCancellation = { enabled: false, daysBeforeCheckIn: 1 }
      break
  }
}

// Save settings
const saveSettings = async () => {
  saving.value = true
  try {
    const response = await hotelService.updateHotel(props.hotel._id, {
      visibility: form.value.visibility,
      policies: {
        ...props.hotel.policies,
        maxBabyAge: form.value.policies.maxBabyAge,
        maxChildAge: form.value.policies.maxChildAge,
        freeCancellation: form.value.policies.freeCancellation,
        cancellationRules: form.value.policies.cancellationRules
      },
      childAgeGroups: form.value.childAgeGroups
    })

    if (response.success) {
      toast.success(t('common.saved'))
      emit('refresh')
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}
</script>
