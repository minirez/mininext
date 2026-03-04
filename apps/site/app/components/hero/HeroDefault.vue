<template>
  <section class="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
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

    <!-- TURSAB badge -->
    <div
      v-if="partner.tursab?.documentNumber"
      class="absolute top-[100px] left-2.5 z-10 px-5 py-1.5 font-medium text-gray-900 rounded bg-white/60"
      style="font-size: 10px"
    >
      {{ partner.tursab.documentNumber }}
    </div>

    <!-- Content -->
    <div class="relative z-10 text-center max-w-4xl mx-auto px-4">
      <h1
        v-if="heroTitle"
        class="text-[60px] lg:text-[40px] md:text-[30px] text-white font-semibold leading-tight"
        :style="noBackdrop ? textShadowStyle : undefined"
      >
        {{ heroTitle }}
      </h1>
      <p
        v-if="heroDescription"
        class="text-white mt-1.5 md:mt-2.5"
        :style="noBackdrop ? descShadowStyle : undefined"
      >
        {{ heroDescription }}
      </p>

      <div
        v-if="hasSearchOptions"
        class="mt-16"
        :class="noBackdrop ? 'search-no-backdrop' : ''"
      >
        <SearchBar class="max-w-4xl mx-auto" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const partner = usePartnerStore()
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

<style scoped>
.masthead-bg-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
}

.search-no-backdrop {
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 50%, transparent 70%);
  padding: 30px 40px;
  border-radius: 20px;
  margin-left: -40px;
  margin-right: -40px;
}
</style>
