<template>
  <div class="space-y-6">
    <!-- No Hotel Selected Warning -->
    <div
      v-if="!hotelId"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center"
    >
      <span class="material-icons text-4xl text-amber-500 mb-2">domain_disabled</span>
      <p class="font-medium text-amber-800 dark:text-amber-200">{{ $t('pms.noHotelSelected') }}</p>
      <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">
        {{ $t('pms.selectHotelDesc') }}
      </p>
    </div>

    <template v-else>
      <!-- Action Buttons -->
      <div class="flex justify-end">
        <div class="flex items-center gap-2">
          <button
            v-if="!activeShift"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            @click="showOpenShiftModal = true"
          >
            <span class="material-icons text-lg">login</span>
            {{ $t('cashier.openShift') }}
          </button>
          <button
            v-else
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            @click="showCloseShiftModal = true"
          >
            <span class="material-icons text-lg">logout</span>
            {{ $t('cashier.closeShift') }}
          </button>
          <button
            :disabled="!activeShift"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="showTransactionModal = true"
          >
            <span class="material-icons text-lg">add_card</span>
            {{ $t('cashier.newTransaction') }}
          </button>
        </div>
      </div>

      <!-- Active Shift Alert -->
      <div
        v-if="activeShift"
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <span class="material-icons text-white">point_of_sale</span>
            </div>
            <div>
              <p class="font-medium text-green-800 dark:text-green-200">
                {{ $t('cashier.activeShift') }}: {{ activeShift.shiftNumber }}
              </p>
              <p class="text-sm text-green-600 dark:text-green-400">
                {{ activeShift.cashierName }} - {{ formatDateTime(activeShift.openedAt) }}
                {{ $t('cashier.shiftOpenSince') }} ({{ formatShiftDuration(activeShift.openedAt) }})
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-green-600 dark:text-green-400">
              {{ $t('cashier.currentBalance') }}
            </p>
            <p class="text-xl font-bold text-green-800 dark:text-green-200">
              {{ formatCurrency(activeShift.currentBalance?.cash) }}
            </p>
          </div>
        </div>

        <!-- Multi-Currency Balances -->
        <div
          v-if="hasMultipleCurrencies"
          class="mt-4 pt-4 border-t border-green-200 dark:border-green-700"
        >
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-green-700 dark:text-green-300">
              <span class="material-icons text-sm align-middle mr-1">currency_exchange</span>
              {{ $t('currency.currencyBalances') }}
            </p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CurrencyBalanceCard
              v-for="balance in activeShift.currentBalances"
              :key="balance.currency"
              :currency="balance.currency"
              :balances="balance"
              :exchange-rate="exchangeRates[balance.currency]"
              :show-try-equivalent="balance.currency !== 'TRY'"
              :highlighted="balance.currency === 'TRY'"
            />
          </div>
        </div>
      </div>

      <div
        v-else
        class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4"
      >
        <div class="flex items-center gap-3">
          <span class="material-icons text-yellow-600 dark:text-yellow-400">warning</span>
          <div>
            <p class="font-medium text-yellow-800 dark:text-yellow-200">
              {{ $t('cashier.noActiveShift') }}
            </p>
            <p class="text-sm text-yellow-600 dark:text-yellow-400">
              {{ $t('cashier.noActiveShiftHint') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Statistics Cards - Multi Currency -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="material-icons text-green-600">payments</span>
            {{ $t('cashier.todayRevenue') }}
          </h3>
          <span class="text-sm text-gray-500 dark:text-slate-400">
            {{ stats.todaySummary?.transactionCount || 0 }} {{ $t('currency.transactions') }}
          </span>
        </div>

        <!-- Multi-Currency Revenue Display -->
        <div v-if="currencySummary && Object.keys(currencySummary).length > 0" class="space-y-4">
          <!-- Currency Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <div
              v-for="(data, currency) in currencySummary"
              :key="currency"
              class="p-3 rounded-lg border"
              :class="getCurrencyCardClass(currency)"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-lg font-bold" :class="getCurrencyTextColor(currency)">
                  {{ getCurrencySymbol(currency) }}
                </span>
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded"
                  :class="getCurrencyBadgeClass(currency)"
                >
                  {{ currency }}
                </span>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500 dark:text-slate-400">{{ $t('currency.cash') }}</span>
                  <span class="font-medium text-green-600 dark:text-green-400">{{
                    formatAmount(data.cash, currency)
                  }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500 dark:text-slate-400">{{ $t('currency.card') }}</span>
                  <span class="font-medium text-blue-600 dark:text-blue-400">{{
                    formatAmount(data.card, currency)
                  }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500 dark:text-slate-400">{{ $t('currency.other') }}</span>
                  <span class="font-medium text-purple-600 dark:text-purple-400">{{
                    formatAmount(data.other, currency)
                  }}</span>
                </div>
                <div class="pt-2 mt-2 border-t border-gray-200 dark:border-slate-600">
                  <div class="flex justify-between">
                    <span class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
                      $t('currency.total')
                    }}</span>
                    <span class="text-lg font-bold" :class="getCurrencyTextColor(currency)">
                      {{ formatAmount(data.total, currency) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Grand Total in TRY -->
          <div
            v-if="Object.keys(currencySummary).length > 1 || !currencySummary['TRY']"
            class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-icons text-indigo-600 dark:text-indigo-400"
                  >currency_exchange</span
                >
                <span class="font-medium text-indigo-700 dark:text-indigo-300">{{
                  $t('currency.totalInTRY')
                }}</span>
              </div>
              <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {{
                  formatCurrency(
                    stats.todaySummary?.totalInTRY || stats.todaySummary?.total || 0,
                    'TRY'
                  )
                }}
              </span>
            </div>
            <p class="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
              {{ $t('currency.basedOnCurrentRates') }}
            </p>
          </div>
        </div>

        <!-- Fallback: Single Currency Display -->
        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ formatCurrency(stats.todaySummary?.cash || 0) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('currency.cash') }}</p>
          </div>
          <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ formatCurrency(stats.todaySummary?.card || 0) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('currency.card') }}</p>
          </div>
          <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ formatCurrency(stats.todaySummary?.other || 0) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('currency.other') }}</p>
          </div>
          <div class="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(stats.todaySummary?.total || 0) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('currency.total') }}</p>
          </div>
        </div>
      </div>

      <!-- Monthly Summary -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-orange-600 dark:text-orange-400"
                >calendar_month</span
              >
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('cashier.thisMonth') }}
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(stats.monthlyTotal || 0) }}
              </p>
            </div>
          </div>
          <!-- Monthly by currency if available -->
          <div v-if="stats.monthlyByCurrency" class="flex gap-2">
            <span
              v-for="(amount, currency) in stats.monthlyByCurrency"
              :key="currency"
              class="px-2 py-1 text-sm font-medium rounded"
              :class="getCurrencyBadgeClass(currency)"
            >
              {{ getCurrencySymbol(currency) }}{{ formatAmount(amount, currency) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700"
      >
        <div class="border-b border-gray-200 dark:border-slate-700">
          <nav class="flex -mb-px">
            <button
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'transactions'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-gray-300'
              ]"
              @click="activeTab = 'transactions'"
            >
              <span class="material-icons text-lg align-middle mr-1">receipt</span>
              {{ $t('cashier.tabs.transactions') }}
            </button>
            <button
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'shifts'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-gray-300'
              ]"
              @click="activeTab = 'shifts'"
            >
              <span class="material-icons text-lg align-middle mr-1">schedule</span>
              {{ $t('cashier.tabs.shifts') }}
            </button>
            <button
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'movements'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-gray-300'
              ]"
              @click="activeTab = 'movements'"
            >
              <span class="material-icons text-lg align-middle mr-1">swap_horiz</span>
              {{ $t('cashier.tabs.movements') }}
            </button>
          </nav>
        </div>

        <!-- Transactions Tab -->
        <div v-if="activeTab === 'transactions'" class="p-4">
          <!-- Filters -->
          <div
            class="mb-4 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3"
          >
            <!-- Row 1: Search + Select Filters -->
            <div class="flex flex-wrap gap-3">
              <div class="flex-1 min-w-[200px]">
                <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('cashier.searchPlaceholder')
                }}</label>
                <div class="relative">
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg"
                    >search</span
                  >
                  <input
                    v-model="filters.search"
                    type="text"
                    :placeholder="$t('cashier.searchPlaceholder')"
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                    @input="debouncedFetchTransactions"
                  />
                </div>
              </div>
              <div class="w-44">
                <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('cashier.columns.type')
                }}</label>
                <select
                  v-model="filters.type"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  @change="fetchTransactions"
                >
                  <option value="all">{{ $t('cashier.allTypes') }}</option>
                  <option v-for="opt in transactionTypeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <div class="w-36">
                <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('cashier.columns.status')
                }}</label>
                <select
                  v-model="filters.status"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  @change="fetchTransactions"
                >
                  <option value="all">{{ $t('cashier.allStatuses') }}</option>
                  <option value="completed">{{ $t('cashier.status.completed') }}</option>
                  <option value="cancelled">{{ $t('cashier.status.cancelled') }}</option>
                  <option value="refunded">{{ $t('cashier.status.refunded') }}</option>
                </select>
              </div>
              <div class="w-32">
                <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('currency.currency')
                }}</label>
                <select
                  v-model="filters.currency"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  @change="fetchTransactions"
                >
                  <option value="all">{{ $t('currency.allCurrencies') }}</option>
                  <option v-for="curr in availableCurrencies" :key="curr" :value="curr">
                    {{ getCurrencySymbol(curr) }} {{ curr }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Row 2: Date Range + Clear Button -->
            <div class="flex flex-wrap items-end gap-3">
              <div class="w-48">
                <DatePicker
                  v-model="filters.startDate"
                  :label="$t('cashier.startDate')"
                  :placeholder="$t('cashier.startDate')"
                  :max-date="filters.endDate || undefined"
                  clearable
                  @change="fetchTransactions"
                />
              </div>
              <div class="w-48">
                <DatePicker
                  v-model="filters.endDate"
                  :label="$t('cashier.endDate')"
                  :placeholder="$t('cashier.endDate')"
                  :min-date="filters.startDate || undefined"
                  clearable
                  @change="fetchTransactions"
                />
              </div>
              <button
                v-if="activeFilterCount > 0"
                class="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors flex items-center gap-1.5"
                @click="clearFilters"
              >
                <span class="material-icons text-sm">filter_alt_off</span>
                {{ $t('cashier.clearFilters') }}
                <span
                  class="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-bold"
                >
                  {{ activeFilterCount }}
                </span>
              </button>
            </div>
          </div>

          <!-- Transactions Table -->
          <DataTable
            :data="transactions"
            :columns="transactionColumns"
            :loading="loadingTransactions"
            :total="transactionPagination.total"
            :page="transactionPagination.page"
            :per-page="transactionPagination.limit"
            :show-header="false"
            responsive
            card-title-key="transactionNumber"
            empty-icon="receipt_long"
            :empty-text="$t('cashier.noTransactions')"
            @page-change="handleTransactionPageChange"
          >
            <template #cell-transactionNumber="{ row }">
              <span class="font-mono text-sm text-gray-900 dark:text-white">{{
                row.transactionNumber
              }}</span>
            </template>

            <template #cell-type="{ row }">
              <div class="flex items-center gap-2">
                <span class="material-icons text-sm" :class="getTransactionTypeColor(row.type)">{{
                  getTransactionTypeIcon(row.type)
                }}</span>
                <span class="text-sm text-gray-900 dark:text-white">{{
                  getTransactionTypeLabel(row.type)
                }}</span>
              </div>
            </template>

            <template #cell-description="{ row }">
              <p class="text-sm text-gray-900 dark:text-white">{{ row.description }}</p>
              <p v-if="row.stay" class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('cashier.stay') }}: {{ row.stay.stayNumber }}
              </p>
            </template>

            <template #cell-paymentMethod="{ row }">
              <div class="flex items-center gap-1">
                <span class="material-icons text-sm text-gray-400">{{
                  getPaymentMethodIcon(row.paymentMethod)
                }}</span>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{
                  getPaymentMethodLabel(row.paymentMethod)
                }}</span>
              </div>
            </template>

            <template #cell-amount="{ row }">
              <div class="flex flex-col items-end">
                <span
                  class="font-medium"
                  :class="
                    row.amount >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  "
                >
                  {{ getCurrencySymbol(row.currency || 'TRY')
                  }}{{ formatAmount(row.amount, row.currency || 'TRY') }}
                </span>
                <span
                  v-if="row.currency && row.currency !== 'TRY' && row.amountInTRY"
                  class="text-xs text-gray-400"
                >
                  ≈ ₺{{ formatAmount(row.amountInTRY, 'TRY') }}
                </span>
              </div>
            </template>

            <template #cell-status="{ row }">
              <div>
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getStatusClasses(row.status)"
                >
                  {{ getStatusLabel(row.status) }}
                </span>
                <!-- Void/Refund Reason -->
                <p
                  v-if="row.status === 'cancelled' && row.voidReason"
                  class="mt-1 text-xs text-red-600 dark:text-red-400 italic"
                >
                  {{ $t('cashier.reason') }}: {{ row.voidReason }}
                </p>
                <p
                  v-if="row.status === 'refunded' && row.refundReason"
                  class="mt-1 text-xs text-orange-600 dark:text-orange-400 italic"
                >
                  {{ $t('cashier.reason') }}: {{ row.refundReason }}
                </p>
              </div>
            </template>

            <template #cell-createdAt="{ row }">
              <span class="text-sm text-gray-600 dark:text-gray-400">{{
                formatDateTime(row.createdAt)
              }}</span>
            </template>

            <template #row-actions="{ row }">
              <div class="flex items-center justify-end gap-1">
                <button
                  v-if="row.status === 'completed'"
                  class="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  :title="$t('cashier.voidAction')"
                  @click="openVoidModal(row)"
                >
                  <span class="material-icons text-sm">cancel</span>
                </button>
                <button
                  v-if="row.status === 'completed' && row.type !== 'refund'"
                  class="p-1.5 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded"
                  :title="$t('cashier.refundAction')"
                  @click="openRefundModal(row)"
                >
                  <span class="material-icons text-sm">replay</span>
                </button>
              </div>
            </template>

            <template #empty-action>
              <button
                :disabled="!activeShift"
                class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                @click="showTransactionModal = true"
              >
                {{ $t('cashier.addTransaction') }}
              </button>
            </template>
          </DataTable>
        </div>

        <!-- Shifts Tab -->
        <div v-if="activeTab === 'shifts'" class="p-4">
          <div
            class="mb-4 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-xl border border-gray-200 dark:border-slate-700"
          >
            <div class="flex flex-wrap items-end gap-3">
              <div class="w-48">
                <DatePicker
                  v-model="shiftFilters.date"
                  :label="$t('cashier.columns.date')"
                  :placeholder="$t('cashier.columns.date')"
                  clearable
                  @change="fetchShifts"
                />
              </div>
              <div class="w-40">
                <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{{
                  $t('cashier.columns.status')
                }}</label>
                <select
                  v-model="shiftFilters.status"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                  @change="fetchShifts"
                >
                  <option value="all">{{ $t('cashier.allShifts') }}</option>
                  <option value="open">{{ $t('cashier.shiftStatus.open') }}</option>
                  <option value="closed">{{ $t('cashier.shiftStatus.closed') }}</option>
                </select>
              </div>
              <button
                v-if="activeShiftFilterCount > 0"
                class="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors flex items-center gap-1.5"
                @click="clearShiftFilters"
              >
                <span class="material-icons text-sm">filter_alt_off</span>
                {{ $t('cashier.clearFilters') }}
                <span
                  class="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-bold"
                >
                  {{ activeShiftFilterCount }}
                </span>
              </button>
            </div>
          </div>

          <div v-if="loadingShifts" class="p-8 text-center">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"
            ></div>
          </div>

          <div v-else-if="shifts.length === 0" class="p-8 text-center">
            <span class="material-icons text-4xl text-gray-400 mb-2">schedule</span>
            <p class="text-gray-500 dark:text-slate-400">{{ $t('cashier.noShifts') }}</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="shift in shifts"
              :key="shift._id"
              class="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer"
              @click="openShiftDetail(shift)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div
                    class="w-12 h-12 rounded-lg flex items-center justify-center"
                    :class="
                      shift.status === 'open'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                    "
                  >
                    <span
                      class="material-icons"
                      :class="shift.status === 'open' ? 'text-green-600' : 'text-gray-500'"
                      >point_of_sale</span
                    >
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ shift.shiftNumber }}</p>
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      {{ shift.cashierName }} - {{ formatDateTime(shift.openedAt) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-6">
                  <div class="text-right">
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      {{ $t('cashier.transactionCount') }}
                    </p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ shift.transactionCounts?.total || 0 }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      {{ $t('cashier.netSales') }}
                    </p>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ formatCurrency(shift.totals?.netSales || 0) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      {{ $t('currency.cash') }}
                    </p>
                    <p class="font-medium text-green-600 dark:text-green-400">
                      {{ formatCurrency(shift.totals?.cashReceived || 0) }}
                    </p>
                  </div>
                  <span
                    class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="
                      shift.status === 'open'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    "
                  >
                    {{
                      shift.status === 'open'
                        ? $t('cashier.shiftStatus.open')
                        : $t('cashier.shiftStatus.closed')
                    }}
                  </span>
                  <span class="material-icons text-gray-400">chevron_right</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="shiftPagination.pages > 1" class="mt-4 flex items-center justify-between">
            <p class="text-sm text-gray-500">
              {{ $t('cashier.totalShifts', { count: shiftPagination.total }) }}
            </p>
            <div class="flex items-center gap-2">
              <button
                :disabled="shiftPagination.page === 1"
                class="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                @click="changeShiftPage(shiftPagination.page - 1)"
              >
                <span class="material-icons text-sm">chevron_left</span>
              </button>
              <span class="text-sm">{{ shiftPagination.page }} / {{ shiftPagination.pages }}</span>
              <button
                :disabled="shiftPagination.page === shiftPagination.pages"
                class="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-50"
                @click="changeShiftPage(shiftPagination.page + 1)"
              >
                <span class="material-icons text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Cash Movements Tab (Active Shift) -->
        <div v-if="activeTab === 'movements'" class="p-4">
          <div v-if="!activeShift" class="p-8 text-center">
            <span class="material-icons text-4xl text-gray-400 mb-2">warning</span>
            <p class="text-gray-500 dark:text-slate-400">
              {{ $t('cashier.noActiveShiftMovements') }}
            </p>
          </div>

          <div v-else>
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-gray-900 dark:text-white">
                {{ $t('cashier.movementsFor') }} {{ activeShift.shiftNumber }}
              </h3>
              <button
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg flex items-center gap-1"
                @click="showCashMovementModal = true"
              >
                <span class="material-icons text-sm">add</span>
                {{ $t('cashier.addMovement') }}
              </button>
            </div>

            <div v-if="activeShift.cashMovements?.length === 0" class="p-8 text-center">
              <span class="material-icons text-4xl text-gray-400 mb-2">swap_horiz</span>
              <p class="text-gray-500 dark:text-slate-400">{{ $t('cashier.noMovements') }}</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(movement, index) in activeShift.cashMovements"
                :key="index"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="material-icons" :class="getMovementColor(movement.type)">{{
                    getMovementIcon(movement.type)
                  }}</span>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ getMovementLabel(movement.type) }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-slate-400">
                      {{ movement.description || '-' }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p
                    class="font-medium"
                    :class="isPositiveMovement(movement.type) ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ isPositiveMovement(movement.type) ? '+' : '-'
                    }}{{ formatCurrency(Math.abs(movement.amount)) }}
                  </p>
                  <p class="text-xs text-gray-500">{{ formatDateTime(movement.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <OpenShiftModal v-model="showOpenShiftModal" :hotel-id="hotelId" @opened="onShiftOpened" />

      <CloseShiftModal
        v-model="showCloseShiftModal"
        :hotel-id="hotelId"
        :shift="activeShift"
        @closed="onShiftClosed"
      />

      <TransactionModal
        v-model="showTransactionModal"
        :hotel-id="hotelId"
        @created="onTransactionCreated"
      />

      <CashMovementModal
        v-model="showCashMovementModal"
        :hotel-id="hotelId"
        :shift-id="activeShift?._id"
        @added="onCashMovementAdded"
      />

      <ShiftDetailModal v-model="showShiftDetailModal" :hotel-id="hotelId" :shift="selectedShift" />

      <VoidTransactionModal
        v-model="showVoidModal"
        :hotel-id="hotelId"
        :transaction="selectedTransaction"
        @voided="onTransactionVoided"
      />

      <RefundTransactionModal
        v-model="showRefundModal"
        :hotel-id="hotelId"
        :transaction="selectedTransaction"
        @refunded="onTransactionRefunded"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import cashierService, {
  TRANSACTION_TYPE_INFO,
  PAYMENT_METHOD_INFO,
  TRANSACTION_STATUS_INFO,
  CASH_MOVEMENT_INFO,
  formatCurrency,
  formatShiftDuration,
  getTransactionTypeOptions
} from '@/services/pms/cashierService'
import OpenShiftModal from '@/components/pms/billing/OpenShiftModal.vue'
import CloseShiftModal from '@/components/pms/billing/CloseShiftModal.vue'
import TransactionModal from '@/components/pms/billing/TransactionModal.vue'
import CashMovementModal from '@/components/pms/billing/CashMovementModal.vue'
import ShiftDetailModal from '@/components/pms/billing/ShiftDetailModal.vue'
import VoidTransactionModal from '@/components/pms/billing/VoidTransactionModal.vue'
import RefundTransactionModal from '@/components/pms/billing/RefundTransactionModal.vue'
import CurrencyBalanceCard from '@/components/pms/billing/CurrencyBalanceCard.vue'
import DataTable from '@/components/ui/data/DataTable.vue'
import DatePicker from '@/components/ui/date/DatePicker.vue'
import { usePmsStore } from '@/stores/pms'

const pmsStore = usePmsStore()
const hotelId = computed(() => pmsStore.hotelId)
const toast = useToast()
const { t } = useI18n()

const activeTab = ref('transactions')
const activeShift = ref(null)

// Modals
const showOpenShiftModal = ref(false)
const showCloseShiftModal = ref(false)
const showTransactionModal = ref(false)
const showCashMovementModal = ref(false)
const showShiftDetailModal = ref(false)
const showVoidModal = ref(false)
const showRefundModal = ref(false)

const selectedShift = ref(null)
const selectedTransaction = ref(null)

// Stats
const stats = ref({
  todaySummary: {},
  monthlyTotal: 0
})

// Currency data
const exchangeRates = ref({})
const availableCurrencies = ref(['TRY', 'USD', 'EUR', 'GBP'])

// Multi-currency computed
const hasMultipleCurrencies = computed(() => {
  return (
    activeShift.value?.currentBalances?.length > 1 ||
    activeShift.value?.activeCurrencies?.length > 1
  )
})

// Currency summary from daily stats
const currencySummary = computed(() => {
  return stats.value.todaySummary?.byCurrency || null
})

// Currency symbols
const currencySymbols = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  SAR: '﷼',
  AED: 'د.إ',
  CHF: 'CHF',
  JPY: '¥',
  CNY: '¥'
}

// Currency colors
const currencyColorMap = {
  TRY: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  USD: {
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  EUR: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  GBP: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  RUB: {
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  default: {
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-700',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

const getCurrencySymbol = currency => currencySymbols[currency] || currency
const getCurrencyTextColor = currency =>
  (currencyColorMap[currency] || currencyColorMap.default).text
const getCurrencyCardClass = currency => {
  const colors = currencyColorMap[currency] || currencyColorMap.default
  return `${colors.bg} ${colors.border}`
}
const getCurrencyBadgeClass = currency =>
  (currencyColorMap[currency] || currencyColorMap.default).badge

const formatAmount = amount => {
  const num = amount || 0
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

// Transactions
const loadingTransactions = ref(false)
const transactions = ref([])
const transactionPagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})
const filters = ref({
  search: '',
  type: 'all',
  status: 'all',
  currency: 'all',
  startDate: '',
  endDate: ''
})
const transactionTypeOptions = computed(() =>
  getTransactionTypeOptions().map(opt => ({ ...opt, label: t(opt.label) }))
)

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.search) count++
  if (filters.value.type !== 'all') count++
  if (filters.value.status !== 'all') count++
  if (filters.value.currency !== 'all') count++
  if (filters.value.startDate) count++
  if (filters.value.endDate) count++
  return count
})

const clearFilters = () => {
  filters.value = {
    search: '',
    type: 'all',
    status: 'all',
    currency: 'all',
    startDate: '',
    endDate: ''
  }
  fetchTransactions()
}

const transactionColumns = computed(() => [
  { key: 'transactionNumber', label: t('cashier.columns.transactionNumber'), sortable: false },
  { key: 'type', label: t('cashier.columns.type'), sortable: false },
  { key: 'description', label: t('cashier.columns.description'), sortable: false },
  { key: 'paymentMethod', label: t('cashier.columns.payment'), sortable: false },
  { key: 'amount', label: t('cashier.columns.amount'), sortable: false },
  { key: 'status', label: t('cashier.columns.status'), sortable: false },
  { key: 'createdAt', label: t('cashier.columns.date'), sortable: false }
])

// Shifts
const loadingShifts = ref(false)
const shifts = ref([])
const shiftPagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})
const shiftFilters = ref({
  date: '',
  status: 'all'
})

