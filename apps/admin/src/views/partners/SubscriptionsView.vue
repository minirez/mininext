<template>
  <div>
    <ModuleNavigation :items="navItems" color="purple" />

    <div class="p-6">
      <!-- Revenue Dashboard -->
      <div class="mb-6 space-y-4">
        <!-- Top Row: Revenue hero + key metrics -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Revenue Hero Card -->
          <div
            class="lg:col-span-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-6 text-white relative overflow-hidden"
          >
            <div
              class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"
            ></div>
            <div
              class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6"
            ></div>
            <div class="relative">
              <div class="flex items-center gap-2 mb-1">
                <span class="material-icons text-purple-200 text-lg">account_balance</span>
                <span class="text-sm font-medium text-purple-200">{{
                  $t('partnerSubscriptions.dashboard.totalEarned')
                }}</span>
              </div>
              <div class="text-3xl font-bold tracking-tight mb-3">
                €{{ formatMoney(revenueStats.totalEarned) }}
              </div>
              <div class="flex items-center gap-4 text-sm">
                <div>
                  <div class="text-purple-300">
                    {{ $t('partnerSubscriptions.dashboard.thisYear') }}
                  </div>
                  <div class="font-semibold">€{{ formatMoney(revenueStats.thisYearEarned) }}</div>
                </div>
                <div class="w-px h-8 bg-white/20"></div>
                <div>
                  <div class="text-purple-300">
                    {{ $t('partnerSubscriptions.dashboard.collected') }}
                  </div>
                  <div class="font-semibold">{{ revenueStats.collectionRate }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Key Financial Metrics -->
          <div class="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <!-- MRR -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col justify-between"
            >
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
                >
                  <span
                    class="material-icons text-emerald-600 dark:text-emerald-400"
                    style="font-size: 18px"
                    >trending_up</span
                  >
                </div>
              </div>
              <div>
                <div class="text-xl font-bold text-gray-900 dark:text-white">
                  €{{ formatMoney(revenueStats.mrr) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {{ $t('partnerSubscriptions.dashboard.mrr') }}
                </div>
              </div>
            </div>

            <!-- ARR / Annual Projection -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col justify-between"
            >
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
                >
                  <span
                    class="material-icons text-blue-600 dark:text-blue-400"
                    style="font-size: 18px"
                    >show_chart</span
                  >
                </div>
              </div>
              <div>
                <div class="text-xl font-bold text-gray-900 dark:text-white">
                  €{{ formatMoney(revenueStats.arr) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {{ $t('partnerSubscriptions.dashboard.arr') }}
                </div>
              </div>
            </div>

            <!-- Pending Collections -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col justify-between"
            >
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
                >
                  <span
                    class="material-icons text-amber-600 dark:text-amber-400"
                    style="font-size: 18px"
                    >schedule</span
                  >
                </div>
              </div>
              <div>
                <div class="text-xl font-bold text-gray-900 dark:text-white">
                  €{{ formatMoney(revenueStats.pendingAmount) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {{ $t('partnerSubscriptions.dashboard.pendingCollections') }}
                </div>
              </div>
            </div>

            <!-- Next 30 Days -->
            <div
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col justify-between"
            >
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center"
                >
                  <span
                    class="material-icons text-violet-600 dark:text-violet-400"
                    style="font-size: 18px"
                    >refresh</span
                  >
                </div>
              </div>
              <div>
                <div class="text-xl font-bold text-gray-900 dark:text-white">
                  €{{ formatMoney(revenueStats.next30Days) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {{ $t('partnerSubscriptions.dashboard.next30Days') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Row: Status breakdown + Revenue split + Upcoming renewals -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Subscription Status Breakdown -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ $t('partnerSubscriptions.dashboard.statusBreakdown') }}
              </h3>
              <span class="text-xs text-gray-500 dark:text-slate-400"
                >{{ allPurchases.length }} {{ $t('partnerSubscriptions.dashboard.total') }}</span
              >
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                <span class="text-sm text-gray-700 dark:text-slate-300 flex-1">{{
                  $t('partnerSubscriptions.status.active')
                }}</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">{{
                  stats.active
                }}</span>
                <div class="w-16 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-green-500 rounded-full"
                    :style="{ width: statusBarWidth(stats.active) }"
                  ></div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></div>
                <span class="text-sm text-gray-700 dark:text-slate-300 flex-1">{{
                  $t('partnerSubscriptions.status.pending')
                }}</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">{{
                  stats.pending
                }}</span>
                <div class="w-16 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-amber-500 rounded-full"
                    :style="{ width: statusBarWidth(stats.pending) }"
                  ></div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                <span class="text-sm text-gray-700 dark:text-slate-300 flex-1">{{
                  $t('partnerSubscriptions.status.expired')
                }}</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">{{
                  stats.expired
                }}</span>
                <div class="w-16 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-red-500 rounded-full"
                    :style="{ width: statusBarWidth(stats.expired) }"
                  ></div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></div>
                <span class="text-sm text-gray-700 dark:text-slate-300 flex-1">{{
                  $t('partnerSubscriptions.status.cancelled')
                }}</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">{{
                  stats.cancelled
                }}</span>
                <div class="w-16 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gray-400 rounded-full"
                    :style="{ width: statusBarWidth(stats.cancelled) }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Revenue by Subscription -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ $t('partnerSubscriptions.dashboard.revenueBySubscription') }}
              </h3>
              <span class="text-xs text-gray-500 dark:text-slate-400"
                >€{{ formatMoney(revenueStats.totalEarned) }}</span
              >
            </div>
            <div
              v-if="revenueBySubscription.length === 0"
              class="text-center py-4 text-sm text-gray-400 dark:text-slate-500"
            >
              {{ $t('partnerSubscriptions.noPurchases') }}
            </div>
            <div v-else class="space-y-3">
              <div v-for="(sub, idx) in revenueBySubscription" :key="sub.label">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm text-gray-700 dark:text-slate-300 truncate flex-1 mr-2">{{
                    sub.label
                  }}</span>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs text-gray-400 dark:text-slate-500">{{ sub.count }}x</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white"
                      >€{{ formatMoney(sub.amount) }}</span
                    >
                  </div>
                </div>
                <div
                  class="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full rounded-full transition-all"
                    :class="subscriptionBarColors[idx % subscriptionBarColors.length]"
                    :style="{ width: subscriptionBarWidth(sub.amount) }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming Renewals -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5"
          >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {{ $t('partnerSubscriptions.dashboard.upcomingRenewals') }}
            </h3>
            <div
              v-if="upcomingRenewals.length === 0"
              class="text-center py-4 text-sm text-gray-400 dark:text-slate-500"
            >
              {{ $t('partnerSubscriptions.dashboard.noUpcoming') }}
            </div>
            <div v-else class="space-y-2.5">
              <div
                v-for="item in upcomingRenewals"
                :key="item.purchase._id"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                @click="goToPartner(item.partner._id)"
              >
                <div
                  class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                >
                  {{ getInitials(item.partner.companyName) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ item.partner.companyName }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-slate-400">
                    {{ item.purchase.label?.tr || item.purchase.label?.en }}
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-sm font-semibold text-gray-900 dark:text-white">
                    €{{ (item.purchase.price?.amount || 0).toFixed(0) }}
                  </div>
                  <div class="text-xs" :class="renewalUrgencyClass(item)">
                    {{ formatRenewalDate(item) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <div class="flex flex-wrap items-center gap-3">
          <!-- Search -->
          <div class="flex-1 min-w-[220px] relative">
            <span
              class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-lg"
            >
              search
            </span>
            <input
              v-model="filters.search"
              type="text"
              class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              :placeholder="$t('partnerSubscriptions.searchPlaceholder')"
            />
          </div>

          <!-- Status Filter -->
          <div class="min-w-[160px]">
            <Dropdown
              v-model="filters.status"
              :options="statusOptions"
              :placeholder="$t('partnerSubscriptions.allStatuses')"
              clearable
              size="md"
            />
          </div>

          <!-- Type Filter -->
          <div class="min-w-[180px]">
            <Dropdown
              v-model="filters.type"
              :options="typeOptions"
              :placeholder="$t('partnerSubscriptions.allTypes')"
              clearable
              size="md"
            />
          </div>

          <!-- Show Deleted Toggle -->
          <label
            class="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer select-none transition-colors text-sm"
            :class="
              filters.showDeleted
                ? 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
            "
          >
            <input v-model="filters.showDeleted" type="checkbox" class="sr-only" />
            <span class="material-icons text-lg">
              {{ filters.showDeleted ? 'visibility' : 'visibility_off' }}
            </span>
            {{ $t('partnerSubscriptions.showDeleted') }}
          </label>

          <!-- Show Payment Links -->
          <button
            type="button"
            class="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors text-sm border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400"
            @click="openPaymentLinksModal"
          >
            <span class="material-icons text-lg">payments</span>
            {{ $t('partnerSubscriptions.showPaymentLinks') }}
          </button>
        </div>
      </div>

      <!-- Purchases Table -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div v-if="loading" class="p-8 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"
          ></div>
          <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</p>
        </div>

        <div v-else-if="filteredPurchases.length === 0" class="p-8 text-center">
          <span class="material-icons text-4xl text-gray-400 dark:text-slate-500">inventory_2</span>
          <p class="mt-2 text-gray-500 dark:text-slate-400">
            {{ $t('partnerSubscriptions.noPurchases') }}
          </p>
        </div>

        <table v-else class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('partnerSubscriptions.partner') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('partnerSubscriptions.plan') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('partnerSubscriptions.period') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('partnerSubscriptions.amount') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('partnerSubscriptions.paymentStatus') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('partnerSubscriptions.statusLabel') }}
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
              :class="{
                'bg-amber-50 dark:bg-amber-900/10': item.purchase.status === 'pending',
                'opacity-50': item.purchase.status === 'deleted'
              }"
            >
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ item.partner.companyName }}
                </div>
                <div class="text-sm text-gray-500 dark:text-slate-400">
                  {{ item.partner.email }}
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="badge"
                  :class="
                    item.purchase.type === 'package_subscription' ? 'badge-primary' : 'badge-info'
                  "
                >
                  {{ item.purchase.label?.tr || item.purchase.label?.en || '-' }}
                </span>
                <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {{
                    item.purchase.type === 'package_subscription'
                      ? $t('subscriptionPackages.title')
                      : $t('subscriptionServices.title')
                  }}
                </div>
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
                  €{{ (item.purchase.price?.amount || 0).toFixed(2) }}
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="badge"
                  :class="item.purchase.payment?.date ? 'badge-success' : 'badge-warning'"
                >
                  {{
                    item.purchase.payment?.date
                      ? $t('partnerSubscriptions.paymentCompleted')
                      : $t('partnerSubscriptions.paymentPending')
                  }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="badge"
                  :class="{
                    'badge-warning': item.purchase.status === 'pending',
                    'badge-success': item.purchase.status === 'active',
                    'badge-secondary': item.purchase.status === 'expired',
                    'badge-danger':
                      item.purchase.status === 'cancelled' || item.purchase.status === 'deleted'
                  }"
                >
                  {{ $t(`partnerSubscriptions.status.${item.purchase.status}`) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button
                    v-if="item.purchase.status === 'pending'"
                    class="p-2 text-green-600 hover:text-green-700 dark:text-green-400"
                    :title="$t('partnerSubscriptions.markAsPaid')"
                    @click="openMarkPaidModal(item)"
                  >
                    <span class="material-icons text-xl">check_circle</span>
                  </button>
                  <button
                    v-if="['pending', 'active'].includes(item.purchase.status)"
                    class="p-2 text-gray-600 hover:text-gray-700 dark:text-slate-400"
                    :title="$t('partnerSubscriptions.edit')"
                    @click="openEditModal(item)"
                  >
                    <span class="material-icons text-xl">edit</span>
                  </button>
                  <button
                    v-if="['pending', 'active'].includes(item.purchase.status)"
                    class="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                    :title="$t('partnerSubscriptions.cancel')"
                    @click="confirmCancel(item)"
                  >
                    <span class="material-icons text-xl">cancel</span>
                  </button>
                  <button
                    v-if="['cancelled', 'expired', 'refunded'].includes(item.purchase.status)"
                    class="p-2 text-gray-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                    :title="$t('partnerSubscriptions.delete')"
                    @click="confirmDelete(item)"
                  >
                    <span class="material-icons text-xl">delete_outline</span>
                  </button>
                  <button
                    class="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
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
        <div v-if="selectedItem" class="space-y-5">
          <!-- Partner & Purchase Info -->
          <div
            class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800/40"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center"
              >
                <span class="material-icons text-green-600 dark:text-green-400">payments</span>
              </div>
              <div>
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ selectedItem.partner.companyName }}
                </div>
                <div class="text-sm text-gray-600 dark:text-slate-400">
                  {{ selectedItem.purchase.label?.tr || selectedItem.purchase.label?.en }}
                  <span class="font-semibold text-green-700 dark:text-green-400">
                    – €{{ (selectedItem.purchase.price?.amount || 0).toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <DatePicker
                v-model="markPaidForm.paymentDate"
                :label="$t('partnerSubscriptions.paymentDate')"
                required
                :placeholder="$t('partnerSubscriptions.selectDate')"
              />
            </div>
            <div>
              <Dropdown
                v-model="markPaidForm.paymentMethod"
                :label="$t('partnerSubscriptions.paymentMethod')"
                :options="paymentMethodOptions"
                size="md"
              />
            </div>
          </div>
          <div>
            <label class="form-label">{{ $t('partnerSubscriptions.reference') }}</label>
            <input v-model="markPaidForm.paymentReference" type="text" class="form-input" />
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
            <span v-else>{{ $t('partnerSubscriptions.confirmPayment') }}</span>
          </button>
        </template>
      </Modal>

      <!-- Edit Modal (Enriched) -->
      <Modal v-model="showEditModal" :title="$t('partnerSubscriptions.editPackage')" size="lg">
        <div v-if="selectedItem" class="space-y-5">
          <!-- Partner Info Header -->
          <div
            class="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800/40"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center"
              >
                <span class="material-icons text-purple-600 dark:text-purple-400">business</span>
              </div>
              <div class="flex-1">
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ selectedItem.partner.companyName }}
                </div>
                <div class="text-sm text-gray-500 dark:text-slate-400">
                  {{ selectedItem.partner.email }}
                </div>
              </div>
              <span
                class="badge"
                :class="{
                  'badge-warning': selectedItem.purchase.status === 'pending',
                  'badge-success': selectedItem.purchase.status === 'active'
                }"
              >
                {{ $t(`partnerSubscriptions.status.${selectedItem.purchase.status}`) }}
              </span>
            </div>
          </div>

          <!-- Package / Service Change -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-indigo-500 text-lg">swap_horiz</span>
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ $t('partnerSubscriptions.changePackage') }}
              </h4>
            </div>

            <div v-if="selectedItem.purchase.type === 'package_subscription'">
              <label class="form-label">{{ $t('partnerSubscriptions.selectPackage') }}</label>
              <div v-if="catalogLoading" class="flex items-center gap-2 text-sm text-gray-500 py-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                {{ $t('common.loading') }}
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  v-for="pkg in availablePackages"
                  :key="pkg._id"
                  type="button"
                  class="flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left"
                  :class="
                    editForm.packageId === pkg._id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500'
                      : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700'
                  "
                  @click="selectPackage(pkg)"
                >
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    :style="{ backgroundColor: (pkg.color || '#6366f1') + '20' }"
                  >
                    <span class="material-icons text-lg" :style="{ color: pkg.color || '#6366f1' }">
                      {{ pkg.icon || 'inventory_2' }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {{ pkg.name?.tr || pkg.name?.en }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      €{{
                        (pkg.price || pkg.overridePrice || pkg.calculatedPrice || 0).toFixed(2)
                      }}
                      / {{ $t(`partnerSubscriptions.billing.${pkg.billingPeriod || 'yearly'}`) }}
                    </div>
                  </div>
                  <span
                    v-if="editForm.packageId === pkg._id"
                    class="material-icons text-purple-500 text-lg flex-shrink-0"
                  >
                    check_circle
                  </span>
                </button>
              </div>
            </div>

            <div v-else>
              <label class="form-label">{{ $t('partnerSubscriptions.selectService') }}</label>
              <div v-if="catalogLoading" class="flex items-center gap-2 text-sm text-gray-500 py-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                {{ $t('common.loading') }}
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  v-for="svc in availableServices"
                  :key="svc._id"
                  type="button"
                  class="flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left"
                  :class="
                    editForm.serviceId === svc._id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700'
                  "
                  @click="selectService(svc)"
                >
                  <div
                    class="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0"
                  >
                    <span class="material-icons text-blue-600 dark:text-blue-400 text-lg">
                      {{ svc.icon || 'extension' }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {{ svc.name?.tr || svc.name?.en }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      €{{ (svc.price || 0).toFixed(2) }} /
                      {{ $t(`partnerSubscriptions.billing.${svc.billingPeriod || 'yearly'}`) }}
                    </div>
                  </div>
                  <span
                    v-if="editForm.serviceId === svc._id"
                    class="material-icons text-blue-500 text-lg flex-shrink-0"
                  >
                    check_circle
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Period & Pricing -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-indigo-500 text-lg">calendar_month</span>
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ $t('partnerSubscriptions.periodAndPricing') }}
              </h4>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <DatePicker
                v-model="editForm.startDate"
                :label="$t('partnerSubscriptions.startDate')"
                :placeholder="$t('partnerSubscriptions.selectDate')"
              />
              <DatePicker
                v-model="editForm.endDate"
                :label="$t('partnerSubscriptions.endDate')"
                :min-date="editForm.startDate"
                :placeholder="$t('partnerSubscriptions.selectDate')"
              />
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label class="form-label">{{ $t('partnerSubscriptions.amount') }} (EUR)</label>
                <div class="relative">
                  <span
                    class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm font-medium"
                    >€</span
                  >
                  <input
                    v-model.number="editForm.amount"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-input pl-8"
                  />
                </div>
              </div>
              <div>
                <Dropdown
                  v-model="editForm.billingPeriod"
                  :label="$t('partnerSubscriptions.billingPeriod')"
                  :options="billingPeriodOptions"
                  size="md"
                />
              </div>
            </div>
          </div>

          <!-- Status Change -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-indigo-500 text-lg">toggle_on</span>
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ $t('partnerSubscriptions.statusLabel') }}
              </h4>
            </div>
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all"
                :class="
                  editForm.status === 'pending'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-amber-300'
                "
                @click="editForm.status = 'pending'"
              >
                <span class="material-icons text-lg">pending</span>
                {{ $t('partnerSubscriptions.status.pending') }}
              </button>
              <button
                type="button"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all"
                :class="
                  editForm.status === 'active'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-green-300'
                "
                @click="editForm.status = 'active'"
              >
                <span class="material-icons text-lg">check_circle</span>
                {{ $t('partnerSubscriptions.status.active') }}
              </button>
            </div>
          </div>

          <!-- Payment Details -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-indigo-500 text-lg">receipt_long</span>
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ $t('partnerSubscriptions.paymentDetails') }}
              </h4>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Dropdown
                  v-model="editForm.paymentMethod"
                  :label="$t('partnerSubscriptions.paymentMethod')"
                  :options="editPaymentMethodOptions"
                  size="md"
                />
              </div>
              <div>
                <label class="form-label">{{ $t('partnerSubscriptions.reference') }}</label>
                <input v-model="editForm.paymentReference" type="text" class="form-input" />
              </div>
            </div>
            <div class="mt-4">
              <label class="form-label">{{ $t('partnerSubscriptions.notes') }}</label>
              <textarea
                v-model="editForm.paymentNotes"
                rows="2"
                class="form-input"
                :placeholder="$t('partnerSubscriptions.notesPlaceholder')"
              ></textarea>
            </div>
          </div>

          <!-- Payment Links Section -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-indigo-500 text-lg">link</span>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ $t('partnerSubscriptions.paymentLinks') }}
                </h4>
              </div>
              <button
                v-if="selectedItem?.purchase.status === 'pending'"
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                :disabled="sendingLink"
                @click="handleCreatePaymentLinkFromEdit"
              >
                <span class="material-icons text-sm">{{
                  sendingLink ? 'refresh' : 'add_link'
                }}</span>
                {{ $t('partnerSubscriptions.createPaymentLink') }}
              </button>
            </div>

            <div v-if="visiblePaymentLinks.length === 0" class="text-center py-4">
              <span class="material-icons text-2xl text-gray-300 dark:text-slate-600"
                >link_off</span
              >
              <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">
                {{ $t('partnerSubscriptions.noPaymentLinks') }}
              </p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="link in visiblePaymentLinks"
                :key="link._id"
                class="p-3 rounded-lg border transition-colors"
                :class="
                  link.status === 'paid'
                    ? 'border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/10'
                    : link.status === 'expired' || link.status === 'cancelled'
                      ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 opacity-60'
                      : 'border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-900/10'
                "
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    :class="
                      link.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : link.status === 'expired' || link.status === 'cancelled'
                          ? 'bg-gray-100 dark:bg-slate-700'
                          : 'bg-purple-100 dark:bg-purple-900/30'
                    "
                  >
                    <span
                      class="material-icons text-sm"
                      :class="
                        link.status === 'paid'
                          ? 'text-green-600 dark:text-green-400'
                          : link.status === 'expired' || link.status === 'cancelled'
                            ? 'text-gray-400 dark:text-slate-500'
                            : 'text-purple-600 dark:text-purple-400'
                      "
                    >
                      {{
                        link.status === 'paid'
                          ? 'check_circle'
                          : link.status === 'expired'
                            ? 'timer_off'
                            : link.status === 'cancelled'
                              ? 'cancel'
                              : 'pending'
                      }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ link.linkNumber }}
                      </span>
                      <span
                        class="badge text-xs"
                        :class="{
                          'badge-success': link.status === 'paid',
                          'badge-warning': link.status === 'pending' || link.status === 'viewed',
                          'badge-secondary': link.status === 'expired',
                          'badge-danger': link.status === 'cancelled'
                        }"
                      >
                        {{ link.status }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      €{{ (link.amount || 0).toFixed(2) }}
                      <template v-if="link.tax?.rate > 0">
                        <span class="text-gray-400 dark:text-slate-500"
                          >(KDV %{{ link.tax.rate }} dahil)</span
                        >
                      </template>
                      &middot; {{ formatDate(link.createdAt) }}
                      <template v-if="link.paidAt">
                        &middot; {{ $t('partnerSubscriptions.paidAt') }}:
                        {{ formatDate(link.paidAt) }}</template
                      >
                    </div>
                  </div>
                </div>

                <!-- Action buttons for active links -->
                <div
                  v-if="['pending', 'viewed'].includes(link.status)"
                  class="flex items-center gap-1.5 mt-2 pt-2 border-t border-purple-100 dark:border-purple-800/30"
                >
                  <button
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    :disabled="linkActionLoading"
                    :title="$t('partnerSubscriptions.sendEmail')"
                    @click="handleResendLinkNotification(link, 'email')"
                  >
                    <span class="material-icons text-xs">email</span>
                    {{ $t('partnerSubscriptions.sendEmail') }}
                  </button>
                  <button
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                    :disabled="linkActionLoading"
                    :title="$t('partnerSubscriptions.sendSms')"
                    @click="handleResendLinkNotification(link, 'sms')"
                  >
                    <span class="material-icons text-xs">sms</span>
                    {{ $t('partnerSubscriptions.sendSms') }}
                  </button>
                  <button
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    :title="$t('partnerSubscriptions.copyLink')"
                    @click="copyPaymentLink(link.paymentUrl)"
                  >
                    <span class="material-icons text-xs">content_copy</span>
                  </button>
                  <div class="flex-1"></div>
                  <button
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    :disabled="linkActionLoading"
                    :title="$t('partnerSubscriptions.cancelLink')"
                    @click="handleCancelPaymentLink(link)"
                  >
                    <span class="material-icons text-xs">close</span>
                    {{ $t('partnerSubscriptions.cancelLink') }}
                  </button>
                </div>

                <!-- Hide button for cancelled/expired links -->
                <div
                  v-if="['cancelled', 'expired'].includes(link.status)"
                  class="flex items-center justify-end mt-2 pt-2 border-t border-gray-100 dark:border-slate-700"
                >
                  <button
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    :title="$t('partnerSubscriptions.hideLink')"
                    @click="hidePaymentLink(link._id)"
                  >
                    <span class="material-icons text-xs">visibility_off</span>
                    {{ $t('partnerSubscriptions.hideLink') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <button class="btn-secondary" @click="showEditModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn-primary" :disabled="processing" @click="handleUpdate">
            <span v-if="processing" class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {{ $t('common.loading') }}
            </span>
            <span v-else class="flex items-center gap-2">
              <span class="material-icons text-lg">save</span>
              {{ $t('common.save') }}
            </span>
          </button>
        </template>
      </Modal>

      <!-- Cancel Confirmation Dialog -->
      <ConfirmDialog
        v-model="showCancelDialog"
        type="danger"
        :title="$t('partnerSubscriptions.cancel')"
        :message="$t('partnerSubscriptions.cancelConfirm')"
        :confirm-text="$t('partnerSubscriptions.cancel')"
        :cancel-text="$t('common.cancel')"
        @confirm="handleCancelPurchase"
      />

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        v-model="showDeleteDialog"
        type="danger"
        :title="$t('partnerSubscriptions.delete')"
        :message="$t('partnerSubscriptions.deleteConfirm')"
        :confirm-text="$t('partnerSubscriptions.delete')"
        :cancel-text="$t('common.cancel')"
        @confirm="handleDeletePurchase"
      />

      <!-- Cancel Payment Link Confirmation Dialog -->
      <ConfirmDialog
        v-model="showCancelLinkDialog"
        type="danger"
        :title="$t('partnerSubscriptions.cancelLink')"
        :message="$t('partnerSubscriptions.cancelLinkConfirm')"
        :confirm-text="$t('partnerSubscriptions.cancelLink')"
        :cancel-text="$t('common.cancel')"
        @confirm="confirmCancelPaymentLink"
      />

      <!-- All Payment Links Modal -->
      <Modal
        v-model="showPaymentLinksModal"
        :title="$t('partnerSubscriptions.allPaymentLinks')"
        size="xl"
      >
        <div class="space-y-3">
          <!-- Filter tabs -->
          <div class="flex items-center gap-2 border-b border-gray-200 dark:border-slate-700 pb-3">
            <button
              v-for="s in paymentLinkStatusTabs"
              :key="s.value"
              class="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
              :class="
                allLinksFilter === s.value
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              "
              @click="filterAllLinks(s.value)"
            >
              {{ s.label }}
              <span
                v-if="s.count > 0"
                class="ml-1 px-1.5 py-0.5 text-[10px] rounded-full"
                :class="
                  allLinksFilter === s.value
                    ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-300'
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
                "
              >
                {{ s.count }}
              </span>
            </button>
          </div>

          <!-- Loading -->
          <div v-if="allLinksLoading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="filteredAllLinks.length === 0"
            class="text-center py-8 text-gray-400 dark:text-slate-500"
          >
            <span class="material-icons text-3xl">link_off</span>
            <p class="text-sm mt-2">{{ $t('partnerSubscriptions.noPaymentLinks') }}</p>
          </div>

          <!-- Links list -->
          <div v-else class="space-y-2 max-h-[60vh] overflow-y-auto">
            <div
              v-for="link in filteredAllLinks"
              :key="link._id"
              class="p-3 rounded-lg border transition-colors"
              :class="
                link.status === 'paid'
                  ? 'border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-900/10'
                  : link.status === 'cancelled' || link.status === 'expired'
                    ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 opacity-70'
                    : 'border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/50 dark:bg-indigo-900/10'
              "
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="
                    link.status === 'paid'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : link.status === 'cancelled' || link.status === 'expired'
                        ? 'bg-gray-100 dark:bg-slate-700'
                        : 'bg-indigo-100 dark:bg-indigo-900/30'
                  "
                >
                  <span
                    class="material-icons text-sm"
                    :class="
                      link.status === 'paid'
                        ? 'text-green-600 dark:text-green-400'
                        : link.status === 'cancelled' || link.status === 'expired'
                          ? 'text-gray-400 dark:text-slate-500'
                          : 'text-indigo-600 dark:text-indigo-400'
                    "
                  >
                    {{
                      link.status === 'paid'
                        ? 'check_circle'
                        : link.status === 'expired'
                          ? 'timer_off'
                          : link.status === 'cancelled'
                            ? 'cancel'
                            : 'pending'
                    }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ link.linkNumber }}
                    </span>
                    <span
                      class="badge text-xs"
                      :class="{
                        'badge-success': link.status === 'paid',
                        'badge-warning': link.status === 'pending' || link.status === 'viewed',
                        'badge-secondary': link.status === 'expired',
                        'badge-danger': link.status === 'cancelled'
                      }"
                    >
                      {{ link.status }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    <span class="font-medium">{{ link.customer?.name || '-' }}</span>
                    <span v-if="link.customer?.email" class="ml-1 text-gray-400"
                      >({{ link.customer.email }})</span
                    >
                  </div>
                  <div class="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    €{{ (link.amount || 0).toFixed(2) }}
                    <template v-if="link.tax?.rate > 0">
                      <span>(KDV %{{ link.tax.rate }})</span>
                    </template>
                    &middot; {{ formatDate(link.createdAt) }}
                    <template v-if="link.paidAt">
                      &middot; {{ $t('partnerSubscriptions.paidAt') }}:
                      {{ formatDate(link.paidAt) }}
                    </template>
                    <template v-if="link.description"> &middot; {{ link.description }} </template>
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    v-if="link.paymentUrl"
                    class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                    :title="$t('partnerSubscriptions.copyLink')"
                    @click="copyPaymentLink(link.paymentUrl)"
                  >
                    <span class="material-icons text-sm">content_copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import DatePicker from '@/components/ui/date/DatePicker.vue'
import Dropdown from '@/components/ui/form/Dropdown.vue'
import partnerService from '@/services/partnerService'
import paymentLinkService from '@/services/paymentLinkService'
import subscriptionPackageService from '@/services/subscriptionPackageService'
import subscriptionServiceService from '@/services/subscriptionServiceService'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()

const navItems = computed(() => [
  { name: 'partners', to: '/partners', icon: 'business', label: t('partners.title'), exact: true },
  {
    name: 'subscriptions',
    to: '/partners/subscriptions',
    icon: 'card_membership',
    label: t('partners.subscriptionManagement')
  },
  {
    name: 'services',
    to: '/partners/services',
    icon: 'miscellaneous_services',
    label: t('subscriptionServices.title')
  },
  {
    name: 'packages',
    to: '/partners/packages',
    icon: 'inventory_2',
    label: t('subscriptionPackages.title')
  }
])

const loading = ref(true)
const processing = ref(false)
const allPurchases = ref([])

const filters = ref({ search: '', status: null, type: null, showDeleted: false })

const showMarkPaidModal = ref(false)
const showEditModal = ref(false)
const selectedItem = ref(null)

const catalogLoading = ref(false)
const availablePackages = ref([])
const availableServices = ref([])
const purchasePaymentLinks = ref([])
const hiddenLinkIds = ref(new Set())
const sendingLink = ref(false)
const linkActionLoading = ref(false)
const showCancelLinkDialog = ref(false)
const cancellingLink = ref(null)

const showPaymentLinksModal = ref(false)
const allPaymentLinks = ref([])
const allLinksLoading = ref(false)
const allLinksFilter = ref('all')

const markPaidForm = ref({
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'bank_transfer',
  paymentReference: '',
  paymentNotes: ''
})

const editForm = ref({
  startDate: '',
  endDate: '',
  amount: null,
  billingPeriod: 'yearly',
  packageId: null,
  serviceId: null,
  status: 'pending',
  paymentMethod: '',
  paymentReference: '',
  paymentNotes: ''
})

const statusOptions = computed(() => {
  const opts = [
    { value: 'pending', label: t('partnerSubscriptions.status.pending'), icon: 'pending' },
    { value: 'active', label: t('partnerSubscriptions.status.active'), icon: 'check_circle' },
    { value: 'expired', label: t('partnerSubscriptions.status.expired'), icon: 'event_busy' },
    { value: 'cancelled', label: t('partnerSubscriptions.status.cancelled'), icon: 'cancel' }
  ]
  if (filters.value.showDeleted) {
    opts.push({ value: 'deleted', label: t('partnerSubscriptions.status.deleted'), icon: 'delete' })
  }
  return opts
})

const typeOptions = computed(() => [
  { value: 'package_subscription', label: t('subscriptionPackages.title'), icon: 'inventory_2' },
  {
    value: 'service_purchase',
    label: t('subscriptionServices.title'),
    icon: 'miscellaneous_services'
  }
])

const paymentMethodOptions = computed(() => [
  {
    value: 'bank_transfer',
    label: t('partners.subscription.methods.bankTransfer'),
    icon: 'account_balance'
  },
  {
    value: 'credit_card',
    label: t('partners.subscription.methods.creditCard'),
    icon: 'credit_card'
  },
  { value: 'payment_link', label: 'Payment Link', icon: 'link' },
  { value: 'cash', label: t('partners.subscription.methods.cash'), icon: 'payments' },
  { value: 'other', label: t('partners.subscription.methods.other'), icon: 'more_horiz' }
])

const editPaymentMethodOptions = computed(() => [
  { value: '', label: t('partnerSubscriptions.notSet'), icon: 'remove_circle_outline' },
  ...paymentMethodOptions.value
])

const billingPeriodOptions = computed(() => [
  { value: 'monthly', label: t('partnerSubscriptions.billing.monthly'), icon: 'calendar_month' },
  { value: 'yearly', label: t('partnerSubscriptions.billing.yearly'), icon: 'event_repeat' },
  { value: 'one_time', label: t('partnerSubscriptions.billing.one_time'), icon: 'event_available' }
])

const visiblePaymentLinks = computed(() =>
  purchasePaymentLinks.value.filter(link => !hiddenLinkIds.value.has(link._id))
)

const paymentLinkStatusTabs = computed(() => {
  const links = allPaymentLinks.value
  return [
    { value: 'all', label: t('common.all'), count: links.length },
    {
      value: 'pending',
      label: t('partnerSubscriptions.status.pending'),
      count: links.filter(l => l.status === 'pending' || l.status === 'viewed').length
    },
    {
      value: 'paid',
      label: t('partnerSubscriptions.status.paid'),
      count: links.filter(l => l.status === 'paid').length
    },
    {
      value: 'cancelled',
      label: t('partnerSubscriptions.status.cancelled'),
      count: links.filter(l => l.status === 'cancelled').length
    },
    {
      value: 'expired',
      label: t('partnerSubscriptions.status.expired'),
      count: links.filter(l => l.status === 'expired').length
    }
  ]
})

const filteredAllLinks = computed(() => {
  if (allLinksFilter.value === 'all') return allPaymentLinks.value
  if (allLinksFilter.value === 'pending') {
    return allPaymentLinks.value.filter(l => l.status === 'pending' || l.status === 'viewed')
  }
  return allPaymentLinks.value.filter(l => l.status === allLinksFilter.value)
})

const stats = computed(() => {
  const pending = allPurchases.value.filter(p => p.purchase.status === 'pending')
  return {
    pending: pending.length,
    active: allPurchases.value.filter(p => p.purchase.status === 'active').length,
    expired: allPurchases.value.filter(p => p.purchase.status === 'expired').length,
    cancelled: allPurchases.value.filter(p => p.purchase.status === 'cancelled').length,
    totalPending: pending.reduce((sum, p) => sum + (p.purchase.price?.amount || 0), 0)
  }
})

const revenueStats = computed(() => {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const paid = allPurchases.value.filter(p => p.purchase.payment?.date)
  const active = allPurchases.value.filter(p => p.purchase.status === 'active')
  const pending = allPurchases.value.filter(p => p.purchase.status === 'pending')

  const totalEarned = paid.reduce((s, p) => s + (p.purchase.price?.amount || 0), 0)

  const thisYearEarned = paid
    .filter(p => new Date(p.purchase.payment.date) >= yearStart)
    .reduce((s, p) => s + (p.purchase.price?.amount || 0), 0)

  const allRevenue = allPurchases.value.reduce((s, p) => s + (p.purchase.price?.amount || 0), 0)
  const collectionRate = allRevenue > 0 ? Math.round((totalEarned / allRevenue) * 100) : 0

  let mrr = 0
  for (const item of active) {
    const amt = item.purchase.price?.amount || 0
    const bp = item.purchase.billingPeriod
    if (bp === 'monthly') mrr += amt
    else if (bp === 'yearly') mrr += amt / 12
  }

  const arr = mrr * 12

  const pendingAmount = pending.reduce((s, p) => s + (p.purchase.price?.amount || 0), 0)

  let next30Days = 0
  for (const item of active) {
    const endDate = item.purchase.period?.endDate ? new Date(item.purchase.period.endDate) : null
    if (endDate && endDate >= now && endDate <= in30Days) {
      next30Days += item.purchase.price?.amount || 0
    }
  }
  for (const item of pending) {
    next30Days += item.purchase.price?.amount || 0
  }

  return { totalEarned, thisYearEarned, collectionRate, mrr, arr, pendingAmount, next30Days }
})

const upcomingRenewals = computed(() => {
  const now = new Date()
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  return allPurchases.value
    .filter(item => {
      if (item.purchase.status !== 'active') return false
      const endDate = item.purchase.period?.endDate ? new Date(item.purchase.period.endDate) : null
      return endDate && endDate >= now && endDate <= in60Days
    })
    .sort((a, b) => new Date(a.purchase.period.endDate) - new Date(b.purchase.period.endDate))
    .slice(0, 5)
})

const formatMoney = val => {
  if (val >= 1000)
    return val.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return val.toFixed(2)
}

const getInitials = name => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const statusBarWidth = count => {
  const total = allPurchases.value.length
  if (!total) return '0%'
  return Math.max(4, (count / total) * 100) + '%'
}

const revenueBySubscription = computed(() => {
  const map = {}
  for (const item of allPurchases.value) {
    if (!item.purchase.payment?.date) continue
    const label = item.purchase.label?.tr || item.purchase.label?.en || '-'
    if (!map[label]) map[label] = { label, amount: 0, count: 0 }
    map[label].amount += item.purchase.price?.amount || 0
    map[label].count++
  }
  return Object.values(map)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
})

const subscriptionBarColors = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500'
]

const subscriptionBarWidth = amount => {
  const max = revenueBySubscription.value[0]?.amount || 1
  return Math.max(4, (amount / max) * 100) + '%'
}

const formatRenewalDate = item => {
  const endDate = new Date(item.purchase.period.endDate)
  const now = new Date()
  const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return t('partnerSubscriptions.dashboard.today')
  if (diffDays === 1) return t('partnerSubscriptions.dashboard.tomorrow')
  return t('partnerSubscriptions.dashboard.inDays', { days: diffDays })
}

const renewalUrgencyClass = item => {
  const endDate = new Date(item.purchase.period.endDate)
  const diffDays = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 7) return 'text-red-500 dark:text-red-400 font-medium'
  if (diffDays <= 30) return 'text-amber-500 dark:text-amber-400'
  return 'text-gray-500 dark:text-slate-400'
}

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
    if (filters.value.type && item.purchase.type !== filters.value.type) return false
    return true
  })
})

