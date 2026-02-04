/**
 * Storefront Model - Simplified
 * Multi-tenant B2C website configuration
 */

import mongoose from 'mongoose'

const Schema = mongoose.Schema

// ==================== REUSABLE SCHEMAS ====================

const photoSchema = new Schema(
  { id: String, width: Number, height: Number, link: String },
  { _id: false }
)
const langSchema = new Schema(
  { lang: { type: String, default: '' }, value: { type: String, default: '' } },
  { _id: false }
)
const defaultLang = () => [{ lang: 'en', value: '' }]

// ==================== HERO SCHEMA ====================

const heroSchema = new Schema(
  {
    photo: { type: photoSchema, default: () => ({}) },
    title: { type: [langSchema], default: defaultLang },
    description: { type: [langSchema], default: defaultLang },
    searchOptions: { type: [String], default: () => ['hotel'] },
    backdropFilter: { type: Boolean, default: false },
    negativeMarginOverride: {
      status: { type: Boolean, default: false },
      value: { type: Number, default: 0 },
      applyOn: { type: String, enum: ['all', 'desktop', 'mobile'], default: 'all' }
    }
  },
  { _id: false }
)

// ==================== CAMPAIGN/LOCATION SCHEMAS ====================

const campaignItemSchema = new Schema(
  {
    photo: { type: photoSchema, default: () => ({}) },
    title: { type: [langSchema], default: defaultLang },
    url: String,
    description: { type: [langSchema], default: defaultLang }
  },
  { _id: false }
)

const locationSchema = new Schema(
  {
    city: String,
    country: String,
    photo: { type: photoSchema, default: () => ({}) },
    index: Number,
    link: String
  },
  { _id: false }
)

// ==================== SETTINGS SCHEMA ====================

const settingsSchema = new Schema(
  {
    name: String,
    logo: { type: photoSchema, default: () => ({}) },
    favicon: { type: photoSchema, default: () => ({}) },
    etbis: { photo: { type: photoSchema, default: () => ({}) }, id: String },
    tursab: {
      photo: { type: photoSchema, default: () => ({}) },
      link: String,
      documentNumber: String
    },
    socials: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
      youtube: String,
      appStore: String,
      googlePlay: String
    },
    callcenter: { number: String, whatsapp: String, email: String },
    callCenter: { phone: String, whatsapp: String, email: String, workingHours: String },
    banks: [String],
    paymentMethods: [String],
    seo: {
      title: { type: [langSchema], default: defaultLang },
      keywords: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      googleAnalyticsId: String
    },
    extranetLink: String,
    siteTitle: String,
    themeColor: String,
    address: String
  },
  { _id: false }
)

// ==================== HEADER/FOOTER SCHEMAS ====================

const tabItemSchema = new Schema(
  {
    title: { type: [langSchema], default: defaultLang },
    link: String,
    subItems: { type: [Schema.Types.Mixed], default: () => [] }
  },
  { _id: false }
)

const tabSchema = new Schema(
  {
    title: { type: [langSchema], default: defaultLang },
    link: String,
    photo: { type: photoSchema, default: () => ({}) },
    items: { type: [tabItemSchema], default: () => [] }
  },
  { _id: false }
)

const headerSchema = new Schema(
  {
    tabs: { type: [tabSchema], default: () => [] },
    headerType: { type: String, enum: ['default', 'white'], default: 'default' }
  },
  { _id: false }
)

const footerSubItemSchema = new Schema(
  { title: { type: [langSchema], default: defaultLang }, link: String },
  { _id: false }
)
const footerItemSchema = new Schema(
  {
    title: { type: [langSchema], default: defaultLang },
    link: String,
    subItems: {
      type: [footerSubItemSchema],
      default: () => [],
      validate: [v => v.length <= 8, 'Max 8 sub-items']
    }
  },
  { _id: false }
)
const footerSchema = new Schema(
  {
    items: {
      type: [footerItemSchema],
      default: () => [],
      validate: [v => v.length <= 3, 'Max 3 items']
    }
  },
  { _id: false }
)

// ==================== PAGE SCHEMA ====================

