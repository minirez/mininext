<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ $t('tursab.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
        {{ $t('tursab.description') }}
      </p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"
          >
            <span class="material-icons text-blue-600 dark:text-blue-400">business</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatNumber(stats.total) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('tursab.stats.total') }}
            </p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"
          >
            <span class="material-icons text-green-600 dark:text-green-400">verified</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatNumber(stats.groups?.A) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('tursab.stats.groupA') }}
            </p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center"
          >
            <span class="material-icons text-yellow-600 dark:text-yellow-400"
              >workspace_premium</span
            >
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatNumber(stats.groups?.B) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('tursab.stats.groupB') }}
            </p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"
          >
            <span class="material-icons text-purple-600 dark:text-purple-400">star</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatNumber(stats.groups?.C) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('tursab.stats.groupC') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <span class="material-icons text-xl">search</span>
            </span>
            <input
              v-model="filters.search"
              type="text"
              :placeholder="$t('tursab.filters.search')"
              class="form-input pl-10 w-full"
              @input="debouncedFetch"
            />
          </div>
        </div>

        <!-- City -->
        <div>
          <select v-model="filters.il" class="form-input w-full" @change="handleCityChange">
            <option value="">{{ $t('tursab.filters.allCities') }}</option>
            <option v-for="c in cities" :key="c.city" :value="c.city">
              {{ c.city }} ({{ formatNumber(c.count) }})
            </option>
          </select>
        </div>

        <!-- District -->
        <div>
          <select
            v-model="filters.ilce"
            class="form-input w-full"
            :disabled="!filters.il"
            @change="fetch"
          >
            <option value="">{{ $t('tursab.filters.allDistricts') }}</option>
            <option v-for="d in districts" :key="d.district" :value="d.district">
              {{ d.district }} ({{ formatNumber(d.count) }})
            </option>
          </select>
        </div>

        <!-- Group -->
        <div>
          <select v-model="filters.grup" class="form-input w-full" @change="fetch">
            <option value="">{{ $t('tursab.filters.allGroups') }}</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <DataTable
        :data="items"
        :columns="columns"
        :loading="isLoading"
        :total="pagination.total"
        :page="pagination.page"
        :per-page="pagination.limit"
        :show-header="false"
        responsive
        :empty-icon="'menu_book'"
        :empty-text="$t('tursab.empty')"
        @page-change="handlePageChange"
      >
        <!-- Name -->
        <template #cell-unvan="{ row }">
          <div class="text-sm font-medium text-gray-900 dark:text-white">
            {{ row.unvan }}
          </div>
          <div
            v-if="row.ticariUnvan"
            class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate max-w-xs"
          >
            {{ row.ticariUnvan }}
          </div>
        </template>

        <!-- Belge No -->
        <template #cell-belgeNo="{ row }">
          <span class="text-sm text-gray-700 dark:text-slate-300 font-mono">
            {{ row.belgeNo || '-' }}
          </span>
        </template>

        <!-- Group Badge -->
        <template #cell-grup="{ row }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            :class="grupBadgeClass(row.grup)"
          >
            {{ row.grup }}
          </span>
        </template>

        <!-- City / District -->
        <template #cell-il="{ row }">
          <div class="text-sm text-gray-900 dark:text-white">
            {{ row.il }}
          </div>
          <div v-if="row.ilce" class="text-xs text-gray-500 dark:text-slate-400">
            {{ row.ilce }}
          </div>
        </template>

        <!-- Phone -->
        <template #cell-telefon="{ row }">
          <div class="text-sm text-gray-700 dark:text-slate-300">
            {{ row.telefon || '-' }}
          </div>
        </template>

        <!-- Actions -->
        <template #row-actions="{ row }">
          <button
            class="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            @click="openDetail(row)"
          >
            <span class="material-icons text-xl">visibility</span>
          </button>
        </template>
      </DataTable>
    </div>

    <!-- Detail Drawer -->
    <Drawer v-model="showDrawer" :title="$t('tursab.detail.title')" size="md">
      <div v-if="selectedAgency" class="space-y-6">
        <!-- Agency Info -->
        <div>
          <h4
            class="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3"
          >
            {{ $t('tursab.detail.agencyInfo') }}
          </h4>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-gray-400 dark:text-slate-500">{{
                $t('tursab.detail.unvan')
              }}</label>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ selectedAgency.unvan }}
              </p>
            </div>
            <div v-if="selectedAgency.ticariUnvan">
              <label class="text-xs text-gray-400 dark:text-slate-500">{{
                $t('tursab.detail.ticariUnvan')
              }}</label>
              <p class="text-sm text-gray-900 dark:text-white">{{ selectedAgency.ticariUnvan }}</p>
            </div>
            <div class="flex gap-6">
              <div>
                <label class="text-xs text-gray-400 dark:text-slate-500">{{
                  $t('tursab.detail.belgeNo')
                }}</label>
                <p class="text-sm font-mono text-gray-900 dark:text-white">
                  {{ selectedAgency.belgeNo || '-' }}
                </p>
              </div>
              <div>
                <label class="text-xs text-gray-400 dark:text-slate-500">{{
                  $t('tursab.detail.group')
                }}</label>
                <p>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="grupBadgeClass(selectedAgency.grup)"
                  >
                    {{ selectedAgency.grup }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
          <h4
            class="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3"
          >
            {{ $t('tursab.detail.contact') }}
          </h4>
          <div class="space-y-3">
            <div v-if="selectedAgency.telefon">
              <label class="text-xs text-gray-400 dark:text-slate-500">{{
                $t('tursab.detail.phone')
              }}</label>
              <p class="text-sm text-gray-900 dark:text-white">
                <a
                  :href="'tel:' + selectedAgency.telefon"
                  class="hover:text-purple-600 dark:hover:text-purple-400"
                >
                  {{ selectedAgency.telefon }}
                </a>
              </p>
            </div>
            <div v-if="selectedAgency.telefon2">
              <label class="text-xs text-gray-400 dark:text-slate-500">{{
                $t('tursab.detail.phone2')
              }}</label>
              <p class="text-sm text-gray-900 dark:text-white">{{ selectedAgency.telefon2 }}</p>
            </div>
            <div v-if="selectedAgency.telefon3">
              <label class="text-xs text-gray-400 dark:text-slate-500">{{
                $t('tursab.detail.phone3')
              }}</label>
              <p class="text-sm text-gray-900 dark:text-white">{{ selectedAgency.telefon3 }}</p>
            </div>
            <div v-if="selectedAgency.faks">
              <label class="text-xs text-gray-400 dark:text-slate-500">{{
                $t('tursab.detail.fax')
              }}</label>
              <p class="text-sm text-gray-900 dark:text-white">{{ selectedAgency.faks }}</p>
            </div>
            <div v-if="selectedAgency.adres">
              <label class="text-xs text-gray-400 dark:text-slate-500">{{
                $t('tursab.detail.address')
              }}</label>
              <p class="text-sm text-gray-900 dark:text-white leading-relaxed">
                {{ selectedAgency.adres }}
              </p>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
          <h4
            class="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3"
          >
            {{ $t('tursab.detail.location') }}
          </h4>
          <div class="flex gap-6">
            <div>
              <label class="text-xs text-gray-400 dark:text-slate-500">{{
                $t('tursab.detail.city')
              }}</label>
              <p class="text-sm text-gray-900 dark:text-white">{{ selectedAgency.il || '-' }}</p>
            </div>
            <div>
              <label class="text-xs text-gray-400 dark:text-slate-500">{{
                $t('tursab.detail.district')
              }}</label>
              <p class="text-sm text-gray-900 dark:text-white">{{ selectedAgency.ilce || '-' }}</p>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useListView } from '@/composables/useListView'
