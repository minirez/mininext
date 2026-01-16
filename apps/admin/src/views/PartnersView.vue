<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex justify-end">
          <button class="btn-primary flex items-center" @click="openCreateModal">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {{ $t('partners.addPartner') }}
          </button>
        </div>
      </div>

      <div class="p-6">
        <DataTable :columns="columns" :data="partners" :loading="loading">
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
                'badge-purple': value === 'agency'
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
                class="badge"
                :class="{
                  'badge-info': row.subscription?.plan === 'business',
                  'badge-primary': row.subscription?.plan === 'professional',
                  'badge-success': row.subscription?.plan === 'enterprise'
                }"
              >
                {{ $t(`partners.subscription.plans.${row.subscription?.plan || 'business'}`) }}
              </span>
              <span
                v-if="getSubscriptionStatusForRow(row) === 'grace_period'"
                class="text-xs text-amber-600 dark:text-amber-400"
              >
                {{ getGracePeriodDays(row) }} {{ $t('partners.subscription.daysGrace') }}
              </span>
              <span
                v-else-if="getRemainingDays(row) !== null && getRemainingDays(row) <= 30"
                class="text-xs text-gray-500 dark:text-slate-400"
              >
                {{ getRemainingDays(row) }} {{ $t('partners.subscription.daysLeft') }}
              </span>
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
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-5">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {{ $t('partners.partnerType') }}
          </label>
          <div class="grid grid-cols-2 gap-4">
            <label
              class="relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
              :class="form.partnerType === 'hotel'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800'"
            >
              <input v-model="form.partnerType" type="radio" value="hotel" class="sr-only" />
              <div
                class="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                :class="form.partnerType === 'hotel'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'"
              >
                <span class="material-icons text-2xl">apartment</span>
              </div>
              <span class="font-semibold text-gray-800 dark:text-white">{{ $t('partners.types.hotel') }}</span>
              <span class="text-xs text-gray-500 dark:text-slate-400 text-center mt-1">{{ $t('partners.typeDesc.hotel') }}</span>
              <div v-if="form.partnerType === 'hotel'" class="absolute top-2 right-2">
                <span class="material-icons text-blue-500">check_circle</span>
              </div>
            </label>

            <label
              class="relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
              :class="form.partnerType === 'agency'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-lg shadow-purple-500/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-slate-800'"
            >
              <input v-model="form.partnerType" type="radio" value="agency" class="sr-only" />
              <div
                class="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                :class="form.partnerType === 'agency'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'"
              >
                <span class="material-icons text-2xl">storefront</span>
              </div>
              <span class="font-semibold text-gray-800 dark:text-white">{{ $t('partners.types.agency') }}</span>
              <span class="text-xs text-gray-500 dark:text-slate-400 text-center mt-1">{{ $t('partners.typeDesc.agency') }}</span>
              <div v-if="form.partnerType === 'agency'" class="absolute top-2 right-2">
                <span class="material-icons text-purple-500">check_circle</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Company Information Card -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
            <span class="material-icons text-gray-500 dark:text-slate-400">business</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">{{ $t('partners.companyInfo') }}</h3>
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
                    :class="form.status === statusOption.value
                      ? `border-${statusOption.color}-500 bg-${statusOption.color}-50 dark:bg-${statusOption.color}-900/20`
                      : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'"
                  >
                    <input v-model="form.status" type="radio" :value="statusOption.value" class="sr-only" />
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="{
                        'bg-green-500': statusOption.value === 'active',
                        'bg-red-500': statusOption.value === 'inactive',
                        'bg-yellow-500': statusOption.value === 'pending'
                      }"
                    />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ statusOption.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information Card -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
            <span class="material-icons text-gray-500 dark:text-slate-400">contact_mail</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">{{ $t('partners.contactInfo') }}</h3>
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
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">email</span>
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
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">phone</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tax Information Card -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
            <span class="material-icons text-gray-500 dark:text-slate-400">receipt_long</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">{{ $t('partners.taxInfo') }}</h3>
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
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div class="bg-gray-50 dark:bg-slate-700/50 px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
            <span class="material-icons text-gray-500 dark:text-slate-400">location_on</span>
            <h3 class="font-semibold text-gray-800 dark:text-white">{{ $t('partners.address') }}</h3>
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
    <Modal
      v-model="showSubscriptionModal"
      :title="$t('partners.subscription.title')"
      size="xl"
      :close-on-overlay="false"
    >
      <div v-if="selectedPartner" class="space-y-6">
        <!-- Partner Info Header -->
        <div
          class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"
            >
              <span class="text-purple-600 dark:text-purple-400 font-semibold">
                {{ selectedPartner.companyName?.charAt(0)?.toUpperCase() }}
              </span>
            </div>
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ selectedPartner.companyName }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-slate-400">{{ selectedPartner.email }}</p>
            </div>
          </div>
          <span
            class="badge"
            :class="{
              'badge-success': subscriptionStatus?.status === 'active',
              'badge-warning': subscriptionStatus?.status === 'grace_period',
              'badge-danger':
                subscriptionStatus?.status === 'expired' ||
                subscriptionStatus?.status === 'suspended',
              'badge-secondary': subscriptionStatus?.status === 'cancelled'
            }"
          >
            {{ subscriptionStatus?.statusLabel || $t('partners.subscription.statusActive') }}
          </span>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 dark:border-slate-700">
          <nav class="flex gap-4">
            <button
              v-for="tab in subscriptionTabs"
              :key="tab.id"
              class="py-2 px-1 border-b-2 text-sm font-medium transition-colors"
              :class="[
                activeSubscriptionTab === tab.id
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'
              ]"
              @click="activeSubscriptionTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- Tab: Purchases (Satın Alınan Paketler) -->
        <div v-show="activeSubscriptionTab === 'purchases'" class="space-y-4">
          <!-- Current Status Summary -->
          <div v-if="subscriptionStatus" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600 dark:text-slate-400">{{ $t('partners.subscription.currentPlan') }}:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">
                  {{ $t(`partners.subscription.plans.${subscriptionStatus?.plan || 'business'}`) }}
                </span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-slate-400">{{ $t('partners.subscription.remainingDays') }}:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">
                  {{ subscriptionStatus.remainingDays ?? '-' }}
                </span>
              </div>
              <div v-if="subscriptionStatus.status === 'grace_period'">
                <span class="text-amber-600 dark:text-amber-400">{{ $t('partners.subscription.gracePeriodRemaining') }}:</span>
                <span class="ml-2 font-medium">{{ subscriptionStatus.gracePeriodRemainingDays }}</span>
              </div>
            </div>
          </div>

          <!-- Add Purchase Form -->
          <div class="border rounded-lg p-4 dark:border-slate-700">
            <h4 class="font-medium mb-3 text-gray-900 dark:text-white">
              {{ $t('partners.subscription.addPurchase') }}
            </h4>

            <!-- Plan Selection -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <label
                v-for="plan in subscriptionPlans"
                :key="plan.id"
                class="relative flex cursor-pointer rounded-lg border p-3 focus:outline-none"
                :class="[
                  purchaseForm.plan === plan.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                ]"
              >
                <input v-model="purchaseForm.plan" type="radio" :value="plan.id" class="sr-only" />
                <div class="flex flex-col flex-1">
                  <span class="font-medium text-sm" :class="purchaseForm.plan === plan.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'">
                    {{ plan.name }}
                  </span>
                  <span class="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                    ${{ plan.price?.yearly }}/{{ $t('common.year') }}
                  </span>
                  <div class="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    <template v-if="plan.features?.webDesign?.enabled">
                      <span>{{ plan.features.webDesign.maxSites }} site, SSL</span>
                    </template>
                    <template v-else-if="plan.features?.pms?.enabled">
                      <span>PMS: {{ plan.features.pms.maxHotels === -1 ? $t('partners.subscription.unlimited') : plan.features.pms.maxHotels }} {{ $t('partners.subscription.hotels') }}</span>
                    </template>
                    <template v-else>
                      <span>{{ $t('partners.subscription.pmsDisabled') }}</span>
                    </template>
                  </div>
                </div>
                <span v-if="purchaseForm.plan === plan.id" class="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-purple-600 rounded-full">
                  <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </span>
              </label>
            </div>

            <!-- Period & Price Details -->
            <div class="grid grid-cols-4 gap-3">
              <div>
                <label class="form-label">{{ $t('partners.subscription.startDate') }}</label>
                <input v-model="purchaseForm.startDate" type="date" class="form-input" />
              </div>
              <div>
                <label class="form-label">{{ $t('partners.subscription.endDate') }}</label>
                <input v-model="purchaseForm.endDate" type="date" class="form-input" />
              </div>
              <div>
                <label class="form-label">{{ $t('partners.subscription.amount') }}</label>
                <input v-model.number="purchaseForm.amount" type="number" step="0.01" class="form-input" />
              </div>
              <div>
                <label class="form-label">{{ $t('partners.subscription.currency') }}</label>
                <select v-model="purchaseForm.currency" class="form-input">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="TRY">TRY</option>
                </select>
              </div>
            </div>

            <!-- Payment Status Toggle -->
            <div class="mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="purchaseForm.isPaid"
                  type="checkbox"
                  class="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <span class="font-medium text-gray-900 dark:text-white">{{ $t('partners.subscription.isPaid') }}</span>
                  <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('partners.subscription.isPaidHint') }}</p>
                </div>
              </label>
            </div>

            <!-- Payment Details (only when isPaid is true) -->
            <div v-if="purchaseForm.isPaid" class="grid grid-cols-4 gap-3 mt-3">
              <div>
                <label class="form-label">{{ $t('partners.subscription.paymentDate') }} *</label>
                <input v-model="purchaseForm.paymentDate" type="date" class="form-input" required />
              </div>
              <div>
                <label class="form-label">{{ $t('partners.subscription.method') }}</label>
                <select v-model="purchaseForm.paymentMethod" class="form-input">
                  <option value="bank_transfer">{{ $t('partners.subscription.methods.bankTransfer') }}</option>
                  <option value="credit_card">{{ $t('partners.subscription.methods.creditCard') }}</option>
                  <option value="cash">{{ $t('partners.subscription.methods.cash') }}</option>
                  <option value="other">{{ $t('partners.subscription.methods.other') }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">{{ $t('partners.subscription.reference') }}</label>
                <input v-model="purchaseForm.paymentReference" type="text" class="form-input" :placeholder="$t('partners.subscription.referencePlaceholder')" />
              </div>
              <div>
                <label class="form-label">{{ $t('partners.subscription.paymentNotes') }}</label>
                <input v-model="purchaseForm.paymentNotes" type="text" class="form-input" />
              </div>
            </div>

            <button class="btn-primary mt-4" :disabled="addingPurchase || !purchaseForm.amount || (purchaseForm.isPaid && !purchaseForm.paymentDate)" @click="handleAddPurchase">
              <span v-if="addingPurchase">{{ $t('common.loading') }}</span>
              <span v-else>{{ $t('partners.subscription.addPurchase') }}</span>
            </button>
          </div>

          <!-- Purchases History -->
          <div>
            <h4 class="font-medium mb-3 text-gray-900 dark:text-white">
              {{ $t('partners.subscription.purchaseHistory') }}
            </h4>
            <div v-if="subscriptionStatus?.purchases?.length" class="space-y-2">
              <div
                v-for="purchase in subscriptionStatus.purchases"
                :key="purchase._id"
                class="flex items-center justify-between p-4 border rounded-lg dark:border-slate-700"
                :class="{
                  'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800': purchase.status === 'pending',
                  'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800': purchase.status === 'active',
                  'bg-gray-50 dark:bg-slate-800/50': purchase.status === 'expired',
                  'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800': purchase.status === 'cancelled'
                }"
              >
                <div class="flex items-center gap-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="badge" :class="{
                        'badge-info': purchase.plan === 'business',
                        'badge-primary': purchase.plan === 'professional',
                        'badge-success': purchase.plan === 'enterprise'
                      }">
                        {{ $t(`partners.subscription.plans.${purchase.plan}`) }}
                      </span>
                      <span class="badge" :class="{
                        'badge-warning': purchase.status === 'pending',
                        'badge-success': purchase.status === 'active',
                        'badge-secondary': purchase.status === 'expired',
                        'badge-danger': purchase.status === 'cancelled'
                      }">
                        {{ $t(`partners.subscription.purchaseStatus.${purchase.status}`) }}
                      </span>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-slate-400 mt-1">
                      {{ formatDate(purchase.period?.startDate) }} - {{ formatDate(purchase.period?.endDate) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-medium text-gray-900 dark:text-white">
                      {{ formatCurrency(purchase.price?.amount, purchase.price?.currency) }}
                    </div>
                    <div v-if="purchase.payment?.date" class="text-xs text-gray-500 dark:text-slate-400">
                      {{ $t(`partners.subscription.methods.${purchase.payment?.method}`) }}
                      <span v-if="purchase.payment?.reference">- {{ purchase.payment.reference }}</span>
                    </div>
                    <div v-else class="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {{ $t('partners.subscription.awaitingPayment') }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <!-- Mark as Paid Button (only for pending purchases) -->
                  <button
                    v-if="purchase.status === 'pending'"
                    class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-2"
                    :title="$t('partners.subscription.markAsPaid')"
                    @click="openMarkPaidModal(purchase)"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <!-- Edit Purchase Button (for pending or active) -->
                  <button
                    v-if="['pending', 'active'].includes(purchase.status)"
                    class="text-gray-600 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 p-2"
                    :title="$t('partners.subscription.editPurchase')"
                    @click="openEditPurchaseModal(purchase)"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <!-- Download Invoice Button -->
                  <button
                    v-if="getInvoiceForPurchase(purchase._id)"
                    class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2"
                    :title="$t('partners.subscription.downloadInvoice')"
                    @click="downloadInvoice(getInvoiceForPurchase(purchase._id)._id, getInvoiceForPurchase(purchase._id).invoiceNumber)"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <!-- Cancel Purchase Button (for pending or active) -->
                  <button
                    v-if="['pending', 'active'].includes(purchase.status)"
                    class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2"
                    :title="$t('partners.subscription.cancelPurchase')"
                    @click="confirmCancelPurchase(purchase._id)"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
              {{ $t('partners.subscription.noPurchases') }}
            </div>
          </div>
        </div>

        <!-- Tab: Settings (PMS Limits) -->
        <div v-show="activeSubscriptionTab === 'settings'" class="space-y-4">
          <!-- Custom PMS Limit -->
          <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="useCustomPmsLimit"
                type="checkbox"
                class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span class="text-sm text-gray-700 dark:text-slate-300">
                {{ $t('partners.subscription.useCustomLimit') }}
              </span>
            </label>
            <div v-if="useCustomPmsLimit" class="mt-3 ml-6">
              <label class="form-label">{{ $t('partners.subscription.maxPmsHotels') }}</label>
              <input
                v-model.number="subscriptionForm.customLimits.pmsMaxHotels"
                type="number"
                class="form-input w-32"
                min="-1"
              />
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {{ $t('partners.subscription.maxPmsHotelsHint') }}
              </p>
            </div>

            <!-- PMS Status Info -->
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
                    >
                      {{ $t('partners.subscription.canProvision') }}
                    </span>
                    <span v-else class="text-red-600 dark:text-red-400">
                      {{ $t('partners.subscription.limitReached') }}
                    </span>
                  </dd>
                </div>
                <div v-if="subscriptionStatus.pmsStatus.remainingSlots !== 'unlimited'">
                  <dt class="text-gray-500 dark:text-slate-400">
                    {{ $t('partners.subscription.remainingSlots') }}
                  </dt>
                  <dd class="font-medium text-gray-900 dark:text-white">
                    {{ subscriptionStatus.pmsStatus.remainingSlots || 0 }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <!-- Tab: Notes -->
        <div v-show="activeSubscriptionTab === 'notes'">
          <label class="form-label">{{ $t('partners.subscription.notes') }}</label>
          <textarea
            v-model="subscriptionForm.notes"
            class="form-input"
            rows="4"
            :placeholder="$t('partners.subscription.notesPlaceholder')"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showSubscriptionModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="savingSubscription"
          @click="handleSaveSubscription"
        >
          <span v-if="savingSubscription" class="flex items-center">
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
          <span v-else>{{ $t('common.save') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Edit Purchase Modal -->
    <Modal
      :show="showEditPurchaseModal"
      :title="$t('partners.subscription.editPurchase')"
      size="lg"
      @close="showEditPurchaseModal = false"
    >
      <div class="space-y-4">
        <!-- Plan Selection -->
        <div>
          <label class="form-label">{{ $t('partners.subscription.plan') }}</label>
          <select v-model="editPurchaseForm.plan" class="form-input">
            <option v-for="plan in subscriptionPlans" :key="plan.id" :value="plan.id">
              {{ plan.name }} - ${{ plan.price?.yearly }}/{{ $t('common.year') }}
            </option>
          </select>
        </div>

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

        <!-- Price -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('partners.subscription.amount') }}</label>
            <input v-model.number="editPurchaseForm.amount" type="number" step="0.01" class="form-input" />
          </div>
          <div>
            <label class="form-label">{{ $t('partners.subscription.currency') }}</label>
            <select v-model="editPurchaseForm.currency" class="form-input">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TRY">TRY</option>
            </select>
          </div>
        </div>

        <!-- Payment Info (optional) -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('partners.subscription.method') }}</label>
            <select v-model="editPurchaseForm.paymentMethod" class="form-input">
              <option value="bank_transfer">{{ $t('partners.subscription.methods.bankTransfer') }}</option>
              <option value="credit_card">{{ $t('partners.subscription.methods.creditCard') }}</option>
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
    <Modal
      :show="showMarkPaidModal"
      :title="$t('partners.subscription.markAsPaid')"
      size="md"
      @close="showMarkPaidModal = false"
    >
      <div class="space-y-4">
        <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <p class="text-sm text-amber-800 dark:text-amber-200">
            {{ $t('partners.subscription.markAsPaidInfo') }}
          </p>
          <div class="mt-2 font-medium text-amber-900 dark:text-amber-100">
            {{ $t(`partners.subscription.plans.${markPaidForm.plan}`) }} -
            {{ formatCurrency(markPaidForm.amount, markPaidForm.currency) }}
          </div>
        </div>

        <div>
          <label class="form-label">{{ $t('partners.subscription.paymentDate') }} *</label>
          <input v-model="markPaidForm.paymentDate" type="date" class="form-input" required />
        </div>

        <div>
          <label class="form-label">{{ $t('partners.subscription.method') }}</label>
          <select v-model="markPaidForm.paymentMethod" class="form-input">
            <option value="bank_transfer">{{ $t('partners.subscription.methods.bankTransfer') }}</option>
            <option value="credit_card">{{ $t('partners.subscription.methods.creditCard') }}</option>
            <option value="cash">{{ $t('partners.subscription.methods.cash') }}</option>
            <option value="other">{{ $t('partners.subscription.methods.other') }}</option>
          </select>
        </div>

        <div>
          <label class="form-label">{{ $t('partners.subscription.reference') }}</label>
          <input v-model="markPaidForm.paymentReference" type="text" class="form-input" :placeholder="$t('partners.subscription.referencePlaceholder')" />
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
        <button class="btn-success" :disabled="markingPaid || !markPaidForm.paymentDate" @click="handleMarkAsPaid">
          <span v-if="markingPaid">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('partners.subscription.confirmPayment') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import DataTable from '@/components/ui/data/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import DocumentUpload from '@/components/DocumentUpload.vue'
import partnerService from '@/services/partnerService'
import subscriptionInvoiceService from '@/services/subscriptionInvoiceService'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { usePermissions } from '@/composables/usePermissions'

const { t } = useI18n()
const { executeWithPermission } = usePermissions()

// Use async action composables
const { isLoading: loading, execute: executeFetch } = useAsyncAction({ showSuccessToast: false })
const { isLoading: submitting, execute: executeSubmit } = useAsyncAction()
const { isLoading: deleting, execute: executeDelete } = useAsyncAction()
const { isLoading: approving, execute: executeApprove } = useAsyncAction()
const { isLoading: uploading, execute: executeUpload } = useAsyncAction()
const { isLoading: savingSubscription, execute: executeSubscription } = useAsyncAction()

const partners = ref([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const showApproveModal = ref(false)
const showSubscriptionModal = ref(false)
const isEditing = ref(false)
const selectedPartner = ref(null)

// Subscription management
const subscriptionPlans = ref([])
const subscriptionStatus = ref(null)
const partnerInvoices = ref([])
const useCustomPmsLimit = ref(false)
const activeSubscriptionTab = ref('purchases')

const subscriptionTabs = [
  { id: 'purchases', label: t('partners.subscription.purchasesTab') },
  { id: 'settings', label: t('partners.subscription.settingsTab') },
  { id: 'notes', label: t('partners.subscription.notesTab') }
]

const subscriptionForm = ref({
  customLimits: {
    pmsMaxHotels: null
  },
  notes: ''
})

const purchaseForm = ref({
  plan: 'business',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  amount: null,
  currency: 'USD',
  isPaid: true,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'bank_transfer',
  paymentReference: '',
  paymentNotes: ''
})

const addingPurchase = ref(false)

// Edit purchase
const showEditPurchaseModal = ref(false)
const editPurchaseForm = ref({
  _id: null,
  plan: 'business',
  startDate: '',
  endDate: '',
  amount: null,
  currency: 'USD',
  paymentMethod: 'bank_transfer',
  paymentReference: '',
  paymentNotes: ''
})
const updatingPurchase = ref(false)

// Mark as paid
const showMarkPaidModal = ref(false)
const markPaidForm = ref({
  _id: null,
  plan: '',
  amount: null,
  currency: 'USD',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'bank_transfer',
  paymentReference: '',
  paymentNotes: ''
})
const markingPaid = ref(false)

// Helper functions for formatting
const formatCurrency = (amount, currency = 'USD') => {
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
  partnerType: 'agency'
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

// Subscription status map for badges
const subscriptionStatusMap = {
  active: { variant: 'success', label: t('partners.subscription.statusActive') },
  expired: { variant: 'danger', label: t('partners.subscription.statusExpired') },
  grace_period: { variant: 'warning', label: t('partners.subscription.statusGracePeriod') },
  cancelled: { variant: 'secondary', label: t('partners.subscription.statusCancelled') },
  suspended: { variant: 'danger', label: t('partners.subscription.statusSuspended') }
}

// Status options for form
const statusOptions = [
  { value: 'active', label: t('common.active'), color: 'green' },
  { value: 'pending', label: t('common.pending'), color: 'yellow' },
  { value: 'inactive', label: t('common.inactive'), color: 'red' }
]

// Plan badge variants
const getPlanBadgeVariant = plan => {
  const variants = {
    business: 'info',
    professional: 'primary',
    enterprise: 'success'
  }
  return variants[plan] || 'secondary'
}

// Helper functions for list display
const getRemainingDays = row => {
  if (!row.subscription?.endDate) return null
  const endDate = new Date(row.subscription.endDate)
  const now = new Date()
  const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

const getGracePeriodDays = row => {
  if (!row.subscription?.gracePeriodEndDate) return 0
  const gracePeriodEnd = new Date(row.subscription.gracePeriodEndDate)
  const now = new Date()
  const diff = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

const isPmsEnabledForRow = row => {
  const limit =
    row.subscription?.customLimits?.pmsMaxHotels ?? row.subscription?.features?.pms?.maxHotels ?? 0
  return limit > 0 || limit === -1
}

const getProvisionedHotels = row => {
  return row.pmsIntegration?.provisionedHotels?.filter(h => h.status === 'active').length || 0
}

const getPmsLimit = row => {
  const limit =
    row.subscription?.customLimits?.pmsMaxHotels ?? row.subscription?.features?.pms?.maxHotels ?? 0
  return limit === -1 ? '∞' : limit
}

const getSubscriptionStatusForRow = row => {
  if (!row.subscription?.startDate) return 'active'
  if (row.subscription?.status === 'cancelled') return 'cancelled'
  if (row.subscription?.status === 'suspended') return 'suspended'

  const now = new Date()
  const endDate = row.subscription?.endDate ? new Date(row.subscription.endDate) : null
  const gracePeriodEnd = row.subscription?.gracePeriodEndDate
    ? new Date(row.subscription.gracePeriodEndDate)
    : null

  if (endDate && now > endDate) {
    if (gracePeriodEnd && now <= gracePeriodEnd) {
      return 'grace_period'
    }
    return 'expired'
  }

  return 'active'
}

const fetchPartners = async () => {
  await executeFetch(
    () => partnerService.getPartners(),
    {
      onSuccess: response => {
        partners.value = response.data.partners || []
      },
      errorMessage: 'partners.fetchError'
    }
  )
}

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
    partnerType: 'agency'
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
    partnerType: partner.partnerType || 'agency'
  }
  showModal.value = true
}

const openSubscriptionModal = async partner => {
  selectedPartner.value = partner
  showSubscriptionModal.value = true
  await loadSubscriptionData(partner._id)
}

// Subscription management functions
const loadSubscriptionPlans = async () => {
  try {
    const response = await partnerService.getSubscriptionPlans()
    subscriptionPlans.value = response.data || []
  } catch {
    // Plans loading failed silently - use fallback
    subscriptionPlans.value = [
      {
        id: 'webdesign',
        name: 'Web Design',
        description: t('partners.subscription.planDescriptions.webdesign'),
        price: { yearly: 29 },
        features: { pms: { enabled: false, maxHotels: 0 }, webDesign: { enabled: true, maxSites: 1, ssl: true, customDomain: true } }
      },
      {
        id: 'business',
        name: 'Business',
        description: t('partners.subscription.planDescriptions.business'),
        price: { yearly: 118.9 },
        features: { pms: { enabled: false, maxHotels: 0 } }
      },
      {
        id: 'professional',
        name: 'Professional',
        description: t('partners.subscription.planDescriptions.professional'),
        price: { yearly: 178.8 },
        features: { pms: { enabled: true, maxHotels: 5 } }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: t('partners.subscription.planDescriptions.enterprise'),
        price: { yearly: 298.8 },
        features: { pms: { enabled: true, maxHotels: -1 } }
      }
    ]
  }
}

const loadSubscriptionData = async partnerId => {
  try {
    const response = await partnerService.getSubscription(partnerId)
    subscriptionStatus.value = response.data

    // Populate settings form
    subscriptionForm.value = {
      customLimits: {
        pmsMaxHotels: response.data?.customLimits?.pmsMaxHotels ?? null
      },
      notes: response.data?.notes || ''
    }

    // Check if custom limit is set
    useCustomPmsLimit.value = response.data?.customLimits?.pmsMaxHotels != null

    // Reset active tab
    activeSubscriptionTab.value = 'purchases'

    // Reset purchase form with defaults
    const today = new Date().toISOString().split('T')[0]
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    purchaseForm.value = {
      plan: response.data?.plan || 'business',
      startDate: today,
      endDate: nextYear,
      amount: subscriptionPlans.value.find(p => p.id === (response.data?.plan || 'business'))?.price?.yearly || null,
      currency: 'USD',
      isPaid: true,
      paymentDate: today,
      paymentMethod: 'bank_transfer',
      paymentReference: '',
      paymentNotes: ''
    }

    // Load partner invoices
    try {
      const invoicesResponse = await subscriptionInvoiceService.getPartnerInvoices(partnerId)
      partnerInvoices.value = invoicesResponse.data?.invoices || []
    } catch {
      partnerInvoices.value = []
    }
  } catch {
    // Reset to defaults on error
    subscriptionStatus.value = null
    subscriptionForm.value = {
      customLimits: { pmsMaxHotels: null },
      notes: ''
    }
    useCustomPmsLimit.value = false
    activeSubscriptionTab.value = 'purchases'
    partnerInvoices.value = []
  }
}

const handleSaveSubscription = async () => {
  if (!selectedPartner.value) return

  const data = {
    notes: subscriptionForm.value.notes
  }

  // Only include custom limits if checkbox is checked
  if (useCustomPmsLimit.value) {
    data.customLimits = {
      pmsMaxHotels: subscriptionForm.value.customLimits.pmsMaxHotels
    }
  } else {
    // Clear custom limits
    data.customLimits = {
      pmsMaxHotels: null
    }
  }

  await executeSubscription(
    () => partnerService.updateSubscription(selectedPartner.value._id, data),
    {
      successMessage: 'partners.subscription.updateSuccess',
      errorMessage: 'common.operationFailed',
      onSuccess: response => {
        subscriptionStatus.value = response.data
        showSubscriptionModal.value = false
        fetchPartners() // Refresh list
      }
    }
  )
}

// Purchase handlers
const handleAddPurchase = async () => {
  if (!selectedPartner.value || !purchaseForm.value.amount) return

  addingPurchase.value = true
  try {
    const response = await partnerService.addPurchase(selectedPartner.value._id, {
      plan: purchaseForm.value.plan,
      startDate: purchaseForm.value.startDate,
      endDate: purchaseForm.value.endDate,
      amount: purchaseForm.value.amount,
      currency: purchaseForm.value.currency,
      isPaid: purchaseForm.value.isPaid,
      paymentDate: purchaseForm.value.isPaid ? purchaseForm.value.paymentDate : null,
      paymentMethod: purchaseForm.value.paymentMethod,
      paymentReference: purchaseForm.value.paymentReference,
      paymentNotes: purchaseForm.value.paymentNotes
    })

    // Update subscription status
    subscriptionStatus.value = response.data.subscription

    // Reset purchase form
    const today = new Date().toISOString().split('T')[0]
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    purchaseForm.value = {
      plan: response.data.subscription?.plan || 'business',
      startDate: today,
      endDate: nextYear,
      amount: null,
      currency: 'USD',
      isPaid: true,
      paymentDate: today,
      paymentMethod: 'bank_transfer',
      paymentReference: '',
      paymentNotes: ''
    }

    // Reload invoices
    try {
      const invoicesResponse = await subscriptionInvoiceService.getPartnerInvoices(selectedPartner.value._id)
      partnerInvoices.value = invoicesResponse.data?.invoices || []
    } catch {
      partnerInvoices.value = []
    }

    // Refresh partners list to show updated status
    fetchPartners()
  } catch {
    // Error handled by API client
  } finally {
    addingPurchase.value = false
  }
}

// Open edit purchase modal
const openEditPurchaseModal = (purchase) => {
  editPurchaseForm.value = {
    _id: purchase._id,
    plan: purchase.plan,
    startDate: purchase.period?.startDate?.split('T')[0] || '',
    endDate: purchase.period?.endDate?.split('T')[0] || '',
    amount: purchase.price?.amount,
    currency: purchase.price?.currency || 'USD',
    paymentMethod: purchase.payment?.method || 'bank_transfer',
    paymentReference: purchase.payment?.reference || '',
    paymentNotes: purchase.payment?.notes || ''
  }
  showEditPurchaseModal.value = true
}

// Handle update purchase
const handleUpdatePurchase = async () => {
  if (!selectedPartner.value || !editPurchaseForm.value._id) return

  updatingPurchase.value = true
  try {
    const response = await partnerService.updatePurchase(
      selectedPartner.value._id,
      editPurchaseForm.value._id,
      {
        plan: editPurchaseForm.value.plan,
        startDate: editPurchaseForm.value.startDate,
        endDate: editPurchaseForm.value.endDate,
        amount: editPurchaseForm.value.amount,
        currency: editPurchaseForm.value.currency,
        paymentMethod: editPurchaseForm.value.paymentMethod,
        paymentReference: editPurchaseForm.value.paymentReference,
        paymentNotes: editPurchaseForm.value.paymentNotes
      }
    )

    subscriptionStatus.value = response.data.subscription
    showEditPurchaseModal.value = false
    fetchPartners()
  } catch {
    // Error handled by API client
  } finally {
    updatingPurchase.value = false
  }
}

// Open mark paid modal
const openMarkPaidModal = (purchase) => {
  markPaidForm.value = {
    _id: purchase._id,
    plan: purchase.plan,
    amount: purchase.price?.amount,
    currency: purchase.price?.currency || 'USD',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paymentNotes: ''
  }
  showMarkPaidModal.value = true
}

// Handle mark as paid
const handleMarkAsPaid = async () => {
  if (!selectedPartner.value || !markPaidForm.value._id || !markPaidForm.value.paymentDate) return

  markingPaid.value = true
  try {
    const response = await partnerService.markPurchaseAsPaid(
      selectedPartner.value._id,
      markPaidForm.value._id,
      {
        paymentDate: markPaidForm.value.paymentDate,
        paymentMethod: markPaidForm.value.paymentMethod,
        paymentReference: markPaidForm.value.paymentReference,
        paymentNotes: markPaidForm.value.paymentNotes
      }
    )

    subscriptionStatus.value = response.data.subscription
    showMarkPaidModal.value = false

    // Reload invoices
    try {
      const invoicesResponse = await subscriptionInvoiceService.getPartnerInvoices(selectedPartner.value._id)
      partnerInvoices.value = invoicesResponse.data?.invoices || []
    } catch {
      partnerInvoices.value = []
    }

    fetchPartners()
  } catch {
    // Error handled by API client
  } finally {
    markingPaid.value = false
  }
}

const confirmCancelPurchase = async purchaseId => {
  const reason = prompt(t('partners.subscription.cancelReason'))
  if (reason === null) return // User pressed cancel
  if (!selectedPartner.value) return

  try {
    const response = await partnerService.cancelPurchase(selectedPartner.value._id, purchaseId, reason)
    subscriptionStatus.value = response.data.subscription
    fetchPartners()
  } catch {
    // Error handled by API client
  }
}

// Get invoice for a specific purchase
const getInvoiceForPurchase = purchaseId => {
  return partnerInvoices.value.find(inv => inv.purchase?.toString() === purchaseId?.toString())
}

// Download invoice PDF
const downloadInvoice = async (invoiceId, invoiceNumber) => {
  try {
    await subscriptionInvoiceService.downloadPDF(invoiceId, invoiceNumber)
  } catch {
    // Error handled by service
  }
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
  await executeDelete(
    () => partnerService.deletePartner(selectedPartner.value._id),
    {
      successMessage: 'partners.deleteSuccess',
      errorMessage: 'common.deleteFailed',
      onSuccess: () => {
        showDeleteModal.value = false
        fetchPartners()
      }
    }
  )
}

const confirmApprove = partner => {
  selectedPartner.value = partner
  showApproveModal.value = true
}

const handleApprove = async () => {
  await executeApprove(
    () => partnerService.approvePartner(selectedPartner.value._id),
    {
      successMessage: 'partners.approveSuccess',
      errorMessage: 'common.operationFailed',
      onSuccess: () => {
        showApproveModal.value = false
        fetchPartners()
      }
    }
  )
}

const uploadDocument = async file => {
  if (!file || !selectedPartner.value) return

  const formData = new FormData()
  formData.append('document', file)
  formData.append('documentType', 'license')

  await executeUpload(
    () => partnerService.uploadDocument(selectedPartner.value._id, formData),
    {
      successMessage: 'common.uploadSuccess',
      errorMessage: 'common.uploadFailed',
      onSuccess: response => {
        selectedPartner.value = response.data.partner
      }
    }
  )
}

const confirmDeleteDocument = async documentId => {
  if (!confirm(t('common.confirm'))) return

  await executeDelete(
    () => partnerService.deleteDocument(selectedPartner.value._id, documentId),
    {
      successMessage: 'common.deleteSuccess',
      errorMessage: 'common.deleteFailed',
      onSuccess: response => {
        selectedPartner.value = response.data
      }
    }
  )
}

onMounted(() => {
  fetchPartners()
  loadSubscriptionPlans()
})
</script>
