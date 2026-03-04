<template>
  <section class="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
    <!-- Background: dark base + image + theme color tint -->
    <div class="absolute inset-0 bg-gray-900 -z-10">
      <img
        v-if="heroImage"
        :src="heroImage"
        alt=""
        class="w-full h-full object-cover transition-opacity duration-500"
        :style="{ opacity: imageLoaded ? 1 : 0.7 }"
        @load="imageLoaded = true"
      />
      <div
        v-if="themeColor"
        class="absolute inset-0 pointer-events-none"
        :style="{ backgroundColor: themeColor, opacity: 0.3, mixBlendMode: 'multiply' }"
      />
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-4xl mx-auto px-4 text-center">
      <h1
        v-if="heroTitle"
        class="text-[60px] lg:text-[40px] md:text-[30px] text-white font-semibold leading-tight"
      >
        {{ heroTitle }}
      </h1>
      <p v-if="heroDescription" class="text-white mt-1.5">
        {{ heroDescription }}
      </p>

      <div class="mt-10">
        <SearchBar class="max-w-4xl mx-auto" default-tab="activities" />
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

const themeColor = computed(() => {
  const c = partner.themeColor || storefront.settings?.themeColor
  return c && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : null
})
</script>
