<template>
  <section class="py-12 sm:py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div v-if="title" class="text-center mb-10">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ title }}</h2>
        <p v-if="description" class="mt-2 text-gray-500 max-w-2xl mx-auto">{{ description }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="(item, i) in items.slice(0, 3)"
          :key="i"
          :to="item.link || '#'"
          class="group relative rounded-2xl overflow-hidden h-[300px] sm:h-[340px] animate-fade-in-up"
          :class="`stagger-${i + 1}`"
        >
          <img
            v-if="item.photo?.link"
            :src="imageUrl(item.photo)"
            :alt="ml(item.title)"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          />

          <div class="absolute bottom-0 left-0 right-0 p-6">
            <span
              v-if="item.category"
              class="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-xs font-medium text-white rounded-full mb-3"
            >
              {{ item.category }}
            </span>
            <h3 class="text-white text-lg font-bold mb-2">{{ ml(item.title) }}</h3>
            <span
              class="inline-flex items-center gap-1.5 text-white/90 text-sm font-medium group-hover:gap-2.5 transition-all"
            >
              {{ $t('common.explore') }}
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
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
