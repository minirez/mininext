<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import paymentLinkService from '@/services/paymentLinkService'
import { StatusBadge, Modal, ConfirmDialog, DatePicker } from '@/components/ui'

const { t } = useI18n()

// State
const items = ref([])
const loading = ref(false)
const stats = ref({})
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 0 })
const filters = ref({ status: '', search: '' })

// Modal states
const showFormModal = ref(false)
const showDetailModal = ref(false)
const selectedItem = ref(null)
const formData = ref(getEmptyForm())
const saving = ref(false)
const formErrors = ref({})

// Confirm dialog
const confirmDialog = ref({ show: false, title: '', message: '', action: null })

function getEmptyForm() {
  return {
    customer: { name: '', email: '', phone: '' },
    description: '',
    amount: '',
    currency: 'TRY',
    installment: { enabled: false, maxCount: 1, rates: {} },
    expiresAt: getDefaultExpiry(),
    sendEmail: true,
    sendSms: false
  }
}

function getDefaultExpiry() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

// Computed
const statusOptions = computed(() => [
  { value: '', label: t('misc.all') },
  { value: 'pending', label: t('paymentLink.status.pending') },
  { value: 'viewed', label: t('paymentLink.status.viewed') },
  { value: 'processing', label: t('paymentLink.status.processing') },
  { value: 'paid', label: t('paymentLink.status.paid') },
  { value: 'expired', label: t('paymentLink.status.expired') },
  { value: 'cancelled', label: t('paymentLink.status.cancelled') }
])

const currencyOptions = [
  { value: 'TRY', label: '₺' },
  { value: 'USD', label: '$' },
  { value: 'EUR', label: '€' },
  { value: 'GBP', label: '£' }
]

const currencySymbols = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£'
}

const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// Get installment range from 2 to maxCount (1 = single payment, no interest)
function getInstallmentRange(maxCount) {
  const range = []
  for (let i = 2; i <= maxCount; i++) {
    range.push(i)
  }
  return range
}

// Safe getter for installment rate
function getRate(n) {
  if (!formData.value.installment.rates) {
    formData.value.installment.rates = {}
  }
  return formData.value.installment.rates[n] || ''
}

// Safe setter for installment rate
function setRate(n, value) {
  if (!formData.value.installment.rates) {
    formData.value.installment.rates = {}
  }
  formData.value.installment.rates[n] = value === '' ? undefined : Number(value)
  console.log('setRate called:', { n, value, rates: { ...formData.value.installment.rates } })
}

// Watch currency changes - reset installment if not TRY
watch(() => formData.value.currency, (newCurrency) => {
  if (newCurrency !== 'TRY') {
    formData.value.installment.enabled = false
    formData.value.installment.maxCount = 1
  }
})

// Methods
async function fetchItems() {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters.value
    }
    const result = await paymentLinkService.getPaymentLinks(params)
    items.value = result.data.items
    pagination.value = result.data.pagination
  } catch (error) {
    console.error('Failed to fetch payment links:', error)
  } finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    const result = await paymentLinkService.getStats()
    stats.value = result.data
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

function openCreateModal() {
  formData.value = getEmptyForm()
  formErrors.value = {}
  selectedItem.value = null
  showFormModal.value = true
}

function openDetailModal(item) {
  selectedItem.value = item
  showDetailModal.value = true
}

function openEditModal(item) {
  console.log('=== OPENING EDIT MODAL ===')
  console.log('item.installment:', JSON.stringify(item.installment, null, 2))

  selectedItem.value = item
  formData.value = {
    customer: { ...item.customer },
    description: item.description,
    amount: item.amount,
    currency: item.currency,
    installment: {
      enabled: item.installment?.enabled || false,
      maxCount: item.installment?.maxCount || 1,
      rates: { ...(item.installment?.rates || {}) }
    },
    expiresAt: item.expiresAt?.split('T')[0] || getDefaultExpiry(),
    sendEmail: false,
    sendSms: false
  }

  console.log('formData.installment:', JSON.stringify(formData.value.installment, null, 2))
  formErrors.value = {}
  showFormModal.value = true
}