const activeShiftFilterCount = computed(() => {
  let count = 0
  if (shiftFilters.value.date) count++
  if (shiftFilters.value.status !== 'all') count++
  return count
})

const clearShiftFilters = () => {
  shiftFilters.value = { date: '', status: 'all' }
  fetchShifts()
}

let debounceTimer = null
const debouncedFetchTransactions = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchTransactions()
  }, 300)
}

const fetchActiveShift = async () => {
  if (!hotelId.value) return
  try {
    const response = await cashierService.getActiveShift(hotelId.value)
    activeShift.value = response.data
  } catch {
    activeShift.value = null
  }
}

const fetchCurrencies = async () => {
  if (!hotelId.value) return
  try {
    const response = await cashierService.getCurrencies(hotelId.value)
    if (response.data) {
      exchangeRates.value = response.data.exchangeRates || {}
      // Update available currencies from API response
      if (response.data.availableCurrencies?.length > 0) {
        availableCurrencies.value = response.data.availableCurrencies
      }
    }
  } catch (error) {
    console.error('Currency fetch error:', error)
  }
}

const fetchStats = async () => {
  if (!hotelId.value) return
  try {
    const response = await cashierService.getStats(hotelId.value)
    stats.value = response.data || {}
  } catch (error) {
    console.error('Stats fetch error:', error)
  }
}

