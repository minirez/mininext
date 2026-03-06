<template>
  <section class="py-12 sm:py-16 bg-gray-50/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Left: Campaign banner (2 cols) -->
        <div
          v-if="campaign"
          class="lg:col-span-2 relative rounded-2xl overflow-hidden min-h-[300px] lg:min-h-0 group"
        >
          <img
            v-if="campaign.photo?.link"
            :src="campaign.photo.link"
            :alt="ml(campaign.title)"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
          />
          <div class="absolute bottom-0 left-0 right-0 p-6">
            <h3 class="text-white text-xl font-bold mb-2">{{ ml(campaign.title) }}</h3>
            <p v-if="ml(campaign.description)" class="text-white/80 text-sm mb-4">
              {{ ml(campaign.description) }}
            </p>
            <NuxtLink
              v-if="campaign.url"
              :to="campaign.url"
              class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-semibold rounded-full text-sm hover:bg-gray-100 transition-colors"
            >
              {{ $t('common.explore') }}
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </NuxtLink>
          </div>
        </div>

        <!-- Right: Tour cards (3 cols) -->
        <div class="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NuxtLink
            v-for="(tour, i) in tours.slice(0, 3)"
            :key="i"
            :to="`/tours/${tour.slug || tour.id}`"
            class="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div class="aspect-[3/4] relative overflow-hidden">
              <img
                v-if="tourImage(tour)"
                :src="tourImage(tour)"
                :alt="tour.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <h3 class="text-white font-semibold text-sm">{{ tour.name }}</h3>
                <p v-if="tour.price" class="text-white/80 text-xs mt-1">{{ tour.price }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()

defineProps<{
  campaign?: any
  tours: any[]
}>()

function tourImage(tour: any): string {
  if (tour.image) return imageUrl(tour.image)
  if (tour.photo?.link) return imageUrl(tour.photo)
  if (tour.gallery?.[0]?.url) return imageUrl(tour.gallery[0].url)
  return ''
}
</script>
