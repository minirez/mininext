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
              {{ $t('users.totalUsers') }}
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
          </div>
          <div
            class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400">people</span>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
              {{ $t('users.activeUsers') }}
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
              {{ $t('users.inactiveUsers') }}
            </p>
            <p class="text-2xl font-bold text-gray-500 dark:text-slate-400 mt-1">
              {{ stats.inactive }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center"
          >
            <span class="material-icons text-gray-500 dark:text-slate-400">pause_circle</span>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-slate-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-slate-400">
              {{ $t('users.with2FA') }}
            </p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {{ stats.with2FA }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"
          >
            <span class="material-icons text-blue-600 dark:text-blue-400">security</span>
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
                :placeholder="$t('users.searchPlaceholder')"
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
              <option value="">{{ $t('users.allStatuses') }}</option>
              <option value="active">{{ $t('common.active') }}</option>
              <option value="pending">{{ $t('common.pending') }}</option>
              <option value="inactive">{{ $t('common.inactive') }}</option>
            </select>

            <!-- Role Filter -->
            <select v-model="roleFilter" class="form-input w-full sm:w-40" @change="applyFilters">
              <option value="">{{ $t('users.allRoles') }}</option>
              <option value="admin">{{ $t('users.admin') }}</option>
              <option value="user">{{ $t('users.user') }}</option>
            </select>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              class="p-2.5 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              :title="$t('common.refresh')"
              @click="fetchUsers"
            >
              <span class="material-icons" :class="{ 'animate-spin': loading }">refresh</span>
            </button>
            <button class="btn-primary flex items-center gap-2" @click="showAddModal = true">
              <span class="material-icons text-lg">person_add</span>
              <span class="hidden sm:inline">{{ $t('users.addUser') }}</span>
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
            {{ $t('common.status.label') }}: {{ statusFilter === 'active' ? $t('common.active') : $t('common.inactive') }}
            <button
              class="hover:text-blue-900 dark:hover:text-blue-100"
              @click="statusFilter = ''; applyFilters()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="roleFilter"
            class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm"
          >
            {{ $t('users.role') }}: {{ roleFilter === 'admin' ? $t('users.admin') : $t('users.user') }}
            <button
              class="hover:text-green-900 dark:hover:text-green-100"
              @click="roleFilter = ''; applyFilters()"
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

      <!-- Table -->
      <div>
        <table class="w-full min-w-[800px]">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('users.name') }}
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('users.role') }}
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('common.status.label') }}
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('users.lastLogin') }}
              </th>
              <th
                class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                2FA
              </th>
              <th
                class="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <!-- Loading State -->
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center justify-center">
                  <span class="material-icons text-4xl text-purple-600 animate-spin mb-2"
                    >refresh</span
                  >
                  <span class="text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</span>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="!filteredUsers.length">
              <td colspan="6" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center justify-center">
                  <div
                    class="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4"
                  >
                    <span class="material-icons text-3xl text-gray-400">people</span>
                  </div>
                  <p class="text-gray-500 dark:text-slate-400 font-medium">
                    {{ $t('users.noUsers') }}
                  </p>
                  <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">
                    {{ $t('users.noUsersDesc') }}
                  </p>
                  <button class="btn-primary mt-4" @click="showAddModal = true">
                    <span class="material-icons mr-2">person_add</span>
                    {{ $t('users.addUser') }}
                  </button>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-for="user in filteredUsers"
              v-else
              :key="user._id"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <!-- User Info -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  >
                    {{ getInitials(user.name) }}
                  </div>
                  <div>
                    <div class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {{ user.name }}
                      <span
                        v-if="user.isOnline"
                        class="w-2 h-2 bg-green-500 rounded-full"
                        :title="$t('users.online')"
                      ></span>
                    </div>
                    <div class="text-sm text-gray-500 dark:text-slate-400">
                      {{ user.email }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                  ]"
                >
                  <span class="material-icons text-sm mr-1">{{
                    user.role === 'admin' ? 'admin_panel_settings' : 'person'
                  }}</span>
                  {{ user.role === 'admin' ? $t('users.admin') : $t('users.user') }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    user.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : user.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full mr-1.5',
                      user.status === 'active' ? 'bg-green-500' : user.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                    ]"
                  ></span>
                  {{ user.status === 'active' ? $t('common.active') : user.status === 'pending' ? $t('common.pending') : $t('common.inactive') }}
                </span>
              </td>

              <!-- Last Login -->
              <td class="px-6 py-4">
                <div class="text-sm text-gray-600 dark:text-slate-400">
                  {{ user.lastLogin ? formatRelativeTime(user.lastLogin) : $t('users.never') }}
                </div>
              </td>

              <!-- 2FA -->
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center',
                    user.twoFactorEnabled
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-slate-500'
                  ]"
                >
                  <span class="material-icons text-lg">{{
                    user.twoFactorEnabled ? 'verified_user' : 'shield'
                  }}</span>
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    :title="$t('users.actions.viewPermissions')"
                    @click="openPermissionsModal(user)"
                  >
                    <span class="material-icons text-lg">security</span>
                  </button>
                  <button
                    class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    :title="$t('users.actions.viewSessions')"
                    @click="openSessionsModal(user)"
                  >
                    <span class="material-icons text-lg">devices</span>
                  </button>
                  <button
                    class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    :title="$t('common.edit')"
                    @click="openEditModal(user)"
                  >
                    <span class="material-icons text-lg">edit</span>
                  </button>
                  <div class="relative" @click.stop>
                    <button
                      class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      :title="$t('common.moreActions')"
                      @click="toggleActionMenu(user._id)"
                    >
                      <span class="material-icons text-lg">more_vert</span>
                    </button>
                    <!-- Dropdown Menu -->
                    <div
                      v-if="activeActionMenu === user._id"
                      class="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50"
                    >
                      <button
                        v-if="user.status === 'pending'"
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        @click="handleResendActivation(user)"
                      >
                        <span class="material-icons text-purple-500 text-lg">send</span>
                        {{ $t('users.actions.resendActivation') }}
                      </button>
                      <button
                        v-if="user.status === 'inactive'"
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        @click="handleActivate(user)"
                      >
                        <span class="material-icons text-green-500 text-lg">check_circle</span>
                        {{ $t('users.actions.activate') }}
                      </button>
                      <button
                        v-if="user.status === 'active'"
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        @click="handleDeactivate(user)"
                      >
                        <span class="material-icons text-yellow-500 text-lg">pause_circle</span>
                        {{ $t('users.actions.deactivate') }}
                      </button>
                      <button
                        v-if="user.status !== 'pending'"
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        @click="handleForcePasswordReset(user)"
                      >
                        <span class="material-icons text-blue-500 text-lg">lock_reset</span>
                        {{ $t('users.actions.forcePasswordReset') }}
                      </button>
                      <button
                        v-if="user.twoFactorEnabled"
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        @click="handleReset2FA(user)"
                      >
                        <span class="material-icons text-orange-500 text-lg">shield</span>
                        {{ $t('users.actions.reset2FA') }}
                      </button>
                      <hr class="my-1 border-gray-200 dark:border-slate-700" />
                      <button
                        class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        @click="handleDelete(user)"
                      >
                        <span class="material-icons text-lg">delete</span>
                        {{ $t('common.delete') }}
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.total > pagination.limit"
        class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700"
      >
        <div class="text-sm text-gray-500 dark:text-slate-400">
          {{ (pagination.page - 1) * pagination.limit + 1 }} -
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }} /
          {{ pagination.total }}
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="pagination.page === 1"
            @click="goToPage(pagination.page - 1)"
          >
            {{ $t('common.previous') }}
          </button>
          <button
            class="px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="pagination.page >= pagination.pages"
            @click="goToPage(pagination.page + 1)"
          >
            {{ $t('common.next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <AddUserModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @success="handleAddSuccess"
    />

    <!-- Edit User Modal -->
    <UserEditModal
      v-if="showEditModal && selectedUser"
      :user="selectedUser"
      @close="showEditModal = false; selectedUser = null"
      @success="handleEditSuccess"
    />

    <!-- Permissions Modal -->
    <PermissionsModal
      v-if="showPermissionsModal && selectedUser"
      :user="selectedUser"
      @close="showPermissionsModal = false; selectedUser = null"
      @success="handlePermissionsSuccess"
    />

    <!-- Sessions Modal -->
    <SessionsModal
      v-if="showSessionsModal && selectedUser"
      :user="selectedUser"
      @close="showSessionsModal = false; selectedUser = null"
    />

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-if="showDeleteConfirm"
      :title="$t('common.delete')"
      :message="$t('users.deleteConfirmation')"
      :description="$t('users.deleteWarning')"
      type="danger"
      :confirm-text="$t('common.delete')"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { usePartnerStore } from '@/stores/partner'
import { useAuthStore } from '@/stores/auth'
import {
  getUsers,
  activateUser,
  deactivateUser,
  forcePasswordReset,
  resetUser2FA,
  deleteUser,
  resendActivation
} from '@/services/userService'
import AddUserModal from '@/components/users/AddUserModal.vue'
import UserEditModal from '@/components/users/UserEditModal.vue'
import PermissionsModal from '@/components/users/PermissionsModal.vue'
import SessionsModal from '@/components/users/SessionsModal.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'

const { t } = useI18n()
const toast = useToast()
const partnerStore = usePartnerStore()
const authStore = useAuthStore()

// State
const loading = ref(false)
const users = ref([])
const searchQuery = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const activeActionMenu = ref(null)

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showPermissionsModal = ref(false)
const showSessionsModal = ref(false)
const showDeleteConfirm = ref(false)
const selectedUser = ref(null)
const userToDelete = ref(null)
const deleteLoading = ref(false)

// Pagination
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

// Stats
const stats = computed(() => {
  const total = pagination.total
  const active = users.value.filter(u => u.status === 'active').length
  const pending = users.value.filter(u => u.status === 'pending').length
  const inactive = users.value.filter(u => u.status === 'inactive').length
  const with2FA = users.value.filter(u => u.twoFactorEnabled).length
  return { total, active, pending, inactive, with2FA }
})

// Filtered users
const filteredUsers = computed(() => {
  return users.value
})

// Has active filters
const hasActiveFilters = computed(() => {
  return searchQuery.value || statusFilter.value || roleFilter.value
})

// Debounced search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

// Fetch users
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (statusFilter.value) params.status = statusFilter.value
    if (roleFilter.value) params.role = roleFilter.value

    // Platform admin - filter based on view context
    if (authStore.user?.accountType === 'platform') {
      if (partnerStore.selectedPartner) {
        // Viewing a specific partner - show only that partner's users
        params.accountType = 'partner'
        params.accountId = partnerStore.selectedPartner._id
      } else {
        // Platform view - show only platform users
        params.accountType = 'platform'
      }
    }

    const response = await getUsers(params)
    users.value = response.data.users
    pagination.total = response.data.pagination.total
    pagination.pages = response.data.pagination.pages
  } catch (error) {
    toast.error(error.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

// Apply filters
const applyFilters = () => {
  pagination.page = 1
  fetchUsers()
}

// Clear all filters
const clearAllFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  roleFilter.value = ''
  applyFilters()
}

// Go to page
const goToPage = page => {
  pagination.page = page
  fetchUsers()
}

// Get initials
const getInitials = name => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Format relative time
const formatRelativeTime = dateString => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('notifications.justNow')
  if (minutes < 60) return t('notifications.minutesAgo', { n: minutes })
  if (hours < 24) return t('notifications.hoursAgo', { n: hours })
  return t('notifications.daysAgo', { n: days })
}

// Toggle action menu
const toggleActionMenu = userId => {
  activeActionMenu.value = activeActionMenu.value === userId ? null : userId
}

// Close action menu on outside click
const handleClickOutside = () => {
  activeActionMenu.value = null
}

// Modal handlers
const openEditModal = user => {
  selectedUser.value = user
  showEditModal.value = true
  activeActionMenu.value = null
}

const openPermissionsModal = user => {
  selectedUser.value = user
  showPermissionsModal.value = true
  activeActionMenu.value = null
}

const openSessionsModal = user => {
  selectedUser.value = user
  showSessionsModal.value = true
  activeActionMenu.value = null
}

// Action handlers
const handleActivate = async user => {
  activeActionMenu.value = null
  try {
    await activateUser(user._id)
    toast.success(t('users.activated'))
    fetchUsers()
  } catch (error) {
    toast.error(error.message)
  }
}

const handleDeactivate = async user => {
  activeActionMenu.value = null
  try {
    await deactivateUser(user._id)
    toast.success(t('users.deactivated'))
    fetchUsers()
  } catch (error) {
    toast.error(error.message)
  }
}

const handleForcePasswordReset = async user => {
  activeActionMenu.value = null
  try {
    await forcePasswordReset(user._id)
    toast.success(t('users.passwordResetForced'))
  } catch (error) {
    toast.error(error.message)
  }
}

const handleReset2FA = async user => {
  activeActionMenu.value = null
  try {
    await resetUser2FA(user._id)
    toast.success(t('users.twoFactorReset'))
    fetchUsers()
  } catch (error) {
    toast.error(error.message)
  }
}

const handleDelete = user => {
  userToDelete.value = user
  showDeleteConfirm.value = true
  activeActionMenu.value = null
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  deleteLoading.value = true
  try {
    await deleteUser(userToDelete.value._id)
    toast.success(t('common.deleted'))
    fetchUsers()
  } catch (error) {
    toast.error(error.message)
  } finally {
    deleteLoading.value = false
    showDeleteConfirm.value = false
    userToDelete.value = null
  }
}

// Success handlers
const handleAddSuccess = () => {
  showAddModal.value = false
  fetchUsers()
  toast.success(t('users.userCreated'))
}

const handleEditSuccess = () => {
  showEditModal.value = false
  selectedUser.value = null
  fetchUsers()
}

const handlePermissionsSuccess = () => {
  showPermissionsModal.value = false
  selectedUser.value = null
  fetchUsers()
  toast.success(t('users.permissionsUpdated'))
}

// Resend activation email for pending user
const handleResendActivation = async user => {
  activeActionMenu.value = null
  try {
    await resendActivation(user._id)
    toast.success(t('users.activationResent'))
  } catch (error) {
    toast.error(error.message)
  }
}

// Lifecycle
onMounted(() => {
  fetchUsers()
  document.addEventListener('click', handleClickOutside)
})

// Re-fetch when selected partner changes
watch(() => partnerStore.selectedPartner, () => {
  fetchUsers()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
