<template>
  <section class="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
    <!-- Background image with dark overlay -->
    <div class="absolute inset-0 -z-10 masthead-bg-overlay">
      <img
        v-if="heroImage"
        ref="heroRef"
        :src="heroImage"
        alt=""
        class="w-full h-full object-cover transition-opacity duration-500"
        :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
        @load="imageLoaded = true"
      />
    </div>
    <div class="absolute inset-0 bg-black/40" />

    <!-- Content - same layout as HeroDefault but smaller text -->
    <div class="relative z-10 text-center max-w-4xl mx-auto px-4">
      <h1
        v-if="heroTitle"
        class="text-[40px] lg:text-[30px] sm:text-[24px] text-white font-semibold leading-tight"
      >
        {{ heroTitle }}
      </h1>
      <p v-if="heroDescription" class="text-white mt-5">
        {{ heroDescription }}
      </p>
      <div v-if="hasSearchOptions" class="mt-8">
        <SearchBar default-tab="hotels" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()

const imageLoaded = ref(false)
const heroRef = ref<HTMLImageElement | null>(null)

onMounted(() => {
  if (heroRef.value?.complete && heroRef.value.naturalWidth > 0) {
    imageLoaded.value = true
  }
})

const heroImage = computed(() => {
  const photo = storefront.hero?.photo
  if (!photo) return ''
  return imageUrl(photo)
})

const heroTitle = computed(() => ml(storefront.hero?.title))
const heroDescription = computed(() => ml(storefront.hero?.description))
const hasSearchOptions = computed(() => storefront.hero?.searchOptions?.length)
</script>

<style scoped>
.masthead-bg-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
}
</style>
