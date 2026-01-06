<template>
  <div class="space-y-6">
    <!-- Header with Stats -->
    <AgencyStatsCards :stats="stats" :locale="locale" />

    <!-- Main Content Card -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700"
    >
      <!-- Toolbar -->
      <AgencyToolbar
        v-model:search-query="searchQuery"
        v-model:status-filter="statusFilter"
        v-model:credit-filter="creditFilter"
        :loading="loading"
        :has-active-filters="hasActiveFilters"
        :get-status-label="getStatusLabel"
        :get-credit-filter-label="getCreditFilterLabel"
        @search="debouncedSearch"
        @filter="() => {}"
        @clear-filters="clearAllFilters"
        @refresh="fetchAgencies"
        @create="openCreateModal"
      />

      <!-- DataTable -->
      <DataTable
        :data="filteredAgencies"
        :columns="columns"
        :loading="loading"
        :total="filteredAgencies.length"
        :show-header="false"
        responsive
        :card-title-key="'companyName'"
        :empty-icon="'storefront'"
        :empty-text="$t('agencies.noAgencies')"
      >
        <!-- Empty State Action -->
        <template #empty-action>
          <button class="btn-primary mt-4" @click="openCreateModal">
            <span class="material-icons mr-2">add</span>
            {{ $t('agencies.addAgency') }}
          </button>
        </template>

        <!-- Agency Info Cell -->
        <template #cell-companyName="{ row }">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm"
            >
              {{ getInitials(row.companyName || row.name) }}
            </div>
            <div>
              <div class="font-semibold text-gray-900 dark:text-white">
                {{ row.companyName || row.name }}
              </div>
              <div v-if="row.tradeName" class="text-xs text-gray-500 dark:text-slate-400">
                {{ row.tradeName }}
              </div>
              <div v-if="row.taxNumber" class="text-xs text-gray-400 dark:text-slate-500">
                VKN: {{ row.taxNumber }}
              </div>
            </div>
          </div>
        </template>

        <!-- Contact Cell -->
        <template #cell-email="{ row }">
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 text-sm text-gray-700 dark:text-slate-300">
              <span class="material-icons text-sm text-gray-400">email</span>
              {{ row.email }}
            </div>
            <div
              v-if="row.phone"
              class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400"
            >
              <span class="material-icons text-sm text-gray-400">phone</span>
              {{ row.phone }}
            </div>
          </div>
        </template>

        <!-- Status Cell -->
        <template #cell-status="{ row }">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            :class="getStatusClass(row.status)"
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="getStatusDotClass(row.status)"
            ></span>
            {{ getStatusLabel(row.status) }}
          </span>
        </template>

        <!-- Credit Limit Cell -->
        <template #cell-creditLimit="{ row }">
          <div v-if="row.creditLimit?.enabled">
            <div class="flex items-center gap-2">
              <div
                class="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden max-w-[100px]"
              >
                <div
                  class="h-full rounded-full transition-all"
                  :class="getCreditBarClass(row.creditLimit)"
                  :style="{ width: getCreditPercentage(row.creditLimit) + '%' }"
                ></div>
              </div>
              <span class="text-xs text-gray-500 dark:text-slate-400"
                >{{ getCreditPercentage(row.creditLimit) }}%</span
              >
            </div>
            <div class="mt-1 text-sm">
              <span class="font-medium text-gray-900 dark:text-white">{{
                formatCurrency(
                  getAvailableCredit(row.creditLimit),
                  row.creditLimit.currency,
                  locale
                )
              }}</span>
              <span class="text-gray-400 dark:text-slate-500">
                /
                {{ formatCurrency(row.creditLimit.amount, row.creditLimit.currency, locale) }}</span
              >
            </div>
          </div>
          <span v-else class="text-sm text-gray-400 dark:text-slate-500">{{
            $t('agencies.noCredit')
          }}</span>
        </template>

        <!-- Commission Cell -->
        <template #cell-commission="{ row }">
          <div class="flex items-center gap-1">
            <span class="material-icons text-sm text-green-500">percent</span>
            <span class="font-medium text-gray-900 dark:text-white"
              >{{ row.commission?.default || DEFAULT_COMMISSION_RATES.hotel }}%</span
            >
          </div>
        </template>

        <!-- Row Actions -->
        <template #row-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button
              v-if="row.status === 'pending'"
              class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              :title="$t('agencies.approve')"
              @click="confirmApprove(row)"
            >
              <span class="material-icons">check_circle</span>
            </button>
            <button
              class="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              :title="$t('agencies.users')"
              @click="goToUsers(row)"
            >
              <span class="material-icons">group</span>
            </button>
            <button
              class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              :title="$t('common.edit')"
              @click="openEditModal(row)"
            >
              <span class="material-icons">edit</span>
            </button>
            <button
              class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              :title="$t('common.delete')"
              @click="confirmDelete(row)"
            >
              <span class="material-icons">delete</span>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create/Edit Modal -->
    <AgencyFormModal
      v-model="showModal"
      v-model:active-tab="activeTab"
      :is-editing="isEditing"
      :tabs="tabs"
      :has-basic-errors="hasBasicErrors"
      :form="form"
      :errors="errors"
      :hotels="hotels"
      :selected-agency="selectedAgency"
      :selected-country-to-add="selectedCountryToAdd"
      :submitting="submitting"
      :uploading="uploading"
      :get-country-label="getCountryLabel"
      @submit="handleSubmit"
      @add-country="addCountry"
      @remove-country="removeCountry"
      @toggle-payment="togglePaymentMethod"
      @upload="uploadDocument"
      @delete="confirmDeleteDocument"
    />

    <!-- Confirmation Modals -->
    <AgencyConfirmModals
      v-model:show-delete-modal="showDeleteModal"
      v-model:show-approve-modal="showApproveModal"
      :selected-agency="selectedAgency"
      :deleting="deleting"
      :approving="approving"
      @delete="deleteAgency"
      @approve="approveAgency"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import DataTable from '@/components/ui/data/DataTable.vue'
