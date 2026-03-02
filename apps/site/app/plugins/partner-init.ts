/**
 * Plugin: Hydrate partner & storefront stores from SSR payload
 */
export default defineNuxtPlugin((nuxtApp) => {
  const event = useRequestEvent()
  const partnerStore = usePartnerStore()
  const storefrontStore = useStorefrontStore()

  // On server: populate stores from middleware context
  if (import.meta.server && event) {
    const partnerData = event.context.partner
    const storefrontData = event.context.storefront
    const siteSettings = event.context.siteSettings

    if (partnerData) {
      partnerStore.setFromResolvedDomain(partnerData)
    }

    if (storefrontData) {
      storefrontStore.setFromStorefront(storefrontData)
      if (storefrontData.settings) {
        partnerStore.setFromStorefront(storefrontData.settings)
      }
      if (storefrontData.activeLanguages) {
        partnerStore.activeLanguages = storefrontData.activeLanguages
      }
      if (storefrontData.defaultLanguage) {
        partnerStore.defaultLanguage = storefrontData.defaultLanguage
      }
    }

    if (siteSettings) {
      partnerStore.setFromSiteSettings(siteSettings)
    }
  }
})