const fetchTransactions = async () => {
  if (!hotelId.value) return
  loadingTransactions.value = true
  try {
    const params = {
      page: transactionPagination.value.page,
      limit: transactionPagination.value.limit,
      ...filters.value
    }
    if (params.type === 'all') delete params.type
    if (params.status === 'all') delete params.status
    if (params.currency === 'all') delete params.currency
    if (!params.startDate) delete params.startDate
    if (!params.endDate) delete params.endDate
    if (!params.search) delete params.search

    const response = await cashierService.getTransactions(hotelId.value, params)
    transactions.value = response.data || []
    transactionPagination.value = response.pagination || transactionPagination.value
  } catch {
    toast.error(t('cashier.transactionsLoadError'))
  } finally {
    loadingTransactions.value = false
  }
}

const fetchShifts = async () => {
  if (!hotelId.value) return
  loadingShifts.value = true
  try {
    const params = {
      page: shiftPagination.value.page,
      limit: shiftPagination.value.limit,
      ...shiftFilters.value
    }
    if (params.status === 'all') delete params.status
    if (!params.date) delete params.date

    const response = await cashierService.getShifts(hotelId.value, params)
    shifts.value = response.data || []
    shiftPagination.value = response.pagination || shiftPagination.value
  } catch {
    toast.error(t('cashier.shiftsLoadError'))
  } finally {
    loadingShifts.value = false
  }
}