const fetchAllPurchases = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.showDeleted) params.includeDeleted = 'true'
    const response = await partnerService.getAllPurchases(params)
    allPurchases.value = response.data || []
  } catch {
    toast.error(t('partnerSubscriptions.loadError'))
  } finally {
    loading.value = false
  }
}

const fetchCatalog = async () => {
  catalogLoading.value = true
  try {
    const [pkgRes, svcRes] = await Promise.all([
      subscriptionPackageService.getActivePackages(),
      subscriptionServiceService.getActiveServices()
    ])
    availablePackages.value = pkgRes.data || []
    availableServices.value = svcRes.data || []
  } catch {
    // catalog load is non-critical
  } finally {
    catalogLoading.value = false
  }
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

const openMarkPaidModal = item => {
  selectedItem.value = item
  markPaidForm.value = {
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paymentNotes: ''
  }
  showMarkPaidModal.value = true
}

const openEditModal = async item => {
  selectedItem.value = item
  purchasePaymentLinks.value = []
  const fmt = d => (d ? new Date(d).toISOString().split('T')[0] : '')
  editForm.value = {
    startDate: fmt(item.purchase.period?.startDate),
    endDate: fmt(item.purchase.period?.endDate),
    amount: item.purchase.price?.amount,
    billingPeriod: item.purchase.billingPeriod || 'yearly',
    packageId: item.purchase.package || null,
    serviceId: item.purchase.service || null,
    status: item.purchase.status,
    paymentMethod: item.purchase.payment?.method || '',
    paymentReference: item.purchase.payment?.reference || '',
    paymentNotes: item.purchase.payment?.notes || ''
  }
  showEditModal.value = true

  const promises = []
  if (availablePackages.value.length === 0 && availableServices.value.length === 0) {
    promises.push(fetchCatalog())
  }
  promises.push(loadPurchasePaymentLinks())
  await Promise.all(promises)
}

const selectPackage = pkg => {
  editForm.value.packageId = pkg._id
  const price = pkg.overridePrice != null ? pkg.overridePrice : pkg.calculatedPrice
  editForm.value.amount = price || 0
  editForm.value.billingPeriod = pkg.billingPeriod || 'yearly'
}

const selectService = svc => {
  editForm.value.serviceId = svc._id
  editForm.value.amount = svc.price || 0
  editForm.value.billingPeriod = svc.billingPeriod || 'yearly'
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
  } catch {
    toast.error(t('partnerSubscriptions.paymentError'))
  } finally {
    processing.value = false
  }
}

