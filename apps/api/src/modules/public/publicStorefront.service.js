/**
 * Public Storefront Service
 * Public-facing storefront data for B2C website rendering
 * No authentication required - resolves partner from domain
 *
 * Key Features:
 * - Domain-based partner resolution (no JWT needed)
 * - Public-safe response shaping (excludes admin metadata)
 * - ETag-based caching support
 * - Projection control via ?view parameter
 */

import { asyncHandler } from '#helpers'
import Storefront from '../storefront/storefront.model.js'
import Partner from '../partner/partner.model.js'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import crypto from 'crypto'

/**
 * Normalize a URL path (strip query/hash, ensure leading slash, collapse slashes, remove trailing slash).
 */
const normalizePath = raw => {
  if (!raw) return '/'
  const s = String(raw).split('?')[0].split('#')[0].trim()
  if (!s) return '/'
  const withSlash = s.startsWith('/') ? s : `/${s}`
  const collapsed = withSlash.replace(/\/{2,}/g, '/')
  const noTrailing = collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed
  return noTrailing || '/'
}

/**
 * Resolve partner ID from domain or explicit parameter
 * @param {Object} req - Express request
 * @returns {string|null} Partner ID
 */
const resolvePartnerFromRequest = async req => {
  const normalizeDomain = raw => {
    if (!raw) return ''
    let s = String(raw).trim()
    if (!s) return ''

    // If a full URL was passed, extract hostname
    try {
      if (s.includes('://')) s = new URL(s).hostname
    } catch {}

    // Strip path/query and port
    s = s.split('/')[0].split('?')[0].split('#')[0]
    s = s.split(':')[0]

    s = s.toLowerCase().trim()
    if (s.startsWith('www.')) s = s.slice(4)
    return s
  }

  // Option 1: Explicit partnerId in query (for development/testing)
  if (req.query.partnerId) {
    const partner = await Partner.findById(req.query.partnerId).select('_id status')
    if (partner && partner.status === 'active') {
      return partner._id.toString()
    }
  }

  // Option 2: Domain resolution (production)
  const domainRaw =
    req.query.domain || req.headers['x-storefront-domain'] || req.hostname || req.headers.host
  const normalizedDomain = normalizeDomain(domainRaw)
  if (normalizedDomain) {
    const candidates = Array.from(new Set([normalizedDomain, `www.${normalizedDomain}`]))

    // Public storefront should primarily resolve by siteDomain, but we keep fallbacks
    // to avoid breaking environments that still use pmsDomain/extranetDomain.
    const partner = await Partner.findOne({
      status: 'active',
      $or: [
        { 'branding.siteDomain': { $in: candidates } },
        { 'branding.pmsDomain': { $in: candidates } },
        { 'branding.extranetDomain': { $in: candidates } }
      ]
    }).select('_id status')

    if (partner) return partner._id.toString()
  }

  return null
}

/**
 * Shape storefront response for public consumption
 * Removes admin-only fields like presets, drafts, legacy IDs
 * @param {Object} storefront - Raw storefront document
 * @param {boolean} isDraftLive - If true, include draft fields for preview
 * @returns {Object} Public-safe storefront data
 */
const shapePublicResponse = (storefront, isDraftLive = false) => {
  if (!storefront) return null

  // Create a clean copy
  const publicData = { ...storefront }

  // Remove admin-only fields
  delete publicData.legacyAccountId
  delete publicData.draft
  // NOTE: savedThemePresets can be large; we derive the active page instead.
  delete publicData.savedThemePresets

  // Remove internal fields
  delete publicData.__v

  return publicData
}

/**
 * Generate ETag for caching
 * @param {Object} storefront - Storefront document
 * @returns {string} ETag value
 */
