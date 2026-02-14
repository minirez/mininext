<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('planning.campaigns.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('planning.campaigns.description') }}
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
            {{ $t('planning.campaigns.filterActive') }}
            <span class="ml-1 text-xs">({{ activeCampaignsCount }})</span>
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
            {{ $t('planning.campaigns.filterInactive') }}
            <span class="ml-1 text-xs">({{ inactiveCampaignsCount }})</span>
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
        <button class="btn-primary flex items-center gap-2" @click="openNewCampaignForm">
          <span class="material-icons text-sm">add</span>
          {{ $t('planning.campaigns.add') }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Campaigns List -->
    <div v-else-if="filteredCampaigns.length > 0" class="grid gap-4">
      <div
        v-for="campaign in filteredCampaigns"
        :key="campaign._id"
        class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4"
        :class="{ 'opacity-60': isCampaignPast(campaign) || campaign.status !== 'active' }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center"
              :class="getCampaignTypeColor(campaign.type)"
            >
              <span class="material-icons text-white">{{
                getCampaignTypeIcon(campaign.type)
              }}</span>
            </div>
            <div>
              <div class="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                {{ getCampaignName(campaign) }}
                <span
                  class="px-2 py-0.5 text-xs rounded"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                      campaign.status === 'active',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                      campaign.status === 'draft',
                    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400':
                      campaign.status === 'inactive'
                  }"
                >
                  {{ $t(`common.status.${campaign.status}`) }}
                </span>
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-3">
                <span class="font-mono">{{ campaign.code }}</span>
                <span>{{ $t(`planning.campaigns.types.${campaign.type}`) }}</span>
                <span class="font-bold text-green-600 dark:text-green-400">
                  {{ formatDiscount(campaign.discount) }}
                </span>
                <span
                  v-if="campaign.conditions?.minNights > 1"
                  class="text-orange-600 dark:text-orange-400"
                >
                  {{ campaign.conditions.minNights }}+ {{ $t('planning.campaigns.nightsShort') }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="p-2 text-gray-500 hover:text-indigo-600" @click="editCampaign(campaign)">
              <span class="material-icons">edit</span>
            </button>
            <button class="p-2 text-gray-500 hover:text-red-600" @click="confirmDelete(campaign)">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
        <!-- Settings Badges -->
        <div class="mt-2 flex flex-wrap gap-1.5">
          <!-- Markets -->
          <span
            v-for="marketId in campaign.applicableMarkets"
            :key="marketId"
            class="px-1.5 py-0.5 text-[10px] rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
          >
            <span class="material-icons text-[10px] align-middle">public</span>
            {{ getMarketName(marketId) }}
          </span>
          <!-- All Markets badge if no specific markets selected -->
          <span
            v-if="!campaign.applicableMarkets || campaign.applicableMarkets.length === 0"
            class="px-1.5 py-0.5 text-[10px] rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
          >
            <span class="material-icons text-[10px] align-middle">public</span>
            {{ $t('common.allMarkets') }}
          </span>
          <!-- B2C -->
          <span
            v-if="campaign.visibility?.b2c"
            class="px-1.5 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          >
            <span class="material-icons text-[10px] align-middle">person</span> B2C
          </span>
          <!-- B2B -->
          <span
            v-if="campaign.visibility?.b2b"
            class="px-1.5 py-0.5 text-[10px] rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          >
            <span class="material-icons text-[10px] align-middle">business</span> B2B
          </span>
          <!-- Combinable -->
          <span
            v-if="campaign.combinable"
            class="px-1.5 py-0.5 text-[10px] rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          >
            <span class="material-icons text-[10px] align-middle">link</span>
            {{ $t('planning.campaigns.combinableShort') }}
          </span>
          <!-- Calculation Type -->
          <span
            class="px-1.5 py-0.5 text-[10px] rounded"
            :class="
              campaign.calculationType === 'sequential'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            "
          >
            {{
              campaign.calculationType === 'sequential'
                ? $t('planning.campaigns.calculationTypeSequential')
                : $t('planning.campaigns.calculationTypeCumulative')
            }}
          </span>
          <!-- Calculation Order -->
          <span
            v-if="campaign.calculationOrder > 0"
            class="px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          >
            #{{ campaign.calculationOrder }}
          </span>
          <!-- Application Type -->
          <span
            class="px-1.5 py-0.5 text-[10px] rounded"
            :class="
              campaign.applicationType === 'checkin'
                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            "
          >
            {{
              campaign.applicationType === 'checkin'
                ? $t('planning.campaigns.applicationTypeCheckin')
                : $t('planning.campaigns.applicationTypeStay')
            }}
          </span>
        </div>
        <!-- Date Info -->
        <div class="mt-2 text-xs text-gray-500 dark:text-slate-400 flex gap-4">
          <span class="flex items-center gap-1" :title="$t('planning.campaigns.bookingWindow')">
            <span class="material-icons text-xs">event_available</span>
            {{ formatDate(campaign.bookingWindow?.startDate) }} -
            {{ formatDate(campaign.bookingWindow?.endDate) }}
          </span>
          <span class="flex items-center gap-1" :title="$t('planning.campaigns.stayWindow')">
            <span class="material-icons text-xs">date_range</span>
            {{ formatDate(campaign.stayWindow?.startDate) }} -
            {{ formatDate(campaign.stayWindow?.endDate) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">campaign</span>
      <p class="mt-3 text-gray-500 dark:text-slate-400">
        {{
          campaigns.length > 0
            ? $t('planning.campaigns.noMatchingCampaigns')
            : $t('planning.campaigns.empty')
        }}
      </p>
    </div>

    <!-- Campaign Form Modal -->
    <Modal
      v-model="showCampaignForm"
      :title="editingCampaign ? $t('planning.campaigns.edit') : $t('planning.campaigns.add')"
      size="xl"
      :close-on-overlay="false"
    >
      <CampaignForm
        :hotel="hotel"
        :campaign="editingCampaign"
        :room-types="roomTypes"
        :meal-plans="mealPlans"
        :markets="markets"
        @saved="handleCampaignSaved"
        @cancel="showCampaignForm = false"
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
import CampaignForm from './CampaignForm.vue'
import planningService from '@/services/planningService'

const props = defineProps({
  hotel: { type: Object, required: true }
})

const { t, locale } = useI18n()
const toast = useToast()

const campaigns = ref([])
const roomTypes = ref([])
const mealPlans = ref([])
const markets = ref([])
const loading = ref(false)
const showCampaignForm = ref(false)
const editingCampaign = ref(null)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)
const statusFilter = ref('active')

// Check if booking window has expired
const isBookingWindowExpired = campaign => {
  if (!campaign.bookingWindow?.endDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(campaign.bookingWindow.endDate)
  endDate.setHours(0, 0, 0, 0)
  return endDate < today
}

// Check if campaign is currently active (status active + booking window not expired)
const isCampaignActive = campaign => {
  return campaign.status === 'active' && !isBookingWindowExpired(campaign)
}

// Check if campaign is past (status active but booking window expired)
const isCampaignPast = campaign => {
  return campaign.status === 'active' && isBookingWindowExpired(campaign)
}

// Filtered campaigns based on status filter
const filteredCampaigns = computed(() => {
  if (statusFilter.value === 'all') return campaigns.value
  if (statusFilter.value === 'active') {
    // Aktif: status=active ve satış tarihi geçmemiş
    return campaigns.value.filter(c => isCampaignActive(c))
  }
  // Geçmiş: status=active ama satış tarihi geçmiş (manuel pasife alınanlar hariç)
  return campaigns.value.filter(c => isCampaignPast(c))
})

// Count active and past campaigns
const activeCampaignsCount = computed(() => {
  return campaigns.value.filter(c => isCampaignActive(c)).length
})

const inactiveCampaignsCount = computed(() => {
  return campaigns.value.filter(c => isCampaignPast(c)).length
})

// Get market name by ID
const getMarketName = marketId => {
  const market = markets.value.find(m => m._id === marketId)
  return market?.name?.[locale.value] || market?.name?.tr || market?.name?.en || market?.code || ''
}

const getCampaignName = campaign => {
  return campaign.name?.[locale.value] || campaign.name?.tr || campaign.name?.en || campaign.code
}

const getCampaignTypeIcon = type => {
  const icons = {
    early_bird: 'schedule',
    last_minute: 'flash_on',
    long_stay: 'hotel',
    promotional: 'local_offer',
    seasonal: 'wb_sunny',
    honeymoon: 'favorite',
    family: 'family_restroom',
    weekend: 'weekend',
    midweek: 'work'
  }
  return icons[type] || 'campaign'
}

const getCampaignTypeColor = type => {
  const colors = {
    early_bird: 'bg-blue-500',
    last_minute: 'bg-red-500',
    long_stay: 'bg-green-500',
    promotional: 'bg-purple-500',
    seasonal: 'bg-orange-500',
    honeymoon: 'bg-pink-500',
    family: 'bg-teal-500'
  }
  return colors[type] || 'bg-gray-500'
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

const fetchCampaigns = async () => {
  loading.value = true
  try {
    const response = await planningService.getCampaigns(props.hotel._id)
    if (response.success) {
      campaigns.value = response.data.filter(c => c.type !== 'promo_code')
    }
  } catch {
    toast.error(t('common.fetchError'))
  } finally {
    loading.value = false
  }
}

const fetchRelatedData = async () => {
  try {
    const [roomTypesRes, mealPlansRes, marketsRes] = await Promise.all([
      planningService.getRoomTypes(props.hotel._id),
      planningService.getMealPlans(props.hotel._id),
      planningService.getMarkets(props.hotel._id)
    ])

    if (roomTypesRes.success) roomTypes.value = roomTypesRes.data
    if (mealPlansRes.success) mealPlans.value = mealPlansRes.data
    if (marketsRes.success) markets.value = marketsRes.data
  } catch (error) {
    console.error('Error fetching related data:', error)
  }
}

const openNewCampaignForm = () => {
  editingCampaign.value = null
  showCampaignForm.value = true
}

const editCampaign = campaign => {
  editingCampaign.value = campaign
  showCampaignForm.value = true
}

const handleCampaignSaved = () => {
  showCampaignForm.value = false
  editingCampaign.value = null
  fetchCampaigns()
}

const confirmDelete = campaign => {
  deleteTarget.value = campaign
  showDeleteModal.value = true
}

const executeDelete = async () => {
  deleting.value = true
  try {
    await planningService.deleteCampaign(props.hotel._id, deleteTarget.value._id)
    toast.success(t('planning.campaigns.deleted'))
    showDeleteModal.value = false
    fetchCampaigns()
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
      fetchCampaigns()
      fetchRelatedData()
    }
  },
  { immediate: true }
)
</script>
