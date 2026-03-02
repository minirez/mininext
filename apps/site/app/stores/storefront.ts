export const useStorefrontStore = defineStore('storefront', () => {
  const loaded = ref(false)
  const underMaintenance = ref(false)
  const maintenanceMessage = ref('')

  // Homepage theme
  const homepageTheme = ref<{ type: string }>({ type: 'default' })
  const useCustomTheme = ref(false)
  const customTheme = ref<any>(null)

  // Hero section
  const hero = ref<{
    photo?: { id: string; width: number; height: number; link: string }
    title?: Array<{ lang: string; value: string }>
    description?: Array<{ lang: string; value: string }>
    searchOptions?: string[]
    backdropFilter?: boolean
  }>({})

  // Sections
  const campaignSection = ref<any[]>([])
  const locationSection = ref<{ title?: any; description?: any; items: any[] }>({ items: [] })
  const hotelsSection = ref<{ title?: any; description?: any; items: any[] }>({ items: [] })
  const toursSection = ref<{ title?: any; description?: any; items: any[] }>({ items: [] })

  // Header
  const header = ref<{
    tabs: any[]
    headerType: 'default' | 'white'
  }>({ tabs: [], headerType: 'default' })

  // Footer
  const footer = ref<{ items: any[] }>({ items: [] })

  // Settings (from storefront)
  const settings = ref<any>({})

  // SEO
  const seo = ref<{
    title?: Array<{ lang: string; value: string }>
    description?: Array<{ lang: string; value: string }>
    keywords?: Array<{ lang: string; value: string }>
  }>({})

  function setFromStorefront(data: any) {
    loaded.value = true
    underMaintenance.value = data.underMaintenance || false
    maintenanceMessage.value = data.maintenanceMessage || ''
    homepageTheme.value = data.homepageTheme || { type: 'default' }
    useCustomTheme.value = data.useCustomTheme || false
    customTheme.value = data.customTheme || null
    header.value = data.header || { tabs: [], headerType: 'default' }
    footer.value = data.footer || { items: [] }
    settings.value = data.settings || {}

    // Extract active theme data from homepageTheme
    const themeType = data.homepageTheme?.type || 'home1'
    const themeData = data.homepageTheme?.[themeType]

    hero.value = themeData?.hero || data.hero || {}
    campaignSection.value = themeData?.campaignSection || data.campaignSection || []
    locationSection.value = themeData?.locationSection || data.locationSection || { items: [] }
    hotelsSection.value = themeData?.hotels || data.hotels || { items: [] }
    toursSection.value = themeData?.tours || data.tours || { items: [] }

    if (data.settings?.seo) {
      seo.value = data.settings.seo
    }
  }

  return {
    loaded,
    underMaintenance,
    maintenanceMessage,
    homepageTheme,
    useCustomTheme,
    customTheme,
    hero,
    campaignSection,
    locationSection,
    hotelsSection,
    toursSection,
    header,
    footer,
    settings,
    seo,
    setFromStorefront,
  }
})
