<template>
  <Modal
    v-model="isOpen"
    :title="$t('partners.subscription.title')"
    size="xl"
    content-class="!p-0 !overflow-hidden"
    :close-on-overlay="false"
  >
    <template #default>
      <!-- Partner Banner -->
      <div
        v-if="partner"
        class="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-slate-700"
      >
        <div
          class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <span class="text-purple-600 dark:text-purple-400 font-semibold text-lg">
            {{ partner?.companyName?.charAt(0)?.toUpperCase() }}
          </span>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {{ partner?.companyName }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-slate-400">{{ partner?.email }}</p>
        </div>
        <span
          v-if="subscriptionStatus"
          class="badge flex-shrink-0"
          :class="{
            'badge-success': subscriptionStatus?.status === 'active',
            'badge-warning': subscriptionStatus?.status === 'grace_period',
            'badge-danger':
              subscriptionStatus?.status === 'expired' ||
              subscriptionStatus?.status === 'suspended',
            'badge-secondary': subscriptionStatus?.status === 'cancelled'
          }"
        >
          {{
            subscriptionStatusMap[subscriptionStatus?.status]?.label || subscriptionStatus?.status
          }}
        </span>
        <span
          v-if="subscriptionStatus?.remainingDays != null"
          class="text-xs text-gray-500 dark:text-slate-400 flex-shrink-0"
        >
          {{ subscriptionStatus.remainingDays }} {{ $t('partners.subscription.daysLeft') }}
        </span>
      </div>

      <!-- Tabs -->
      <div class="px-6 py-3 border-b border-gray-200 dark:border-slate-700">
        <Tabs v-model="activeTab" :tabs="tabs" variant="boxed" color="purple" size="sm" />
      </div>

      <!-- Tab Content -->
      <PlanSelectionTab
        v-show="activeTab === 'plan'"
        :subscription-status="subscriptionStatus"
        :current-package-name="currentPackageName"
        :packages="availablePackages"
        :services="availableServices"
        :selected-package-id="cart.packageId"
        :selected-package="selectedPackageObj"
        :selected-services="selectedServiceObjs"
        :selected-service-ids="cart.serviceIds"
        :package-service-codes="packageServiceCodes"
        :currency="cart.currency"
        :interval="cart.interval"
        :total="cartTotal"
        :loading="loadingData"
        :submitting="submitting"
        @package-select="handlePackageSelect"
        @service-toggle="handleServiceToggle"
        @send-payment-link="handleAction('send_link')"
        @save-pending="handleAction('save_pending')"
        @mark-paid="handleAction('mark_paid')"
        @currency-change="cart.currency = $event"
        @interval-change="cart.interval = $event"
      />

      <PurchaseHistoryTab
        v-show="activeTab === 'history'"
        :purchases="enrichedPurchases"
        :invoices="subscriptionStatus?.invoices || []"
        @mark-paid="openMarkPaidModal"
        @edit="openEditPurchaseModal"
        @download-invoice="inv => downloadInvoice(inv._id, inv.invoiceNumber)"
        @cancel="handleCancelPurchase"
      />

      <SettingsTab
        v-show="activeTab === 'settings'"
        :use-custom-pms-limit="useCustomPmsLimit"
        :custom-limits="settingsForm.customLimits"
        :pms-status="subscriptionStatus?.pmsStatus"
        :notes="settingsForm.notes"
        :saving="savingSettings"
        @update:use-custom-pms-limit="useCustomPmsLimit = $event"
        @update:custom-limits-pms-max-hotels="settingsForm.customLimits.pmsMaxHotels = $event"
        @update:notes="settingsForm.notes = $event"
        @save="handleSaveSettings"
      />
    </template>
  </Modal>

  <!-- Edit Purchase Modal -->
  <Modal v-model="showEditModal" :title="$t('partners.subscription.editPurchase')" size="lg">
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('partners.subscription.startDate') }}</label>
          <input v-model="editForm.startDate" type="date" class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ $t('partners.subscription.endDate') }}</label>
          <input v-model="editForm.endDate" type="date" class="form-input" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('partners.subscription.amount') }}</label>
          <input v-model.number="editForm.amount" type="number" step="0.01" class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ $t('partners.subscription.currency') }}</label>
          <select v-model="editForm.currency" class="form-input">
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">{{ $t('partners.subscription.method') }}</label>
          <select v-model="editForm.paymentMethod" class="form-input">
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
        <div>
          <label class="form-label">{{ $t('partners.subscription.reference') }}</label>
          <input v-model="editForm.paymentReference" type="text" class="form-input" />
        </div>
      </div>
    </div>
    <template #footer>
      <button class="btn-secondary" @click="showEditModal = false">
        {{ $t('common.cancel') }}
      </button>
      <button class="btn-primary" :disabled="updatingPurchase" @click="handleUpdatePurchase">
        {{ updatingPurchase ? $t('common.loading') : $t('common.save') }}
      </button>
    </template>
  </Modal>

  <!-- Mark Paid Modal -->
  <Modal v-model="showMarkPaidModalLocal" :title="$t('partners.subscription.markAsPaid')" size="md">
    <div class="space-y-4">
      <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <p class="text-sm text-amber-800 dark:text-amber-200">
          {{ $t('partners.subscription.markAsPaidInfo') }}
        </p>
      </div>
      <div>
        <label class="form-label">{{ $t('partners.subscription.paymentDate') }} *</label>
        <input v-model="markPaidForm.paymentDate" type="date" class="form-input" required />
      </div>
      <div>
        <label class="form-label">{{ $t('partners.subscription.method') }}</label>
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
      <div>
        <label class="form-label">{{ $t('partners.subscription.reference') }}</label>
        <input
          v-model="markPaidForm.paymentReference"
          type="text"
          class="form-input"
          :placeholder="$t('partners.subscription.referencePlaceholder')"
        />
      </div>
    </div>
    <template #footer>
      <button class="btn-secondary" @click="showMarkPaidModalLocal = false">
        {{ $t('common.cancel') }}
      </button>
      <button
        class="btn-success"
        :disabled="markingPaid || !markPaidForm.paymentDate"
        @click="handleMarkAsPaid"
      >
        {{ markingPaid ? $t('common.loading') : $t('partners.subscription.confirmPayment') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import Tabs from '@/components/ui/navigation/Tabs.vue'
import PlanSelectionTab from './subscription-modal/PlanSelectionTab.vue'
import PurchaseHistoryTab from './subscription-modal/PurchaseHistoryTab.vue'
import SettingsTab from './subscription-modal/SettingsTab.vue'
import partnerService from '@/services/partnerService'
import membershipPackageService from '@/services/membershipPackageService'
import membershipServiceService from '@/services/membershipServiceService'
import { formatDate, formatCurrency } from '@booking-engine/utils'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  partner: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'updated'])

