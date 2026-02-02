/**
 * @booking-engine/constants/storefront
 * Canonical storefront section types and configuration
 *
 * IMPORTANT: This is the single source of truth for section types.
 * - API model uses SECTION_TYPES for Mongoose enum validation
 * - Admin UI uses this for section picker (with UI_SECTION_ALIASES for display)
 * - Public API uses this for response validation
 *
 * When adding new section types:
 * 1. Add to SECTION_TYPES array
 * 2. Add to SECTION_CONFIG with category and constraints
 * 3. If UI needs a friendly alias, add to UI_SECTION_ALIASES
 * 4. Add i18n key for the section name
 */

// ==================== CANONICAL SECTION TYPES ====================

/**
 * All valid section type IDs (used in Mongoose enum)
 * This is the ONLY place where section types should be defined
 */
export const SECTION_TYPES = [
  // Hero sections - only one allowed, must be first
  'hero-1',
  'hero-5',
  'hero-6',
  'hero-8',
  'hero-9',
  'hero-10',
  'hero-bedbank',

  // Content sections - main homepage content
  'destinations',
  'campaigns',
  'hotels',
  'tours-carousel',
  'campaign-tours',
  'tours-grid',
  'activity-campaigns',
  'activities-grid',
  'flights',
  'cruise-deals',
  'transfers',
  'bedbank-destinations',
  'bedbank-showcase',
  'bedbank-section',

  // Utility sections - guides, CTAs
  'block-guide',
  'block-guide-2',
  'cta-newsletter',

  // Footer sections - only one allowed, must be last
  'footer-default',
  'footer-minimal'
]

/**
 * Section type values array (for validation)
 */
export const SECTION_TYPE_VALUES = Object.freeze([...SECTION_TYPES])

// ==================== SECTION CATEGORIES ====================

/**
 * Section categories for UI grouping
 */
export const SECTION_CATEGORIES = {
  HERO: 'hero',
  CONTENT: 'content',
  UTILITY: 'utility',
  FOOTER: 'footer'
}

export const SECTION_CATEGORY_VALUES = Object.values(SECTION_CATEGORIES)

// ==================== SECTION CONFIGURATION ====================

/**
 * Section configuration: constraints, category, default settings
 */
export const SECTION_CONFIG = {
  // Hero sections
  'hero-1': {
    category: SECTION_CATEGORIES.HERO,
    maxCount: 1,
    requiredPosition: 'first',
    icon: 'image',
    defaultSettings: { searchOptions: ['hotel', 'tour', 'flight'], backdropFilter: true }
  },
  'hero-5': {
    category: SECTION_CATEGORIES.HERO,
    maxCount: 1,
    requiredPosition: 'first',
    icon: 'vertical_split',
    defaultSettings: { searchOptions: ['tour'] }
  },
  'hero-6': {
    category: SECTION_CATEGORIES.HERO,
    maxCount: 1,
    requiredPosition: 'first',
    icon: 'image',
    defaultSettings: { searchOptions: ['activity'] }
  },
  'hero-8': {
    category: SECTION_CATEGORIES.HERO,
    maxCount: 1,
    requiredPosition: 'first',
    icon: 'image',
    defaultSettings: { searchOptions: ['transfer'] }
  },
  'hero-9': {
    category: SECTION_CATEGORIES.HERO,
    maxCount: 1,
    requiredPosition: 'first',
    icon: 'image',
    defaultSettings: { searchOptions: ['cruise'] }
  },
  'hero-10': {
    category: SECTION_CATEGORIES.HERO,
    maxCount: 1,
    requiredPosition: 'first',
    icon: 'image',
    defaultSettings: { searchOptions: ['flight'] }
  },
  'hero-bedbank': {
    category: SECTION_CATEGORIES.HERO,
    maxCount: 1,
    requiredPosition: 'first',
    icon: 'bed',
    defaultSettings: { searchOptions: ['bedbank'] }
  },

  // Content sections
  destinations: {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 3,
    icon: 'location_on',
    defaultSettings: { routeType: 'hotel', maxItems: 8 }
  },
  campaigns: {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 2,
    icon: 'campaign',
    defaultSettings: {}
  },
  hotels: {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 2,
    icon: 'hotel',
    defaultSettings: { showFilter: true }
  },
  'tours-carousel': {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 3,
    icon: 'view_carousel',
    defaultSettings: { layoutType: 'carousel', maxItems: 8 }
  },
  'campaign-tours': {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 2,
    icon: 'campaign',
    defaultSettings: {}
  },
  'tours-grid': {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 3,
    icon: 'grid_view',
    defaultSettings: { layoutType: 'grid', maxItems: 6 }
  },
  'activity-campaigns': {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 2,
    icon: 'local_activity',
    defaultSettings: {}
  },
  'activities-grid': {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 2,
    icon: 'grid_view',
    defaultSettings: {}
  },
  flights: {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 1,
    icon: 'flight',
    defaultSettings: {}
  },
  'cruise-deals': {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 1,
    icon: 'sailing',
    defaultSettings: {}
  },
  transfers: {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 1,
    icon: 'airport_shuttle',
    defaultSettings: {}
  },
  'bedbank-destinations': {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 1,
    icon: 'public',
    defaultSettings: {}
  },
  'bedbank-showcase': {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 1,
    icon: 'hotel',
    defaultSettings: {}
  },
  'bedbank-section': {
    category: SECTION_CATEGORIES.CONTENT,
    maxCount: 3,
    icon: 'view_agenda',
    defaultSettings: {}
  },

  // Utility sections
  'block-guide': {
    category: SECTION_CATEGORIES.UTILITY,
    maxCount: 2,
    icon: 'help_outline',
    defaultSettings: {}
  },
  'block-guide-2': {
    category: SECTION_CATEGORIES.UTILITY,
    maxCount: 2,
    icon: 'support_agent',
    defaultSettings: {}
  },
  'cta-newsletter': {
    category: SECTION_CATEGORIES.UTILITY,
    maxCount: 1,
    icon: 'ads_click',
    defaultSettings: {}
  },

  // Footer sections
  'footer-default': {
    category: SECTION_CATEGORIES.FOOTER,
    maxCount: 1,
    requiredPosition: 'last',
    icon: 'call_to_action',
    defaultSettings: {}
  },
  'footer-minimal': {
    category: SECTION_CATEGORIES.FOOTER,
    maxCount: 1,
    requiredPosition: 'last',
    icon: 'minimize',
    defaultSettings: {}
  }
}

