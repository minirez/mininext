<template>
  <div>
    <template v-for="section in orderedSections" :key="section.id || section.sectionType">
      <HeroResolver v-if="isHeroSection(section.sectionType)" />

      <DestinationsGrid
        v-else-if="section.sectionType === 'destinations'"
        :title="ml(storefront.locationSection?.title)"
        :description="ml(storefront.locationSection?.description)"
        :items="storefront.locationSection?.items || []"
      />
      <CampaignBanner
        v-else-if="section.sectionType === 'campaigns'"
        :items="storefront.campaignSection || []"
      />
      <HotelShowcase
        v-else-if="section.sectionType === 'hotels'"
        :title="ml(storefront.hotelsSection?.title)"
        :description="ml(storefront.hotelsSection?.description)"
        :items="storefront.hotelsSection?.items || []"
      />
      <TourShowcase
        v-else-if="section.sectionType === 'tours-carousel'"
        :title="ml(storefront.toursSection?.title)"
        :description="ml(storefront.toursSection?.description)"
        :items="storefront.toursSection?.items || []"
      />
      <TourGrid
        v-else-if="section.sectionType === 'tours-grid'"
        :title="ml(storefront.toursSection?.title)"
        :description="ml(storefront.toursSection?.description)"
        :items="storefront.toursSection?.items || []"
      />
      <CampaignTours
        v-else-if="section.sectionType === 'campaign-tours'"
        :campaign="storefront.campaignToursSection?.campaign"
        :tours="storefront.campaignToursSection?.tours || []"
      />
      <ActivityCards
        v-else-if="section.sectionType === 'activities-grid' || section.sectionType === 'activity-campaigns'"
        :title="ml(storefront.activitySection?.title)"
        :description="ml(storefront.activitySection?.description)"
        :items="storefront.activitySection?.items || []"
      />
      <BedbankShowcase
        v-else-if="section.sectionType === 'bedbank-showcase'"
        :title="ml(storefront.bedbankSection?.title)"
        :description="ml(storefront.bedbankSection?.description)"
        :items="storefront.bedbankSection?.items || []"
      />
      <BedbankDestinations
        v-else-if="section.sectionType === 'bedbank-destinations'"
        :title="ml(storefront.bedbankDestinationsSection?.title)"
        :description="ml(storefront.bedbankDestinationsSection?.description)"
        :items="storefront.bedbankDestinationsSection?.items || []"
      />
      <FlightDeals
        v-else-if="section.sectionType === 'flights'"
        :title="ml(storefront.flightSection?.title)"
        :description="ml(storefront.flightSection?.description)"
        :items="storefront.flightSection?.items || []"
      />
      <CruiseDeals
        v-else-if="section.sectionType === 'cruise-deals'"
        :title="ml(storefront.cruiseSection?.title)"
        :description="ml(storefront.cruiseSection?.description)"
        :items="storefront.cruiseSection?.items || []"
      />
      <TransferShowcase
        v-else-if="section.sectionType === 'transfers'"
        :title="ml(storefront.transferSection?.title)"
        :description="ml(storefront.transferSection?.description)"
        :items="storefront.transferSection?.items || []"
      />
      <TrustFeatures
        v-else-if="section.sectionType === 'block-guide' || section.sectionType === 'block-guide-2'"
      />
      <NewsletterCTA v-else-if="section.sectionType === 'cta-newsletter'" />
    </template>
  </div>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()

const isHeroSection = (type: string) => type?.startsWith('hero-')

const orderedSections = computed(() => {
  return storefront.activeSections.filter(
    (s: any) => s.enabled !== false && !s.sectionType?.startsWith('footer-'),
  )
})
</script>
