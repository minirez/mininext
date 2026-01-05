<template>
  <div>
    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('hotels.statistics.total') }}
            </p>
            <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ stats.total }}</p>
          </div>
          <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <span class="material-icons text-purple-600 dark:text-purple-400">hotel</span>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('hotels.statistics.active') }}
            </p>
            <p class="text-2xl font-bold text-green-600">{{ stats.active }}</p>
          </div>
          <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('hotels.statistics.inactive') }}
            </p>
            <p class="text-2xl font-bold text-red-600">{{ stats.inactive }}</p>
          </div>
          <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <span class="material-icons text-red-600 dark:text-red-400">cancel</span>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('hotels.statistics.draft') }}
            </p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.draft }}</p>
          </div>
          <div class="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <span class="material-icons text-yellow-600 dark:text-yellow-400">edit_note</span>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t('hotels.statistics.featured') }}
            </p>
            <p class="text-2xl font-bold text-orange-600">{{ stats.featured }}</p>
          </div>
          <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <span class="material-icons text-orange-600 dark:text-orange-400">star</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex flex-wrap justify-end items-center gap-2">
          <!-- Export Button -->
          <button
            class="btn-secondary flex items-center"
            :title="$t('hotels.exportCSV')"
            @click="exportToCSV"
          >
            <span class="material-icons text-lg mr-1">download</span>
            <span class="hidden sm:inline">{{ $t('hotels.export') }}</span>
          </button>
          <!-- Add Hotel -->
          <router-link to="/hotels/new" class="btn-primary flex items-center">
            <span class="material-icons text-lg mr-2">add</span>
            {{ $t('hotels.addHotel') }}
          </router-link>
        </div>

        <!-- Toolbar -->
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <!-- Search -->
          <div class="flex-1 min-w-[250px]">
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <span class="material-icons text-lg">search</span>
              </span>
              <input
                v-model="filters.search"
                type="text"
                :placeholder="$t('hotels.searchPlaceholder')"
                class="form-input w-full pl-10"
                @input="debouncedFetch"
              />
              <button
                v-if="filters.search"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="filters.search = ''; fetchHotels()"
              >
                <span class="material-icons text-lg">close</span>
              </button>
            </div>
          </div>

          <!-- Sort Dropdown -->
          <div class="relative">
            <select v-model="sortBy" class="form-input pr-8 min-w-[150px]" @change="fetchHotels">
              <option value="">{{ $t('hotels.sortBy') }}</option>
              <option value="name_asc">{{ $t('hotels.sortOptions.nameAsc') }}</option>
              <option value="name_desc">{{ $t('hotels.sortOptions.nameDesc') }}</option>
              <option value="stars_asc">{{ $t('hotels.sortOptions.starsAsc') }}</option>
              <option value="stars_desc">{{ $t('hotels.sortOptions.starsDesc') }}</option>
              <option value="city_asc">{{ $t('hotels.sortOptions.cityAsc') }}</option>
              <option value="city_desc">{{ $t('hotels.sortOptions.cityDesc') }}</option>
              <option value="createdAt_desc">{{ $t('hotels.sortOptions.newest') }}</option>
              <option value="createdAt_asc">{{ $t('hotels.sortOptions.oldest') }}</option>
            </select>
          </div>

          <!-- Bulk Actions -->
          <div v-if="selectedHotels.length > 0" class="relative">
            <button class="btn-secondary flex items-center" @click="showBulkMenu = !showBulkMenu">
              <span class="material-icons text-lg mr-1">checklist</span>
              {{ $t('hotels.selected', { count: selectedHotels.length }) }}
              <span class="material-icons text-lg ml-1">expand_more</span>
            </button>
            <div
              v-if="showBulkMenu"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 z-20"
            >
              <button
                class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center"
                @click="bulkActivate"
              >
                <span class="material-icons text-lg mr-2 text-green-600">play_circle</span>
                {{ $t('hotels.bulkActivate') }}
              </button>
              <button
                class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center"
                @click="bulkDeactivate"
              >
                <span class="material-icons text-lg mr-2 text-orange-600">pause_circle</span>
                {{ $t('hotels.bulkDeactivate') }}
              </button>
              <hr class="border-gray-200 dark:border-slate-600" />
              <button
                class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                @click="confirmBulkDelete"
              >
                <span class="material-icons text-lg mr-2">delete</span>
                {{ $t('hotels.bulkDelete') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="mt-4 flex flex-wrap gap-3">
          <select v-model="filters.status" class="form-input w-36" @change="fetchHotels">
            <option value="">{{ $t('hotels.allStatuses') }}</option>
            <option value="draft">{{ $t('hotels.statuses.draft') }}</option>
            <option value="active">{{ $t('hotels.statuses.active') }}</option>
            <option value="inactive">{{ $t('hotels.statuses.inactive') }}</option>
          </select>
          <select v-model="filters.stars" class="form-input w-32" @change="fetchHotels">
            <option value="">{{ $t('hotels.allStars') }}</option>
            <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ $t('hotels.stars') }}</option>
          </select>
          <select v-model="filters.type" class="form-input w-36" @change="fetchHotels">
            <option value="">{{ $t('hotels.allTypes') }}</option>
            <option v-for="(label, key) in hotelTypes" :key="key" :value="key">{{ label }}</option>
          </select>
          <select v-model="filters.city" class="form-input w-40" @change="fetchHotels">
            <option value="">{{ $t('hotels.allCities') }}</option>
            <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
          </select>
          <select v-model="filters.category" class="form-input w-36" @change="fetchHotels">
            <option value="">{{ $t('hotels.allCategories') }}</option>
            <option v-for="(label, key) in categories" :key="key" :value="key">{{ label }}</option>
          </select>
          <select v-model="filters.featured" class="form-input w-40" @change="fetchHotels">
            <option value="">{{ $t('hotels.featured') }}</option>
            <option value="true">{{ $t('hotels.featuredOnly') }}</option>
            <option value="false">{{ $t('hotels.notFeatured') }}</option>
          </select>
        </div>

        <!-- Active Filters -->
        <div v-if="activeFilterCount > 0" class="mt-4 flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-slate-400"
            >{{ $t('hotels.activeFilters') }}:</span
          >
          <span
            v-if="filters.status"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          >
            {{ $t(`hotels.statuses.${filters.status}`) }}
            <button
              class="ml-1 hover:text-purple-900"
              @click="filters.status = ''; fetchHotels()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.stars"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
          >
            {{ filters.stars }} {{ $t('hotels.stars') }}
            <button
              class="ml-1 hover:text-yellow-900"
              @click="filters.stars = ''; fetchHotels()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.type"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {{ $t(`hotels.types.${filters.type}`) }}
            <button
              class="ml-1 hover:text-blue-900"
              @click="filters.type = ''; fetchHotels()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.city"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          >
            {{ filters.city }}
            <button
              class="ml-1 hover:text-green-900"
              @click="filters.city = ''; fetchHotels()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.category"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          >
            {{ $t(`hotels.categories.${filters.category}`) }}
            <button
              class="ml-1 hover:text-indigo-900"
              @click="filters.category = ''; fetchHotels()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.featured"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
          >
            {{ filters.featured === 'true' ? $t('hotels.featuredOnly') : $t('hotels.notFeatured') }}
            <button
              class="ml-1 hover:text-orange-900"
              @click="filters.featured = ''; fetchHotels()"
            >
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <button
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
            @click="clearAllFilters"
          >
            <span class="material-icons text-sm mr-1">clear_all</span>
            {{ $t('hotels.clearFilters') }}
          </button>
        </div>
      </div>

      <div class="p-6">
        <DataTable
          :data="hotels"
          :columns="columns"
          :loading="loading"
          :total="pagination.total"
          :page="pagination.page"
          :per-page="pagination.limit"
          :show-header="false"
          responsive
          card-title-key="name"
          empty-icon="hotel"
          :empty-text="activeFilterCount > 0 ? $t('hotels.noResults') : $t('hotels.noHotels')"
          :row-class="row => selectedHotels.includes(row._id) ? 'bg-purple-50 dark:bg-purple-900/10' : ''"
          @page-change="handlePageChange"
        >
          <template #header-checkbox>
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate="isPartialSelected"
              class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              @change="toggleSelectAll"
            />
          </template>

          <template #cell-checkbox="{ row }">
            <input
              type="checkbox"
              :checked="selectedHotels.includes(row._id)"
              class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              @change="toggleSelect(row._id)"
            />
          </template>

          <template #cell-name="{ row }">
            <div class="flex items-center">
              <div
                class="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700"
              >
                <img
                  v-if="getHotelImage(row)"
                  :src="getHotelImage(row)"
                  :alt="getHotelName(row)"
                  class="h-12 w-12 object-cover"
                />
                <div v-else class="h-12 w-12 flex items-center justify-center">
                  <span class="material-icons text-gray-400">hotel</span>
                </div>
              </div>
              <div class="ml-4">
                <div class="flex items-center gap-2">
                  <router-link
                    :to="`/hotels/${row._id}`"
                    class="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    {{ getHotelName(row) }}
                  </router-link>
                  <span
                    v-if="row.hotelType === 'linked'"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  >
                    <span class="material-icons text-xs mr-0.5">link</span>
                    HotelBase
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    v-if="row.featured"
                    class="inline-flex items-center text-xs text-orange-600"
                  >
                    <span class="material-icons text-sm mr-0.5">star</span>
                    {{ $t('hotels.featured') }}
                  </span>
                  <span
                    v-if="row.totalRooms"
                    class="text-xs text-gray-500 dark:text-slate-400"
                  >
                    {{ row.totalRooms }} {{ $t('hotels.rooms') }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <template #cell-city="{ row }">
            <span class="text-sm text-gray-500 dark:text-slate-400">
              {{ row.address?.city || '-' }}
            </span>
          </template>

          <template #cell-stars="{ row }">
            <div class="flex items-center text-yellow-500">
              <span v-for="n in row.stars" :key="n" class="material-icons text-sm">star</span>
              <span
                v-for="n in 5 - row.stars"
                :key="'e' + n"
                class="material-icons text-sm text-gray-300 dark:text-slate-600"
              >star</span>
            </div>
          </template>

          <template #cell-type="{ row }">
            <span class="text-sm text-gray-500 dark:text-slate-400">
              {{ $t(`hotels.types.${row.type}`) }}
            </span>
          </template>

          <template #cell-status="{ row }">
            <span
              class="badge"
              :class="{
                'badge-success': row.status === 'active',
                'badge-danger': row.status === 'inactive',
                'badge-warning': row.status === 'draft'
              }"
            >
              {{ $t(`hotels.statuses.${row.status}`) }}
            </span>
          </template>

          <template #row-actions="{ row }">
            <div class="flex items-center justify-end gap-1">
              <button
                class="p-2 rounded-lg transition-colors"
                :class="
                  row.featured
                    ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                "
                :title="row.featured ? $t('hotels.removeFeatured') : $t('hotels.makeFeatured')"
                @click="toggleFeatured(row)"
              >
                <span class="material-icons text-lg">{{ row.featured ? 'star' : 'star_border' }}</span>
              </button>
              <router-link
                :to="`/hotels/${row._id}`"
                class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                :title="$t('common.edit')"
              >
                <span class="material-icons text-lg">edit</span>
              </router-link>
              <button
                class="p-2 rounded-lg transition-colors"
                :class="
                  row.status === 'active'
                    ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                "
                :title="row.status === 'active' ? $t('common.deactivate') : $t('common.activate')"
                @click="toggleStatus(row)"
              >
                <span class="material-icons text-lg">{{ row.status === 'active' ? 'pause_circle' : 'play_circle' }}</span>
              </button>
              <button
                class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                :title="$t('common.delete')"
                @click="confirmDelete(row)"
              >
                <span class="material-icons text-lg">delete</span>
              </button>
            </div>
          </template>

          <template #empty-action>
            <button v-if="activeFilterCount > 0" class="btn-secondary mt-4" @click="clearAllFilters">
              {{ $t('hotels.clearFilters') }}
            </button>
            <router-link v-else to="/hotels/new" class="btn-primary mt-4 inline-flex items-center">
              <span class="material-icons text-lg mr-2">add</span>
              {{ $t('hotels.addHotel') }}
            </router-link>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('hotels.deleteHotel')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('hotels.deleteConfirm') }}
      </p>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showDeleteModal = false">
          {{ $t('common.no') }}
        </button>
        <button type="button" class="btn-danger" :disabled="deleting" @click="handleDelete">
          <span v-if="deleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Bulk Delete Confirmation Modal -->
    <Modal v-model="showBulkDeleteModal" :title="$t('hotels.bulkDelete')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('hotels.bulkDeleteConfirm', { count: selectedHotels.length }) }}
      </p>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showBulkDeleteModal = false">
          {{ $t('common.no') }}
        </button>
        <button type="button" class="btn-danger" :disabled="bulkDeleting" @click="handleBulkDelete">
          <span v-if="bulkDeleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/ui/data/DataTable.vue'