const handleUpdate = async () => {
  if (!selectedItem.value) return
  processing.value = true
  try {
    const payload = {
      startDate: editForm.value.startDate,
      endDate: editForm.value.endDate,
      amount: editForm.value.amount,
      billingPeriod: editForm.value.billingPeriod,
      status: editForm.value.status,
      paymentMethod: editForm.value.paymentMethod || undefined,
      paymentReference: editForm.value.paymentReference || undefined,
      paymentNotes: editForm.value.paymentNotes || undefined
    }

    if (
      selectedItem.value.purchase.type === 'package_subscription' &&
      editForm.value.packageId &&
      editForm.value.packageId !== selectedItem.value.purchase.package
    ) {
      payload.packageId = editForm.value.packageId
    }

    if (
      selectedItem.value.purchase.type === 'service_purchase' &&
      editForm.value.serviceId &&
      editForm.value.serviceId !== selectedItem.value.purchase.service
    ) {
      payload.serviceId = editForm.value.serviceId
    }

    await partnerService.updatePurchase(
      selectedItem.value.partner._id,
      selectedItem.value.purchase._id,
      payload
    )
    toast.success(t('partnerSubscriptions.updateSuccess'))
    showEditModal.value = false
    await fetchAllPurchases()
  } catch {
    toast.error(t('partnerSubscriptions.updateError'))
  } finally {
    processing.value = false
  }
}

