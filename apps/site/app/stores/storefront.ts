export const useStorefrontStore = defineStore('storefront', () => {
  const loaded = ref(false)
  const underMaintenance = ref(false)
  const maintenanceMessage = ref('')

  // Homepage theme
  const homepageTheme = ref<{ type: string }>({ type: 'default' })
  const useCustomTheme = ref(false)
  const customTheme = ref<any>(null)
  const savedThemePresets = ref<any[]>([])

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
  const activitySection = ref<{ title?: any; description?: any; items: any[] }>({ items: [] })
  const bedbankSection = ref<{ title?: any; description?: any; items: any[] }>({ items: [] })
  const bedbankDestinationsSection = ref<{ title?: any; description?: any; items: any[] }>({ items: [] })
  const flightSection = ref<{ title?: any; description?: any; routes?: any[]; items: any[] }>({ items: [] })
  const cruiseSection = ref<{ title?: any; description?: any; items: any[] }>({ items: [] })
  const transferSection = ref<{ title?: any; description?: any; items: any[] }>({ items: [] })
  const campaignToursSection = ref<{ campaign?: any; tours: any[] }>({ tours: [] })

  // Custom theme active sections (ordered)
  const activeSections = ref<any[]>([])
  const isDraftMode = ref(false)

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
    savedThemePresets.value = data.savedThemePresets || []
    header.value = data.header || { tabs: [], headerType: 'default' }
    footer.value = data.footer || { items: [] }
    settings.value = data.settings || {}

    const themeType = data.homepageTheme?.type || 'home1'
    const themeData = data.homepageTheme?.[themeType]

    hero.value = themeData?.hero || data.hero || {}
    campaignSection.value = themeData?.campaignSection || data.campaignSection || []
    locationSection.value = themeData?.locationSection || data.locationSection || { items: [] }
    hotelsSection.value = themeData?.hotels || data.hotels || { items: [] }
    toursSection.value = themeData?.tours || data.tours || { items: [] }

    if (themeType === 'activity') {
      activitySection.value = {
        title: themeData?.campaignSection?.title,
        description: themeData?.campaignSection?.description,
        items: themeData?.tourIds?.items || [],
      }
    }

    if (themeType === 'bedbank') {
      bedbankSection.value = {
        title: themeData?.showcase?.title,
        description: themeData?.showcase?.description,
        items: themeData?.showcase?.ids || [],
      }
      bedbankDestinationsSection.value = {
        title: themeData?.locations?.title,
        description: themeData?.locations?.description,
        items: themeData?.locations?.items || [],
      }
    }

    if (themeType === 'flight') {
      flightSection.value = {
        title: themeData?.routes?.title,
        description: themeData?.routes?.description,
        items: themeData?.routes?.items || [],
        routes: themeData?.routes?.items || [],
      }
    }

    if (themeType === 'cruise') {
      cruiseSection.value = {
        title: themeData?.tours?.title,
        description: themeData?.tours?.description,
        items: themeData?.tours?.ids || [],
      }
    }

    if (themeType === 'transfer') {
      transferSection.value = {
        title: themeData?.transfers?.title,
        description: themeData?.transfers?.description,
        items: themeData?.transfers?.ids || [],
      }
    }

    if (themeType === 'tour') {
      campaignToursSection.value = {
        campaign: themeData?.campaignSection?.campaign,
        tours: themeData?.campaignSection?.campaignTourIds || [],
      }
    }

    if (data.settings?.seo) {
      seo.value = data.settings.seo
    }

    if (data.useCustomTheme && data.customTheme) {
      setFromCustomTheme(data)
    }
  }

  function setFromCustomTheme(data: any) {
    // The API resolves the active preset + page and returns it under
    // data.customTheme.page.customization (the raw presets are stripped).
    const c = data.customTheme?.page?.customization
    if (!c) return

    activeSections.value = (c.activeSections || [])
      .filter((s: any) => s.enabled !== false)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))

    if (c.hero) hero.value = c.hero
    if (c.locationSection) locationSection.value = c.locationSection
    if (c.campaignSection) campaignSection.value = c.campaignSection
    if (c.hotels) hotelsSection.value = c.hotels
    if (c.tours) toursSection.value = c.tours
    if (c.activities) activitySection.value = c.activities
    if (c.bedbankShowcase) bedbankSection.value = c.bedbankShowcase
    if (c.bedbankDestinations) bedbankDestinationsSection.value = c.bedbankDestinations
    if (c.flights) flightSection.value = c.flights
    if (c.cruiseDeals) cruiseSection.value = c.cruiseDeals
    if (c.transfers) transferSection.value = c.transfers
  }

  return {
    loaded,
    underMaintenance,
    maintenanceMessage,
    homepageTheme,
    useCustomTheme,
    customTheme,
    savedThemePresets,
    hero,
    campaignSection,
    locationSection,
    hotelsSection,
    toursSection,
    activitySection,
    bedbankSection,
    bedbankDestinationsSection,
    flightSection,
    cruiseSection,
    transferSection,
    campaignToursSection,
    activeSections,
    isDraftMode,
    header,
    footer,
    settings,
    seo,
    setFromStorefront,
    setFromCustomTheme,
  }
})