const handleTransactionPageChange = ({ page, perPage }) => {
  transactionPagination.value.page = page
  if (perPage) transactionPagination.value.limit = perPage
  fetchTransactions()
}

const changeShiftPage = page => {
  shiftPagination.value.page = page
  fetchShifts()
}

const openShiftDetail = shift => {
  selectedShift.value = shift
  showShiftDetailModal.value = true
}

const openVoidModal = txn => {
  selectedTransaction.value = txn
  showVoidModal.value = true
}

const openRefundModal = txn => {
  selectedTransaction.value = txn
  showRefundModal.value = true
}

// Event handlers
const onShiftOpened = () => {
  fetchActiveShift()
  fetchStats()
  fetchCurrencies()
  fetchShifts()
}

const onShiftClosed = () => {
  fetchActiveShift()
  fetchStats()
  fetchShifts()
}

const onTransactionCreated = () => {
  fetchActiveShift()
  fetchStats()
  fetchTransactions()
}

const onCashMovementAdded = () => {
  fetchActiveShift()
}

const onTransactionVoided = () => {
  fetchTransactions()
  fetchStats()
}

const onTransactionRefunded = () => {
  fetchTransactions()
  fetchStats()
}

// Helpers
const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTransactionTypeLabel = type => {
  const key = TRANSACTION_TYPE_INFO[type]?.label
  return key ? t(key) : type
}
const getTransactionTypeIcon = type => TRANSACTION_TYPE_INFO[type]?.icon || 'receipt'
const getTransactionTypeColor = type => {
  const info = TRANSACTION_TYPE_INFO[type]
  if (!info) return 'text-gray-500'
  return `text-${info.color}-600 dark:text-${info.color}-400`
}