import Modal from '@/components/common/Modal.vue'
import hotelService from '@/services/hotelService'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { useListView } from '@/composables/useListView'
import { useBulkActions } from '@/composables/useBulkActions'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { getImageUrl } from '@/utils/imageUrl'

const { t, locale } = useI18n()
const toast = useToast()

// Additional state not covered by composables
const cities = ref([])
const sortBy = ref('')
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const selectedHotel = ref(null)

const stats = reactive({
  total: 0,
  active: 0,
  inactive: 0,
  draft: 0,
  featured: 0
})

// Use list view composable for hotels
const {
  items: hotels,
  isLoading: loading,
  pagination,
  filters,
  fetch: fetchHotels,
  debouncedFetch,
  handlePageChange
} = useListView(
  params => {
    // Add sortBy to params
    if (sortBy.value) {
      const [field, order] = sortBy.value.split('_')
      params.sortBy = field
      params.sortOrder = order
    }
    return hotelService.getHotels(params)
  },
  {
    defaultFilters: {
      search: '',
      status: '',
      stars: '',
      city: '',
      type: '',
      category: '',
      featured: ''
    },
    errorMessage: 'hotels.fetchError',
    onSuccess: (items, data) => {
      // Update stats from response
      if (data?.stats) {
        stats.total = data.stats.total || 0
        stats.active = data.stats.active || 0
        stats.inactive = data.stats.inactive || 0
        stats.draft = data.stats.draft || 0
        stats.featured = data.stats.featured || 0
      } else {
        stats.total = pagination.total
      }
      // Clear selection on fetch
      clearSelection()
    }
  }
)

