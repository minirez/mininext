<template>
  <section class="relative min-h-[560px] lg:min-h-[650px] flex items-center justify-center">
    <!-- Background with luxury overlay -->
    <div class="absolute inset-0 overflow-hidden">
      <img
        v-if="storefront.hero?.photo?.link"
        :src="imageUrl(storefront.hero.photo)"
        alt=""
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
      <span
        class="inline-block text-xs uppercase tracking-[0.3em] text-white/70 font-semibold mb-4 animate-fade-in-up"
      >
        {{ $t('hero.exclusive') }}
      </span>
      <h1
        class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in-up stagger-1"
      >
        {{ ml(storefront.hero?.title) || $t('hero.defaultTitle') }}
      </h1>
      <p class="text-lg text-white/80 mb-10 max-w-2xl mx-auto animate-fade-in-up stagger-2">
        {{ ml(storefront.hero?.description) || $t('hero.defaultSubtitle') }}
      </p>
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
</script>