const pageSchema = new Schema(
  {
    url: { type: String, required: true },
    title: { type: [langSchema], default: defaultLang },
    content: { type: [langSchema], default: defaultLang }
  },
  { _id: false }
)

// ==================== SHOWCASE SCHEMAS ====================

const hotelShowcaseSchema = new Schema(
  {
    title: { type: [langSchema], default: defaultLang },
    description: { type: [langSchema], default: defaultLang },
    ids: [Number],
    names: [String]
  },
  { _id: false }
)

const tourShowcaseSchema = new Schema(
  {
    title: { type: [langSchema], default: defaultLang },
    description: { type: [langSchema], default: defaultLang },
    ids: [Number],
    names: { type: [langSchema], default: defaultLang }
  },
  { _id: false }
)

// ==================== THEME SCHEMAS ====================

const defaultThemeSchema = new Schema(
  {
    hero: { type: heroSchema, default: () => ({}) },
    campaignSection: { type: [campaignItemSchema], default: () => [] },
    locationSection: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      items: { type: [locationSchema], default: () => [] }
    },
    hotels: { type: hotelShowcaseSchema, default: () => ({}) },
    tours: { type: tourShowcaseSchema, default: () => ({}) }
  },
  { _id: false, strict: false }
)

const tourThemeSchema = new Schema(
  {
    hero: {
      photo: { type: photoSchema, default: () => ({}) },
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang }
    },
    campaignSection: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      campaign: { type: campaignItemSchema, default: () => ({}) },
      campaignTourIds: [Number]
    },
    locations: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      items: [{ city: String, photo: { type: photoSchema, default: () => ({}) }, index: Number }]
    },
    tours: { type: tourShowcaseSchema, default: () => ({}) },
    listType: { type: String, enum: ['carousel', 'grid'], default: 'carousel' },
    categories: {
      type: [String],
      default: () => ['activity', 'adventure', 'city', 'cruise', 'museum']
    },
    subdomain: {
      status: { type: Boolean, default: false },
      value: { type: String, default: 'tour' }
    }
  },
  { _id: false }
)

const activityThemeSchema = new Schema(
  {
    hero: {
      photo: { type: photoSchema, default: () => ({}) },
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang }
    },
    campaignSection: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      campaign: {
        type: [campaignItemSchema],
        default: () => [],
        validate: [v => v.length <= 3, 'Max 3']
      }
    },
    tourIds: { top4: [Number], bottom8: [Number] },
    locations: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      items: { type: [locationSchema], default: () => [] }
    },
    categories: {
      type: [String],
      default: () => ['activity', 'cruise', 'events', 'festivals', 'transfer']
    },
    subdomain: {
      status: { type: Boolean, default: false },
      value: { type: String, default: 'activity' }
    }
  },
  { _id: false }
)

const flightThemeSchema = new Schema(
  {
    hero: {
      photo: {
        type: [photoSchema],
        default: () => [{}, {}],
        validate: [v => v.length <= 2, 'Max 2']
      },
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang }
    },
    routes: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      items: {
        type: [{ departure: String, arrival: String, departureDate: Date, arrivalDate: Date }],
        validate: [v => v.length <= 5, 'Max 5']
      }
    },
    locations: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      items: { type: [locationSchema], default: () => [] }
    },
    subdomain: {
      status: { type: Boolean, default: false },
      value: { type: String, default: 'flight' }
    },
    mr: { type: Number, default: 0 }
  },
  { _id: false }
)

const transferThemeSchema = new Schema(
  {
    hero: {
      photo: { type: photoSchema, default: () => ({}) },
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang }
    },
    transfers: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      ids: [Number]
    },
    subdomain: {
      status: { type: Boolean, default: false },
      value: { type: String, default: 'transfer' }
    }
  },
  { _id: false }
)

const cruiseThemeSchema = new Schema(
  {
    hero: {
      photo: { type: photoSchema, default: () => ({}) },
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang }
    },
    tours: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      ids: [Number]
    },
    searchLocationPreset: { departure: [String], arrival: [String] },
    subdomain: {
      status: { type: Boolean, default: false },
      value: { type: String, default: 'cruise' }
    }
  },
  { _id: false }
)