// Use bulk actions composable for selection
const {
  selectedItems: selectedHotels,
  isAllSelected,
  isPartialSelected,
  isProcessing,
  showBulkMenu,
  toggleSelectAll,
  toggleSelect,
  clearSelection,
  executeBulkAction
} = useBulkActions({ items: hotels, idKey: '_id' })

// Use async action for delete operations
const { isLoading: deleting, execute: executeDelete } = useAsyncAction()
const { execute: executeFetchCities } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { execute: executeFetchStats } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { execute: executeToggleStatus } = useAsyncAction({ showErrorToast: false })
const { execute: executeToggleFeatured } = useAsyncAction({ showErrorToast: false })

// Alias for bulk delete loading state (uses useBulkActions.isProcessing)
const bulkDeleting = computed(() => isProcessing.value)

// Columns for DataTable
const columns = computed(() => [
  { key: 'checkbox', label: '', sortable: false, width: '48px' },
  { key: 'name', label: t('hotels.name'), sortable: false },
  { key: 'city', label: t('hotels.city'), sortable: false },
  { key: 'stars', label: t('hotels.stars'), sortable: false },
  { key: 'type', label: t('hotels.type'), sortable: false },
  { key: 'status', label: t('common.status.label'), sortable: false }
])

// Hotel types for filter dropdown
const hotelTypes = computed(() => ({
  hotel: t('hotels.types.hotel'),
  apart: t('hotels.types.apart'),
  boutique: t('hotels.types.boutique'),
  resort: t('hotels.types.resort'),
  hostel: t('hotels.types.hostel'),
  villa: t('hotels.types.villa'),
  guesthouse: t('hotels.types.guesthouse'),
  motel: t('hotels.types.motel'),
  pension: t('hotels.types.pension'),
  camping: t('hotels.types.camping')
}))