import DataTable from '@/components/ui/data/DataTable.vue'
import Drawer from '@/components/ui/overlay/Drawer.vue'
import tursabAgencyService from '@/services/tursabAgencyService'

const { t } = useI18n()

// Stats
const stats = ref({})
const cities = ref([])
const districts = ref([])

// Drawer
const showDrawer = ref(false)
const selectedAgency = ref(null)

// List view
const { items, isLoading, pagination, filters, fetch, debouncedFetch, handlePageChange } =
  useListView(tursabAgencyService.getTursabAgencies, {
    defaultFilters: {
      search: '',
      il: '',
      ilce: '',
      grup: ''
    },
    itemsKey: 'agencies',
    debounceMs: 400
  })

// Columns
const columns = computed(() => [
  { key: 'unvan', label: t('tursab.table.name') },
  { key: 'belgeNo', label: t('tursab.table.belgeNo') },
  { key: 'grup', label: t('tursab.table.group') },
  { key: 'il', label: t('tursab.table.cityDistrict') },
  { key: 'telefon', label: t('tursab.table.phone') }
])

// Group badge classes
const grupBadgeClass = grup => {
  const classes = {
    A: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    B: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    C: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  }
  return classes[grup] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

// Format number
const formatNumber = num => {
  if (!num && num !== 0) return '0'
  return num.toLocaleString('tr-TR')
}

// Fetch stats & cities
const fetchStats = async () => {
  try {
    const response = await tursabAgencyService.getTursabAgencyStats()
    if (response.success) {
      stats.value = response.data
    }
  } catch (e) {
    console.error('Stats fetch error:', e)
  }
}

const fetchCities = async () => {
  try {
    const response = await tursabAgencyService.getTursabCities()
    if (response.success) {
      cities.value = response.data
    }
  } catch (e) {
    console.error('Cities fetch error:', e)
  }
}

const fetchDistricts = async city => {
  if (!city) {
    districts.value = []
    return
  }
  try {
    const response = await tursabAgencyService.getTursabDistricts(city)
    if (response.success) {
      districts.value = response.data
    }
  } catch (e) {
    console.error('Districts fetch error:', e)
  }
}

// City change handler
const handleCityChange = () => {
  filters.ilce = ''
  fetchDistricts(filters.il)
  fetch()
}

// Open detail drawer
const openDetail = row => {
  selectedAgency.value = row
  showDrawer.value = true
}

// Init
onMounted(() => {
  fetch()
  fetchStats()
  fetchCities()
})
</script>