const bedbankThemeSchema = new Schema(
  {
    hero: {
      photo: { type: photoSchema, default: () => ({}) },
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang }
    },
    locations: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      items: [
        {
          bbLocationId: Number,
          bbLocationName: String,
          photo: { type: photoSchema, default: () => ({}) },
          index: Number
        }
      ]
    },
    showcase: {
      title: { type: [langSchema], default: defaultLang },
      description: { type: [langSchema], default: defaultLang },
      ids: [{ id: Number, name: String }]
    },
    sections: {
      type: [
        {
          title: { type: [langSchema], default: defaultLang },
          description: { type: [langSchema], default: defaultLang },
          locationId: Number,
          locationName: String
        }
      ],
      validate: [v => v.length <= 5, 'Max 5']
    },
    mr: { type: Number, default: 0 },
    subdomain: {
      status: { type: Boolean, default: false },
      value: { type: String, default: 'bedbank' }
    }
  },
  { _id: false }
)

const homepageThemeSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['home1', 'home2', 'tour', 'flight', 'activity', 'hotel', 'transfer', 'cruise', 'bedbank'],
      default: 'home1'
    },
    home1: { type: defaultThemeSchema, default: () => ({}) },
    home2: { type: defaultThemeSchema, default: () => ({}) },
    hotel: { type: defaultThemeSchema, default: () => ({}) },
    tour: { type: tourThemeSchema, default: () => ({}) },
    activity: { type: activityThemeSchema, default: () => ({}) },
    flight: { type: flightThemeSchema, default: () => ({}) },
    transfer: { type: transferThemeSchema, default: () => ({}) },
    cruise: { type: cruiseThemeSchema, default: () => ({}) },
    bedbank: { type: bedbankThemeSchema, default: () => ({}) }
  },
  { _id: false }
)

// ==================== CUSTOM HOMEPAGE (PRESETS) ====================

/**
 * Custom theme is only a pointer to the active preset.
 * B2C reads the active preset content from `savedThemePresets`.
 */
const customThemeSchema = new Schema(
  {
    activePresetId: { type: String, default: null }
  },
  { _id: false }
)

/**
 * A preset represents a "custom homepage bundle" (multiple custom pages),
 * where each page stores its own customization (sections + data).
 *
 * We intentionally keep `customization` flexible to match the admin UI payload.
 */
const presetPageSchema = new Schema(
  {
    id: { type: String, required: true },
    url: { type: String, default: '/', trim: true },
    isActive: { type: Boolean, default: true },
    name: { type: String, default: '' },
    customization: { type: Schema.Types.Mixed, default: () => ({}) }
  },
  { _id: false }
)

const presetSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    pages: { type: [presetPageSchema], default: () => [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

// ==================== MAIN STOREFRONT SCHEMA ====================

const StorefrontSchema = new Schema(
  {
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    legacyAccountId: { type: Number, sparse: true, index: true },
    underMaintenance: { type: Boolean, default: false },
    useCustomTheme: { type: Boolean, default: false },
    customTheme: { type: customThemeSchema, default: () => ({}) },
    draft: { data: { type: Schema.Types.Mixed, default: () => ({}) }, lastModified: Date },
    savedThemePresets: {
      type: [presetSchema],
      default: () => [],
      validate: [v => v.length <= 10, 'Max 10 presets']
    },
    homepageTheme: { type: homepageThemeSchema, default: () => ({}) },
    settings: { type: settingsSchema, default: () => ({}) },
    header: { type: headerSchema, default: () => ({}) },
    footer: { type: footerSchema, default: () => ({}) },
    pages: { type: [pageSchema], default: () => [], select: false },
    photos: {
      type: [photoSchema],
      default: () => [],
      validate: [v => v.length <= 20, 'Max 20 photos']
    }
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'storefronts',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

StorefrontSchema.index({ partner: 1 }, { unique: true })

// ==================== PHOTO LINK GENERATION ====================

const generatePhotoLink = (partnerId, pathParts, photoId) =>
  `storefront/${partnerId}/${pathParts.join('/')}/${photoId}.webp`

const applyPhotoLink = (photo, partnerId, pathParts) => {
  if (photo?.id && !photo.link) photo.link = generatePhotoLink(partnerId, pathParts, photo.id)
}

const applyPhotoLinks = (doc, partnerId) => {
  if (!doc || !partnerId) return

  // Settings
  applyPhotoLink(doc.settings?.logo, partnerId, ['settings', 'logo'])
  applyPhotoLink(doc.settings?.favicon, partnerId, ['settings', 'favicon'])
  applyPhotoLink(doc.settings?.etbis?.photo, partnerId, ['settings', 'etbis'])
  applyPhotoLink(doc.settings?.tursab?.photo, partnerId, ['settings', 'tursab'])

  // Header tabs
  doc.header?.tabs?.forEach((tab, i) => applyPhotoLink(tab.photo, partnerId, ['header', i]))

  // Photos array
  doc.photos?.forEach((photo, i) => applyPhotoLink(photo, partnerId, ['photos', i]))

  // Theme-specific photos
  const themes = [
    'home1',
    'home2',
    'hotel',
    'tour',
    'activity',
    'flight',
    'transfer',
    'cruise',
    'bedbank'
  ]
  themes.forEach(theme => {
    const t = doc.homepageTheme?.[theme]
    if (!t) return

    // Hero
    if (Array.isArray(t.hero?.photo))
      t.hero.photo.forEach((p, i) => applyPhotoLink(p, partnerId, [theme, 'hero', i]))
    else applyPhotoLink(t.hero?.photo, partnerId, [theme, 'hero'])

    // Locations
    const locs = t.locationSection?.items || t.locations?.items
    locs?.forEach((item, i) => {
      item.index = i
      applyPhotoLink(item.photo, partnerId, [theme, 'locations', i])
    })

    // Campaigns
    const camps = t.campaignSection
    if (Array.isArray(camps))
      camps.forEach((c, i) => applyPhotoLink(c.photo, partnerId, [theme, 'campaigns', i]))
    else if (camps?.campaign) {
      if (Array.isArray(camps.campaign))
        camps.campaign.forEach((c, i) =>
          applyPhotoLink(c.photo, partnerId, [theme, 'campaigns', i])
        )
      else applyPhotoLink(camps.campaign?.photo, partnerId, [theme, 'campaigns'])
    }
  })

  // NOTE: Custom homepage presets can contain uploaded photos inside `customization`.
  // We intentionally do NOT attempt to auto-generate links for arbitrary structures here
  // to keep the model simple and avoid accidental mutations.
}

StorefrontSchema.pre('save', function (next) {
  const partnerId = this.partner?.toString?.()
  if (partnerId) applyPhotoLinks(this, partnerId)
  next()
})

StorefrontSchema.pre(['findOneAndUpdate', 'updateOne'], async function (next) {
  const update = this.getUpdate()
  if (!update) return next()

  let partnerId = update.partner || this.getQuery().partner
  if (partnerId?.toString) partnerId = partnerId.toString()
  if (!partnerId) {
    const doc = await this.model.findOne(this.getQuery()).select('partner').lean()
    partnerId = doc?.partner?.toString()
  }
  if (!partnerId) return next()

  applyPhotoLinks(update, partnerId)
  if (update.$set) applyPhotoLinks(update.$set, partnerId)
  next()
})

// ==================== STATIC METHODS ====================

StorefrontSchema.statics.getOrCreateForPartner = async function (partnerId) {
  let storefront = await this.findOne({ partner: partnerId })
  if (!storefront) {
    storefront = await this.create({
      partner: partnerId,
      settings: {
        seo: { title: defaultLang(), description: defaultLang(), keywords: defaultLang() }
      }
    })
  }
  return storefront
}

StorefrontSchema.statics.getStorefrontPages = async function (partnerId, url) {
  if (!partnerId) return []
  const doc = await this.findOne({ partner: partnerId }).select('+pages').lean()
  if (!doc?.pages) return []
  return url ? doc.pages.filter(p => p.url === url) : doc.pages
}

// ==================== EXPORTS ====================

const Storefront = mongoose.model('Storefront', StorefrontSchema)
export default Storefront
