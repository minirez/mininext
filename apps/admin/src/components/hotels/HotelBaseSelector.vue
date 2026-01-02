<template>
  <Modal
    :model-value="show"
    :title="$t('hotels.hotelBase.selectBaseHotel')"
    size="xl"
    @close="$emit('close')"
  >
    <!-- Search and Filters -->
    <div class="mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <span class="material-icons text-xl">search</span>
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
      </div>
    </div>

    <!-- Hotels List -->
    <div class="min-h-[300px] max-h-[400px] overflow-y-auto">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>

      <!-- No Results -->
      <div v-else-if="hotels.length === 0" class="text-center py-12">
        <span class="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-2">domain_disabled</span>
        <p class="text-gray-500 dark:text-slate-400">{{ $t('hotels.hotelBase.noBaseHotels') }}</p>
      </div>

      <!-- Hotels Grid -->
      <div v-else class="space-y-3">
        <button
          v-for="hotel in hotels"
          :key="hotel._id"
          type="button"
          @click="selectHotel(hotel)"
          class="w-full p-4 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-left group"
          :class="{ 'ring-2 ring-purple-500 border-purple-500': selectedHotel?._id === hotel._id }"
        >
          <div class="flex items-center gap-4">
            <!-- Hotel Image -->
            <div class="w-20 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
              <img
                v-if="getMainImage(hotel)"
                :src="getImageUrl(getMainImage(hotel))"
                :alt="hotel.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="material-icons text-2xl text-gray-400 dark:text-slate-500">hotel</span>
              </div>
            </div>

            <!-- Hotel Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <!-- Stars -->
                <div class="flex">
                  <span
                    v-for="i in hotel.stars"
                    :key="i"
                    class="material-icons text-sm text-yellow-400"
                  >star</span>
                </div>
                <!-- Category Badge -->
                <span
                  v-if="hotel.category"
                  class="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                >
                  {{ $t(`hotels.categories.${hotel.category}`) }}
                </span>
              </div>

              <h4 class="font-semibold text-gray-800 dark:text-white truncate">
                {{ hotel.name }}
              </h4>

              <p class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1">
                <span class="material-icons text-sm">location_on</span>
                {{ hotel.address?.city }}, {{ hotel.address?.country }}
              </p>
            </div>

            <!-- Select Indicator -->
            <div class="flex-shrink-0">
              <div
                v-if="selectedHotel?._id === hotel._id"
                class="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center"
              >
                <span class="material-icons text-white text-lg">check</span>
              </div>
              <div
                v-else
                class="w-8 h-8 border-2 border-gray-300 dark:border-slate-600 rounded-full group-hover:border-purple-400 transition-colors"
              ></div>
            </div>
          </div>
        </button>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="flex justify-center items-center gap-2 mt-6">
        <button
          type="button"
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span class="material-icons">chevron_left</span>
        </button>
        <span class="text-sm text-gray-600 dark:text-slate-400">
          {{ pagination.page }} / {{ pagination.pages }}
        </span>
        <button
          type="button"
          :disabled="pagination.page >= pagination.pages"
          @click="changePage(pagination.page + 1)"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span class="material-icons">chevron_right</span>
        </button>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          :disabled="!selectedHotel || linking"
          @click="linkHotel"
          class="btn-primary flex items-center gap-2"
        >
          <span v-if="linking" class="animate-spin material-icons text-lg">refresh</span>
          <span>{{ $t('common.select') }}</span>
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import hotelService from '@/services/hotelService'
import { getImageUrl } from '@/utils/imageUrl'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'linked'])

const toast = useToast()
const { t } = useI18n()

const loading = ref(false)
const linking = ref(false)
const searchQuery = ref('')
const hotels = ref([])
const selectedHotel = ref(null)

const filters = reactive({
  stars: ''
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

// Fetch available base hotels
const fetchHotels = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (filters.stars) params.stars = filters.stars

    const response = await hotelService.getAvailableBases(params)
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

// Change page
const changePage = (page) => {
  pagination.page = page
  fetchHotels()
}

// Select hotel
const selectHotel = (hotel) => {
  selectedHotel.value = hotel
}

// Link hotel to partner
const linkHotel = async () => {
  if (!selectedHotel.value) return

  linking.value = true
  try {
    const response = await hotelService.linkToBase(selectedHotel.value._id)
    if (response.success) {
      toast.success(t('hotels.hotelBase.linkSuccess'))
      emit('linked', response.data)
    }
  } catch (error) {
    const message = error.response?.data?.message
    if (message === 'BASE_ALREADY_LINKED') {
      toast.error(t('hotels.hotelBase.alreadyLinked'))
    } else {
      toast.error(t('common.operationFailed'))
    }
  } finally {
    linking.value = false
  }
}

// Get main image from hotel
const getMainImage = (hotel) => {
  if (!hotel.images || hotel.images.length === 0) return null
  const mainImage = hotel.images.find(img => img.isMain)
  return mainImage?.url || hotel.images[0]?.url
}

// getImageUrl imported from @/utils/imageUrl

// Watch for modal open
watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedHotel.value = null
    pagination.page = 1
    searchQuery.value = ''
    filters.stars = ''
    fetchHotels()
  }
})

onMounted(() => {
  if (props.show) {
    fetchHotels()
  }
})
</script>