// Modal open/close
const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

// State
const activeTab = ref('plan')
const loadingData = ref(false)
const submitting = ref(false)
const savingSettings = ref(false)
const updatingPurchase = ref(false)
const markingPaid = ref(false)

// Data
const subscriptionStatus = ref(null)
const availablePackages = ref([])
const availableServices = ref([])

// Cart
const cart = ref({
  packageId: null,
  serviceIds: [],
  currency: 'TRY',
  interval: 'yearly'
})

// Settings form
const useCustomPmsLimit = ref(false)
const settingsForm = ref({
  customLimits: { pmsMaxHotels: null },
  notes: ''
})

// Edit purchase modal
const showEditModal = ref(false)
const editForm = ref({
  purchaseId: null,
  startDate: '',
  endDate: '',
  amount: 0,
  currency: 'TRY',
  paymentMethod: 'bank_transfer',
  paymentReference: ''
})

// Mark paid modal
const showMarkPaidModalLocal = ref(false)
const markPaidForm = ref({
  purchaseId: null,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'bank_transfer',
  paymentReference: ''
})

// Subscription status map
const subscriptionStatusMap = computed(() => ({
  active: { label: t('partners.subscription.statusActive') },
  expired: { label: t('partners.subscription.statusExpired') },
  grace_period: { label: t('partners.subscription.statusGracePeriod') },
  cancelled: { label: t('partners.subscription.statusCancelled') },
  suspended: { label: t('partners.subscription.statusSuspended') }
}))

