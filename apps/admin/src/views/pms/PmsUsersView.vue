<template>
  <div class="space-y-6">
    <!-- No Hotel Selected Warning -->
    <div
      v-if="!canAccess"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
    >
      <div class="flex items-center gap-3">
        <span class="material-icons text-amber-600 dark:text-amber-400">warning</span>
        <div>
          <p class="font-medium text-amber-800 dark:text-amber-200">
            {{ $t('settings.users.hotelRequired') }}
          </p>
          <p class="text-sm text-amber-600 dark:text-amber-400">
            {{ $t('settings.users.hotelRequiredDesc') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <div v-if="canAccess" class="flex justify-end">
      <button
        :disabled="hotels.length === 0"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="showAddModal = true"
      >
        <span class="material-icons text-lg">person_add</span>
        {{ $t('settings.users.newUser') }}
      </button>
    </div>

    <!-- No Hotels Warning -->
    <div
      v-if="canAccess && hotels.length === 0 && !loading"
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
    >
      <div class="flex items-center gap-3">
        <span class="material-icons text-blue-600 dark:text-blue-400">info</span>
        <div>
          <p class="font-medium text-blue-800 dark:text-blue-200">
            {{ $t('settings.users.noHotels') }}
          </p>
          <p class="text-sm text-blue-600 dark:text-blue-400">
            {{ $t('settings.users.noHotelsDesc') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div v-if="canAccess" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-blue-600 dark:text-blue-400">badge</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('settings.users.totalUsers') }}
            </p>
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
            <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('settings.users.active') }}
            </p>
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
            <span class="material-icons text-red-600 dark:text-red-400">cancel</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.inactive }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('settings.users.inactive') }}
            </p>
          </div>
        </div>
      </div>
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400"
              >admin_panel_settings</span
            >
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.admins }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('settings.users.admin') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div
      v-if="canAccess"
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
    >
      <div class="flex flex-wrap gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400"
              >search</span
            >
            <input
              v-model="filters.search"
              type="text"
              :placeholder="$t('settings.users.searchPlaceholder')"
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              @input="debouncedFetch"
            />
          </div>
        </div>
        <!-- Department Filter -->
        <div class="w-44">
          <select
            v-model="filters.department"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            @change="fetchUsers"
          >
            <option value="">{{ $t('settings.users.allDepartments') }}</option>
            <option v-for="dept in departments" :key="dept.value" :value="dept.value">
              {{ dept.label }}
            </option>
          </select>
        </div>
        <!-- Status Filter -->
        <div class="w-32">
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            @change="fetchUsers"
          >
            <option value="">{{ $t('settings.users.allStatus') }}</option>
            <option value="active">{{ $t('common.active') }}</option>
            <option value="inactive">{{ $t('common.inactive') }}</option>
          </select>
        </div>
        <!-- Reset -->
        <button
          class="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          @click="resetFilters"
        >
          <span class="material-icons">refresh</span>
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <DataTable
      v-if="canAccess"
      :data="users"
      :columns="columns"
      :loading="loading"
      :show-header="false"
      :show-pagination="false"
      responsive
      card-title-key="name"
      empty-icon="person_off"
      :empty-text="$t('settings.users.noUsers')"
    >
      <template #cell-user="{ row }">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
          >
            <span class="text-indigo-600 dark:text-indigo-400 font-medium">{{
              getUserInitials(row)
            }}</span>
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ row.name }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ row.email }}</p>
          </div>
        </div>
      </template>

      <template #cell-department="{ row }">
        <span
          v-if="getUserDepartment(row)"
          class="px-2 py-1 text-xs rounded-full"
          :class="getDepartmentClass(getUserDepartment(row))"
        >
          {{ getDepartmentLabel(getUserDepartment(row)) }}
        </span>
        <span v-else class="text-sm text-gray-400">-</span>
        <p v-if="row.position" class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {{ row.position }}
        </p>
      </template>

      <template #cell-role="{ row }">
        <span
          v-if="getUserRole(row)"
          class="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
        >
          {{ getRoleLabel(getUserRole(row)) }}
        </span>
        <span v-else class="text-sm text-gray-400">-</span>
      </template>

      <template #cell-lastLogin="{ row }">
        <p v-if="row.lastLogin" class="text-sm text-gray-700 dark:text-gray-300">
          {{ formatDate(row.lastLogin) }}
        </p>
        <span v-else class="text-sm text-gray-400">-</span>
      </template>

      <template #cell-status="{ row }">
        <span
          class="px-2 py-1 text-xs rounded-full"
          :class="
            row.status === 'active'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          "
        >
          {{ row.status === 'active' ? $t('common.active') : $t('common.inactive') }}
        </span>
      </template>

      <template #row-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button
            class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
            :title="$t('settings.users.actions.edit')"
            @click="openEditModal(row)"
          >
            <span class="material-icons text-lg">edit</span>
          </button>
          <button
            class="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg"
            :title="$t('settings.users.actions.resetPassword')"
            @click="openResetPasswordModal(row)"
          >
            <span class="material-icons text-lg">lock_reset</span>
          </button>
          <button
            class="p-1.5 rounded-lg"
            :class="
              row.status === 'active'
                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
            "
            :title="
              row.status === 'active'
                ? $t('settings.users.actions.deactivate')
                : $t('settings.users.actions.activate')
            "
            @click="toggleUserStatus(row)"
          >
            <span class="material-icons text-lg">{{
              row.status === 'active' ? 'block' : 'check_circle'
            }}</span>
          </button>
          <button
            class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
            :title="$t('settings.users.actions.delete')"
            @click="confirmDelete(row)"
          >
            <span class="material-icons text-lg">delete</span>
          </button>
        </div>
      </template>

      <template #empty-action>
        <button
          :disabled="hotels.length === 0"
          class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          @click="showAddModal = true"
        >
          {{ $t('settings.users.addNewUser') }}
        </button>
      </template>
    </DataTable>

    <!-- Add User Modal -->
    <AddUserModal
      v-model="showAddModal"
      :hotels="hotels"
      :roles="roles"
      :departments="departments"
      @created="onUserCreated"
    />

    <!-- Edit User Modal -->
    <EditUserModal
      v-model="showEditModal"
      :user="selectedUser"
      :departments="departments"
      @updated="onUserUpdated"
    />

    <!-- Reset Password Modal -->
    <ResetPasswordModal
      v-model="showResetPasswordModal"
      :user="selectedUser"
      @reset="onPasswordReset"
    />

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      :title="$t('settings.users.deleteUser.title')"
      size="sm"
      :close-on-overlay="false"
    >
      <p class="text-gray-600 dark:text-gray-400">
        {{ $t('settings.users.deleteUser.confirmMessage', { name: selectedUser?.name }) }}
      </p>
      <p class="text-sm text-red-500 mt-2">{{ $t('settings.users.deleteUser.warning') }}</p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            @click="showDeleteModal = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            @click="deleteUser"
          >
            {{ deleting ? $t('settings.users.deleting') : $t('common.delete') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import adminUserService from '@/services/pms/adminUserService'
import { pmsLogger } from '@/utils/logger'
import hotelService from '@/services/hotelService'
import DataTable from '@/components/ui/data/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import AddUserModal from '@/components/pms/settings/AddUserModal.vue'
import EditUserModal from '@/components/pms/settings/EditUserModal.vue'
import ResetPasswordModal from '@/components/pms/settings/ResetPasswordModal.vue'
import { usePmsStore } from '@/stores/pms'

const { t } = useI18n()
const toast = useToast()

// PMS store context
const pmsStore = usePmsStore()

// Check if user can access this page (needs hotel selected)
const canAccess = computed(() => {
  return pmsStore.hasSelectedHotel
})

// State
const loading = ref(false)
const users = ref([])
const selectedUser = ref(null)
const deleting = ref(false)

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showResetPasswordModal = ref(false)
const showDeleteModal = ref(false)

// Filters
const filters = ref({
  search: '',
  department: '',
  status: ''
})

// Data - translate i18n keys from service
const roles = computed(() =>
  adminUserService.getRoles().map(r => ({
    value: r.value,
    label: t(r.labelKey),
    description: t(r.descriptionKey)
  }))
)
const departments = computed(() =>
  adminUserService.getDepartments().map(d => ({
    value: d.value,
    label: t(d.labelKey)
  }))
)
const hotels = ref([])

// Columns
const columns = computed(() => [
  { key: 'user', label: t('settings.users.columns.user'), sortable: false },
  { key: 'department', label: t('settings.users.columns.department'), sortable: false },
  { key: 'role', label: t('settings.users.columns.role'), sortable: false },
  { key: 'lastLogin', label: t('settings.users.columns.lastLogin'), sortable: false },
  { key: 'status', label: t('settings.users.columns.status'), sortable: false }
])

// Fetch hotels
const fetchHotels = async () => {
  // If we're inside a specific hotel's system (hotelId exists), use only that hotel
  const currentHotel = pmsStore.selectedPmsHotel
  const hotelId = pmsStore.hotelId

  if (hotelId && currentHotel) {
    // We're inside a specific hotel's system - use only that hotel
    hotels.value = [currentHotel]
    return
  }

  // Admin mode - fetch all hotels
  try {
    const response = await hotelService.getHotels({ limit: 1000 })
    // API returns { success, data: { items: [...] } }
    if (response.success && response.data) {
      // Extract array from response - handle different response formats
      const data = response.data
      if (Array.isArray(data)) {
        hotels.value = data
      } else if (Array.isArray(data.items)) {
        hotels.value = data.items
      } else if (Array.isArray(data.hotels)) {
        hotels.value = data.hotels
      } else {
        hotels.value = []
      }
    }
  } catch (error) {
    pmsLogger.error('Failed to fetch hotels:', error.response?.data || error.message)
    hotels.value = []
    toast.error(t('settings.users.errors.hotelLoadError'))
  }
}

// Stats
const stats = computed(() => {
  const total = users.value.length
  const active = users.value.filter(u => u.status === 'active').length
  const inactive = total - active
  const admins = users.value.filter(u => u.pmsRole === 'gm' || u.role === 'admin').length
  return { total, active, inactive, admins }
})

// Debounce for search
let searchTimeout = null
const debouncedFetch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchUsers()
  }, 300)
}

