<template>
  <section class="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
    <!-- Background: dark base + hero image + theme color overlay -->
    <div class="absolute inset-0 -z-10 bg-gray-900">
      <img
        v-if="heroImage"
        ref="heroRef"
        :src="heroImage"
        alt=""
        class="w-full h-full object-cover transition-opacity duration-500"
        :style="{ opacity: imageLoaded ? 1 : 0.7 }"
        @load="imageLoaded = true"
      />
      <span
        v-if="themeColor"
        class="absolute inset-0 pointer-events-none"
        :style="{ backgroundColor: themeColor, opacity: 0.3, mixBlendMode: 'multiply' }"
      />
    </div>

    <!-- Content (col-xl-9, centered) -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div class="flex justify-center">
        <div class="w-full xl:w-3/4">
          <div class="text-center">
            <h1
              v-if="heroTitle"
              class="text-[60px] lg:text-[40px] md:text-[30px] text-white font-semibold leading-tight"
            >
              {{ heroTitle }}
            </h1>
            <p v-if="heroDescription" class="text-white mt-1.5">
              {{ heroDescription }}
            </p>
          </div>

          <div v-if="hasSearchOptions" class="mt-8">
            <SearchBar default-tab="activities" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const partner = usePartnerStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()

const imageLoaded = ref(import.meta.server)
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

const themeColor = computed(() => {
  const c = partner.themeColor || storefront.settings?.themeColor
  return c && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : null
})
</script>