const showCancelDialog = ref(false)
const cancellingItem = ref(null)

const confirmCancel = item => {
  cancellingItem.value = item
  showCancelDialog.value = true
}

const handleCancelPurchase = async () => {
  if (!cancellingItem.value) return
  try {
    await partnerService.cancelPurchase(
      cancellingItem.value.partner._id,
      cancellingItem.value.purchase._id,
      'Admin tarafından iptal edildi'
    )
    toast.success(t('partnerSubscriptions.cancelSuccess'))
    await fetchAllPurchases()
  } catch {
    toast.error(t('partnerSubscriptions.cancelError'))
  } finally {
    showCancelDialog.value = false
    cancellingItem.value = null
  }
}

const showDeleteDialog = ref(false)
const deletingItem = ref(null)

const confirmDelete = item => {
  deletingItem.value = item
  showDeleteDialog.value = true
}

const handleDeletePurchase = async () => {
  if (!deletingItem.value) return
  try {
    await partnerService.deletePurchase(
      deletingItem.value.partner._id,
      deletingItem.value.purchase._id
    )
    toast.success(t('partnerSubscriptions.deleteSuccess'))
    await fetchAllPurchases()
  } catch {
    toast.error(t('partnerSubscriptions.deleteError'))
  } finally {
    showDeleteDialog.value = false
    deletingItem.value = null
  }
}

