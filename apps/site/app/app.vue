<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const partner = usePartnerStore()
const storefront = useStorefrontStore()

// Set favicon from partner config (reactive to handle SSR→client hydration)
useHead(() => ({
  link: [
    ...(partner.favicon ? [{ rel: 'icon', type: 'image/x-icon', href: partner.favicon }] : [])
  ],
  htmlAttrs: {
    lang: partner.defaultLanguage || 'tr'
  }
}))

// Preconnect to API and font domains + load Playfair Display
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'preconnect', href: 'https://api.maxirez.com' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap'
    }
  ]
})

// Maintenance mode redirect
if (storefront.underMaintenance) {
  // Will be handled by error.vue
}
</script>
