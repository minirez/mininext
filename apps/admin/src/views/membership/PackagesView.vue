<template>
  <div>
    <ModuleNavigation :items="navItems" color="purple" />

    <div class="p-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-blue-500">inventory_2</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('membership.packages.stats.total') }}
              </div>
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
              <span class="material-icons text-green-500">check_circle</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active }}</div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('membership.packages.stats.active') }}
              </div>
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
              <span class="material-icons text-purple-500">groups</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.partnersWithPackage }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('membership.packages.stats.partnersUsing') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <input
              v-model="filters.search"
              type="text"
              class="form-input w-full"
              :placeholder="$t('common.search') + '...'"
            />
          </div>
          <select v-model="filters.status" class="form-input w-36">
            <option value="">{{ $t('common.allStatuses') }}</option>
            <option value="active">{{ $t('membership.statuses.active') }}</option>
            <option value="inactive">{{ $t('membership.statuses.inactive') }}</option>
            <option value="archived">{{ $t('membership.statuses.archived') }}</option>
          </select>
          <button class="btn-primary" @click="openCreateModal">
            <span class="material-icons text-sm mr-1">add</span>
            {{ $t('membership.packages.newPackage') }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div v-if="loading" class="p-8 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"
          ></div>
        </div>

        <div v-else-if="filteredPackages.length === 0" class="p-8 text-center">
          <span class="material-icons text-4xl text-gray-400">inventory_2</span>
          <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('common.noData') }}</p>
        </div>

        <table v-else class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.packages.name') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.packages.tabs.services') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.services.prices') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.packages.interval') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.services.status') }}
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr
              v-for="pkg in filteredPackages"
              :key="pkg._id"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/30"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center"
                    :style="{ backgroundColor: pkg.color + '20' }"
                  >
                    <span class="material-icons text-base" :style="{ color: pkg.color }">{{
                      pkg.icon || 'inventory_2'
                    }}</span>
                  </div>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">{{ pkg.name?.tr }}</div>
                    <div class="text-xs text-gray-500 dark:text-slate-400">
                      <code>{{ pkg.code }}</code>
                      <span
                        v-if="pkg.badge"
                        class="ml-2 text-purple-600 dark:text-purple-400 font-medium"
                        >{{ pkg.badge }}</span
                      >
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="svc in pkg.services?.filter(s => s.included)"
                    :key="svc._id"
                    class="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded"
                  >
                    {{ svc.service?.name?.tr || '?' }}
                  </span>
                  <span v-if="!pkg.services?.length" class="text-gray-400 text-sm">-</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <div v-for="price in pkg.pricing?.prices" :key="price.currency" class="text-sm">
                  {{ formatCurrency(price.amount, price.currency) }}
                </div>
                <span v-if="!pkg.pricing?.prices?.length" class="text-gray-400 text-sm">{{
                  $t('membership.packages.priceModes.auto')
                }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm">{{
                  $t(`membership.intervals.${pkg.pricing?.interval}`)
                }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="badge" :class="statusBadgeClass(pkg.status)">
                  {{ $t(`membership.statuses.${pkg.status}`) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-2 text-gray-600 hover:text-gray-700 dark:text-slate-400"
                    @click="openEditModal(pkg)"
                  >
                    <span class="material-icons text-xl">edit</span>
                  </button>
                  <button
                    v-if="pkg.status !== 'archived'"
                    class="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                    @click="handleArchive(pkg)"
                  >
                    <span class="material-icons text-xl">archive</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Package Form Modal -->
    <PackageFormModal v-model="showFormModal" :pkg="selectedPackage" @saved="onPackageSaved" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import PackageFormModal from './packages-view/PackageFormModal.vue'
import {
  getMembershipPackages,
  getMembershipPackageStats,
  archiveMembershipPackage
} from '@/services/membershipPackageService'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const navItems = computed(() => [
  {
    name: 'services',
    to: '/membership/services',
    icon: 'layers',
    label: t('membership.nav.services')
  },
  {
    name: 'packages',
    to: '/membership/packages',
    icon: 'inventory_2',
    label: t('membership.nav.packages')
  },
  {
    name: 'assignments',
    to: '/membership/assignments',
    icon: 'assignment',
    label: t('membership.nav.assignments')
  }
])

const loading = ref(true)
const packages = ref([])
const stats = ref({ total: 0, active: 0, partnersWithPackage: 0 })
const filters = ref({ search: '', status: '' })
const showFormModal = ref(false)
const selectedPackage = ref(null)

const filteredPackages = computed(() => {
  return packages.value.filter(pkg => {
    if (filters.value.search) {
      const s = filters.value.search.toLowerCase()
      if (
        !pkg.name?.tr?.toLowerCase().includes(s) &&
        !pkg.name?.en?.toLowerCase().includes(s) &&
        !pkg.code?.includes(s)
      )
        return false
    }
    if (filters.value.status && pkg.status !== filters.value.status) return false
    return true
  })
})

const statusBadgeClass = status => ({
  'badge-success': status === 'active',
  'badge-warning': status === 'inactive',
  'badge-secondary': status === 'archived'
})

const formatCurrency = (amount, currency = 'TRY') => {
  if (amount == null) return '-'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount)
}

const fetchData = async () => {
  loading.value = true
  try {
    const [packagesRes, statsRes] = await Promise.all([
      getMembershipPackages(),
      getMembershipPackageStats()
    ])
    packages.value = packagesRes.data || []
    stats.value = statsRes.data || { total: 0, active: 0, partnersWithPackage: 0 }
  } catch {
    toast.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  selectedPackage.value = null
  showFormModal.value = true
}
const openEditModal = pkg => {
  selectedPackage.value = pkg
  showFormModal.value = true
}

const handleArchive = async pkg => {
  if (!confirm(t('membership.packages.archiveConfirm'))) return
  try {
    await archiveMembershipPackage(pkg._id)
    toast.success(t('membership.packages.archived'))
    await fetchData()
  } catch (error) {
    const msg = error.response?.data?.error
    if (msg === 'PACKAGE_HAS_ACTIVE_ASSIGNMENTS') {
      toast.error(t('membership.packages.hasActiveAssignments'))
    } else {
      toast.error(t('common.error'))
    }
  }
}

const onPackageSaved = () => {
  showFormModal.value = false
  fetchData()
}

onMounted(fetchData)
</script>
