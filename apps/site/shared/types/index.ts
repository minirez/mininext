/**
 * Shared types between app and server
 */

export interface MultiLangString {
  lang: string
  value: string
}

export interface PhotoRef {
  id: string
  width: number
  height: number
  link: string
}

export interface Partner {
  partnerId: string
  partnerName: string
  code: string
  logo: string
  hotels: HotelSummary[]
  pmsHotel?: HotelSummary | null
}

export interface HotelSummary {
  id: string
  name: string
  slug: string
  logo?: string
  stars?: number
  image?: string
  city?: string
  country?: string
}

export interface Hotel extends HotelSummary {
  description?: string | MultiLangString[]
  type?: string
  category?: string
  amenities?: string[]
  images?: Array<{ url: string; caption?: MultiLangString[]; order?: number; isMain?: boolean }>
  address?: {
    street?: string
    district?: string
    city?: string
    country?: string
    postalCode?: string
    coordinates?: { lat: number; lng: number }
    formattedAddress?: string
  }
  contact?: {
    phone?: string
    email?: string
    website?: string
  }
  policies?: {
    checkIn?: string
    checkOut?: string
    childPolicy?: MultiLangString[]
    cancellationRules?: Array<{
      daysBeforeCheckIn: number
      refundPercent: number
      description?: MultiLangString[]
    }>
    freeCancellation?: { enabled: boolean; daysBeforeCheckIn?: number }
  }
  profile?: Record<string, { content?: MultiLangString[]; features?: string[] }>
  seo?: {
    title?: MultiLangString[]
    description?: MultiLangString[]
    keywords?: MultiLangString[]
  }
  childAgeGroups?: Array<{
    code: string
    name: MultiLangString[]
    minAge: number
    maxAge: number
  }>
  rating?: number
  reviewCount?: number
  featured?: boolean
}

export interface StorefrontData {
  hero?: {
    photo?: PhotoRef
    title?: MultiLangString[]
    description?: MultiLangString[]
    searchOptions?: string[]
    backdropFilter?: boolean
  }
  campaignSection?: Array<{
    photo?: PhotoRef
    title?: MultiLangString[]
    url?: string
    description?: MultiLangString[]
  }>
  locationSection?: {
    title?: MultiLangString[]
    description?: MultiLangString[]
    items: Array<{
      city: string
      country: string
      photo?: PhotoRef
      link?: string
    }>
  }
  hotels?: {
    title?: MultiLangString[]
    description?: MultiLangString[]
    items: any[]
  }
  tours?: {
    title?: MultiLangString[]
    description?: MultiLangString[]
    items: any[]
  }
  homepageTheme?: { type: string }
  useCustomTheme?: boolean
  customTheme?: any
  header?: { tabs: any[]; headerType: 'default' | 'white' }
  footer?: { items: any[] }
  settings?: any
  underMaintenance?: boolean
  maintenanceMessage?: string
}

export interface SearchResult {
  rooms: Array<{
    roomType: {
      code: string
      name: string
      description?: string
      images?: any[]
      occupancy?: any
    }
    options: Array<{
      mealPlan: { code: string; name: string }
      availability: number
      prices: any
      campaignDiscount?: number
      cancellationPolicy?: any
    }>
  }>
}

export interface BookingPayload {
  hotelCode: string
  checkIn: string
  checkOut: string
  rooms: Array<{
    roomTypeCode: string
    mealPlanCode: string
    adults: number
    children?: number[]
    guests: Array<{
      firstName: string
      lastName: string
      type: 'adult' | 'child'
      age?: number
    }>
  }>
  contact: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  specialRequests?: string
  countryCode?: string
  paymentMethod: 'creditCard' | 'payAtHotel' | 'bankTransfer'
  guestLanguage?: string
}