// Fetch users
const fetchUsers = async () => {
  loading.value = true
  try {
    // hotelId: computed getter'dan veya selectedPmsHotel'den oku
    const hotelId = pmsStore.hotelId || pmsStore.selectedPmsHotel?._id || null
    const params = {
      pmsAccess: 'true',
      ...(hotelId ? { hotelId } : {})
    }

    if (filters.value.department) params.pmsDepartment = filters.value.department
    if (filters.value.status) params.status = filters.value.status

    const response = await adminUserService.getAll(params)
    let data = response.data?.users || []

    // Client-side search filter
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      data = data.filter(
        u => u.name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search)
      )
    }

    users.value = data
  } catch (error) {
    pmsLogger.error('Failed to fetch users:', error)
    toast.error(t('settings.users.errors.userLoadError'))
  } finally {
    loading.value = false
  }
}

// Reset filters
const resetFilters = () => {
  filters.value = { search: '', department: '', status: '' }
  fetchUsers()
}

// Get user initials from name
const getUserInitials = user => {
  const name = user.name || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase()
  }
  return (name[0] || '?').toUpperCase()
}

// Get department label
const getDepartmentLabel = dept => {
  return departments.value.find(d => d.value === dept)?.label || dept
}

// Get department class
const getDepartmentClass = dept => {
  const classes = {
    front_office: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    housekeeping: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    management: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    accounting: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    sales: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    food_beverage: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    maintenance: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
  return classes[dept] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
}

// Get role label
const getRoleLabel = role => {
  return roles.value.find(r => r.value === role)?.label || role
}

// Get user department (flat field)
const getUserDepartment = user => {
  return user.pmsDepartment || ''
}

// Get user role (flat field)
const getUserRole = user => {
  return user.pmsRole || ''
}

// Format date
const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Open edit modal
const openEditModal = user => {
  selectedUser.value = user
  showEditModal.value = true
}

// Open reset password modal
const openResetPasswordModal = user => {
  selectedUser.value = user
  showResetPasswordModal.value = true
}

// Toggle user status
const toggleUserStatus = async user => {
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    await adminUserService.update(user._id, { status: newStatus })
    toast.success(
      user.status === 'active'
        ? t('settings.users.success.userDeactivated')
        : t('settings.users.success.userActivated')
    )
    fetchUsers()
  } catch (error) {
    pmsLogger.error('Failed to toggle status:', error)
    toast.error(t('settings.users.errors.statusChangeError'))
  }
}

// Confirm delete
const confirmDelete = user => {
  selectedUser.value = user
  showDeleteModal.value = true
}

// Delete user
const deleteUser = async () => {
  if (!selectedUser.value) return
  deleting.value = true
  try {
    await adminUserService.remove(selectedUser.value._id)
    toast.success(t('settings.users.success.userDeleted'))
    showDeleteModal.value = false
    fetchUsers()
  } catch (error) {
    pmsLogger.error('Failed to delete user:', error)
    toast.error(t('settings.users.errors.deleteError'))
  } finally {
    deleting.value = false
  }
}

// Event handlers
const onUserCreated = () => {
  showAddModal.value = false
  fetchUsers()
}

const onUserUpdated = () => {
  showEditModal.value = false
  fetchUsers()
}

const onPasswordReset = () => {
  showResetPasswordModal.value = false
}

// On mount
onMounted(async () => {
  if (canAccess.value) {
    await fetchHotels()
    fetchUsers()
  }
})

// Reload when hotel changes
watch(
  () => pmsStore.hotelId,
  () => {
    if (canAccess.value) {
      fetchHotels()
      fetchUsers()
    }
  }
)
</script>
