<template>
  <div class="bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        :items="[{ label: $t('common.home'), to: '/' }, { label: $t('common.destinations') }]"
        class="mb-4"
      />

      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        {{ $t('common.destinations') }}
      </h1>
      <p class="text-gray-500 mb-8">
        {{ $t('sections.popularDestinations') }}
      </p>

      <div
        v-if="destinations.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <NuxtLink
          v-for="dest in destinations"
          :key="dest.city"
          :to="`/destinations/${dest.city}`"
          class="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 aspect-[4/3]"
        >
          <img
            v-if="dest.photo?.link"
            :src="imageUrl(dest.photo)"
            :alt="dest.city"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
          >
            <svg
              class="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
          </div>
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
          />
          <div class="absolute bottom-0 left-0 right-0 p-4">
            <h2 class="text-lg font-bold text-white">{{ dest.city }}</h2>
            <p v-if="dest.country" class="text-sm text-white/80">{{ dest.country }}</p>
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

const destinations = computed(() => storefront.locationSection?.items || [])

useSeo({
  title: $t('common.destinations'),
  description: $t('sections.popularDestinations')
})
</script>
