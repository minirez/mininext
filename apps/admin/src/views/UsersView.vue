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

    <!-- Users DataTable -->
    <DataTable
      :data="users"
      :columns="columns"
      :loading="loading"
      :total="pagination.total"
      :page="pagination.page"
      :per-page="pagination.limit"
      searchable
      :search-placeholder="$t('users.searchPlaceholder')"
      filterable
      :filters="tableFilters"
      responsive
      :card-title-key="'name'"
      :empty-icon="'people'"
      :empty-text="$t('users.noUsers')"
      @search="handleSearch"
      @filter="handleFilter"
      @page-change="handlePageChange"
    >
      <!-- Actions slot in header -->
      <template #actions>
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
      </template>

      <!-- User Info Cell -->
      <template #cell-name="{ row }">
        <div class="flex items-center gap-3">
          <img
            v-if="row.avatar?.url"
            :src="getAvatarUrl(row.avatar.url)"
            :alt="row.name"
            class="w-10 h-10 rounded-full object-cover shadow-sm cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
            @click="openAvatarModal(row)"
          />
          <div
            v-else
            class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm"
          >
            {{ getInitials(row.name) }}
          </div>
          <div>
            <div class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {{ row.name }}
              <span
                v-if="row.isOnline"
                class="w-2 h-2 bg-green-500 rounded-full"
                :title="$t('users.online')"
              ></span>
            </div>
            <div class="text-sm text-gray-500 dark:text-slate-400">
              {{ row.email }}
            </div>
          </div>
        </div>
      </template>

      <!-- Role Cell -->
      <template #cell-role="{ row }">
        <span
          :class="[
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
            row.role === 'admin'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
              : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
          ]"
        >
          <span class="material-icons text-sm mr-1">{{
            row.role === 'admin' ? 'admin_panel_settings' : 'person'
          }}</span>
          {{ row.role === 'admin' ? $t('users.admin') : $t('users.user') }}
        </span>
      </template>

      <!-- Status Cell -->
      <template #cell-status="{ row }">
        <span
          :class="[
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
            row.status === 'active'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : row.status === 'pending'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
          ]"
        >
          <span
            :class="[
              'w-1.5 h-1.5 rounded-full mr-1.5',
              row.status === 'active' ? 'bg-green-500' : row.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
            ]"
          ></span>
          {{ row.status === 'active' ? $t('common.active') : row.status === 'pending' ? $t('common.pending') : $t('common.inactive') }}
        </span>
      </template>

      <!-- Last Login Cell -->
      <template #cell-lastLogin="{ row }">
        <div class="text-sm text-gray-600 dark:text-slate-400">
          {{ row.lastLogin ? formatRelativeTime(row.lastLogin) : $t('users.never') }}
        </div>
      </template>

      <!-- 2FA Cell -->
      <template #cell-twoFactorEnabled="{ row }">
        <span
          :class="[
            'inline-flex items-center',
            row.twoFactorEnabled
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-400 dark:text-slate-500'
          ]"
        >
          <span class="material-icons text-lg">{{
            row.twoFactorEnabled ? 'verified_user' : 'shield'
          }}</span>
        </span>
      </template>

      <!-- Row Actions -->
      <template #row-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button
            class="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            :title="$t('users.actions.viewPermissions')"
            @click="openPermissionsModal(row)"
          >
            <span class="material-icons text-lg">security</span>
          </button>
          <button
            class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            :title="$t('users.actions.viewSessions')"
            @click="openSessionsModal(row)"
          >
            <span class="material-icons text-lg">devices</span>
          </button>
          <button
            class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            :title="$t('common.edit')"
            @click="openEditModal(row)"
          >
            <span class="material-icons text-lg">edit</span>
          </button>
          <ActionMenu
            :items="getActionMenuItems(row)"
            @select="item => handleActionSelect(item, row)"
          />
        </div>
      </template>

      <!-- Empty State Action -->
      <template #empty-action>
        <button class="btn-primary mt-4" @click="showAddModal = true">
          <span class="material-icons mr-2">person_add</span>
          {{ $t('users.addUser') }}
        </button>
      </template>
    </DataTable>

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
      v-model="showDeleteConfirm"
      :title="$t('common.delete')"
      :message="$t('users.deleteConfirmation')"
      type="danger"
      :confirm-text="$t('common.delete')"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Avatar Preview Modal -->
    <Teleport to="body">
      <div
        v-if="showAvatarModal && avatarUser"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showAvatarModal = false"
      >
        <div class="absolute inset-0 bg-black/70" @click="showAvatarModal = false"></div>
        <div class="relative z-10 max-w-lg w-full">
          <button
            class="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            @click="showAvatarModal = false"
          >
            <span class="material-icons text-3xl">close</span>
          </button>
          <div class="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <img
              :src="getAvatarUrl(avatarUser.avatar?.url)"
              :alt="avatarUser.name"
              class="w-full h-auto max-h-[70vh] object-contain"
            />
            <div class="p-4 text-center">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ avatarUser.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ avatarUser.email }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import { usePartnerStore } from '@/stores/partner'
