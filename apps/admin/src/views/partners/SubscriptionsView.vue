<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t('partnerSubscriptions.title') }}
        </h1>
        <p class="text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('partnerSubscriptions.description') }}
        </p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <span class="material-icons text-amber-500">pending</span>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.pending }}</div>
            <div class="text-sm text-gray-500 dark:text-slate-400">{{ $t('partnerSubscriptions.pendingPayments') }}</div>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span class="material-icons text-green-500">check_circle</span>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active }}</div>
            <div class="text-sm text-gray-500 dark:text-slate-400">{{ $t('partnerSubscriptions.activePackages') }}</div>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span class="material-icons text-red-500">event_busy</span>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.expired }}</div>
            <div class="text-sm text-gray-500 dark:text-slate-400">{{ $t('partnerSubscriptions.expiredPackages') }}</div>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span class="material-icons text-blue-500">attach_money</span>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">${{ stats.totalPending.toFixed(2) }}</div>
            <div class="text-sm text-gray-500 dark:text-slate-400">{{ $t('partnerSubscriptions.pendingAmount') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <input
            v-model="filters.search"
            type="text"
            class="form-input w-full"
            :placeholder="$t('partnerSubscriptions.searchPlaceholder')"
          />
        </div>
        <!-- Status Filter -->
        <select v-model="filters.status" class="form-input w-40">
          <option value="">{{ $t('partnerSubscriptions.allStatuses') }}</option>
          <option value="pending">{{ $t('partnerSubscriptions.status.pending') }}</option>
          <option value="active">{{ $t('partnerSubscriptions.status.active') }}</option>
          <option value="expired">{{ $t('partnerSubscriptions.status.expired') }}</option>
          <option value="cancelled">{{ $t('partnerSubscriptions.status.cancelled') }}</option>
        </select>
        <!-- Plan Filter -->
        <select v-model="filters.plan" class="form-input w-40">
          <option value="">{{ $t('partnerSubscriptions.allPlans') }}</option>
          <option value="webdesign">Web Design</option>
          <option value="business">Business</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
    </div>

    <!-- Purchases Table -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</p>
      </div>

      <div v-else-if="filteredPurchases.length === 0" class="p-8 text-center">
        <span class="material-icons text-4xl text-gray-400 dark:text-slate-500">inventory_2</span>
        <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('partnerSubscriptions.noPurchases') }}</p>
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50 dark:bg-slate-700/50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
              {{ $t('partnerSubscriptions.partner') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
              {{ $t('partnerSubscriptions.plan') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
              {{ $t('partnerSubscriptions.period') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
              {{ $t('partnerSubscriptions.amount') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
              {{ $t('partnerSubscriptions.status') }}
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
              {{ $t('common.actions') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
          <tr
            v-for="item in filteredPurchases"
            :key="item.purchase._id"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/30"
            :class="{
              'bg-amber-50 dark:bg-amber-900/10': item.purchase.status === 'pending'
            }"
          >
            <td class="px-4 py-3">
              <div class="font-medium text-gray-900 dark:text-white">{{ item.partner.companyName }}</div>
              <div class="text-sm text-gray-500 dark:text-slate-400">{{ item.partner.email }}</div>
            </td>
            <td class="px-4 py-3">
              <span
                class="badge"
                :class="{
                  'badge-secondary': item.purchase.plan === 'webdesign',
                  'badge-info': item.purchase.plan === 'business',
                  'badge-primary': item.purchase.plan === 'professional',
                  'badge-success': item.purchase.plan === 'enterprise'
                }"
              >
                {{ item.purchase.planName }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-gray-900 dark:text-white">
                {{ formatDate(item.purchase.period?.startDate) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-slate-400">
                {{ formatDate(item.purchase.period?.endDate) }}
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ formatCurrency(item.purchase.price?.amount, item.purchase.price?.currency) }}
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                class="badge"
                :class="{
                  'badge-warning': item.purchase.status === 'pending',
                  'badge-success': item.purchase.status === 'active',
                  'badge-secondary': item.purchase.status === 'expired',
                  'badge-danger': item.purchase.status === 'cancelled'
                }"
              >
                {{ $t(`partnerSubscriptions.status.${item.purchase.status}`) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <!-- Mark as Paid -->
                <button
                  v-if="item.purchase.status === 'pending'"
                  class="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  :title="$t('partnerSubscriptions.markAsPaid')"
                  @click="openMarkPaidModal(item)"
                >
                  <span class="material-icons text-xl">check_circle</span>
                </button>
                <!-- Edit -->
                <button
                  v-if="['pending', 'active'].includes(item.purchase.status)"
                  class="p-2 text-gray-600 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
                  :title="$t('partnerSubscriptions.edit')"
                  @click="openEditModal(item)"
                >
                  <span class="material-icons text-xl">edit</span>
                </button>
                <!-- Cancel -->
                <button
                  v-if="['pending', 'active'].includes(item.purchase.status)"
                  class="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  :title="$t('partnerSubscriptions.cancel')"
                  @click="confirmCancel(item)"
                >
                  <span class="material-icons text-xl">cancel</span>
                </button>
                <!-- View Partner -->
                <button
                  class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  :title="$t('partnerSubscriptions.viewPartner')"
                  @click="goToPartner(item.partner._id)"
                >
                  <span class="material-icons text-xl">open_in_new</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mark as Paid Modal -->
    <Modal v-model="showMarkPaidModal" :title="$t('partnerSubscriptions.markAsPaid')" size="md">
      <div v-if="selectedItem" class="space-y-4">
        <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div class="font-medium text-gray-900 dark:text-white">{{ selectedItem.partner.companyName }}</div>
          <div class="text-sm text-gray-500 dark:text-slate-400">
            {{ selectedItem.purchase.planName }} - {{ formatCurrency(selectedItem.purchase.price?.amount, selectedItem.purchase.price?.currency) }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('partnerSubscriptions.paymentDate') }} *</label>
            <input v-model="markPaidForm.paymentDate" type="date" class="form-input" required />
          </div>
          <div>
            <label class="form-label">{{ $t('partnerSubscriptions.paymentMethod') }}</label>
            <select v-model="markPaidForm.paymentMethod" class="form-input">
              <option value="bank_transfer">{{ $t('partners.subscription.methods.bankTransfer') }}</option>
              <option value="credit_card">{{ $t('partners.subscription.methods.creditCard') }}</option>
              <option value="cash">{{ $t('partners.subscription.methods.cash') }}</option>
              <option value="other">{{ $t('partners.subscription.methods.other') }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="form-label">{{ $t('partnerSubscriptions.reference') }}</label>
          <input v-model="markPaidForm.paymentReference" type="text" class="form-input" :placeholder="$t('partners.subscription.referencePlaceholder')" />
        </div>
        <div>
          <label class="form-label">{{ $t('partnerSubscriptions.notes') }}</label>
          <input v-model="markPaidForm.paymentNotes" type="text" class="form-input" />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showMarkPaidModal = false">{{ $t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="processing || !markPaidForm.paymentDate" @click="handleMarkAsPaid">
          <span v-if="processing">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('partnerSubscriptions.confirmPayment') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Edit Modal -->
    <Modal v-model="showEditModal" :title="$t('partnerSubscriptions.editPackage')" size="lg">
      <div v-if="selectedItem" class="space-y-4">
        <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div class="font-medium text-gray-900 dark:text-white">{{ selectedItem.partner.companyName }}</div>
        </div>

        <div>
          <label class="form-label">{{ $t('partnerSubscriptions.plan') }}</label>
          <select v-model="editForm.plan" class="form-input">
            <option value="webdesign">Web Design - $29/{{ $t('common.year') }}</option>
            <option value="business">Business - $118.9/{{ $t('common.year') }}</option>
            <option value="professional">Professional - $178.8/{{ $t('common.year') }}</option>
            <option value="enterprise">Enterprise - $298.8/{{ $t('common.year') }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('partnerSubscriptions.startDate') }}</label>
            <input v-model="editForm.startDate" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">{{ $t('partnerSubscriptions.endDate') }}</label>
            <input v-model="editForm.endDate" type="date" class="form-input" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('partnerSubscriptions.amount') }}</label>
            <input v-model.number="editForm.amount" type="number" step="0.01" class="form-input" />
          </div>
          <div>
            <label class="form-label">{{ $t('partnerSubscriptions.currency') }}</label>
            <select v-model="editForm.currency" class="form-input">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TRY">TRY</option>
            </select>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showEditModal = false">{{ $t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="processing" @click="handleUpdate">
          <span v-if="processing">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.save') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import partnerService from '@/services/partnerService'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()

// State
const loading = ref(true)
const processing = ref(false)
const allPurchases = ref([])

// Filters
const filters = ref({
  search: '',
  status: '',
  plan: ''
})

// Modals
const showMarkPaidModal = ref(false)
const showEditModal = ref(false)
const selectedItem = ref(null)

const markPaidForm = ref({
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'bank_transfer',
  paymentReference: '',
  paymentNotes: ''
})

const editForm = ref({
  plan: '',
  startDate: '',
  endDate: '',
  amount: null,
  currency: 'USD'
})

// Computed
const stats = computed(() => {
  const pending = allPurchases.value.filter(p => p.purchase.status === 'pending')
  return {
    pending: pending.length,
    active: allPurchases.value.filter(p => p.purchase.status === 'active').length,
    expired: allPurchases.value.filter(p => p.purchase.status === 'expired').length,
    totalPending: pending.reduce((sum, p) => sum + (p.purchase.price?.amount || 0), 0)
  }
})

const filteredPurchases = computed(() => {
  return allPurchases.value.filter(item => {
    // Search filter
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      const matchesCompany = item.partner.companyName?.toLowerCase().includes(search)
      const matchesEmail = item.partner.email?.toLowerCase().includes(search)
      if (!matchesCompany && !matchesEmail) return false
    }
    // Status filter
    if (filters.value.status && item.purchase.status !== filters.value.status) {
      return false
    }
    // Plan filter
    if (filters.value.plan && item.purchase.plan !== filters.value.plan) {
      return false
    }
    return true
  })
})

// Methods
const fetchAllPurchases = async () => {
  loading.value = true
  try {
    const response = await partnerService.getAllPurchases()
    allPurchases.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch purchases:', error)
    toast.error(t('partnerSubscriptions.loadError'))
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

const formatCurrency = (amount, currency = 'USD') => {
  if (amount == null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

const openMarkPaidModal = (item) => {
  selectedItem.value = item
  markPaidForm.value = {
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paymentNotes: ''
  }
  showMarkPaidModal.value = true
}

const openEditModal = (item) => {
  selectedItem.value = item
  const formatDateForInput = (date) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }
  editForm.value = {
    plan: item.purchase.plan,
    startDate: formatDateForInput(item.purchase.period?.startDate),
    endDate: formatDateForInput(item.purchase.period?.endDate),
    amount: item.purchase.price?.amount,
    currency: item.purchase.price?.currency || 'USD'
  }
  showEditModal.value = true
}

const handleMarkAsPaid = async () => {
  if (!selectedItem.value || !markPaidForm.value.paymentDate) return

  processing.value = true
  try {
    await partnerService.markPurchaseAsPaid(
      selectedItem.value.partner._id,
      selectedItem.value.purchase._id,
      markPaidForm.value
    )
    toast.success(t('partnerSubscriptions.paymentConfirmed'))
    showMarkPaidModal.value = false
    await fetchAllPurchases()
  } catch (error) {
    console.error('Failed to mark as paid:', error)
    toast.error(t('partnerSubscriptions.paymentError'))
  } finally {
    processing.value = false
  }
}

const handleUpdate = async () => {
  if (!selectedItem.value) return

  processing.value = true
  try {
    await partnerService.updatePurchase(
      selectedItem.value.partner._id,
      selectedItem.value.purchase._id,
      editForm.value
    )
    toast.success(t('partnerSubscriptions.updateSuccess'))
    showEditModal.value = false
    await fetchAllPurchases()
  } catch (error) {
    console.error('Failed to update:', error)
    toast.error(t('partnerSubscriptions.updateError'))
  } finally {
    processing.value = false
  }
}

const confirmCancel = async (item) => {
  if (!confirm(t('partnerSubscriptions.cancelConfirm'))) return

  try {
    await partnerService.cancelPurchase(item.partner._id, item.purchase._id, 'Admin tarafından iptal edildi')
    toast.success(t('partnerSubscriptions.cancelSuccess'))
    await fetchAllPurchases()
  } catch (error) {
    console.error('Failed to cancel:', error)
    toast.error(t('partnerSubscriptions.cancelError'))
  }
}

const goToPartner = (partnerId) => {
  router.push({ name: 'partners', query: { id: partnerId, tab: 'subscription' } })
}

onMounted(() => {
  fetchAllPurchases()
})
</script>
