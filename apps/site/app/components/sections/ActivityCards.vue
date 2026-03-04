<template>
  <Carousel
    :title="title || $t('sections.activities')"
    :description="description"
    :show-arrows="items.length > 3"
    :show-dots="items.length > 4"
    :gap="30"
    bg-class="bg-white"
  >
    <NuxtLink
      v-for="(item, i) in items"
      :key="i"
      :to="item.link || '#'"
      class="group flex-shrink-0 w-[260px] sm:w-[280px] snap-start"
    >
      <!-- Image: 1:1 square -->
      <div class="relative rounded overflow-hidden" style="aspect-ratio: 1/1">
        <img
          v-if="item.photo?.link || item.image"
          :src="imageUrl(item.photo || item.image)"
          :alt="ml(item.title) || item.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div v-else class="w-full h-full bg-gray-100" />

        <!-- Badge ribbon -->
        <span
          v-if="item.category || item.tag"
          class="absolute top-3 left-0 py-1.5 px-4 rounded-r text-xs font-medium uppercase text-white bg-site-primary"
        >
          {{ item.category || item.tag }}
        </span>
      </div>

      <!-- Content -->
      <div class="mt-2.5">
        <h4 class="text-lg font-medium text-gray-900 group-hover:underline line-clamp-1">
          {{ ml(item.title) || item.name }}
        </h4>
        <p v-if="item.location" class="text-sm text-gray-500 mt-1">{{ item.location }}</p>
        <div v-if="item.price" class="flex items-center gap-1 mt-2">
          <span class="text-sm text-gray-500">{{ $t('common.from') }}</span>
          <span class="font-medium text-site-primary">{{ item.price }}</span>
        </div>
      </div>
    </NuxtLink>
  </Carousel>
</template>

<script setup lang="ts">
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()

defineProps<{
  title?: string
  description?: string
  items: any[]
}>()
</script>
