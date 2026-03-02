<template>
  <section
    class="relative min-h-[600px] lg:min-h-[700px] flex items-center justify-center pt-24 lg:pt-28 pb-12"
  >
    <!-- Background image -->
    <div class="absolute inset-0 overflow-hidden">
      <img
        v-if="storefront.hero?.photo?.link"
        :src="imageUrl(storefront.hero.photo)"
        alt=""
        class="w-full h-full object-cover scale-105"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50" />
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
      <h1
        class="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight animate-fade-in-up italic"
      >
        {{ ml(storefront.hero?.title) || t('hero.defaultTitle') }}
      </h1>
      <p
        class="text-lg sm:text-xl text-white/85 mb-10 max-w-2xl mx-auto animate-fade-in-up stagger-2"
      >
        {{ ml(storefront.hero?.description) || t('hero.defaultSubtitle') }}
      </p>

      <!-- Search bar -->
      <div class="animate-fade-in-up stagger-3">
        <SearchBar class="max-w-4xl mx-auto" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()
const { t } = useI18n()
</script>
