<template>
  <div class="space-y-6">
    <!-- Add Charge Form -->
    <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
      <h3
        class="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2"
      >
        <span class="material-icons text-sm">add_circle</span>
        {{ t('stayCard.charges.addNew') }}
      </h3>

      <div class="grid grid-cols-4 gap-3">
        <!-- Category -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{{
            t('stayCard.charges.category')
          }}</label>
          <select
            v-model="form.category"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="cat in chargeCategories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>

        <!-- Amount -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{{
            t('stayCard.charges.amount')
          }}</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="0.00"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{{
            t('stayCard.charges.description')
          }}</label>
          <input
            v-model="form.description"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
            :placeholder="t('common.optional')"
          />
        </div>

        <!-- Submit -->
        <div class="flex items-end">
          <button
            :disabled="!form.amount || form.amount <= 0 || saving"
            class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            @click="handleAddCharge"
          >
            <span v-if="saving" class="animate-spin material-icons text-sm">sync</span>
            <span class="material-icons text-sm" v-else>add</span>
            {{ t('common.add') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Charges List -->
    <div>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-sm text-gray-500">receipt_long</span>
        {{ t('stayCard.charges.title') }}
      </h3>

      <!-- Room Rate -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 mb-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-blue-600 dark:text-blue-400 text-sm">hotel</span>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm">
                {{ t('stayCard.roomRate') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ nights }} {{ t('stayCard.nightSuffix') }} × {{ formatCurrency(stay?.roomRate) }}
              </p>
            </div>
          </div>
          <span class="font-semibold text-gray-900 dark:text-white">{{
            formatCurrency((stay?.roomRate || 0) * nights)
          }}</span>
        </div>
      </div>

      <!-- Extra Charges -->
      <div v-if="stay?.extras?.length" class="space-y-2">
        <div
          v-for="(extra, index) in stay.extras"
          :key="index"
          class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                :class="getCategoryBgClass(extra.category)"
              >
                <span class="material-icons text-sm" :class="getCategoryTextClass(extra.category)">
                  {{ getCategoryIcon(extra.category) }}
                </span>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white text-sm">
                  {{ getCategoryLabel(extra.category) }}
                  <span v-if="extra.quantity > 1" class="text-gray-500">x{{ extra.quantity }}</span>
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ formatDate(extra.date) }}
                  <span v-if="extra.description"> - {{ extra.description }}</span>
                </p>
              </div>
            </div>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(extra.amount * (extra.quantity || 1)) }}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
        <span class="material-icons text-4xl mb-2 opacity-50">receipt_long</span>
        <p class="text-sm">{{ t('stayCard.charges.noCharges') }}</p>
      </div>

      <!-- Total -->
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <div class="flex justify-between items-center">
          <span class="font-semibold text-gray-900 dark:text-white">{{ t('stayCard.total') }}</span>
          <span class="text-xl font-bold text-gray-900 dark:text-white">{{
            formatCurrency(stay?.totalAmount)
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHARGE_CATEGORIES } from '../composables/useStayCard'

const { t, locale } = useI18n()

const props = defineProps({
  stay: Object,
  saving: Boolean
})

const emit = defineEmits(['add-charge'])

const form = ref({
  category: 'minibar',
  amount: null,
  description: ''
})

const nights = computed(() => {
  if (!props.stay?.checkInDate || !props.stay?.checkOutDate) return 0
  const checkIn = new Date(props.stay.checkInDate)
  const checkOut = new Date(props.stay.checkOutDate)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

// Dynamic charge categories with i18n labels
const chargeCategories = computed(() =>
  CHARGE_CATEGORIES.map(cat => ({
    ...cat,
    label: t(`stayCard.charges.categories.${cat.value}`)
  }))
)

const handleAddCharge = () => {
  if (form.value.amount > 0) {
    emit('add-charge', form.value.category, form.value.amount, form.value.description)
    form.value.amount = null
    form.value.description = ''
  }
}

const getCategoryLabel = category => {
  return t(`stayCard.charges.categories.${category}`)
}

const getCategoryIcon = category => {
  return CHARGE_CATEGORIES.find(c => c.value === category)?.icon || 'receipt'
}

const getCategoryBgClass = category => {
  const colors = {
    minibar: 'bg-purple-100 dark:bg-purple-900/30',
    room_service: 'bg-orange-100 dark:bg-orange-900/30',
    restaurant: 'bg-red-100 dark:bg-red-900/30',
    bar: 'bg-pink-100 dark:bg-pink-900/30',
    spa: 'bg-teal-100 dark:bg-teal-900/30',
    laundry: 'bg-blue-100 dark:bg-blue-900/30',
    parking: 'bg-gray-100 dark:bg-gray-700',
    phone: 'bg-green-100 dark:bg-green-900/30',
    damage: 'bg-red-100 dark:bg-red-900/30',
    other: 'bg-gray-100 dark:bg-gray-700'
  }
  return colors[category] || colors.other
}

const getCategoryTextClass = category => {
  const colors = {
    minibar: 'text-purple-600 dark:text-purple-400',
    room_service: 'text-orange-600 dark:text-orange-400',
    restaurant: 'text-red-600 dark:text-red-400',
    bar: 'text-pink-600 dark:text-pink-400',
    spa: 'text-teal-600 dark:text-teal-400',
    laundry: 'text-blue-600 dark:text-blue-400',
    parking: 'text-gray-600 dark:text-gray-400',
    phone: 'text-green-600 dark:text-green-400',
    damage: 'text-red-600 dark:text-red-400',
    other: 'text-gray-600 dark:text-gray-400'
  }
  return colors[category] || colors.other
}

const localeMap = { tr: 'tr-TR', en: 'en-US' }

const formatCurrency = amount => {
  return new Intl.NumberFormat(localeMap[locale.value] || 'tr-TR', {
    style: 'currency',
    currency: props.stay?.currency || 'TRY'
  }).format(amount || 0)
}

const formatDate = dateStr => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
