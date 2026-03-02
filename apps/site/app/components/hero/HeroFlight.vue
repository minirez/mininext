<template>
  <section class="relative min-h-[560px] flex items-center">
    <!-- Split background -->
    <div class="absolute inset-0 overflow-hidden">
      <img
        v-if="storefront.hero?.photo?.link"
        :src="imageUrl(storefront.hero.photo)"
        alt=""
        class="w-full h-full object-cover"
      />
      <div
        class="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/40"
      />
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div class="max-w-2xl">
        <h1
          class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 animate-fade-in-up"
        >
          {{ ml(storefront.hero?.title) || $t('hero.defaultTitle') }}
        </h1>
        <p class="text-lg text-white/80 mb-8 animate-fade-in-up stagger-1">
          {{ ml(storefront.hero?.description) || $t('hero.defaultSubtitle') }}
        </p>
        <div class="animate-fade-in-up stagger-2">
          <SearchBar />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()
</script>
