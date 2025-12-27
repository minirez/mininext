<template>
  <div>
    <!-- Header with back button -->
    <div class="mb-6">
      <button @click="goBack" class="inline-flex items-center text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400">
        <span class="material-icons mr-1">arrow_back</span>
        {{ $t('common.back') }}
      </button>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-6 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
          {{ isNew ? $t('planning.markets.add') : $t('planning.markets.edit') }}
        </h2>
        <p class="text-gray-600 dark:text-slate-400 mt-1">
          {{ isNew ? $t('planning.markets.description') : getMarketName(market) }}
        </p>
      </div>

      <!-- Tabs -->
      <FormTabs
        v-model="activeTab"
        :tabs="tabs"
        :errors="{}"
        :tab-fields="{}"
      />

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
      </div>

      <!-- Tab Content -->
      <form v-else @submit.prevent="handleSave" class="p-6">
        <!-- Save Button (Top) -->
        <div class="flex justify-end mb-6">
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="saving" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ $t('common.loading') }}
            </span>
            <span v-else>{{ $t('common.save') }}</span>
          </button>
        </div>

        <!-- Basic Info Tab -->
        <div v-show="activeTab === 'basic'">
          <MarketBasicForm
            ref="basicFormRef"
            :market="market"
            :hotel="hotel"
            :saving="saving"
            :is-new="isNew"
            :room-types="roomTypes"
            :meal-plans="mealPlans"
          />
        </div>

        <!-- Countries Tab -->
        <div v-show="activeTab === 'countries'">
          <MarketCountriesForm
            ref="countriesFormRef"
            :market="market"
            :assigned-countries="assignedCountries"
            :saving="saving"
          />
        </div>

        <!-- Sales Channels Tab -->
        <div v-show="activeTab === 'channels'">
          <MarketChannelsForm
            ref="channelsFormRef"
            :market="market"
            :saving="saving"
          />
        </div>

        <!-- Payment Terms Tab -->
        <div v-show="activeTab === 'payment'">
          <MarketPaymentForm
            ref="paymentFormRef"
            :market="market"
            :saving="saving"
          />
        </div>

        <!-- Policies Tab -->
        <div v-show="activeTab === 'policies'">
          <MarketPoliciesForm
            ref="policiesFormRef"
            :market="market"
            :saving="saving"
          />
        </div>

        <!-- Save Button (Bottom) -->
        <div class="pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-end mt-6">
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="saving" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ $t('common.loading') }}
            </span>
            <span v-else>{{ $t('common.save') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import planningService from '@/services/planningService'
import FormTabs from '@/components/common/FormTabs.vue'
import MarketBasicForm from '@/components/planning/markets/MarketBasicForm.vue'
import MarketCountriesForm from '@/components/planning/markets/MarketCountriesForm.vue'
import MarketChannelsForm from '@/components/planning/markets/MarketChannelsForm.vue'
import MarketPaymentForm from '@/components/planning/markets/MarketPaymentForm.vue'
import MarketPoliciesForm from '@/components/planning/markets/MarketPoliciesForm.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t, locale } = useI18n()

// All supported languages for multilingual fields
const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

// Helper to create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

function getEmptyMarket() {
  return {
    code: '',
    name: createMultiLangObject(),
    currency: 'EUR',
    countries: [],
    salesChannels: {
      b2c: true,
      b2b: true
    },
    agencyCommission: 10,
    markup: {
      b2c: 0,
      b2b: 0
    },
    paymentTerms: {
      prepaymentRequired: false,
      prepaymentPercentage: 30,
      remainingPayment: {
        type: 'days_before_checkin',
        days: 7
      }
    },
    isDefault: false,
    status: 'active',
    displayOrder: 0
  }
}

const market = ref(getEmptyMarket())
const hotel = ref(null)
const assignedCountries = ref({})
const roomTypes = ref([])
const mealPlans = ref([])
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('basic')

// Form refs
const basicFormRef = ref(null)
const countriesFormRef = ref(null)
const channelsFormRef = ref(null)
const paymentFormRef = ref(null)
const policiesFormRef = ref(null)

// Get IDs from route
const hotelId = computed(() => route.params.hotelId)
const marketId = computed(() => route.params.id)
const isNew = computed(() => !marketId.value || route.name === 'market-new')

const tabs = computed(() => [
  { id: 'basic', label: t('planning.markets.tabs.basic'), icon: 'info' },
  { id: 'countries', label: t('planning.markets.tabs.countries'), icon: 'public' },
  { id: 'channels', label: t('planning.markets.tabs.channels'), icon: 'storefront' },
  { id: 'payment', label: t('planning.markets.tabs.payment'), icon: 'payments' },
  { id: 'policies', label: t('planning.markets.tabs.policies'), icon: 'gavel' }
])

const getMarketName = (market) => {
  return market?.name?.[locale.value] || market?.name?.tr || market?.name?.en || market?.code || ''
}

const goBack = () => {
  router.push({ name: 'planning', query: { hotelId: hotelId.value, tab: 'markets' } })
}

const fetchMarket = async () => {
  if (isNew.value) return

  loading.value = true
  try {
    const response = await planningService.getMarket(hotelId.value, marketId.value)
    if (response.success) {
      const data = response.data
      const emptyMarket = getEmptyMarket()

      market.value = {
        ...emptyMarket,
        ...data,
        name: { ...emptyMarket.name, ...data.name },
        salesChannels: { ...emptyMarket.salesChannels, ...data.salesChannels },
        markup: { ...emptyMarket.markup, ...data.markup },
        paymentTerms: { ...emptyMarket.paymentTerms, ...data.paymentTerms },
        countries: data.countries || []
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.fetchError'))
    goBack()
  } finally {
    loading.value = false
  }
}

const fetchHotel = async () => {
  try {
    const response = await planningService.getHotel(hotelId.value)
    if (response.success) {
      hotel.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch hotel:', error)
  }
}

const fetchAssignedCountries = async () => {
  try {
    const excludeId = isNew.value ? null : marketId.value
    const response = await planningService.getAssignedCountries(hotelId.value, excludeId)
    if (response.success) {
      assignedCountries.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch assigned countries:', error)
  }
}

const fetchRoomTypes = async () => {
  try {
    const response = await planningService.getRoomTypes(hotelId.value)
    if (response.success) {
      roomTypes.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch room types:', error)
  }
}

const fetchMealPlans = async () => {
  try {
    const response = await planningService.getMealPlans(hotelId.value)
    if (response.success) {
      mealPlans.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch meal plans:', error)
  }
}

const handleSave = async () => {
  // Collect data from all form components
  const basicData = basicFormRef.value?.getFormData?.() || {}
  const countriesData = countriesFormRef.value?.getFormData?.() || {}
  const channelsData = channelsFormRef.value?.getFormData?.() || {}
  const paymentData = paymentFormRef.value?.getFormData?.() || {}
  const policiesData = policiesFormRef.value?.getFormData?.() || {}

  const formData = {
    ...basicData,
    ...countriesData,
    ...channelsData,
    ...paymentData,
    ...policiesData
  }

  // Validate
  if (!formData.code || !formData.name?.[locale.value]) {
    toast.error(t('validation.required'))
    activeTab.value = 'basic'
    return
  }

  saving.value = true
  try {
    let response
    if (isNew.value) {
      response = await planningService.createMarket(hotelId.value, formData)
      if (response.success) {
        toast.success(t('planning.markets.created'))
        // Navigate to edit mode
        router.replace({
          name: 'market-detail',
          params: { hotelId: hotelId.value, id: response.data._id }
        })
        market.value = { ...market.value, ...response.data }
      }
    } else {
      response = await planningService.updateMarket(hotelId.value, marketId.value, formData)
      if (response.success) {
        market.value = { ...market.value, ...response.data }
        toast.success(t('planning.markets.updated'))
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchMarket()
    fetchAssignedCountries()
  } else {
    market.value = getEmptyMarket()
    activeTab.value = 'basic'
    fetchAssignedCountries()
  }
}, { immediate: true })

onMounted(() => {
  fetchHotel()
  fetchAssignedCountries()
  fetchRoomTypes()
  fetchMealPlans()
  if (!isNew.value) {
    fetchMarket()
  }
})
</script>
