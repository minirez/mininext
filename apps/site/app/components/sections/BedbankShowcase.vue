<template>
  <section class="py-12 sm:py-16 bg-gray-50/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-end justify-between mb-8">
        <div>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">
            {{ title || $t('sections.popularHotels') }}
          </h2>
          <p v-if="description" class="mt-2 text-gray-500">{{ description }}</p>
        </div>
        <NuxtLink
          to="/hotels"
          class="hidden sm:inline-flex text-sm font-medium text-site-primary hover:text-site-primary-dark transition-colors"
        >
          {{ $t('common.viewAll') }} &rarr;
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <HotelCard
          v-for="hotel in items.slice(0, 8)"
          :key="hotel.id || hotel.slug"
          :hotel="hotel"
        />
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
