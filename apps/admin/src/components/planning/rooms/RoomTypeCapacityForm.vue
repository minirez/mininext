<template>
  <div class="space-y-6">
    <!-- Occupancy Settings -->
    <div class="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
      <h4 class="font-medium text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-indigo-600">people</span>
        {{ $t('planning.roomTypes.occupancySettings.title') }}
      </h4>

      <!-- Two Row Layout -->
      <div class="space-y-4">
        <!-- Row 1: Guest Types -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <!-- Max Adults -->
          <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div
              class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-blue-600 dark:text-blue-400 text-lg">person</span>
            </div>
            <div class="flex-1 min-w-0">
              <label class="text-xs text-gray-500 dark:text-slate-400 block">{{
                $t('planning.roomTypes.occupancySettings.maxAdults')
              }}</label>
              <div class="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  :disabled="formData.occupancy.maxAdults <= formData.occupancy.minAdults"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.maxAdults <= formData.occupancy.minAdults
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800'
                  "
                  @click="adjustCapacity('maxAdults', -1)"
                >
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="w-6 text-center font-bold text-gray-800 dark:text-white">{{
                  formData.occupancy.maxAdults
                }}</span>
                <button
                  type="button"
                  :disabled="formData.occupancy.maxAdults >= maxAllowedAdults"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.maxAdults >= maxAllowedAdults
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800'
                  "
                  @click="adjustCapacity('maxAdults', 1)"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Min Adults -->
          <div class="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
            <div
              class="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-800/50 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-cyan-600 dark:text-cyan-400 text-lg"
                >person_outline</span
              >
            </div>
            <div class="flex-1 min-w-0">
              <label class="text-xs text-gray-500 dark:text-slate-400 block">Min. Yetişkin</label>
              <div class="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  :disabled="formData.occupancy.minAdults <= 1"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.minAdults <= 1
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-800'
                  "
                  @click="adjustCapacity('minAdults', -1)"
                >
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="w-6 text-center font-bold text-gray-800 dark:text-white">{{
                  formData.occupancy.minAdults
                }}</span>
                <button
                  type="button"
                  :disabled="formData.occupancy.minAdults >= formData.occupancy.maxAdults"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.minAdults >= formData.occupancy.maxAdults
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-800'
                  "
                  @click="adjustCapacity('minAdults', 1)"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Max Children -->
          <div class="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div
              class="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-amber-600 dark:text-amber-400 text-lg"
                >child_care</span
              >
            </div>
            <div class="flex-1 min-w-0">
              <label class="text-xs text-gray-500 dark:text-slate-400 block">{{
                $t('planning.roomTypes.occupancySettings.maxChildren')
              }}</label>
              <div class="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  :disabled="formData.occupancy.maxChildren <= 0"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.maxChildren <= 0
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800'
                  "
                  @click="adjustCapacity('maxChildren', -1)"
                >
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="w-6 text-center font-bold text-gray-800 dark:text-white">{{
                  formData.occupancy.maxChildren
                }}</span>
                <button
                  type="button"
                  :disabled="formData.occupancy.maxChildren >= maxAllowedChildren"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.maxChildren >= maxAllowedChildren
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800'
                  "
                  @click="adjustCapacity('maxChildren', 1)"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Max Infants -->
          <div class="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
            <div
              class="w-9 h-9 rounded-full bg-pink-100 dark:bg-pink-800/50 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-pink-600 dark:text-pink-400 text-lg"
                >baby_changing_station</span
              >
            </div>
            <div class="flex-1 min-w-0">
              <label class="text-xs text-gray-500 dark:text-slate-400 block">{{
                $t('planning.roomTypes.occupancySettings.maxInfants')
              }}</label>
              <div class="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  :disabled="formData.occupancy.maxInfants <= 0"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.maxInfants <= 0
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-800'
                  "
                  @click="adjustCapacity('maxInfants', -1)"
                >
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="w-6 text-center font-bold text-gray-800 dark:text-white">{{
                  formData.occupancy.maxInfants
                }}</span>
                <button
                  type="button"
                  :disabled="formData.occupancy.maxInfants >= 3"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.maxInfants >= 3
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-800'
                  "
                  @click="adjustCapacity('maxInfants', 1)"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Total Capacity -->
          <div class="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div
              class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-indigo-600 dark:text-indigo-400 text-lg">hotel</span>
            </div>
            <div class="flex-1 min-w-0">
              <label class="text-xs text-gray-500 dark:text-slate-400 block">{{
                $t('planning.roomTypes.occupancySettings.totalMax')
              }}</label>
              <div class="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  :disabled="formData.occupancy.totalMaxGuests <= 1"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.totalMaxGuests <= 1
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800'
                  "
                  @click="adjustCapacity('totalMaxGuests', -1)"
                >
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="w-6 text-center font-bold text-gray-800 dark:text-white">{{
                  formData.occupancy.totalMaxGuests
                }}</span>
                <button
                  type="button"
                  :disabled="formData.occupancy.totalMaxGuests >= 12"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.totalMaxGuests >= 12
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800'
                  "
                  @click="adjustCapacity('totalMaxGuests', 1)"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: Base Occupancy + Info -->
        <div class="flex flex-col md:flex-row gap-3">
          <!-- Base Occupancy -->
          <div
            class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg md:w-auto"
          >
            <div
              class="w-9 h-9 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-green-600 dark:text-green-400 text-lg"
                >price_check</span
              >
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 block">{{
                $t('planning.roomTypes.occupancySettings.baseOccupancy')
              }}</label>
              <div class="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  :disabled="formData.occupancy.baseOccupancy <= 1"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.baseOccupancy <= 1
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800'
                  "
                  @click="adjustCapacity('baseOccupancy', -1)"
                >
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="w-6 text-center font-bold text-gray-800 dark:text-white">{{
                  formData.occupancy.baseOccupancy
                }}</span>
                <button
                  type="button"
                  :disabled="formData.occupancy.baseOccupancy >= formData.occupancy.totalMaxGuests"
                  class="w-6 h-6 rounded flex items-center justify-center transition-all"
                  :class="
                    formData.occupancy.baseOccupancy >= formData.occupancy.totalMaxGuests
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800'
                  "
                  @click="adjustCapacity('baseOccupancy', 1)"
                >
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div
            class="flex-1 flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs text-gray-500 dark:text-slate-400"
          >
            <span class="material-icons text-sm">info_outline</span>
            <span
              >{{ $t('planning.roomTypes.occupancySettings.summaryAdult') }} ·
              {{ $t('planning.roomTypes.occupancySettings.summaryInfant') }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Type Section -->
    <div class="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center flex-shrink-0"
          >
            <span class="material-icons text-indigo-600 dark:text-indigo-400 text-lg">sell</span>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300"
              >Fiyatlandırma Tipi</label
            >
            <p class="text-xs text-gray-500 dark:text-slate-400">
              Bu oda için kullanılacak fiyat modeli
            </p>
          </div>
        </div>
        <div
          class="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg p-1 ml-0 md:ml-auto"
        >
          <button
            type="button"
            class="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2"
            :class="
              formData.pricingType === 'unit'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            "
            @click="formData.pricingType = 'unit'"
          >
            <span class="material-icons text-sm">hotel</span>
            Ünite Bazlı
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2"
            :class="
              formData.pricingType === 'per_person'
                ? 'bg-indigo-500 text-white shadow-md'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            "
            @click="formData.pricingType = 'per_person'"
          >
            <span class="material-icons text-sm">groups</span>
            Kişi Bazlı (OBP)
          </button>
        </div>
      </div>

      <!-- Pricing Type Description -->
      <div
        class="mt-3 p-3 rounded-lg text-sm"
        :class="
          formData.pricingType === 'per_person'
            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        "
      >
        <span class="material-icons text-sm align-middle mr-1">info</span>
        <template v-if="formData.pricingType === 'per_person'">
          <strong>Kişi Bazlı (OBP):</strong> Her yetişkin sayısı için ayrı fiyat girilir (1 kişi:
          80€, 2 kişi: 100€...). Ekstra yetişkin ve tek kişi indirimi kullanılmaz.
        </template>
        <template v-else>
          <strong>Ünite Bazlı:</strong> Oda bazı fiyat + ekstra kişi ücreti. Standart doluluk için
          tek fiyat, fazla kişi için ek ücret.
        </template>
      </div>

      <!-- Multiplier Template (only for OBP) -->
      <div v-if="formData.pricingType === 'per_person'" class="mt-4">
        <MultiplierTemplate
          v-model="formData.multiplierTemplate"
          :occupancy="formData.occupancy"
          :child-age-groups="childAgeGroups"
          :currency="hotel?.defaultCurrency || 'EUR'"
          @update:model-value="
            val => {
              formData.useMultipliers = !!val
            }
          "
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MultiplierTemplate from './MultiplierTemplate.vue'

const props = defineProps({
  roomType: { type: Object, default: null },
  hotel: { type: Object, default: null }
})

useI18n()

// Computed child age groups from hotel
const childAgeGroups = computed(() => {
  return props.hotel?.childAgeGroups || []
})

// Form data
const formData = ref({
  occupancy: {
    maxAdults: 2,
    minAdults: 1,
    maxChildren: 2,
    maxInfants: 1,
    totalMaxGuests: 4,
    baseOccupancy: 2
  },
  pricingType: 'unit',
  useMultipliers: false,
  multiplierTemplate: null
})

// Computed constraints for capacity
const maxAllowedAdults = computed(() => {
  return formData.value.occupancy.totalMaxGuests
})

const maxAllowedChildren = computed(() => {
  return Math.max(0, formData.value.occupancy.totalMaxGuests - 1)
})

// Adjust capacity with constraints
const adjustCapacity = (field, delta) => {
  const occupancy = formData.value.occupancy
  const newValue = occupancy[field] + delta

  switch (field) {
    case 'totalMaxGuests':
      if (newValue >= 1 && newValue <= 12) {
        occupancy.totalMaxGuests = newValue
        if (occupancy.maxAdults > newValue) {
          occupancy.maxAdults = newValue
        }
        if (occupancy.maxChildren > newValue - 1) {
          occupancy.maxChildren = Math.max(0, newValue - 1)
        }
        if (occupancy.baseOccupancy > newValue) {
          occupancy.baseOccupancy = newValue
        }
      }
      break

    case 'maxAdults':
      if (newValue >= occupancy.minAdults && newValue <= occupancy.totalMaxGuests) {
        occupancy.maxAdults = newValue
      }
      break

    case 'minAdults':
      if (newValue >= 1 && newValue <= occupancy.maxAdults) {
        occupancy.minAdults = newValue
      }
      break

    case 'maxChildren': {
      const maxChildrenAllowed = occupancy.totalMaxGuests - 1
      if (newValue >= 0 && newValue <= maxChildrenAllowed) {
        occupancy.maxChildren = newValue
      }
      break
    }

    case 'maxInfants':
      if (newValue >= 0 && newValue <= 3) {
        occupancy.maxInfants = newValue
      }
      break

    case 'baseOccupancy':
      if (newValue >= 1 && newValue <= occupancy.totalMaxGuests) {
        occupancy.baseOccupancy = newValue
      }
      break
  }
}

// Watch for roomType prop changes
watch(
  () => props.roomType,
  newVal => {
    if (newVal) {
      formData.value = {
        occupancy: {
          maxAdults: newVal.occupancy?.maxAdults ?? 2,
          minAdults: newVal.occupancy?.minAdults ?? 1,
          maxChildren: newVal.occupancy?.maxChildren ?? 0,
          maxInfants: newVal.occupancy?.maxInfants ?? 0,
          totalMaxGuests: newVal.occupancy?.totalMaxGuests ?? 4,
          baseOccupancy: newVal.occupancy?.baseOccupancy ?? 2
        },
        pricingType: newVal.pricingType || 'unit',
        useMultipliers: newVal.useMultipliers || false,
        multiplierTemplate: newVal.multiplierTemplate || null
      }
    }
  },
  { immediate: true, deep: true }
)

// Get form data for parent
const getFormData = () => {
  const data = {
    occupancy: formData.value.occupancy,
    pricingType: formData.value.pricingType,
    useMultipliers: formData.value.useMultipliers,
    multiplierTemplate: formData.value.multiplierTemplate
  }

  // If pricing type is not per_person, clear multiplier data
  if (data.pricingType !== 'per_person') {
    data.useMultipliers = false
    data.multiplierTemplate = null
  }

  return data
}

defineExpose({ getFormData })
</script>