async function saveForm() {
  formErrors.value = {}

  // Validation
  if (!formData.value.customer.name) {
    formErrors.value.customerName = t('validation.required')
  }
  if (!formData.value.description) {
    formErrors.value.description = t('validation.required')
  }
  if (!formData.value.amount || formData.value.amount <= 0) {
    formErrors.value.amount = t('validation.required')
  }

  if (Object.keys(formErrors.value).length > 0) return

  // Clean up rates - remove undefined/null values and ensure numeric keys are strings
  const cleanedRates = {}
  if (formData.value.installment?.rates) {
    Object.entries(formData.value.installment.rates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && !isNaN(value)) {
        cleanedRates[String(key)] = Number(value)
      }
    })
  }

  // Prepare payload
  const payload = {
    ...formData.value,
    installment: {
      enabled: formData.value.installment?.enabled || false,
      maxCount: formData.value.installment?.maxCount || 1,
      rates: cleanedRates
    }
  }

  console.log('=== SAVING PAYMENT LINK ===')
  console.log('formData.installment:', JSON.stringify(formData.value.installment, null, 2))
  console.log('cleanedRates:', JSON.stringify(cleanedRates, null, 2))
  console.log('Final payload:', JSON.stringify(payload, null, 2))

  saving.value = true
  try {
    let result
    if (selectedItem.value) {
      result = await paymentLinkService.updatePaymentLink(selectedItem.value._id, payload)
    } else {
      result = await paymentLinkService.createPaymentLink(payload)
    }
    console.log('Save result:', JSON.stringify(result, null, 2))
    showFormModal.value = false
    await fetchItems()
    await fetchStats()
  } catch (error) {
    console.error('Failed to save payment link:', error)
    formErrors.value.general = error.response?.data?.message || t('errors.general')
  } finally {
    saving.value = false
  }
}

function confirmCancel(item) {
  selectedItem.value = item
  confirmDialog.value = {
    show: true,
    title: t('paymentLink.cancelConfirmTitle'),
    message: t('paymentLink.cancelConfirmMessage'),
    action: cancelItem
  }
}

async function cancelItem() {
  try {
    await paymentLinkService.cancelPaymentLink(selectedItem.value._id, 'Admin tarafından iptal edildi')
    confirmDialog.value.show = false
    await fetchItems()
    await fetchStats()
  } catch (error) {
    console.error('Failed to cancel payment link:', error)
  }
}

async function resendNotification(item, channel) {
  try {
    await paymentLinkService.resendNotification(item._id, channel)
    // Show success message
  } catch (error) {
    console.error('Failed to resend notification:', error)
  }
}

function copyLink(item) {
  navigator.clipboard.writeText(item.paymentUrl)
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatAmount(amount, currency) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY'
  }).format(amount)
}

function getStatusVariant(status) {
  const variants = {
    pending: 'yellow',
    viewed: 'cyan',
    processing: 'blue',
    paid: 'green',
    expired: 'red',
    cancelled: 'red'
  }
  return variants[status] || 'gray'
}

function getCountryName(code) {
  if (!code) return '-'
  const countries = {
    tr: 'Türkiye',
    us: 'ABD',
    gb: 'İngiltere',
    de: 'Almanya',
    fr: 'Fransa',
    it: 'İtalya',
    es: 'İspanya',
    nl: 'Hollanda',
    be: 'Belçika',
    at: 'Avusturya',
    ch: 'İsviçre',
    ru: 'Rusya',
    ua: 'Ukrayna',
    ae: 'BAE',
    sa: 'S. Arabistan'
  }
  return countries[code.toLowerCase()] || code.toUpperCase()
}

function changePage(page) {
  pagination.value.page = page
  fetchItems()
}

function applyFilters() {
  pagination.value.page = 1
  fetchItems()
}

