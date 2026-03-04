<template>
  <section class="py-12 sm:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div v-if="title" class="mb-8">
        <h2 class="text-3xl font-semibold text-gray-900">{{ title }}</h2>
        <p v-if="description" class="text-gray-500 mt-1">{{ description }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <NuxtLink
          v-for="(transfer, i) in items"
          :key="i"
          :to="`/search?type=transfer&destination=${transfer.slug || transfer.id}`"
          class="group rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div v-if="transfer.image || transfer.photo?.link" class="aspect-[3/2] relative overflow-hidden">
            <img
              :src="transfer.image || transfer.photo?.link"
              :alt="transfer.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
          <div class="p-4">
            <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span v-if="transfer.from">{{ transfer.from }}</span>
              <svg v-if="transfer.from && transfer.to" class="w-3 h-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              <span v-if="transfer.to">{{ transfer.to }}</span>
            </div>
            <h3 class="font-medium text-gray-900 group-hover:text-site-primary transition-colors line-clamp-2">
              {{ transfer.name || transfer.routeName }}
            </h3>
            <div v-if="transfer.price" class="mt-2 flex items-center gap-1.5">
              <span class="text-sm text-gray-500">{{ $t('common.from') }}</span>
              <span class="font-medium text-site-primary">{{ transfer.price }}</span>
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