const handleCreatePaymentLink = async item => {
  sendingLink.value = true
  try {
    await partnerService.sendPaymentLinkForPurchase(item.partner._id, item.purchase._id)
    toast.success(t('partnerSubscriptions.paymentLinkCreated'))
  } catch {
    toast.error(t('partnerSubscriptions.paymentLinkError'))
  } finally {
    sendingLink.value = false
  }
}

const handleCreatePaymentLinkFromEdit = async () => {
  if (!selectedItem.value) return
  await handleCreatePaymentLink(selectedItem.value)
  await loadPurchasePaymentLinks()
}

const loadPurchasePaymentLinks = async () => {
  if (!selectedItem.value) return
  try {
    const res = await partnerService.getPaymentLinksForPurchase(
      selectedItem.value.partner._id,
      selectedItem.value.purchase._id
    )
    purchasePaymentLinks.value = res.data || []
  } catch {
    purchasePaymentLinks.value = []
  }
}

const copyPaymentLink = async url => {
  try {
    await navigator.clipboard.writeText(url)
    toast.success(t('partnerSubscriptions.linkCopied'))
  } catch {
    toast.error(t('common.error'))
  }
}

const handleCancelPaymentLink = link => {
  cancellingLink.value = link
  showCancelLinkDialog.value = true
}

