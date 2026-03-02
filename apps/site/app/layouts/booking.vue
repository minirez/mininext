<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Minimal header for booking flow -->
    <header class="bg-white border-b border-gray-200 py-3 px-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img
            v-if="partner.logo"
            :src="partner.logo"
            :alt="partner.partnerName"
            class="h-8 w-auto"
          />
          <span v-else class="text-lg font-semibold text-gray-800">
            {{ partner.partnerName }}
          </span>
        </NuxtLink>
        <div class="flex items-center gap-3 text-sm text-gray-500">
          <span class="hidden sm:inline">🔒 {{ $t('payment.secure') }}</span>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const partner = usePartnerStore()
</script>
