<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ $t('planning.markets.title') }}</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.markets.description') }}</p>
      </div>
      <button @click="addMarket" class="btn-primary flex items-center gap-2">
        <span class="material-icons text-sm">add</span>
        {{ $t('planning.markets.add') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Markets List -->
    <div v-else-if="markets.length > 0" class="grid gap-4">
      <div
        v-for="market in markets"
        :key="market._id"
        class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
        :class="{ 'ring-2 ring-indigo-500': market.isDefault }"
        @click="editMarket(market)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <span class="material-icons text-indigo-600 dark:text-indigo-400">public</span>
            </div>
            <div>
              <div class="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                {{ getMarketName(market) }}
                <span v-if="market.isDefault" class="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded">
                  {{ $t('planning.markets.default') }}
                </span>
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                <span class="font-mono">{{ market.code }}</span>
                <span class="font-bold text-green-600 dark:text-green-400">{{ market.currency }}</span>
                <span v-if="market.countries?.length > 0">
                  {{ market.countries.length }} {{ $t('planning.markets.countries') }}
                </span>
                <span v-else class="text-amber-600 dark:text-amber-400 font-medium">
                  {{ $t('planning.markets.allOtherCountries') }}
                </span>
              </div>
              <!-- Extra Info Row -->
              <div class="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-3 mt-1 flex-wrap">
                <!-- Prepayment -->
                <span v-if="market.paymentTerms?.prepaymentRequired" class="flex items-center gap-1">
                  <span class="material-icons text-xs">payments</span>
                  %{{ market.paymentTerms.prepaymentPercentage || 30 }} {{ $t('planning.markets.prepaymentShort') }}
                </span>
                <!-- Child Age -->
                <span v-if="market.childAgeRange?.max" class="flex items-center gap-1">
                  <span class="material-icons text-xs">child_care</span>
                  {{ $t('planning.markets.childShort') }}: {{ market.childAgeRange.min || 0 }}-{{ market.childAgeRange.max }}
                </span>
                <!-- Infant Age -->
                <span v-if="market.infantAgeRange?.max" class="flex items-center gap-1">
                  <span class="material-icons text-xs">baby_changing_station</span>
                  {{ $t('planning.markets.infantShort') }}: {{ market.infantAgeRange.min || 0 }}-{{ market.infantAgeRange.max }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Sales Channels Badges -->
            <div class="flex gap-1 mr-4">
              <span
                v-if="market.salesChannels?.b2c"
                class="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                B2C
              </span>
              <span
                v-if="market.salesChannels?.b2b"
                class="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                B2B
              </span>
            </div>
            <button
              v-if="!market.isDefault"
              @click.stop="setDefaultMarket(market)"
              class="p-2 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              :title="$t('planning.markets.setAsDefault')"
            >
              <span class="material-icons">star_outline</span>
            </button>
            <button
              @click.stop="editMarket(market)"
              class="p-2 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              <span class="material-icons">edit</span>
            </button>
            <button
              @click.stop="confirmDelete(market)"
              class="p-2 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            >
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
        <!-- Countries Preview -->
        <div class="mt-3 flex flex-wrap gap-1">
          <template v-if="market.countries?.length > 0">
            <span
              v-for="country in market.countries.slice(0, 15)"
              :key="country"
              class="px-2 py-0.5 text-xs bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 rounded flex items-center gap-1"
              :title="getCountryName(country, locale)"
            >
              <img :src="`/flags/${country.toLowerCase()}.svg`" :alt="country" class="w-4 h-3 object-contain" />
              <span>{{ country }}</span>
            </span>
            <span v-if="market.countries.length > 15" class="px-2 py-0.5 text-xs text-gray-500 dark:text-slate-400">
              +{{ market.countries.length - 15 }}
            </span>
          </template>
          <template v-else>
            <span class="px-3 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full flex items-center gap-1">
              <span class="material-icons text-xs">language</span>
              {{ $t('planning.markets.catchAllHint') }}
            </span>
          </template>
        </div>
        <!-- Active Products Info -->
        <div v-if="market.activeRoomTypes?.length || market.activeMealPlans?.length" class="mt-3 flex flex-wrap gap-2">
          <!-- Active Room Types -->
          <div v-if="market.activeRoomTypes?.length" class="flex items-center gap-1">
            <span class="material-icons text-xs text-blue-500">hotel</span>
            <div class="flex gap-1">
              <span
                v-for="rtId in market.activeRoomTypes"
                :key="rtId"
                class="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
              >
                {{ getRoomTypeCode(rtId) }}
              </span>
            </div>
          </div>
          <!-- Active Meal Plans -->
          <div v-if="market.activeMealPlans?.length" class="flex items-center gap-1">
            <span class="material-icons text-xs text-green-500">restaurant</span>
            <div class="flex gap-1">
              <span
                v-for="mpId in market.activeMealPlans"
                :key="mpId"
                class="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"
              >
                {{ getMealPlanCode(mpId) }}
              </span>
            </div>
          </div>
        </div>
        <!-- Commission Info -->
        <div v-if="market.salesChannels?.b2b && market.agencyCommission" class="mt-2 text-xs text-gray-500 dark:text-slate-400">
          {{ $t('planning.markets.agencyCommission') }}: {{ market.agencyCommission }}%
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">public</span>
      <p class="mt-3 text-gray-500 dark:text-slate-400">{{ $t('planning.markets.empty') }}</p>
      <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">{{ $t('planning.markets.emptyHint') }}</p>
      <button @click="addMarket" class="btn-primary mt-4">
        <span class="material-icons text-sm mr-1">add</span>
        {{ $t('planning.markets.add') }}
      </button>
    </div>

    <!-- Delete Confirmation -->
    <Modal v-model="showDeleteModal" :title="$t('common.delete')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">{{ $t('common.confirm') }}?</p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">{{ $t('common.no') }}</button>
        <button @click="executeDelete" class="btn-danger" :disabled="deleting">
          {{ deleting ? $t('common.loading') : $t('common.yes') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import planningService from '@/services/planningService'
import { getCountryName } from '@/data/countries'

const props = defineProps({
  hotel: { type: Object, required: true }
})

const router = useRouter()
const { t, locale } = useI18n()
const toast = useToast()

const markets = ref([])
const roomTypes = ref([])
const mealPlans = ref([])
const loading = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const getMarketName = (market) => {
  return market.name?.[locale.value] || market.name?.tr || market.name?.en || market.code
}

const getRoomTypeCode = (id) => {
  const rtId = typeof id === 'object' ? id._id : id
  const rt = roomTypes.value.find(r => r._id === rtId)
  return rt?.code || '?'
}

const getMealPlanCode = (id) => {
  const mpId = typeof id === 'object' ? id._id : id
  const mp = mealPlans.value.find(m => m._id === mpId)
  return mp?.code || '?'
}

const fetchMarkets = async () => {
  loading.value = true
  try {
    const response = await planningService.getMarkets(props.hotel._id)
    if (response.success) {
      markets.value = response.data
    }
  } catch (error) {
    toast.error(t('common.fetchError'))
  } finally {
    loading.value = false
  }
}

const fetchRoomTypesAndMealPlans = async () => {
  try {
    const [rtRes, mpRes] = await Promise.all([
      planningService.getRoomTypes(props.hotel._id),
      planningService.getMealPlans(props.hotel._id)
    ])
    if (rtRes.success) roomTypes.value = rtRes.data || []
    if (mpRes.success) mealPlans.value = mpRes.data || []
  } catch (error) {
    console.error('Failed to fetch room types/meal plans:', error)
  }
}

const addMarket = () => {
  router.push({
    name: 'market-new',
    params: { hotelId: props.hotel._id }
  })
}

const editMarket = (market) => {
  router.push({
    name: 'market-detail',
    params: { hotelId: props.hotel._id, id: market._id }
  })
}

const setDefaultMarket = async (market) => {
  try {
    await planningService.setDefaultMarket(props.hotel._id, market._id)
    toast.success(t('planning.markets.defaultSet'))
    fetchMarkets()
  } catch (error) {
    toast.error(t('common.operationFailed'))
  }
}

const confirmDelete = (market) => {
  deleteTarget.value = market
  showDeleteModal.value = true
}

const executeDelete = async () => {
  deleting.value = true
  try {
    await planningService.deleteMarket(props.hotel._id, deleteTarget.value._id)
    toast.success(t('planning.markets.deleted'))
    showDeleteModal.value = false
    fetchMarkets()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

watch(() => props.hotel?._id, (newId) => {
  if (newId) {
    fetchMarkets()
    fetchRoomTypesAndMealPlans()
  }
}, { immediate: true })
</script>
