<template>
  <div>
    <ModuleNavigation :items="navItems" color="purple" />

    <div class="p-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-green-500">check_circle</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active }}</div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('membership.assignments.stats.active') }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-amber-500">pending</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.pending }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('membership.assignments.stats.pending') }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-orange-500">schedule</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.expiringSoon }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('membership.assignments.stats.expiringSoon') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <input
              v-model="filters.search"
              type="text"
              class="form-input w-full"
              :placeholder="$t('common.search') + '...'"
            />
          </div>
          <select v-model="filters.status" class="form-input w-36">
            <option value="">{{ $t('common.allStatuses') }}</option>
            <option value="pending">{{ $t('membership.statuses.pending') }}</option>
            <option value="active">{{ $t('membership.statuses.active') }}</option>
            <option value="expired">{{ $t('membership.statuses.expired') }}</option>
            <option value="cancelled">{{ $t('membership.statuses.cancelled') }}</option>
          </select>
          <select v-model="filters.purchaseType" class="form-input w-36">
            <option value="">{{ $t('common.all') }}</option>
            <option value="package">
              {{ $t('membership.assignments.purchaseTypes.package') }}
            </option>
            <option value="service">
              {{ $t('membership.assignments.purchaseTypes.service') }}
            </option>
            <option value="legacy">{{ $t('membership.assignments.purchaseTypes.legacy') }}</option>
          </select>
          <div class="flex gap-2">
            <button class="btn-primary" @click="showAssignModal = true">
              <span class="material-icons text-sm mr-1">add</span>
              {{ $t('membership.assignments.assignPackage') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div v-if="loading" class="p-8 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"
          ></div>
        </div>

        <div v-else-if="filteredPurchases.length === 0" class="p-8 text-center">
          <span class="material-icons text-4xl text-gray-400">assignment</span>
          <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('common.noData') }}</p>
        </div>

        <table v-else class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.assignments.partner') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('common.type') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.assignments.package') }} /
                {{ $t('membership.assignments.service') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.assignments.period') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.assignments.price') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.assignments.status') }}
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr
              v-for="item in filteredPurchases"
              :key="item.purchase._id"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/30"
              :class="{ 'bg-amber-50 dark:bg-amber-900/10': item.purchase.status === 'pending' }"
            >
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ item.partner.companyName }}
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400">
                  {{ item.partner.email }}
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="badge"
                  :class="{
                    'badge-primary': item.purchase.purchaseType === 'package',
                    'badge-info': item.purchase.purchaseType === 'service',
                    'badge-secondary':
                      !item.purchase.purchaseType || item.purchase.purchaseType === 'legacy'
                  }"
                >
                  {{
                    $t(
                      `membership.assignments.purchaseTypes.${item.purchase.purchaseType || 'legacy'}`
                    )
                  }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ item.purchase.planName || item.purchase.plan || '-' }}
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
                  {{ $t(`membership.statuses.${item.purchase.status}`) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button
                    v-if="item.purchase.status === 'pending'"
                    class="p-2 text-green-600 hover:text-green-700 dark:text-green-400"
                    :title="$t('membership.assignments.markAsPaid')"
                    @click="openMarkPaidModal(item)"
                  >
                    <span class="material-icons text-xl">check_circle</span>
                  </button>
                  <button
                    v-if="['pending', 'active'].includes(item.purchase.status)"
                    class="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                    :title="$t('membership.assignments.cancel')"
                    @click="handleCancel(item)"
                  >
                    <span class="material-icons text-xl">cancel</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Assign Package Modal -->
    <Modal v-model="showAssignModal" :title="$t('membership.assignments.assignPackage')" size="lg">
      <div class="space-y-4">
        <div>
          <label class="form-label">{{ $t('membership.assignments.partner') }} *</label>
          <select v-model="assignForm.partnerId" class="form-input">
            <option value="">{{ $t('common.select') }}...</option>
            <option v-for="p in partners" :key="p._id" :value="p._id">
              {{ p.companyName }} ({{ p.email }})
            </option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ $t('membership.assignments.package') }} *</label>
          <select v-model="assignForm.packageId" class="form-input">
            <option value="">{{ $t('common.select') }}...</option>
            <option v-for="pkg in activePackages" :key="pkg._id" :value="pkg._id">
              {{ pkg.name?.tr }} ({{ pkg.code }})
            </option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('membership.assignments.startDate') }}</label>
            <input v-model="assignForm.startDate" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">{{ $t('membership.assignments.endDate') }}</label>
            <input v-model="assignForm.endDate" type="date" class="form-input" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('membership.assignments.amount') }}</label>
            <input
              v-model.number="assignForm.amount"
              type="number"
              step="0.01"
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label">{{ $t('membership.assignments.currency') }}</label>
            <select v-model="assignForm.currency" class="form-input">
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showAssignModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          class="btn-primary"
          :disabled="processing || !assignForm.partnerId || !assignForm.packageId"
          @click="handleAssign"
        >
          <span v-if="processing">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('membership.assignments.assignPackage') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Mark as Paid Modal -->
    <Modal v-model="showMarkPaidModal" :title="$t('membership.assignments.markAsPaid')" size="md">
      <div v-if="selectedItem" class="space-y-4">
        <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div class="font-medium text-gray-900 dark:text-white">
            {{ selectedItem.partner.companyName }}
          </div>
          <div class="text-sm text-gray-500 dark:text-slate-400">
            {{ selectedItem.purchase.planName }} -
            {{
              formatCurrency(
                selectedItem.purchase.price?.amount,
                selectedItem.purchase.price?.currency
              )
            }}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('membership.assignments.startDate') }} *</label>
            <input v-model="markPaidForm.paymentDate" type="date" class="form-input" required />
          </div>
          <div>
            <label class="form-label">{{ $t('membership.assignments.paymentMethod') }}</label>
            <select v-model="markPaidForm.paymentMethod" class="form-input">
              <option value="bank_transfer">
                {{ $t('partners.subscription.methods.bankTransfer') }}
              </option>
              <option value="credit_card">
                {{ $t('partners.subscription.methods.creditCard') }}
              </option>
              <option value="cash">{{ $t('partners.subscription.methods.cash') }}</option>
              <option value="other">{{ $t('partners.subscription.methods.other') }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="form-label">{{ $t('membership.assignments.notes') }}</label>
          <input v-model="markPaidForm.paymentNotes" type="text" class="form-input" />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showMarkPaidModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          class="btn-primary"
          :disabled="processing || !markPaidForm.paymentDate"
          @click="handleMarkAsPaid"
        >
          <span v-if="processing">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('membership.assignments.markAsPaid') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import Modal from '@/components/common/Modal.vue'
import partnerService from '@/services/partnerService'
import { getMembershipPackages, assignPackageToPartner } from '@/services/membershipPackageService'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const navItems = computed(() => [
  {
    name: 'services',
    to: '/membership/services',
    icon: 'layers',
    label: t('membership.nav.services')
  },
  {
    name: 'packages',
    to: '/membership/packages',
    icon: 'inventory_2',
    label: t('membership.nav.packages')
  },
  {
    name: 'assignments',
    to: '/membership/assignments',
    icon: 'assignment',
    label: t('membership.nav.assignments')
  }
])

const loading = ref(true)
const processing = ref(false)
const allPurchases = ref([])
const partners = ref([])
const activePackages = ref([])
const filters = ref({ search: '', status: '', purchaseType: '' })

// Modals
const showAssignModal = ref(false)
const showMarkPaidModal = ref(false)
const selectedItem = ref(null)

const assignForm = ref({
  partnerId: '',
  packageId: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  amount: null,
  currency: 'TRY'
})

const markPaidForm = ref({
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'bank_transfer',
  paymentNotes: ''
})

// Computed
const stats = computed(() => {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  return {
    active: allPurchases.value.filter(p => p.purchase.status === 'active').length,
    pending: allPurchases.value.filter(p => p.purchase.status === 'pending').length,
    expiringSoon: allPurchases.value.filter(
      p =>
        p.purchase.status === 'active' &&
        p.purchase.period?.endDate &&
        new Date(p.purchase.period.endDate) <= thirtyDaysFromNow
    ).length
  }
})

const filteredPurchases = computed(() => {
  return allPurchases.value.filter(item => {
    if (filters.value.search) {
      const s = filters.value.search.toLowerCase()
      if (
        !item.partner.companyName?.toLowerCase().includes(s) &&
        !item.partner.email?.toLowerCase().includes(s)
      )
        return false
    }
    if (filters.value.status && item.purchase.status !== filters.value.status) return false
    if (filters.value.purchaseType) {
      const pt = item.purchase.purchaseType || 'legacy'
      if (pt !== filters.value.purchaseType) return false
    }
    return true
  })
})

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

const formatCurrency = (amount, currency = 'TRY') => {
  if (amount == null) return '-'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount)
}

