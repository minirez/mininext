<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          :items="[
            { label: $t('common.home'), to: '/' },
            { label: $t('common.hotels'), to: '/hotels' }
          ]"
        />
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mt-3">
          {{ $t('common.hotels') }}
        </h1>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-6 gap-4">
        <p class="text-sm text-gray-500">
          {{ $t('filter.results', { n: totalHotels }) }}
        </p>
        <div class="flex items-center gap-3">
          <SortDropdown v-model="searchStore.sortBy" />
          <button
            @click="ui.toggleMapView()"
            class="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            {{ ui.mapView ? $t('map.showList') : $t('map.showMap') }}
          </button>
          <button
            @click="ui.toggleFilterPanel()"
            class="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            {{ $t('filter.title') }}
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex gap-6">
        <!-- Sidebar (desktop) -->
        <aside class="hidden lg:block w-64 shrink-0 space-y-4">
          <SearchSidebar @search="handleSidebarSearch" />
          <SearchFilters />
        </aside>

        <!-- Hotel grid or map -->
        <div class="flex-1 min-w-0">
          <!-- Map view -->
          <div
            v-if="ui.mapView"
            class="h-[600px] rounded-xl overflow-hidden border border-gray-200"
          >
            <MapView :hotels="hotels" />
          </div>

          <!-- Grid view -->
          <div v-else>
            <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <Skeleton v-for="i in 6" :key="i" height="320px" rounded="rounded-xl" />
            </div>
            <div
              v-else-if="hotels.length"
              class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              <HotelCard
                v-for="hotel in hotels"
                :key="hotel.slug"
                :hotel="hotel"
                :price-data="priceMap[hotel.hotelCode || hotel.slug]"
              />
            </div>
            <EmptyState v-else />
          </div>

          <!-- Pagination -->
          <div class="mt-8">
            <Pagination
              :current-page="searchStore.currentPage"
              :total-pages="totalPages"
              @update:page="changePage"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile filter panel -->
    <Teleport to="body">
      <div
        v-if="ui.filterPanelOpen"
        class="fixed inset-0 z-50 bg-black/50"
        @click.self="ui.toggleFilterPanel()"
      >
        <div class="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold">{{ $t('filter.title') }}</h2>
            <button @click="ui.toggleFilterPanel()" class="p-1 hover:bg-gray-100 rounded">
              {{ $t('common.close') }}
            </button>
          </div>
          <SearchSidebar @search="handleSidebarSearch" class="mb-4" />
          <SearchFilters />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const ui = useUiStore()
const { hotels, loading, totalHotels, totalPages, fetchHotels } = useHotels()
const { priceMap, fetchPricesForHotels, clearPrices } = useHotelPrices()

// Parse query params on load
if (route.query.city) searchStore.city = route.query.city as string
if (route.query.checkIn) searchStore.checkIn = route.query.checkIn as string
if (route.query.checkOut) searchStore.checkOut = route.query.checkOut as string
if (route.query.adults) searchStore.adults = Number(route.query.adults)
if (route.query.children)
  searchStore.children = (route.query.children as string).split(',').map(Number)
if (route.query.stars)
  searchStore.filters.stars = (route.query.stars as string).split(',').map(Number)
if (route.query.page) searchStore.currentPage = Number(route.query.page)

// Fetch on load and filter change
const fetchKey = computed(() =>
  JSON.stringify({
    city: searchStore.city,
    stars: searchStore.filters.stars,
    types: searchStore.filters.types,
    sort: searchStore.sortBy,
    page: searchStore.currentPage
  })
)

watch(fetchKey, () => fetchHotels(), { immediate: true })

// Fetch prices when hotels load and dates are set
watch(
  () => hotels.value,
  list => {
    if (list?.length && searchStore.hasDates) {
      const codes = list.map((h: any) => h.hotelCode || h.slug).filter(Boolean)
      fetchPricesForHotels(codes)
    }
  }
)

function handleSidebarSearch() {
  // Update URL query params
  const q: Record<string, string> = { ...(route.query as Record<string, string>) }
  if (searchStore.checkIn) q.checkIn = searchStore.checkIn
  if (searchStore.checkOut) q.checkOut = searchStore.checkOut
  if (searchStore.adults) q.adults = String(searchStore.adults)
  if (searchStore.children.length) q.children = searchStore.children.join(',')
  router.replace({ query: q })

  // Re-fetch prices
  clearPrices()
  if (hotels.value?.length && searchStore.hasDates) {
    const codes = hotels.value.map((h: any) => h.hotelCode || h.slug).filter(Boolean)
    fetchPricesForHotels(codes)
  }
}

function changePage(page: number) {
  searchStore.currentPage = page
  router.push({ query: { ...route.query, page: String(page) } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const { t: $t } = useI18n()
const partner = usePartnerStore()

// SEO
useSeo({
  title: $t('common.hotels'),
  description: `${$t('common.hotels')} - ${partner.partnerName}`
})
</script>
