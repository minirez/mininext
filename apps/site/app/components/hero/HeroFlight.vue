<template>
  <section class="relative min-h-[85vh] flex items-center py-24 lg:py-32">
    <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div class="flex flex-wrap items-center">
        <!-- Left: Text + search -->
        <div class="w-full lg:w-auto lg:flex-1 lg:pr-12">
          <div class="masthead-content">
            <h1
              v-if="heroTitle"
              class="text-[60px] lg:text-[40px] sm:text-[30px] font-semibold leading-tight"
            >
              {{ heroTitle }}
            </h1>
            <p v-if="heroDescription" class="mt-5 text-gray-600">
              {{ heroDescription }}
            </p>
            <div class="mt-8">
              <SearchBar default-tab="flights" />
            </div>
          </div>
        </div>

        <!-- Right: Two hero images in a row -->
        <div class="hidden lg:block lg:shrink-0 mt-8 lg:mt-0">
          <div class="flex gap-y-8 gap-x-6 flex-nowrap">
            <div v-for="(img, index) in heroImages" :key="index" class="shrink-0">
              <img
                :src="img"
                alt="Flight destination"
                class="rounded-2xl max-h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()
const { imageUrl } = useImageUrl()

const heroTitle = computed(() => ml(storefront.hero?.title))
const heroDescription = computed(() => ml(storefront.hero?.description))

const heroImages = computed(() => {
  const photo = storefront.hero?.photo
  if (Array.isArray(photo) && photo.length) {
    return photo.slice(0, 2).map((p: any) => imageUrl(p))
  }
  if (photo && typeof photo === 'object') {
    return [imageUrl(photo)]
  }
  return []
})
</script>
