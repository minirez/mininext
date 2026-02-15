<template>
  <Drawer
    v-model="isOpen"
    :title="partner?.companyName || ''"
    size="xl"
    position="right"
    :close-on-backdrop="false"
  >
    <template #header>
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div
          class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <span class="text-purple-600 dark:text-purple-400 font-semibold">
            {{ partner?.companyName?.charAt(0)?.toUpperCase() }}
          </span>
        </div>
        <div class="min-w-0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {{ partner?.companyName }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">{{ partner?.email }}</p>
        </div>
        <span
          v-if="subscriptionStatus"
          class="badge ml-auto flex-shrink-0"
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
      </div>
    </template>

    <div v-if="partner" class="space-y-0 -mx-6 -my-4 flex flex-col h-full">
      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-slate-700 px-6">
        <nav class="flex gap-4">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="py-3 px-1 border-b-2 text-sm font-medium transition-colors"
            :class="[
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
            ]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <!-- Tab: Plan Seç -->
        <div v-show="activeTab === 'plan'" class="space-y-5">
          <!-- Mevcut Durum -->
          <div v-if="subscriptionStatus" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-slate-400"
                  >{{ $t('partners.subscription.currentPlan') }}:</span
                >
                <span class="ml-1 font-medium text-gray-900 dark:text-white">
                  {{ currentPackageName || '-' }}
                </span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-slate-400"
                  >{{ $t('partners.subscription.remainingDays') }}:</span
                >
                <span class="ml-1 font-medium text-gray-900 dark:text-white">
                  {{ subscriptionStatus.remainingDays ?? '-' }}
                </span>
              </div>
              <div v-if="subscriptionStatus.status === 'grace_period'">
                <span class="text-amber-600"
                  >{{ $t('partners.subscription.gracePeriodRemaining') }}:</span
                >
                <span class="ml-1 font-medium">{{
                  subscriptionStatus.gracePeriodRemainingDays
                }}</span>
              </div>
            </div>
          </div>

          <!-- Paket Seçimi -->
          <PackageSelectionGrid
            v-if="availablePackages.length > 0"
            :packages="availablePackages"
            :selected-package-id="cart.packageId"
            :current-package-id="subscriptionStatus?.currentPackageId || null"
            :currency="cart.currency"
            :interval="cart.interval"
            @select="handlePackageSelect"
          />

          <!-- Ek Hizmetler -->
          <ServiceAddonsGrid
            v-if="availableServices.length > 0"
            :services="availableServices"
            :selected-service-ids="cart.serviceIds"
            :package-service-codes="packageServiceCodes"
            :currency="cart.currency"
            :interval="cart.interval"
            @toggle="handleServiceToggle"
          />

          <!-- Loading -->
          <div v-if="loadingData" class="text-center py-8">
            <span class="material-icons animate-spin text-purple-500">refresh</span>
          </div>
        </div>

        <!-- Tab: Geçmiş -->
        <div v-show="activeTab === 'history'" class="space-y-4">
          <div v-if="subscriptionStatus?.purchases?.length" class="space-y-2">
            <div
              v-for="purchase in subscriptionStatus.purchases"
              :key="purchase._id"
              class="flex items-center justify-between p-4 border rounded-lg dark:border-slate-700"
              :class="{
                'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800':
                  purchase.status === 'pending',
                'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800':
                  purchase.status === 'active',
                'bg-gray-50 dark:bg-slate-800/50': purchase.status === 'expired',
                'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800':
                  purchase.status === 'cancelled'
              }"
            >
              <div class="flex items-center gap-4">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="badge badge-info">
                      {{ getPurchaseName(purchase) }}
                    </span>
                    <span
                      class="badge"
                      :class="{
                        'badge-warning': purchase.status === 'pending',
                        'badge-success': purchase.status === 'active',
                        'badge-secondary': purchase.status === 'expired',
                        'badge-danger': purchase.status === 'cancelled'
                      }"
                    >
                      {{ $t(`partners.subscription.purchaseStatus.${purchase.status}`) }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600 dark:text-slate-400 mt-1">
                    {{ formatDate(purchase.period?.startDate) }} -
                    {{ formatDate(purchase.period?.endDate) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(purchase.price?.amount, purchase.price?.currency) }}
                  </div>
                  <div
                    v-if="purchase.payment?.date"
                    class="text-xs text-gray-500 dark:text-slate-400"
                  >
                    {{ $t(`partners.subscription.methods.${purchase.payment?.method}`) }}
                  </div>
                  <div v-else class="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {{ $t('partners.subscription.awaitingPayment') }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button
                  v-if="purchase.status === 'pending'"
                  class="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                  :title="$t('partners.subscription.markAsPaid')"
                  @click="openMarkPaidModal(purchase)"
                >
                  <span class="material-icons text-lg">check_circle</span>
                </button>
                <button
                  v-if="['pending', 'active'].includes(purchase.status)"
                  class="text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                  :title="$t('partners.subscription.editPurchase')"
                  @click="openEditPurchaseModal(purchase)"
                >
                  <span class="material-icons text-lg">edit</span>
                </button>
                <button
                  v-if="getInvoiceForPurchase(purchase._id)"
                  class="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  :title="$t('partners.subscription.downloadInvoice')"
                  @click="
                    downloadInvoice(
                      getInvoiceForPurchase(purchase._id)._id,
                      getInvoiceForPurchase(purchase._id).invoiceNumber
                    )
                  "
                >
                  <span class="material-icons text-lg">receipt</span>
                </button>
                <button
                  v-if="['pending', 'active'].includes(purchase.status)"
                  class="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  :title="$t('partners.subscription.cancelPurchase')"
                  @click="handleCancelPurchase(purchase._id)"
                >
                  <span class="material-icons text-lg">cancel</span>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
            {{ $t('partners.subscription.noPurchases') }}
          </div>
        </div>

        <!-- Tab: Ayarlar -->
        <div v-show="activeTab === 'settings'" class="space-y-4">
          <!-- Custom PMS Limit -->
          <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="useCustomPmsLimit"
                type="checkbox"
                class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span class="text-sm text-gray-700 dark:text-slate-300">{{
                $t('partners.subscription.useCustomLimit')
              }}</span>
            </label>
            <div v-if="useCustomPmsLimit" class="mt-3 ml-6">
              <label class="form-label">{{ $t('partners.subscription.maxPmsHotels') }}</label>
              <input
                v-model.number="settingsForm.customLimits.pmsMaxHotels"
                type="number"
                class="form-input w-32"
                min="-1"
              />
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {{ $t('partners.subscription.maxPmsHotelsHint') }}
              </p>
            </div>

            <!-- PMS Status -->
            <div
              v-if="subscriptionStatus?.pmsStatus"
              class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600"
            >
              <dl class="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <dt class="text-gray-500 dark:text-slate-400">
                    {{ $t('partners.subscription.provisionedHotels') }}
                  </dt>
                  <dd class="font-medium text-gray-900 dark:text-white">
                    {{ subscriptionStatus.pmsStatus.provisionedHotels || 0 }} /
                    {{
                      subscriptionStatus.pmsStatus.maxHotelsDisplay === 'unlimited'
                        ? '∞'
                        : subscriptionStatus.pmsStatus.maxHotels || 0
                    }}
                  </dd>
                </div>
                <div>
                  <dt class="text-gray-500 dark:text-slate-400">
                    {{ $t('partners.subscription.pmsStatus') }}
                  </dt>
                  <dd>
                    <span
                      v-if="subscriptionStatus.pmsStatus.canProvisionMore"
                      class="text-green-600 dark:text-green-400"
                      >{{ $t('partners.subscription.canProvision') }}</span
                    >
                    <span v-else class="text-red-600 dark:text-red-400">{{
                      $t('partners.subscription.limitReached')
                    }}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="form-label">{{ $t('partners.subscription.notes') }}</label>
            <textarea
              v-model="settingsForm.notes"
              class="form-input"
              rows="4"
              :placeholder="$t('partners.subscription.notesPlaceholder')"
            />
          </div>

          <button class="btn-primary" :disabled="savingSettings" @click="handleSaveSettings">
            <span v-if="savingSettings">{{ $t('common.loading') }}</span>
            <span v-else>{{ $t('common.save') }}</span>
          </button>
        </div>
      </div>

      <!-- Cart Summary (sadece plan tab'ında) -->
      <CartSummary
        v-if="activeTab === 'plan'"
        :selected-package="selectedPackageObj"
        :selected-services="selectedServiceObjs"
        :currency="cart.currency"
        :interval="cart.interval"
        :total="cartTotal"
        :loading="submitting"
        @send-payment-link="handleAction('send_link')"
        @save-pending="handleAction('save_pending')"
        @mark-paid="handleAction('mark_paid')"
        @currency-change="cart.currency = $event"
        @interval-change="cart.interval = $event"
      />
    </div>

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
    <Modal
      v-model="showMarkPaidModalLocal"
      :title="$t('partners.subscription.markAsPaid')"
      size="md"
    >
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
  </Drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import Drawer from '@/components/ui/overlay/Drawer.vue'
import Modal from '@/components/common/Modal.vue'
import PackageSelectionGrid from './subscription-drawer/PackageSelectionGrid.vue'
import ServiceAddonsGrid from './subscription-drawer/ServiceAddonsGrid.vue'
import CartSummary from './subscription-drawer/CartSummary.vue'
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

// Drawer open/close
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
  { id: 'plan', label: t('partners.subscription.selectTab') },
  { id: 'history', label: t('partners.subscription.historyTab') },
  { id: 'settings', label: t('partners.subscription.settingsTab') }
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
  // Legacy plan name
  const plan = subscriptionStatus.value.plan
  if (['webdesign', 'business', 'professional', 'enterprise'].includes(plan)) {
    return t(`partners.subscription.plans.${plan}`)
  }
  // New package
  const pkg = availablePackages.value.find(p => p._id === subscriptionStatus.value.currentPackageId)
  return pkg?.name?.tr || pkg?.name?.en || plan
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

function getPurchaseName(purchase) {
  if (purchase.plan) {
    return t(`partners.subscription.plans.${purchase.plan}`)
  }
  if (purchase.lineItems?.length > 0) {
    return purchase.lineItems.map(li => li.name).join(' + ')
  }
  return purchase.purchaseType || '-'
}

function getInvoiceForPurchase(purchaseId) {
  const purchase = subscriptionStatus.value?.purchases?.find(p => p._id === purchaseId)
  if (purchase?.invoice) {
    return typeof purchase.invoice === 'object' ? purchase.invoice : { _id: purchase.invoice }
  }
  // Check invoices array
  const invoices = subscriptionStatus.value?.invoices || []
  return invoices.find(inv => inv.purchase?.toString() === purchaseId)
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
