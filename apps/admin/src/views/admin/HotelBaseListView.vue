<template>
  <div>
    <!-- Action Buttons -->
    <div class="mb-6 flex justify-end gap-2">
      <button class="btn-secondary flex items-center gap-2" @click="showAIImporter = true">
        <span class="material-icons">auto_awesome</span>
        {{ $t('hotels.aiImport.button') }}
      </button>
      <button class="btn-primary flex items-center gap-2" @click="openCreateModal">
        <span class="material-icons">add</span>
        {{ $t('hotels.hotelBase.addHotel') }}
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <span class="material-icons">search</span>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="$t('hotels.hotelBase.searchHotels')"
              class="form-input pl-10 w-full"
              @input="debouncedSearch"
            />
          </div>
        </div>

        <!-- Star Filter -->
        <div class="w-full md:w-40">
          <select v-model="filters.stars" class="form-input w-full" @change="fetchHotels">
            <option value="">{{ $t('hotels.allStars') }}</option>
            <option v-for="star in [5, 4, 3, 2, 1]" :key="star" :value="star">
              {{ star }} {{ $t('hotels.stars') }}
            </option>
          </select>
        </div>

        <!-- City Filter -->
        <div class="w-full md:w-48">
          <select v-model="filters.city" class="form-input w-full" @change="fetchHotels">
            <option value="">{{ $t('hotels.allCities') }}</option>
            <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="w-full md:w-36">
          <select v-model="filters.status" class="form-input w-full" @change="fetchHotels">
            <option value="">{{ $t('hotels.allStatuses') }}</option>
            <option value="active">{{ $t('hotels.statusActive') }}</option>
            <option value="draft">{{ $t('hotels.statusDraft') }}</option>
            <option value="inactive">{{ $t('hotels.statusInactive') }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Hotels Table -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <DataTable
        :data="hotels"
        :columns="columns"
        :loading="loading"
        :total="pagination.total"
        :page="pagination.page"
        :per-page="pagination.limit"
        :show-header="false"
        responsive
        :card-title-key="'name'"
        :empty-icon="'domain'"
        :empty-text="$t('hotels.hotelBase.noBaseHotels')"
        @page-change="handlePageChange"
      >
        <!-- Empty State Action -->
        <template #empty-action>
          <button class="btn-primary mt-4" @click="openCreateModal">
            <span class="material-icons mr-2">add</span>
            {{ $t('hotels.hotelBase.addHotel') }}
          </button>
        </template>

        <!-- Hotel Info Cell -->
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0"
            >
              <img
                v-if="getMainImage(row)"
                :src="getImageUrl(getMainImage(row))"
                :alt="row.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="material-icons text-lg text-gray-400 dark:text-slate-500">hotel</span>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-gray-800 dark:text-white">{{ row.name }}</h4>
              <span v-if="row.category" class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t(`hotels.categories.${row.category}`) }}
              </span>
            </div>
          </div>
        </template>

        <!-- Location Cell -->
        <template #cell-location="{ row }">
          <span class="text-sm text-gray-600 dark:text-slate-400">
            {{ row.address?.city }}, {{ row.address?.country }}
          </span>
        </template>

        <!-- Stars Cell -->
        <template #cell-stars="{ row }">
          <div class="flex justify-center">
            <span
              v-for="i in row.stars"
              :key="i"
              class="material-icons text-sm text-yellow-400"
            >star</span>
          </div>
        </template>

        <!-- Status Cell -->
        <template #cell-status="{ row }">
          <span :class="getStatusClass(row.status)">
            {{ $t(`hotels.status${row.status?.charAt(0).toUpperCase()}${row.status?.slice(1)}`) }}
          </span>
        </template>

        <!-- Linked Partners Cell -->
        <template #cell-linkedCount="{ row }">
          <button
            v-if="row.linkedCount > 0"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
            @click="showLinkedPartners(row)"
          >
            <span class="material-icons text-sm mr-1">link</span>
            {{ row.linkedCount }}
          </button>
          <span v-else class="text-gray-400 dark:text-slate-500 text-sm">-</span>
        </template>

        <!-- Row Actions -->
        <template #row-actions="{ row }">
          <div class="flex justify-end gap-2">
            <button
              class="p-2 text-gray-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
              :title="$t('common.edit')"
              @click="editHotel(row)"
            >
              <span class="material-icons">edit</span>
            </button>
            <button
              :disabled="row.linkedCount > 0"
              class="p-2 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :title="row.linkedCount > 0 ? $t('hotels.hotelBase.cannotDeleteWithLinked') : $t('common.delete')"
              @click="confirmDelete(row)"
            >
              <span class="material-icons">delete</span>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      :title="$t('hotels.deleteConfirmTitle')"
      size="sm"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('hotels.deleteConfirmMessage', { name: hotelToDelete?.name }) }}
      </p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            @click="showDeleteModal = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="deleting"
            class="btn-danger flex items-center gap-2"
            @click="deleteHotel"
          >
            <span v-if="deleting" class="animate-spin material-icons text-lg">refresh</span>
            <span>{{ $t('common.delete') }}</span>
          </button>
        </div>
      </template>
    </Modal>

    <!-- AI Import Modal -->
    <HotelAIImporter
      :show="showAIImporter"
      @close="showAIImporter = false"
      @imported="handleAIImported"
    />

    <!-- Linked Partners Modal -->
    <Modal
      v-model="showPartnersModal"
      :title="$t('hotels.hotelBase.linkedPartnersTitle', { name: selectedHotel?.name })"
      size="md"
      @close="showPartnersModal = false"
    >
      <div v-if="loadingPartners" class="py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      </div>

      <div
        v-else-if="linkedPartners.length === 0"
        class="py-8 text-center text-gray-500 dark:text-slate-400"
      >
        {{ $t('hotels.hotelBase.noLinkedPartners') }}
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-slate-700">
        <div
          v-for="item in linkedPartners"
          :key="item.hotelId"
          class="py-3 flex items-center gap-3"
        >
          <!-- Partner Logo -->
          <div
            class="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0"
          >
            <img
              v-if="item.partner?.logo"
              :src="getImageUrl(item.partner.logo)"
              :alt="item.partner?.companyName"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="material-icons text-gray-400 dark:text-slate-500">business</span>
            </div>
          </div>

          <!-- Partner Info -->
          <div class="flex-1 min-w-0">
            <h5 class="font-medium text-gray-800 dark:text-white truncate">
              {{ item.partner?.companyName || '-' }}
            </h5>
            <p class="text-xs text-gray-500 dark:text-slate-400 truncate">
              {{ item.partner?.email }}
            </p>
          </div>

          <!-- Status -->
          <span :class="getPartnerStatusClass(item.partner?.status)">
            {{
              item.partner?.status === 'active'
                ? $t('common.status.active')
                : $t('common.status.inactive')
            }}
          </span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <button type="button" class="btn-secondary" @click="showPartnersModal = false">
            {{ $t('common.close') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'
import hotelService from '@/services/hotelService'
import Modal from '@/components/common/Modal.vue'
import DataTable from '@/components/ui/data/DataTable.vue'
import HotelAIImporter from '@/components/hotels/HotelAIImporter.vue'
import { getImageUrl } from '@/utils/imageUrl'

const router = useRouter()
const toast = useToast()
const { t } = useI18n()

// Async action composables
const { isLoading: loading, execute: executeLoad } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { isLoading: deleting, execute: executeDelete } = useAsyncAction({ showErrorToast: false })
const { execute: executeCities } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { isLoading: loadingPartners, execute: executePartners } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const searchQuery = ref('')
const hotels = ref([])
const cities = ref([])
const showDeleteModal = ref(false)
const hotelToDelete = ref(null)
const showAIImporter = ref(false)
const showPartnersModal = ref(false)
const selectedHotel = ref(null)
const linkedPartners = ref([])

const filters = reactive({
  stars: '',
  city: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0
})

// DataTable columns
const columns = computed(() => [
  { key: 'name', label: t('hotels.name'), sortable: true },
  { key: 'location', label: t('hotels.location'), sortable: false },
  { key: 'stars', label: t('hotels.stars'), sortable: true },
  { key: 'status', label: t('common.status.label'), sortable: true },
  { key: 'linkedCount', label: t('hotels.hotelBase.linkedPartners'), sortable: false }
])

// Debounce search
let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    fetchHotels()
  }, 300)
}

