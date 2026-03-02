export const usePartnerStore = defineStore('partner', () => {
  const partnerId = ref('')
  const partnerName = ref('')
  const partnerCode = ref('')
  const logo = ref('')
  const favicon = ref('')
  const themeColor = ref('')
  const activeLanguages = ref<string[]>(['tr'])
  const defaultLanguage = ref('tr')
  const currency = ref('TRY')
  const partnerType = ref<'hotel' | 'agency' | 'web'>('agency')

  // Domain-resolved hotels (for agency partners)
  const hotels = ref<any[]>([])
  // Single hotel (for hotel partners with PMS domain)
  const pmsHotel = ref<any>(null)

  // Tracking settings
  const tracking = ref<{
    googleAnalytics?: { measurementId: string; enabled: boolean }
    googleTagManager?: { containerId: string; enabled: boolean }
    facebookPixel?: { pixelId: string; enabled: boolean }
    microsoftClarity?: { projectId: string; enabled: boolean }
    customScripts?: { head: string; body: string }
  }>({})

  // Contact info
  const contact = ref<{
    phone?: string
    whatsapp?: string
    email?: string
    workingHours?: string
  }>({})

  // Social media
  const socials = ref<Record<string, string>>({})

  // TURSAB info
  const tursab = ref<{ photo?: any; link?: string; documentNumber?: string }>({})

  function setFromResolvedDomain(data: any) {
    partnerId.value = data.partnerId || ''
    partnerName.value = data.partnerName || ''
    partnerCode.value = data.code || ''
    logo.value = data.logo || ''
    hotels.value = data.hotels || []
    pmsHotel.value = data.pmsHotel || null
  }

  function setFromSiteSettings(data: any) {
    if (data.general) {
      if (data.general.logo) logo.value = data.general.logo
      if (data.general.favicon) favicon.value = data.general.favicon
      if (data.general.activeLanguages) activeLanguages.value = data.general.activeLanguages
      if (data.general.defaultLanguage) defaultLanguage.value = data.general.defaultLanguage
    }
    if (data.tracking) tracking.value = data.tracking
    if (data.contact) contact.value = data.contact?.callCenter || {}
  }

  function setFromStorefront(settings: any) {
    if (settings.themeColor) themeColor.value = settings.themeColor
    if (settings.name) partnerName.value = settings.name
    if (settings.logo?.link) logo.value = settings.logo.link
    if (settings.favicon?.link) favicon.value = settings.favicon.link
    if (settings.socials) socials.value = settings.socials
    if (settings.callCenter) contact.value = settings.callCenter
    if (settings.tursab) tursab.value = settings.tursab
  }

  return {
    partnerId,
    partnerName,
    partnerCode,
    logo,
    favicon,
    themeColor,
    activeLanguages,
    defaultLanguage,
    currency,
    partnerType,
    hotels,
    pmsHotel,
    tracking,
    contact,
    socials,
    tursab,
    setFromResolvedDomain,
    setFromSiteSettings,
    setFromStorefront,
  }
})
