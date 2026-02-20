<template>
  <div class="space-y-8">
    <!-- Non-Refundable Option -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-red-600">money_off</span>
        {{ $t('planning.markets.nonRefundableOption') }}
      </h3>

      <div
        class="p-6 rounded-xl border-2 transition-all cursor-pointer"
        :class="
          formData.nonRefundableEnabled
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
        "
        @click="formData.nonRefundableEnabled = !formData.nonRefundableEnabled"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :class="
                formData.nonRefundableEnabled
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
              "
            >
              <span class="material-icons">block</span>
            </div>
            <div>
              <h4 class="font-semibold text-gray-800 dark:text-white">
                {{ $t('planning.markets.enableNonRefundable') }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('planning.markets.nonRefundableHint') }}
              </p>
            </div>
          </div>
          <div class="relative">
            <input v-model="formData.nonRefundableEnabled" type="checkbox" class="sr-only" />
            <div
              class="w-11 h-6 rounded-full transition-colors"
              :class="
                formData.nonRefundableEnabled ? 'bg-red-500' : 'bg-gray-300 dark:bg-slate-600'
              "
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="{ 'translate-x-5': formData.nonRefundableEnabled }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Discount Setting -->
        <div
          v-if="formData.nonRefundableEnabled"
          class="mt-6 pt-4 border-t border-red-200 dark:border-red-800"
          @click.stop
        >
          <div class="flex flex-wrap items-center gap-4">
            <span class="material-icons text-green-500">discount</span>
            <label class="text-sm text-gray-700 dark:text-slate-300">{{
              $t('planning.markets.nonRefundableDiscount')
            }}</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="formData.nonRefundableDiscount"
                type="number"
                min="0"
                max="50"
                class="form-input w-20 text-center text-lg font-bold"
              />
              <span class="text-gray-500">%</span>
            </div>
            <div class="flex gap-2">
              <button
                v-for="pct in [5, 10, 15, 20]"
                :key="pct"
                type="button"
                class="px-3 py-1 text-sm rounded-lg border transition-colors"
                :class="
                  formData.nonRefundableDiscount === pct
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50'
                "
                @click="formData.nonRefundableDiscount = pct"
              >
                {{ pct }}%
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancellation Policy -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-600">event_busy</span>
        {{ $t('planning.markets.cancellationPolicy') }}
      </h3>

      <!-- Use Hotel Policy Toggle -->
      <div
        class="p-4 rounded-xl border-2 transition-all cursor-pointer mb-4"
        :class="
          formData.cancellationPolicy.useHotelPolicy
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
        "
        @click="
          formData.cancellationPolicy.useHotelPolicy = !formData.cancellationPolicy.useHotelPolicy
        "
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="material-icons"
              :class="
                formData.cancellationPolicy.useHotelPolicy ? 'text-green-600' : 'text-gray-400'
              "
              >verified</span
            >
            <div>
              <span class="font-medium text-gray-800 dark:text-white">{{
                $t('planning.markets.useHotelPolicy')
              }}</span>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('planning.markets.useHotelPolicyHint') }}
              </p>
            </div>
          </div>
          <div class="relative">
            <input
              v-model="formData.cancellationPolicy.useHotelPolicy"
              type="checkbox"
              class="sr-only"
            />
            <div
              class="w-11 h-6 rounded-full transition-colors"
              :class="
                formData.cancellationPolicy.useHotelPolicy
                  ? 'bg-green-500'
                  : 'bg-gray-300 dark:bg-slate-600'
              "
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="{ 'translate-x-5': formData.cancellationPolicy.useHotelPolicy }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Hotel Policy Preview -->
        <div
          v-if="formData.cancellationPolicy.useHotelPolicy && hotelCancellationPolicy"
          class="mt-4 pt-3 border-t border-green-200 dark:border-green-800"
          @click.stop
        >
          <div
            class="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1"
          >
            <span class="material-icons text-sm">hotel</span>
            Otel İptal Koşulları:
          </div>
          <div class="space-y-1.5">
            <!-- Free Cancellation -->
            <div
              v-if="hotelCancellationPolicy.freeCancellation?.enabled"
              class="flex items-center gap-2 text-sm"
            >
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              <span class="text-green-700 dark:text-green-400">
                {{ hotelCancellationPolicy.freeCancellation.daysBeforeCheckIn }}+ gün önce:
                <strong>%100 iade</strong>
              </span>
            </div>
            <!-- Cancellation Rules -->
            <div
              v-for="(rule, idx) in sortedHotelRules"
              :key="idx"
              class="flex items-center gap-2 text-sm"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="
                  rule.refundPercent === 100
                    ? 'bg-green-500'
                    : rule.refundPercent > 0
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                "
              ></span>
              <span
                :class="
                  rule.refundPercent === 100
                    ? 'text-green-700 dark:text-green-400'
                    : rule.refundPercent > 0
                      ? 'text-yellow-700 dark:text-yellow-400'
                      : 'text-red-700 dark:text-red-400'
                "
              >
                {{ rule.daysBeforeCheckIn }}+ gün önce:
                <strong>%{{ rule.refundPercent }} iade</strong>
              </span>
            </div>
            <!-- No policy defined -->
            <div
              v-if="
                !hotelCancellationPolicy.freeCancellation?.enabled &&
                (!hotelCancellationPolicy.cancellationRules ||
                  hotelCancellationPolicy.cancellationRules.length === 0)
              "
              class="text-sm text-gray-500 italic"
            >
              Otel için iptal koşulu tanımlanmamış
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Policy -->
      <div
        v-if="!formData.cancellationPolicy.useHotelPolicy"
        class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
      >
        <!-- Header -->
        <div
          class="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between"
        >
          <span class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.markets.customCancellationRules')
          }}</span>
          <button
            type="button"
            class="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            @click="addRule"
          >
            <span class="material-icons text-sm">add</span>
            {{ $t('hotels.policies.addRule') }}
          </button>
        </div>

        <!-- Free Cancellation -->
        <div
          class="px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between bg-green-50/50 dark:bg-green-900/10"
        >
          <div class="flex items-center gap-3">
            <span class="material-icons text-green-600">verified</span>
            <div>
              <span class="text-sm font-medium text-gray-800 dark:text-white">{{
                $t('hotels.policies.freeCancellation')
              }}</span>
              <span
                v-if="formData.cancellationPolicy.freeCancellation.enabled"
                class="ml-2 text-xs text-green-600"
              >
                ({{ formData.cancellationPolicy.freeCancellation.daysBeforeCheckIn }}+
                {{ $t('hotels.policies.days') }})
              </span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <input
              v-if="formData.cancellationPolicy.freeCancellation.enabled"
              v-model.number="formData.cancellationPolicy.freeCancellation.daysBeforeCheckIn"
              type="number"
              min="1"
              max="30"
              class="w-16 px-2 py-1 text-sm text-center border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
            />
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="formData.cancellationPolicy.freeCancellation.enabled"
                type="checkbox"
                class="sr-only peer"
              />
              <div
                class="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"
              ></div>
            </label>
          </div>
        </div>

        <!-- Rules -->
        <div class="divide-y divide-gray-200 dark:divide-slate-600">
          <div v-if="sortedRules.length === 0" class="px-4 py-8 text-center">
            <span class="material-icons text-3xl text-gray-300 dark:text-slate-600">rule</span>
            <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
              {{ $t('hotels.policies.noRules') }}
            </p>
          </div>

          <div
            v-for="(rule, index) in sortedRules"
            :key="index"
            class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group"
          >
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

            <div class="flex items-center gap-2 min-w-[140px]">
              <input
                v-model.number="rule.daysBeforeCheckIn"
                type="number"
                min="0"
                max="365"
                class="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
              />
              <span class="text-sm text-gray-600 dark:text-slate-400">{{
                $t('hotels.policies.daysPlus')
              }}</span>
            </div>

            <span class="material-icons text-gray-400 text-sm">arrow_forward</span>

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

            <button
              type="button"
              class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1 rounded transition-all"
              @click="removeRule(index)"
            >
              <span class="material-icons text-lg">close</span>
            </button>
          </div>
        </div>

        <!-- Quick Presets -->
        <div
          class="px-4 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-slate-600"
        >
          <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
            {{ $t('hotels.policies.quickAdd') }}:
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 transition-colors"
              @click="addPreset('flexible')"
            >
              {{ $t('hotels.policies.presetFlexible') }}
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded hover:bg-yellow-200 transition-colors"
              @click="addPreset('moderate')"
            >
              {{ $t('hotels.policies.presetModerate') }}
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 transition-colors"
              @click="addPreset('strict')"
            >
              {{ $t('hotels.policies.presetStrict') }}
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-slate-300 rounded hover:bg-gray-200 transition-colors"
              @click="addPreset('nonRefundable')"
            >
              {{ $t('hotels.policies.presetNonRefundable') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancellation Guarantee Package -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-blue-600">verified_user</span>
        {{ $t('planning.markets.guaranteePackage') }}
      </h3>

      <div
        class="p-6 rounded-xl border-2 transition-all cursor-pointer"
        :class="
          formData.guaranteePackage.enabled
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
        "
        @click="formData.guaranteePackage.enabled = !formData.guaranteePackage.enabled"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :class="
                formData.guaranteePackage.enabled
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
              "
            >
              <span class="material-icons">shield</span>
            </div>
            <div>
              <h4 class="font-semibold text-gray-800 dark:text-white">
                {{ $t('planning.markets.guaranteePackageEnabled') }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('planning.markets.guaranteePackageDescription') }}
              </p>
            </div>
          </div>
          <div class="relative">
            <input v-model="formData.guaranteePackage.enabled" type="checkbox" class="sr-only" />
            <div
              class="w-11 h-6 rounded-full transition-colors"
              :class="
                formData.guaranteePackage.enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'
              "
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="{ 'translate-x-5': formData.guaranteePackage.enabled }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Rate Setting -->
        <div
          v-if="formData.guaranteePackage.enabled"
          class="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800"
          @click.stop
        >
          <div class="flex flex-wrap items-center gap-4">
            <span class="material-icons text-blue-500">percent</span>
            <label class="text-sm text-gray-700 dark:text-slate-300">{{
              $t('planning.markets.guaranteePackageRate')
            }}</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="formData.guaranteePackage.rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="form-input w-20 text-center text-lg font-bold"
              />
              <span class="text-gray-500">%</span>
            </div>
            <div class="flex gap-2">
              <button
                v-for="pct in [0.5, 1, 2, 3]"
                :key="pct"
                type="button"
                class="px-3 py-1 text-sm rounded-lg border transition-colors"
                :class="
                  formData.guaranteePackage.rate === pct
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50'
                "
                @click="formData.guaranteePackage.rate = pct"
              >
                {{ pct }}%
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  market: { type: Object, required: true },
  hotel: { type: Object, default: null },
  saving: { type: Boolean, default: false }
})

