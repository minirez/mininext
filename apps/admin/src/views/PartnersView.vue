<template>
  <div>
    <!-- Module Navigation -->
    <ModuleNavigation :items="navItems" color="purple" @action="handleNavAction">
      <template #actions>
        <button class="btn-primary flex items-center gap-2" @click="openCreateModal">
          <span class="material-icons text-lg">add</span>
          <span class="hidden sm:inline">{{ $t('partners.addPartner') }}</span>
        </button>
      </template>
    </ModuleNavigation>

    <div class="bg-white dark:bg-slate-800 rounded-lg shadow mt-4">
      <!-- Search & Filters -->
      <div class="p-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search -->
          <div class="relative flex-1">
            <input
              v-model="filters.search"
              type="text"
              :placeholder="$t('partners.searchPlaceholder', 'Partner ara...')"
              class="form-input w-full pl-10"
              @input="debouncedFetch"
            />
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-xl"
              >search</span
            >
          </div>
          <!-- Status Filter -->
          <select v-model="filters.status" class="form-input w-40" @change="fetchPartners">
            <option value="">{{ $t('common.allStatuses', 'Tüm Durumlar') }}</option>
            <option value="active">{{ $t('common.active') }}</option>
            <option value="pending">{{ $t('common.pending') }}</option>
            <option value="inactive">{{ $t('common.inactive') }}</option>
          </select>
          <!-- Partner Type Filter -->
          <select v-model="filters.partnerType" class="form-input w-40" @change="fetchPartners">
            <option value="">{{ $t('partners.allTypes', 'Tüm Tipler') }}</option>
            <option value="hotel">{{ $t('partners.types.hotel') }}</option>
            <option value="agency">{{ $t('partners.types.agency') }}</option>
            <option value="web">{{ $t('partners.types.web') }}</option>
          </select>
        </div>
      </div>

      <div class="p-6">
        <DataTable
          :columns="columns"
          :data="partners"
          :loading="loading"
          :total="pagination.total"
          :page="pagination.page"
          :per-page="pagination.limit"
          @page-change="handlePageChange"
        >
          <template #cell-status="{ value }">
            <span
              class="badge"
              :class="{
                'badge-success': value === 'active',
                'badge-danger': value === 'inactive',
                'badge-warning': value === 'pending'
              }"
            >
              {{
                value === 'active'
                  ? $t('common.active')
                  : value === 'inactive'
                    ? $t('common.inactive')
                    : $t('common.pending')
              }}
            </span>
          </template>

          <template #cell-partnerType="{ value }">
            <span
              class="badge"
              :class="{
                'badge-info': value === 'hotel',
                'badge-purple': value === 'agency',
                'badge-success': value === 'web'
              }"
            >
              {{ $t(`partners.types.${value || 'agency'}`) }}
            </span>
          </template>

          <template #cell-website="{ row }">
            <a
              v-if="row.branding?.siteDomain"
              :href="`https://${row.branding.siteDomain}`"
              target="_blank"
              class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              {{ row.branding.siteDomain }}
            </a>
            <span v-else class="text-sm text-gray-400 dark:text-slate-500">-</span>
          </template>

          <template #cell-createdAt="{ value }">
            <span class="text-sm text-gray-600 dark:text-slate-400">
              {{ formatDate(value) }}
            </span>
          </template>

          <template #cell-subscription="{ row }">
            <div class="flex flex-col gap-1">
              <span
                v-if="getActivePackageName(row, locale)"
                class="text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ getActivePackageName(row, locale) }}
              </span>
              <span v-else class="text-sm text-gray-400 dark:text-slate-500">-</span>
            </div>
          </template>

          <template #cell-pms="{ row }">
            <div v-if="isPmsEnabledForRow(row)" class="flex items-center gap-1">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getProvisionedHotels(row) }}/{{ getPmsLimit(row) }}
              </span>
              <span class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('partners.subscription.hotels') }}
              </span>
            </div>
            <span v-else class="text-xs text-gray-400 dark:text-slate-500">
              {{ $t('partners.subscription.pmsDisabled') }}
            </span>
          </template>

          <template #cell-subscriptionStatus="{ row }">
            <span
              class="badge"
              :class="{
                'badge-success': getSubscriptionStatusForRow(row) === 'active',
                'badge-warning': getSubscriptionStatusForRow(row) === 'grace_period',
                'badge-danger':
                  getSubscriptionStatusForRow(row) === 'expired' ||
                  getSubscriptionStatusForRow(row) === 'suspended',
                'badge-secondary': getSubscriptionStatusForRow(row) === 'cancelled'
              }"
            >
              {{
                subscriptionStatusMap[getSubscriptionStatusForRow(row)]?.label ||
                getSubscriptionStatusForRow(row)
              }}
            </span>
          </template>

          <template #row-actions="{ row }">
            <div class="flex items-center justify-end gap-2">
              <button
                v-if="row.status === 'pending'"
                class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                :title="$t('partners.approve')"
                @click="confirmApprove(row)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              <button
                class="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                :title="$t('partners.subscription.title')"
                @click="openSubscriptionModal(row)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </button>
              <button
                class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                :title="$t('common.edit')"
                @click="openEditModal(row)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                :title="$t('common.delete')"
                @click="confirmDelete(row)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      v-model="showModal"
      :title="isEditing ? $t('partners.editPartner') : $t('partners.addPartner')"
      size="xl"
      :close-on-overlay="false"
    >
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Partner Type Selection -->
        <div
          class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-5"
        >
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {{ $t('partners.partnerType') }}
          </label>
          <div class="grid grid-cols-3 gap-4">
            <label
              class="relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
              :class="
                form.partnerType === 'hotel'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800'
              "
            >
              <input v-model="form.partnerType" type="radio" value="hotel" class="sr-only" />
              <div
                class="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                :class="
                  form.partnerType === 'hotel'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                "
              >
                <span class="material-icons text-2xl">apartment</span>
              </div>
              <span class="font-semibold text-gray-800 dark:text-white">{{
                $t('partners.types.hotel')
              }}</span>
              <span class="text-xs text-gray-500 dark:text-slate-400 text-center mt-1">{{
                $t('partners.typeDesc.hotel')
              }}</span>
              <div v-if="form.partnerType === 'hotel'" class="absolute top-2 right-2">
                <span class="material-icons text-blue-500">check_circle</span>
              </div>
            </label>

            <label
              class="relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
              :class="
                form.partnerType === 'agency'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg shadow-purple-500/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-slate-800'
              "
            >
              <input v-model="form.partnerType" type="radio" value="agency" class="sr-only" />
              <div
                class="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                :class="
                  form.partnerType === 'agency'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                "
              >
                <span class="material-icons text-2xl">storefront</span>
              </div>
              <span class="font-semibold text-gray-800 dark:text-white">{{
                $t('partners.types.agency')
              }}</span>
              <span class="text-xs text-gray-500 dark:text-slate-400 text-center mt-1">{{
                $t('partners.typeDesc.agency')
              }}</span>
              <div v-if="form.partnerType === 'agency'" class="absolute top-2 right-2">
                <span class="material-icons text-purple-500">check_circle</span>
              </div>
            </label>

            <label
              class="relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
              :class="
                form.partnerType === 'web'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-lg shadow-emerald-500/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-800'
              "
            >
              <input v-model="form.partnerType" type="radio" value="web" class="sr-only" />
              <div
                class="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                :class="
                  form.partnerType === 'web'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                "
              >
                <span class="material-icons text-2xl">language</span>
              </div>
              <span class="font-semibold text-gray-800 dark:text-white">{{
                $t('partners.types.web')
              }}</span>
              <span class="text-xs text-gray-500 dark:text-slate-400 text-center mt-1">{{
                $t('partners.typeDesc.web')
              }}</span>
              <div v-if="form.partnerType === 'web'" class="absolute top-2 right-2">
                <span class="material-icons text-emerald-500">check_circle</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Company Information Card -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2"
          >
            <span class="material-icons text-gray-500 dark:text-slate-400">business</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">
              {{ $t('partners.companyInfo') }}
            </h3>
          </div>
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="form-label">
                  {{ $t('partners.partnerName') }}
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.companyName"
                  type="text"
                  class="form-input"
                  :placeholder="$t('partners.companyNamePlaceholder')"
                  required
                />
              </div>

              <div class="md:col-span-2">
                <label class="form-label">{{ $t('partners.tradeName') }}</label>
                <input
                  v-model="form.tradeName"
                  type="text"
                  class="form-input"
                  :placeholder="$t('partners.tradeNamePlaceholder')"
                />
                <p class="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  {{ $t('partners.tradeNameHint') }}
                </p>
              </div>

              <div>
                <label class="form-label">{{ $t('common.status.label') }}</label>
                <div class="flex gap-2">
                  <label
                    v-for="statusOption in statusOptions"
                    :key="statusOption.value"
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all"
                    :class="
                      form.status === statusOption.value
                        ? `border-${statusOption.color}-500 bg-${statusOption.color}-50 dark:bg-${statusOption.color}-900/20`
                        : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                    "
                  >
                    <input
                      v-model="form.status"
                      type="radio"
                      :value="statusOption.value"
                      class="sr-only"
                    />
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="{
                        'bg-green-500': statusOption.value === 'active',
                        'bg-red-500': statusOption.value === 'inactive',
                        'bg-yellow-500': statusOption.value === 'pending'
                      }"
                    />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
                      statusOption.label
                    }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information Card -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2"
          >
            <span class="material-icons text-gray-500 dark:text-slate-400">contact_mail</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">
              {{ $t('partners.contactInfo') }}
            </h3>
          </div>
          <div class="p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">
                  {{ $t('partners.contactEmail') }}
                  <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="form.email"
                    type="email"
                    class="form-input pl-10"
                    placeholder="ornek@sirket.com"
                    required
                  />
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg"
                    >email</span
                  >
                </div>
              </div>

              <div>
                <label class="form-label">{{ $t('partners.contactPhone') }}</label>
                <div class="relative">
                  <input
                    v-model="form.phone"
                    type="text"
                    class="form-input pl-10"
                    placeholder="+90 5XX XXX XX XX"
                  />
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg"
                    >phone</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tax Information Card -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2"
          >
            <span class="material-icons text-gray-500 dark:text-slate-400">receipt_long</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">
              {{ $t('partners.taxInfo') }}
            </h3>
          </div>
          <div class="p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">{{ $t('partners.taxOffice') }}</label>
                <input
                  v-model="form.taxOffice"
                  type="text"
                  class="form-input"
                  :placeholder="$t('partners.taxOfficePlaceholder')"
                />
              </div>

              <div>
                <label class="form-label">{{ $t('partners.taxNumber') }}</label>
                <input
                  v-model="form.taxNumber"
                  type="text"
                  class="form-input"
                  placeholder="1234567890"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Address Card -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2"
          >
            <span class="material-icons text-gray-500 dark:text-slate-400">location_on</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">
              {{ $t('partners.address') }}
            </h3>
          </div>
          <div class="p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="form-label">{{ $t('partners.street') }}</label>
                <input
                  v-model="form.address.street"
                  type="text"
                  class="form-input"
                  :placeholder="$t('partners.streetPlaceholder')"
                />
              </div>

              <div>
                <label class="form-label">{{ $t('partners.city') }}</label>
                <input
                  v-model="form.address.city"
                  type="text"
                  class="form-input"
                  placeholder="İstanbul"
                />
              </div>

              <div>
                <label class="form-label">{{ $t('partners.country') }}</label>
                <input
                  v-model="form.address.country"
                  type="text"
                  class="form-input"
                  placeholder="Türkiye"
                />
              </div>

              <div>
                <label class="form-label">{{ $t('partners.postalCode') }}</label>
                <input
                  v-model="form.address.postalCode"
                  type="text"
                  class="form-input"
                  placeholder="34000"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Settings (only in edit mode) -->
        <div
          v-if="isEditing"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2"
          >
            <span class="material-icons text-gray-500 dark:text-slate-400">account_balance</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">
              {{ $t('partners.paymentSettings.title') }}
            </h3>
          </div>
          <div class="p-5 space-y-4">
            <!-- Use Platform Bank Accounts Toggle -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {{ $t('partners.paymentSettings.usePlatformAccounts') }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ $t('partners.paymentSettings.usePlatformAccountsHint') }}
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="form.paymentSettings.usePlatformBankAccounts"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
                ></div>
              </label>
            </div>

            <!-- Own Bank Accounts (when not using platform) -->
            <template v-if="!form.paymentSettings.usePlatformBankAccounts">
              <!-- Bank Transfer Enable -->
              <div
                class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700"
              >
                <div>
                  <p class="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {{ $t('partners.paymentSettings.bankTransferEnabled') }}
                  </p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="form.paymentSettings.bankTransferEnabled"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
                  ></div>
                </label>
              </div>

              <!-- Bank Accounts List -->
              <div class="pt-3 border-t border-gray-200 dark:border-slate-700">
                <BankAccountManager v-model="form.paymentSettings.bankAccounts" />
              </div>
            </template>
          </div>
        </div>

        <!-- Documents Section (only in edit mode) -->
        <DocumentUpload
          v-if="isEditing"
          :partner-id="selectedPartner._id"
          :documents="selectedPartner?.documents"
          :uploading="uploading"
          @upload="uploadDocument"
          @delete="confirmDeleteDocument"
        />
      </form>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <p class="text-xs text-gray-400 dark:text-slate-500">
            <span class="text-red-500">*</span> {{ $t('common.requiredFields') }}
          </p>
          <div class="flex gap-3">
            <button type="button" class="btn-secondary" @click="showModal = false">
              {{ $t('common.cancel') }}
            </button>
            <button
              type="submit"
              class="btn-primary flex items-center gap-2"
              :disabled="submitting"
              @click="handleSubmit"
            >
              <span v-if="submitting" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {{ $t('common.loading') }}
              </span>
              <template v-else>
                <span class="material-icons text-lg">save</span>
                {{ $t('common.save') }}
              </template>
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('partners.deletePartner')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">{{ $t('common.confirm') }}?</p>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showDeleteModal = false">
          {{ $t('common.no') }}
        </button>
        <button type="button" class="btn-danger" :disabled="deleting" @click="handleDelete">
          <span v-if="deleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Approve Confirmation Modal -->
    <Modal v-model="showApproveModal" :title="$t('partners.approvePartner')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('partners.approveConfirm') }}
      </p>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showApproveModal = false">
          {{ $t('common.no') }}
        </button>
        <button type="button" class="btn-success" :disabled="approving" @click="handleApprove">
          <span v-if="approving">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Subscription Modal -->
    <PartnerSubscriptionModal
      v-model="showSubscriptionDrawer"
      :partner="selectedPartner"
      @updated="fetchPartners"
    />

    <!-- Edit Purchase Modal -->
    <Modal
      v-model="showEditPurchaseModal"
      :title="$t('partners.subscription.editPurchase')"
      size="lg"
    >
      <div class="space-y-4">
        <!-- Period -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('partners.subscription.startDate') }}</label>
            <input v-model="editPurchaseForm.startDate" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">{{ $t('partners.subscription.endDate') }}</label>
            <input v-model="editPurchaseForm.endDate" type="date" class="form-input" />
          </div>
        </div>

        <!-- Price (EUR only) -->
        <div>
          <label class="form-label">{{ $t('partners.subscription.amount') }} (EUR)</label>
          <div class="relative">
            <span
              class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm font-medium"
              >€</span
            >
            <input
              v-model.number="editPurchaseForm.amount"
              type="number"
              step="0.01"
              class="form-input pl-8"
            />
          </div>
        </div>

        <!-- Payment Info (optional) -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('partners.subscription.method') }}</label>
            <select v-model="editPurchaseForm.paymentMethod" class="form-input">
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
            <input v-model="editPurchaseForm.paymentReference" type="text" class="form-input" />
          </div>
        </div>

        <div>
          <label class="form-label">{{ $t('partners.subscription.paymentNotes') }}</label>
          <input v-model="editPurchaseForm.paymentNotes" type="text" class="form-input" />
        </div>
      </div>

      <template #footer>
        <button class="btn-secondary" @click="showEditPurchaseModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button class="btn-primary" :disabled="updatingPurchase" @click="handleUpdatePurchase">
          <span v-if="updatingPurchase">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.save') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Mark as Paid Modal -->
    <Modal v-model="showMarkPaidModal" :title="$t('partners.subscription.markAsPaid')" size="md">
      <div class="space-y-4">
        <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p class="text-sm text-amber-800 dark:text-amber-200">
            {{ $t('partners.subscription.markAsPaidInfo') }}
          </p>
          <div class="mt-2 font-medium text-amber-900 dark:text-amber-100">
            {{ markPaidForm.label || '-' }} – €{{ (markPaidForm.amount || 0).toFixed(2) }}
          </div>
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

        <div>
          <label class="form-label">{{ $t('partners.subscription.paymentNotes') }}</label>
          <input v-model="markPaidForm.paymentNotes" type="text" class="form-input" />
        </div>
      </div>

      <template #footer>
        <button class="btn-secondary" @click="showMarkPaidModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          class="btn-success"
          :disabled="markingPaid || !markPaidForm.paymentDate"
          @click="handleMarkAsPaid"
        >
          <span v-if="markingPaid">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('partners.subscription.confirmPayment') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '@/components/ui/data/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import DocumentUpload from '@/components/DocumentUpload.vue'
