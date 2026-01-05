<template>
  <div class="space-y-6">
    <!-- No Partner Selected Warning (only for platform admin) -->
    <div
      v-if="!canAccess"
      class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
    >
      <div class="flex items-center gap-3">
        <span class="material-icons text-amber-600 dark:text-amber-400">warning</span>
        <div>
          <p class="font-medium text-amber-800 dark:text-amber-200">Partner Secimi Gerekli</p>
          <p class="text-sm text-amber-600 dark:text-amber-400">
            PMS kullanicilarini yonetmek icin lutfen ust menuden bir partner secin.
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
        Yeni Kullanici
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
          <p class="font-medium text-blue-800 dark:text-blue-200">Otel Bulunamadi</p>
          <p class="text-sm text-blue-600 dark:text-blue-400">
            Bu partner'a ait otel yok. Once bir otel ekleyin.
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
            <p class="text-xs text-gray-500 dark:text-slate-400">Toplam Kullanici</p>
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
            <p class="text-xs text-gray-500 dark:text-slate-400">Aktif</p>
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
            <p class="text-xs text-gray-500 dark:text-slate-400">Pasif</p>
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
            <p class="text-xs text-gray-500 dark:text-slate-400">Admin</p>
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
              placeholder="Ad, soyad, kullanici adi..."
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
            <option value="">Tum Departmanlar</option>
            <option v-for="dept in departments" :key="dept.value" :value="dept.value">
              {{ dept.label }}
            </option>
          </select>
        </div>
        <!-- Status Filter -->
        <div class="w-32">
          <select
            v-model="filters.isActive"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            @change="fetchUsers"
          >
            <option value="">Tum Durum</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </div>
        <!-- Hotel Filter -->
        <div class="w-48">
          <select
            v-model="filters.hotelId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            @change="fetchUsers"
          >
            <option value="">Tum Oteller</option>
            <option v-for="hotel in hotels" :key="hotel._id" :value="hotel._id">
              {{ hotel.name }}
            </option>
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
      card-title-key="firstName"
      empty-icon="person_off"
      empty-text="Kullanici bulunamadi"
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
              {{ row.firstName }} {{ row.lastName }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">@{{ row.username }}</p>
          </div>
        </div>
      </template>

      <template #cell-department="{ row }">
        <span
          class="px-2 py-1 text-xs rounded-full"
          :class="getDepartmentClass(row.department)"
        >
          {{ getDepartmentLabel(row.department) }}
        </span>
        <p v-if="row.position" class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {{ row.position }}
        </p>
      </template>

      <template #cell-assignedHotels="{ row }">
        <div v-if="row.assignedHotels?.length > 0" class="space-y-1">
          <div
            v-for="(assignment, i) in row.assignedHotels.slice(0, 2)"
            :key="i"
            class="flex items-center gap-2"
          >
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              assignment.hotel?.name || 'Otel'
            }}</span>
            <span
              class="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
            >
              {{ getRoleLabel(assignment.role) }}
            </span>
          </div>
          <p v-if="row.assignedHotels.length > 2" class="text-xs text-gray-400">
            +{{ row.assignedHotels.length - 2 }} daha
          </p>
        </div>
        <span v-else class="text-sm text-gray-400">Atanmamis</span>
      </template>

      <template #cell-lastLogin="{ row }">
        <p v-if="row.lastLogin" class="text-sm text-gray-700 dark:text-gray-300">
          {{ formatDate(row.lastLogin) }}
        </p>
        <span v-else class="text-sm text-gray-400">-</span>
      </template>

      <template #cell-isActive="{ row }">
        <span
          class="px-2 py-1 text-xs rounded-full"
          :class="
            row.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          "
        >
          {{ row.isActive ? 'Aktif' : 'Pasif' }}
        </span>
      </template>

      <template #row-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button
            class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
            title="Duzenle"
            @click="openEditModal(row)"
          >
            <span class="material-icons text-lg">edit</span>
          </button>
          <button
            class="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg"
            title="Otel Ata"
            @click="openAssignHotelModal(row)"
          >
            <span class="material-icons text-lg">add_business</span>
          </button>
          <button
            class="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg"
            title="Sifre Sifirla"
            @click="openResetPasswordModal(row)"
          >
            <span class="material-icons text-lg">lock_reset</span>
          </button>
          <button
            class="p-1.5 rounded-lg"
            :class="
              row.isActive
                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
            "
            :title="row.isActive ? 'Pasif Yap' : 'Aktif Yap'"
            @click="toggleUserStatus(row)"
          >
            <span class="material-icons text-lg">{{
              row.isActive ? 'block' : 'check_circle'
            }}</span>
          </button>
          <button
            class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
            title="Sil"
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
          Yeni Kullanici Ekle
        </button>
      </template>
    </DataTable>

    <!-- Add User Modal -->
    <AddUserModal
      v-model="showAddModal"
      :hotels="hotels"
      :roles="roles"
      :departments="departments"
      :partner-id="effectivePartnerId"
      @created="onUserCreated"
    />

    <!-- Edit User Modal -->
    <EditUserModal
      v-model="showEditModal"
      :user="selectedUser"
      :departments="departments"
      @updated="onUserUpdated"
    />

    <!-- Assign Hotel Modal -->
    <AssignHotelModal
      v-model="showAssignHotelModal"
      :user="selectedUser"
      :hotels="hotels"
      :roles="roles"
      @assigned="onHotelAssigned"
    />

    <!-- Reset Password Modal -->
    <ResetPasswordModal
      v-model="showResetPasswordModal"
      :user="selectedUser"
      @reset="onPasswordReset"
    />

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" title="Kullaniciyi Sil" size="sm">
      <p class="text-gray-600 dark:text-gray-400">
        <strong>{{ selectedUser?.firstName }} {{ selectedUser?.lastName }}</strong> kullanicisini
        silmek istediginize emin misiniz?
      </p>
      <p class="text-sm text-red-500 mt-2">Bu islem geri alinamaz.</p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
            @click="showDeleteModal = false"
          >
            Iptal
          </button>
          <button
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            @click="deleteUser"
          >
            {{ deleting ? 'Siliniyor...' : 'Sil' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import pmsAdminUserService from '@/services/pms/pmsAdminUserService'
import hotelService from '@/services/hotelService'
import DataTable from '@/components/ui/data/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import AddUserModal from '@/modules/settings/components/AddUserModal.vue'
import EditUserModal from '@/modules/settings/components/EditUserModal.vue'
import AssignHotelModal from '@/modules/settings/components/AssignHotelModal.vue'
import ResetPasswordModal from '@/modules/settings/components/ResetPasswordModal.vue'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { usePmsContextInjection } from '@/composables/usePmsContext'

const toast = useToast()

// PMS context - for PMS users
const pmsContext = usePmsContextInjection()

// Partner context - for platform admin
const { hasPartner, currentPartnerId } = usePartnerContext({
  onPartnerChange: partner => {
    if (partner) {
      fetchHotels()
      fetchUsers()
    }
  },
  immediate: false
})

// Check if user can access this page (either PMS user or platform admin with partner)
const canAccess = computed(() => {
  // PMS user mode - always has access
  if (pmsContext?.isPmsUser?.value) return true
  // Platform admin - needs partner selected
  return hasPartner.value
})

// Get partnerId from either context
const effectivePartnerId = computed(() => {
  // PMS user - get from current hotel
  if (pmsContext?.isPmsUser?.value && pmsContext?.currentHotel?.value) {
    return pmsContext.currentHotel.value.partner || pmsContext.currentHotel.value.partnerId
  }
  // Platform admin - get from partner context
  return currentPartnerId.value
})

// State
const loading = ref(false)
const users = ref([])
const selectedUser = ref(null)
const deleting = ref(false)

// Modals
const showAddModal = ref(false)
const showEditModal = ref(false)
const showAssignHotelModal = ref(false)
const showResetPasswordModal = ref(false)
const showDeleteModal = ref(false)

// Filters
const filters = ref({
  search: '',
  department: '',
  isActive: '',
  hotelId: ''
})

// Data
const roles = pmsAdminUserService.getRoles()
const departments = pmsAdminUserService.getDepartments()
const hotels = ref([])

// Columns
const columns = computed(() => [
  { key: 'user', label: 'Kullanici', sortable: false },
  { key: 'department', label: 'Departman', sortable: false },
  { key: 'assignedHotels', label: 'Atanan Oteller', sortable: false },
  { key: 'lastLogin', label: 'Son Giris', sortable: false },
  { key: 'isActive', label: 'Durum', sortable: false }
])

// Fetch hotels
const fetchHotels = async () => {
  // If we're inside a specific hotel's PMS (hotelId exists), use only that hotel
  // This applies to both PMS users AND platform admins viewing a hotel's PMS
  const currentHotel = pmsContext?.currentHotel?.value
  const hotelId = pmsContext?.hotelId?.value

  if (hotelId && currentHotel) {
    // We're inside a specific hotel's PMS - use only that hotel
    hotels.value = [currentHotel]
    return
  }

  // Platform admin mode without hotel context - check if partner is available
  if (!hasPartner.value) {
    hotels.value = []
    return
  }

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
    console.error('Failed to fetch hotels:', error.response?.data || error.message)
    hotels.value = []
    // Only show toast if it's not a partner-required error
    if (error.response?.data?.message !== 'PARTNER_REQUIRED') {
      toast.error('Oteller yuklenemedi')
    }
  }
}

// Stats
const stats = computed(() => {
  const total = users.value.length
  const active = users.value.filter(u => u.isActive).length
  const inactive = total - active
  const admins = users.value.filter(u => u.assignedHotels?.some(h => h.role === 'pms_admin')).length
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
    const params = {}

    // Partner ID zorunlu - yoksa kullanıcıları çekme
    if (effectivePartnerId.value) {
      params.partnerId = effectivePartnerId.value
    } else {
      users.value = []
      loading.value = false
      return
    }

    if (filters.value.department) params.department = filters.value.department
    if (filters.value.isActive) params.isActive = filters.value.isActive
    if (filters.value.hotelId) params.hotelId = filters.value.hotelId

    const response = await pmsAdminUserService.getAll(params)
    let data = response.data || []

    // Client-side search filter
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      data = data.filter(
        u =>
          u.firstName?.toLowerCase().includes(search) ||
          u.lastName?.toLowerCase().includes(search) ||
          u.username?.toLowerCase().includes(search)
      )
    }

    users.value = data
  } catch (error) {
    console.error('Failed to fetch users:', error)
    toast.error('Kullanicilar yuklenemedi')
  } finally {
    loading.value = false
  }
}

