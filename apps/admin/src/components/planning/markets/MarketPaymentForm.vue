<template>
  <div class="space-y-8">
    <!-- Prepayment Section -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-600">payments</span>
        {{ $t('planning.markets.paymentTerms') }}
      </h3>

      <!-- Prepayment Toggle -->
      <div
        class="p-6 rounded-xl border-2 transition-all cursor-pointer mb-6"
        :class="
          formData.prepaymentRequired
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
        "
        @click="formData.prepaymentRequired = !formData.prepaymentRequired"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :class="
                formData.prepaymentRequired
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
              "
            >
              <span class="material-icons">account_balance_wallet</span>
            </div>
            <div>
              <h4 class="font-semibold text-gray-800 dark:text-white">
                {{ $t('planning.markets.prepaymentRequired') }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('planning.markets.prepaymentDescription') }}
              </p>
            </div>
          </div>
          <div class="relative">
            <input v-model="formData.prepaymentRequired" type="checkbox" class="sr-only" />
            <div
              class="w-11 h-6 rounded-full transition-colors"
              :class="
                formData.prepaymentRequired ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-600'
              "
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="{ 'translate-x-5': formData.prepaymentRequired }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Prepayment Settings -->
        <div
          v-if="formData.prepaymentRequired"
          class="mt-6 pt-4 border-t border-amber-200 dark:border-amber-800"
          @click.stop
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {{ $t('planning.markets.prepaymentPercentage') }}
              </label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="formData.prepaymentPercentage"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  class="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div class="w-16 text-center">
                  <span class="text-xl font-bold text-amber-600 dark:text-amber-400"
                    >{{ formData.prepaymentPercentage }}%</span
                  >
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{{
                $t('planning.markets.quickSelect')
              }}</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="pct in [20, 30, 50, 100]"
                  :key="pct"
                  type="button"
                  class="px-4 py-2 rounded-lg border transition-colors"
                  :class="
                    formData.prepaymentPercentage === pct
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50'
                  "
                  @click="formData.prepaymentPercentage = pct"
                >
                  {{ pct }}%
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Remaining Payment Section (when prepayment < 100%) -->
      <div
        v-if="formData.prepaymentRequired && formData.prepaymentPercentage < 100"
        class="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600"
      >
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"
          >
            <span class="material-icons">schedule</span>
          </div>
          <div>
            <h4 class="font-medium text-gray-800 dark:text-white">
              {{ $t('planning.markets.remainingPaymentDue') }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{
                $t('planning.markets.remainingPaymentHint', {
                  percent: 100 - formData.prepaymentPercentage
                })
              }}
            </p>
          </div>
        </div>

        <!-- Payment Due Type Selection -->
        <div class="space-y-3">
          <!-- Option 1: Days after booking -->
          <label
            class="relative flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all"
            :class="
              formData.remainingPayment.type === 'days_after_booking'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            "
          >
            <input
              v-model="formData.remainingPayment.type"
              type="radio"
              value="days_after_booking"
              class="sr-only"
            />
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="
                formData.remainingPayment.type === 'days_after_booking'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500'
              "
            >
              <span class="material-icons text-sm">event_available</span>
            </div>
            <div class="flex-1">
              <span class="font-medium text-gray-800 dark:text-white">{{
                $t('planning.markets.daysAfterBooking')
              }}</span>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('planning.markets.daysAfterBookingHint') }}
              </p>
            </div>
            <div
              v-if="formData.remainingPayment.type === 'days_after_booking'"
              class="flex items-center gap-2"
              @click.stop
            >
              <input
                v-model.number="formData.remainingPayment.days"
                type="number"
                min="1"
                max="30"
                class="form-input w-20 text-center"
              />
              <span class="text-sm text-gray-500">{{ $t('planning.markets.days') }}</span>
            </div>
          </label>

          <!-- Option 2: Days before check-in -->
          <label
            class="relative flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all"
            :class="
              formData.remainingPayment.type === 'days_before_checkin'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            "
          >
            <input
              v-model="formData.remainingPayment.type"
              type="radio"
              value="days_before_checkin"
              class="sr-only"
            />
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="
                formData.remainingPayment.type === 'days_before_checkin'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500'
              "
            >
              <span class="material-icons text-sm">event</span>
            </div>
            <div class="flex-1">
              <span class="font-medium text-gray-800 dark:text-white">{{
                $t('planning.markets.daysBeforeCheckin')
              }}</span>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('planning.markets.daysBeforeCheckinHint') }}
              </p>
            </div>
            <div
              v-if="formData.remainingPayment.type === 'days_before_checkin'"
              class="flex items-center gap-2"
              @click.stop
            >
              <input
                v-model.number="formData.remainingPayment.days"
                type="number"
                min="1"
                max="60"
                class="form-input w-20 text-center"
              />
              <span class="text-sm text-gray-500">{{ $t('planning.markets.days') }}</span>
            </div>
          </label>

          <!-- Option 3: At check-in (pay at hotel) -->
          <label
            class="relative flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all"
            :class="
              formData.remainingPayment.type === 'at_checkin'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
            "
          >
            <input
              v-model="formData.remainingPayment.type"
              type="radio"
              value="at_checkin"
              class="sr-only"
            />
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="
                formData.remainingPayment.type === 'at_checkin'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500'
              "
            >
              <span class="material-icons text-sm">hotel</span>
            </div>
            <div class="flex-1">
              <span class="font-medium text-gray-800 dark:text-white">{{
                $t('planning.markets.atCheckin')
              }}</span>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('planning.markets.atCheckinHint') }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Full Payment at Booking Info (when prepayment = 100%) -->
      <div
        v-if="formData.prepaymentRequired && formData.prepaymentPercentage === 100"
        class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
      >
        <div class="flex items-center gap-3">
          <span class="material-icons text-green-600">verified</span>
          <div>
            <span class="font-medium text-green-800 dark:text-green-300">{{
              $t('planning.markets.fullPaymentAtBooking')
            }}</span>
            <p class="text-sm text-green-600 dark:text-green-400">
              {{ $t('planning.markets.fullPaymentAtBookingHint') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Taxes Section -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-orange-600">receipt_long</span>
        {{ $t('planning.markets.taxes') }}
      </h3>

      <div
        class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden divide-y divide-gray-200 dark:divide-slate-700"
      >
        <!-- VAT -->
        <div
          class="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
        >
          <label class="flex items-center gap-3 cursor-pointer flex-1">
            <input
              v-model="formData.taxes.vat.enabled"
              type="checkbox"
              class="w-5 h-5 rounded border-gray-300 text-indigo-600"
            />
            <div class="flex items-center gap-2">
              <span
                class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
              >
                <span class="text-blue-600 dark:text-blue-400 text-sm font-bold">%</span>
              </span>
              <span class="font-medium text-gray-800 dark:text-white">{{
                $t('planning.markets.vat')
              }}</span>
            </div>
          </label>
          <div v-if="formData.taxes.vat.enabled" class="flex items-center gap-4">
            <div
              class="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-1.5"
            >
              <input
                v-model.number="formData.taxes.vat.rate"
                type="number"
                min="0"
                max="100"
                class="w-14 text-center bg-transparent border-none focus:ring-0 font-bold"
              />
              <span class="text-gray-500">%</span>
            </div>
            <label
              class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg"
              :class="
                formData.taxes.vat.included
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-gray-100 dark:bg-slate-700'
              "
            >
              <input
                v-model="formData.taxes.vat.included"
                type="checkbox"
                class="rounded border-gray-300 text-green-600"
              />
              <span
                class="text-sm"
                :class="
                  formData.taxes.vat.included
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-600 dark:text-slate-400'
                "
                >{{ $t('planning.markets.includedInPrice') }}</span
              >
            </label>
          </div>
        </div>

        <!-- City Tax -->
        <div class="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-3 cursor-pointer flex-1">
              <input
                v-model="formData.taxes.cityTax.enabled"
                type="checkbox"
                class="w-5 h-5 rounded border-gray-300 text-indigo-600"
              />
              <div class="flex items-center gap-2">
                <span
                  class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
                >
                  <span class="material-icons text-purple-600 dark:text-purple-400 text-sm"
                    >location_city</span
                  >
                </span>
                <span class="font-medium text-gray-800 dark:text-white">{{
                  $t('planning.markets.cityTax')
                }}</span>
              </div>
            </label>
          </div>
          <div
            v-if="formData.taxes.cityTax.enabled"
            class="mt-4 ml-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 mb-1 block">{{
                $t('planning.markets.taxType')
              }}</label>
              <select v-model="formData.taxes.cityTax.type" class="form-select text-sm">
                <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
                <option value="fixed_per_night">{{ $t('planning.markets.fixedPerNight') }}</option>
                <option value="fixed_per_person">
                  {{ $t('planning.markets.fixedPerPerson') }}
                </option>
                <option value="fixed_per_person_night">
                  {{ $t('planning.markets.fixedPerPersonNight') }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 mb-1 block">{{
                $t('planning.markets.amount')
              }}</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="formData.taxes.cityTax.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  class="form-input text-sm"
                />
                <span class="text-sm text-gray-500 font-medium">{{
                  formData.taxes.cityTax.type === 'percentage'
                    ? '%'
                    : props.market?.currency || 'EUR'
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Charge -->
        <div
          class="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
        >
          <label class="flex items-center gap-3 cursor-pointer flex-1">
            <input
              v-model="formData.taxes.serviceCharge.enabled"
              type="checkbox"
              class="w-5 h-5 rounded border-gray-300 text-indigo-600"
            />
            <div class="flex items-center gap-2">
              <span
                class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
              >
                <span class="material-icons text-amber-600 dark:text-amber-400 text-sm"
                  >room_service</span
                >
              </span>
              <span class="font-medium text-gray-800 dark:text-white">{{
                $t('planning.markets.serviceCharge')
              }}</span>
            </div>
          </label>
          <div v-if="formData.taxes.serviceCharge.enabled" class="flex items-center gap-4">
            <div
              class="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-1.5"
            >
              <input
                v-model.number="formData.taxes.serviceCharge.rate"
                type="number"
                min="0"
                max="100"
                class="w-14 text-center bg-transparent border-none focus:ring-0 font-bold"
              />
              <span class="text-gray-500">%</span>
            </div>
            <label
              class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg"
              :class="
                formData.taxes.serviceCharge.included
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-gray-100 dark:bg-slate-700'
              "
            >
              <input
                v-model="formData.taxes.serviceCharge.included"
                type="checkbox"
                class="rounded border-gray-300 text-green-600"
              />
              <span
                class="text-sm"
                :class="
                  formData.taxes.serviceCharge.included
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-600 dark:text-slate-400'
                "
                >{{ $t('planning.markets.includedInPrice') }}</span
              >
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Summary -->
    <div
      class="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700/50 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-slate-600"
    >
      <h4 class="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-600">summarize</span>
        {{ $t('planning.markets.paymentSummary') }}
      </h4>

      <div class="space-y-3">
        <div
          class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600"
        >
          <span class="text-gray-600 dark:text-slate-400">{{
            $t('planning.markets.prepayment')
          }}</span>
          <span class="font-medium text-gray-800 dark:text-white">
            {{
              formData.prepaymentRequired
                ? `${formData.prepaymentPercentage}%`
                : $t('planning.markets.notRequired')
            }}
          </span>
        </div>
        <div
          v-if="formData.prepaymentRequired && formData.prepaymentPercentage < 100"
          class="flex items-center justify-between py-2 border-b border-gray-200 dark:border-slate-600"
        >
          <span class="text-gray-600 dark:text-slate-400">{{
            $t('planning.markets.remainingPayment')
          }}</span>
          <span class="font-medium text-gray-800 dark:text-white"
            >{{ 100 - formData.prepaymentPercentage }}%</span
          >
        </div>
        <div
          v-if="formData.prepaymentRequired && formData.prepaymentPercentage < 100"
          class="flex items-center justify-between py-2"
        >
          <span class="text-gray-600 dark:text-slate-400">{{
            $t('planning.markets.paymentDeadline')
          }}</span>
          <span class="font-medium text-gray-800 dark:text-white">
            {{ getPaymentDeadlineText() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  market: { type: Object, required: true },
  saving: { type: Boolean, default: false }
})

const formData = ref({
  prepaymentRequired: false,
  prepaymentPercentage: 30,
  remainingPayment: {
    type: 'days_before_checkin', // days_after_booking, days_before_checkin, at_checkin
    days: 7
  },
  taxes: {
    vat: { enabled: false, rate: 10, included: true },
    cityTax: { enabled: false, type: 'fixed_per_night', amount: 0 },
    serviceCharge: { enabled: false, rate: 10, included: true }
  }
})

const getPaymentDeadlineText = () => {
  const type = formData.value.remainingPayment.type
  const days = formData.value.remainingPayment.days

  if (type === 'days_after_booking') {
    return t('planning.markets.paymentDueSummaryAfterBooking', { days })
  } else if (type === 'days_before_checkin') {
    return t('planning.markets.paymentDueSummaryBeforeCheckin', { days })
  } else {
    return t('planning.markets.paymentDueSummaryAtCheckin')
  }
}

// Sync with props
watch(
  () => props.market,
  newVal => {
    if (newVal?.paymentTerms) {
      formData.value.prepaymentRequired = newVal.paymentTerms.prepaymentRequired ?? false
      formData.value.prepaymentPercentage = newVal.paymentTerms.prepaymentPercentage ?? 30
      formData.value.remainingPayment = {
        type: newVal.paymentTerms.remainingPayment?.type || 'days_before_checkin',
        days: newVal.paymentTerms.remainingPayment?.days ?? 7
      }
    }

    // Taxes
    if (newVal?.taxes) {
      if (newVal.taxes.vat)
        formData.value.taxes.vat = { ...formData.value.taxes.vat, ...newVal.taxes.vat }
      if (newVal.taxes.cityTax)
        formData.value.taxes.cityTax = { ...formData.value.taxes.cityTax, ...newVal.taxes.cityTax }
      if (newVal.taxes.serviceCharge)
        formData.value.taxes.serviceCharge = {
          ...formData.value.taxes.serviceCharge,
          ...newVal.taxes.serviceCharge
        }
    }
  },
  { immediate: true, deep: true }
)

const getFormData = () => {
  return {
    paymentTerms: {
      prepaymentRequired: formData.value.prepaymentRequired,
      prepaymentPercentage: formData.value.prepaymentPercentage,
      remainingPayment: formData.value.remainingPayment
    },
    taxes: formData.value.taxes
  }
}

defineExpose({ getFormData })
</script>
