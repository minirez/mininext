<template>
  <section class="relative min-h-[560px] flex items-end pb-12">
    <!-- Aerial background -->
    <div class="absolute inset-0 overflow-hidden">
      <img
        v-if="storefront.hero?.photo?.link"
        :src="imageUrl(storefront.hero.photo)"
        alt=""
        class="w-full h-full object-cover"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/30 to-transparent"
      />
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div class="text-center mb-8">
        <h1
          class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 animate-fade-in-up"
        >
          {{ ml(storefront.hero?.title) || $t('hero.defaultTitle') }}
        </h1>
        <p class="text-lg text-white/80 animate-fade-in-up stagger-1">
          {{ ml(storefront.hero?.description) || $t('hero.defaultSubtitle') }}
        </p>
      </div>

      <!-- Bottom dock search -->
      <div class="animate-fade-in-up stagger-2">
        <SearchBar class="max-w-4xl mx-auto" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()
</script>
