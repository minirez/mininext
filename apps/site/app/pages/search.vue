<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Search bar -->
    <div class="bg-white border-b border-gray-200 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SearchBar />
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-xl font-bold text-gray-900 mb-4">
        {{ $t('filter.results', { n: totalHotels }) }}
      </h1>

      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton v-for="i in 6" :key="i" height="320px" rounded="rounded-xl" />
      </div>
      <div v-else-if="hotels.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <HotelCard v-for="hotel in hotels" :key="hotel.slug" :hotel="hotel" />
      </div>
      <EmptyState v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const searchStore = useSearchStore()
const { hotels, loading, totalHotels, fetchHotels } = useHotels()

onMounted(() => {
  if (route.query.city) searchStore.city = route.query.city as string
  if (route.query.checkIn) searchStore.checkIn = route.query.checkIn as string
  if (route.query.checkOut) searchStore.checkOut = route.query.checkOut as string
  if (route.query.adults) searchStore.adults = Number(route.query.adults)
  fetchHotels()
})

const { t: $t } = useI18n()
useSeo({ title: $t('common.search'), noindex: true })
</script>
