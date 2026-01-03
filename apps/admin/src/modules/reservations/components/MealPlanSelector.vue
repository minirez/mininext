<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      @click="toggleDropdown"
      :disabled="disabled"
      class="flex items-center gap-2 px-3 py-2 w-full rounded-lg border transition-colors text-left"
      :class="buttonClasses"
    >
      <span class="material-icons text-lg" :class="selectedPlan ? 'text-indigo-500' : 'text-gray-400'">
        {{ selectedPlan ? getPlanIcon(selectedPlan) : 'restaurant' }}
      </span>
      <div class="flex-1 min-w-0">
        <div class="text-xs text-gray-500 dark:text-slate-400">{{ $t('pms.reservation.mealPlan') }}</div>
        <div class="text-sm font-medium truncate" :class="selectedPlan ? 'text-gray-900 dark:text-white' : 'text-gray-400'">
          {{ selectedPlan ? getLocalizedName(selectedPlan.name) : $t('common.select') }}
        </div>
      </div>
      <span v-if="selectedPlan" class="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
        {{ selectedPlan.code }}
      </span>
      <span class="material-icons text-gray-400 transition-transform" :class="isOpen ? 'rotate-180' : ''">expand_more</span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50 max-h-64 overflow-y-auto"
      >
        <!-- Loading -->
        <div v-if="loading" class="px-4 py-6 text-center text-gray-500">
          <span class="material-icons animate-spin">refresh</span>
        </div>

        <!-- Meal Plans List -->
        <div v-else>
          <button
            v-for="plan in mealPlans"
            :key="plan._id"
            type="button"
            @click="selectPlan(plan)"
            class="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors"
            :class="getItemClasses(plan)"
          >
            <!-- Icon -->
            <div
              class="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              :class="getIconBgClass(plan)"
            >
              <span class="material-icons text-base" :class="getIconColorClass(plan)">{{ getPlanIcon(plan) }}</span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{{ getLocalizedName(plan.name) }}</div>
              <div class="text-xs text-gray-500 dark:text-slate-400 font-mono">{{ plan.code }}</div>
            </div>

            <!-- Check -->
            <span v-if="modelValue === plan._id" class="material-icons text-indigo-500 text-lg">check</span>
          </button>

          <!-- No Meal Plans -->
          <div v-if="mealPlans.length === 0" class="px-4 py-6 text-center text-gray-500 text-sm">
            {{ $t('pms.reservation.noMealPlans') }}
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error -->
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import * as pmsRoomService from '@/services/pms/roomService'

const props = defineProps({
  modelValue: { type: String, default: '' },
  hotelId: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'select'])
const { locale } = useI18n()

const dropdownRef = ref(null)
const isOpen = ref(false)
const loading = ref(false)
const mealPlans = ref([])

const getLocalizedName = (nameObj) => {
  if (!nameObj) return ''
  if (typeof nameObj === 'string') return nameObj
  return nameObj[locale.value] || nameObj.tr || nameObj.en || Object.values(nameObj)[0] || ''
}

const selectedPlan = computed(() => {
  if (!props.modelValue) return null
  return mealPlans.value.find(p => p._id === props.modelValue)
})

const buttonClasses = computed(() => {
  if (props.disabled) return 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 cursor-not-allowed opacity-60'
  if (props.error) return 'border-red-500 bg-red-50 dark:bg-red-900/10'
  if (selectedPlan.value) return 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20'
  return 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-indigo-400'
})

const getPlanIcon = (plan) => {
  const code = (plan.code || '').toUpperCase()
  switch (code) {
    case 'RO':
    case 'OB':
      return 'bed'
    case 'BB':
      return 'free_breakfast'
    case 'HB':
      return 'brunch_dining'
    case 'FB':
      return 'restaurant'
    case 'AI':
    case 'UAI':
      return 'all_inclusive'
    default:
      return 'room_service'
  }
}

const getIconBgClass = (plan) => {
  const code = (plan.code || '').toUpperCase()
  switch (code) {
    case 'RO':
    case 'OB':
      return 'bg-gray-100 dark:bg-slate-700'
    case 'BB':
      return 'bg-amber-100 dark:bg-amber-900/30'
    case 'HB':
      return 'bg-orange-100 dark:bg-orange-900/30'
    case 'FB':
      return 'bg-green-100 dark:bg-green-900/30'
    case 'AI':
    case 'UAI':
      return 'bg-purple-100 dark:bg-purple-900/30'
    default:
      return 'bg-blue-100 dark:bg-blue-900/30'
  }
}

const getIconColorClass = (plan) => {
  const code = (plan.code || '').toUpperCase()
  switch (code) {
    case 'RO':
    case 'OB':
      return 'text-gray-500 dark:text-slate-400'
    case 'BB':
      return 'text-amber-600 dark:text-amber-400'
    case 'HB':
      return 'text-orange-600 dark:text-orange-400'
    case 'FB':
      return 'text-green-600 dark:text-green-400'
    case 'AI':
    case 'UAI':
      return 'text-purple-600 dark:text-purple-400'
    default:
      return 'text-blue-600 dark:text-blue-400'
  }
}

const getItemClasses = (plan) => {
  if (props.modelValue === plan._id) return 'bg-indigo-50 dark:bg-indigo-900/20'
  return 'hover:bg-gray-50 dark:hover:bg-slate-700'
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const selectPlan = (plan) => {
  emit('update:modelValue', plan._id)
  emit('select', plan)
  isOpen.value = false
}

const fetchMealPlans = async () => {
  if (!props.hotelId) return
  loading.value = true
  try {
    const response = await pmsRoomService.getMealPlans(props.hotelId)
    mealPlans.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch meal plans:', error)
  } finally {
    loading.value = false
  }
}

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

watch(() => props.hotelId, fetchMealPlans)
onMounted(() => {
  fetchMealPlans()
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

defineExpose({ refresh: fetchMealPlans })
</script>
