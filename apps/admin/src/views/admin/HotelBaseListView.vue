<template>
  <div>
    <!-- Action Buttons -->
    <div class="mb-6 flex justify-end gap-2">
      <button @click="showAIImporter = true" class="btn-secondary flex items-center gap-2">
        <span class="material-icons">auto_awesome</span>
        {{ $t('hotels.aiImport.button') }}
      </button>
      <button @click="openCreateModal" class="btn-primary flex items-center gap-2">
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
      <!-- Loading -->
      <div v-if="loading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="hotels.length === 0" class="p-12 text-center">
        <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">domain</span>
        <p class="mt-4 text-gray-500 dark:text-slate-400">{{ $t('hotels.hotelBase.noBaseHotels') }}</p>
      </div>

      <!-- Table -->
      <table v-else class="w-full">
        <thead class="bg-gray-50 dark:bg-slate-700">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              {{ $t('hotels.name') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              {{ $t('hotels.location') }}
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              {{ $t('hotels.stars') }}
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              {{ $t('common.status.label') }}
            </th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              {{ $t('hotels.hotelBase.linkedPartners') }}
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              {{ $t('common.actions') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
          <tr
            v-for="hotel in hotels"
            :key="hotel._id"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <!-- Hotel Info -->
            <td class="px-4 py-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    v-if="getMainImage(hotel)"
                    :src="getImageUrl(getMainImage(hotel))"
                    :alt="hotel.name"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <span class="material-icons text-lg text-gray-400 dark:text-slate-500">hotel</span>
                  </div>
                </div>
                <div>
                  <h4 class="font-medium text-gray-800 dark:text-white">{{ hotel.name }}</h4>
                  <span
                    v-if="hotel.category"
                    class="text-xs text-gray-500 dark:text-slate-400"
                  >
                    {{ $t(`hotels.categories.${hotel.category}`) }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Location -->
            <td class="px-4 py-4">
              <span class="text-sm text-gray-600 dark:text-slate-400">
                {{ hotel.address?.city }}, {{ hotel.address?.country }}
              </span>
            </td>

            <!-- Stars -->
            <td class="px-4 py-4 text-center">
              <div class="flex justify-center">
                <span
                  v-for="i in hotel.stars"
                  :key="i"
                  class="material-icons text-sm text-yellow-400"
                >star</span>
              </div>
            </td>

            <!-- Status -->
            <td class="px-4 py-4 text-center">
              <span :class="getStatusClass(hotel.status)">
                {{ $t(`hotels.status${hotel.status?.charAt(0).toUpperCase()}${hotel.status?.slice(1)}`) }}
              </span>
            </td>

            <!-- Linked Partners Count -->
            <td class="px-4 py-4 text-center">
              <button
                v-if="hotel.linkedCount > 0"
                @click="showLinkedPartners(hotel)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
              >
                <span class="material-icons text-sm mr-1">link</span>
                {{ hotel.linkedCount }}
              </button>
              <span v-else class="text-gray-400 dark:text-slate-500 text-sm">-</span>
            </td>

            <!-- Actions -->
            <td class="px-4 py-4 text-right">
              <div class="flex justify-end gap-2">
                <button
                  @click="editHotel(hotel)"
                  class="p-2 text-gray-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  :title="$t('common.edit')"
                >
                  <span class="material-icons">edit</span>
                </button>
                <button
                  @click="confirmDelete(hotel)"
                  :disabled="hotel.linkedCount > 0"
                  class="p-2 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="hotel.linkedCount > 0 ? $t('hotels.hotelBase.cannotDeleteWithLinked') : $t('common.delete')"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="px-4 py-3 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
        <span class="text-sm text-gray-600 dark:text-slate-400">
          {{ $t('common.showingOf', { from: (pagination.page - 1) * pagination.limit + 1, to: Math.min(pagination.page * pagination.limit, pagination.total), total: pagination.total }) }}
        </span>
        <div class="flex gap-2">
          <button
            :disabled="pagination.page <= 1"
            @click="changePage(pagination.page - 1)"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="material-icons">chevron_left</span>
          </button>
          <button
            :disabled="pagination.page >= pagination.pages"
            @click="changePage(pagination.page + 1)"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
      </div>
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
            @click="showDeleteModal = false"
            class="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="deleteHotel"
            :disabled="deleting"
            class="btn-danger flex items-center gap-2"
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

      <div v-else-if="linkedPartners.length === 0" class="py-8 text-center text-gray-500 dark:text-slate-400">
        {{ $t('hotels.hotelBase.noLinkedPartners') }}
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-slate-700">
        <div
          v-for="item in linkedPartners"
          :key="item.hotelId"
          class="py-3 flex items-center gap-3"
        >
          <!-- Partner Logo -->
          <div class="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
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
            {{ item.partner?.status === 'active' ? $t('common.status.active') : $t('common.status.inactive') }}
          </span>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <button
            type="button"
            @click="showPartnersModal = false"
            class="btn-secondary"
          >
            {{ $t('common.close') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import hotelService from '@/services/hotelService'
import Modal from '@/components/common/Modal.vue'
import HotelAIImporter from '@/components/hotels/HotelAIImporter.vue'
import { getImageUrl } from '@/utils/imageUrl'

const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const loading = ref(false)
const deleting = ref(false)
const searchQuery = ref('')
const hotels = ref([])
const cities = ref([])
const showDeleteModal = ref(false)
const hotelToDelete = ref(null)
const showAIImporter = ref(false)
const showPartnersModal = ref(false)
const selectedHotel = ref(null)
const linkedPartners = ref([])
const loadingPartners = ref(false)

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
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (filters.stars) params.stars = filters.stars
    if (filters.city) params.city = filters.city
    if (filters.status) params.status = filters.status

    const response = await hotelService.getBaseHotels(params)
    if (response.success) {
      hotels.value = response.data.items
      pagination.total = response.data.pagination.total
      pagination.pages = response.data.pagination.pages
    }
  } catch (error) {
    toast.error(t('common.fetchError'))
  } finally {
    loading.value = false
  }
}

// Fetch cities for filter
const fetchCities = async () => {
  try {
    const response = await hotelService.getCities()
    if (response.success) {
      cities.value = response.data.map(c => c.city).filter(Boolean)
    }
  } catch (error) {
    console.error('Failed to fetch cities', error)
  }
}

// Change page
const changePage = (page) => {
  pagination.page = page
  fetchHotels()
}

// Open create modal / navigate to create page
const openCreateModal = () => {
  // Navigate to hotel detail page with base type
  router.push({ name: 'hotel-base-new' })
}

// Edit hotel
const editHotel = (hotel) => {
  router.push({ name: 'hotel-base-detail', params: { id: hotel._id } })
}

// Handle AI imported hotel
const handleAIImported = (hotel) => {
  showAIImporter.value = false
  // Navigate to edit the newly created hotel
  router.push({ name: 'hotel-base-detail', params: { id: hotel._id } })
}

// Confirm delete
const confirmDelete = (hotel) => {
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

  deleting.value = true
  try {
    const response = await hotelService.deleteBaseHotel(hotelToDelete.value._id)
    if (response.success) {
      toast.success(t('hotels.deleteSuccess'))
      showDeleteModal.value = false
      hotelToDelete.value = null
      fetchHotels()
    }
  } catch (error) {
    const message = error.response?.data?.message
    if (message === 'CANNOT_DELETE_WITH_LINKED') {
      toast.error(t('hotels.hotelBase.cannotDeleteWithLinked'))
    } else {
      toast.error(t('common.operationFailed'))
    }
  } finally {
    deleting.value = false
  }
}

// Get main image from hotel
const getMainImage = (hotel) => {
  if (!hotel.images || hotel.images.length === 0) return null
  const mainImage = hotel.images.find(img => img.isMain)
  return mainImage?.url || hotel.images[0]?.url
}

// getImageUrl imported from @/utils/imageUrl

// Get status badge class
const getStatusClass = (status) => {
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
const getPartnerStatusClass = (status) => {
  const baseClass = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium'
  if (status === 'active') {
    return `${baseClass} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300`
  }
  return `${baseClass} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400`
}

// Show linked partners modal
const showLinkedPartners = async (hotel) => {
  selectedHotel.value = hotel
  showPartnersModal.value = true
  loadingPartners.value = true
  linkedPartners.value = []

  try {
    const response = await hotelService.getLinkedPartners(hotel._id)
    if (response.success) {
      linkedPartners.value = response.data.partners
    }
  } catch (error) {
    toast.error(t('common.fetchError'))
  } finally {
    loadingPartners.value = false
  }
}

onMounted(() => {
  fetchHotels()
  fetchCities()
})
</script>
