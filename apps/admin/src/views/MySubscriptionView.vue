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
              class="w-16 h-16 rounded-xl flex items-center justify-center"
              :style="{
                backgroundColor: (membership.package?.color || '#6366f1') + '20'
              }"
            >
              <span
                class="material-icons text-3xl"
                :style="{ color: membership.package?.color || '#6366f1' }"
              >
                {{ membership.package?.icon || 'workspace_premium' }}
              </span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                <template v-if="membership.package">
                  {{ membership.package.name?.tr || membership.package.name?.en }}
                </template>
                <template v-else-if="subscription.currentPurchase">
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

      <!-- Subscription Period & Usage -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Period Card -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3">
            {{ $t('mySubscription.subscriptionPeriod') }}
          </h3>
          <div v-if="subscription.startDate">
            <div class="text-sm text-gray-600 dark:text-slate-300 mb-2">
              {{ formatDate(subscription.startDate) }} — {{ formatDate(subscription.endDate) }}
            </div>
            <div v-if="subscription.remainingDays > 0" class="mt-2">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-500 dark:text-slate-400">{{
                  $t('mySubscription.remainingDays')
                }}</span>
                <span
                  class="font-bold"
                  :class="subscription.remainingDays < 30 ? 'text-orange-500' : 'text-green-500'"
                >
                  {{ subscription.remainingDays }} {{ $t('common.days') }}
                </span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  class="bg-purple-600 h-2 rounded-full transition-all"
                  :style="{ width: progressPercent + '%' }"
                ></div>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-400 text-sm">-</div>
        </div>

        <!-- PMS Usage -->
        <div
          v-if="subscription.pmsStatus"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
        >
          <div class="flex items-center justify-between mb-3">
            <h3
              class="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center gap-2"
            >
              <span class="material-icons text-blue-500 text-base">hotel</span>
              PMS
            </h3>
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
          v-if="subscription.webDesignStatus"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
        >
          <div class="flex items-center justify-between mb-3">
            <h3
              class="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center gap-2"
            >
              <span class="material-icons text-purple-500 text-base">language</span>
              Web Design
            </h3>
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

      <!-- Included Services -->
      <div
        v-if="membership.services?.length"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {{ $t('mySubscription.includedServices') }}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="svc in membership.services"
            :key="svc._id"
            class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50"
          >
            <div
              class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-purple-500">{{ svc.icon || 'check_circle' }}</span>
            </div>
            <div>
              <div class="font-medium text-sm text-gray-900 dark:text-white">
                {{ svc.name?.tr || svc.name?.en }}
              </div>
              <div v-if="svc.source === 'individual'" class="text-xs text-purple-500">
                {{ $t('mySubscription.addon') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Packages -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">
            {{ $t('mySubscription.availablePackages') }}
          </h3>
        </div>
        <div v-if="loadingCatalog" class="text-center py-8">
          <span class="material-icons animate-spin text-purple-500">refresh</span>
        </div>
        <div
          v-else-if="catalog.packages?.length"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="pkg in catalog.packages"
            :key="pkg._id"
            class="relative border rounded-xl p-5 transition-all duration-200"
            :class="
              membership.package?._id === pkg._id
                ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10 ring-2 ring-green-500/20'
                : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'
            "
          >
            <div
              v-if="pkg.badge"
              class="absolute -top-2 right-3 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full"
            >
              {{ pkg.badge }}
            </div>
            <span
              v-if="membership.package?._id === pkg._id"
              class="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
            >
              {{ $t('mySubscription.currentPlan') }}
            </span>
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :style="{ backgroundColor: (pkg.color || '#6366f1') + '20' }"
              >
                <span class="material-icons" :style="{ color: pkg.color || '#6366f1' }">{{
                  pkg.icon || 'inventory_2'
                }}</span>
              </div>
              <div>
                <div class="font-bold text-gray-900 dark:text-white">{{ pkg.name?.tr }}</div>
                <div
                  v-if="pkg.description?.tr"
                  class="text-xs text-gray-500 dark:text-slate-400 line-clamp-2"
                >
                  {{ pkg.description.tr }}
                </div>
              </div>
            </div>
            <!-- Included services -->
            <div v-if="pkg.services?.length" class="space-y-1 mb-3">
              <div
                v-for="svc in pkg.services"
                :key="svc._id"
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300"
              >
                <span class="material-icons text-green-500 text-sm">check</span>
                {{ svc.name?.tr || svc.name?.en }}
              </div>
            </div>
            <!-- Trial -->
            <div
              v-if="pkg.trial?.enabled && pkg.trial?.days"
              class="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-3"
            >
              <span class="material-icons text-sm">timer</span>
              {{ pkg.trial.days }} {{ $t('mySubscription.trialDays') }}
            </div>
            <!-- Price + Action -->
            <div
              class="border-t border-gray-200 dark:border-slate-700 pt-3 flex items-center justify-between"
            >
              <div>
                <div
                  v-for="price in pkg.pricing?.prices"
                  :key="price.currency"
                  class="text-lg font-bold text-gray-900 dark:text-white"
                >
                  {{ formatCurrency(price.amount, price.currency) }}
                  <span class="text-xs font-normal text-gray-500">
                    / {{ $t(`mySubscription.intervals.${pkg.pricing?.interval || 'yearly'}`) }}
                  </span>
                </div>
              </div>
              <button
                v-if="membership.package?._id !== pkg._id"
                class="btn-primary text-sm"
                :disabled="purchasing"
                @click="handlePurchasePackage(pkg)"
              >
                {{ $t('mySubscription.purchase') }}
              </button>
              <span
                v-else
                class="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1"
              >
                <span class="material-icons text-sm">check_circle</span>
                {{ $t('common.active') }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-400 text-sm text-center py-4">{{ $t('common.noData') }}</p>
      </div>

      <!-- Available Add-on Services -->
      <div
        v-if="availableAddons.length > 0"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {{ $t('mySubscription.addonServices') }}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="svc in availableAddons"
            :key="svc._id"
            class="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
          >
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
              >
                <span class="material-icons text-purple-500 text-sm">{{
                  svc.icon || 'extension'
                }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {{ svc.name?.tr || svc.name?.en }}
                </div>
              </div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <div v-if="svc.pricing?.prices?.length">
                <span
                  v-for="price in svc.pricing.prices.slice(0, 1)"
                  :key="price.currency"
                  class="text-sm font-bold text-gray-900 dark:text-white"
                >
                  {{ formatCurrency(price.amount, price.currency) }}
                  <span class="text-xs font-normal text-gray-500">
                    / {{ $t(`mySubscription.intervals.${svc.pricing?.interval || 'yearly'}`) }}
                  </span>
                </span>
              </div>
              <button
                class="text-xs btn-primary px-3 py-1.5"
                :disabled="purchasing"
                @click="handlePurchaseService(svc)"
              >
                {{ $t('mySubscription.purchase') }}
              </button>
            </div>
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

    <!-- Card Form Modal -->
    <Modal v-model="showCardForm" :title="$t('mySubscription.cardDetails')" size="md">
      <form @submit.prevent="submitCardForm" class="space-y-4">
        <div>
          <label class="form-label">{{ $t('mySubscription.cardHolder') }}</label>
          <input v-model="cardForm.holder" type="text" required class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ $t('mySubscription.cardNumber') }}</label>
          <input
            v-model="cardForm.number"
            type="text"
            maxlength="19"
            required
            class="form-input font-mono"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('mySubscription.expiry') }}</label>
            <input
              v-model="cardForm.expiry"
              type="text"
              placeholder="MM/YY"
              maxlength="5"
              required
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label">CVV</label>
            <input v-model="cardForm.cvv" type="text" maxlength="4" required class="form-input" />
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showCardForm = false">
          {{ $t('common.cancel') }}
        </button>
        <button class="btn-primary" :disabled="payingCard" @click="submitCardForm">
          {{ payingCard ? $t('common.saving') : $t('mySubscription.pay') }}
        </button>
      </template>
    </Modal>

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

    <!-- Success Modal -->
    <Modal v-model="showSuccess" :title="$t('mySubscription.paymentSuccess')" size="sm">
      <div class="text-center py-4">
        <div
          class="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
        >
          <span class="material-icons text-3xl text-green-600 dark:text-green-400"
            >check_circle</span
          >
        </div>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('mySubscription.paymentSuccessDescription') }}
        </p>
      </div>
      <template #footer>
        <button class="btn-primary" @click="handleSuccessClose">
          {{ $t('common.close') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import partnerService from '@/services/partnerService'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const loading = ref(true)
const subscription = ref(null)
const membership = ref({})
const invoices = ref([])
const purchasing = ref(false)

// Catalog
const loadingCatalog = ref(false)
const catalog = ref({ packages: [], services: [] })

// Card form
const showCardForm = ref(false)
const payingCard = ref(false)
const cardForm = ref({ holder: '', number: '', expiry: '', cvv: '' })
const pendingPurchaseId = ref(null)
const selectedPurchaseType = ref(null)
const selectedItem = ref(null)

// 3D Secure
const show3DSecure = ref(false)
const secureUrl = ref('')
const showSuccess = ref(false)

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

const progressPercent = computed(() => {
  if (!subscription.value?.startDate || !subscription.value?.endDate) return 0
  const start = new Date(subscription.value.startDate).getTime()
  const end = new Date(subscription.value.endDate).getTime()
  const now = Date.now()
  const total = end - start
  const elapsed = now - start
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
})

const activeServiceSlugs = computed(() => {
  return (membership.value.services || []).map(s => s.slug).filter(Boolean)
})

const availableAddons = computed(() => {
  return (catalog.value.services || []).filter(svc => !activeServiceSlugs.value.includes(svc.slug))
})

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

const formatCurrency = (amount, currency = 'EUR') => {
  if (amount == null) return '-'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount)
}

const handleSuccessClose = () => {
  showSuccess.value = false
  loadAll()
}

const loadAll = async () => {
  loading.value = true
  try {
    const [subRes, invRes, memRes, catRes] = await Promise.all([
      partnerService.getMySubscription(),
      partnerService.getMyInvoices(),
      api.get('/api/my/membership').then(r => r.data),
      api.get('/api/my/membership/catalog').then(r => r.data)
    ])
    subscription.value = subRes.data
    invoices.value = invRes.data?.invoices || []
    membership.value = memRes.data || {}
    catalog.value = catRes.data || { packages: [], services: [] }
  } catch {
    toast.error(t('common.fetchError'))
  } finally {
    loading.value = false
  }
}

const handlePurchasePackage = pkg => {
  selectedPurchaseType.value = 'package_subscription'
  selectedItem.value = pkg
  cardForm.value = { holder: '', number: '', expiry: '', cvv: '' }
  pendingPurchaseId.value = null
  showCardForm.value = true
}

const handlePurchaseService = svc => {
  selectedPurchaseType.value = 'service_purchase'
  selectedItem.value = svc
  cardForm.value = { holder: '', number: '', expiry: '', cvv: '' }
  pendingPurchaseId.value = null
  showCardForm.value = true
}

const openPayForPurchase = purchase => {
  cardForm.value = { holder: '', number: '', expiry: '', cvv: '' }
  pendingPurchaseId.value = purchase._id
  selectedPurchaseType.value = null
  selectedItem.value = null
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
    const response = await partnerService.downloadMyInvoicePdf(id)
    const blob = new Blob([response], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoice.pdf'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error(t('common.error'))
  }
}

const handle3DSecureMessage = event => {
  if (event.data?.type === 'payment-callback') {
    show3DSecure.value = false
    if (event.data.success) {
      showSuccess.value = true
    } else {
      toast.error(event.data.message || t('mySubscription.paymentFailed'))
    }
    loadAll()
  }
}

onMounted(async () => {
  window.addEventListener('message', handle3DSecureMessage)
  await loadAll()
})

onUnmounted(() => {
  window.removeEventListener('message', handle3DSecureMessage)
})
</script>