const tabs = computed(() => [
  { value: 'plan', label: t('partners.subscription.selectTab') },
  { value: 'history', label: t('partners.subscription.historyTab') },
  { value: 'settings', label: t('partners.subscription.settingsTab') }
])

// Computed - selected objects
const selectedPackageObj = computed(
  () => availablePackages.value.find(p => p._id === cart.value.packageId) || null
)

const selectedServiceObjs = computed(() =>
  availableServices.value.filter(s => cart.value.serviceIds.includes(s._id))
)

const packageServiceCodes = computed(() => {
  if (!selectedPackageObj.value) return []
  return (selectedPackageObj.value.services || [])
    .map(s => s.service?.code || s.code)
    .filter(Boolean)
})

const currentPackageName = computed(() => {
  if (!subscriptionStatus.value?.plan) return null
  const plan = subscriptionStatus.value.plan
  if (['webdesign', 'business', 'professional', 'enterprise'].includes(plan)) {
    return t(`partners.subscription.plans.${plan}`)
  }
  const pkg = availablePackages.value.find(p => p._id === subscriptionStatus.value.currentPackageId)
  return pkg?.name?.tr || pkg?.name?.en || plan
})

// Enriched purchases (with plan display names for PurchaseHistoryTab)
const enrichedPurchases = computed(() => {
  const purchases = subscriptionStatus.value?.purchases || []
  return purchases.map(p => ({
    ...p,
    planDisplayName: p.plan ? t(`partners.subscription.plans.${p.plan}`) : null
  }))
})

// Cart total
const cartTotal = computed(() => {
  let total = 0
  if (selectedPackageObj.value) {
    const priceObj = selectedPackageObj.value.pricing?.prices?.find(
      p => p.currency === cart.value.currency
    )
    total += priceObj?.amount ?? 0
  }
  for (const svc of selectedServiceObjs.value) {
    if (!packageServiceCodes.value.includes(svc.code)) {
      const priceObj = svc.pricing?.prices?.find(p => p.currency === cart.value.currency)
      total += priceObj?.amount ?? 0
    }
  }
  return total
})

// Load data when partner changes
watch(
  () => props.partner?._id,
  async newId => {
    if (newId && props.modelValue) {
      await loadData()
    }
  }
)

watch(
  () => props.modelValue,
  async isVisible => {
    if (isVisible && props.partner?._id) {
      activeTab.value = 'plan'
      cart.value = { packageId: null, serviceIds: [], currency: 'TRY', interval: 'yearly' }
      await loadData()
    }
  }
)

async function loadData() {
  loadingData.value = true
  try {
    const [subRes, pkgRes, svcRes] = await Promise.all([
      partnerService.getSubscription(props.partner._id),
      membershipPackageService.getMembershipPackages({ status: 'active' }),
      membershipServiceService.getMembershipServices({ status: 'active' })
    ])

    subscriptionStatus.value = subRes.data
    availablePackages.value = pkgRes.data?.items || pkgRes.data || []
    availableServices.value = svcRes.data?.items || svcRes.data || []

    // Settings form init
    const sub = subscriptionStatus.value
    settingsForm.value.notes = sub?.notes || ''
    settingsForm.value.customLimits.pmsMaxHotels = sub?.customLimits?.pmsMaxHotels ?? null
    useCustomPmsLimit.value = sub?.customLimits?.pmsMaxHotels != null

    // Pre-select current package
    if (sub?.currentPackageId) {
      cart.value.packageId = sub.currentPackageId
    }
  } catch (err) {
    console.error('Failed to load subscription data:', err)
  } finally {
    loadingData.value = false
  }
}

// Handlers
function handlePackageSelect(packageId) {
  cart.value.packageId = cart.value.packageId === packageId ? null : packageId
}

function handleServiceToggle(serviceId) {
  const idx = cart.value.serviceIds.indexOf(serviceId)
  if (idx === -1) {
    cart.value.serviceIds.push(serviceId)
  } else {
    cart.value.serviceIds.splice(idx, 1)
  }
}

