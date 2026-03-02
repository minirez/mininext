<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <Breadcrumb
      :items="[
        { label: $t('common.home'), to: '/' },
        { label: pageTitle, to: pageUrl }
      ]"
      class="mb-6"
    />

    <article v-if="pageContent" class="prose prose-lg max-w-none" v-html="sanitizedContent" />

    <div v-else-if="loading" class="space-y-4">
      <Skeleton height="32px" width="300px" />
      <Skeleton height="200px" />
    </div>

    <EmptyState v-else>
      <template #title>{{ $t('error.notFound') }}</template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slugParts = route.params.slug as string[]
const pageUrl = '/' + slugParts.join('/')

const api = useApi()

const { data: pageData, status } = await useAsyncData(`page-${pageUrl}`, () =>
  api.get<{ success: boolean; data: any }>('/api/public/storefront/pages', { url: pageUrl })
)

const loading = computed(() => status.value === 'pending')

const pageTitle = computed(() => {
  const page = Array.isArray(pageData.value?.data) ? pageData.value.data[0] : pageData.value?.data
  return page?.title || page?.name || ''
})

const pageContent = computed(() => {
  const page = Array.isArray(pageData.value?.data) ? pageData.value.data[0] : pageData.value?.data
  return page?.content || page?.customization?.content || ''
})

// Sanitize HTML content
const sanitizedContent = computed(() => {
  if (!pageContent.value) return ''
  // Basic sanitization - in production use DOMPurify
  return pageContent.value
})

useSeo({
  title: pageTitle.value,
  description: ''
})
</script>