import BankAccountManager from '@/components/common/BankAccountManager.vue'
import partnerService from '@/services/partnerService'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useListView } from '@/composables/useListView'
import { usePermissions } from '@/composables/usePermissions'
import { usePartnerSubscription } from '@/composables/usePartnerSubscription'
import PartnerSubscriptionModal from './partners/PartnerSubscriptionModal.vue'

const { t, locale } = useI18n()

// Subscription composable
const subscription = usePartnerSubscription()

// Re-export subscription properties for template access
const {
  showSubscriptionModal,
  showEditPurchaseModal,
  showMarkPaidModal,
  subscriptionCatalog,
  subscriptionStatus,
  useCustomPmsLimit,
  activeSubscriptionTab,
  subscriptionTabs,
  subscriptionForm,
  purchaseForm,
  editPurchaseForm,
  markPaidForm,
  savingSubscription,
  addingPurchase,
  updatingPurchase,
  markingPaid,
  subscriptionStatusMap,
  getRemainingDays,
  getGracePeriodDays,
  isPmsEnabledForRow,
  getProvisionedHotels,
  getPmsLimit,
  getSubscriptionStatusForRow,
  getActivePackageName,
  openEditPurchaseModal,
  openMarkPaidModal,
  getInvoiceForPurchase,
  downloadInvoice,
  onCatalogItemChange
} = subscription

