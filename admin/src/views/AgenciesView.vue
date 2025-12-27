<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex justify-end">
          <button @click="openCreateModal" class="btn-primary flex items-center">
            <span class="material-icons mr-2">add</span>
            {{ $t('agencies.addAgency') }}
          </button>
        </div>
      </div>

      <div class="p-6">
        <DataTable
          :columns="columns"
          :data="agencies"
          :loading="loading"
        >
          <template #cell-companyName="{ item }">
            <div>
              <div class="font-medium text-gray-900 dark:text-white">{{ item.companyName || item.name }}</div>
              <div v-if="item.taxNumber" class="text-xs text-gray-500 dark:text-slate-400">VKN: {{ item.taxNumber }}</div>
            </div>
          </template>

          <template #cell-status="{ value }">
            <span
              class="badge"
              :class="{
                'badge-success': value === 'active',
                'badge-danger': value === 'inactive' || value === 'suspended',
                'badge-warning': value === 'pending'
              }"
            >
              {{ getStatusLabel(value) }}
            </span>
          </template>

          <template #cell-creditLimit="{ item }">
            <div v-if="item.creditLimit?.enabled" class="text-sm">
              <div class="font-medium">{{ formatCurrency(item.creditLimit.amount - (item.creditLimit.used || 0), item.creditLimit.currency) }}</div>
              <div class="text-xs text-gray-500">/ {{ formatCurrency(item.creditLimit.amount, item.creditLimit.currency) }}</div>
            </div>
            <span v-else class="text-gray-400 text-sm">-</span>
          </template>

          <template #actions="{ item }">
            <div class="flex items-center justify-end gap-2">
              <button
                v-if="item.status === 'pending'"
                @click="confirmApprove(item)"
                class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                :title="$t('agencies.approve')"
              >
                <span class="material-icons text-lg">check_circle</span>
              </button>
              <button
                @click="goToUsers(item)"
                class="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                :title="$t('agencies.users')"
              >
                <span class="material-icons text-lg">group</span>
              </button>
              <button
                @click="openEditModal(item)"
                class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                :title="$t('common.edit')"
              >
                <span class="material-icons text-lg">edit</span>
              </button>
              <button
                @click="confirmDelete(item)"
                class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                :title="$t('common.delete')"
              >
                <span class="material-icons text-lg">delete</span>
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      v-model="showModal"
      :title="isEditing ? $t('agencies.editAgency') : $t('agencies.addAgency')"
      size="lg"
      :close-on-overlay="false"
    >
      <div class="flex flex-col h-[500px] -mx-4 -my-4">
        <!-- Tabs Header -->
        <div class="flex-shrink-0 border-b border-gray-200 dark:border-slate-700 px-4 bg-gray-50 dark:bg-slate-700/50">
          <nav class="flex gap-1 overflow-x-auto py-2">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              @click="activeTab = tab.id"
              class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap"
              :class="activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'"
            >
              <span class="material-icons text-base">{{ tab.icon }}</span>
              <span>{{ tab.label }}</span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Tab 1: Basic Info & Address -->
          <div v-show="activeTab === 'basic'" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">{{ $t('agencies.basicInfo') }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">{{ $t('agencies.companyName') }} <span class="text-red-500">*</span></label>
                  <input
                    v-model="form.companyName"
                    type="text"
                    class="form-input"
                    :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.companyName }"
                    @input="errors.companyName = ''"
                  />
                  <p v-if="errors.companyName" class="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <span class="material-icons text-sm">error_outline</span>
                    {{ errors.companyName }}
                  </p>
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.tradeName') }}</label>
                  <input v-model="form.tradeName" type="text" class="form-input" :placeholder="$t('agencies.tradeNamePlaceholder')" />
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.email') }} <span class="text-red-500">*</span></label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="form-input"
                    :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.email }"
                    @input="errors.email = ''"
                  />
                  <p v-if="errors.email" class="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <span class="material-icons text-sm">error_outline</span>
                    {{ errors.email }}
                  </p>
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.phone') }}</label>
                  <input v-model="form.phone" type="text" class="form-input" />
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.taxOffice') }}</label>
                  <input v-model="form.taxOffice" type="text" class="form-input" />
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.taxNumber') }}</label>
                  <input v-model="form.taxNumber" type="text" class="form-input" />
                </div>
                <div>
                  <label class="form-label">{{ $t('common.status.label') }}</label>
                  <select v-model="form.status" class="form-input">
                    <option value="active">{{ $t('common.active') }}</option>
                    <option value="inactive">{{ $t('common.inactive') }}</option>
                    <option value="pending">{{ $t('common.pending') }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">{{ $t('agencies.addressTitle') }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="form-label">{{ $t('agencies.street') }}</label>
                  <input v-model="form.address.street" type="text" class="form-input" />
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.city') }}</label>
                  <input v-model="form.address.city" type="text" class="form-input" />
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.country') }}</label>
                  <CountrySelect v-model="form.address.country" />
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.postalCode') }}</label>
                  <input v-model="form.address.postalCode" type="text" class="form-input" />
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 2: Commission & Credit -->
          <div v-show="activeTab === 'finance'" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">{{ $t('agencies.commissionTab') }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">{{ $t('agencies.defaultCommission') }} (%)</label>
                  <input v-model.number="form.commission.default" type="number" min="0" max="100" step="0.1" class="form-input" />
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.hotelCommission') }} (%)</label>
                  <input v-model.number="form.commission.hotel" type="number" min="0" max="100" step="0.1" class="form-input" />
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">{{ $t('agencies.creditLimit') }}</h3>
              <div class="flex items-center gap-3 mb-4">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="form.creditLimit.enabled" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
                <span class="text-sm text-gray-700 dark:text-slate-300">{{ $t('agencies.enableCreditLimit') }}</span>
              </div>
              <div v-if="form.creditLimit.enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">{{ $t('agencies.creditAmount') }}</label>
                  <input v-model.number="form.creditLimit.amount" type="number" min="0" class="form-input" />
                </div>
                <div>
                  <label class="form-label">{{ $t('agencies.currency') }}</label>
                  <select v-model="form.creditLimit.currency" class="form-input">
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 3: Sales Restrictions -->
          <div v-show="activeTab === 'sales'" class="space-y-6">
            <div>
              <label class="form-label">{{ $t('agencies.allowedCountries') }}</label>
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">{{ $t('agencies.allowedCountriesDesc') }}</p>
              <div v-if="form.salesRestrictions.allowedCountries.length" class="flex flex-wrap gap-2 mb-2">
                <span
                  v-for="code in form.salesRestrictions.allowedCountries"
                  :key="code"
                  class="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                >
                  <img :src="`/flags/${code.toLowerCase()}.svg`" :alt="code" class="w-4 h-3 object-contain" />
                  {{ getCountryLabel(code) }}
                  <button type="button" @click="removeCountry(code)" class="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded">
                    <span class="material-icons text-sm">close</span>
                  </button>
                </span>
              </div>
              <CountrySelect v-model="selectedCountryToAdd" @update:model-value="addCountry" :placeholder="$t('agencies.selectCountryToAdd')" />
            </div>
            <div>
              <label class="form-label">{{ $t('agencies.allowedHotels') }}</label>
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">{{ $t('agencies.allowedHotelsDesc') }}</p>
              <div v-if="form.salesRestrictions.allowedHotels.length" class="flex flex-wrap gap-2 mb-2">
                <span
                  v-for="hotelId in form.salesRestrictions.allowedHotels"
                  :key="hotelId"
                  class="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm"
                >
                  <span class="material-icons text-sm">hotel</span>
                  {{ getHotelName(hotelId) }}
                  <button type="button" @click="removeAllowedHotel(hotelId)" class="p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded">
                    <span class="material-icons text-sm">close</span>
                  </button>
                </span>
              </div>
              <select v-model="selectedHotelToAdd" @change="addAllowedHotel" class="form-input">
                <option value="">{{ $t('agencies.selectHotelToAdd') }}</option>
                <option v-for="hotel in availableHotelsForAllowed" :key="hotel._id" :value="hotel._id">{{ hotel.name }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">{{ $t('agencies.blockedHotels') }}</label>
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">{{ $t('agencies.blockedHotelsDesc') }}</p>
              <div v-if="form.salesRestrictions.blockedHotels.length" class="flex flex-wrap gap-2 mb-2">
                <span
                  v-for="hotelId in form.salesRestrictions.blockedHotels"
                  :key="hotelId"
                  class="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm"
                >
                  <span class="material-icons text-sm">block</span>
                  {{ getHotelName(hotelId) }}
                  <button type="button" @click="removeBlockedHotel(hotelId)" class="p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded">
                    <span class="material-icons text-sm">close</span>
                  </button>
                </span>
              </div>
              <select v-model="selectedBlockedHotelToAdd" @change="addBlockedHotel" class="form-input">
                <option value="">{{ $t('agencies.selectHotelToBlock') }}</option>
                <option v-for="hotel in availableHotelsForBlocked" :key="hotel._id" :value="hotel._id">{{ hotel.name }}</option>
              </select>
            </div>
          </div>

          <!-- Tab 4: Payment Methods -->
          <div v-show="activeTab === 'payment'" class="space-y-6">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">{{ $t('agencies.paymentSettingsTab') }}</h3>
            <div class="space-y-4">
              <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" value="creditCard" v-model="form.paymentSettings.allowedMethods" class="form-checkbox h-5 w-5 text-purple-600 rounded" />
                  <span class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('agencies.paymentMethods.creditCard') }}</span>
                </label>
                <div v-if="form.paymentSettings.allowedMethods.includes('creditCard')" class="mt-4 pl-8">
                  <label class="form-label">{{ $t('agencies.maxInstallments') }}</label>
                  <select v-model="form.paymentSettings.maxInstallments" class="form-input w-48">
                    <option :value="1">{{ $t('agencies.singlePayment') }}</option>
                    <option :value="2">2 {{ $t('agencies.installments') }}</option>
                    <option :value="3">3 {{ $t('agencies.installments') }}</option>
                    <option :value="4">4 {{ $t('agencies.installments') }}</option>
                    <option :value="6">6 {{ $t('agencies.installments') }}</option>
                    <option :value="9">9 {{ $t('agencies.installments') }}</option>
                    <option :value="12">12 {{ $t('agencies.installments') }}</option>
                  </select>
                </div>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" value="bankTransfer" v-model="form.paymentSettings.allowedMethods" class="form-checkbox h-5 w-5 text-purple-600 rounded" />
                  <span class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('agencies.paymentMethods.bankTransfer') }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Tab 5: Documents -->
          <div v-show="activeTab === 'documents'">
            <div v-if="isEditing && selectedAgency">
              <DocumentUpload
                :partner-id="selectedAgency._id"
                :documents="selectedAgency.documents"
                :uploading="uploading"
                @upload="uploadDocument"
                @delete="confirmDeleteDocument"
                base-url="/agencies"
              />
            </div>
            <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
              <span class="material-icons text-4xl mb-2">description</span>
              <p>{{ $t('agencies.saveFirstForDocuments') }}</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" @click="showModal = false" class="btn-secondary">
          {{ $t('common.cancel') }}
        </button>
        <button @click="handleSubmit" :disabled="submitting" class="btn-primary">
          <span v-if="submitting" class="material-icons animate-spin mr-2">sync</span>
          {{ submitting ? $t('common.saving') : (isEditing ? $t('common.save') : $t('common.create')) }}
        </button>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('common.confirmDelete')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">{{ $t('agencies.deleteConfirmation') }}</p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">{{ $t('common.cancel') }}</button>
        <button @click="deleteAgency" :disabled="deleting" class="btn-danger">
          <span v-if="deleting" class="material-icons animate-spin mr-2">sync</span>
          {{ $t('common.delete') }}
        </button>
      </template>
    </Modal>

    <!-- Approve Confirmation Modal -->
    <Modal v-model="showApproveModal" :title="$t('agencies.approveAgency')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">{{ $t('agencies.approveConfirmation') }}</p>
      <template #footer>
        <button @click="showApproveModal = false" class="btn-secondary">{{ $t('common.cancel') }}</button>
        <button @click="approveAgency" :disabled="approving" class="btn-primary">
          <span v-if="approving" class="material-icons animate-spin mr-2">sync</span>
          {{ $t('agencies.approve') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import DocumentUpload from '@/components/DocumentUpload.vue'
import CountrySelect from '@/components/common/CountrySelect.vue'
import agencyService from '@/services/agencyService'
import hotelService from '@/services/hotelService'
import { useI18n } from 'vue-i18n'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { COUNTRIES, getCountryName } from '@/data/countries'

const { t, locale } = useI18n()
const toast = useToast()
const router = useRouter()

const agencies = ref([])
const hotels = ref([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const showApproveModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const approving = ref(false)
const uploading = ref(false)
const selectedAgency = ref(null)
const activeTab = ref('basic')

// Tabs
const tabs = computed(() => [
  { id: 'basic', label: t('agencies.infoTab'), icon: 'business' },
  { id: 'finance', label: t('agencies.commissionTab'), icon: 'account_balance' },
  { id: 'sales', label: t('agencies.salesRestrictionsTab'), icon: 'public' },
  { id: 'payment', label: t('agencies.paymentSettingsTab'), icon: 'payment' },
  { id: 'documents', label: t('agencies.documentsTab'), icon: 'folder' }
])

// Selection helpers
const selectedCountryToAdd = ref('')
const selectedHotelToAdd = ref('')
const selectedBlockedHotelToAdd = ref('')

// Payment methods
const paymentMethods = ['creditCard', 'bankTransfer']

// Table columns
const columns = computed(() => [
  { key: 'companyName', label: t('agencies.companyName'), sortable: true },
  { key: 'email', label: t('agencies.email'), sortable: true },
  { key: 'phone', label: t('agencies.phone') },
  { key: 'status', label: t('common.status.label'), sortable: true },
  { key: 'creditLimit', label: t('agencies.creditLimit') }
])

const getDefaultForm = () => ({
  companyName: '',
  tradeName: '',
  email: '',
  phone: '',
  taxOffice: '',
  taxNumber: '',
  status: 'active',
  address: {
    street: '',
    city: '',
    country: '',
    postalCode: ''
  },
  commission: {
    default: 10,
    hotel: 10,
    tour: 10,
    transfer: 10
  },
  creditLimit: {
    enabled: false,
    amount: 0,
    currency: 'TRY',
    used: 0
  },
  salesRestrictions: {
    allowedCountries: [],
    allowedHotels: [],
    blockedHotels: []
  },
  paymentSettings: {
    allowedMethods: ['creditCard', 'bankTransfer'],
    defaultMethod: 'creditCard',
    maxInstallments: 12
  }
})

const form = ref(getDefaultForm())
const errors = ref({})

// Validation
const validateForm = () => {
  errors.value = {}

  if (!form.value.companyName?.trim()) {
    errors.value.companyName = t('validation.required')
  }

  if (!form.value.email?.trim()) {
    errors.value.email = t('validation.required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = t('validation.email')
  }

  return Object.keys(errors.value).length === 0
}

// Computed
const availableHotelsForAllowed = computed(() => {
  return hotels.value.filter(h => !form.value.salesRestrictions.allowedHotels.includes(h._id))
})

const availableHotelsForBlocked = computed(() => {
  return hotels.value.filter(h => !form.value.salesRestrictions.blockedHotels.includes(h._id))
})

// Helper functions
const getCountryLabel = (code) => {
  return getCountryName(code, locale.value)
}

const getHotelName = (hotelId) => {
  const hotel = hotels.value.find(h => h._id === hotelId)
  return hotel ? hotel.name : hotelId
}

const addCountry = (code) => {
  if (code && !form.value.salesRestrictions.allowedCountries.includes(code)) {
    form.value.salesRestrictions.allowedCountries.push(code)
  }
  selectedCountryToAdd.value = ''
}

const removeCountry = (code) => {
  form.value.salesRestrictions.allowedCountries = form.value.salesRestrictions.allowedCountries.filter(c => c !== code)
}

const addAllowedHotel = () => {
  if (selectedHotelToAdd.value && !form.value.salesRestrictions.allowedHotels.includes(selectedHotelToAdd.value)) {
    form.value.salesRestrictions.allowedHotels.push(selectedHotelToAdd.value)
  }
  selectedHotelToAdd.value = ''
}

const removeAllowedHotel = (hotelId) => {
  form.value.salesRestrictions.allowedHotels = form.value.salesRestrictions.allowedHotels.filter(id => id !== hotelId)
}

const addBlockedHotel = () => {
  if (selectedBlockedHotelToAdd.value && !form.value.salesRestrictions.blockedHotels.includes(selectedBlockedHotelToAdd.value)) {
    form.value.salesRestrictions.blockedHotels.push(selectedBlockedHotelToAdd.value)
  }
  selectedBlockedHotelToAdd.value = ''
}

const removeBlockedHotel = (hotelId) => {
  form.value.salesRestrictions.blockedHotels = form.value.salesRestrictions.blockedHotels.filter(id => id !== hotelId)
}

const getStatusLabel = (status) => {
  const labels = {
    active: t('common.active'),
    inactive: t('common.inactive'),
    pending: t('common.pending'),
    suspended: t('agencies.suspended')
  }
  return labels[status] || status
}

const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency
  }).format(amount)
}

// API calls
const fetchAgencies = async () => {
  loading.value = true
  try {
    const response = await agencyService.getAgencies()
    if (response.success) {
      // Handle both array and paginated response formats
      agencies.value = Array.isArray(response.data)
        ? response.data
        : (response.data.agencies || response.data.items || [])
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.loadFailed'))
  } finally {
    loading.value = false
  }
}

const fetchHotels = async () => {
  try {
    const response = await hotelService.getHotels({ limit: 1000 })
    if (response.success) {
      hotels.value = response.data.items || response.data.hotels || []
    }
  } catch (error) {
    console.error('Failed to fetch hotels', error)
  }
}

const openCreateModal = () => {
  isEditing.value = false
  selectedAgency.value = null
  form.value = getDefaultForm()
  activeTab.value = 'basic'
  showModal.value = true
}

const openEditModal = (agency) => {
  isEditing.value = true
  selectedAgency.value = agency
  activeTab.value = 'basic'
  form.value = {
    companyName: agency.companyName || '',
    email: agency.email || '',
    phone: agency.phone || '',
    taxOffice: agency.taxOffice || '',
    taxNumber: agency.taxNumber || '',
    status: agency.status || 'active',
    address: {
      street: agency.address?.street || '',
      city: agency.address?.city || '',
      country: agency.address?.country || '',
      postalCode: agency.address?.postalCode || ''
    },
    commission: {
      default: agency.commission?.default ?? 10,
      hotel: agency.commission?.hotel ?? 10,
      tour: agency.commission?.tour ?? 10,
      transfer: agency.commission?.transfer ?? 10
    },
    creditLimit: {
      enabled: agency.creditLimit?.enabled || false,
      amount: agency.creditLimit?.amount || 0,
      currency: agency.creditLimit?.currency || 'TRY',
      used: agency.creditLimit?.used || 0
    },
    salesRestrictions: {
      allowedCountries: agency.salesRestrictions?.allowedCountries || [],
      allowedHotels: agency.salesRestrictions?.allowedHotels || [],
      blockedHotels: agency.salesRestrictions?.blockedHotels || []
    },
    paymentSettings: {
      allowedMethods: agency.paymentSettings?.allowedMethods || ['creditCard', 'bankTransfer'],
      defaultMethod: agency.paymentSettings?.defaultMethod || 'creditCard',
      maxInstallments: agency.paymentSettings?.maxInstallments || 12
    }
  }
  showModal.value = true
}

const handleSubmit = async () => {
  // Validate form first
  if (!validateForm()) {
    activeTab.value = 'basic' // Switch to first tab where errors are
    toast.error(t('validation.fixErrors'))
    return
  }

  submitting.value = true
  try {
    if (isEditing.value) {
      await agencyService.updateAgency(selectedAgency.value._id, form.value)
      toast.success(t('agencies.updateSuccess'))
    } else {
      await agencyService.createAgency(form.value)
      toast.success(t('agencies.createSuccess'))
    }
    showModal.value = false
    fetchAgencies()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (agency) => {
  selectedAgency.value = agency
  showDeleteModal.value = true
}

const deleteAgency = async () => {
  deleting.value = true
  try {
    await agencyService.deleteAgency(selectedAgency.value._id)
    toast.success(t('agencies.deleteSuccess'))
    showDeleteModal.value = false
    fetchAgencies()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

const confirmApprove = (agency) => {
  selectedAgency.value = agency
  showApproveModal.value = true
}

const approveAgency = async () => {
  approving.value = true
  try {
    await agencyService.approveAgency(selectedAgency.value._id)
    toast.success(t('agencies.approveSuccess'))
    showApproveModal.value = false
    fetchAgencies()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    approving.value = false
  }
}

const goToUsers = (agency) => {
  router.push({ name: 'agency-users', params: { agencyId: agency._id } })
}

const uploadDocument = async ({ file }) => {
  if (!selectedAgency.value) return
  uploading.value = true
  try {
    await agencyService.uploadDocument(selectedAgency.value._id, file)
    toast.success(t('common.uploadSuccess'))
    // Refresh agency data
    const response = await agencyService.getAgency(selectedAgency.value._id)
    if (response.success) {
      selectedAgency.value = response.data
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.uploadFailed'))
  } finally {
    uploading.value = false
  }
}

const confirmDeleteDocument = async (documentId) => {
  if (!selectedAgency.value) return
  try {
    await agencyService.deleteDocument(selectedAgency.value._id, documentId)
    toast.success(t('common.deleteSuccess'))
    // Refresh agency data
    const response = await agencyService.getAgency(selectedAgency.value._id)
    if (response.success) {
      selectedAgency.value = response.data
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  }
}

// Fetch hotels on mount
onMounted(() => {
  fetchHotels()
})

// React to partner changes
usePartnerContext({
  onPartnerChange: (partner) => {
    if (partner) {
      fetchAgencies()
      fetchHotels()
    }
  },
  immediate: true
})
</script>