import { useAuthStore } from '@/stores/auth'
import { useListView } from '@/composables/useListView'
import { useAsyncAction } from '@/composables/useAsyncAction'
import {
  getUsers,
  activateUser,
  deactivateUser,
  forcePasswordReset,
  resetUser2FA,
  deleteUser,
  resendActivation
} from '@/services/userService'
import authService from '@/services/authService'
import DataTable from '@/components/ui/data/DataTable.vue'
import AddUserModal from '@/components/users/AddUserModal.vue'
import UserEditModal from '@/components/users/UserEditModal.vue'
import PermissionsModal from '@/components/users/PermissionsModal.vue'
import SessionsModal from '@/components/users/SessionsModal.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import ActionMenu from '@/components/ui/buttons/ActionMenu.vue'

const { t } = useI18n()
const toast = useToast()
const partnerStore = usePartnerStore()
const authStore = useAuthStore()

// API base URL for avatar images
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || ''

// Get full avatar URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null
  if (avatarPath.startsWith('http')) return avatarPath
  return `${API_BASE_URL}${avatarPath}`
}

// DataTable columns
const columns = computed(() => [
  { key: 'name', label: t('users.name'), sortable: true },
  { key: 'role', label: t('users.role'), sortable: true },
  { key: 'status', label: t('common.status.label'), sortable: true },
  { key: 'lastLogin', label: t('users.lastLogin'), sortable: true },
  { key: 'twoFactorEnabled', label: '2FA', sortable: false }
])

// DataTable filters
const tableFilters = computed(() => [
  {
    key: 'status',
    label: t('common.status.label'),
    type: 'select',
    placeholder: t('users.allStatuses'),
    options: [
      { value: 'active', label: t('common.active') },
      { value: 'pending', label: t('common.pending') },
      { value: 'inactive', label: t('common.inactive') }
    ]
  },
  {
    key: 'role',
    label: t('users.role'),
    type: 'select',
    placeholder: t('users.allRoles'),
    options: [
      { value: 'admin', label: t('users.admin') },
      { value: 'user', label: t('users.user') }
    ]
  }
])

// Use list view composable for users
const {
  items: users,
  isLoading: loading,
  pagination,
  filters,
  fetch: fetchUsers,
  handlePageChange
} = useListView(
  params => {
    // Platform admin - filter based on view context
    if (authStore.user?.accountType === 'platform') {
      if (partnerStore.selectedPartner) {
        params.accountType = 'partner'
        params.accountId = partnerStore.selectedPartner._id
      } else {
        params.accountType = 'platform'
      }
    }
    return getUsers(params)
  },
  {
    defaultFilters: { search: '', status: '', role: '' },
    itemsKey: 'users',
    errorMessage: 'common.error'
  }
)

// Use async action for delete
const { isLoading: deleteLoading, execute: executeDelete } = useAsyncAction()
const { execute: executeActivate } = useAsyncAction({ showErrorToast: false })
const { execute: executeDeactivate } = useAsyncAction({ showErrorToast: false })
const { execute: executeForcePasswordReset } = useAsyncAction({ showErrorToast: false })
const { execute: executeReset2FA } = useAsyncAction({ showErrorToast: false })
const { execute: executeResendActivation } = useAsyncAction({ showErrorToast: false })
const { execute: executeUnblock } = useAsyncAction({ showErrorToast: false })

// Additional state

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showPermissionsModal = ref(false)
const showSessionsModal = ref(false)
const showDeleteConfirm = ref(false)
const showAvatarModal = ref(false)
const selectedUser = ref(null)
const userToDelete = ref(null)
const avatarUser = ref(null)

// Stats
const stats = computed(() => {
  const total = pagination.total
  const active = users.value.filter(u => u.status === 'active').length
  const pending = users.value.filter(u => u.status === 'pending').length
  const inactive = users.value.filter(u => u.status === 'inactive').length
  const with2FA = users.value.filter(u => u.twoFactorEnabled).length
  return { total, active, pending, inactive, with2FA }
})

