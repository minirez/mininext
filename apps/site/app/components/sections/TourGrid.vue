<template>
  <section class="py-12 sm:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div v-if="title" class="mb-8">
        <h2 class="text-3xl font-semibold text-gray-900">{{ title }}</h2>
        <p v-if="description" class="text-gray-500 mt-1">{{ description }}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <NuxtLink
          v-for="(tour, i) in items"
          :key="i"
          :to="`/tours/${tour.slug || tour.id}`"
          class="group"
        >
          <div class="relative rounded overflow-hidden" style="aspect-ratio: 1/1">
            <img
              v-if="tour.image || tour.photo?.link"
              :src="tour.image || tour.photo?.link"
              :alt="tour.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div v-else class="w-full h-full bg-gray-100" />
            <span
              v-if="tour.duration"
              class="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full inline-flex items-center gap-1"
            >
              {{ tour.duration }}
            </span>
          </div>
          <div class="mt-2.5">
            <div class="flex items-center text-sm text-gray-500 leading-snug">
              <span v-if="tour.duration">{{ tour.duration }}</span>
              <span v-if="tour.duration && tour.type" class="mx-2.5 w-[3px] h-[3px] rounded-full bg-gray-400 shrink-0" />
              <span v-if="tour.type">{{ tour.type }}</span>
            </div>
            <h4 class="text-lg font-medium text-gray-900 mt-1 group-hover:underline line-clamp-1">
              {{ tour.name }}
            </h4>
            <p v-if="tour.location" class="text-sm text-gray-500 mt-1">{{ tour.location }}</p>
            <div v-if="tour.price" class="flex items-center gap-1 mt-2">
              <span class="text-sm text-gray-500">{{ $t('common.from') }}</span>
              <span class="font-medium text-site-primary">{{ tour.price }}</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  items: any[]
}>()
</script>
