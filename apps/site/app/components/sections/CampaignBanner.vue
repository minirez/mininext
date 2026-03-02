<template>
  <section class="py-12 sm:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        v-if="items.length === 1"
        class="relative rounded-3xl overflow-hidden h-[300px] sm:h-[360px] group"
      >
        <img
          v-if="items[0].photo?.link"
          :src="items[0].photo.link"
          :alt="ml(items[0].title)"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div class="absolute inset-0 flex items-center">
          <div class="px-8 sm:px-12 max-w-lg">
            <h3 class="text-white text-2xl sm:text-3xl font-bold mb-3">{{ ml(items[0].title) }}</h3>
            <p v-if="ml(items[0].description)" class="text-white/80 text-sm sm:text-base mb-5">
              {{ ml(items[0].description) }}
            </p>
            <NuxtLink
              v-if="items[0].url"
              :to="items[0].url"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-semibold rounded-full text-sm hover:bg-gray-100 transition-colors"
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
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NuxtLink
          v-for="(item, i) in items.slice(0, 4)"
          :key="i"
          :to="item.url || '#'"
          class="group relative rounded-2xl overflow-hidden h-[220px] sm:h-[260px]"
        >
          <img
            v-if="item.photo?.link"
            :src="item.photo.link"
            :alt="ml(item.title)"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />
          <div class="absolute bottom-0 left-0 p-6">
            <h3 class="text-white text-xl font-bold">{{ ml(item.title) }}</h3>
            <p v-if="ml(item.description)" class="text-white/80 text-sm mt-1.5 line-clamp-2">
              {{ ml(item.description) }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { ml } = useMultiLang()
defineProps<{ items: any[] }>()
</script>
