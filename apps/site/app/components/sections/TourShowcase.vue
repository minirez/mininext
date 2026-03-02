<template>
  <Carousel
    :title="title || $t('sections.featuredTours')"
    :description="description"
    view-all-link="/tours"
    :show-arrows="items.length > 3"
    :show-dots="items.length > 4"
    :gap="20"
    bg-class="bg-white"
  >
    <NuxtLink
      v-for="(tour, i) in items"
      :key="i"
      :to="`/tours/${tour.slug || tour.id}`"
      class="group flex-shrink-0 w-[260px] sm:w-[280px] rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 snap-start"
    >
      <!-- Image -->
      <div class="aspect-[4/3] relative overflow-hidden">
        <img
          v-if="tour.image || tour.photo?.link"
          :src="tour.image || tour.photo?.link"
          :alt="tour.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <!-- Duration badge -->
        <div v-if="tour.duration" class="absolute top-3 left-3">
          <span
            class="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {{ tour.duration }}
          </span>
        </div>

        <!-- Type badge -->
        <div v-if="tour.type" class="absolute top-3 right-3">
          <span
            class="px-2.5 py-1 bg-site-primary/90 backdrop-blur-sm text-xs font-medium text-white rounded-full"
          >
            {{ tour.type }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        <h3
          class="font-semibold text-gray-900 line-clamp-1 group-hover:text-site-primary transition-colors"
        >
          {{ tour.name }}
        </h3>
        <p v-if="tour.location" class="text-sm text-gray-500 mt-1 flex items-center gap-1">
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z"
            />
          </svg>
          {{ tour.location }}
        </p>

        <!-- Price -->
        <div v-if="tour.price" class="mt-3 pt-3 border-t border-gray-100">
          <span class="text-lg font-bold text-site-primary">{{ tour.price }}</span>
          <span v-if="tour.priceUnit" class="text-xs text-gray-400 ml-1"
            >/ {{ tour.priceUnit }}</span
          >
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
