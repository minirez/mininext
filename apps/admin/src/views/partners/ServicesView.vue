<template>
  <div>
    <ModuleNavigation :items="navItems" color="purple">
      <template #actions>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 transition-colors"
          @click="openCreateModal"
        >
          <span class="material-icons text-lg">add</span>
          {{ $t('subscriptionServices.create') }}
        </button>
      </template>
    </ModuleNavigation>

    <div class="p-6 space-y-6">
      <!-- Services Table -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('subscriptionServices.name') }}
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('subscriptionServices.price') }}
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('subscriptionServices.billingPeriod') }}
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('subscriptionServices.targetPartnerType') }}
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('common.status.label') }}
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {{ $t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            <tr
              v-for="svc in services"
              :key="svc._id"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ svc.name?.tr || svc.name?.en }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                <span
                  v-if="svc.price === 0"
                  class="inline-flex items-center gap-1 text-green-600 dark:text-green-400"
                >
                  <span class="material-icons text-sm">card_giftcard</span>
                  {{ $t('subscriptionServices.free') }}
                </span>
                <span v-else class="text-gray-900 dark:text-white">
                  €{{ svc.price?.toFixed(2) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                {{ $t(`subscriptionServices.periods.${svc.billingPeriod || 'yearly'}`) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="
                    svc.targetPartnerType === 'hotel'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : svc.targetPartnerType === 'agency'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                  "
                >
                  {{ $t(`subscriptionServices.partnerTypes.${svc.targetPartnerType || 'all'}`) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="
                    svc.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                  "
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  {{ svc.isActive ? $t('common.active') : $t('common.inactive') }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                <button
                  class="text-purple-600 hover:text-purple-800 dark:text-purple-400 mr-3"
                  @click="openEditModal(svc)"
                >
                  <span class="material-icons text-lg">edit</span>
                </button>
                <button
                  class="text-red-600 hover:text-red-800 dark:text-red-400"
                  @click="confirmDelete(svc)"
                >
                  <span class="material-icons text-lg">delete</span>
                </button>
              </td>
            </tr>
            <tr v-if="!services.length && !loading">
              <td
                colspan="6"
                class="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400"
              >
                {{ $t('subscriptionServices.noServices') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Modal
      v-model="showModal"
      :title="editing ? $t('subscriptionServices.edit') : $t('subscriptionServices.create')"
      size="lg"
    >
      <form :id="formId" @submit.prevent="handleSave" class="space-y-5">
        <!-- Name (MultiLang) -->
        <MultiLangInput
          v-model="form.name"
          :label="$t('subscriptionServices.name')"
          :placeholder="$t('subscriptionServices.namePlaceholder')"
          show-translate
        />

        <!-- Description (MultiLang) -->
        <MultiLangInput
          v-model="form.description"
          :label="$t('subscriptionServices.descriptionLabel')"
          type="textarea"
          :rows="3"
          show-translate
        />

        <!-- Price (EUR only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('subscriptionServices.price') }} (EUR)
          </label>
          <div class="relative">
            <span
              class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-slate-400 text-sm font-medium pointer-events-none"
              >€</span
            >
            <input
              v-model.number="form.price"
              type="number"
              step="0.01"
              min="0"
              class="form-input pl-8"
              required
            />
          </div>
        </div>

        <!-- Billing Period -->
        <Dropdown
          v-model="form.billingPeriod"
          :label="$t('subscriptionServices.billingPeriod')"
          :options="billingPeriodOptions"
        />

        <!-- Target Partner Type -->
        <Dropdown
          v-model="form.targetPartnerType"
          :label="$t('subscriptionServices.targetPartnerType')"
          :options="partnerTypeOptions"
        />

        <!-- Sort Order -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('subscriptionServices.sortOrder') }}
          </label>
          <input v-model.number="form.sortOrder" type="number" min="0" class="form-input w-28" />
        </div>

        <!-- Active toggle -->
        <Toggle
          v-if="editing"
          v-model="form.isActive"
          :label="$t('common.active')"
          color="purple"
          checked-icon="check"
        />
      </form>

      <template #footer>
        <button class="btn-secondary" @click="closeModal">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="submit"
          :form="formId"
          :disabled="saving"
          class="btn-primary bg-purple-600 hover:bg-purple-700"
        >
          <span v-if="saving" class="material-icons text-sm animate-spin mr-1.5">refresh</span>
          {{ saving ? $t('common.saving') : $t('common.save') }}
        </button>
      </template>
    </Modal>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      type="danger"
      :title="$t('common.delete')"
      :message="
        $t('subscriptionServices.confirmDelete', {
          name: deletingService?.name?.tr || deletingService?.name?.en || ''
        })
      "
      :confirm-text="$t('common.delete')"
      :cancel-text="$t('common.cancel')"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import subscriptionServiceService from '@/services/subscriptionServiceService'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import Modal from '@/components/common/Modal.vue'
import Dropdown from '@/components/ui/form/Dropdown.vue'
import Toggle from '@/components/ui/form/Toggle.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()
const formId = 'service-form'

const navItems = computed(() => [
  { name: 'partners', to: '/partners', icon: 'business', label: t('partners.title'), exact: true },
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

const billingPeriodOptions = computed(() => [
  { value: 'yearly', label: t('subscriptionServices.periods.yearly') },
  { value: 'monthly', label: t('subscriptionServices.periods.monthly') },
  { value: 'one_time', label: t('subscriptionServices.periods.one_time') }
])

const partnerTypeOptions = computed(() => [
  { value: 'all', label: t('subscriptionServices.partnerTypes.all') },
  { value: 'hotel', label: t('subscriptionServices.partnerTypes.hotel') },
  { value: 'agency', label: t('subscriptionServices.partnerTypes.agency') }
])

const services = ref([])
const loading = ref(false)
const showModal = ref(false)
const editing = ref(false)
const saving = ref(false)
const editingId = ref(null)

const defaultForm = () => ({
  name: { tr: '', en: '' },
  description: { tr: '', en: '' },
  price: 0,
  billingPeriod: 'yearly',
  targetPartnerType: 'all',
  sortOrder: 0,
  isActive: true
})

const form = ref(defaultForm())

const loadServices = async () => {
  loading.value = true
  try {
    const res = await subscriptionServiceService.getServices()
    services.value = res.data || []
  } catch {
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  form.value = defaultForm()
  editing.value = false
  editingId.value = null
  showModal.value = true
}

const openEditModal = svc => {
  form.value = {
    name: { tr: svc.name?.tr || '', en: svc.name?.en || '' },
    description: { tr: svc.description?.tr || '', en: svc.description?.en || '' },
    price: svc.price,
    billingPeriod: svc.billingPeriod || 'yearly',
    targetPartnerType: svc.targetPartnerType || 'all',
    sortOrder: svc.sortOrder || 0,
    isActive: svc.isActive !== false
  }
  editing.value = true
  editingId.value = svc._id
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saving.value = true
  try {
    if (editing.value) {
      await subscriptionServiceService.updateService(editingId.value, form.value)
      toast.success(t('subscriptionServices.updated'))
    } else {
      await subscriptionServiceService.createService(form.value)
      toast.success(t('subscriptionServices.created'))
    }
    closeModal()
    await loadServices()
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    saving.value = false
  }
}

const showDeleteDialog = ref(false)
const deletingService = ref(null)

const confirmDelete = svc => {
  deletingService.value = svc
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deletingService.value) return
  try {
    await subscriptionServiceService.deleteService(deletingService.value._id)
    toast.success(t('subscriptionServices.deleted'))
    await loadServices()
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    showDeleteDialog.value = false
    deletingService.value = null
  }
}

onMounted(loadServices)
</script>