onMounted(() => {
  fetchItems()
  fetchStats()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">
        {{ $t('paymentLink.title') }}
      </h2>
      <button class="btn-primary flex items-center gap-2" @click="openCreateModal">
        <span class="material-icons text-sm">add</span>
        {{ $t('paymentLink.create') }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons text-blue-600 dark:text-blue-400">link</span>
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.total || 0 }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('paymentLink.stats.total') }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons text-yellow-600 dark:text-yellow-400">schedule</span>
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.pending || 0 }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('paymentLink.stats.pending') }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons text-cyan-600 dark:text-cyan-400">visibility</span>
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.viewed || 0 }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('paymentLink.stats.viewed') }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.paid || 0 }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('paymentLink.stats.paid') }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons text-purple-600 dark:text-purple-400">calendar_today</span>
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.thisMonth || 0 }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('paymentLink.stats.thisMonth') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-48">
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('misc.search') }}
          </label>
          <input
            v-model="filters.search"
            type="text"
            class="form-input w-full"
            :placeholder="$t('paymentLink.searchPlaceholder')"
            @keyup.enter="applyFilters"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('misc.status') }}
          </label>
          <select v-model="filters.status" class="form-input" @change="applyFilters">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <button class="btn-primary" @click="applyFilters">
          <span class="material-icons text-sm">filter_list</span>
          {{ $t('misc.filter') }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-slate-700 border-b dark:border-slate-600">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">
              {{ $t('paymentLink.fields.linkNumber') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">
              {{ $t('paymentLink.fields.customer') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">
              {{ $t('paymentLink.fields.description') }}
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">
              {{ $t('paymentLink.fields.amount') }}
            </th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">
              {{ $t('misc.status') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">
              {{ $t('paymentLink.fields.expiresAt') }}
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase">
              {{ $t('misc.actions') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
          <tr v-if="loading">
            <td colspan="7" class="px-4 py-16 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="7" class="px-4 py-16 text-center text-gray-500 dark:text-slate-400">
              <span class="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-2 block">link_off</span>
              {{ $t('paymentLink.noData') }}
            </td>
          </tr>
          <tr
            v-for="item in items"
            :key="item._id"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
            @click="openDetailModal(item)"
          >
            <td class="px-4 py-3">
              <code class="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded font-mono">
                {{ item.linkNumber }}
              </code>
            </td>
            <td class="px-4 py-3">
              <div class="font-medium text-gray-900 dark:text-white">{{ item.customer?.name }}</div>
              <div class="text-xs text-gray-500 dark:text-slate-400">{{ item.customer?.email }}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-slate-300 max-w-xs truncate">
              {{ item.description }}
            </td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
              {{ formatAmount(item.amount, item.currency) }}
            </td>
            <td class="px-4 py-3 text-center">
              <StatusBadge :status="item.status" :variant="getStatusVariant(item.status)">
                {{ $t(`paymentLink.status.${item.status}`) }}
              </StatusBadge>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
              {{ formatDate(item.expiresAt) }}
            </td>
            <td class="px-4 py-3 text-right" @click.stop>
              <div class="flex justify-end gap-1">
                <button
                  v-if="['pending', 'viewed'].includes(item.status)"
                  class="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  :title="$t('paymentLink.copyLink')"
                  @click="copyLink(item)"
                >
                  <span class="material-icons text-sm">content_copy</span>
                </button>
                <button
                  v-if="['pending', 'viewed'].includes(item.status) && item.customer?.email"
                  class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  :title="$t('paymentLink.resendEmail')"
                  @click="resendNotification(item, 'email')"
                >
                  <span class="material-icons text-sm">email</span>
                </button>
                <button
                  v-if="['pending', 'viewed'].includes(item.status) && item.customer?.phone"
                  class="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  :title="$t('paymentLink.resendSms')"
                  @click="resendNotification(item, 'sms')"
                >
                  <span class="material-icons text-sm">sms</span>
                </button>
                <button
                  v-if="['pending', 'viewed'].includes(item.status)"
                  class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  :title="$t('misc.edit')"
                  @click="openEditModal(item)"
                >
                  <span class="material-icons text-sm">edit</span>
                </button>
                <button
                  v-if="['pending', 'viewed'].includes(item.status)"
                  class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  :title="$t('misc.cancel')"
                  @click="confirmCancel(item)"
                >
                  <span class="material-icons text-sm">cancel</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="px-4 py-3 border-t dark:border-slate-700 flex justify-between items-center">
        <div class="text-sm text-gray-600 dark:text-slate-400">
          {{ $t('pagination.showing', {
            from: (pagination.page - 1) * pagination.limit + 1,
            to: Math.min(pagination.page * pagination.limit, pagination.total),
            total: pagination.total
          }) }}
        </div>
        <div class="flex gap-1">
          <button
            v-for="p in pagination.pages"
            :key="p"
            class="px-3 py-1.5 rounded text-sm font-medium transition-colors"
            :class="pagination.page === p
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-slate-700 border dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'"
            @click="changePage(p)"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal v-model="showFormModal" :title="selectedItem ? $t('paymentLink.edit') : $t('paymentLink.create')" size="lg" @close="showFormModal = false">
      <form @submit.prevent="saveForm" class="space-y-4">
        <!-- Error Alert -->
        <div v-if="formErrors.general" class="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <span class="material-icons text-red-500">error</span>
          <span class="text-red-600 dark:text-red-400 text-sm">{{ formErrors.general }}</span>
        </div>

        <!-- Customer Info Section -->
        <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="material-icons text-primary-500">person</span>
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('paymentLink.customerInfo') }}</h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                {{ $t('paymentLink.fields.customerName') }} <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">badge</span>
                <input
                  v-model="formData.customer.name"
                  type="text"
                  class="form-input w-full pl-10"
                  :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': formErrors.customerName }"
                  :placeholder="$t('paymentLink.placeholders.name')"
                />
              </div>
              <p v-if="formErrors.customerName" class="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span class="material-icons text-xs">error</span>
                {{ formErrors.customerName }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                {{ $t('paymentLink.fields.customerEmail') }}
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">email</span>
                <input
                  v-model="formData.customer.email"
                  type="email"
                  class="form-input w-full pl-10"
                  :placeholder="$t('paymentLink.placeholders.email')"
                />
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                {{ $t('paymentLink.fields.customerPhone') }}
                <span class="text-gray-400 font-normal">({{ $t('misc.optional') }})</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">phone</span>
                <input
                  v-model="formData.customer.phone"
                  type="tel"
                  class="form-input w-full pl-10"
                  :placeholder="$t('paymentLink.placeholders.phone')"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Details Section -->
        <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="material-icons text-primary-500">receipt_long</span>
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('paymentLink.paymentInfo') }}</h4>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                {{ $t('paymentLink.fields.description') }} <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="formData.description"
                rows="2"
                class="form-input w-full resize-none"
                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': formErrors.description }"
                :placeholder="$t('paymentLink.placeholders.description')"
              ></textarea>
              <p v-if="formErrors.description" class="text-red-500 text-xs mt-1 flex items-center gap-1">
                <span class="material-icons text-xs">error</span>
                {{ formErrors.description }}
              </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  {{ $t('paymentLink.fields.amount') }} <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model.number="formData.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    class="form-input w-full pr-12 text-lg font-semibold"
                    :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': formErrors.amount }"
                    placeholder="0.00"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    {{ currencySymbols[formData.currency] }}
                  </span>
                </div>
                <p v-if="formErrors.amount" class="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <span class="material-icons text-xs">error</span>
                  {{ formErrors.amount }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  {{ $t('paymentLink.fields.currency') }}
                </label>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="opt in currencyOptions"
                    :key="opt.value"
                    type="button"
                    class="py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all"
                    :class="formData.currency === opt.value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-primary-300'"
                    @click="formData.currency = opt.value"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div>
                <DatePicker
                  v-model="formData.expiresAt"
                  :label="$t('paymentLink.fields.expiresAt')"
                  :min-date="new Date()"
                  :help="$t('paymentLink.expiryHint')"
                  :clearable="false"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Installment Section (only for TRY) -->
        <div v-if="formData.currency === 'TRY'" class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="material-icons text-primary-500">credit_score</span>
              <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('paymentLink.installmentSettings') }}</h4>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="formData.installment.enabled" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <Transition name="slide-fade">
            <div v-if="formData.installment.enabled" class="space-y-4">
              <!-- Max Installment Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {{ $t('paymentLink.maxInstallment') }}
                </label>
                <div class="grid grid-cols-6 gap-2">
                  <button
                    v-for="n in [2, 3, 4, 6, 9, 12]"
                    :key="n"
                    type="button"
                    class="py-3 rounded-xl text-center transition-all border-2"
                    :class="formData.installment.maxCount === n
                      ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-primary-300'"
                    @click="formData.installment.maxCount = n"
                  >
                    <span class="block text-lg font-bold">{{ n }}</span>
                    <span class="block text-xs opacity-70">{{ $t('paymentLink.months') }}</span>
                  </button>
                </div>
              </div>

              <!-- Interest Rates per Installment -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {{ $t('paymentLink.interestRates') }}
                </label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div
                    v-for="n in getInstallmentRange(formData.installment.maxCount)"
                    :key="n"
                    class="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-3"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ n }} {{ $t('paymentLink.installment') }}</span>
                    </div>
                    <div class="relative">
                      <input
                        :value="getRate(n)"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        class="form-input w-full text-center pr-6"
                        placeholder="0"
                        @input="setRate(n, $event.target.value)"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                  </div>
                </div>
                <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
                  {{ $t('paymentLink.interestRateHint') }}
                </p>
              </div>
            </div>
          </Transition>

          <p v-if="!formData.installment.enabled" class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('paymentLink.installmentDisabledHint') }}
          </p>
        </div>

        <!-- Notification Section (only for new) -->
        <div v-if="!selectedItem" class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="material-icons text-primary-500">notifications</span>
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('paymentLink.notification') }}</h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Email Option -->
            <label
              class="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all"
              :class="formData.sendEmail
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
            >
              <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" :class="formData.sendEmail ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'">
                <span class="material-icons">email</span>
              </div>
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">{{ $t('paymentLink.sendEmail') }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ formData.customer.email || $t('paymentLink.noEmailEntered') }}</p>
              </div>
              <input v-model="formData.sendEmail" type="checkbox" class="sr-only" />
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="formData.sendEmail ? 'border-primary-500 bg-primary-500' : 'border-gray-300'">
                <span v-if="formData.sendEmail" class="material-icons text-white text-sm">check</span>
              </div>
            </label>

            <!-- SMS Option -->
            <label
              class="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all"
              :class="formData.sendSms
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
            >
              <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" :class="formData.sendSms ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'">
                <span class="material-icons">sms</span>
              </div>
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">{{ $t('paymentLink.sendSms') }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ formData.customer.phone || $t('paymentLink.noPhoneEntered') }}</p>
              </div>
              <input v-model="formData.sendSms" type="checkbox" class="sr-only" />
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="formData.sendSms ? 'border-primary-500 bg-primary-500' : 'border-gray-300'">
                <span v-if="formData.sendSms" class="material-icons text-white text-sm">check</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4 border-t dark:border-slate-700">
          <p class="text-sm text-gray-500 dark:text-slate-400">
            <span class="text-red-500">*</span> {{ $t('misc.requiredFields') }}
          </p>
          <div class="flex gap-3">
            <button type="button" class="btn-secondary" @click="showFormModal = false">
              {{ $t('misc.cancel') }}
            </button>
            <button type="submit" class="btn-primary flex items-center gap-2" :disabled="saving">
              <span v-if="saving" class="material-icons animate-spin text-lg">sync</span>
              <span v-else class="material-icons text-lg">send</span>
              {{ selectedItem ? $t('misc.save') : $t('paymentLink.createAndSend') }}
            </button>
          </div>
        </div>
      </form>
    </Modal>

    <!-- Detail Modal -->
    <Modal v-model="showDetailModal" :title="$t('paymentLink.detail')" size="lg" @close="showDetailModal = false">
      <div v-if="selectedItem">
        <!-- Status Banner -->
        <div class="mb-6 p-4 rounded-lg" :class="{
          'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800': selectedItem.status === 'pending',
          'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800': selectedItem.status === 'viewed',
          'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800': selectedItem.status === 'processing',
          'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800': selectedItem.status === 'paid',
          'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800': ['expired', 'cancelled'].includes(selectedItem.status)
        }">
          <div class="flex items-center gap-3">
            <StatusBadge :status="selectedItem.status" :variant="getStatusVariant(selectedItem.status)" size="lg">
              {{ $t(`paymentLink.status.${selectedItem.status}`) }}
            </StatusBadge>
            <span v-if="selectedItem.paidAt" class="text-sm text-gray-600 dark:text-slate-400">
              {{ formatDate(selectedItem.paidAt) }}
            </span>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{ $t('paymentLink.fields.linkNumber') }}</label>
            <div class="font-mono text-sm mt-1">{{ selectedItem.linkNumber }}</div>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{ $t('paymentLink.fields.amount') }}</label>
            <div class="text-xl font-bold mt-1">{{ formatAmount(selectedItem.amount, selectedItem.currency) }}</div>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{ $t('paymentLink.fields.customer') }}</label>
            <div class="mt-1">
              <div class="font-medium">{{ selectedItem.customer?.name }}</div>
              <div class="text-sm text-gray-500">{{ selectedItem.customer?.email }}</div>
              <div v-if="selectedItem.customer?.phone" class="text-sm text-gray-500">{{ selectedItem.customer?.phone }}</div>
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{ $t('paymentLink.fields.expiresAt') }}</label>
            <div class="mt-1">{{ formatDate(selectedItem.expiresAt) }}</div>
          </div>
          <div class="col-span-2">
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{ $t('paymentLink.fields.description') }}</label>
            <div class="mt-1">{{ selectedItem.description }}</div>
          </div>
        </div>

        <!-- Transaction Info (if paid) -->
        <div v-if="selectedItem.transaction?.gatewayTransactionId" class="mb-6 space-y-4">
          <!-- İşlem Bilgileri -->
          <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 class="font-medium text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
              <span class="material-icons text-lg">check_circle</span>
              {{ $t('paymentLink.transactionInfo') }}
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Transaction ID</label>
                <div class="font-mono text-xs mt-1">{{ selectedItem.transaction.gatewayTransactionId }}</div>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Onay Kodu</label>
                <div class="font-mono mt-1">{{ selectedItem.transaction.authCode || '-' }}</div>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Referans No</label>
                <div class="font-mono mt-1">{{ selectedItem.transaction.refNumber || '-' }}</div>
              </div>
            </div>
          </div>

          <!-- Kart Bilgileri -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 class="font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <span class="material-icons text-lg">credit_card</span>
              {{ $t('paymentLink.cardInfo') }}
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Kart Numarası</label>
                <div class="font-mono mt-1">{{ selectedItem.transaction.maskedCard || `**** **** **** ${selectedItem.transaction.lastFour}` }}</div>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Kart Markası</label>
                <div class="mt-1 flex items-center gap-2">
                  <span class="font-medium">{{ selectedItem.transaction.brand || '-' }}</span>
                  <span v-if="selectedItem.transaction.cardFamily" class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                    {{ selectedItem.transaction.cardFamily }}
                  </span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Kart Tipi</label>
                <div class="mt-1">{{ selectedItem.transaction.cardType === 'credit' ? 'Kredi Kartı' : selectedItem.transaction.cardType === 'debit' ? 'Banka Kartı' : '-' }}</div>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Kart Bankası</label>
                <div class="mt-1">{{ selectedItem.transaction.cardBank || '-' }}</div>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Kart Ülkesi</label>
                <div class="mt-1">{{ getCountryName(selectedItem.transaction.cardCountry) }}</div>
              </div>
              <div v-if="selectedItem.transaction.installmentCount > 1">
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Taksit</label>
                <div class="mt-1 font-medium">{{ selectedItem.transaction.installmentCount }} Taksit</div>
              </div>
            </div>
          </div>

          <!-- POS Bilgileri -->
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h4 class="font-medium text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
              <span class="material-icons text-lg">point_of_sale</span>
              POS Bilgileri
            </h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">POS Adı</label>
                <div class="mt-1">{{ selectedItem.transaction.posName || '-' }}</div>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">POS Bankası</label>
                <div class="mt-1">{{ selectedItem.transaction.posBank || '-' }}</div>
              </div>
            </div>
          </div>

          <!-- Komisyon Bilgileri -->
          <div v-if="selectedItem.transaction.commission" class="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <h4 class="font-medium text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
              <span class="material-icons text-lg">account_balance</span>
              Komisyon Detayları
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Banka Komisyonu</label>
                <div class="mt-1">
                  <span class="font-medium">{{ formatAmount(selectedItem.transaction.commission.bankAmount || 0, selectedItem.currency) }}</span>
                  <span class="text-xs text-gray-500 ml-1">({{ selectedItem.transaction.commission.bankRate || 0 }}%)</span>
                </div>
              </div>
              <div v-if="selectedItem.transaction.commission.platformAmount > 0">
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Platform Komisyonu</label>
                <div class="mt-1">
                  <span class="font-medium">{{ formatAmount(selectedItem.transaction.commission.platformAmount, selectedItem.currency) }}</span>
                  <span class="text-xs text-gray-500 ml-1">({{ selectedItem.transaction.commission.platformRate || 0 }}%)</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Toplam Kesinti</label>
                <div class="mt-1 font-medium text-orange-600 dark:text-orange-400">
                  {{ formatAmount(selectedItem.transaction.commission.totalAmount || 0, selectedItem.currency) }}
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">Net Tutar</label>
                <div class="mt-1 font-bold text-green-600 dark:text-green-400">
                  {{ formatAmount(selectedItem.transaction.commission.netAmount || selectedItem.amount, selectedItem.currency) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment URL -->
        <div v-if="['pending', 'viewed'].includes(selectedItem.status)" class="mb-6">
          <label class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{ $t('paymentLink.paymentUrl') }}</label>
          <div class="flex items-center gap-2 mt-1">
            <input :value="selectedItem.paymentUrl" readonly class="form-input flex-1 text-sm font-mono" />
            <button class="btn-secondary" @click="copyLink(selectedItem)">
              <span class="material-icons text-sm">content_copy</span>
            </button>
          </div>
        </div>

        <!-- Resend Notification -->
        <div v-if="['pending', 'viewed'].includes(selectedItem.status)" class="mb-6">
          <label class="text-xs text-gray-500 dark:text-slate-400 uppercase mb-2 block">{{ $t('paymentLink.resendNotification') }}</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="selectedItem.customer?.email"
              class="btn-secondary flex items-center gap-2"
              @click="resendNotification(selectedItem, 'email')"
            >
              <span class="material-icons text-sm text-blue-500">email</span>
              {{ $t('paymentLink.resendEmail') }}
              <span class="text-xs text-gray-400">({{ selectedItem.customer.email }})</span>
            </button>
            <button
              v-if="selectedItem.customer?.phone"
              class="btn-secondary flex items-center gap-2"
              @click="resendNotification(selectedItem, 'sms')"
            >
              <span class="material-icons text-sm text-purple-500">sms</span>
              {{ $t('paymentLink.resendSms') }}
              <span class="text-xs text-gray-400">({{ selectedItem.customer.phone }})</span>
            </button>
            <span v-if="!selectedItem.customer?.email && !selectedItem.customer?.phone" class="text-sm text-gray-400 italic">
              {{ $t('paymentLink.noContactInfo') }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
          <button type="button" class="btn-secondary" @click="showDetailModal = false">
            {{ $t('misc.close') }}
          </button>
          <button v-if="['pending', 'viewed'].includes(selectedItem.status)" class="btn-primary" @click="showDetailModal = false; openEditModal(selectedItem)">
            <span class="material-icons text-sm mr-1">edit</span>
            {{ $t('misc.edit') }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      @confirm="confirmDialog.action"
      @cancel="confirmDialog.show = false"
    />
  </div>
</template>
