<template>
  <div>
    <ModuleNavigation :items="navItems" color="purple" />

    <div class="p-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                {{ $t('partnerSubscriptions.pendingPayments') }}
              </div>
            </div>
          </div>
        </div>
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
                {{ $t('partnerSubscriptions.activePackages') }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-red-500">event_busy</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.expired }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('partnerSubscriptions.expiredPackages') }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-blue-500">euro</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                €{{ stats.totalPending.toFixed(2) }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('partnerSubscriptions.pendingAmount') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <input
              v-model="filters.search"
              type="text"
              class="form-input w-full"
              :placeholder="$t('partnerSubscriptions.searchPlaceholder')"
            />
          </div>
          <select v-model="filters.status" class="form-input w-40">
            <option value="">{{ $t('partnerSubscriptions.allStatuses') }}</option>
            <option value="pending">{{ $t('partnerSubscriptions.status.pending') }}</option>
            <option value="active">{{ $t('partnerSubscriptions.status.active') }}</option>
            <option value="expired">{{ $t('partnerSubscriptions.status.expired') }}</option>
            <option value="cancelled">{{ $t('partnerSubscriptions.status.cancelled') }}</option>
            <option v-if="filters.showDeleted" value="deleted">
              {{ $t('partnerSubscriptions.status.deleted') }}
            </option>
          </select>
          <select v-model="filters.type" class="form-input w-48">
            <option value="">{{ $t('partnerSubscriptions.allTypes') || 'All Types' }}</option>
            <option value="package_subscription">{{ $t('subscriptionPackages.title') }}</option>
            <option value="service_purchase">{{ $t('subscriptionServices.title') }}</option>
          </select>
          <label
            class="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 cursor-pointer select-none"
          >
            <input
              v-model="filters.showDeleted"
              type="checkbox"
              class="rounded border-gray-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
            />
            {{ $t('partnerSubscriptions.showDeleted') }}
          </label>
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
              <label class="form-label">{{ $t('partnerSubscriptions.paymentMethod') }}</label>
              <select v-model="markPaidForm.paymentMethod" class="form-input">
                <option value="bank_transfer">
                  {{ $t('partners.subscription.methods.bankTransfer') }}
                </option>
                <option value="credit_card">
                  {{ $t('partners.subscription.methods.creditCard') }}
                </option>
                <option value="payment_link">Payment Link</option>
                <option value="cash">{{ $t('partners.subscription.methods.cash') }}</option>
                <option value="other">{{ $t('partners.subscription.methods.other') }}</option>
              </select>
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
                <label class="form-label">{{ $t('partnerSubscriptions.billingPeriod') }}</label>
                <select v-model="editForm.billingPeriod" class="form-input">
                  <option value="monthly">{{ $t('partnerSubscriptions.billing.monthly') }}</option>
                  <option value="yearly">{{ $t('partnerSubscriptions.billing.yearly') }}</option>
                  <option value="one_time">
                    {{ $t('partnerSubscriptions.billing.one_time') }}
                  </option>
                </select>
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
                <label class="form-label">{{ $t('partnerSubscriptions.paymentMethod') }}</label>
                <select v-model="editForm.paymentMethod" class="form-input">
                  <option value="">{{ $t('partnerSubscriptions.notSet') }}</option>
                  <option value="bank_transfer">
                    {{ $t('partners.subscription.methods.bankTransfer') }}
                  </option>
                  <option value="credit_card">
                    {{ $t('partners.subscription.methods.creditCard') }}
                  </option>
                  <option value="payment_link">Payment Link</option>
                  <option value="cash">{{ $t('partners.subscription.methods.cash') }}</option>
                  <option value="other">{{ $t('partners.subscription.methods.other') }}</option>
                </select>
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
import partnerService from '@/services/partnerService'
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

const filters = ref({ search: '', status: '', type: '', showDeleted: false })

const showMarkPaidModal = ref(false)
const showEditModal = ref(false)
const selectedItem = ref(null)

const catalogLoading = ref(false)
const availablePackages = ref([])
const availableServices = ref([])

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

  if (availablePackages.value.length === 0 && availableServices.value.length === 0) {
    await fetchCatalog()
  }
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

const goToPartner = partnerId => {
  router.push({ name: 'partners', query: { id: partnerId, tab: 'subscription' } })
}

watch(() => filters.value.showDeleted, fetchAllPurchases)

onMounted(fetchAllPurchases)
</script>