// DataTable event handlers
const handleSearch = query => {
  filters.search = query
  pagination.page = 1
  fetchUsers()
}

const handleFilter = filterValues => {
  if (filterValues.status !== undefined) filters.status = filterValues.status
  if (filterValues.role !== undefined) filters.role = filterValues.role
  pagination.page = 1
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

// Get action menu items for a user row
const getActionMenuItems = row => {
  const items = []

  if (row.status === 'pending') {
    items.push({ key: 'resendActivation', label: t('users.actions.resendActivation'), icon: 'send' })
  }
  if (row.status === 'inactive') {
    items.push({ key: 'activate', label: t('users.actions.activate'), icon: 'check_circle' })
  }
  if (row.status === 'active') {
    items.push({ key: 'deactivate', label: t('users.actions.deactivate'), icon: 'pause_circle' })
  }
  if (row.status !== 'pending') {
    items.push({ key: 'forcePasswordReset', label: t('users.actions.forcePasswordReset'), icon: 'lock_reset' })
  }
  if (row.twoFactorEnabled) {
    items.push({ key: 'reset2FA', label: t('users.actions.reset2FA'), icon: 'shield' })
  }
  if (authStore.user?.accountType === 'platform') {
    items.push({ key: 'unblockAccount', label: t('users.actions.unblockAccount'), icon: 'lock_open' })
  }
  if (row._id !== authStore.user?.id) {
    items.push({ divider: true })
    items.push({ key: 'delete', label: t('common.delete'), icon: 'delete', danger: true })
  }

  return items
}

// Handle action menu selection
const handleActionSelect = (item, row) => {
  switch (item.key) {
    case 'resendActivation':
      handleResendActivation(row)
      break
    case 'activate':
      handleActivate(row)
      break
    case 'deactivate':
      handleDeactivate(row)
      break
    case 'forcePasswordReset':
      handleForcePasswordReset(row)
      break
    case 'reset2FA':
      handleReset2FA(row)
      break
    case 'unblockAccount':
      handleUnblockAccount(row)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

// Modal handlers
const openAvatarModal = user => {
  avatarUser.value = user
  showAvatarModal.value = true
}

const openEditModal = user => {
  selectedUser.value = user
  showEditModal.value = true
}

const openPermissionsModal = user => {
  selectedUser.value = user
  showPermissionsModal.value = true
}

const openSessionsModal = user => {
  selectedUser.value = user
  showSessionsModal.value = true
}

// Action handlers
const handleActivate = async user => {
  await executeActivate(
    () => activateUser(user._id),
    {
      successMessage: 'users.activated',
      onSuccess: () => fetchUsers(),
      onError: error => toast.error(error.message)
    }
  )
}

const handleDeactivate = async user => {
    await executeDeactivate(
    () => deactivateUser(user._id),
    {
      successMessage: 'users.deactivated',
      onSuccess: () => fetchUsers(),
      onError: error => toast.error(error.message)
    }
  )
}

const handleForcePasswordReset = async user => {
    await executeForcePasswordReset(
    () => forcePasswordReset(user._id),
    {
      successMessage: 'users.passwordResetForced',
      onError: error => toast.error(error.message)
    }
  )
}

const handleReset2FA = async user => {
    await executeReset2FA(
    () => resetUser2FA(user._id),
    {
      successMessage: 'users.twoFactorReset',
      onSuccess: () => fetchUsers(),
      onError: error => toast.error(error.message)
    }
  )
}

const handleUnblockAccount = async user => {
    await executeUnblock(
    () => authService.unblockAccount(user.email),
    {
      successMessage: 'users.accountUnblocked',
      onError: error => toast.error(error.message)
    }
  )
}

const handleDelete = user => {
  userToDelete.value = user
  showDeleteConfirm.value = true
  }

const confirmDelete = async () => {
  if (!userToDelete.value) return
  await executeDelete(
    () => deleteUser(userToDelete.value._id),
    {
      successMessage: 'common.deleted',
      onSuccess: () => {
        showDeleteConfirm.value = false
        userToDelete.value = null
        fetchUsers()
      },
      onFinally: () => {
        showDeleteConfirm.value = false
        userToDelete.value = null
      }
    }
  )
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
    await executeResendActivation(
    () => resendActivation(user._id),
    {
      successMessage: 'users.activationResent',
      onError: error => toast.error(error.message)
    }
  )
}

// Lifecycle
onMounted(() => {
  fetchUsers()
})

// Re-fetch when selected partner changes
watch(() => partnerStore.selectedPartner, () => {
  fetchUsers()
})
</script>
