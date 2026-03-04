/**
 * Plugin: Hydrate partner & storefront stores from SSR payload
 */
export default defineNuxtPlugin((nuxtApp) => {
  const event = useRequestEvent()
  const partnerStore = usePartnerStore()
  const storefrontStore = useStorefrontStore()

  if (import.meta.server && event) {
    const partnerData = event.context.partner
    const storefrontData = event.context.storefront
    const siteSettings = event.context.siteSettings

    if (partnerData) {
      partnerStore.setFromResolvedDomain(partnerData)
    }

    if (storefrontData) {
      storefrontStore.setFromStorefront(storefrontData)

      if (storefrontData._isDraftMode) {
        storefrontStore.isDraftMode = true
      }

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

    // Inject theme color in SSR to prevent flash of default blue
    const themeColor = event.context.themeColor
    if (themeColor) {
      const rgb = hexToRgb(themeColor)
      if (rgb) {
        useHead({
          style: [{
            innerHTML: `:root { --site-primary: ${rgb}; --site-primary-dark: ${darkenRgb(themeColor)}; --site-primary-light: ${lightenRgb(themeColor)}; }`,
          }],
        })
      }
    }
  }
})

function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

function darkenRgb(hex: string, amount = 40): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0 0'
  return `${Math.max(0, parseInt(result[1], 16) - amount)} ${Math.max(0, parseInt(result[2], 16) - amount)} ${Math.max(0, parseInt(result[3], 16) - amount)}`
}

function lightenRgb(hex: string, amount = 80): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '255 255 255'
  return `${Math.min(255, parseInt(result[1], 16) + amount)} ${Math.min(255, parseInt(result[2], 16) + amount)} ${Math.min(255, parseInt(result[3], 16) + amount)}`
}
