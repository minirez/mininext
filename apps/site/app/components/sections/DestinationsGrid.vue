<template>
  <Carousel
    :title="title || $t('sections.popularDestinations')"
    :description="description"
    :show-arrows="items.length > 4"
    :show-dots="items.length > 6"
    :gap="16"
    bg-class="bg-white"
  >
    <NuxtLink
      v-for="(item, i) in items"
      :key="i"
      :to="item.link || `/destinations/${encodeURIComponent(item.city)}`"
      class="group relative rounded-2xl overflow-hidden flex-shrink-0 w-[200px] sm:w-[230px] aspect-[3/4] snap-start hover:shadow-xl transition-shadow duration-300"
    >
      <!-- Image -->
      <img
        v-if="item.photo?.link"
        :src="imageUrl(item.photo)"
        :alt="item.city"
        class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
      />
      <div
        v-else
        class="absolute inset-0 bg-gradient-to-br from-site-primary to-site-primary-dark"
      />

      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <!-- Content -->
      <div class="absolute bottom-0 left-0 right-0 p-4">
        <h3 class="text-white font-bold text-base">{{ item.city }}</h3>
        <p v-if="item.country" class="text-white/70 text-sm mt-0.5">{{ item.country }}</p>
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