const getPaymentMethodLabel = method => {
  const key = PAYMENT_METHOD_INFO[method]?.label
  return key ? t(key) : method || '-'
}
const getPaymentMethodIcon = method => PAYMENT_METHOD_INFO[method]?.icon || 'help'

const getStatusLabel = status => {
  const key = TRANSACTION_STATUS_INFO[status]?.label
  return key ? t(key) : status
}
const getStatusClasses = status =>
  TRANSACTION_STATUS_INFO[status]?.bgClass || 'bg-gray-100 text-gray-800'

const getMovementLabel = type => {
  const key = CASH_MOVEMENT_INFO[type]?.label
  return key ? t(key) : type
}
const getMovementIcon = type => CASH_MOVEMENT_INFO[type]?.icon || 'swap_horiz'
const getMovementColor = type => {
  const info = CASH_MOVEMENT_INFO[type]
  if (!info) return 'text-gray-500'
  return `text-${info.color}-600 dark:text-${info.color}-400`
}

const isPositiveMovement = type => {
  return ['opening', 'sale', 'deposit'].includes(type)
}

watch(
  () => hotelId.value,
  () => {
    if (hotelId.value) {
      fetchActiveShift()
      fetchStats()
      fetchCurrencies()
      fetchTransactions()
      fetchShifts()
    }
  }
)

onMounted(() => {
  if (hotelId.value) {
    fetchActiveShift()
    fetchStats()
    fetchCurrencies()
    fetchTransactions()
    fetchShifts()
  }
})
</script>
