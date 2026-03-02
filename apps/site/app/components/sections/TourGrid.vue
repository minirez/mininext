<template>
  <section class="py-12 sm:py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">
          {{ title || $t('sections.featuredTours') }}
        </h2>
        <p v-if="description" class="mt-2 text-gray-500 max-w-2xl mx-auto">{{ description }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="(tour, i) in items.slice(0, 6)"
          :key="i"
          :to="`/tours/${tour.slug || tour.id}`"
          class="group rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
          :class="`stagger-${Math.min(i + 1, 6)}`"
        >
          <div class="aspect-[16/10] relative overflow-hidden">
            <img
              v-if="tour.image || tour.photo?.link"
              :src="tour.image || tour.photo?.link"
              :alt="tour.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div v-if="tour.duration" class="absolute top-3 left-3">
              <span
                class="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full"
              >
                {{ tour.duration }}
              </span>
            </div>
          </div>
          <div class="p-5">
            <h3
              class="font-semibold text-gray-900 line-clamp-1 group-hover:text-site-primary transition-colors"
            >
              {{ tour.name }}
            </h3>
            <p v-if="tour.location" class="text-sm text-gray-500 mt-1">{{ tour.location }}</p>
            <div v-if="tour.price" class="mt-3 pt-3 border-t border-gray-100">
              <span class="text-lg font-bold text-site-primary">{{ tour.price }}</span>
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
