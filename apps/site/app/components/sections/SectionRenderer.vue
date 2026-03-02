<template>
  <div class="[&>*:nth-child(even)]:bg-gray-50/60">
    <!-- Destinations section -->
    <DestinationsGrid
      v-if="storefront.locationSection?.items?.length"
      :title="ml(storefront.locationSection?.title)"
      :description="ml(storefront.locationSection?.description)"
      :items="storefront.locationSection.items"
    />

    <!-- Campaign banners -->
    <CampaignBanner v-if="storefront.campaignSection?.length" :items="storefront.campaignSection" />

    <!-- Hotel showcase -->
    <HotelShowcase
      v-if="storefront.hotelsSection?.items?.length"
      :title="ml(storefront.hotelsSection?.title)"
      :description="ml(storefront.hotelsSection?.description)"
      :items="storefront.hotelsSection.items"
    />

    <!-- Tour showcase -->
    <TourShowcase
      v-if="storefront.toursSection?.items?.length"
      :title="ml(storefront.toursSection?.title)"
      :description="ml(storefront.toursSection?.description)"
      :items="storefront.toursSection.items"
    />

    <!-- Activity cards -->
    <ActivityCards
      v-if="storefront.activitySection?.items?.length"
      :title="ml(storefront.activitySection?.title)"
      :description="ml(storefront.activitySection?.description)"
      :items="storefront.activitySection.items"
    />

    <!-- Bedbank showcase -->
    <BedbankShowcase
      v-if="storefront.bedbankSection?.items?.length"
      :title="ml(storefront.bedbankSection?.title)"
      :description="ml(storefront.bedbankSection?.description)"
      :items="storefront.bedbankSection.items"
    />

    <!-- Bedbank destinations -->
    <BedbankDestinations
      v-if="storefront.bedbankDestinationsSection?.items?.length"
      :title="ml(storefront.bedbankDestinationsSection?.title)"
      :description="ml(storefront.bedbankDestinationsSection?.description)"
      :items="storefront.bedbankDestinationsSection.items"
    />

    <!-- Flight deals -->
    <FlightDeals
      v-if="storefront.flightSection?.items?.length"
      :title="ml(storefront.flightSection?.title)"
      :description="ml(storefront.flightSection?.description)"
      :items="storefront.flightSection.items"
    />

    <!-- Cruise deals -->
    <CruiseDeals
      v-if="storefront.cruiseSection?.items?.length"
      :title="ml(storefront.cruiseSection?.title)"
      :description="ml(storefront.cruiseSection?.description)"
      :items="storefront.cruiseSection.items"
    />

    <!-- Trust features -->
    <TrustFeatures />
  </div>
</template>

<script setup lang="ts">
const storefront = useStorefrontStore()
const { ml } = useMultiLang()
</script>
