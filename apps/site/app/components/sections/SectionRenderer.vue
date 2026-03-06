<template>
  <div class="[&>*:nth-child(even)]:bg-gray-50/60">
    <template v-for="sectionType in sectionOrder" :key="sectionType">
      <DestinationsGrid
        v-if="sectionType === 'destinations' && storefront.locationSection?.items?.length"
        :title="ml(storefront.locationSection?.title)"
        :description="ml(storefront.locationSection?.description)"
        :items="storefront.locationSection.items"
      />
      <CampaignBanner
        v-else-if="sectionType === 'campaigns' && storefront.campaignSection?.length"
        :items="storefront.campaignSection"
      />
      <HotelShowcase
        v-else-if="sectionType === 'hotels' && storefront.hotelsSection?.items?.length"
        :title="ml(storefront.hotelsSection?.title)"
        :description="ml(storefront.hotelsSection?.description)"
        :items="storefront.hotelsSection.items"
      />
      <TourShowcase
        v-else-if="sectionType === 'tours' && storefront.toursSection?.items?.length"
        :title="ml(storefront.toursSection?.title)"
        :description="ml(storefront.toursSection?.description)"
        :items="storefront.toursSection.items"
      />
      <TourGrid
        v-else-if="sectionType === 'tours-grid' && storefront.toursSection?.items?.length"
        :title="ml(storefront.toursSection?.title)"
        :description="ml(storefront.toursSection?.description)"
        :items="storefront.toursSection.items"
      />
      <ActivityCards
        v-else-if="sectionType === 'activities' && storefront.activitySection?.items?.length"
        :title="ml(storefront.activitySection?.title)"
        :description="ml(storefront.activitySection?.description)"
        :items="storefront.activitySection.items"
      />
      <CampaignTours
        v-else-if="
          sectionType === 'campaign-tours' && storefront.campaignToursSection?.tours?.length
        "
        :campaign="storefront.campaignToursSection?.campaign"
        :tours="storefront.campaignToursSection.tours"
      />
      <BedbankShowcase
        v-else-if="sectionType === 'bedbank' && storefront.bedbankSection?.items?.length"
        :title="ml(storefront.bedbankSection?.title)"
        :description="ml(storefront.bedbankSection?.description)"
        :items="storefront.bedbankSection.items"
      />
      <BedbankDestinations
        v-else-if="
          sectionType === 'bedbank-destinations' &&
          storefront.bedbankDestinationsSection?.items?.length
        "
        :title="ml(storefront.bedbankDestinationsSection?.title)"
        :description="ml(storefront.bedbankDestinationsSection?.description)"
        :items="storefront.bedbankDestinationsSection.items"
      />
      <FlightDeals
        v-else-if="sectionType === 'flights' && storefront.flightSection?.items?.length"
        :title="ml(storefront.flightSection?.title)"
        :description="ml(storefront.flightSection?.description)"
        :items="storefront.flightSection.items"
      />
      <CruiseDeals
        v-else-if="sectionType === 'cruise-deals' && storefront.cruiseSection?.items?.length"
        :title="ml(storefront.cruiseSection?.title)"
        :description="ml(storefront.cruiseSection?.description)"
        :items="storefront.cruiseSection.items"
      />
      <TransferShowcase
        v-else-if="sectionType === 'transfers' && storefront.transferSection?.items?.length"
        :title="ml(storefront.transferSection?.title)"
        :description="ml(storefront.transferSection?.description)"
        :items="storefront.transferSection.items"
      />
      <TrustFeatures v-else-if="sectionType === 'trust'" />
      <NewsletterCTA v-else-if="sectionType === 'newsletter'" />
    </template>
  </div>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()

const THEME_SECTION_ORDER: Record<string, string[]> = {
  home1: ['destinations', 'campaigns', 'hotels', 'trust', 'tours'],
  home2: ['destinations', 'campaigns', 'hotels', 'trust', 'tours', 'newsletter'],
  hotel: ['hotels', 'destinations', 'campaigns', 'trust', 'tours', 'newsletter'],
  tour: ['tours', 'destinations', 'campaign-tours', 'newsletter'],
  activity: ['trust', 'campaigns', 'activities', 'destinations'],
  transfer: ['transfers'],
  cruise: ['cruise-deals', 'newsletter'],
  flight: ['trust', 'flights'],
  bedbank: ['bedbank', 'bedbank-destinations'],
  default: ['destinations', 'campaigns', 'hotels', 'trust', 'tours', 'newsletter']
}

const sectionOrder = computed(() => {
  const type = storefront.homepageTheme?.type || 'home1'
  return THEME_SECTION_ORDER[type] || THEME_SECTION_ORDER.default
})
</script>