const generateETag = (storefront, isDraftLive = false) => {
  if (!storefront) return null
  const content = JSON.stringify({
    id: storefront._id,
    updatedAt: storefront.updatedAt,
    // draftLive should vary by draft timestamp (without affecting live ETag)
    draft: isDraftLive ? storefront.draft?.lastModified || null : null
  })
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`
}

/**
 * Apply draft overlay onto storefront for draftLive preview.
 * Only overlays whitelisted top-level fields.
 */
const applyDraftOverlay = storefront => {
  const draftData = storefront?.draft?.data
  if (!draftData || typeof draftData !== 'object') return storefront

  const allowedFields = [
    'hero',
    'campaignSection',
    'locationSection',
    'hotels',
    'tours',
    'homepageTheme',
    'settings',
    'header',
    'footer',
    'customTheme',
    'savedThemePresets',
    'useCustomTheme',
    'underMaintenance',
    'photos'
  ]

  const merged = { ...storefront }
  for (const key of allowedFields) {
    if (draftData[key] !== undefined) merged[key] = draftData[key]
  }

  // Do not expose draft container publicly
  delete merged.draft
  return merged
}

/**
 * Resolve active custom preset + page for a requested path.
 * Returns minimal public-safe data (does not expose all presets).
 */
const resolveActivePresetPage = (storefront, requestedPath = '/') => {
  const activePresetId = storefront?.customTheme?.activePresetId || null
  const presets = storefront?.savedThemePresets || []
  const preset = presets.find(p => p?.id === activePresetId) || null

  const pages = Array.isArray(preset?.pages) ? preset.pages : []
  const reqPath = normalizePath(requestedPath)

  const byUrl = pages.find(p => normalizePath(p?.url) === reqPath && p?.isActive !== false)
  const home = pages.find(p => normalizePath(p?.url) === '/' && p?.isActive !== false)
  const selected = byUrl || home || pages[0] || null

  return {
    activePresetId,
    preset: preset
      ? { id: preset.id, name: preset.name, description: preset.description || '' }
      : null,
    page: selected
      ? {
          id: selected.id,
          url: normalizePath(selected.url),
          name: selected.name || '',
          isActive: selected.isActive !== false,
          customization:
            selected.customization && typeof selected.customization === 'object'
              ? selected.customization
              : {}
        }
      : null
  }
}

/**
 * GET /public/storefront
 * Get storefront data for B2C website rendering
 *
 * Query Parameters:
 * - domain: Domain to resolve partner (optional, defaults to request hostname)
 * - partnerId: Explicit partner ID (for testing)
 * - view: 'core' for minimal data, 'full' for complete data (default: 'full')
 * - include: Comma-separated list of sections to include (e.g., 'hero,footer,settings')
 * - exclude: Comma-separated list of sections to exclude
 * - draftLive: If 'true', returns draft content instead of published (for preview)
 *
 * Response Headers:
 * - ETag: For cache validation
 * - Cache-Control: Caching hints
 */
export const getPublicStorefront = asyncHandler(async (req, res) => {
  const partnerId = await resolvePartnerFromRequest(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_NOT_RESOLVED', {
      hint: 'Provide domain, x-storefront-domain header, or partnerId query param'
    })
  }

  const { view = 'full', include, exclude, draftLive } = req.query
  const isDraftLive = draftLive === 'true' || req.path === '/draftLive'
  // Best-effort requested path detection for multi-page custom homepages:
  // - Prefer explicit query/header (SSR-friendly)
  // - Fall back to Referer pathname (browser fetches usually include it)
  let requestedPathRaw = req.query.path || req.headers['x-storefront-path']
  if (!requestedPathRaw && req.headers.referer) {
    try {
      requestedPathRaw = new URL(req.headers.referer).pathname
    } catch (e) {}
  }
  const requestedPath = normalizePath(requestedPathRaw || '/')

  // Build projection based on view type
  let projection = {}

  if (view === 'core') {
    // Minimal data for quick initial load
    projection = {
      _id: 1,
      partner: 1,
      underMaintenance: 1,
      useCustomTheme: 1,
      customTheme: 1,
      savedThemePresets: 1,
      draft: 1,
      'homepageTheme.type': 1,
      'settings.themeColor': 1,
      'settings.siteTitle': 1,
      'settings.name': 1,
      'settings.logo': 1,
      'settings.favicon': 1,
      'settings.seo': 1,
      header: 1,
      updatedAt: 1
    }
  } else {
    // Full data - keep presets internally so we can derive the active page,
    // but never return the full preset list publicly.
    projection = { legacyAccountId: 0 }
  }

  // Handle include/exclude parameters for fine-grained control
  if (include && view === 'full') {
    const includeFields = include.split(',').map(f => f.trim())
    projection = { _id: 1, partner: 1, updatedAt: 1 }
    includeFields.forEach(field => {
      projection[field] = 1
    })
  }

  // Get storefront
  let query = Storefront.findOne({ partner: partnerId })

  // Apply projection (note: can't mix inclusion and exclusion, so handle carefully)
  if (
    Object.values(projection).every(v => v === 1) ||
    Object.values(projection).every(v => v === 0)
  ) {
    query = query.select(projection)
  }

  let storefront = await query.lean()

  if (!storefront) {
    throw new NotFoundError('STOREFRONT_NOT_FOUND')
  }

  // Handle exclusions in code if mixed projection
  if (exclude) {
    const excludeFields = exclude.split(',').map(f => f.trim())
    excludeFields.forEach(field => {
      const parts = field.split('.')
      let obj = storefront
      for (let i = 0; i < parts.length - 1; i++) {
        if (obj && obj[parts[i]]) {
          obj = obj[parts[i]]
        } else {
          obj = null
          break
        }
      }
      if (obj) {
        delete obj[parts[parts.length - 1]]
      }
    })
  }

  // For draftLive, overlay stored draft changes (if any) without mutating live.
  if (isDraftLive) {
    storefront = applyDraftOverlay(storefront)
  }

  // Shape response for public consumption
  const publicData = shapePublicResponse(storefront, isDraftLive)

  // If custom theme is enabled, return the resolved active page from the active preset.
  publicData.useCustomTheme = Boolean(storefront?.useCustomTheme)
  if (publicData.useCustomTheme) {
    const resolved = resolveActivePresetPage(storefront, requestedPath)
    publicData.customTheme = {
      ...(publicData.customTheme || {}),
      activePresetId: resolved.activePresetId,
      preset: resolved.preset,
      page: resolved.page
    }
  } else if (publicData.customTheme) {
    // Keep a minimal pointer for clients that inspect it.
    publicData.customTheme = { activePresetId: publicData.customTheme.activePresetId || null }
  }

  // Generate ETag for caching
  const etag = generateETag(storefront, isDraftLive)

  // Check If-None-Match for conditional GET
  const ifNoneMatch = req.headers['if-none-match']
  if (ifNoneMatch && ifNoneMatch === etag) {
    return res.status(304).end()
  }

  // Set caching headers
  res.set({
    ETag: etag,
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    Vary: 'Accept-Encoding'
  })

  res.json({
    success: true,
    data: publicData,
    _meta: {
      view,
      partnerId,
      etag,
      requestedPath,
      customThemeActive: Boolean(publicData.useCustomTheme),
      activePresetId: publicData.customTheme?.activePresetId || null,
      resolvedPageUrl: publicData.customTheme?.page?.url || null
    }
  })
})

/**
 * GET /public/storefront/pages
 * Get storefront pages for a domain
 */
export const getPublicStorefrontPages = asyncHandler(async (req, res) => {
  const partnerId = await resolvePartnerFromRequest(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_NOT_RESOLVED')
  }

  const { url } = req.query

  const storefront = await Storefront.findOne({ partner: partnerId }).select('+pages').lean()

  if (!storefront) {
    throw new NotFoundError('STOREFRONT_NOT_FOUND')
  }

  if (url) {
    // Return specific page
    const page = storefront.pages?.find(p => p.url === url)
    return res.json({ success: true, data: page || null })
  }

  // Return list of page URLs (not full content for listing)
  const pageList = (storefront.pages || []).map(p => ({
    url: p.url,
    title: p.title
  }))

  res.json({ success: true, data: pageList })
})

/**
 * GET /public/storefront/sections/:sectionType
 * Get a specific section's data
 */
export const getPublicStorefrontSection = asyncHandler(async (req, res) => {
  const partnerId = await resolvePartnerFromRequest(req)

  if (!partnerId) {
    throw new BadRequestError('PARTNER_NOT_RESOLVED')
  }

  const { sectionType } = req.params

  // Map section type to storefront fields
  const sectionFieldMap = {
    hero: 'hero',
    destinations: 'locationSection',
    locations: 'locationSection',
    campaigns: 'campaignSection',
    hotels: 'hotels',
    tours: 'tours',
    footer: 'footer',
    settings: 'settings',
    header: 'header'
  }

  const field = sectionFieldMap[sectionType]
  if (!field) {
    throw new BadRequestError('INVALID_SECTION_TYPE')
  }

  const storefront = await Storefront.findOne({ partner: partnerId })
    .select({ [field]: 1 })
    .lean()

  if (!storefront) {
    throw new NotFoundError('STOREFRONT_NOT_FOUND')
  }

  res.json({
    success: true,
    data: storefront[field] || null
  })
})
