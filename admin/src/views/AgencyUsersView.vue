<template>
  <div>
    <!-- Header with Back Button -->
    <div class="mb-6">
      <button
        @click="router.push('/agencies')"
        class="flex items-center text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {{ $t('common.back') }}
      </button>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-6 border-b border-gray-200 dark:border-slate-700">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
              {{ agency?.name }} - {{ $t('agencies.users') }}
            </h2>
            <p class="text-gray-600 dark:text-slate-400 mt-1">{{ $t('agencies.usersDescription') }}</p>
          </div>
          <button @click="openCreateModal" class="btn-primary flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {{ $t('agencies.addUser') }}
          </button>
        </div>
      </div>

      <div class="p-6">
        <DataTable
          :columns="columns"
          :data="users"
          :loading="loading"
        >
          <template #cell-status="{ value }">
            <span
              class="badge"
              :class="{
                'badge-success': value === 'active',
                'badge-danger': value === 'inactive'
              }"
            >
              {{ value === 'active' ? $t('common.active') : $t('common.inactive') }}
            </span>
          </template>

          <template #cell-role="{ value }">
            <span class="capitalize">{{ value }}</span>
          </template>

          <template #actions="{ item }">
            <div class="flex items-center justify-end gap-2">
              <button
                @click="openEditModal(item)"
                class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                :title="$t('common.edit')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="confirmDelete(item)"
                class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                :title="$t('common.delete')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
      :title="isEditing ? $t('agencies.editUser') : $t('agencies.addUser')"
      size="md"
      :close-on-overlay="false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="form-label">{{ $t('agencies.userName') }} *</label>
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            required
          />
        </div>

        <div>
          <label class="form-label">{{ $t('agencies.userEmail') }} *</label>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            required
          />
        </div>

        <div v-if="!isEditing">
          <label class="form-label">{{ $t('auth.password') }} *</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            required
            minlength="6"
          />
        </div>

        <div>
          <label class="form-label">{{ $t('agencies.userPhone') }}</label>
          <input
            v-model="form.phone"
            type="text"
            class="form-input"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">{{ $t('agencies.userRole') }}</label>
            <select v-model="form.role" class="form-input">
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label class="form-label">{{ $t('common.status.label') }}</label>
            <select v-model="form.status" class="form-input">
              <option value="active">{{ $t('common.active') }}</option>
              <option value="inactive">{{ $t('common.inactive') }}</option>
            </select>
          </div>
        </div>
      </form>

      <template #footer>
        <button
          @click="showModal = false"
          type="button"
          class="btn-secondary"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          @click="handleSubmit"
          type="submit"
          class="btn-primary"
          :disabled="submitting"
        >
          <span v-if="submitting" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ $t('common.loading') }}
          </span>
          <span v-else>{{ $t('common.save') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      :title="$t('agencies.deleteUser')"
      size="sm"
    >
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('agencies.deleteUserConfirm') }}
      </p>

      <template #footer>
        <button
          @click="showDeleteModal = false"
          type="button"
          class="btn-secondary"
        >
          {{ $t('common.no') }}
        </button>
        <button
          @click="handleDelete"
          type="button"
          class="btn-danger"
          :disabled="deleting"
        >
          <span v-if="deleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/common/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import agencyService from '@/services/agencyService'
import { useI18n } from 'vue-i18n'
import { usePartnerContext } from '@/composables/usePartnerContext'

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const agencyId = route.params.id
const agency = ref(null)
const users = ref([])
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const selectedUser = ref(null)

const form = ref({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'user',
  status: 'active'
})

const columns = [
  { key: 'name', label: t('agencies.userName') },
  { key: 'email', label: t('agencies.userEmail') },
  { key: 'role', label: t('agencies.userRole') },
  { key: 'status', label: t('common.status') }
]

const fetchAgencyAndUsers = async () => {
  loading.value = true
  try {
    const response = await agencyService.getAgencyUsers(agencyId)
    if (response.success) {
      agency.value = response.data.agency
      users.value = response.data.users || []
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to fetch users')
    router.push('/agencies')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    status: 'active'
  }
  showModal.value = true
}

const openEditModal = (user) => {
  isEditing.value = true
  selectedUser.value = user
  form.value = {
    name: user.name,
    email: user.email,
    password: '',
    phone: user.phone || '',
    role: user.role || 'user',
    status: user.status || 'active'
  }
  showModal.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEditing.value) {
      const updateData = { ...form.value }
      delete updateData.password
      const response = await agencyService.updateAgencyUser(agencyId, selectedUser.value._id, updateData)
      if (response.success) {
        toast.success(t('agencies.userUpdateSuccess'))
        await fetchAgencyAndUsers()
        showModal.value = false
      }
    } else {
      const response = await agencyService.createAgencyUser(agencyId, form.value)
      if (response.success) {
        toast.success(t('agencies.userCreateSuccess'))
        await fetchAgencyAndUsers()
        showModal.value = false
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (user) => {
  selectedUser.value = user
  showDeleteModal.value = true
}

const handleDelete = async () => {
  deleting.value = true
  try {
    const response = await agencyService.deleteAgencyUser(agencyId, selectedUser.value._id)
    if (response.success) {
      toast.success(t('agencies.userDeleteSuccess'))
      await fetchAgencyAndUsers()
      showDeleteModal.value = false
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

// React to partner changes - redirect to agencies when partner is switched
// (current agency may not belong to new partner)
let isInitialLoad = true
usePartnerContext({
  onPartnerChange: (partner) => {
    if (isInitialLoad) {
      isInitialLoad = false
      fetchAgencyAndUsers()
    } else if (partner) {
      // Partner changed, redirect to agencies list
      router.push('/agencies')
    }
  },
  immediate: true
})
</script>
