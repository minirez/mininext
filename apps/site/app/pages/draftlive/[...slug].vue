<template>
  <div>
    <div
      class="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center py-2 text-sm font-medium"
    >
      Draft Preview Mode — Changes shown here are not live
    </div>
    <div class="pt-10">
      <template v-if="storefront.useCustomTheme && storefront.activeSections?.length">
        <CustomThemeRenderer />
      </template>
      <template v-else>
        <HeroResolver />
        <SectionRenderer />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const storefront = useStorefrontStore()
</script>
