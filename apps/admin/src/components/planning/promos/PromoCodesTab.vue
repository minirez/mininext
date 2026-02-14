<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('planning.promoCodes.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('planning.promoCodes.description') }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Status Filter -->
        <div class="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-400 shadow-sm font-medium'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            "
            @click="statusFilter = 'active'"
          >
            {{ $t('planning.promoCodes.filterActive') }}
            <span class="ml-1 text-xs">({{ activeCount }})</span>
          </button>
          <button
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="
              statusFilter === 'inactive'
                ? 'bg-white dark:bg-slate-600 text-gray-600 dark:text-gray-400 shadow-sm font-medium'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            "
            @click="statusFilter = 'inactive'"
          >
            {{ $t('planning.promoCodes.filterInactive') }}
            <span class="ml-1 text-xs">({{ inactiveCount }})</span>
          </button>
          <button
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm font-medium'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            "
            @click="statusFilter = 'all'"
          >
            {{ $t('common.all') }}
          </button>
        </div>
        <button class="btn-primary flex items-center gap-2" @click="openNewForm">
          <span class="material-icons text-sm">add</span>
          {{ $t('planning.promoCodes.add') }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Promo Codes List -->
    <div v-else-if="filteredCodes.length > 0" class="grid gap-4">
      <div
        v-for="promo in filteredCodes"
        :key="promo._id"
        class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4"
        :class="{ 'opacity-60': promo.status !== 'active' || isExpired(promo) }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-violet-500">
              <span class="material-icons text-white">confirmation_number</span>
            </div>
            <div>
              <div class="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                {{ getPromoName(promo) }}
                <span
                  class="px-2 py-0.5 text-xs rounded"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                      promo.status === 'active' && !isExpired(promo),
                    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400':
                      promo.status !== 'active' || isExpired(promo)
                  }"
                >
                  {{
                    promo.status === 'active' && !isExpired(promo)
                      ? $t('planning.promoCodes.active')
                      : $t('planning.promoCodes.inactive')
                  }}
                </span>
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-3">
                <!-- Copyable Code -->
                <button
                  class="font-mono bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded text-xs hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors flex items-center gap-1"
                  @click.stop="copyCode(promo.code)"
                  :title="promo.code"
                >
                  {{ promo.code }}
                  <span class="material-icons text-[10px]">content_copy</span>
                </button>
                <span class="font-bold text-green-600 dark:text-green-400">
                  {{ formatDiscount(promo.discount) }}
                </span>
                <span
                  v-if="promo.conditions?.minNights > 1"
                  class="text-orange-600 dark:text-orange-400"
                >
                  {{ promo.conditions.minNights }}+ {{ $t('planning.promoCodes.nightsShort') }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="p-2 text-gray-500 hover:text-indigo-600" @click="editPromo(promo)">
              <span class="material-icons">edit</span>
            </button>
            <button class="p-2 text-gray-500 hover:text-red-600" @click="confirmDelete(promo)">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
        <!-- Badges -->
        <div class="mt-2 flex flex-wrap gap-1.5">
          <!-- Markets -->
          <span
            v-for="marketId in getMarketIds(promo)"
            :key="marketId"
            class="px-1.5 py-0.5 text-[10px] rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
          >
            <span class="material-icons text-[10px] align-middle">public</span>
            {{ getMarketName(marketId) }}
          </span>
          <span
            v-if="getMarketIds(promo).length === 0"
            class="px-1.5 py-0.5 text-[10px] rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
          >
            <span class="material-icons text-[10px] align-middle">public</span>
            {{ $t('common.allMarkets') }}
          </span>
          <span
            v-if="promo.visibility?.b2c"
            class="px-1.5 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          >
            <span class="material-icons text-[10px] align-middle">person</span> B2C
          </span>
          <span
            v-if="promo.visibility?.b2b"
            class="px-1.5 py-0.5 text-[10px] rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          >
            <span class="material-icons text-[10px] align-middle">business</span> B2B
          </span>
          <span
            v-if="promo.combinable"
            class="px-1.5 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          >
            <span class="material-icons text-[10px] align-middle">link</span>
            {{ $t('planning.campaigns.combinableShort') }}
          </span>
        </div>
        <!-- Date Info -->
        <div class="mt-2 text-xs text-gray-500 dark:text-slate-400 flex gap-4">
          <span class="flex items-center gap-1" :title="$t('planning.promoCodes.bookingWindow')">
            <span class="material-icons text-xs">event_available</span>
            {{ formatDate(promo.bookingWindow?.startDate) }} -
            {{ formatDate(promo.bookingWindow?.endDate) }}
          </span>
          <span class="flex items-center gap-1" :title="$t('planning.promoCodes.stayWindow')">
            <span class="material-icons text-xs">date_range</span>
            {{ formatDate(promo.stayWindow?.startDate) }} -
            {{ formatDate(promo.stayWindow?.endDate) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <span class="material-icons text-5xl text-gray-300 dark:text-slate-600"
        >confirmation_number</span
      >
      <p class="mt-3 text-gray-500 dark:text-slate-400">
        {{
          promoCodes.length > 0
            ? $t('planning.promoCodes.noMatchingCodes')
            : $t('planning.promoCodes.empty')
        }}
      </p>
    </div>

    <!-- Promo Code Form Modal -->
    <Modal
      v-model="showForm"
      :title="editingPromo ? $t('planning.promoCodes.edit') : $t('planning.promoCodes.add')"
      size="xl"
      :close-on-overlay="false"
    >
      <PromoCodeForm
        :hotel="hotel"
        :promo="editingPromo"
        :markets="markets"
        @saved="handleSaved"
        @cancel="showForm = false"
      />
    </Modal>

    <!-- Delete Confirmation -->
    <Modal v-model="showDeleteModal" :title="$t('common.delete')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">{{ $t('common.confirm') }}?</p>
      <template #footer>
        <button class="btn-secondary" @click="showDeleteModal = false">
          {{ $t('common.no') }}
        </button>
        <button class="btn-danger" :disabled="deleting" @click="executeDelete">
          {{ deleting ? $t('common.loading') : $t('common.yes') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PromoCodeForm from './PromoCodeForm.vue'
import planningService from '@/services/planningService'

const props = defineProps({
  hotel: { type: Object, required: true }
})

const { t, locale } = useI18n()
const toast = useToast()

const promoCodes = ref([])
const markets = ref([])
const loading = ref(false)
const showForm = ref(false)
const editingPromo = ref(null)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)
const statusFilter = ref('active')

const isExpired = promo => {
  if (!promo.bookingWindow?.endDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(promo.bookingWindow.endDate)
  endDate.setHours(0, 0, 0, 0)
  return endDate < today
}

const filteredCodes = computed(() => {
  if (statusFilter.value === 'all') return promoCodes.value
  if (statusFilter.value === 'active') {
    return promoCodes.value.filter(c => c.status === 'active' && !isExpired(c))
  }
  return promoCodes.value.filter(c => c.status !== 'active' || isExpired(c))
})

const activeCount = computed(() => {
  return promoCodes.value.filter(c => c.status === 'active' && !isExpired(c)).length
})

const inactiveCount = computed(() => {
  return promoCodes.value.filter(c => c.status !== 'active' || isExpired(c)).length
})

const getMarketIds = promo => {
  const ids = promo.conditions?.applicableMarkets || []
  return ids.map(m => (typeof m === 'object' ? m._id : m))
}

const getMarketName = marketId => {
  const market = markets.value.find(m => m._id === marketId)
  return market?.code || ''
}

const getPromoName = promo => {
  return promo.name?.[locale.value] || promo.name?.tr || promo.name?.en || promo.code
}

const formatDiscount = discount => {
  if (!discount) return ''
  if (discount.type === 'percentage') return `-${discount.value}%`
  if (discount.type === 'fixed') return `-${discount.value}`
  if (discount.type === 'free_nights')
    return `${discount.freeNights?.stayNights}=${discount.freeNights?.freeNights} Free`
  return ''
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const copyCode = async code => {
  try {
    await navigator.clipboard.writeText(code)
    toast.success(t('planning.promoCodes.copied'))
  } catch {
    // Fallback for older browsers
    const input = document.createElement('input')
    input.value = code
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    toast.success(t('planning.promoCodes.copied'))
  }
}

const fetchMarkets = async () => {
  try {
    const response = await planningService.getMarkets(props.hotel._id)
    if (response.success) markets.value = response.data
  } catch {
    // silent
  }
}

const fetchPromoCodes = async () => {
  loading.value = true
  try {
    const response = await planningService.getCampaigns(props.hotel._id, { type: 'promo_code' })
    if (response.success) {
      promoCodes.value = response.data
    }
  } catch {
    toast.error(t('common.fetchError'))
  } finally {
    loading.value = false
  }
}

const openNewForm = () => {
  editingPromo.value = null
  showForm.value = true
}

const editPromo = promo => {
  editingPromo.value = promo
  showForm.value = true
}

const handleSaved = () => {
  showForm.value = false
  editingPromo.value = null
  fetchPromoCodes()
}

const confirmDelete = promo => {
  deleteTarget.value = promo
  showDeleteModal.value = true
}

const executeDelete = async () => {
  deleting.value = true
  try {
    await planningService.deleteCampaign(props.hotel._id, deleteTarget.value._id)
    toast.success(t('planning.promoCodes.deleted'))
    showDeleteModal.value = false
    fetchPromoCodes()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

watch(
  () => props.hotel?._id,
  newId => {
    if (newId) {
      fetchPromoCodes()
      fetchMarkets()
    }
  },
  { immediate: true }
)
</script>
