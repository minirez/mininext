<template>
  <section class="py-12 sm:py-16 bg-gray-50/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">
          {{ title || $t('sections.cruiseDeals') }}
        </h2>
        <p v-if="description" class="mt-2 text-gray-500 max-w-2xl mx-auto">{{ description }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(cruise, i) in items.slice(0, 4)"
          :key="i"
          class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
          :class="`stagger-${i + 1}`"
        >
          <!-- Ship image -->
          <div class="aspect-[4/3] relative overflow-hidden">
            <img
              v-if="cruise.image || cruise.photo?.link"
              :src="cruise.image || cruise.photo?.link"
              :alt="cruise.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div v-if="cruise.duration" class="absolute top-3 left-3">
              <span
                class="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full"
              >
                {{ cruise.duration }}
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4">
            <h3
              class="font-semibold text-gray-900 line-clamp-1 group-hover:text-site-primary transition-colors"
            >
              {{ cruise.name }}
            </h3>

            <!-- Route -->
            <p v-if="cruise.route" class="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <svg
                class="w-3.5 h-3.5 shrink-0"
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
              <span class="line-clamp-1">{{ cruise.route }}</span>
            </p>

            <!-- Ship -->
            <p v-if="cruise.ship" class="text-xs text-gray-400 mt-1">{{ cruise.ship }}</p>

            <!-- Price -->
            <div
              v-if="cruise.price"
              class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between"
            >
              <span class="text-xs text-gray-400">{{ $t('common.from') }}</span>
              <span class="text-lg font-bold text-site-primary">{{ cruise.price }}</span>
            </div>
          </div>
        </div>
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