// Navigation items
const navItems = computed(() => [
  {
    name: 'partners',
    to: '/partners',
    icon: 'business',
    label: t('partners.title'),
    exact: true,
    badge: pagination.total || null,
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  },
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

const handleNavAction = action => {
  // Handle navigation actions if needed
}
const { executeWithPermission } = usePermissions()

// List view with pagination, search, filters
const {
  items: partners,
  isLoading: loading,
  pagination,
  filters,
  fetch: fetchPartners,
  debouncedFetch,
  handlePageChange
} = useListView(partnerService.getPartners, {
  defaultFilters: { search: '', status: '', partnerType: '' },
  itemsKey: 'partners',
  errorMessage: 'partners.fetchError'
})

// Use async action composables for mutations
const { isLoading: submitting, execute: executeSubmit } = useAsyncAction()
const { isLoading: deleting, execute: executeDelete } = useAsyncAction()
const { isLoading: approving, execute: executeApprove } = useAsyncAction()
const { isLoading: uploading, execute: executeUpload } = useAsyncAction()
const showModal = ref(false)
const showDeleteModal = ref(false)
const showApproveModal = ref(false)
const showSubscriptionDrawer = ref(false)
const isEditing = ref(false)
const selectedPartner = ref(null)

// Helper functions for formatting
const formatCurrency = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency
  }).format(amount)
}