// Hotel cancellation policy
const hotelCancellationPolicy = computed(() => props.hotel?.policies || null)

// Sorted hotel cancellation rules (descending by days)
const sortedHotelRules = computed(() => {
  if (!hotelCancellationPolicy.value?.cancellationRules) return []
  return [...hotelCancellationPolicy.value.cancellationRules].sort(
    (a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn
  )
})

const formData = ref({
  nonRefundableEnabled: false,
  nonRefundableDiscount: 10,
  cancellationPolicy: {
    useHotelPolicy: true,
    freeCancellation: { enabled: false, daysBeforeCheckIn: 7 },
    rules: []
  },
  guaranteePackage: {
    enabled: true,
    rate: 1
  }
})

const sortedRules = computed(() => {
  return [...formData.value.cancellationPolicy.rules].sort(
    (a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn
  )
})

const addRule = () => {
  const lastDays =
    formData.value.cancellationPolicy.rules.length > 0
      ? Math.max(...formData.value.cancellationPolicy.rules.map(r => r.daysBeforeCheckIn)) + 7
      : 7
  formData.value.cancellationPolicy.rules.push({ daysBeforeCheckIn: lastDays, refundPercent: 50 })
}

const removeRule = index => {
  const rule = sortedRules.value[index]
  const actualIndex = formData.value.cancellationPolicy.rules.findIndex(
    r => r.daysBeforeCheckIn === rule.daysBeforeCheckIn && r.refundPercent === rule.refundPercent
  )
  if (actualIndex > -1) {
    formData.value.cancellationPolicy.rules.splice(actualIndex, 1)
  }
}

const addPreset = type => {
  switch (type) {
    case 'flexible':
      formData.value.cancellationPolicy.rules = [
        { daysBeforeCheckIn: 1, refundPercent: 100 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
      formData.value.cancellationPolicy.freeCancellation = { enabled: true, daysBeforeCheckIn: 1 }
      break
    case 'moderate':
      formData.value.cancellationPolicy.rules = [
        { daysBeforeCheckIn: 7, refundPercent: 100 },
        { daysBeforeCheckIn: 3, refundPercent: 50 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
      formData.value.cancellationPolicy.freeCancellation = { enabled: true, daysBeforeCheckIn: 7 }
      break
    case 'strict':
      formData.value.cancellationPolicy.rules = [
        { daysBeforeCheckIn: 14, refundPercent: 100 },
        { daysBeforeCheckIn: 7, refundPercent: 50 },
        { daysBeforeCheckIn: 3, refundPercent: 25 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
      formData.value.cancellationPolicy.freeCancellation = { enabled: true, daysBeforeCheckIn: 14 }
      break
    case 'nonRefundable':
      formData.value.cancellationPolicy.rules = [{ daysBeforeCheckIn: 0, refundPercent: 0 }]
      formData.value.cancellationPolicy.freeCancellation = { enabled: false, daysBeforeCheckIn: 1 }
      break
  }
}

watch(
  () => props.market,
  newVal => {
    formData.value.nonRefundableEnabled =
      newVal?.ratePolicy === 'non_refundable' || newVal?.ratePolicy === 'both'
    formData.value.nonRefundableDiscount = newVal?.nonRefundableDiscount ?? 10

    if (newVal?.cancellationPolicy) {
      formData.value.cancellationPolicy.useHotelPolicy =
        newVal.cancellationPolicy.useHotelPolicy ?? true
      formData.value.cancellationPolicy.freeCancellation = {
        enabled: newVal.cancellationPolicy.freeCancellation?.enabled ?? false,
        daysBeforeCheckIn: newVal.cancellationPolicy.freeCancellation?.daysBeforeCheckIn ?? 7
      }
      formData.value.cancellationPolicy.rules = [...(newVal.cancellationPolicy.rules || [])]

      // Guarantee package
      if (newVal.cancellationPolicy.guaranteePackage) {
        formData.value.guaranteePackage = {
          enabled: newVal.cancellationPolicy.guaranteePackage.enabled ?? true,
          rate: newVal.cancellationPolicy.guaranteePackage.rate ?? 1
        }
      }
    }
  },
  { immediate: true, deep: true }
)

const getFormData = () => {
  return {
    ratePolicy: formData.value.nonRefundableEnabled ? 'both' : 'refundable',
    nonRefundableDiscount: formData.value.nonRefundableDiscount,
    cancellationPolicy: {
      useHotelPolicy: formData.value.cancellationPolicy.useHotelPolicy,
      freeCancellation: formData.value.cancellationPolicy.freeCancellation,
      rules: formData.value.cancellationPolicy.rules,
      guaranteePackage: {
        enabled: formData.value.guaranteePackage.enabled,
        rate: formData.value.guaranteePackage.rate
      }
    }
  }
}

defineExpose({ getFormData })
</script>