// Categories for filter dropdown
const categories = computed(() => ({
  economy: t('hotels.categories.economy'),
  standard: t('hotels.categories.standard'),
  superior: t('hotels.categories.superior'),
  deluxe: t('hotels.categories.deluxe'),
  luxury: t('hotels.categories.luxury'),
  'ultra-luxury': t('hotels.categories.ultra-luxury')
}))

// Computed for active filter count
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.status) count++
  if (filters.stars) count++
  if (filters.type) count++
  if (filters.city) count++
  if (filters.category) count++
  if (filters.featured) count++
  return count
})

// Fetch cities for filter dropdown
const fetchCities = async () => {
  await executeFetchCities(
    () => hotelService.getCities(),
    {
      onSuccess: response => {
        if (response.success) {
          cities.value = response.data || []
        }
      },
      onError: error => {
        console.error('Failed to fetch cities:', error)
      }
    }
  )
}

// Fetch stats separately
const fetchStats = async () => {
  await executeFetchStats(
    () => hotelService.getHotels({ limit: 1 }),
    {
      onSuccess: response => {
        if (response.success && response.data.stats) {
          stats.total = response.data.stats.total || 0
          stats.active = response.data.stats.active || 0
          stats.inactive = response.data.stats.inactive || 0
          stats.draft = response.data.stats.draft || 0
          stats.featured = response.data.stats.featured || 0
        }
      },
      onError: error => {
        console.error('Failed to fetch stats:', error)
      }
    }
  )
}

const getHotelName = hotel => {
  if (typeof hotel.name === 'string') {
    return hotel.name || '-'
  }
  const lang = locale.value
  return hotel.name?.[lang] || hotel.name?.tr || hotel.name?.en || '-'
}