const formatDate = dateStr => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const defaultPaymentSettings = () => ({
  usePlatformBankAccounts: true,
  bankTransferEnabled: false,
  bankAccounts: []
})

const form = ref({
  companyName: '',
  tradeName: '',
  email: '',
  phone: '',
  taxOffice: '',
  taxNumber: '',
  address: {
    street: '',
    city: '',
    country: '',
    postalCode: ''
  },
  status: 'active',
  partnerType: 'agency',
  paymentSettings: defaultPaymentSettings()
})

const columns = [
  { key: 'companyName', label: t('partners.partnerName') },
  { key: 'partnerType', label: t('partners.partnerType') },
  { key: 'website', label: t('partners.website') },
  { key: 'subscription', label: t('partners.subscription.plan') },
  { key: 'subscriptionStatus', label: t('partners.subscription.status') },
  { key: 'createdAt', label: t('partners.membershipDate') },
  { key: 'status', label: t('common.status.label') }
]

// Status options for form
const statusOptions = [
  { value: 'active', label: t('common.active'), color: 'green' },
  { value: 'pending', label: t('common.pending'), color: 'yellow' },
  { value: 'inactive', label: t('common.inactive'), color: 'red' }
]

const openCreateModalInternal = () => {
  isEditing.value = false
  form.value = {
    companyName: '',
    tradeName: '',
    email: '',
    phone: '',
    taxOffice: '',
    taxNumber: '',
    address: {
      street: '',
      city: '',
      country: '',
      postalCode: ''
    },
    status: 'active',
    partnerType: 'agency',
    paymentSettings: defaultPaymentSettings()
  }
  showModal.value = true
}

