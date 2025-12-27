<template>
  <div class="space-y-6">
    <!-- Code -->
    <div>
      <label class="form-label">{{ $t('planning.markets.code') }} <span class="text-red-500">*</span></label>
      <input v-model="form.code" type="text" class="form-input uppercase" maxlength="10" />
    </div>

    <!-- Name (Multilingual) -->
    <MultiLangInput
      v-model="form.name"
      :languages="SUPPORTED_LANGUAGES"
      :label="$t('planning.markets.name') + ' *'"
    />

    <!-- Currency -->
    <div>
      <label class="form-label">{{ $t('planning.markets.currency') }} <span class="text-red-500">*</span></label>
      <select v-model="form.currency" class="form-select">
        <option v-for="curr in currencies" :key="curr" :value="curr">{{ curr }}</option>
      </select>
    </div>

    <!-- Countries -->
    <div>
      <label class="form-label">{{ $t('planning.markets.countriesLabel') }}</label>
      <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg max-h-48 overflow-y-auto">
        <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
          <label
            v-for="country in commonCountries"
            :key="country.code"
            class="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              :value="country.code"
              v-model="form.countries"
              class="rounded border-gray-300 text-indigo-600"
            />
            <span>{{ country.name }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Age Ranges -->
    <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-pink-500">child_care</span>
        <label class="form-label mb-0">{{ $t('planning.markets.ageSettings') }}</label>
      </div>
      <p class="text-xs text-gray-500 dark:text-slate-400 mb-4">
        {{ $t('planning.markets.ageSettingsHint') }}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Child Age Range -->
        <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-icons text-pink-500 text-sm">child_care</span>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.childAgeRange') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="form.childAgeRange.min"
              type="number"
              min="0"
              max="17"
              class="form-input w-16 text-center"
              :placeholder="hotel?.policies?.maxBabyAge ? String(hotel.policies.maxBabyAge + 1) : '3'"
            />
            <span class="text-gray-500">-</span>
            <input
              v-model.number="form.childAgeRange.max"
              type="number"
              min="1"
              max="17"
              class="form-input w-16 text-center"
              :placeholder="String(hotel?.policies?.maxChildAge || 12)"
            />
            <span class="text-sm text-gray-500">{{ $t('planning.markets.years') }}</span>
          </div>
          <p v-if="!form.childAgeRange.max" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <span class="material-icons text-xs">info</span>
            {{ $t('planning.markets.usingHotelDefault') }}: 0-{{ hotel?.policies?.maxChildAge || 12 }}
          </p>
        </div>

        <!-- Infant Age Range -->
        <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
          <div class="flex items-center gap-2 mb-2">
            <span class="material-icons text-purple-500 text-sm">baby_changing_station</span>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.infantAgeRange') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model.number="form.infantAgeRange.min"
              type="number"
              min="0"
              max="5"
              class="form-input w-16 text-center"
              placeholder="0"
            />
            <span class="text-gray-500">-</span>
            <input
              v-model.number="form.infantAgeRange.max"
              type="number"
              min="0"
              max="5"
              class="form-input w-16 text-center"
              :placeholder="String(hotel?.policies?.maxBabyAge || 2)"
            />
            <span class="text-sm text-gray-500">{{ $t('planning.markets.years') }}</span>
          </div>
          <p v-if="!form.infantAgeRange.max" class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <span class="material-icons text-xs">info</span>
            {{ $t('planning.markets.usingHotelDefault') }}: 0-{{ hotel?.policies?.maxBabyAge || 2 }}
          </p>
        </div>
      </div>
    </div>

    <!-- Sales Channels (Visibility) -->
    <div>
      <label class="form-label">{{ $t('planning.markets.salesChannels') }}</label>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.salesChannels.b2c" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm">B2C</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="form.salesChannels.b2b" class="rounded border-gray-300 text-indigo-600" />
          <span class="text-sm">B2B</span>
        </label>
      </div>
    </div>

    <!-- Active Products -->
    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
      <div class="flex items-center gap-2 mb-1">
        <span class="material-icons text-blue-500">inventory_2</span>
        <label class="form-label mb-0">{{ $t('planning.markets.activeProducts') }}</label>
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
            <span>{{ rt.code }}</span>
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
            <span>{{ mp.code }}</span>
            <span class="text-xs text-gray-500 dark:text-slate-400">{{ mp.name?.[locale] || mp.name?.tr }}</span>
          </label>
        </div>
        <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.markets.emptyMeansAll') }}
        </p>
      </div>
    </div>

    <!-- Rate Policy -->
    <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4">
      <label class="form-label">{{ $t('planning.markets.ratePolicy') }}</label>
      <div class="flex flex-wrap gap-3">
        <label
          v-for="policy in ratePolicies"
          :key="policy.value"
          class="flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all"
          :class="form.ratePolicy === policy.value
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
        >
          <input type="radio" v-model="form.ratePolicy" :value="policy.value" class="sr-only" />
          <span class="text-sm font-medium">{{ policy.label }}</span>
        </label>
      </div>

      <!-- Non-Refundable Discount -->
      <div v-if="form.ratePolicy !== 'refundable'" class="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-slate-600">
        <label class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.nonRefundableDiscount') }}</label>
        <div class="flex items-center gap-2">
          <input
            v-model.number="form.nonRefundableDiscount"
            type="number"
            min="0"
            max="50"
            class="form-input w-20 text-center"
          />
          <span class="text-sm text-gray-500">%</span>
        </div>
      </div>
    </div>

    <!-- Taxes Section -->
    <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4">
      <label class="form-label">{{ $t('planning.markets.taxes') }}</label>

      <!-- VAT -->
      <div class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.taxes.vat.enabled" class="rounded border-gray-300 text-indigo-600" />
            <span class="font-medium text-sm">{{ $t('planning.markets.vat') }}</span>
          </label>
        </div>
        <div v-if="form.taxes.vat.enabled" class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <input v-model.number="form.taxes.vat.rate" type="number" min="0" max="100" class="form-input w-16 text-center text-sm" />
            <span class="text-sm text-gray-500">%</span>
          </div>
          <label class="flex items-center gap-1 text-sm cursor-pointer">
            <input type="checkbox" v-model="form.taxes.vat.included" class="rounded border-gray-300 text-indigo-600" />
            <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.markets.includedInPrice') }}</span>
          </label>
        </div>
      </div>

      <!-- City Tax -->
      <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 space-y-3">
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.taxes.cityTax.enabled" class="rounded border-gray-300 text-indigo-600" />
            <span class="font-medium text-sm">{{ $t('planning.markets.cityTax') }}</span>
          </label>
        </div>
        <div v-if="form.taxes.cityTax.enabled" class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.taxType') }}</label>
            <select v-model="form.taxes.cityTax.type" class="form-select text-sm">
              <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
              <option value="fixed_per_night">{{ $t('planning.markets.fixedPerNight') }}</option>
              <option value="fixed_per_person">{{ $t('planning.markets.fixedPerPerson') }}</option>
              <option value="fixed_per_person_night">{{ $t('planning.markets.fixedPerPersonNight') }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.amount') }}</label>
            <div class="flex items-center gap-2">
              <input v-model.number="form.taxes.cityTax.amount" type="number" min="0" class="form-input text-sm" />
              <span class="text-sm text-gray-500">{{ form.taxes.cityTax.type === 'percentage' ? '%' : form.currency }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Service Charge -->
      <div class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.taxes.serviceCharge.enabled" class="rounded border-gray-300 text-indigo-600" />
            <span class="font-medium text-sm">{{ $t('planning.markets.serviceCharge') }}</span>
          </label>
        </div>
        <div v-if="form.taxes.serviceCharge.enabled" class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <input v-model.number="form.taxes.serviceCharge.rate" type="number" min="0" max="100" class="form-input w-16 text-center text-sm" />
            <span class="text-sm text-gray-500">%</span>
          </div>
          <label class="flex items-center gap-1 text-sm cursor-pointer">
            <input type="checkbox" v-model="form.taxes.serviceCharge.included" class="rounded border-gray-300 text-indigo-600" />
            <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.markets.includedInPrice') }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Cancellation Policy -->
    <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4">
      <label class="form-label">{{ $t('planning.markets.cancellationPolicy') }}</label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" v-model="form.cancellationPolicy.useHotelPolicy" class="rounded border-gray-300 text-indigo-600" />
        <span class="text-sm">{{ $t('planning.markets.useHotelPolicy') }}</span>
      </label>

      <div v-if="!form.cancellationPolicy.useHotelPolicy" class="space-y-4 pt-3 border-t border-gray-200 dark:border-slate-600">
        <!-- Free Cancellation Days -->
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.freeCancellationDays') }}</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="form.cancellationPolicy.freeCancellationDays"
              type="number"
              min="0"
              class="form-input w-20 text-center"
            />
            <span class="text-sm text-gray-500">{{ $t('planning.markets.daysBeforeCheckin') }}</span>
          </div>
        </div>

        <!-- Penalty Rules -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.penaltyRules') }}</label>
            <button type="button" @click="addPenaltyRule" class="text-sm text-purple-600 hover:text-purple-800">
              + {{ $t('common.add') }}
            </button>
          </div>
          <div v-for="(rule, index) in form.cancellationPolicy.penaltyRules" :key="index" class="flex items-center gap-3 mb-2">
            <div class="flex items-center gap-2 flex-1">
              <input v-model.number="rule.daysBeforeCheckIn" type="number" min="0" class="form-input w-16 text-center text-sm" />
              <span class="text-xs text-gray-500">{{ $t('planning.markets.daysBeforeCheckin') }}</span>
            </div>
            <select v-model="rule.penaltyType" class="form-select w-32 text-sm">
              <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
              <option value="nights">{{ $t('planning.markets.nights') }}</option>
            </select>
            <div class="flex items-center gap-1">
              <input v-model.number="rule.penaltyValue" type="number" min="0" class="form-input w-16 text-center text-sm" />
              <span class="text-xs text-gray-500">{{ rule.penaltyType === 'percentage' ? '%' : $t('planning.markets.nights') }}</span>
            </div>
            <button type="button" @click="removePenaltyRule(index)" class="text-red-500 hover:text-red-700">
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
        </div>

        <!-- No Show Penalty -->
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.noShowPenalty') }}</label>
          <select v-model="form.cancellationPolicy.noShowPenalty.type" class="form-select w-32 text-sm">
            <option value="full">{{ $t('planning.markets.fullAmount') }}</option>
            <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
            <option value="nights">{{ $t('planning.markets.nights') }}</option>
          </select>
          <input
            v-if="form.cancellationPolicy.noShowPenalty.type !== 'full'"
            v-model.number="form.cancellationPolicy.noShowPenalty.value"
            type="number"
            min="0"
            class="form-input w-16 text-center text-sm"
          />
        </div>
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
import MultiLangInput from '@/components/common/MultiLangInput.vue'

const props = defineProps({
  hotel: { type: Object, required: true },
  market: { type: Object, default: null },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()
const saving = ref(false)

const currencies = ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED', 'CHF', 'JPY', 'CNY']

const ratePolicies = computed(() => [
  { value: 'refundable', label: t('planning.markets.refundable') },
  { value: 'non_refundable', label: t('planning.markets.nonRefundable') },
  { value: 'both', label: t('planning.markets.both') }
])

const commonCountries = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'RU', name: 'Russia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'PL', name: 'Poland' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'US', name: 'USA' }
]

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  currency: 'EUR',
  countries: [],
  salesChannels: { b2c: true, b2b: true },
  childAgeRange: { min: null, max: null },
  infantAgeRange: { min: null, max: null },
  activeRoomTypes: [],
  activeMealPlans: [],
  ratePolicy: 'refundable',
  nonRefundableDiscount: 10,
  taxes: {
    vat: { enabled: false, rate: 10, included: true },
    cityTax: { enabled: false, type: 'fixed_per_night', amount: 0 },
    serviceCharge: { enabled: false, rate: 10, included: true }
  },
  cancellationPolicy: {
    useHotelPolicy: true,
    freeCancellationDays: 7,
    penaltyRules: [],
    noShowPenalty: { type: 'full', value: 100 }
  }
})

// Penalty rule helpers
const addPenaltyRule = () => {
  form.cancellationPolicy.penaltyRules.push({
    daysBeforeCheckIn: 7,
    penaltyType: 'percentage',
    penaltyValue: 50
  })
}

const removePenaltyRule = (index) => {
  form.cancellationPolicy.penaltyRules.splice(index, 1)
}

const handleSave = async () => {
  // Check if at least one language has a name
  const hasName = SUPPORTED_LANGUAGES.some(l => form.name[l]?.trim())
  if (!form.code || !hasName) {
    toast.error(t('validation.required'))
    return
  }

  saving.value = true
  try {
    if (props.market) {
      await planningService.updateMarket(props.hotel._id, props.market._id, form)
      toast.success(t('planning.markets.updated'))
    } else {
      await planningService.createMarket(props.hotel._id, form)
      toast.success(t('planning.markets.created'))
    }
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (props.market) {
    form.code = props.market.code || ''
    form.name = { ...createMultiLangObject(), ...props.market.name }
    form.currency = props.market.currency || 'EUR'
    form.countries = [...(props.market.countries || [])]
    form.salesChannels = { ...form.salesChannels, ...props.market.salesChannels }
    form.childAgeRange = { ...form.childAgeRange, ...props.market.childAgeRange }
    form.infantAgeRange = { ...form.infantAgeRange, ...props.market.infantAgeRange }
    form.activeRoomTypes = [...(props.market.activeRoomTypes || [])].map(id => typeof id === 'object' ? id._id : id)
    form.activeMealPlans = [...(props.market.activeMealPlans || [])].map(id => typeof id === 'object' ? id._id : id)
    form.ratePolicy = props.market.ratePolicy || 'refundable'
    form.nonRefundableDiscount = props.market.nonRefundableDiscount ?? 10

    // Taxes
    if (props.market.taxes) {
      form.taxes.vat = { ...form.taxes.vat, ...props.market.taxes.vat }
      form.taxes.cityTax = { ...form.taxes.cityTax, ...props.market.taxes.cityTax }
      form.taxes.serviceCharge = { ...form.taxes.serviceCharge, ...props.market.taxes.serviceCharge }
    }

    // Cancellation policy
    if (props.market.cancellationPolicy) {
      form.cancellationPolicy.useHotelPolicy = props.market.cancellationPolicy.useHotelPolicy ?? true
      form.cancellationPolicy.freeCancellationDays = props.market.cancellationPolicy.freeCancellationDays ?? 7
      form.cancellationPolicy.penaltyRules = [...(props.market.cancellationPolicy.penaltyRules || [])]
      form.cancellationPolicy.noShowPenalty = { ...form.cancellationPolicy.noShowPenalty, ...props.market.cancellationPolicy.noShowPenalty }
    }
  }
})
</script>
