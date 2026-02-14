<template>
  <div>
    <!-- Module Navigation -->
    <ModuleNavigation :items="navItems" color="purple" />

    <div class="p-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-blue-500">layers</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('membership.services.stats.total') }}
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
                {{ $t('membership.services.stats.active') }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-yellow-500">pause_circle</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.inactive }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('membership.services.stats.inactive') }}
              </div>
            </div>
          </div>
        </div>
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center"
            >
              <span class="material-icons text-gray-400">archive</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ stats.archived }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('membership.services.stats.archived') }}
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
          <select v-model="filters.category" class="form-input w-40">
            <option value="">{{ $t('membership.services.category') }}</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ $t(`membership.categories.${cat}`) }}
            </option>
          </select>
          <button class="btn-primary" @click="openCreateModal">
            <span class="material-icons text-sm mr-1">add</span>
            {{ $t('membership.services.newService') }}
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

        <div v-else-if="filteredServices.length === 0" class="p-8 text-center">
          <span class="material-icons text-4xl text-gray-400 dark:text-slate-500">layers</span>
          <p class="mt-2 text-gray-500 dark:text-slate-400">{{ $t('common.noData') }}</p>
        </div>

        <table v-else class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.services.name') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.services.code') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.services.category') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.services.billingType') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('membership.services.prices') }}
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
              v-for="svc in filteredServices"
              :key="svc._id"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/30"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-lg text-gray-400">{{ svc.icon || 'cube' }}</span>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">{{ svc.name?.tr }}</div>
                    <div class="text-xs text-gray-500 dark:text-slate-400">{{ svc.name?.en }}</div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <code class="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{{
                  svc.code
                }}</code>
              </td>
              <td class="px-4 py-3">
                <span class="badge badge-secondary">{{
                  $t(`membership.categories.${svc.category}`)
                }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm">{{
                  $t(`membership.billingTypes.${svc.pricing?.billingType}`)
                }}</span>
                <span
                  v-if="svc.pricing?.billingType === 'recurring'"
                  class="text-xs text-gray-500 dark:text-slate-400 ml-1"
                >
                  ({{ $t(`membership.intervals.${svc.pricing?.interval}`) }})
                </span>
              </td>
              <td class="px-4 py-3">
                <div v-for="price in svc.pricing?.prices" :key="price.currency" class="text-sm">
                  {{ formatCurrency(price.amount, price.currency) }}
                </div>
                <span v-if="!svc.pricing?.prices?.length" class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3">
                <span class="badge" :class="statusBadgeClass(svc.status)">
                  {{ $t(`membership.statuses.${svc.status}`) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-2 text-gray-600 hover:text-gray-700 dark:text-slate-400"
                    @click="openEditModal(svc)"
                  >
                    <span class="material-icons text-xl">edit</span>
                  </button>
                  <button
                    v-if="svc.status !== 'archived'"
                    class="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                    @click="handleArchive(svc)"
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

    <!-- Service Form Modal -->
    <ServiceFormModal v-model="showFormModal" :service="selectedService" @saved="onServiceSaved" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import ServiceFormModal from './services-view/ServiceFormModal.vue'
import {
  getMembershipServices,
  getMembershipServiceStats,
  archiveMembershipService
} from '@/services/membershipServiceService'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const categories = ['payment', 'booking', 'pms', 'web', 'design', 'support', 'integration', 'other']

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

// State
const loading = ref(true)
const services = ref([])
const stats = ref({ total: 0, active: 0, inactive: 0, archived: 0 })
const filters = ref({ search: '', status: '', category: '' })
const showFormModal = ref(false)
const selectedService = ref(null)

const filteredServices = computed(() => {
  return services.value.filter(svc => {
    if (filters.value.search) {
      const s = filters.value.search.toLowerCase()
      if (
        !svc.name?.tr?.toLowerCase().includes(s) &&
        !svc.name?.en?.toLowerCase().includes(s) &&
        !svc.code?.includes(s)
      )
        return false
    }
    if (filters.value.status && svc.status !== filters.value.status) return false
    if (filters.value.category && svc.category !== filters.value.category) return false
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
    const [servicesRes, statsRes] = await Promise.all([
      getMembershipServices(),
      getMembershipServiceStats()
    ])
    services.value = servicesRes.data || []
    stats.value = statsRes.data || { total: 0, active: 0, inactive: 0, archived: 0 }
  } catch (error) {
    toast.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  selectedService.value = null
  showFormModal.value = true
}

const openEditModal = svc => {
  selectedService.value = svc
  showFormModal.value = true
}

const handleArchive = async svc => {
  if (!confirm(t('membership.services.archiveConfirm'))) return
  try {
    await archiveMembershipService(svc._id)
    toast.success(t('membership.services.archived'))
    await fetchData()
  } catch (error) {
    const msg = error.response?.data?.error
    if (msg === 'SERVICE_USED_IN_ACTIVE_PACKAGES') {
      toast.error(t('membership.services.usedInActivePackages'))
    } else {
      toast.error(t('common.error'))
    }
  }
}

const onServiceSaved = () => {
  showFormModal.value = false
  fetchData()
}

onMounted(fetchData)
</script>