// Permission-checked create modal
const openCreateModal = () => {
  executeWithPermission('partners', 'create', openCreateModalInternal)
}

const openEditModal = partner => {
  isEditing.value = true
  selectedPartner.value = partner
  form.value = {
    companyName: partner.companyName,
    tradeName: partner.tradeName || '',
    email: partner.email,
    phone: partner.phone || '',
    taxOffice: partner.taxOffice || '',
    taxNumber: partner.taxNumber || '',
    address: {
      street: partner.address?.street || '',
      city: partner.address?.city || '',
      country: partner.address?.country || '',
      postalCode: partner.address?.postalCode || ''
    },
    status: partner.status || 'active',
    partnerType: partner.partnerType || 'agency',
    paymentSettings: {
      usePlatformBankAccounts: partner.paymentSettings?.usePlatformBankAccounts ?? true,
      bankTransferEnabled: partner.paymentSettings?.bankTransferEnabled || false,
      bankAccounts: (partner.paymentSettings?.bankAccounts || []).map(a => ({ ...a }))
    }
  }
  showModal.value = true
}

// Subscription drawer
const openSubscriptionModal = partner => {
  selectedPartner.value = partner
  showSubscriptionDrawer.value = true
}

const handleSubmit = async () => {
  const actionFn = isEditing.value
    ? () => partnerService.updatePartner(selectedPartner.value._id, form.value)
    : () => partnerService.createPartner(form.value)

  await executeSubmit(actionFn, {
    successMessage: isEditing.value ? 'partners.updateSuccess' : 'partners.createSuccess',
    errorMessage: 'common.operationFailed',
    onSuccess: () => {
      showModal.value = false
      fetchPartners()
    }
  })
}

