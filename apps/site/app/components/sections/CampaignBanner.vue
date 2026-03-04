<template>
  <section class="py-12 sm:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        :class="items.length === 1 ? '' : 'grid grid-cols-1 md:grid-cols-2 gap-8'"
      >
        <NuxtLink
          v-for="(item, i) in items.slice(0, items.length === 1 ? 1 : 4)"
          :key="i"
          :to="item.url || '#'"
          class="group relative rounded overflow-hidden block"
          style="aspect-ratio: 63/55"
        >
          <img
            v-if="item.photo?.link"
            :src="item.photo.link"
            :alt="ml(item.title)"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div class="absolute inset-0 flex flex-col justify-end p-[70px] lg:p-8">
            <p v-if="ml(item.title)" class="text-[15px] font-medium text-white mb-2.5">
              {{ ml(item.title) }}
            </p>
            <p v-if="ml(item.description)" class="text-4xl lg:text-[26px] text-white font-semibold">
              {{ ml(item.description) }}
            </p>
            <span
              class="mt-5 inline-block px-12 py-4 bg-white text-gray-900 rounded font-medium min-w-[180px] text-center hover:bg-site-primary hover:text-white transition-colors self-start"
            >
              {{ $t('common.viewDetails') || 'View Details' }}
            </span>
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
