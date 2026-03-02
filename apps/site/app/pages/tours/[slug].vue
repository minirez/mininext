<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <Breadcrumb
      :items="[
        { label: $t('common.home'), to: '/' },
        { label: $t('common.tours'), to: '/tours' },
        { label: 'Tour Detail', to: `/tours/${slug}` }
      ]"
      class="mb-6"
    />

    <h1 class="text-2xl font-bold text-gray-900 mb-4">Tour Detail</h1>
    <p class="text-gray-500">Tour detail page for: {{ slug }}</p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
</script>