const confirmDelete = partner => {
  selectedPartner.value = partner
  showDeleteModal.value = true
}

const handleDelete = async () => {
  await executeDelete(() => partnerService.deletePartner(selectedPartner.value._id), {
    successMessage: 'partners.deleteSuccess',
    errorMessage: 'common.deleteFailed',
    onSuccess: () => {
      showDeleteModal.value = false
      fetchPartners()
    }
  })
}

const confirmApprove = partner => {
  selectedPartner.value = partner
  showApproveModal.value = true
}

const handleApprove = async () => {
  await executeApprove(() => partnerService.approvePartner(selectedPartner.value._id), {
    successMessage: 'partners.approveSuccess',
    errorMessage: 'common.operationFailed',
    onSuccess: () => {
      showApproveModal.value = false
      fetchPartners()
    }
  })
}

const uploadDocument = async file => {
  if (!file || !selectedPartner.value) return

  const formData = new FormData()
  formData.append('document', file)
  formData.append('documentType', 'license')

  await executeUpload(() => partnerService.uploadDocument(selectedPartner.value._id, formData), {
    successMessage: 'common.uploadSuccess',
    errorMessage: 'common.uploadFailed',
    onSuccess: response => {
      selectedPartner.value = response.data.partner
    }
  })
}

const confirmDeleteDocument = async documentId => {
  if (!confirm(t('common.confirm'))) return

  await executeDelete(() => partnerService.deleteDocument(selectedPartner.value._id, documentId), {
    successMessage: 'common.deleteSuccess',
    errorMessage: 'common.deleteFailed',
    onSuccess: response => {
      selectedPartner.value = response.data
    }
  })
}

onMounted(fetchPartners)
</script>
