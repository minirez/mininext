<template>
  <div>
    <!-- Hero -->
    <HeroResolver />

    <!-- Sections -->
    <SectionRenderer />
  </div>
</template>

<script setup lang="ts">
const partner = usePartnerStore()
const storefront = useStorefrontStore()
const { ml } = useMultiLang()

// SEO
useSeo({
  title: ml(storefront.seo?.title) || partner.partnerName,
  description: ml(storefront.seo?.description) || ml(storefront.hero?.description),
  image: storefront.hero?.photo?.link
})

// Market detection on first visit
if (import.meta.client) {
  const market = useMarket()
  market.detectMarket()
}
</script>
