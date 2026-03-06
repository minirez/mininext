<template>
  <div class="bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        :items="[
          { label: $t('common.home'), to: '/' },
          { label: $t('common.tours'), to: '/tours' }
        ]"
        class="mb-4"
      />

      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">{{ $t('common.tours') }}</h1>

      <div
        v-if="storefront.toursSection?.items?.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <NuxtLink
          v-for="(tour, i) in storefront.toursSection.items"
          :key="i"
          :to="`/tours/${tour.slug || tour.id}`"
          class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="aspect-video overflow-hidden">
            <img
              v-if="tourImage(tour)"
              :src="tourImage(tour)"
              :alt="tour.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div v-else class="w-full h-full bg-gray-100" />
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 group-hover:text-site-primary transition-colors">
              {{ tour.name }}
            </h3>
            <p v-if="tour.location" class="text-sm text-gray-500 mt-1">{{ tour.location }}</p>
          </div>
        </NuxtLink>
      </div>

      <EmptyState v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { imageUrl } = useImageUrl()

const { t: $t } = useI18n()
useSeo({ title: $t('common.tours') })

function tourImage(tour: any): string {
  if (tour.image) return imageUrl(tour.image)
  if (tour.photo?.link) return imageUrl(tour.photo)
  if (tour.gallery?.[0]?.url) return imageUrl(tour.gallery[0].url)
  return ''
}
</script>