const fetchData = async () => {
  loading.value = true
  try {
    const [purchasesRes, partnersRes, packagesRes] = await Promise.all([
      partnerService.getAllPurchases(),
      partnerService.getPartners({ limit: 500 }),
      getMembershipPackages({ status: 'active' })
    ])
    allPurchases.value = purchasesRes.data || []
    partners.value = partnersRes.data || partnersRes.data?.items || []
    activePackages.value = packagesRes.data || []
  } catch {
    toast.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

const handleAssign = async () => {
  processing.value = true
  try {
    await assignPackageToPartner(assignForm.value.partnerId, {
      packageId: assignForm.value.packageId,
      startDate: assignForm.value.startDate || undefined,
      endDate: assignForm.value.endDate || undefined,
      amount: assignForm.value.amount,
      currency: assignForm.value.currency
    })
    toast.success(t('membership.assignments.assigned'))
    showAssignModal.value = false
    await fetchData()
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.error'))
  } finally {
    processing.value = false
  }
}

const openMarkPaidModal = item => {
  selectedItem.value = item
  markPaidForm.value = {
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    paymentNotes: ''
  }
  showMarkPaidModal.value = true
}

const handleMarkAsPaid = async () => {
  if (!selectedItem.value) return
  processing.value = true
  try {
    await partnerService.markPurchaseAsPaid(
      selectedItem.value.partner._id,
      selectedItem.value.purchase._id,
      markPaidForm.value
    )
    toast.success(t('common.success'))
    showMarkPaidModal.value = false
    await fetchData()
  } catch {
    toast.error(t('common.error'))
  } finally {
    processing.value = false
  }
}

const handleCancel = async item => {
  if (!confirm(t('common.confirmDelete'))) return
  try {
    await partnerService.cancelPurchase(item.partner._id, item.purchase._id, 'Admin cancelled')
    toast.success(t('common.success'))
    await fetchData()
  } catch {
    toast.error(t('common.error'))
  }
}

onMounted(fetchData)
</script>
