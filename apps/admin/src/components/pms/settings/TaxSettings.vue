<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ $t('settings.taxes.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('settings.taxes.description') }}
      </p>
    </div>

    <!-- General Tax Settings -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('settings.taxes.generalSettings') }}
      </h4>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ $t('settings.taxes.pricesIncludeTax') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.taxes.pricesIncludeTaxDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.pricesIncludeTax"
              type="checkbox"
              class="sr-only peer"
              @change="emitChange"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>

        <div class="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-600">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('settings.taxes.accommodationVat') }}
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="localSettings.accommodationTaxRate"
                type="number"
                min="0"
                max="100"
                class="w-24 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                @input="emitChange"
              />
              <span class="text-gray-500 dark:text-slate-400">%</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ $t('settings.taxes.foodBeverageVat') }}
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="localSettings.foodBeverageTaxRate"
                type="number"
                min="0"
                max="100"
                class="w-24 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                @input="emitChange"
              />
              <span class="text-gray-500 dark:text-slate-400">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tax Types -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">
          {{ $t('settings.taxes.taxTypes') }}
        </h4>
        <button
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          @click="addTaxType"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('settings.taxes.newTax') }}
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="(tax, index) in localSettings.taxTypes"
          :key="tax._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-600"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 grid md:grid-cols-4 gap-3">
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('settings.taxes.taxName')
                }}</label>
                <input
                  v-model="tax.name"
                  type="text"
                  placeholder="KDV"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  @input="emitChange"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('settings.taxes.code')
                }}</label>
                <input
                  v-model="tax.code"
                  type="text"
                  placeholder="KDV"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white uppercase"
                  @input="emitChange"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('settings.taxes.ratePercent')
                }}</label>
                <input
                  v-model.number="tax.rate"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  @input="emitChange"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('settings.taxes.applyTo')
                }}</label>
                <select
                  v-model="tax.applyTo"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  @change="emitChange"
                >
                  <option value="all">{{ $t('settings.taxes.allTransactions') }}</option>
                  <option value="accommodation">{{ $t('settings.taxes.accommodation') }}</option>
                  <option value="food_beverage">{{ $t('settings.taxes.foodBeverage') }}</option>
                  <option value="services">{{ $t('settings.taxes.services') }}</option>
                </select>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="tax.isActive"
                  type="checkbox"
                  class="sr-only peer"
                  @change="emitChange"
                />
                <div
                  class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
                ></div>
              </label>
              <button
                class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                @click="removeTaxType(index)"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="!localSettings.taxTypes?.length"
          class="text-center py-4 text-gray-500 dark:text-slate-400"
        >
          {{ $t('settings.taxes.noTaxTypes') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const localSettings = ref({
  pricesIncludeTax: true,
  accommodationTaxRate: 10,
  foodBeverageTaxRate: 10,
  taxTypes: [],
  ...props.modelValue
})

watch(
  () => props.modelValue,
  newVal => {
    localSettings.value = { ...localSettings.value, ...newVal }
  },
  { deep: true }
)

const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}

const addTaxType = () => {
  if (!localSettings.value.taxTypes) {
    localSettings.value.taxTypes = []
  }
  localSettings.value.taxTypes.push({
    name: '',
    code: '',
    rate: 0,
    isActive: true,
    applyTo: 'all'
  })
  emitChange()
}

const removeTaxType = index => {
  localSettings.value.taxTypes.splice(index, 1)
  emitChange()
}
</script>