// Reset filters
const resetFilters = () => {
  filters.value = { search: '', department: '', isActive: '', hotelId: '' }
  fetchUsers()
}

// Get user initials
const getUserInitials = user => {
  return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
}

// Get department label
const getDepartmentLabel = dept => {
  return departments.find(d => d.value === dept)?.label || dept
}

// Get department class
const getDepartmentClass = dept => {
  const classes = {
    front_office: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    housekeeping: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    management: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    accounting: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    reservation: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    guest_relations: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
  }
  return classes[dept] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
}

// Get role label
const getRoleLabel = role => {
  return roles.find(r => r.value === role)?.label || role
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

// Open assign hotel modal
const openAssignHotelModal = user => {
  selectedUser.value = user
  showAssignHotelModal.value = true
}

// Open reset password modal
const openResetPasswordModal = user => {
  selectedUser.value = user
  showResetPasswordModal.value = true
}

// Toggle user status
const toggleUserStatus = async user => {
  try {
    await pmsAdminUserService.update(user._id, { isActive: !user.isActive })
    toast.success(user.isActive ? 'Kullanici pasif yapildi' : 'Kullanici aktif yapildi')
    fetchUsers()
  } catch (error) {
    console.error('Failed to toggle status:', error)
    toast.error('Durum degistirilemedi')
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
    await pmsAdminUserService.remove(selectedUser.value._id)
    toast.success('Kullanici silindi')
    showDeleteModal.value = false
    fetchUsers()
  } catch (error) {
    console.error('Failed to delete user:', error)
    toast.error('Kullanici silinemedi')
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

const onHotelAssigned = () => {
  showAssignHotelModal.value = false
  fetchUsers()
}

const onPasswordReset = () => {
  showResetPasswordModal.value = false
}

// On mount
onMounted(async () => {
  // PMS user mode - always fetch
  if (pmsContext?.isPmsUser?.value) {
    await fetchHotels()
    fetchUsers()
    return
  }
  // Platform admin - only fetch if partner is available
  if (hasPartner.value) {
    await fetchHotels()
    fetchUsers()
  }
})
</script>
