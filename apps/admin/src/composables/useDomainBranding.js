import { computed } from 'vue'

const DOMAIN_CONFIGS = {
  hotel: {
    partnerType: 'hotel',
    brandName: 'Minirez',
    brandColor: 'indigo',
    icon: 'hotel',
    registerTitle: 'auth.hotelRegister',
    registerSubtitle: 'auth.createHotelAccount',
    portalTitle: 'auth.hotelPortalTitle',
    portalSubtitle: 'auth.hotelPortalSubtitle',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-indigo-800',
    bgCircle1: 'bg-indigo-500',
    bgCircle2: 'bg-indigo-700',
    textMuted: 'text-indigo-200',
    textAccent: 'text-indigo-100',
    accentColor: 'text-indigo-600',
    checkboxColor: 'text-indigo-600 focus:ring-indigo-500',
    linkColor:
      'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300',
    headerGradient: 'from-indigo-600 to-blue-600'
  },
  agency: {
    partnerType: 'agency',
    brandName: 'Maxirez',
    brandColor: 'purple',
    icon: 'business',
    registerTitle: 'auth.agencyRegister',
    registerSubtitle: 'auth.createAgencyAccount',
    portalTitle: 'auth.agencyPortalTitle',
    portalSubtitle: 'auth.agencyPortalSubtitle',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-purple-800',
    bgCircle1: 'bg-purple-500',
    bgCircle2: 'bg-purple-700',
    textMuted: 'text-purple-200',
    textAccent: 'text-purple-100',
    accentColor: 'text-purple-600',
    checkboxColor: 'text-purple-600 focus:ring-purple-500',
    linkColor:
      'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300',
    headerGradient: 'from-purple-600 to-indigo-600'
  }
}

function detectDomain() {
  const hostname = window.location.hostname
  if (hostname.includes('minirez')) return 'hotel'
  return 'agency'
}

export function useDomainBranding() {
  const domainType = detectDomain()
  const config = DOMAIN_CONFIGS[domainType]

  const isMinirez = computed(() => domainType === 'hotel')
  const isMaxirez = computed(() => domainType === 'agency')

  return {
    partnerType: config.partnerType,
    brandName: config.brandName,
    brandColor: config.brandColor,
    icon: config.icon,
    isMinirez,
    isMaxirez,
    config
  }
}
