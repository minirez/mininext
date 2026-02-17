<template>
  <div>
    <ModuleNavigation :items="navItems" color="purple">
      <template #actions>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 transition-colors"
          @click="openCreateModal"
        >
          <span class="material-icons text-lg">add</span>
          {{ $t('subscriptionPackages.create') }}
        </button>
      </template>
    </ModuleNavigation>

    <div class="p-6 space-y-6">
      <!-- Packages Grid -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>

      <div v-else-if="!packages.length" class="text-center py-16 text-gray-500 dark:text-slate-400">
        {{ $t('subscriptionPackages.noPackages') }}
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="pkg in packages"
          :key="pkg._id"
          class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
        >
          <!-- Header -->
          <div class="p-5 border-b border-gray-100 dark:border-slate-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ pkg.name?.tr || pkg.name?.en }}
              </h3>
              <span
                :class="
                  pkg.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                "
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              >
                {{ pkg.isActive ? $t('common.active') : $t('common.inactive') }}
              </span>
            </div>
            <p
              v-if="pkg.description?.tr || pkg.description?.en"
              class="text-xs text-gray-500 dark:text-slate-400 mt-1"
            >
              {{ pkg.description?.tr || pkg.description?.en }}
            </p>
          </div>

          <!-- Price -->
          <div class="p-5 space-y-3">
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-bold text-purple-600 dark:text-purple-400"
                >€{{ effectivePrice(pkg).toFixed(2) }}</span
              >
              <span class="text-sm text-gray-500 dark:text-slate-400"
                >/ {{ $t(`subscriptionPackages.periods.${pkg.billingPeriod || 'yearly'}`) }}</span
              >
            </div>

            <div
              v-if="pkg.overridePrice != null"
              class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"
            >
              <span class="material-icons text-sm">info</span>
              {{
                $t('subscriptionPackages.priceOverridden', {
                  calculated: pkg.calculatedPrice?.toFixed(2)
                })
              }}
            </div>

            <!-- Services list -->
            <div class="space-y-1.5 mt-3">
              <p class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">
                {{ $t('subscriptionPackages.includedServices') }}
              </p>
              <div
                v-for="svc in pkg.services"
                :key="svc._id"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-700 dark:text-slate-300">{{
                  svc.name?.tr || svc.name?.en
                }}</span>
                <span class="text-gray-500 dark:text-slate-400">€{{ svc.price?.toFixed(2) }}</span>
              </div>
              <div
                v-if="!pkg.services?.length"
                class="text-xs text-gray-400 dark:text-slate-500 italic"
              >
                {{ $t('subscriptionPackages.noServicesYet') }}
              </div>
            </div>

            <!-- Trial days -->
            <div class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-2">
              <span class="material-icons text-sm">timer</span>
              {{ $t('subscriptionPackages.trialDays', { days: pkg.trialDays ?? 15 }) }}
            </div>
          </div>

          <!-- Actions -->
          <div
            class="px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2"
          >
            <button
              class="text-purple-600 hover:text-purple-800 dark:text-purple-400 text-sm font-medium"
              @click="openEditModal(pkg)"
            >
              {{ $t('common.edit') }}
            </button>
            <button
              class="text-red-600 hover:text-red-800 dark:text-red-400 text-sm font-medium"
              @click="confirmDelete(pkg)"
            >
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>
        <div
          class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-2xl p-6"
        >
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ editingPkg ? $t('subscriptionPackages.edit') : $t('subscriptionPackages.create') }}
            </h2>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              @click="closeModal"
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <form @submit.prevent="handleSave" class="space-y-5">
            <!-- Name (MultiLang) -->
            <MultiLangInput
              v-model="form.name"
              :label="$t('subscriptionPackages.name')"
              :placeholder="$t('subscriptionPackages.namePlaceholder')"
              show-translate
            />

            <!-- Description (MultiLang) -->
            <MultiLangInput
              v-model="form.description"
              :label="$t('subscriptionPackages.descriptionLabel')"
              type="textarea"
              :rows="3"
              show-translate
            />

            <!-- Services Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{{
                $t('subscriptionPackages.selectServices')
              }}</label>
              <div
                class="border border-gray-200 dark:border-slate-600 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto"
              >
                <label
                  v-for="svc in allServices"
                  :key="svc._id"
                  class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer"
                >
                  <div class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      :value="svc._id"
                      v-model="form.services"
                      class="rounded border-gray-300 dark:border-slate-500 text-purple-600 focus:ring-purple-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-slate-300">{{
                      svc.name?.tr || svc.name?.en
                    }}</span>
                  </div>
                  <span class="text-sm text-gray-500 dark:text-slate-400 font-medium"
                    >€{{ svc.price?.toFixed(2) }}</span
                  >
                </label>
                <div
                  v-if="!allServices.length"
                  class="text-sm text-gray-400 dark:text-slate-500 text-center py-2"
                >
                  {{ $t('subscriptionPackages.noServicesAvailable') }}
                </div>
              </div>

              <!-- Auto-summed price -->
              <div class="mt-3 flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-slate-400"
                  >{{ $t('subscriptionPackages.calculatedTotal') }}:</span
                >
                <span class="font-bold text-gray-900 dark:text-white"
                  >€{{ calculatedSum.toFixed(2) }}</span
                >
              </div>
            </div>

            <!-- Override Price Toggle -->
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <input
                  v-model="useOverride"
                  type="checkbox"
                  class="rounded border-gray-300 dark:border-slate-500 text-purple-600 focus:ring-purple-500"
                />
                {{ $t('subscriptionPackages.overridePrice') }}
              </label>
              <div v-if="useOverride" class="relative">
                <span
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-slate-400 text-sm font-medium"
                  >€</span
                >
                <input
                  v-model.number="form.overridePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 pl-8 pr-3 py-2 text-sm"
                />
              </div>
            </div>

            <!-- Billing Period -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                $t('subscriptionPackages.billingPeriod')
              }}</label>
              <select
                v-model="form.billingPeriod"
                class="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="yearly">{{ $t('subscriptionPackages.periods.yearly') }}</option>
                <option value="monthly">{{ $t('subscriptionPackages.periods.monthly') }}</option>
              </select>
            </div>

            <!-- Trial Days -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                $t('subscriptionPackages.trialDaysLabel')
              }}</label>
              <input
                v-model.number="form.trialDays"
                type="number"
                min="0"
                class="block w-24 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
              />
            </div>

            <!-- Sort Order + Active -->
            <div class="flex items-center gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{{
                  $t('subscriptionPackages.sortOrder')
                }}</label>
                <input
                  v-model.number="form.sortOrder"
                  type="number"
                  min="0"
                  class="block w-24 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                />
              </div>
              <div v-if="editingPkg" class="pt-5">
                <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                  <input
                    v-model="form.isActive"
                    type="checkbox"
                    class="rounded border-gray-300 dark:border-slate-500 text-purple-600 focus:ring-purple-500"
                  />
                  {{ $t('common.active') }}
                </label>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                @click="closeModal"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {{ saving ? $t('common.saving') : $t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      type="danger"
      :title="$t('common.delete')"
      :message="
        $t('subscriptionPackages.confirmDelete', {
          name: deletingPkg?.name?.tr || deletingPkg?.name?.en || ''
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
import subscriptionPackageService from '@/services/subscriptionPackageService'
import subscriptionServiceService from '@/services/subscriptionServiceService'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

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

const packages = ref([])
const allServices = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingPkg = ref(null)
const saving = ref(false)
const useOverride = ref(false)

const defaultForm = () => ({
  name: { tr: '', en: '' },
  description: { tr: '', en: '' },
  services: [],
  overridePrice: null,
  billingPeriod: 'yearly',
  trialDays: 15,
  sortOrder: 0,
  isActive: true
})

const form = ref(defaultForm())

const calculatedSum = computed(() => {
  if (!form.value.services?.length || !allServices.value.length) return 0
  return allServices.value
    .filter(s => form.value.services.includes(s._id))
    .reduce((sum, s) => sum + (s.price || 0), 0)
})

const effectivePrice = pkg => {
  return pkg.overridePrice != null ? pkg.overridePrice : pkg.calculatedPrice || 0
}

const loadData = async () => {
  loading.value = true
  try {
    const [pkgRes, svcRes] = await Promise.all([
      subscriptionPackageService.getPackages(),
      subscriptionServiceService.getServices()
    ])
    packages.value = pkgRes.data || []
    allServices.value = svcRes.data || []
  } catch {
    toast.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  form.value = defaultForm()
  useOverride.value = false
  editingPkg.value = null
  showModal.value = true
}

const openEditModal = pkg => {
  form.value = {
    name: { tr: pkg.name?.tr || '', en: pkg.name?.en || '' },
    description: { tr: pkg.description?.tr || '', en: pkg.description?.en || '' },
    services: (pkg.services || []).map(s => s._id || s),
    overridePrice: pkg.overridePrice,
    billingPeriod: pkg.billingPeriod || 'yearly',
    trialDays: pkg.trialDays ?? 15,
    sortOrder: pkg.sortOrder || 0,
    isActive: pkg.isActive !== false
  }
  useOverride.value = pkg.overridePrice != null
  editingPkg.value = pkg
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingPkg.value = null
}

const handleSave = async () => {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      overridePrice: useOverride.value ? form.value.overridePrice : null
    }

    if (editingPkg.value) {
      await subscriptionPackageService.updatePackage(editingPkg.value._id, payload)
      toast.success(t('subscriptionPackages.updated'))
    } else {
      await subscriptionPackageService.createPackage(payload)
      toast.success(t('subscriptionPackages.created'))
    }
    closeModal()
    await loadData()
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    saving.value = false
  }
}

const showDeleteDialog = ref(false)
const deletingPkg = ref(null)

const confirmDelete = pkg => {
  deletingPkg.value = pkg
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deletingPkg.value) return
  try {
    await subscriptionPackageService.deletePackage(deletingPkg.value._id)
    toast.success(t('subscriptionPackages.deleted'))
    await loadData()
  } catch (err) {
    toast.error(err.response?.data?.error || t('common.error'))
  } finally {
    showDeleteDialog.value = false
    deletingPkg.value = null
  }
}

onMounted(loadData)
</script>
