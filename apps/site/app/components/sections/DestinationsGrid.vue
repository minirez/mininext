<template>
  <Carousel
    :title="title || $t('sections.popularDestinations')"
    :description="description"
    :show-arrows="items.length > 3"
    :show-dots="false"
    :gap="30"
    bg-class="bg-white"
  >
    <NuxtLink
      v-for="(item, i) in items"
      :key="i"
      :to="item.link || `/destinations/${encodeURIComponent(item.city)}`"
      class="group relative rounded overflow-hidden flex-shrink-0 w-[220px] sm:w-[260px] lg:w-[280px] snap-start"
      style="aspect-ratio: 3/4"
    >
      <!-- Image -->
      <img
        v-if="item.photo?.link"
        :src="imageUrl(item.photo)"
        :alt="item.city"
        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div
        v-else
        class="absolute inset-0 bg-gradient-to-br from-site-primary to-site-primary-dark"
      />

      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      <!-- Content: country at top, city + button at bottom -->
      <div class="absolute inset-0 flex flex-col justify-between text-center pt-8 pb-5 px-5">
        <div class="text-sm text-white">{{ item.country }}</div>
        <div>
          <h3 class="text-[26px] md:text-xl leading-tight text-white font-semibold mb-5">
            {{ item.city }}
          </h3>
          <button
            class="w-full h-[60px] rounded bg-white text-gray-900 font-medium hover:bg-site-primary hover:text-white transition-colors"
          >
            {{ $t('common.explore') || 'Discover' }}
          </button>
        </div>
      </div>
    </NuxtLink>
  </Carousel>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  items: any[]
}>()

const { imageUrl } = useImageUrl()
</script>
