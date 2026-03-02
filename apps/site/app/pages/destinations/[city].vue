<template>
  <div class="bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        :items="[
          { label: $t('common.home'), to: '/' },
          { label: $t('common.destinations'), to: '/hotels' },
          { label: city, to: `/destinations/${city}` }
        ]"
        class="mb-4"
      />

      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{{ city }}</h1>
      <p class="text-gray-500 mb-8">
        {{ $t('filter.results', { n: totalHotels }) }}
      </p>

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
const city = decodeURIComponent(route.params.city as string)
const searchStore = useSearchStore()
const { hotels, loading, totalHotels, fetchHotels } = useHotels()

onMounted(() => {
  searchStore.city = city
  fetchHotels({ city })
})

const { t: $t } = useI18n()

useSeo({
  title: `${city} ${$t('common.hotels')}`,
  description: `${city} ${$t('common.hotels')}`
})
</script>
