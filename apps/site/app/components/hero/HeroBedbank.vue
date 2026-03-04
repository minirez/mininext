<template>
  <section class="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
    <!-- Background image with fade-in -->
    <div class="absolute inset-0 -z-10" :class="hasBackdropFilter ? 'masthead-bg-overlay' : ''">
      <img
        v-if="heroImage"
        :src="heroImage"
        alt=""
        class="w-full h-full object-cover transition-opacity duration-500"
        :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
        @load="imageLoaded = true"
      />
    </div>

    <!-- Dark overlay when backdropFilter is active -->
    <div v-if="hasBackdropFilter" class="absolute inset-0 bg-black/40" />

    <!-- Content (smaller text than Hero1) -->
    <div class="relative z-10 text-center max-w-4xl mx-auto px-4">
      <h1
        v-if="heroTitle"
        class="text-[40px] lg:text-[30px] md:text-[24px] text-white font-semibold leading-tight"
        :style="noBackdrop ? textShadowStyle : undefined"
      >
        {{ heroTitle }}
      </h1>
      <p
        v-if="heroDescription"
        class="text-white mt-1.5"
        :style="noBackdrop ? descShadowStyle : undefined"
      >
        {{ heroDescription }}
      </p>

      <div v-if="hasSearchOptions" class="mt-12">
        <SearchBar class="max-w-4xl mx-auto" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()

const imageLoaded = ref(false)

const heroImage = computed(() => {
  const photo = storefront.hero?.photo
  if (!photo) return ''
  return imageUrl(photo)
})

const heroTitle = computed(() => ml(storefront.hero?.title))
const heroDescription = computed(() => ml(storefront.hero?.description))
const hasSearchOptions = computed(() => storefront.hero?.searchOptions?.length)

const hasBackdropFilter = computed(() => storefront.hero?.backdropFilter !== false)
const noBackdrop = computed(() => !hasBackdropFilter.value)

const textShadowStyle = {
  textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)',
}
const descShadowStyle = {
  textShadow: '0 2px 6px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.3)',
}
</script>
