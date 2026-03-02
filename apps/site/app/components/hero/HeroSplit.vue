<template>
  <section class="relative bg-blue-50/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-32 pb-16 lg:pb-24">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Left: Content -->
        <div class="animate-fade-in-up">
          <h1
            class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight"
          >
            {{ ml(storefront.hero?.title) || $t('hero.defaultTitle') }}
          </h1>
          <p class="text-lg text-gray-600 mb-8 max-w-lg animate-fade-in-up stagger-2">
            {{ ml(storefront.hero?.description) || $t('hero.defaultSubtitle') }}
          </p>
          <div class="animate-fade-in-up stagger-3">
            <SearchBar />
          </div>
        </div>

        <!-- Right: Image -->
        <div class="relative hidden lg:block animate-fade-in-up stagger-4">
          <div class="rounded-3xl overflow-hidden shadow-2xl">
            <img
              v-if="storefront.hero?.photo?.link"
              :src="imageUrl(storefront.hero.photo)"
              alt=""
              class="w-full h-[460px] object-cover"
            />
            <div
              v-else
              class="w-full h-[460px] bg-gradient-to-br from-site-primary to-site-primary-dark"
            />
          </div>
          <!-- Decorative dots -->
          <div class="absolute -bottom-6 -left-6 w-24 h-24 bg-site-primary/10 rounded-2xl -z-10" />
          <div class="absolute -top-4 -right-4 w-16 h-16 bg-site-primary/5 rounded-full -z-10" />
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
