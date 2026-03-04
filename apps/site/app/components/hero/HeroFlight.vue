<template>
  <section class="relative min-h-[85vh] flex items-center overflow-hidden bg-gray-50">
    <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-0">
      <div class="grid lg:grid-cols-2 gap-8 items-center">
        <!-- Left: Content -->
        <div>
          <h1
            v-if="heroTitle"
            class="text-[60px] lg:text-[40px] sm:text-[30px] font-semibold leading-tight text-gray-900"
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

        <!-- Right: 2-image grid -->
        <div class="hidden lg:flex gap-8 justify-end">
          <template v-if="heroImages.length">
            <div v-for="(img, i) in heroImages.slice(0, 2)" :key="i" class="shrink-0">
              <img
                :src="img"
                :alt="`Flight destination ${i + 1}`"
                class="rounded-2xl max-h-[400px] object-cover shadow-lg"
              />
            </div>
          </template>
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
  const photos = (storefront.hero as any)?.photo
  if (Array.isArray(photos) && photos.length) {
    return photos.map((p: any) => imageUrl(p)).filter(Boolean)
  }
  const single = storefront.hero?.photo
  if (single?.link) return [imageUrl(single)]
  return []
})
</script>
