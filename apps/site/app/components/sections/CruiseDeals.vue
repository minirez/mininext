<template>
  <Carousel
    :title="title || $t('sections.cruiseDeals')"
    :description="description"
    :show-arrows="items.length > 3"
    :show-dots="items.length > 4"
    :gap="30"
    bg-class="bg-white"
  >
    <div
      v-for="(cruise, i) in items"
      :key="i"
      class="group flex-shrink-0 w-[260px] sm:w-[280px] snap-start"
    >
      <!-- Image: 6:5 aspect ratio -->
      <div class="relative rounded overflow-hidden" style="aspect-ratio: 6/5">
        <img
          v-if="cruise.image || cruise.photo?.link"
          :src="cruise.image || cruise.photo?.link"
          :alt="cruise.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div v-else class="w-full h-full bg-gray-100" />
      </div>

      <!-- Content -->
      <div class="mt-2.5">
        <h4 class="text-lg font-medium text-gray-900 line-clamp-1">{{ cruise.name }}</h4>

        <!-- Route: departure → arrival -->
        <div v-if="cruise.departure || cruise.arrival || cruise.route" class="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
          <template v-if="cruise.departure && cruise.arrival">
            <span>{{ cruise.departure }}</span>
            <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span>{{ cruise.arrival }}</span>
          </template>
          <span v-else>{{ cruise.route }}</span>
        </div>

        <!-- Duration -->
        <div v-if="cruise.duration" class="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {{ cruise.duration }}
        </div>

        <!-- Price -->
        <div v-if="cruise.price" class="flex items-center gap-1 mt-2">
          <span class="text-sm text-gray-500">{{ $t('common.from') }}</span>
          <span class="font-medium text-site-primary">{{ cruise.price }}</span>
        </div>
      </div>
    </div>
  </Carousel>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  items: any[]
}>()
</script>