const confirmCancelPaymentLink = async () => {
  if (!cancellingLink.value || !selectedItem.value) return
  linkActionLoading.value = true
  try {
    await partnerService.cancelSubscriptionPaymentLink(
      selectedItem.value.partner._id,
      cancellingLink.value._id
    )
    toast.success(t('partnerSubscriptions.linkCancelled'))
    await loadPurchasePaymentLinks()
  } catch {
    toast.error(t('partnerSubscriptions.linkCancelError'))
  } finally {
    linkActionLoading.value = false
    showCancelLinkDialog.value = false
    cancellingLink.value = null
  }
}

const handleResendLinkNotification = async (link, channel) => {
  if (!selectedItem.value) return
  linkActionLoading.value = true
  try {
    await partnerService.resendSubscriptionPaymentLinkNotification(
      selectedItem.value.partner._id,
      link._id,
      channel
    )
    if (channel === 'email') {
      toast.success(t('partnerSubscriptions.emailSent'))
    } else {
      toast.success(t('partnerSubscriptions.smsSent'))
    }
  } catch {
    if (channel === 'email') {
      toast.error(t('partnerSubscriptions.emailSendError'))
    } else {
      toast.error(t('partnerSubscriptions.smsSendError'))
    }
  } finally {
    linkActionLoading.value = false
  }
}

const hidePaymentLink = linkId => {
  hiddenLinkIds.value.add(linkId)
}

const openPaymentLinksModal = async () => {
  showPaymentLinksModal.value = true
  allLinksFilter.value = 'all'
  allLinksLoading.value = true
  try {
    const [pkgRes, svcRes] = await Promise.all([
      paymentLinkService.getPaymentLinks({
        purpose: 'subscription_package',
        limit: 200,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }),
      paymentLinkService.getPaymentLinks({
        purpose: 'subscription_service',
        limit: 200,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
    ])
    const pkgLinks = pkgRes.data?.items || pkgRes.data || []
    const svcLinks = svcRes.data?.items || svcRes.data || []
    allPaymentLinks.value = [...pkgLinks, ...svcLinks].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
  } catch {
    toast.error(t('common.error'))
    allPaymentLinks.value = []
  } finally {
    allLinksLoading.value = false
  }
}

const filterAllLinks = status => {
  allLinksFilter.value = status
}

const goToPartner = partnerId => {
  router.push({ name: 'partners', query: { id: partnerId, tab: 'subscription' } })
}

watch(() => filters.value.showDeleted, fetchAllPurchases)

onMounted(fetchAllPurchases)
</script>
