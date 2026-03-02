<template>
  <Carousel
    :title="title || $t('sections.popularDestinations')"
    :description="description"
    :show-arrows="items.length > 3"
    :gap="20"
    bg-class="bg-white"
  >
    <NuxtLink
      v-for="(item, i) in items"
      :key="i"
      :to="item.link || `/destinations/${encodeURIComponent(item.city)}`"
      class="group flex-shrink-0 w-[300px] sm:w-[340px] rounded-2xl overflow-hidden relative h-[200px] snap-start"
    >
      <img
        v-if="item.photo?.link"
        :src="imageUrl(item.photo)"
        :alt="item.city"
        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      <div class="absolute bottom-0 left-0 p-5">
        <h3 class="text-white font-bold text-lg">{{ item.city }}</h3>
        <p v-if="item.country" class="text-white/70 text-sm mt-0.5">{{ item.country }}</p>
        <p v-if="item.hotelCount" class="text-white/60 text-xs mt-1">
          {{ item.hotelCount }} {{ $t('common.hotels') }}
        </p>
      </div>
    </NuxtLink>
  </Carousel>
</template>

<script setup lang="ts">
const { imageUrl } = useImageUrl()

defineProps<{
  title?: string
  description?: string
  items: any[]
}>()
</script>