import { formatCurrency, getInitials } from '@/utils/formatters'
import { getCountryName } from '@/data/countries'
import { DEFAULT_COMMISSION_RATES } from '@/constants'
import {
  AgencyStatsCards,
  AgencyToolbar,
  AgencyFormModal,
  AgencyConfirmModals,
  useAgenciesView
} from './agencies-view'

// Use the composable for all logic
const {
  // State
  agencies,
  hotels,
  showModal,
  showDeleteModal,
  showApproveModal,
  isEditing,
  selectedAgency,
  activeTab,
  form,
  errors,
  selectedCountryToAdd,

  // Filters
  searchQuery,
  statusFilter,
  creditFilter,

  // Loading states
  loading,
  submitting,
  deleting,
  approving,
  uploading,

  // Computed
  stats,
  filteredAgencies,
  hasActiveFilters,
  hasBasicErrors,
  columns,
  tabs,

  // Status helpers
  getStatusClass,
  getStatusDotClass,
  getStatusLabel,
  getCreditBarClass,
  getCreditPercentage,
  getAvailableCredit,
  getCreditFilterLabel,

  // Methods
  fetchAgencies,
  fetchHotels,
  openCreateModal,
  openEditModal,
  handleSubmit,
  confirmDelete,
  deleteAgency,
  confirmApprove,
  approveAgency,
  goToUsers,
  uploadDocument,
  confirmDeleteDocument,
  debouncedSearch,
  clearAllFilters,
  addCountry,
  removeCountry,
  togglePaymentMethod,
  setupPartnerContext,

  // i18n
  locale
} = useAgenciesView()

// Country label helper
const getCountryLabel = (code) => getCountryName(code, locale.value)

// Lifecycle
onMounted(() => {
  fetchHotels()
})

// Setup partner context
setupPartnerContext()
</script>
