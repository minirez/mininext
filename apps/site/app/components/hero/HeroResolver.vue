<template>
  <component :is="heroComponent" v-bind="$attrs" />
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()

const heroComponent = computed(() => {
  const type = storefront.homepageTheme?.type || 'default'
  switch (type) {
    case 'hero-5':
    case 'split':
      return defineAsyncComponent(() => import('./HeroSplit.vue'))
    case 'hero-6':
    case 'activity':
      return defineAsyncComponent(() => import('./HeroActivity.vue'))
    case 'hero-bedbank':
    case 'bedbank':
      return defineAsyncComponent(() => import('./HeroBedbank.vue'))
    case 'hero-9':
    case 'cruise':
      return defineAsyncComponent(() => import('./HeroCruise.vue'))
    case 'hero-10':
    case 'flight':
      return defineAsyncComponent(() => import('./HeroFlight.vue'))
    default:
      return defineAsyncComponent(() => import('./HeroDefault.vue'))
  }
})
</script>
