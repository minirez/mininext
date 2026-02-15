<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ $t('mySubscription.title') }}
      </h1>
      <p class="text-gray-500 dark:text-slate-400">
        {{ $t('mySubscription.description') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-3xl text-purple-500">refresh</span>
    </div>

    <!-- Content -->
    <div v-else-if="subscription" class="grid gap-6">
      <!-- Plan & Status Card -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <!-- Plan Info -->
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-xl flex items-center justify-center"
                :class="planColors[subscription.plan]?.bg || 'bg-gray-100 dark:bg-slate-700'"
              >
                <span
                  class="material-icons text-3xl"
                  :class="planColors[subscription.plan]?.text || 'text-gray-500'"
                >
                  {{ planColors[subscription.plan]?.icon || 'workspace_premium' }}
                </span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ subscription.planName }}
                </h2>
                <p class="text-gray-500 dark:text-slate-400">
                  {{ $t('mySubscription.currentPlan') }}
                </p>
              </div>
            </div>

            <!-- Status Badge & Actions -->
            <div class="flex items-center gap-3">
              <span
                class="px-4 py-2 rounded-full text-sm font-medium"
                :class="statusColors[subscription.status]"
              >
                {{ $t(`mySubscription.status.${subscription.status}`) }}
              </span>
              <button
                @click="openPaymentForUpgrade"
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <span class="material-icons text-sm">upgrade</span>
                {{
                  subscription.status === 'active'
                    ? $t('mySubscription.upgrade')
                    : $t('mySubscription.renew')
                }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dates & Progress Card -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.subscriptionPeriod') }}
          </h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Start Date -->
            <div>
              <div class="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {{ $t('mySubscription.startDate') }}
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ formatDate(subscription.startDate) }}
              </div>
            </div>

            <!-- End Date -->
            <div>
              <div class="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {{ $t('mySubscription.endDate') }}
              </div>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ formatDate(subscription.endDate) }}
              </div>
            </div>

            <!-- Remaining Days -->
            <div>
              <div class="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {{ $t('mySubscription.remainingDays') }}
              </div>
              <div class="text-lg font-semibold" :class="remainingDaysColor">
                <template v-if="subscription.remainingDays > 0">
                  {{ subscription.remainingDays }} {{ $t('mySubscription.days') }}
                </template>
                <template v-else-if="subscription.gracePeriodRemainingDays > 0">
                  {{ subscription.gracePeriodRemainingDays }} {{ $t('mySubscription.days') }} ({{
                    $t('mySubscription.status.grace_period')
                  }})
                </template>
                <template v-else>
                  {{ $t('mySubscription.status.expired') }}
                </template>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="subscription.remainingDays > 0" class="mt-6">
            <div class="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2">
              <span>{{ $t('mySubscription.subscriptionPeriod') }}</span>
              <span>{{ progressPercentage }}%</span>
            </div>
            <div class="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-purple-500 rounded-full transition-all duration-500"
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
          </div>

          <!-- Grace Period Warning -->
          <div
            v-if="subscription.status === 'grace_period'"
            class="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div class="flex items-start gap-3">
              <span class="material-icons text-amber-500">warning</span>
              <div>
                <div class="font-medium text-amber-800 dark:text-amber-200">
                  {{ $t('mySubscription.gracePeriodWarning') }}
                </div>
                <div class="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {{
                    $t('mySubscription.gracePeriodRemainingDays', {
                      days: subscription.gracePeriodRemainingDays
                    })
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Expired Warning -->
          <div
            v-if="subscription.status === 'expired'"
            class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex items-start gap-3">
              <span class="material-icons text-red-500">error</span>
              <div>
                <div class="font-medium text-red-800 dark:text-red-200">
                  {{ $t('mySubscription.expiredWarning') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PMS Quota Card (if applicable) -->
      <div
        v-if="subscription.pmsEnabled"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.pmsQuota') }}
          </h3>
        </div>
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {{ $t('mySubscription.pmsQuota') }}
              </div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ subscription.pmsUsed || 0 }}
                <span class="text-gray-500 dark:text-slate-400 text-lg font-normal">
                  /
                  {{
                    subscription.pmsLimit === -1
                      ? $t('mySubscription.pmsUnlimited')
                      : subscription.pmsLimit
                  }}
                </span>
              </div>
            </div>
            <div v-if="subscription.pmsLimit !== -1" class="w-24 h-24">
              <div class="relative w-full h-full">
                <svg class="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    stroke-width="8"
                    fill="none"
                    class="text-gray-200 dark:text-slate-700"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    stroke-width="8"
                    fill="none"
                    class="text-purple-500"
                    :stroke-dasharray="251.2"
                    :stroke-dashoffset="251.2 - (251.2 * pmsUsagePercentage) / 100"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ pmsUsagePercentage }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Web Design Quota Card (if applicable) -->
      <div
        v-if="subscription.webDesignEnabled"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.webDesign.title') }}
          </h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Sites Limit -->
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center"
              >
                <span class="material-icons text-xl text-teal-500">web</span>
              </div>
              <div>
                <div class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('mySubscription.webDesign.maxSites') }}
                </div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{
                    subscription.webDesignLimit === -1
                      ? $t('mySubscription.pmsUnlimited')
                      : subscription.webDesignLimit
                  }}
                </div>
              </div>
            </div>

            <!-- SSL -->
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <span class="material-icons text-xl text-green-500">lock</span>
              </div>
              <div>
                <div class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('mySubscription.webDesign.ssl') }}
                </div>
                <div class="text-lg font-semibold text-green-600 dark:text-green-400">
                  {{ $t('mySubscription.webDesign.included') }}
                </div>
              </div>
            </div>

            <!-- Custom Domain -->
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
              >
                <span class="material-icons text-xl text-purple-500">dns</span>
              </div>
              <div>
                <div class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('mySubscription.webDesign.customDomain') }}
                </div>
                <div class="text-lg font-semibold text-green-600 dark:text-green-400">
                  {{ $t('mySubscription.webDesign.included') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoices Card -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.invoices') }}
          </h3>
        </div>
        <div class="p-6">
          <div
            v-if="invoices.length === 0"
            class="text-center py-8 text-gray-500 dark:text-slate-400"
          >
            {{ $t('mySubscription.noInvoices') }}
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="invoice in invoices"
              :key="invoice._id"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="
                    invoice.status === 'paid'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-gray-100 dark:bg-slate-700'
                  "
                >
                  <span
                    class="material-icons text-lg"
                    :class="invoice.status === 'paid' ? 'text-green-500' : 'text-gray-500'"
                  >
                    receipt
                  </span>
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ invoice.invoiceNumber }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400">
                    {{ formatDate(invoice.invoiceDate) }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="font-semibold text-gray-900 dark:text-white">
                    {{ formatCurrency(invoice.total, invoice.currency) }}
                  </div>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="invoiceStatusColors[invoice.status]"
                  >
                    {{ $t(`mySubscription.invoiceStatuses.${invoice.status}`) }}
                  </span>
                </div>
                <button
                  class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  :title="$t('mySubscription.downloadInvoice')"
                  @click="downloadInvoice(invoice._id, invoice.invoiceNumber)"
                >
                  <span class="material-icons">download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Purchase History Card -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ $t('mySubscription.purchaseHistory') }}
          </h3>
        </div>
        <div class="p-6">
          <div
            v-if="!subscription.purchases?.length"
            class="text-center py-8 text-gray-500 dark:text-slate-400"
          >
            {{ $t('mySubscription.noPurchases') }}
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="purchase in subscription.purchases"
              :key="purchase._id"
              class="flex items-center justify-between p-4 rounded-lg border"
              :class="{
                'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800':
                  purchase.status === 'pending',
                'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800':
                  purchase.status === 'active',
                'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-700':
                  purchase.status === 'expired',
                'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800':
                  purchase.status === 'cancelled'
              }"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center"
                  :class="planColors[purchase.plan]?.bg || 'bg-gray-100 dark:bg-slate-700'"
                >
                  <span
                    class="material-icons text-xl"
                    :class="planColors[purchase.plan]?.text || 'text-gray-500'"
                  >
                    {{ planColors[purchase.plan]?.icon || 'workspace_premium' }}
                  </span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ getPlanName(purchase.plan) }}
                    </span>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full"
                      :class="purchaseStatusColors[purchase.status]"
                    >
                      {{ $t(`mySubscription.purchaseStatus.${purchase.status}`) }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    {{ formatDate(purchase.period?.startDate) }} -
                    {{ formatDate(purchase.period?.endDate) }}
                  </div>
                </div>
              </div>
              <div class="text-right flex items-center gap-3">
                <div>
                  <div class="font-semibold text-gray-900 dark:text-white">
                    {{ formatCurrency(purchase.price?.amount, purchase.price?.currency) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-slate-400">
                    {{
                      purchase.status === 'pending'
                        ? $t('mySubscription.awaitingPayment')
                        : $t(`mySubscription.paymentMethods.${purchase.payment?.method}`)
                    }}
                  </div>
                </div>
                <!-- Pay Now button for pending purchases -->
                <button
                  v-if="purchase.status === 'pending'"
                  @click="openPaymentForPending(purchase)"
                  class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <span class="material-icons text-sm">payment</span>
                  {{ $t('mySubscription.payNow') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Support -->
      <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center">
        <span class="material-icons text-4xl text-purple-500 mb-3">support_agent</span>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ $t('mySubscription.needHelp') }}
        </h3>
        <p class="text-gray-600 dark:text-slate-300 mb-4">
          {{ $t('mySubscription.contactSupport') }}
        </p>
        <a
          href="mailto:support@example.com"
          class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <span class="material-icons text-sm">email</span>
          {{ $t('mySubscription.contactUs') }}
        </a>
      </div>
    </div>

    <!-- No Subscription -->
    <div
      v-else
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center"
    >
      <span class="material-icons text-6xl text-gray-300 dark:text-slate-600 mb-4">
        card_membership
      </span>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {{ $t('mySubscription.loadError') }}
      </h2>
    </div>

    <!-- Payment Modal -->
    <Teleport to="body">
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="showPaymentModal = false"></div>

        <!-- Modal Content -->
        <div
          class="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('mySubscription.purchasePlan') }}
            </h3>
            <button
              @click="showPaymentModal = false"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-6">
            <!-- Pending Purchase Info (when paying for admin-created package) -->
            <div
              v-if="selectedPendingPurchase"
              class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center"
                  :class="planColors[selectedPendingPurchase.plan]?.bg"
                >
                  <span
                    class="material-icons text-xl"
                    :class="planColors[selectedPendingPurchase.plan]?.text"
                  >
                    {{ planColors[selectedPendingPurchase.plan]?.icon }}
                  </span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-900 dark:text-white">
                      {{ getPlanName(selectedPendingPurchase.plan) }}
                    </span>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    >
                      {{ $t('mySubscription.purchaseStatus.pending') }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    {{ formatDate(selectedPendingPurchase.period?.startDate) }} -
                    {{ formatDate(selectedPendingPurchase.period?.endDate) }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{
                      formatCurrency(
                        selectedPendingPurchase.price?.amount,
                        selectedPendingPurchase.price?.currency
                      )
                    }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Plan Selection (only for new purchases, not for pending) -->
            <div v-else>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                {{ $t('mySubscription.selectPlan') }}
              </label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  v-for="(plan, key) in availablePlans"
                  :key="key"
                  @click="selectedPlan = key"
                  class="p-4 border-2 rounded-xl cursor-pointer transition-all"
                  :class="
                    selectedPlan === key
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
                  "
                >
                  <div class="flex items-center gap-3 mb-2">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center"
                      :class="planColors[key]?.bg"
                    >
                      <span class="material-icons" :class="planColors[key]?.text">
                        {{ planColors[key]?.icon }}
                      </span>
                    </div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">
                      {{ plan.name }}
                    </h4>
                  </div>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${{ plan.price.yearly }}
                    <span class="text-sm font-normal text-gray-500 dark:text-slate-400"
                      >/{{ $t('mySubscription.year') }}</span
                    >
                  </p>
                  <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    {{ plan.description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Card Form -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                {{ $t('mySubscription.cardInfo') }}
              </label>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm text-gray-600 dark:text-slate-400 mb-1">
                    {{ $t('mySubscription.cardHolder') }}
                  </label>
                  <input
                    v-model="card.holder"
                    type="text"
                    :placeholder="$t('mySubscription.cardHolderPlaceholder')"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 dark:text-slate-400 mb-1">
                    {{ $t('mySubscription.cardNumber') }}
                  </label>
                  <div class="relative">
                    <input
                      v-model="card.number"
                      type="text"
                      maxlength="19"
                      :placeholder="$t('mySubscription.cardNumberPlaceholder')"
                      @input="handleCardNumberInput"
                      class="w-full px-4 py-3 pr-24 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    />
                    <!-- Card Brand & Bank Info -->
                    <div
                      v-if="binInfo"
                      class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2"
                    >
                      <span
                        v-if="binInfo.cardFamily"
                        class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300"
                      >
                        {{ binInfo.cardFamily }}
                      </span>
                      <img
                        v-if="binInfo.brand"
                        :src="getCardBrandLogo(binInfo.brand)"
                        :alt="binInfo.brand"
                        class="h-6 w-auto"
                      />
                    </div>
                    <div v-else-if="binLoading" class="absolute right-3 top-1/2 -translate-y-1/2">
                      <span class="material-icons animate-spin text-gray-400 text-sm">refresh</span>
                    </div>
                  </div>
                  <!-- Bank Name -->
                  <p
                    v-if="binInfo?.bankName"
                    class="mt-1 text-xs text-gray-500 dark:text-slate-400"
                  >
                    {{ binInfo.bankName }}
                  </p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm text-gray-600 dark:text-slate-400 mb-1">
                      {{ $t('mySubscription.expiry') }}
                    </label>
                    <input
                      v-model="card.expiry"
                      type="text"
                      maxlength="5"
                      placeholder="MM/YY"
                      @input="formatExpiry"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-gray-600 dark:text-slate-400 mb-1">
                      {{ $t('mySubscription.cvv') }}
                    </label>
                    <input
                      v-model="card.cvv"
                      type="password"
                      maxlength="4"
                      placeholder="***"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Installment Selection -->
            <div v-if="installmentOptions.length > 1">
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                {{ $t('mySubscription.installment') }}
              </label>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  v-for="option in installmentOptions"
                  :key="option.count"
                  type="button"
                  @click="selectedInstallment = option.count"
                  class="p-3 border-2 rounded-lg text-center transition-all"
                  :class="
                    selectedInstallment === option.count
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
                  "
                >
                  <div class="font-semibold text-gray-900 dark:text-white">
                    {{
                      option.count === 1
                        ? $t('mySubscription.singlePayment')
                        : `${option.count} ${$t('mySubscription.installments')}`
                    }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400">
                    {{ formatCurrency(option.amount, 'USD') }}
                    <span v-if="option.count > 1">x {{ option.count }}</span>
                  </div>
                  <div
                    v-if="option.totalAmount > selectedPlanPrice"
                    class="text-xs text-amber-600 dark:text-amber-400 mt-1"
                  >
                    +{{ formatCurrency(option.totalAmount - selectedPlanPrice, 'USD') }}
                  </div>
                </button>
              </div>
            </div>

            <!-- Error Message -->
            <div
              v-if="paymentError"
              class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div class="flex items-center gap-2 text-red-700 dark:text-red-400">
                <span class="material-icons text-sm">error</span>
                {{ paymentError }}
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
          >
            <button
              @click="showPaymentModal = false"
              class="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              @click="processPurchase"
              :disabled="processing || !isCardValid"
              class="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <span v-if="processing" class="material-icons animate-spin text-sm">refresh</span>
              <span class="material-icons text-sm" v-else>lock</span>
              {{ processing ? $t('mySubscription.processing') : $t('mySubscription.payNow') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 3D Secure Modal -->
    <Teleport to="body">
      <div v-if="show3DModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50"></div>

        <!-- Modal Content -->
        <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span class="material-icons text-green-500">verified_user</span>
              {{ $t('mySubscription.securePayment') }}
            </h3>
          </div>

          <!-- 3D Secure iframe -->
          <div class="p-4">
            <iframe
              :src="formUrl"
              class="w-full h-96 border border-gray-200 dark:border-slate-700 rounded-lg"
              frameborder="0"
            ></iframe>
          </div>

          <!-- Info -->
          <div
            class="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
          >
            <p class="text-sm text-gray-500 dark:text-slate-400 text-center">
              {{ $t('mySubscription.securePaymentInfo') }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Success Message -->
    <Teleport to="body">
      <div v-if="showSuccessMessage" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showSuccessMessage = false"></div>
        <div
          class="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center"
        >
          <div
            class="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
          >
            <span class="material-icons text-4xl text-green-500">check_circle</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ $t('mySubscription.paymentSuccess') }}
          </h3>
          <p class="text-gray-500 dark:text-slate-400 mb-6">
            {{ $t('mySubscription.subscriptionActivated') }}
          </p>
          <button
            @click="
              showSuccessMessage = false
              loadData()
            "
            class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {{ $t('common.ok') }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import partnerService from '@/services/partnerService'
import subscriptionInvoiceService from '@/services/subscriptionInvoiceService'
import { createLogger } from '@/utils/logger'

const logger = createLogger('Subscription')

const { t, locale } = useI18n()
const authStore = useAuthStore()

const loading = ref(true)
const subscription = ref(null)
const invoices = ref([])

// Payment modal state
const showPaymentModal = ref(false)
const show3DModal = ref(false)
const showSuccessMessage = ref(false)
const selectedPlan = ref('professional')
const selectedPendingPurchase = ref(null) // For paying admin-created pending purchases
const processing = ref(false)
const paymentError = ref('')
const formUrl = ref('')
const card = ref({
  holder: '',
  number: '',
  expiry: '',
  cvv: ''
})

// BIN query state
const binInfo = ref(null)
const binLoading = ref(false)
const selectedInstallment = ref(1)
const installmentOptions = ref([{ count: 1, amount: 0, totalAmount: 0 }])
let binQueryTimeout = null

// Available plans
const availablePlans = {
  webdesign: {
    name: 'Web Design',
    description: 'Web tasarım ve domain yönetimi',
    price: { yearly: 29 }
  },
  business: {
    name: 'Business',
    description: 'Orta ölçekli işletmeler için',
    price: { yearly: 118.9 }
  },
  professional: {
    name: 'Professional',
    description: 'PMS entegrasyonu dahil',
    price: { yearly: 178.8 }
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Sınırsız PMS',
    price: { yearly: 298.8 }
  }
}

const planColors = {
  webdesign: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-500',
    icon: 'web'
  },
  business: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-500',
    icon: 'business'
  },
  professional: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-500',
    icon: 'workspace_premium'
  },
  enterprise: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-500',
    icon: 'diamond'
  }
}

const statusColors = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  grace_period: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

const invoiceStatusColors = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
}

const purchaseStatusColors = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  expired: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
}

const getPlanName = plan => {
  const planNames = {
    webdesign: 'Web Design',
    business: 'Business',
    professional: 'Professional',
    enterprise: 'Enterprise'
  }
  return planNames[plan] || plan
}

const remainingDaysColor = computed(() => {
  if (!subscription.value) return 'text-gray-500'
  if (subscription.value.remainingDays > 30) return 'text-green-600 dark:text-green-400'
  if (subscription.value.remainingDays > 7) return 'text-amber-600 dark:text-amber-400'
  if (subscription.value.remainingDays > 0) return 'text-red-600 dark:text-red-400'
  if (subscription.value.gracePeriodRemainingDays > 0) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const progressPercentage = computed(() => {
  if (!subscription.value?.startDate || !subscription.value?.endDate) return 0
  const start = new Date(subscription.value.startDate).getTime()
  const end = new Date(subscription.value.endDate).getTime()
  const now = Date.now()
  const total = end - start
  const elapsed = now - start
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
})

const pmsUsagePercentage = computed(() => {
  if (!subscription.value || subscription.value.pmsLimit <= 0) return 0
  return Math.round((subscription.value.pmsUsed / subscription.value.pmsLimit) * 100)
})

const formatDate = dateStr => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

const loadData = async () => {
  loading.value = true
  try {
    // Get subscription info
    const response = await partnerService.getMySubscription()
    subscription.value = response.data

    // Get invoices
    const invoicesResponse = await subscriptionInvoiceService.getMyInvoices()
    invoices.value = invoicesResponse.data?.invoices || []
  } catch (error) {
    logger.error('Failed to load subscription:', error)
  } finally {
    loading.value = false
  }
}

const downloadInvoice = async (invoiceId, invoiceNumber) => {
  try {
    await subscriptionInvoiceService.downloadMyInvoicePDF(invoiceId, invoiceNumber)
  } catch (error) {
    logger.error('Failed to download invoice:', error)
  }
}

// Card validation
const isCardValid = computed(() => {
  return (
    card.value.holder.length >= 3 &&
    card.value.number.replace(/\s/g, '').length >= 15 &&
    /^\d{2}\/\d{2}$/.test(card.value.expiry) &&
    card.value.cvv.length >= 3
  )
})

// Format card number with spaces and query BIN
const handleCardNumberInput = () => {
  let value = card.value.number.replace(/\s/g, '').replace(/\D/g, '')
  value = value.substring(0, 16)
  card.value.number = value.replace(/(.{4})/g, '$1 ').trim()

  // Query BIN when we have 6 digits
  const cleanNumber = value
  if (cleanNumber.length >= 6) {
    // Debounce BIN query
    if (binQueryTimeout) clearTimeout(binQueryTimeout)
    binQueryTimeout = setTimeout(() => {
      queryBin(cleanNumber.substring(0, 6))
    }, 300)
  } else {
    binInfo.value = null
    installmentOptions.value = [
      { count: 1, amount: selectedPlanPrice.value, totalAmount: selectedPlanPrice.value }
    ]
    selectedInstallment.value = 1
  }
}

// Query BIN for installment options
const queryBin = async bin => {
  binLoading.value = true
  try {
    const response = await partnerService.querySubscriptionBin(bin, selectedPlan.value)
    if (response.success && response.data) {
      binInfo.value = response.data

      // Build installment options
      if (response.data.installments?.length) {
        installmentOptions.value = response.data.installments.map(inst => ({
          count: inst.count,
          amount: inst.amount,
          totalAmount: inst.totalAmount
        }))
      } else {
        installmentOptions.value = [
          { count: 1, amount: selectedPlanPrice.value, totalAmount: selectedPlanPrice.value }
        ]
      }
      selectedInstallment.value = 1
    }
  } catch (error) {
    logger.error('BIN query failed:', error)
    binInfo.value = null
  } finally {
    binLoading.value = false
  }
}

// Get card brand logo
const getCardBrandLogo = brand => {
  const logos = {
    visa: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@6.6.6/flags/4x3/visa.svg',
    mastercard: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
    amex: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg',
    troy: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Troy_logo.svg'
  }
  return logos[brand?.toLowerCase()] || null
}

// Selected plan price
const selectedPlanPrice = computed(() => {
  return availablePlans[selectedPlan.value]?.price?.yearly || 0
})

// Format expiry date
const formatExpiry = () => {
  let value = card.value.expiry.replace(/\D/g, '')
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4)
  }
  card.value.expiry = value
}

// Open payment modal for pending purchase (admin-created)
const openPaymentForPending = purchase => {
  selectedPendingPurchase.value = purchase
  selectedPlan.value = purchase.plan
  paymentError.value = ''
  card.value = { holder: '', number: '', expiry: '', cvv: '' }
  binInfo.value = null
  selectedInstallment.value = 1
  installmentOptions.value = [
    { count: 1, amount: purchase.price?.amount || 0, totalAmount: purchase.price?.amount || 0 }
  ]
  showPaymentModal.value = true
}

// Open payment modal for new purchase (upgrade)
const openPaymentForUpgrade = () => {
  selectedPendingPurchase.value = null
  paymentError.value = ''
  card.value = { holder: '', number: '', expiry: '', cvv: '' }
  binInfo.value = null
  selectedInstallment.value = 1
  showPaymentModal.value = true
}

// Process purchase
const processPurchase = async () => {
  processing.value = true
  paymentError.value = ''

  try {
    let response

    if (selectedPendingPurchase.value) {
      // Pay for existing pending purchase
      response = await partnerService.payPendingPurchase(selectedPendingPurchase.value._id, {
        installment: selectedInstallment.value,
        card: {
          holder: card.value.holder,
          number: card.value.number.replace(/\s/g, ''),
          expiry: card.value.expiry,
          cvv: card.value.cvv
        }
      })
    } else {
      // Create new purchase
      response = await partnerService.initiatePurchase({
        plan: selectedPlan.value,
        installment: selectedInstallment.value,
        card: {
          holder: card.value.holder,
          number: card.value.number.replace(/\s/g, ''),
          expiry: card.value.expiry,
          cvv: card.value.cvv
        }
      })
    }

    if (response.success && response.data?.formUrl) {
      showPaymentModal.value = false
      formUrl.value = response.data.formUrl
      show3DModal.value = true
    } else {
      paymentError.value = response.error || t('mySubscription.paymentFailed')
    }
  } catch (error) {
    logger.error('Payment error:', error)
    paymentError.value = error.response?.data?.error || t('mySubscription.paymentFailed')
  } finally {
    processing.value = false
  }
}

// Handle payment result from iframe postMessage
const handlePaymentMessage = event => {
  // Accept messages from payment service
  if (event.data?.type === 'payment_result') {
    show3DModal.value = false

    if (event.data.data?.success) {
      showSuccessMessage.value = true
      // Reset card form
      card.value = { holder: '', number: '', expiry: '', cvv: '' }
    } else {
      paymentError.value = event.data.data?.message || t('mySubscription.paymentFailed')
      showPaymentModal.value = true
    }
  }
}

onMounted(() => {
  loadData()
  // Listen for payment result messages
  window.addEventListener('message', handlePaymentMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handlePaymentMessage)
})
</script>