// ==================== UI ALIASES ====================

/**
 * UI-friendly aliases that map to canonical section types
 * Key = UI display ID, Value = canonical section type ID
 *
 * Usage in admin: Display "Hero Split" in UI, send "hero-5" to API
 */
export const UI_SECTION_ALIASES = {
  'hero-split': 'hero-5', // UI shows "Hero Split", API stores "hero-5"
  'cta-tursab': 'cta-newsletter' // Legacy alias for backwards compatibility
}

/**
 * Reverse mapping: canonical type -> UI alias (if any)
 */
export const CANONICAL_TO_UI_ALIAS = Object.fromEntries(
  Object.entries(UI_SECTION_ALIASES).map(([alias, canonical]) => [canonical, alias])
)

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert UI section ID to canonical type (for API calls)
 * @param {string} uiSectionId - Section ID from UI
 * @returns {string} Canonical section type ID
 */
export const toCanonicalSectionType = uiSectionId => {
  return UI_SECTION_ALIASES[uiSectionId] || uiSectionId
}

/**
 * Convert canonical section type to UI alias (for display)
 * @param {string} canonicalType - Canonical section type ID
 * @returns {string} UI display ID (alias if exists, otherwise canonical)
 */
export const toUiSectionType = canonicalType => {
  return CANONICAL_TO_UI_ALIAS[canonicalType] || canonicalType
}

/**
 * Check if a section type is valid (canonical)
 * @param {string} sectionType - Section type to validate
 * @returns {boolean}
 */
export const isValidSectionType = sectionType => {
  const canonical = toCanonicalSectionType(sectionType)
  return SECTION_TYPES.includes(canonical)
}

/**
 * Get section configuration
 * @param {string} sectionType - Section type (UI or canonical)
 * @returns {object|null}
 */
export const getSectionConfig = sectionType => {
  const canonical = toCanonicalSectionType(sectionType)
  return SECTION_CONFIG[canonical] || null
}

/**
 * Get section category
 * @param {string} sectionType - Section type (UI or canonical)
 * @returns {string|null}
 */
export const getSectionCategory = sectionType => {
  const config = getSectionConfig(sectionType)
  return config?.category || null
}

/**
 * Get section max count constraint
 * @param {string} sectionType - Section type (UI or canonical)
 * @returns {number}
 */
export const getSectionMaxCount = sectionType => {
  const config = getSectionConfig(sectionType)
  return config?.maxCount || Infinity
}

/**
 * Check if section type is a hero section
 * @param {string} sectionType - Section type (UI or canonical)
 * @returns {boolean}
 */
export const isHeroSection = sectionType => {
  return getSectionCategory(sectionType) === SECTION_CATEGORIES.HERO
}

/**
 * Check if section type is a footer section
 * @param {string} sectionType - Section type (UI or canonical)
 * @returns {boolean}
 */
