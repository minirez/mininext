<template>
  <div class="space-y-4">
    <!-- Status & Visibility -->
    <div class="flex items-center gap-6 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          :checked="form.status === 'active'"
          class="toggle"
          @change="form.status = form.status === 'active' ? 'inactive' : 'active'"
        />
        <span
          class="text-sm font-medium"
          :class="form.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'"
        >
          {{
            form.status === 'active'
              ? $t('planning.promoCodes.active')
              : $t('planning.promoCodes.inactive')
          }}
        </span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="form.visibility.b2c" type="checkbox" class="toggle" />
        <span class="text-sm">B2C</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="form.visibility.b2b" type="checkbox" class="toggle" />
        <span class="text-sm">B2B</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="form.combinable" type="checkbox" class="toggle" />
        <span class="text-sm">{{ $t('planning.campaigns.combinableShort') }}</span>
      </label>
    </div>

    <!-- Promo Code -->
    <div>
      <label class="form-label"
        >{{ $t('planning.promoCodes.code') }} <span class="text-red-500">*</span></label
      >
      <input
        v-model="form.code"
        type="text"
        class="form-input w-full font-mono uppercase"
        :class="{ 'has-error': validationErrors.code }"
        :placeholder="$t('planning.promoCodes.codePlaceholder')"
        @input="onCodeInput"
      />
      <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
        {{ $t('planning.promoCodes.codeHint') }}
      </p>
      <p v-if="validationErrors.code" class="form-error mt-1">
        <span class="material-icons text-sm">error_outline</span>
        {{ $t('validation.required') }}
      </p>
    </div>

    <!-- Name (Multi-language) -->
    <div :class="{ 'has-validation-error': validationErrors.name }">
      <MultiLangInput
        v-model="form.name"
        :languages="supportedLanguages"
        :label="$t('planning.promoCodes.name') + ' *'"
        :placeholder="$t('planning.promoCodes.namePlaceholder')"
        @update:model-value="validationErrors.name = false"
      />
      <p v-if="validationErrors.name" class="form-error mt-1">
        <span class="material-icons text-sm">error_outline</span>
        {{ $t('validation.required') }}
      </p>
    </div>

    <!-- Discount Configuration -->
    <div
      class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
    >
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-sm text-green-500">local_offer</span>
        <span class="font-medium text-sm text-gray-800 dark:text-white">{{
          $t('planning.promoCodes.discount')
        }}</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">{{ $t('planning.promoCodes.discountType') }}</label>
          <select v-model="form.discount.type" class="form-input w-full">
            <option value="percentage">
              {{ $t('planning.campaigns.discountTypes.percentage') }}
            </option>
            <option value="fixed">{{ $t('planning.campaigns.discountTypes.fixed') }}</option>
            <option value="free_nights">
              {{ $t('planning.campaigns.discountTypes.freeNights') }}
            </option>
          </select>
        </div>
        <div v-if="form.discount.type !== 'free_nights'">
          <label class="form-label">{{ $t('planning.promoCodes.discountValue') }}</label>
          <div class="relative">
            <input
              v-model.number="form.discount.value"
              type="number"
              min="0"
              :max="form.discount.type === 'percentage' ? 100 : undefined"
              class="form-input w-full"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              {{ form.discount.type === 'percentage' ? '%' : '' }}
            </span>
          </div>
        </div>
        <div v-else class="flex gap-3">
          <div class="flex-1">
            <label class="form-label">{{ $t('planning.campaigns.stayNights') }}</label>
            <input
              v-model.number="form.discount.freeNights.stayNights"
              type="number"
              min="2"
              class="form-input w-full"
            />
          </div>
          <div class="flex-1">
            <label class="form-label">{{ $t('planning.campaigns.freeNights') }}</label>
            <input
              v-model.number="form.discount.freeNights.freeNights"
              type="number"
              min="1"
              class="form-input w-full"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Markets Selection -->
    <div
      v-if="markets.length > 0"
      class="p-3 rounded-lg border-2 transition-colors bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="material-icons text-sm text-blue-500">public</span>
          <span class="font-medium text-sm text-gray-800 dark:text-white">
            {{ $t('planning.campaigns.applicableMarkets') }}
          </span>
          <span class="text-xs text-gray-500"
            >({{ form.conditions.applicableMarkets.length }}/{{ markets.length }})</span
          >
        </div>
        <button
          type="button"
          class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          @click="toggleAllMarkets"
        >
          {{
            form.conditions.applicableMarkets.length === markets.length
              ? $t('planning.campaigns.deselectAll')
              : $t('planning.campaigns.selectAll')
          }}
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="market in markets"
          :key="market._id"
          type="button"
          class="px-2 py-1 rounded text-xs font-medium transition-all"
          :class="
            form.conditions.applicableMarkets.includes(market._id)
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-blue-400'
          "
          @click="toggleMarket(market._id)"
        >
          {{ market.code }}
        </button>
      </div>
      <p class="text-xs text-gray-500 dark:text-slate-400 mt-1.5">
        {{ $t('planning.promoCodes.marketsHint') }}
      </p>
    </div>

    <!-- Booking Window -->
    <div
      class="p-3 rounded-lg border-2 transition-colors"
      :class="
        validationErrors.bookingDates
          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      "
    >
      <div class="flex items-center gap-2 mb-2">
        <span
          class="material-icons text-sm"
          :class="validationErrors.bookingDates ? 'text-red-500' : 'text-blue-500'"
          >event_available</span
        >
        <span class="font-medium text-sm text-gray-800 dark:text-white">
          {{ $t('planning.promoCodes.bookingWindow') }} <span class="text-red-500">*</span>
        </span>
        <span class="text-xs text-gray-500 dark:text-slate-400 ml-1">{{
          $t('planning.promoCodes.bookingWindowHint')
        }}</span>
      </div>
      <DateRangeDual
        :model-value="bookingDateRange"
        :allow-past="true"
        summary-bg-class="bg-blue-50/50 dark:bg-blue-900/10"
        @update:model-value="onBookingDateChange"
      />
    </div>

    <!-- Stay Window -->
    <div
      class="p-3 rounded-lg border-2 transition-colors"
      :class="
        validationErrors.stayDates
          ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
          : 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
      "
    >
      <div class="flex items-center gap-2 mb-2">
        <span
          class="material-icons text-sm"
          :class="validationErrors.stayDates ? 'text-red-500' : 'text-teal-500'"
          >date_range</span
        >
        <span class="font-medium text-sm text-gray-800 dark:text-white">
          {{ $t('planning.promoCodes.stayWindow') }} <span class="text-red-500">*</span>
        </span>
        <span class="text-xs text-gray-500 dark:text-slate-400 ml-1">{{
          $t('planning.promoCodes.stayWindowHint')
        }}</span>
      </div>
      <DateRangeDual
        :model-value="stayDateRange"
        :allow-past="true"
        summary-bg-class="bg-teal-50/50 dark:bg-teal-900/10"
        @update:model-value="onStayDateChange"
      />
    </div>

    <!-- Minimum Nights -->
    <div>
      <label class="form-label">{{ $t('planning.promoCodes.minNights') }}</label>
      <input
        v-model.number="form.conditions.minNights"
        type="number"
        min="1"
        class="form-input w-32"
      />
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-slate-700">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </button>
      <button type="button" class="btn-primary" :disabled="saving" @click="handleSave">
        {{ saving ? $t('common.loading') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import DateRangeDual from '@/components/common/DateRangeDual.vue'
import planningService from '@/services/planningService'

const SUPPORTED_LANGUAGES = [
  'tr',
  'en',
  'ru',
  'el',
  'de',
  'es',
  'it',
  'fr',
  'ro',
  'bg',
  'pt',
  'da',
  'zh',
  'ar',
  'fa',
  'he',
  'sq',
  'uk',
  'pl',
  'az'
]

const props = defineProps({
  hotel: { type: Object, required: true },
  promo: { type: Object, default: null },
  markets: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t } = useI18n()
const toast = useToast()
const saving = ref(false)
const supportedLanguages = SUPPORTED_LANGUAGES

const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

const validationErrors = reactive({
  code: false,
  name: false,
  stayDates: false,
  bookingDates: false
})

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  status: 'active',
  visibility: { b2c: true, b2b: true },
  combinable: true,
  discount: {
    type: 'percentage',
    value: 10,
    freeNights: { stayNights: 7, freeNights: 1 }
  },
  conditions: {
    minNights: 1,
    applicableMarkets: []
  }
})

const stayDateRange = ref({ start: null, end: null })
const bookingDateRange = ref({ start: null, end: null })

const onCodeInput = () => {
  form.code = form.code.toUpperCase()
  validationErrors.code = false
}

const onBookingDateChange = val => {
  bookingDateRange.value = val
  validationErrors.bookingDates = false
}

const onStayDateChange = val => {
  stayDateRange.value = val
  validationErrors.stayDates = false
}

const toggleMarket = marketId => {
  const idx = form.conditions.applicableMarkets.indexOf(marketId)
  if (idx >= 0) {
    form.conditions.applicableMarkets.splice(idx, 1)
  } else {
    form.conditions.applicableMarkets.push(marketId)
  }
}

const toggleAllMarkets = () => {
  if (form.conditions.applicableMarkets.length === props.markets.length) {
    form.conditions.applicableMarkets = []
  } else {
    form.conditions.applicableMarkets = props.markets.map(m => m._id)
  }
}

const validate = () => {
  let valid = true

  if (!form.code.trim()) {
    validationErrors.code = true
    valid = false
  }

  const hasName = SUPPORTED_LANGUAGES.some(lang => form.name[lang]?.trim())
  if (!hasName) {
    validationErrors.name = true
    valid = false
  }

  if (!bookingDateRange.value.start || !bookingDateRange.value.end) {
    validationErrors.bookingDates = true
    valid = false
  }

  if (!stayDateRange.value.start || !stayDateRange.value.end) {
    validationErrors.stayDates = true
    valid = false
  }

  return valid
}

const handleSave = async () => {
  if (!validate()) return

  saving.value = true
  try {
    const payload = {
      code: form.code.toUpperCase().trim(),
      name: form.name,
      type: 'promo_code',
      status: form.status,
      visibility: form.visibility,
      combinable: form.combinable,
      applicationType: 'stay',
      calculationType: 'cumulative',
      calculationOrder: 0,
      discount: {
        type: form.discount.type,
        ...(form.discount.type !== 'free_nights'
          ? { value: form.discount.value }
          : { freeNights: form.discount.freeNights })
      },
      bookingWindow: {
        startDate: bookingDateRange.value.start,
        endDate: bookingDateRange.value.end
      },
      stayWindow: {
        startDate: stayDateRange.value.start,
        endDate: stayDateRange.value.end
      },
      conditions: {
        minNights: form.conditions.minNights || 1,
        applicableMarkets: form.conditions.applicableMarkets
      }
    }

    if (props.promo?._id) {
      await planningService.updateCampaign(props.hotel._id, props.promo._id, payload)
      toast.success(t('planning.promoCodes.updated'))
    } else {
      await planningService.createCampaign(props.hotel._id, payload)
      toast.success(t('planning.promoCodes.created'))
    }

    emit('saved')
  } catch (error) {
    toast.error(
      error.response?.data?.message || error.response?.data?.error || t('common.saveFailed')
    )
  } finally {
    saving.value = false
  }
}

const initialize = () => {
  if (props.promo) {
    form.code = props.promo.code || ''
    form.status = props.promo.status || 'active'
    form.combinable = props.promo.combinable ?? true
    form.visibility = { ...{ b2c: true, b2b: true }, ...props.promo.visibility }

    // Name
    if (props.promo.name) {
      SUPPORTED_LANGUAGES.forEach(lang => {
        form.name[lang] = props.promo.name[lang] || ''
      })
    }

    // Discount
    if (props.promo.discount) {
      form.discount.type = props.promo.discount.type || 'percentage'
      form.discount.value = props.promo.discount.value || 10
      if (props.promo.discount.freeNights) {
        form.discount.freeNights = { ...props.promo.discount.freeNights }
      }
    }

    // Conditions
    if (props.promo.conditions) {
      form.conditions.minNights = props.promo.conditions.minNights || 1
      form.conditions.applicableMarkets = (props.promo.conditions.applicableMarkets || []).map(m =>
        typeof m === 'object' ? m._id : m
      )
    }

    // Dates
    if (props.promo.bookingWindow) {
      bookingDateRange.value = {
        start: props.promo.bookingWindow.startDate
          ? new Date(props.promo.bookingWindow.startDate)
          : null,
        end: props.promo.bookingWindow.endDate ? new Date(props.promo.bookingWindow.endDate) : null
      }
    }
    if (props.promo.stayWindow) {
      stayDateRange.value = {
        start: props.promo.stayWindow.startDate ? new Date(props.promo.stayWindow.startDate) : null,
        end: props.promo.stayWindow.endDate ? new Date(props.promo.stayWindow.endDate) : null
      }
    }
  }
}

onMounted(() => {
  initialize()
})
</script>
