<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('settings.agencies.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.agencies.description') }}
        </p>
      </div>
      <button
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        @click="showCreateModal = true"
      >
        <span class="material-icons text-sm">add</span>
        {{ $t('settings.agencies.addAgency') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-4xl text-indigo-600">refresh</span>
    </div>

    <!-- Agency List -->
    <div v-else class="space-y-3">
      <div
        v-for="agency in agencies"
        :key="agency._id"
        class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600"
      >
        <div
          class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0"
        >
          <span class="material-icons text-indigo-600 dark:text-indigo-400 text-xl">business</span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="font-semibold text-gray-900 dark:text-white truncate">
              {{ agency.companyName }}
            </h4>
            <span
              class="px-2 py-0.5 text-xs font-medium rounded-full"
              :class="
                agency.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-600 dark:text-slate-400'
              "
            >
              {{ agency.status === 'active' ? $t('common.active') : $t('common.inactive') }}
            </span>
          </div>
          <div class="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-slate-400">
            <span v-if="agency.email" class="flex items-center gap-1 truncate">
              <span class="material-icons text-xs">email</span>
              {{ agency.email }}
            </span>
            <span v-if="agency.phone" class="flex items-center gap-1">
              <span class="material-icons text-xs">phone</span>
              {{ agency.phone }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            @click="editAgency(agency)"
          >
            <span class="material-icons text-lg">edit</span>
          </button>
          <button
            class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            @click="confirmDelete(agency)"
          >
            <span class="material-icons text-lg">delete</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="agencies.length === 0" class="text-center py-12">
        <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">business</span>
        <h4 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          {{ $t('settings.agencies.noAgencies') }}
        </h4>
        <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
          {{ $t('settings.agencies.noAgenciesDesc') }}
        </p>
        <button
          class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          @click="showCreateModal = true"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('settings.agencies.addFirst') }}
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal || showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      >
        <div
          class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{
                showEditModal
                  ? $t('settings.agencies.editAgency')
                  : $t('settings.agencies.newAgency')
              }}
            </h3>
            <button
              class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              @click="closeModals"
            >
              <span class="material-icons text-gray-500">close</span>
            </button>
          </div>

          <form class="p-6 space-y-4" @submit.prevent="saveAgency">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('settings.agencies.companyName') }} *
              </label>
              <input
                v-model="form.companyName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('settings.agencies.tradeName') }}
              </label>
              <input
                v-model="form.tradeName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('common.email') }}
              </label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('common.phone') }}
              </label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('common.status') }}
              </label>
              <select
                v-model="form.status"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">{{ $t('common.active') }}</option>
                <option value="inactive">{{ $t('common.inactive') }}</option>
              </select>
            </div>

            <div
              v-if="formError"
              class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                @click="closeModals"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                {{ showEditModal ? $t('common.save') : $t('common.create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      >
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div class="text-center">
            <div
              class="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-red-600 dark:text-red-400">delete</span>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t('settings.agencies.deleteTitle') }}
            </h3>
            <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
              {{ $t('settings.agencies.deleteConfirm', { name: agencyToDelete?.companyName }) }}
            </p>
          </div>
          <div class="flex items-center gap-3 mt-6">
            <button
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              @click="showDeleteModal = false"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              :disabled="deleting"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              @click="deleteAgencyConfirm"
            >
              <span v-if="deleting" class="material-icons animate-spin text-sm">refresh</span>
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import apiClient from '@/services/api'

const { t } = useI18n()
const toast = useToast()

// PMS-specific agency API (bypasses requireAdmin, uses PMS auth)
const agencyApi = {
  getAgencies: params => apiClient.get('/pms/settings/agencies', { params }).then(r => r.data),
  getAgency: id => apiClient.get(`/pms/settings/agencies/${id}`).then(r => r.data),
  createAgency: data => apiClient.post('/pms/settings/agencies', data).then(r => r.data),
  updateAgency: (id, data) => apiClient.put(`/pms/settings/agencies/${id}`, data).then(r => r.data),
  deleteAgency: id => apiClient.delete(`/pms/settings/agencies/${id}`).then(r => r.data)
}

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const agencies = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingAgency = ref(null)
const agencyToDelete = ref(null)
const formError = ref('')

const form = ref({
  companyName: '',
  tradeName: '',
  email: '',
  phone: '',
  status: 'active'
})

const fetchAgencies = async () => {
  loading.value = true
  try {
    const response = await agencyApi.getAgencies({ limit: 500 })
    agencies.value = response.data?.agencies || response.data || []
  } catch (error) {
    console.error('Failed to fetch agencies:', error)
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

const editAgency = agency => {
  editingAgency.value = agency
  form.value = {
    companyName: agency.companyName || '',
    tradeName: agency.tradeName || '',
    email: agency.email || '',
    phone: agency.phone || '',
    status: agency.status || 'active'
  }
  showEditModal.value = true
}

const confirmDelete = agency => {
  agencyToDelete.value = agency
  showDeleteModal.value = true
}

const saveAgency = async () => {
  if (!form.value.companyName) return

  saving.value = true
  formError.value = ''

  try {
    if (showEditModal.value && editingAgency.value) {
      await agencyApi.updateAgency(editingAgency.value._id, form.value)
      toast.success(t('settings.agencies.updated'))
    } else {
      await agencyApi.createAgency(form.value)
      toast.success(t('settings.agencies.created'))
    }
    await fetchAgencies()
    closeModals()
  } catch (error) {
    formError.value = error.response?.data?.message || t('common.error')
  } finally {
    saving.value = false
  }
}

const deleteAgencyConfirm = async () => {
  if (!agencyToDelete.value) return

  deleting.value = true
  try {
    await agencyApi.deleteAgency(agencyToDelete.value._id)
    toast.success(t('settings.agencies.deleted'))
    await fetchAgencies()
    showDeleteModal.value = false
    agencyToDelete.value = null
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.error'))
  } finally {
    deleting.value = false
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingAgency.value = null
  formError.value = ''
  form.value = { companyName: '', tradeName: '', email: '', phone: '', status: 'active' }
}

onMounted(fetchAgencies)
</script>