export const isFooterSection = sectionType => {
  return getSectionCategory(sectionType) === SECTION_CATEGORIES.FOOTER
}

/**
 * Validate section array configuration
 * @param {Array} sections - Array of section configs with sectionType property
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateSectionConfig = sections => {
  const errors = []
  const counts = {}

  sections.forEach((section, index) => {
    const canonical = toCanonicalSectionType(section.sectionType)
    counts[canonical] = (counts[canonical] || 0) + 1

    // Check valid type
    if (!isValidSectionType(canonical)) {
      errors.push(`Invalid section type: "${section.sectionType}"`)
      return
    }

    const config = SECTION_CONFIG[canonical]

    // Check max count
    if (config.maxCount && counts[canonical] > config.maxCount) {
      errors.push(`Section type "${canonical}" can only appear ${config.maxCount} time(s)`)
    }

    // Check required position
    if (config.requiredPosition === 'first' && section.order !== 0) {
      errors.push(`Section type "${canonical}" must be the first section`)
    }
    if (config.requiredPosition === 'last' && section.order !== sections.length - 1) {
      errors.push(`Section type "${canonical}" must be the last section`)
    }
  })

  // Ensure at least one hero if sections exist
  if (sections.length > 0) {
    const hasHero = sections.some(s => isHeroSection(s.sectionType))
    if (!hasHero) {
      errors.push('At least one hero section is required')
    }
  }

  return { valid: errors.length === 0, errors }
}

// ==================== I18N LABEL KEYS ====================

/**
 * I18n keys for section type labels
 * Usage: t(`website.sections.types.${getSectionLabelKey(sectionType)}`)
 */
export const SECTION_LABEL_KEYS = {
  'hero-1': 'hero1',
  'hero-5': 'heroSplit',
  'hero-6': 'hero6',
  'hero-8': 'hero8',
  'hero-9': 'hero9',
  'hero-10': 'hero10',
  'hero-bedbank': 'heroBedbank',
  destinations: 'destinations',
  campaigns: 'campaigns',
  hotels: 'hotels',
  'tours-carousel': 'toursCarousel',
  'campaign-tours': 'campaignTours',
  'tours-grid': 'toursGrid',
  'activity-campaigns': 'activityCampaigns',
  'activities-grid': 'activitiesGrid',
  flights: 'flights',
  'cruise-deals': 'cruiseDeals',
  transfers: 'transfers',
  'bedbank-destinations': 'bedbankDestinations',
  'bedbank-showcase': 'bedbankShowcase',
  'bedbank-section': 'bedbankSection',
  'block-guide': 'blockGuide',
  'block-guide-2': 'blockGuide2',
  'cta-newsletter': 'ctaNewsletter',
  'footer-default': 'footerDefault',
  'footer-minimal': 'footerMinimal'
}

/**
 * Get i18n label key for section type
 * @param {string} sectionType - Section type (UI or canonical)
 * @returns {string}
 */
export const getSectionLabelKey = sectionType => {
  const canonical = toCanonicalSectionType(sectionType)
  return SECTION_LABEL_KEYS[canonical] || canonical
}

// ==================== PUBLIC VIEW FIELDS ====================

/**
 * Fields to include in public storefront response (B2C website)
 * Excludes: presets, drafts, admin metadata
 */
export const PUBLIC_STOREFRONT_FIELDS = [
  'partner',
  'underMaintenance',
  'useCustomTheme',
  'customTheme.activePresetId',
  'hero',
  'campaignSection',
  'locationSection',
  'hotels',
  'tours',
  'homepageTheme',
  'settings',
  'header',
  'footer',
  'photos'
]

/**
 * Fields to EXCLUDE from public response (admin-only)
 */
export const ADMIN_ONLY_FIELDS = ['savedThemePresets', 'legacyAccountId']

// ==================== ADMIN DRAFT / PRESET SAFETY ====================

/**
 * Allowed top-level keys for admin draft saves (`PUT /storefronts/draft`).
 * This is a shared whitelist used by BOTH admin and API to prevent arbitrary data being persisted.
 */
export const STOREFRONT_DRAFT_ALLOWED_FIELDS = [
  // Legacy homepage fields (used by ThemeSelectorTab + HomepageCustomizerTab editors)
  'hero',
  'campaignSection',
  'locationSection',
  'hotels',
  'tours',

  // Core website configuration
  'homepageTheme',
  'settings',
  'header',
  'footer',
  'underMaintenance',
  'photos',

  // Custom homepage system
  'useCustomTheme',
  'customTheme',
  'savedThemePresets',

  // Backward compatibility: UI still emits this as an editor state; server may choose to ignore it.
  'activeSections'
]