// Fetch base hotels
const fetchHotels = async () => {
  const params = {
    page: pagination.page,
    limit: pagination.limit
  }
  if (searchQuery.value) params.search = searchQuery.value
  if (filters.stars) params.stars = filters.stars
  if (filters.city) params.city = filters.city
  if (filters.status) params.status = filters.status

  await executeLoad(
    () => hotelService.getBaseHotels(params),
    {
      onSuccess: response => {
        if (response.success) {
          hotels.value = response.data.items
          pagination.total = response.data.pagination.total
          pagination.pages = response.data.pagination.pages
        }
      },
      onError: () => {
        toast.error(t('common.fetchError'))
      }
    }
  )
}

// Fetch cities for filter
const fetchCities = async () => {
  await executeCities(
    () => hotelService.getCities(),
    {
      onSuccess: response => {
        if (response.success) {
          cities.value = response.data.map(c => c.city).filter(Boolean)
        }
      },
      onError: error => {
        console.error('Failed to fetch cities', error)
      }
    }
  )
}

// Handle DataTable page change
const handlePageChange = ({ page, perPage }) => {
  pagination.page = page
  if (perPage) pagination.limit = perPage
  fetchHotels()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Open create modal / navigate to create page
const openCreateModal = () => {
  // Navigate to hotel detail page with base type
  router.push({ name: 'hotel-base-new' })
}

// Edit hotel
const editHotel = hotel => {
  router.push({ name: 'hotel-base-detail', params: { id: hotel._id } })
}

// Handle AI imported hotel
const handleAIImported = hotel => {
  showAIImporter.value = false
  // Navigate to edit the newly created hotel
  router.push({ name: 'hotel-base-detail', params: { id: hotel._id } })
}

// Confirm delete
const confirmDelete = hotel => {
  if (hotel.linkedCount > 0) {
    toast.warning(t('hotels.hotelBase.cannotDeleteWithLinked'))
    return
  }
  hotelToDelete.value = hotel
  showDeleteModal.value = true
}

// Delete hotel
const deleteHotel = async () => {
  if (!hotelToDelete.value) return

  await executeDelete(
    () => hotelService.deleteBaseHotel(hotelToDelete.value._id),
    {
      successMessage: 'hotels.deleteSuccess',
      onSuccess: () => {
        showDeleteModal.value = false
        hotelToDelete.value = null
        fetchHotels()
      },
      onError: error => {
        const message = error.response?.data?.message
        if (message === 'CANNOT_DELETE_WITH_LINKED') {
          toast.error(t('hotels.hotelBase.cannotDeleteWithLinked'))
        } else {
          toast.error(t('common.operationFailed'))
        }
      }
    }
  )
}

// Get main image from hotel
const getMainImage = hotel => {
  if (!hotel.images || hotel.images.length === 0) return null
  const mainImage = hotel.images.find(img => img.isMain)
  return mainImage?.url || hotel.images[0]?.url
}

// getImageUrl imported from @/utils/imageUrl

// Get status badge class
const getStatusClass = status => {
  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  switch (status) {
    case 'active':
      return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`
    case 'draft':
      return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`
    case 'inactive':
      return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
    default:
      return `${baseClass} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400`
  }
}

// Get partner status badge class
const getPartnerStatusClass = status => {
  const baseClass = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium'
  if (status === 'active') {
    return `${baseClass} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300`
  }
  return `${baseClass} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400`
}

// Show linked partners modal
const showLinkedPartners = async hotel => {
  selectedHotel.value = hotel
  showPartnersModal.value = true
  linkedPartners.value = []

  await executePartners(
    () => hotelService.getLinkedPartners(hotel._id),
    {
      onSuccess: response => {
        if (response.success) {
          linkedPartners.value = response.data.partners
        }
      },
      onError: () => {
        toast.error(t('common.fetchError'))
      }
    }
  )
}

onMounted(() => {
  fetchHotels()
  fetchCities()
})
</script>