const getHotelImage = hotel => {
  // First try logo, then main image from gallery
  if (hotel.logo) {
    return getImageUrl(hotel.logo)
  }
  const mainImage = hotel.images?.find(img => img.isMain) || hotel.images?.[0]
  if (!mainImage?.url) return null
  return getImageUrl(mainImage.url)
}

// getImageUrl imported from @/utils/imageUrl

const toggleStatus = async hotel => {
  const newStatus = hotel.status === 'active' ? 'inactive' : 'active'
  await executeToggleStatus(
    () => hotelService.updateHotelStatus(hotel._id, newStatus),
    {
      successMessage: 'hotels.statusUpdated',
      onSuccess: response => {
        if (response.success) {
          hotel.status = newStatus
          fetchStats()
        }
      },
      onError: error => {
        toast.error(error.response?.data?.message || t('common.operationFailed'))
      }
    }
  )
}

const toggleFeatured = async hotel => {
  const newFeatured = !hotel.featured
  await executeToggleFeatured(
    () => hotelService.toggleFeatured(hotel._id, newFeatured),
    {
      successMessage: newFeatured ? 'hotels.markedFeatured' : 'hotels.unmarkedFeatured',
      onSuccess: response => {
        if (response.success) {
          hotel.featured = newFeatured
          fetchStats()
        }
      },
      onError: error => {
        toast.error(error.response?.data?.message || t('common.operationFailed'))
      }
    }
  )
}

const confirmDelete = hotel => {
  selectedHotel.value = hotel
  showDeleteModal.value = true
}

const handleDelete = async () => {
  await executeDelete(
    () => hotelService.deleteHotel(selectedHotel.value._id),
    {
      successMessage: 'hotels.deleteSuccess',
      errorMessage: 'common.deleteFailed',
      onSuccess: () => {
        showDeleteModal.value = false
        fetchHotels()
        fetchStats()
      }
    }
  )
}

const clearAllFilters = () => {
  filters.search = ''
  filters.status = ''
  filters.stars = ''
  filters.city = ''
  filters.type = ''
  filters.category = ''
  filters.featured = ''
  sortBy.value = ''
  pagination.page = 1
  fetchHotels()
}

// Bulk actions
const bulkActivate = async () => {
  showBulkMenu.value = false
  await executeBulkAction(
    hotelId => hotelService.updateHotelStatus(hotelId, 'active'),
    {
      successMessage: 'hotels.bulkActivateSuccess',
      errorMessage: 'common.operationFailed',
      clearOnSuccess: true
    }
  )
  fetchHotels()
  fetchStats()
}

const bulkDeactivate = async () => {
  showBulkMenu.value = false
  await executeBulkAction(
    hotelId => hotelService.updateHotelStatus(hotelId, 'inactive'),
    {
      successMessage: 'hotels.bulkDeactivateSuccess',
      errorMessage: 'common.operationFailed',
      clearOnSuccess: true
    }
  )
  fetchHotels()
  fetchStats()
}

const confirmBulkDelete = () => {
  showBulkMenu.value = false
  showBulkDeleteModal.value = true
}

const handleBulkDelete = async () => {
  await executeBulkAction(
    hotelId => hotelService.deleteHotel(hotelId),
    {
      successMessage: 'hotels.bulkDeleteSuccess',
      errorMessage: 'common.deleteFailed',
      clearOnSuccess: true
    }
  )
  showBulkDeleteModal.value = false
  fetchHotels()
  fetchStats()
}

// Export to CSV
const exportToCSV = () => {
  const headers = ['Name', 'City', 'Country', 'Stars', 'Type', 'Status', 'Featured', 'Rooms']
  const rows = hotels.value.map(hotel => [
    getHotelName(hotel),
    hotel.address?.city || '',
    hotel.address?.country || '',
    hotel.stars,
    hotel.type,
    hotel.status,
    hotel.featured ? 'Yes' : 'No',
    hotel.totalRooms || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `hotels_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// Close bulk menu when clicking outside
watch(showBulkMenu, val => {
  if (val) {
    const closeMenu = e => {
      if (!e.target.closest('.relative')) {
        showBulkMenu.value = false
        document.removeEventListener('click', closeMenu)
      }
    }
    setTimeout(() => document.addEventListener('click', closeMenu), 0)
  }
})

// React to partner changes
usePartnerContext({
  onPartnerChange: partner => {
    if (partner) {
      clearAllFilters()
      fetchCities()
      fetchStats()
    }
  },
  immediate: true
})
</script>
