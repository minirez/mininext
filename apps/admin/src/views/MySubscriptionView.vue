<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ $t('mySubscription.title') }}
      </h1>
      <p class="text-gray-500 dark:text-slate-400">{{ $t('mySubscription.description') }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-3xl text-purple-500">refresh</span>
    </div>

    <!-- Content -->
    <div v-else-if="subscription" class="grid gap-6">
      <!-- Status Card -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/30"
            >
              <span class="material-icons text-3xl text-purple-600 dark:text-purple-400"
                >workspace_premium</span
              >
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                <template v-if="subscription.currentPurchase">
                  {{
                    subscription.currentPurchase.label?.tr ||
                    subscription.currentPurchase.label?.en ||
                    $t('mySubscription.subscription')
                  }}
                </template>
                <template v-else-if="subscription.status === 'trial'">
                  {{ $t('mySubscription.trialPeriod') }}
                </template>
                <template v-else>
                  {{ $t('mySubscription.noActivePlan') }}
                </template>
              </h2>
              <p class="text-gray-500 dark:text-slate-400 text-sm">
                {{ subscription.statusLabel }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="px-4 py-2 rounded-full text-sm font-medium"
              :class="statusColors[subscription.status]"
            >
              {{ $t(`mySubscription.status.${subscription.status}`) }}
            </span>
            <button
              @click="showPurchaseModal = true"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
            >
              <span class="material-icons text-sm">shopping_cart</span>
              {{ $t('mySubscription.purchase') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Trial Banner -->
      <div
        v-if="subscription.status === 'trial' && subscription.trial"
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3"
      >
        <span class="material-icons text-blue-600 dark:text-blue-400 mt-0.5">info</span>
        <div>
          <p class="font-medium text-blue-900 dark:text-blue-200">
            {{ $t('mySubscription.trialActive') }}
          </p>
          <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
            {{ $t('mySubscription.trialRemainingDays', { days: subscription.remainingDays }) }}
          </p>
        </div>
      </div>

      <!-- Grace Period Warning -->
      <div
        v-if="subscription.status === 'grace_period'"
        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3"
      >
        <span class="material-icons text-amber-600 dark:text-amber-400 mt-0.5">warning</span>
        <div>
          <p class="font-medium text-amber-900 dark:text-amber-200">
            {{ $t('mySubscription.gracePeriodWarning') }}
          </p>
          <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
            {{
              $t('mySubscription.gracePeriodDays', { days: subscription.gracePeriodRemainingDays })
            }}
          </p>
        </div>
      </div>

      <!-- Subscription Period & Progress -->
      <div
        v-if="subscription.currentPurchase"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">
          {{ $t('mySubscription.subscriptionPeriod') }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('common.startDate') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(subscription.startDate) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('common.endDate') }}</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(subscription.endDate) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('mySubscription.remainingDays') }}
            </p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ subscription.remainingDays ?? '-' }} {{ $t('common.days') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Feature Status (driven by admin-set customLimits) -->
      <div
        v-if="subscription.pmsStatus || subscription.webDesignStatus"
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <!-- PMS -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span class="material-icons text-blue-500">hotel</span>
              PMS
            </h4>
            <span
              class="text-xs font-medium px-2 py-1 rounded-full"
              :class="
                subscription.pmsStatus?.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
              "
            >
              {{ subscription.pmsStatus?.enabled ? $t('common.active') : $t('common.inactive') }}
            </span>
          </div>
          <div
            v-if="subscription.pmsStatus?.enabled"
            class="text-sm text-gray-600 dark:text-slate-400"
          >
            <p>
              {{ $t('mySubscription.hotelsUsed') }}: {{ subscription.pmsStatus.used ?? 0 }} /
              {{ subscription.pmsStatus.maxHotelsDisplay }}
            </p>
          </div>
        </div>

        <!-- Web Design -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span class="material-icons text-purple-500">language</span>
              Web Design
            </h4>
            <span
              class="text-xs font-medium px-2 py-1 rounded-full"
              :class="
                subscription.webDesignStatus?.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
              "
            >
              {{
                subscription.webDesignStatus?.enabled ? $t('common.active') : $t('common.inactive')
              }}
            </span>
          </div>
          <div
            v-if="subscription.webDesignStatus?.enabled"
            class="text-sm text-gray-600 dark:text-slate-400"
          >
            <p>
              {{ $t('mySubscription.maxSites') }}:
              {{ subscription.webDesignStatus.maxSitesDisplay }}
            </p>
          </div>
        </div>
      </div>

      <!-- Invoices -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.invoices') }}
          </h3>
        </div>
        <div v-if="invoices.length" class="divide-y divide-gray-200 dark:divide-slate-700">
          <div
            v-for="inv in invoices"
            :key="inv._id"
            class="px-6 py-3 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ inv.invoiceNumber }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ formatDate(inv.invoiceDate) }} · €{{ inv.total?.toFixed(2) }}
              </p>
            </div>
            <button
              class="text-purple-600 hover:text-purple-800 dark:text-purple-400 text-sm"
              @click="downloadInvoice(inv._id)"
            >
              <span class="material-icons text-lg">download</span>
            </button>
          </div>
        </div>
        <div v-else class="px-6 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
          {{ $t('mySubscription.noInvoices') }}
        </div>
      </div>

      <!-- Purchase History -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.purchaseHistory') }}
          </h3>
        </div>
        <div
          v-if="subscription.purchases?.length"
          class="divide-y divide-gray-200 dark:divide-slate-700"
        >
          <div
            v-for="p in subscription.purchases"
            :key="p._id"
            class="px-6 py-3 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ p.label?.tr || p.label?.en || '-' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ formatDate(p.period?.startDate) }} – {{ formatDate(p.period?.endDate) }} · €{{
                  p.price?.amount?.toFixed(2)
                }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="text-xs font-medium px-2 py-1 rounded-full"
                :class="purchaseStatusColors[p.status]"
              >
                {{ $t(`mySubscription.purchaseStatus.${p.status}`) }}
              </span>
              <button
                v-if="p.status === 'pending'"
                class="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 font-medium"
                @click="openPayForPurchase(p)"
              >
                {{ $t('mySubscription.payNow') }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="px-6 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
          {{ $t('mySubscription.noPurchases') }}
        </div>
      </div>

      <!-- Contact Support -->
      <div
        class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800 text-center"
      >
        <span class="material-icons text-4xl text-purple-500 mb-2">support_agent</span>
        <h3 class="font-semibold text-gray-900 dark:text-white">
          {{ $t('mySubscription.needHelp') }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
          {{ $t('mySubscription.contactSupport') }}
        </p>
      </div>
    </div>

    <!-- Purchase Modal -->
    <Teleport to="body">
      <div v-if="showPurchaseModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="showPurchaseModal = false"></div>
        <div
          class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-2xl p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ $t('mySubscription.selectPlan') }}
            </h2>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              @click="showPurchaseModal = false"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Tabs: Packages / Services -->
          <div class="flex border-b border-gray-200 dark:border-slate-700 mb-4">
            <button
              class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              :class="
                purchaseTab === 'packages'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              "
              @click="purchaseTab = 'packages'"
            >
              {{ $t('subscriptionPackages.title') }}
            </button>
            <button
              class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              :class="
                purchaseTab === 'services'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              "
              @click="purchaseTab = 'services'"
            >
              {{ $t('subscriptionServices.title') }}
            </button>
          </div>

          <!-- Packages List -->
          <div v-if="purchaseTab === 'packages'" class="space-y-3">
            <div v-if="loadingCatalog" class="text-center py-8">
              <span class="material-icons animate-spin text-purple-500">refresh</span>
            </div>
            <div
              v-for="pkg in catalogPackages"
              :key="pkg._id"
              class="border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:border-purple-400 cursor-pointer transition-colors"
              :class="
                selectedItem?._id === pkg._id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : ''
              "
              @click="selectCatalogItem('package_subscription', pkg)"
            >
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  {{ pkg.name?.tr || pkg.name?.en }}
                </h4>
                <span class="text-lg font-bold text-purple-600 dark:text-purple-400"
                  >€{{ (pkg.overridePrice ?? pkg.calculatedPrice ?? 0).toFixed(2) }}</span
                >
              </div>
              <p
                v-if="pkg.description?.tr || pkg.description?.en"
                class="text-xs text-gray-500 dark:text-slate-400 mt-1"
              >
                {{ pkg.description?.tr || pkg.description?.en }}
              </p>
              <div v-if="pkg.services?.length" class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="s in pkg.services"
                  :key="s._id"
                  class="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded"
                >
                  {{ s.name?.tr || s.name?.en }}
                </span>
              </div>
            </div>
          </div>

          <!-- Services List -->
          <div v-else class="space-y-3">
            <div v-if="loadingCatalog" class="text-center py-8">
              <span class="material-icons animate-spin text-purple-500">refresh</span>
            </div>
            <div
              v-for="svc in catalogServices"
              :key="svc._id"
              class="border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:border-purple-400 cursor-pointer transition-colors"
              :class="
                selectedItem?._id === svc._id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : ''
              "
              @click="selectCatalogItem('service_purchase', svc)"
            >
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  {{ svc.name?.tr || svc.name?.en }}
                </h4>
                <span class="text-lg font-bold text-purple-600 dark:text-purple-400"
                  >€{{ svc.price?.toFixed(2) }}</span
                >
              </div>
              <p
                v-if="svc.description?.tr || svc.description?.en"
                class="text-xs text-gray-500 dark:text-slate-400 mt-1"
              >
                {{ svc.description?.tr || svc.description?.en }}
              </p>
            </div>
          </div>

          <!-- Purchase Button -->
          <div v-if="selectedItem" class="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
            <p class="text-sm text-gray-600 dark:text-slate-400 mb-3">
              {{ $t('mySubscription.selectedItem') }}:
              <strong>{{ selectedItem.name?.tr || selectedItem.name?.en }}</strong> –
              <strong>€{{ selectedItemPrice.toFixed(2) }}</strong>
            </p>
            <div class="flex gap-3">
              <button
                class="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                :disabled="purchasing"
                @click="handleCardPurchase"
              >
                <span class="material-icons text-sm mr-1">credit_card</span>
                {{ purchasing ? $t('common.saving') : $t('mySubscription.payWithCard') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 3D Secure Modal -->
    <Teleport to="body">
      <div
        v-if="show3DSecure"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      >
        <div class="relative w-full max-w-xl h-[600px] bg-white rounded-xl overflow-hidden">
          <button
            class="absolute top-2 right-2 z-10 text-gray-400 hover:text-gray-600"
            @click="show3DSecure = false"
          >
            <span class="material-icons">close</span>
          </button>
          <iframe :src="secureUrl" class="w-full h-full border-0"></iframe>
        </div>
      </div>
    </Teleport>

    <!-- Card Form Modal (for both new purchase and pending purchase) -->
    <Teleport to="body">
      <div v-if="showCardForm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="showCardForm = false"></div>
        <div class="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-800 shadow-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ $t('mySubscription.cardDetails') }}
            </h2>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              @click="showCardForm = false"
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          <form @submit.prevent="submitCardForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                $t('mySubscription.cardHolder')
              }}</label>
              <input
                v-model="cardForm.holder"
                type="text"
                required
                class="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                $t('mySubscription.cardNumber')
              }}</label>
              <input
                v-model="cardForm.number"
                type="text"
                maxlength="19"
                required
                class="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                  $t('mySubscription.expiry')
                }}</label>
                <input
                  v-model="cardForm.expiry"
                  type="text"
                  placeholder="MM/YY"
                  maxlength="5"
                  required
                  class="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
                  >CVV</label
                >
                <input
                  v-model="cardForm.cvv"
                  type="text"
                  maxlength="4"
                  required
                  class="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              :disabled="payingCard"
              class="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {{ payingCard ? $t('common.saving') : $t('mySubscription.pay') }}
            </button>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Success Modal -->
    <Teleport to="body">
      <div
        v-if="showSuccess"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 text-center max-w-sm">
          <div
            class="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
          >
            <span class="material-icons text-3xl text-green-600 dark:text-green-400"
              >check_circle</span
            >
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {{ $t('mySubscription.paymentSuccess') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
            {{ $t('mySubscription.paymentSuccessDescription') }}
          </p>
          <button
            class="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-700"
            @click="
              showSuccess = false
              loadSubscription()
            "
          >
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import partnerService from '@/services/partnerService'
import subscriptionPackageService from '@/services/subscriptionPackageService'
import subscriptionServiceService from '@/services/subscriptionServiceService'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const loading = ref(true)
const subscription = ref(null)
const invoices = ref([])

// Purchase modal
const showPurchaseModal = ref(false)
const purchaseTab = ref('packages')
const loadingCatalog = ref(false)
const catalogPackages = ref([])
const catalogServices = ref([])
const selectedPurchaseType = ref(null)
const selectedItem = ref(null)
const purchasing = ref(false)

// Card form
const showCardForm = ref(false)
const payingCard = ref(false)
const cardForm = ref({ holder: '', number: '', expiry: '', cvv: '' })
const pendingPurchaseId = ref(null) // for paying existing pending purchase

// 3D Secure
const show3DSecure = ref(false)
const secureUrl = ref('')

// Success
const showSuccess = ref(false)

const selectedItemPrice = computed(() => {
  if (!selectedItem.value) return 0
  if (selectedPurchaseType.value === 'package_subscription') {
    return selectedItem.value.overridePrice ?? selectedItem.value.calculatedPrice ?? 0
  }
  return selectedItem.value.price ?? 0
})

const statusColors = {
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  grace_period: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const purchaseStatusColors = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  expired: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

const loadSubscription = async () => {
  loading.value = true
  try {
    const [subRes, invRes] = await Promise.all([
      partnerService.getMySubscription(),
      partnerService.getMyInvoices()
    ])
    subscription.value = subRes.data
    invoices.value = invRes.data?.invoices || []
  } catch {
    toast.error(t('common.fetchError'))
  } finally {
    loading.value = false
  }
}

const loadCatalog = async () => {
  loadingCatalog.value = true
  try {
    const [pkgRes, svcRes] = await Promise.all([
      subscriptionPackageService.getActivePackages(),
      subscriptionServiceService.getActiveServices()
    ])
    catalogPackages.value = pkgRes.data || []
    catalogServices.value = svcRes.data || []
  } catch {
    toast.error(t('common.fetchError'))
  } finally {
    loadingCatalog.value = false
  }
}

const selectCatalogItem = (type, item) => {
  selectedPurchaseType.value = type
  selectedItem.value = item
}

const handleCardPurchase = () => {
  cardForm.value = { holder: '', number: '', expiry: '', cvv: '' }
  pendingPurchaseId.value = null
  showPurchaseModal.value = false
  showCardForm.value = true
}

const openPayForPurchase = purchase => {
  cardForm.value = { holder: '', number: '', expiry: '', cvv: '' }
  pendingPurchaseId.value = purchase._id
  showCardForm.value = true
}

const submitCardForm = async () => {
  payingCard.value = true
  try {
    let res
    if (pendingPurchaseId.value) {
      res = await partnerService.payPendingPurchase(pendingPurchaseId.value, {
        card: cardForm.value,
        installment: 1
      })
    } else {
      const payload = {
        type: selectedPurchaseType.value,
        card: cardForm.value,
        installment: 1
      }
      if (selectedPurchaseType.value === 'package_subscription') {
        payload.packageId = selectedItem.value._id
      } else {
        payload.serviceId = selectedItem.value._id
      }
      res = await partnerService.initiatePurchase(payload)
    }

    if (res.data?.formUrl) {
      showCardForm.value = false
      secureUrl.value = res.data.formUrl
      show3DSecure.value = true
    } else {
      showCardForm.value = false
      showSuccess.value = true
    }
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    payingCard.value = false
  }
}

const downloadInvoice = async id => {
  try {
    await partnerService.downloadMyInvoicePDF(id)
  } catch {
    toast.error(t('common.error'))
  }
}

// Listen for 3D Secure callback
const handle3DSecureMessage = event => {
  if (event.data?.type === 'payment-callback') {
    show3DSecure.value = false
    if (event.data.success) {
      showSuccess.value = true
    } else {
      toast.error(event.data.message || t('mySubscription.paymentFailed'))
    }
    loadSubscription()
  }
}

onMounted(async () => {
  window.addEventListener('message', handle3DSecureMessage)
  await Promise.all([loadSubscription(), loadCatalog()])
})
</script>
