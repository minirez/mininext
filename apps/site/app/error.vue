<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="text-center max-w-md">
      <!-- 404 -->
      <template v-if="error?.statusCode === 404">
        <div class="text-8xl font-bold text-gray-200 mb-4">404</div>
        <h1 class="text-2xl font-semibold text-gray-800 mb-2">
          {{ $t('error.notFound') }}
        </h1>
        <p class="text-gray-500 mb-8">
          {{ $t('error.notFoundDesc') }}
        </p>
      </template>

      <!-- 503 Maintenance -->
      <template v-else-if="error?.statusCode === 503">
        <div class="text-6xl mb-4">🔧</div>
        <h1 class="text-2xl font-semibold text-gray-800 mb-2">
          {{ $t('error.maintenance') }}
        </h1>
        <p class="text-gray-500 mb-8">
          {{ $t('error.maintenanceDesc') }}
        </p>
      </template>

      <!-- Generic error -->
      <template v-else>
        <div class="text-8xl font-bold text-gray-200 mb-4">{{ error?.statusCode || 500 }}</div>
        <h1 class="text-2xl font-semibold text-gray-800 mb-2">
          {{ $t('error.serverError') }}
        </h1>
        <p class="text-gray-500 mb-8">
          {{ $t('error.serverErrorDesc') }}
        </p>
      </template>

      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 px-6 py-3 bg-site-primary text-white rounded-lg hover:bg-site-primary-dark transition-colors"
      >
        {{ $t('error.backHome') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()
</script>
