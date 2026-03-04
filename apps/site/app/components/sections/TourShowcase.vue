<template>
  <Carousel
    :title="title || $t('sections.featuredTours')"
    :description="description"
    view-all-link="/tours"
    :show-arrows="items.length > 3"
    :show-dots="items.length > 4"
    :gap="30"
    bg-class="bg-white"
  >
    <NuxtLink
      v-for="(tour, i) in items"
      :key="i"
      :to="`/tours/${tour.slug || tour.id}`"
      class="group flex-shrink-0 w-[260px] sm:w-[280px] snap-start"
    >
      <!-- Image: 1:1 square -->
      <div class="relative rounded overflow-hidden" style="aspect-ratio: 1/1">
        <img
          v-if="tour.image || tour.photo?.link"
          :src="tour.image || tour.photo?.link"
          :alt="tour.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div v-else class="w-full h-full bg-gray-100" />

        <!-- Duration badge -->
        <span
          v-if="tour.duration"
          class="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full inline-flex items-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ tour.duration }}
        </span>

        <!-- Type badge -->
        <span
          v-if="tour.type"
          class="absolute top-3 right-3 px-2.5 py-1 bg-site-primary/90 backdrop-blur-sm text-xs font-medium text-white rounded-full"
        >
          {{ tour.type }}
        </span>
      </div>

      <!-- Content -->
      <div class="mt-2.5">
        <!-- Meta line: duration + type with dot separator -->
        <div class="flex items-center text-sm text-gray-500 leading-snug">
          <span v-if="tour.duration">{{ tour.duration }}</span>
          <span v-if="tour.duration && tour.type" class="mx-2.5 w-[3px] h-[3px] rounded-full bg-gray-400 shrink-0" />
          <span v-if="tour.type">{{ tour.type }}</span>
        </div>

        <!-- Title -->
        <h4 class="text-lg font-medium text-gray-900 mt-1 group-hover:underline line-clamp-1">
          {{ tour.name }}
        </h4>

        <!-- Location -->
        <p v-if="tour.location" class="text-sm text-gray-500 mt-1">
          {{ tour.location }}
        </p>

        <!-- Stars -->
        <div v-if="tour.rating || tour.stars" class="flex items-center gap-0.5 mt-1">
          <svg
            v-for="s in 5"
            :key="s"
            class="w-2.5 h-2.5"
            :class="s <= (tour.rating || tour.stars) ? 'text-yellow-400' : 'text-gray-300'"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>

        <!-- Price -->
        <div v-if="tour.price" class="flex items-center gap-1 mt-2">
          <span class="text-sm text-gray-500">{{ $t('common.from') }}</span>
          <span class="font-medium text-site-primary">{{ tour.price }}</span>
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
</script>
