<template>
  <div class="space-y-6">
    <!-- Header with Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
              {{ $t('agencies.totalAgencies') }}
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
          </div>
          <div
            class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400">storefront</span>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
              {{ $t('agencies.activeAgencies') }}
            </p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {{ stats.active }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center"
          >
            <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
              {{ $t('agencies.pendingAgencies') }}
            </p>
            <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {{ stats.pending }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center"
          >
            <span class="material-icons text-yellow-600 dark:text-yellow-400">pending</span>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
              {{ $t('agencies.totalCredit') }}
            </p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {{ formatCurrency(stats.totalCredit) }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"
          >
            <span class="material-icons text-blue-600 dark:text-blue-400"
              >account_balance_wallet</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Card -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700"
    >
      <!-- Toolbar -->
      <div class="p-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- Search & Filters -->
          <div class="flex flex-col sm:flex-row gap-3 flex-1">
            <!-- Search -->
            <div class="relative flex-1 max-w-md">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >search</span
              >
              <input
                v-model="searchQuery"
                type="text"
                class="form-input pl-10 w-full"
                :placeholder="$t('agencies.searchPlaceholder')"
                @input="debouncedSearch"
              />
              <button
                v-if="searchQuery"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="searchQuery = ''; applyFilters()"
              >
                <span class="material-icons text-sm">close</span>
              </button>
            </div>

            <!-- Status Filter -->
            <select v-model="statusFilter" class="form-input w-full sm:w-40" @change="applyFilters">
              <option value="">{{ $t('agencies.allStatuses') }}</option>
              <option value="active">{{ $t('common.active') }}</option>
              <option value="inactive">{{ $t('common.inactive') }}</option>
              <option value="pending">{{ $t('common.pending') }}</option>
              <option value="suspended">{{ $t('agencies.suspended') }}</option>
            </select>

            <!-- Credit Filter -->
            <select v-model="creditFilter" class="form-input w-full sm:w-44" @change="applyFilters">
              <option value="">{{ $t('agencies.allCredits') }}</option>
              <option value="enabled">{{ $t('agencies.creditEnabled') }}</option>
              <option value="disabled">{{ $t('agencies.creditDisabled') }}</option>
              <option value="low">{{ $t('agencies.lowCredit') }}</option>
            </select>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              class="p-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              :title="$t('common.refresh')"
              @click="fetchAgencies"
            >
              <span class="material-icons" :class="{ 'animate-spin': loading }">refresh</span>
            </button>
            <button class="btn-primary flex items-center gap-2" @click="openCreateModal">
              <span class="material-icons text-lg">add</span>
              <span class="hidden sm:inline">{{ $t('agencies.addAgency') }}</span>
            </button>
          </div>
        </div>

        <!-- Active Filters -->
        <div
          v-if="hasActiveFilters"
          class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700"
        >
          <span class="text-sm text-gray-500 dark:text-slate-400"
            >{{ $t('common.activeFilters') }}:</span
          >
          <span
            v-if="searchQuery"
            class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm"
          >
            {{ $t('common.search') }}: "{{ searchQuery }}"
            <button
              class="hover:text-purple-900 dark:hover:text-purple-100"
              @click="searchQuery = ''; applyFilters()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="statusFilter"
            class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
          >
            {{ $t('common.status.label') }}: {{ getStatusLabel(statusFilter) }}
            <button
              class="hover:text-blue-900 dark:hover:text-blue-100"
              @click="statusFilter = ''; applyFilters()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="creditFilter"
            class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm"
          >
            {{ $t('agencies.creditLimit') }}: {{ getCreditFilterLabel(creditFilter) }}
            <button
              class="hover:text-green-900 dark:hover:text-green-100"
              @click="creditFilter = ''; applyFilters()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <button
            class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
            @click="clearAllFilters"
          >
            <span class="material-icons text-sm">clear_all</span>
            {{ $t('common.clearAll') }}
          </button>
        </div>
      </div>

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
                  row.creditLimit.currency
                )
              }}</span>
              <span class="text-gray-400 dark:text-slate-500">
                /
                {{ formatCurrency(row.creditLimit.amount, row.creditLimit.currency) }}</span
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
              >{{ row.commission?.default || 10 }}%</span
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
    <Modal
      v-model="showModal"
      :title="isEditing ? $t('agencies.editAgency') : $t('agencies.addAgency')"
      size="xl"
      :close-on-overlay="false"
    >
      <div class="flex flex-col h-[600px] -mx-6 -my-4">
        <!-- Tabs Header -->
        <div
          class="flex-shrink-0 border-b border-gray-200 dark:border-slate-700 px-6 bg-gray-50 dark:bg-slate-700/50"
        >
          <nav class="flex gap-1 overflow-x-auto py-2 -mb-px">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap border-b-2 -mb-[2px]"
              :class="
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border-transparent hover:border-gray-300'
              "
              @click="activeTab = tab.id"
            >
              <span class="material-icons text-lg">{{ tab.icon }}</span>
              <span>{{ tab.label }}</span>
              <span
                v-if="tab.id === 'basic' && hasBasicErrors"
                class="w-2 h-2 bg-red-500 rounded-full"
              ></span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Tab 1: Basic Info & Address -->
          <div v-show="activeTab === 'basic'" class="space-y-8">
            <!-- Basic Info Section -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="material-icons text-purple-600">business</span>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                  {{ $t('agencies.basicInfo') }}
                </h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField :label="$t('agencies.companyName')" :error="errors.companyName" required>
                  <input
                    v-model="form.companyName"
                    type="text"
                    class="form-input"
                    :class="{ 'has-error': errors.companyName }"
                    :placeholder="$t('agencies.companyNamePlaceholder')"
                    @input="errors.companyName = ''"
                  />
                </FormField>

                <FormField :label="$t('agencies.tradeName')">
                  <input
                    v-model="form.tradeName"
                    type="text"
                    class="form-input"
                    :placeholder="$t('agencies.tradeNamePlaceholder')"
                  />
                </FormField>

                <FormField :label="$t('agencies.email')" :error="errors.email" required>
                  <div class="relative">
                    <span
                      class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
                      >email</span
                    >
                    <input
                      v-model="form.email"
                      type="email"
                      class="form-input pl-10"
                      :class="{ 'has-error': errors.email }"
                      placeholder="ornek@acente.com"
                      @input="errors.email = ''"
                    />
                  </div>
                </FormField>

                <FormField :label="$t('agencies.phone')">
                  <div class="relative">
                    <span
                      class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
                      >phone</span
                    >
                    <input
                      v-model="form.phone"
                      type="text"
                      class="form-input pl-10"
                      placeholder="+90 555 123 45 67"
                    />
                  </div>
                </FormField>

                <FormField :label="$t('agencies.taxOffice')">
                  <input
                    v-model="form.taxOffice"
                    type="text"
                    class="form-input"
                    :placeholder="$t('agencies.taxOfficePlaceholder')"
                  />
                </FormField>

                <FormField :label="$t('agencies.taxNumber')">
                  <input
                    v-model="form.taxNumber"
                    type="text"
                    class="form-input"
                    placeholder="1234567890"
                  />
                </FormField>

                <FormField :label="$t('common.status.label')">
                  <select v-model="form.status" class="form-input">
                    <option value="active">{{ $t('common.active') }}</option>
                    <option value="inactive">{{ $t('common.inactive') }}</option>
                    <option value="pending">{{ $t('common.pending') }}</option>
                  </select>
                </FormField>
              </div>
            </div>

            <!-- Address Section -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="material-icons text-purple-600">location_on</span>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                  {{ $t('agencies.addressTitle') }}
                </h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="md:col-span-2">
                  <FormField :label="$t('agencies.street')">
                    <input
                      v-model="form.address.street"
                      type="text"
                      class="form-input"
                      :placeholder="$t('agencies.streetPlaceholder')"
                    />
                  </FormField>
                </div>
                <FormField :label="$t('agencies.city')">
                  <input v-model="form.address.city" type="text" class="form-input" />
                </FormField>
                <FormField :label="$t('agencies.country')">
                  <CountrySelect v-model="form.address.country" />
                </FormField>
                <FormField :label="$t('agencies.postalCode')">
                  <input v-model="form.address.postalCode" type="text" class="form-input" />
                </FormField>
              </div>
            </div>
          </div>

          <!-- Tab 2: Commission & Credit -->
          <div v-show="activeTab === 'finance'" class="space-y-8">
            <!-- Working Mode Section -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="material-icons text-green-600">settings</span>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                  {{ $t('agencies.workingMode') }}
                </h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
                {{ $t('agencies.workingModeDesc') }}
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Net Option -->
                <label
                  class="relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all"
                  :class="
                    form.commission.mode === 'net'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  "
                >
                  <input v-model="form.commission.mode" type="radio" value="net" class="sr-only" />
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center"
                      :class="
                        form.commission.mode === 'net'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
                      "
                    >
                      <span class="material-icons">monetization_on</span>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-800 dark:text-white">
                        {{ $t('agencies.workingModes.net') }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        {{ $t('agencies.workingModes.netDesc') }}
                      </p>
                    </div>
                  </div>
                  <span
                    v-if="form.commission.mode === 'net'"
                    class="absolute top-3 right-3 material-icons text-blue-500"
                    >check_circle</span
                  >
                </label>

                <!-- Commission Option -->
                <label
                  class="relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all"
                  :class="
                    form.commission.mode === 'commission'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  "
                >
                  <input
                    v-model="form.commission.mode"
                    type="radio"
                    value="commission"
                    class="sr-only"
                  />
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center"
                      :class="
                        form.commission.mode === 'commission'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
                      "
                    >
                      <span class="material-icons">percent</span>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-800 dark:text-white">
                        {{ $t('agencies.workingModes.commission') }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        {{ $t('agencies.workingModes.commissionDesc') }}
                      </p>
                    </div>
                  </div>
                  <span
                    v-if="form.commission.mode === 'commission'"
                    class="absolute top-3 right-3 material-icons text-green-500"
                    >check_circle</span
                  >
                </label>
              </div>

              <!-- Commission Rate (only shown when commission mode is selected) -->
              <div
                v-if="form.commission.mode === 'commission'"
                class="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800"
              >
                <div class="flex items-center gap-2 mb-4">
                  <span class="material-icons text-green-600">percent</span>
                  <h4 class="font-semibold text-gray-800 dark:text-white">
                    {{ $t('agencies.commissionRate') }}
                  </h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField :label="$t('agencies.hotelCommission')">
                    <div class="relative">
                      <input
                        v-model.number="form.commission.hotel"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        class="form-input pr-10"
                      />
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium"
                        >%</span
                      >
                    </div>
                  </FormField>
                  <FormField :label="$t('agencies.tourCommission')">
                    <div class="relative">
                      <input
                        v-model.number="form.commission.tour"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        class="form-input pr-10"
                      />
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium"
                        >%</span
                      >
                    </div>
                  </FormField>
                  <FormField :label="$t('agencies.transferCommission')">
                    <div class="relative">
                      <input
                        v-model.number="form.commission.transfer"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        class="form-input pr-10"
                      />
                      <span
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium"
                        >%</span
                      >
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            <!-- Credit Limit Section -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="material-icons text-blue-600">account_balance_wallet</span>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                  {{ $t('agencies.creditLimit') }}
                </h3>
              </div>
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
                <label class="flex items-center gap-3 cursor-pointer mb-5">
                  <div class="relative">
                    <input
                      v-model="form.creditLimit.enabled"
                      type="checkbox"
                      class="sr-only peer"
                    />
                    <div
                      class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
                    ></div>
                  </div>
                  <span class="font-medium text-gray-700 dark:text-slate-300">{{
                    $t('agencies.enableCreditLimit')
                  }}</span>
                </label>

                <div
                  v-if="form.creditLimit.enabled"
                  class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-200 dark:border-slate-600"
                >
                  <FormField :label="$t('agencies.creditAmount')">
                    <div class="relative">
                      <input
                        v-model.number="form.creditLimit.amount"
                        type="number"
                        min="0"
                        class="form-input"
                      />
                    </div>
                  </FormField>
                  <FormField :label="$t('agencies.currency')">
                    <select v-model="form.creditLimit.currency" class="form-input">
                      <option value="TRY">TRY - Türk Lirası</option>
                      <option value="USD">USD - Dolar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 3: Sales Restrictions -->
          <div v-show="activeTab === 'sales'" class="space-y-8">
            <!-- Allowed Countries -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="material-icons text-blue-600">public</span>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                  {{ $t('agencies.allowedCountries') }}
                </h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-slate-400 mb-3">
                {{ $t('agencies.allowedCountriesDesc') }}
              </p>
              <div
                v-if="form.salesRestrictions.allowedCountries.length"
                class="flex flex-wrap gap-2 mb-3"
              >
                <span
                  v-for="code in form.salesRestrictions.allowedCountries"
                  :key="code"
                  class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                >
                  <img
                    :src="`/flags/${code.toLowerCase()}.svg`"
                    :alt="code"
                    class="w-5 h-3.5 object-contain"
                  />
                  {{ getCountryLabel(code) }}
                  <button
                    type="button"
                    class="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                    @click="removeCountry(code)"
                  >
                    <span class="material-icons text-sm">close</span>
                  </button>
                </span>
              </div>
              <CountrySelect
                v-model="selectedCountryToAdd"
                :placeholder="$t('agencies.selectCountryToAdd')"
                @update:model-value="addCountry"
              />
            </div>

            <!-- Allowed Hotels -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="material-icons text-green-600">hotel</span>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                  {{ $t('agencies.allowedHotels') }}
                </h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-slate-400 mb-3">
                {{ $t('agencies.allowedHotelsDesc') }}
              </p>
              <HotelAutocomplete
                v-model="form.salesRestrictions.allowedHotels"
                :hotels="hotels"
                :placeholder="$t('agencies.searchHotelToAdd')"
                variant="green"
              />
            </div>

            <!-- Blocked Hotels -->
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="material-icons text-red-600">block</span>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                  {{ $t('agencies.blockedHotels') }}
                </h3>
              </div>
              <p class="text-sm text-gray-500 dark:text-slate-400 mb-3">
                {{ $t('agencies.blockedHotelsDesc') }}
              </p>
              <HotelAutocomplete
                v-model="form.salesRestrictions.blockedHotels"
                :hotels="hotels"
                :placeholder="$t('agencies.searchHotelToBlock')"
                variant="red"
              />
            </div>
          </div>

          <!-- Tab 4: Payment Methods -->
          <div v-show="activeTab === 'payment'" class="space-y-6">
            <div class="flex items-center gap-2 mb-4">
              <span class="material-icons text-purple-600">payment</span>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                {{ $t('agencies.paymentSettingsTab') }}
              </h3>
            </div>

            <div class="space-y-4">
              <!-- Credit Card -->
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
                <label class="flex items-center gap-3 cursor-pointer">
                  <div class="relative">
                    <input
                      type="checkbox"
                      :checked="form.paymentSettings.allowedMethods.includes('creditCard')"
                      class="sr-only peer"
                      @change="togglePaymentMethod('creditCard')"
                    />
                    <div
                      class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
                    ></div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-purple-600">credit_card</span>
                    <span class="font-medium text-gray-700 dark:text-slate-300">{{
                      $t('agencies.paymentMethods.creditCard')
                    }}</span>
                  </div>
                </label>
                <div
                  v-if="form.paymentSettings.allowedMethods.includes('creditCard')"
                  class="mt-4 pl-14"
                >
                  <FormField :label="$t('agencies.maxInstallments')">
                    <div class="flex items-center gap-3">
                      <input
                        v-model.number="form.paymentSettings.maxInstallments"
                        type="number"
                        min="1"
                        max="12"
                        class="form-input w-24 text-center"
                      />
                      <span class="text-sm text-gray-500 dark:text-slate-400">
                        {{
                          form.paymentSettings.maxInstallments === 1
                            ? $t('agencies.singlePayment')
                            : $t('agencies.installments')
                        }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      {{ $t('agencies.installmentsHint') }}
                    </p>
                  </FormField>
                </div>
              </div>

              <!-- Bank Transfer -->
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
                <label class="flex items-center gap-3 cursor-pointer">
                  <div class="relative">
                    <input
                      type="checkbox"
                      :checked="form.paymentSettings.allowedMethods.includes('bankTransfer')"
                      class="sr-only peer"
                      @change="togglePaymentMethod('bankTransfer')"
                    />
                    <div
                      class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                    ></div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-blue-600">account_balance</span>
                    <span class="font-medium text-gray-700 dark:text-slate-300">{{
                      $t('agencies.paymentMethods.bankTransfer')
                    }}</span>
                  </div>
                </label>
              </div>

              <!-- Cash -->
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
                <label class="flex items-center gap-3 cursor-pointer">
                  <div class="relative">
                    <input
                      type="checkbox"
                      :checked="form.paymentSettings.allowedMethods.includes('cash')"
                      class="sr-only peer"
                      @change="togglePaymentMethod('cash')"
                    />
                    <div
                      class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"
                    ></div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-green-600">payments</span>
                    <span class="font-medium text-gray-700 dark:text-slate-300">{{
                      $t('agencies.paymentMethods.cash')
                    }}</span>
                  </div>
                </label>
              </div>

              <!-- Pay at Property -->
              <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5">
                <label class="flex items-center gap-3 cursor-pointer">
                  <div class="relative">
                    <input
                      type="checkbox"
                      :checked="form.paymentSettings.allowedMethods.includes('payAtProperty')"
                      class="sr-only peer"
                      @change="togglePaymentMethod('payAtProperty')"
                    />
                    <div
                      class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"
                    ></div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-orange-600">hotel</span>
                    <span class="font-medium text-gray-700 dark:text-slate-300">{{
                      $t('agencies.paymentMethods.payAtProperty')
                    }}</span>
                  </div>
                </label>
                <p class="text-xs text-gray-400 dark:text-slate-500 mt-2 pl-14">
                  {{ $t('agencies.payAtPropertyDesc') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Tab 5: Documents -->
          <div v-show="activeTab === 'documents'">
            <div class="flex items-center gap-2 mb-4">
              <span class="material-icons text-orange-600">folder</span>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                {{ $t('agencies.documentsTab') }}
              </h3>
            </div>
            <div v-if="isEditing && selectedAgency">
              <DocumentUpload
                :partner-id="selectedAgency._id"
                :documents="selectedAgency.documents"
                :uploading="uploading"
                base-url="/agencies"
                @upload="uploadDocument"
                @delete="confirmDeleteDocument"
              />
            </div>
            <div v-else class="text-center py-12 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
              <span class="material-icons text-5xl text-gray-300 dark:text-slate-600 mb-3"
                >description</span
              >
              <p class="text-gray-500 dark:text-slate-400">
                {{ $t('agencies.saveFirstForDocuments') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <button type="button" class="btn-secondary" @click="showModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="submitting"
            class="btn-primary min-w-[120px]"
            @click="handleSubmit"
          >
            <span v-if="submitting" class="material-icons animate-spin mr-2 text-lg">sync</span>
            {{
              submitting ? $t('common.saving') : isEditing ? $t('common.save') : $t('common.create')
            }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('common.confirmDelete')" size="sm">
      <div class="text-center py-4">
        <div
          class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="material-icons text-3xl text-red-600">delete_forever</span>
        </div>
        <p class="text-gray-600 dark:text-slate-400">{{ $t('agencies.deleteConfirmation') }}</p>
        <p class="text-sm text-gray-500 dark:text-slate-500 mt-2">
          {{ selectedAgency?.companyName }}
        </p>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showDeleteModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button :disabled="deleting" class="btn-danger" @click="deleteAgency">
          <span v-if="deleting" class="material-icons animate-spin mr-2">sync</span>
          {{ $t('common.delete') }}
        </button>
      </template>
    </Modal>

    <!-- Approve Confirmation Modal -->
    <Modal v-model="showApproveModal" :title="$t('agencies.approveAgency')" size="sm">
      <div class="text-center py-4">
        <div
          class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <span class="material-icons text-3xl text-green-600">check_circle</span>
        </div>
        <p class="text-gray-600 dark:text-slate-400">{{ $t('agencies.approveConfirmation') }}</p>
        <p class="text-sm text-gray-500 dark:text-slate-500 mt-2">
          {{ selectedAgency?.companyName }}
        </p>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showApproveModal = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          :disabled="approving"
          class="btn-primary bg-green-600 hover:bg-green-700"
          @click="approveAgency"
        >
          <span v-if="approving" class="material-icons animate-spin mr-2">sync</span>
          {{ $t('agencies.approve') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import FormField from '@/components/common/FormField.vue'
import DataTable from '@/components/ui/data/DataTable.vue'
import DocumentUpload from '@/components/DocumentUpload.vue'
import CountrySelect from '@/components/common/CountrySelect.vue'
import HotelAutocomplete from '@/components/common/HotelAutocomplete.vue'
import agencyService from '@/services/agencyService'
import hotelService from '@/services/hotelService'
import { useI18n } from 'vue-i18n'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { getCountryName } from '@/data/countries'
import { useAsyncAction } from '@/composables/useAsyncAction'

const { t, locale } = useI18n()
const toast = useToast()
const router = useRouter()

// Async action composables
const { isLoading: loading, execute: executeFetch } = useAsyncAction({ showSuccessToast: false })
const { isLoading: submitting, execute: executeSubmit } = useAsyncAction()
const { isLoading: deleting, execute: executeDelete } = useAsyncAction()
const { isLoading: approving, execute: executeApprove } = useAsyncAction()
const { isLoading: uploading, execute: executeUpload } = useAsyncAction()
const { execute: executeFetchHotels } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })

// State
const agencies = ref([])
const hotels = ref([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const showApproveModal = ref(false)
const isEditing = ref(false)
const selectedAgency = ref(null)
const activeTab = ref('basic')

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const creditFilter = ref('')
let searchTimeout = null

// Stats
const stats = computed(() => {
  const total = agencies.value.length
  const active = agencies.value.filter(a => a.status === 'active').length
  const pending = agencies.value.filter(a => a.status === 'pending').length
  const totalCredit = agencies.value.reduce((sum, a) => {
    if (a.creditLimit?.enabled) {
      return sum + (a.creditLimit.amount - (a.creditLimit.used || 0))
    }
    return sum
  }, 0)
  return { total, active, pending, totalCredit }
})

// Filtered agencies
const filteredAgencies = computed(() => {
  let result = [...agencies.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      a =>
        (a.companyName || a.name || '').toLowerCase().includes(query) ||
        (a.email || '').toLowerCase().includes(query) ||
        (a.phone || '').includes(query) ||
        (a.taxNumber || '').includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    result = result.filter(a => a.status === statusFilter.value)
  }

  // Credit filter
  if (creditFilter.value) {
    if (creditFilter.value === 'enabled') {
      result = result.filter(a => a.creditLimit?.enabled)
    } else if (creditFilter.value === 'disabled') {
      result = result.filter(a => !a.creditLimit?.enabled)
    } else if (creditFilter.value === 'low') {
      result = result.filter(a => {
        if (!a.creditLimit?.enabled) return false
        const available = a.creditLimit.amount - (a.creditLimit.used || 0)
        return available < a.creditLimit.amount * 0.2
      })
    }
  }

  return result
})

const hasActiveFilters = computed(
  () => searchQuery.value || statusFilter.value || creditFilter.value
)

// DataTable columns
const columns = computed(() => [
  { key: 'companyName', label: t('agencies.agency'), sortable: true },
  { key: 'email', label: t('agencies.contact'), sortable: false },
  { key: 'status', label: t('common.status.label'), sortable: true },
  { key: 'creditLimit', label: t('agencies.creditLimit'), sortable: false },
  { key: 'commission', label: t('agencies.commission'), sortable: false }
])

// Tabs
const tabs = computed(() => [
  { id: 'basic', label: t('agencies.infoTab'), icon: 'business' },
  { id: 'finance', label: t('agencies.commissionTab'), icon: 'account_balance' },
  { id: 'sales', label: t('agencies.salesRestrictionsTab'), icon: 'public' },
  { id: 'payment', label: t('agencies.paymentSettingsTab'), icon: 'payment' },
  { id: 'documents', label: t('agencies.documentsTab'), icon: 'folder' }
])

const hasBasicErrors = computed(() => !!errors.value.companyName || !!errors.value.email)

// Selection helpers
const selectedCountryToAdd = ref('')

// Form
const getDefaultForm = () => ({
  companyName: '',
  tradeName: '',
  email: '',
  phone: '',
  taxOffice: '',
  taxNumber: '',
  status: 'active',
  address: { street: '', city: '', country: '', postalCode: '' },
  commission: { mode: 'net', hotel: 10, tour: 10, transfer: 10 },
  creditLimit: { enabled: false, amount: 0, currency: 'TRY', used: 0 },
  salesRestrictions: { allowedCountries: [], allowedHotels: [], blockedHotels: [] },
  paymentSettings: {
    allowedMethods: ['creditCard', 'bankTransfer'],
    defaultMethod: 'creditCard',
    maxInstallments: 12
  }
})

const form = ref(getDefaultForm())
const errors = ref({})

// Validation
const validateForm = () => {
  errors.value = {}
  if (!form.value.companyName?.trim()) errors.value.companyName = t('validation.required')
  if (!form.value.email?.trim()) {
    errors.value.email = t('validation.required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = t('validation.email')
  }
  return Object.keys(errors.value).length === 0
}

// Helper functions
const getInitials = name => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getCountryLabel = code => getCountryName(code, locale.value)

const getStatusLabel = status => {
  const labels = {
    active: t('common.active'),
    inactive: t('common.inactive'),
    pending: t('common.pending'),
    suspended: t('agencies.suspended')
  }
  return labels[status] || status
}

const getCreditFilterLabel = filter => {
  const labels = {
    enabled: t('agencies.creditEnabled'),
    disabled: t('agencies.creditDisabled'),
    low: t('agencies.lowCredit')
  }
  return labels[filter] || filter
}

const getStatusClass = status => {
  const classes = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }
  return classes[status] || classes.inactive
}

const getStatusDotClass = status => {
  const classes = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    pending: 'bg-yellow-500',
    suspended: 'bg-red-500'
  }
  return classes[status] || 'bg-gray-500'
}

const getCreditBarClass = creditLimit => {
  const percentage = getCreditPercentage(creditLimit)
  if (percentage < 20) return 'bg-red-500'
  if (percentage < 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

const getCreditPercentage = creditLimit => {
  if (!creditLimit?.amount) return 0
  const available = creditLimit.amount - (creditLimit.used || 0)
  return Math.round((available / creditLimit.amount) * 100)
}

const getAvailableCredit = creditLimit => creditLimit.amount - (creditLimit.used || 0)

const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount)
}

// Filter functions
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => applyFilters(), 300)
}

const applyFilters = () => {
  // Filters are reactive, no additional action needed
}

const clearAllFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  creditFilter.value = ''
}

// Country/Hotel selection
const addCountry = code => {
  if (code && !form.value.salesRestrictions.allowedCountries.includes(code)) {
    form.value.salesRestrictions.allowedCountries.push(code)
  }
  selectedCountryToAdd.value = ''
}

const removeCountry = code => {
  form.value.salesRestrictions.allowedCountries =
    form.value.salesRestrictions.allowedCountries.filter(c => c !== code)
}

// Payment method toggle
const togglePaymentMethod = method => {
  const index = form.value.paymentSettings.allowedMethods.indexOf(method)
  if (index === -1) {
    form.value.paymentSettings.allowedMethods.push(method)
  } else {
    form.value.paymentSettings.allowedMethods.splice(index, 1)
  }
}

// API calls
const fetchAgencies = async () => {
  await executeFetch(
    () => agencyService.getAgencies(),
    {
      errorMessage: 'common.loadFailed',
      onSuccess: response => {
        agencies.value = Array.isArray(response.data)
          ? response.data
          : response.data.agencies || response.data.items || []
      }
    }
  )
}

const fetchHotels = async () => {
  await executeFetchHotels(
    () => hotelService.getHotels({ limit: 1000 }),
    {
      onSuccess: response => {
        if (response.success) {
          hotels.value = response.data.items || response.data.hotels || []
        }
      },
      onError: error => {
        console.error('Failed to fetch hotels', error)
      }
    }
  )
}

const openCreateModal = () => {
  isEditing.value = false
  selectedAgency.value = null
  form.value = getDefaultForm()
  errors.value = {}
  activeTab.value = 'basic'
  showModal.value = true
}

const openEditModal = agency => {
  isEditing.value = true
  selectedAgency.value = agency
  activeTab.value = 'basic'
  errors.value = {}
  form.value = {
    companyName: agency.companyName || '',
    tradeName: agency.tradeName || '',
    email: agency.email || '',
    phone: agency.phone || '',
    taxOffice: agency.taxOffice || '',
    taxNumber: agency.taxNumber || '',
    status: agency.status || 'active',
    address: {
      street: agency.address?.street || '',
      city: agency.address?.city || '',
      country: agency.address?.country || '',
      postalCode: agency.address?.postalCode || ''
    },
    commission: {
      mode: agency.commission?.mode || 'net',
      hotel: agency.commission?.hotel ?? 10,
      tour: agency.commission?.tour ?? 10,
      transfer: agency.commission?.transfer ?? 10
    },
    creditLimit: {
      enabled: agency.creditLimit?.enabled || false,
      amount: agency.creditLimit?.amount || 0,
      currency: agency.creditLimit?.currency || 'TRY',
      used: agency.creditLimit?.used || 0
    },
    salesRestrictions: {
      allowedCountries: agency.salesRestrictions?.allowedCountries || [],
      allowedHotels: agency.salesRestrictions?.allowedHotels || [],
      blockedHotels: agency.salesRestrictions?.blockedHotels || []
    },
    paymentSettings: {
      allowedMethods: agency.paymentSettings?.allowedMethods || ['creditCard', 'bankTransfer'],
      defaultMethod: agency.paymentSettings?.defaultMethod || 'creditCard',
      maxInstallments: agency.paymentSettings?.maxInstallments || 12
    }
  }
  showModal.value = true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    activeTab.value = 'basic'
    toast.error(t('validation.fixErrors'))
    return
  }

  const actionFn = isEditing.value
    ? () => agencyService.updateAgency(selectedAgency.value._id, form.value)
    : () => agencyService.createAgency(form.value)

  await executeSubmit(actionFn, {
    successMessage: isEditing.value ? 'agencies.updateSuccess' : 'agencies.createSuccess',
    errorMessage: 'common.operationFailed',
    onSuccess: () => {
      showModal.value = false
      fetchAgencies()
    }
  })
}

const confirmDelete = agency => {
  selectedAgency.value = agency
  showDeleteModal.value = true
}

const deleteAgency = async () => {
  await executeDelete(
    () => agencyService.deleteAgency(selectedAgency.value._id),
    {
      successMessage: 'agencies.deleteSuccess',
      errorMessage: 'common.deleteFailed',
      onSuccess: () => {
        showDeleteModal.value = false
        fetchAgencies()
      }
    }
  )
}

const confirmApprove = agency => {
  selectedAgency.value = agency
  showApproveModal.value = true
}

const approveAgency = async () => {
  await executeApprove(
    () => agencyService.approveAgency(selectedAgency.value._id),
    {
      successMessage: 'agencies.approveSuccess',
      errorMessage: 'common.operationFailed',
      onSuccess: () => {
        showApproveModal.value = false
        fetchAgencies()
      }
    }
  )
}

const goToUsers = agency => {
  router.push({ name: 'agency-users', params: { agencyId: agency._id } })
}

const uploadDocument = async file => {
  if (!selectedAgency.value) return

  const formData = new FormData()
  formData.append('document', file)
  formData.append('documentType', 'license')

  await executeUpload(
    () => agencyService.uploadDocument(selectedAgency.value._id, formData),
    {
      successMessage: 'common.uploadSuccess',
      errorMessage: 'common.uploadFailed',
      onSuccess: async () => {
        const response = await agencyService.getAgency(selectedAgency.value._id)
        if (response.success) selectedAgency.value = response.data
      }
    }
  )
}

const confirmDeleteDocument = async documentId => {
  if (!selectedAgency.value) return

  await executeDelete(
    () => agencyService.deleteDocument(selectedAgency.value._id, documentId),
    {
      successMessage: 'common.deleteSuccess',
      errorMessage: 'common.deleteFailed',
      onSuccess: async () => {
        const response = await agencyService.getAgency(selectedAgency.value._id)
        if (response.success) selectedAgency.value = response.data
      }
    }
  )
}

// Lifecycle
onMounted(() => {
  fetchHotels()
})

usePartnerContext({
  onPartnerChange: partner => {
    if (partner) {
      fetchAgencies()
      fetchHotels()
    }
  },
  immediate: true
})
</script>