async function handleAction(action) {
  if (!cart.value.packageId && cart.value.serviceIds.length === 0) return

  submitting.value = true
  try {
    const data = {
      packageId: cart.value.packageId,
      serviceIds: cart.value.serviceIds.filter(id => {
        const svc = availableServices.value.find(s => s._id === id)
        return svc && !packageServiceCodes.value.includes(svc.code)
      }),
      currency: cart.value.currency,
      interval: cart.value.interval,
      action
    }

    const result = await partnerService.createPurchaseWithPaymentLink(props.partner._id, data)

    if (action === 'send_link' && result.data?.paymentLink?.paymentUrl) {
      toast.success(t('partners.subscription.paymentLinkSent'))
    } else if (action === 'mark_paid') {
      toast.success(t('partners.subscription.updateSuccess'))
    } else {
      toast.success(t('common.success'))
    }

    emit('updated')
    await loadData()
    activeTab.value = 'history'
  } catch (err) {
    toast.error(err.response?.data?.error || err.message)
  } finally {
    submitting.value = false
  }
}

async function handleSaveSettings() {
  savingSettings.value = true
  try {
    const data = {
      notes: settingsForm.value.notes,
      customLimits: useCustomPmsLimit.value
        ? { pmsMaxHotels: settingsForm.value.customLimits.pmsMaxHotels }
        : { pmsMaxHotels: null }
    }
    await partnerService.updateSubscription(props.partner._id, data)
    toast.success(t('partners.subscription.updateSuccess'))
    emit('updated')
    await loadData()
  } catch (err) {
    toast.error(err.response?.data?.error || err.message)
  } finally {
    savingSettings.value = false
  }
}

async function downloadInvoice(invoiceId, invoiceNumber) {
  try {
    const response = await partnerService.downloadMyInvoicePdf(invoiceId)
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoiceNumber || 'invoice'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error('Fatura indirilemedi')
  }
}

function openEditPurchaseModal(purchase) {
  editForm.value = {
    purchaseId: purchase._id,
    startDate: purchase.period?.startDate?.split('T')[0] || '',
    endDate: purchase.period?.endDate?.split('T')[0] || '',
    amount: purchase.price?.amount || 0,
    currency: purchase.price?.currency || 'TRY',
    paymentMethod: purchase.payment?.method || 'bank_transfer',
    paymentReference: purchase.payment?.reference || ''
  }
  showEditModal.value = true
}

async function handleUpdatePurchase() {
  updatingPurchase.value = true
  try {
    await partnerService.updatePurchase(props.partner._id, editForm.value.purchaseId, {
      startDate: editForm.value.startDate,
      endDate: editForm.value.endDate,
      amount: editForm.value.amount,
      currency: editForm.value.currency,
      paymentMethod: editForm.value.paymentMethod,
      paymentReference: editForm.value.paymentReference
    })
    toast.success(t('partners.subscription.updateSuccess'))
    showEditModal.value = false
    emit('updated')
    await loadData()
  } catch (err) {
    toast.error(err.response?.data?.error || err.message)
  } finally {
    updatingPurchase.value = false
  }
}

function openMarkPaidModal(purchase) {
  markPaidForm.value = {
    purchaseId: purchase._id,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    paymentReference: ''
  }
  showMarkPaidModalLocal.value = true
}

async function handleMarkAsPaid() {
  markingPaid.value = true
  try {
    await partnerService.markPurchaseAsPaid(props.partner._id, markPaidForm.value.purchaseId, {
      paymentDate: markPaidForm.value.paymentDate,
      paymentMethod: markPaidForm.value.paymentMethod,
      paymentReference: markPaidForm.value.paymentReference
    })
    toast.success(t('partners.subscription.updateSuccess'))
    showMarkPaidModalLocal.value = false
    emit('updated')
    await loadData()
  } catch (err) {
    toast.error(err.response?.data?.error || err.message)
  } finally {
    markingPaid.value = false
  }
}

async function handleCancelPurchase(purchaseId) {
  const reason = prompt(t('partners.subscription.cancelReason'))
  if (reason === null) return
  try {
    await partnerService.cancelPurchase(props.partner._id, purchaseId, reason)
    toast.success(t('common.success'))
    emit('updated')
    await loadData()
  } catch (err) {
    toast.error(err.response?.data?.error || err.message)
  }
}
</script>
