/**
 * Storefront Service - Simplified
 * Business logic for storefront management
 *
 * Endpoint Strategy:
 * - GET /storefronts - Full storefront data (supports view=core for minimal)
 * - GET /storefronts/pages - CMS pages
 * - PUT /storefronts - Update any storefront fields
 * - PUT /storefronts/draft - Save draft
 * - POST /storefronts/draft/publish - Publish draft
 */

import Storefront from './storefront.model.js'
import { STOREFRONT_DRAFT_ALLOWED_FIELDS } from '@booking-engine/constants'
import SiteSettings from '../siteSettings/siteSettings.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { getPartnerId } from '#services/helpers.js'
import {
  getStorefrontDiskPath,
  getStorefrontFileUrl,
  getStorefrontUploadSubPath,
  normalizeStorefrontUploadType,
  deleteStorefrontFile,
  md5FileHex,
  md5BufferHex,
  getExistingStorefrontFileByMd5,
  setStorefrontFileMd5
} from '#helpers/storefrontUpload.js'
import { optimizeUpload } from '#helpers/imageOptimizer.js'
import logger from '#core/logger.js'
import {
  migrateStorefrontData,
  downloadImageForUpload
} from '#services/gemini/storefrontMigration.js'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

// ==================== HELPERS ====================

const generateId = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const generateETag = storefront => {
  if (!storefront) return null
  const content = JSON.stringify({
    id: storefront._id,
    updatedAt: storefront.updatedAt,
    draftLastModified: storefront._hasDraft ? storefront._draftLastModified : null
  })
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`
}

const getPartnerIdOrThrow = req => {
  const partnerId = getPartnerId(req)
  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  return partnerId
}

const toPosixPath = p => String(p || '').replace(/\\/g, '/')

const getStorefrontUploadsUrlFromRelativePath = (partnerId, relativePath) =>
  `storefront/${partnerId}/${toPosixPath(relativePath).replace(/^\/+/, '')}`

const DRAFT_ALLOWED_KEYS = new Set(STOREFRONT_DRAFT_ALLOWED_FIELDS)

const sanitizeDraftData = draftData => {
  const src = draftData && typeof draftData === 'object' ? draftData : {}
  const sanitized = {}
  Object.entries(src).forEach(([k, v]) => {
    if (!DRAFT_ALLOWED_KEYS.has(k)) return
    if (v === undefined) return
    sanitized[k] = v
  })
  return sanitized
}

const attachB2cDomain = async (storefront, partnerId) => {
  try {
    const settings = await SiteSettings.findOne({ partner: partnerId })
      .select('setup.b2cDomain')
      .lean()
    storefront.settings = {
      ...(storefront.settings || {}),
      b2cDomain: settings?.setup?.b2cDomain || ''
    }
  } catch {
    /* ignore */
  }
}

// ==================== CORE PROJECTIONS ====================

const CORE_PROJECTION = {
  _id: 1,
  partner: 1,
  underMaintenance: 1,
  useCustomTheme: 1,
  'homepageTheme.type': 1,
  'settings.themeColor': 1,
  'settings.storefrontV3Enabled': 1,
  'settings.siteTitle': 1,
  'settings.name': 1,
  'settings.logo': 1,
  'settings.favicon': 1,
  header: 1,
  updatedAt: 1
}

// ==================== MAIN ENDPOINTS ====================

/**
 * GET /storefronts
 * Returns storefront data. Use view=core for minimal data.
 */
export const getStorefront = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { view, include, exclude, includeDraft } = req.query

  // Build query with projection
  let query = Storefront.findOne({ partner: partnerId })
  if (view === 'core') query = query.select(CORE_PROJECTION)
  else if (include) {
    const projection = { _id: 1, partner: 1, updatedAt: 1 }
    include.split(',').forEach(f => {
      const field = f.trim()
      projection[field] = 1
    })
    query = query.select(projection)
    if (include.includes('pages')) query = query.select('+pages')
  } else {
    query = query.select('+pages')
  }

  let storefront = await query.lean()
  if (!storefront) {
    storefront = (await Storefront.getOrCreateForPartner(partnerId)).toObject()
  }

  await attachB2cDomain(storefront, partnerId)

  // Apply exclusions
  if (exclude) {
    exclude.split(',').forEach(field => {
      const parts = field.trim().split('.')
      let obj = storefront
      for (let i = 0; i < parts.length - 1 && obj; i++) obj = obj[parts[i]]
      if (obj) delete obj[parts[parts.length - 1]]
    })
  }

  // Merge draft if requested
  const sanitizedDraftData = sanitizeDraftData(storefront.draft?.data)
  const hasDraft = Object.keys(sanitizedDraftData).length > 0
  if (includeDraft === 'true' && hasDraft) {
    // Overlay only whitelisted draft keys to avoid legacy/stale fields masking live data.
    Object.entries(sanitizedDraftData).forEach(([k, v]) => {
      storefront[k] = v
    })
    storefront._hasDraft = true
    storefront._draftLastModified = storefront.draft.lastModified
  }

  // ETag caching
  const etag = generateETag(storefront)
  if (req.headers['if-none-match'] === etag) return res.status(304).end()

  res.set({
    ETag: etag,
    'Cache-Control':
      includeDraft === 'true'
        ? 'private, no-cache, max-age=0'
        : 'private, max-age=30, stale-while-revalidate=60',
    Vary: 'Accept-Encoding, Authorization'
  })

  res.json({
    success: true,
    data: storefront,
    _meta: { view: view || 'full', partnerId, etag, hasDraft }
  })
})

/**
 * GET /storefronts/pages
 */
export const getPages = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { url } = req.query
  const storefront = await Storefront.findOne({ partner: partnerId }).select('+pages').lean()
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')

  if (url)
    return res.json({ success: true, data: storefront.pages?.find(p => p.url === url) || null })
  res.json({
    success: true,
    data: (storefront.pages || []).map(p => ({ url: p.url, title: p.title }))
  })
})

// ==================== UPDATE ENDPOINTS ====================

/**
 * PUT /storefronts
 * Unified update endpoint - handles all storefront fields
 */
export const updateStorefront = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const existing = await Storefront.getOrCreateForPartner(partnerId)
  const themeType = req.body.homepageTheme?.type || existing.homepageTheme?.type || 'home1'

  const update = {}
  const {
    hero,
    campaignSection,
    locationSection,
    hotels,
    tours,
    homepageTheme,
    settings,
    header,
    footer,
    underMaintenance,
    useCustomTheme,
    customTheme
  } = req.body

  // Map legacy root-level fields to homepageTheme[type]
  if (
    hero !== undefined ||
    campaignSection !== undefined ||
    locationSection !== undefined ||
    hotels !== undefined ||
    tours !== undefined
  ) {
    const target = ['home1', 'home2', 'hotel'].includes(themeType) ? themeType : 'home1'
    const existingTheme =
      existing.homepageTheme?.[target]?.toObject?.() || existing.homepageTheme?.[target] || {}
    update[`homepageTheme.${target}`] = {
      ...existingTheme,
      ...(hero !== undefined && { hero }),
      ...(campaignSection !== undefined && { campaignSection }),
      ...(locationSection !== undefined && { locationSection }),
      ...(hotels !== undefined && { hotels }),
      ...(tours !== undefined && { tours })
    }
  }

  if (homepageTheme !== undefined)
    update.homepageTheme = {
      ...(existing.homepageTheme?.toObject?.() || existing.homepageTheme || {}),
      ...homepageTheme
    }
  if (settings !== undefined) update.settings = settings
  if (header !== undefined) update.header = header
  if (footer !== undefined) update.footer = footer
  if (underMaintenance !== undefined) update.underMaintenance = underMaintenance
  if (useCustomTheme !== undefined) update.useCustomTheme = useCustomTheme
  if (customTheme !== undefined) {
    update.customTheme = {
      ...(existing.customTheme?.toObject?.() || existing.customTheme || {}),
      ...customTheme
    }
  }

  const storefront = await Storefront.findOneAndUpdate(
    { partner: partnerId },
    { $set: update },
    { new: true, upsert: true }
  )
  res.json({ success: true, message: req.t('STOREFRONT_UPDATED'), data: storefront })
})

// ==================== PAGE MANAGEMENT ====================

export const addPage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { url, title, content } = req.body
  if (!url) throw new BadRequestError('PAGE_URL_REQUIRED')

  const storefront = await Storefront.findOne({ partner: partnerId }).select('+pages')
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')
  if (storefront.pages.some(p => p.url === url)) throw new BadRequestError('PAGE_URL_EXISTS')

  storefront.pages.push({ url, title: title || [], content: content || [] })
  await storefront.save()
  res
    .status(201)
    .json({ success: true, message: req.t('PAGE_ADDED'), data: storefront.pages.at(-1) })
})

export const updatePage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { url } = req.params
  const { title, content, url: newUrl } = req.body

  const storefront = await Storefront.findOne({ partner: partnerId }).select('+pages')
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')

  const page = storefront.pages.find(p => p.url === url)
  if (!page) throw new NotFoundError('PAGE_NOT_FOUND')

  if (newUrl !== undefined && newUrl !== url) {
    if (!newUrl) throw new BadRequestError('PAGE_URL_REQUIRED')
    if (storefront.pages.some(p => p.url === newUrl)) throw new BadRequestError('PAGE_URL_EXISTS')
    page.url = newUrl
  }
  if (title !== undefined) page.title = title
  if (content !== undefined) page.content = content
  await storefront.save()
  res.json({ success: true, message: req.t('PAGE_UPDATED'), data: page })
})

export const deletePage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const storefront = await Storefront.findOne({ partner: partnerId }).select('+pages')
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')

  const idx = storefront.pages.findIndex(p => p.url === req.params.url)
  if (idx === -1) throw new NotFoundError('PAGE_NOT_FOUND')

  storefront.pages.splice(idx, 1)
  await storefront.save()
  res.json({ success: true, message: req.t('PAGE_DELETED') })
})

// ==================== CUSTOM THEME ====================

export const getCustomTheme = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const storefront = await Storefront.findOne({ partner: partnerId })
    .select('useCustomTheme customTheme savedThemePresets')
    .lean()
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')
  res.json({
    success: true,
    data: {
      useCustomTheme: storefront.useCustomTheme,
      customTheme: storefront.customTheme,
      savedPresets: storefront.savedThemePresets
    }
  })
})

// ==================== PRESETS ====================

const deepClone = obj => {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch {
    return Array.isArray(obj) ? [] : {}
  }
}

const normalizePath = raw => {
  if (!raw) return '/'
  const s = String(raw).split('?')[0].split('#')[0].trim()
  if (!s) return '/'
  const withSlash = s.startsWith('/') ? s : `/${s}`
  const collapsed = withSlash.replace(/\/{2,}/g, '/')
  const noTrailing = collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed
  return noTrailing || '/'
}

const ensureDefaultPage = pages => {
  const list = Array.isArray(pages) ? pages : []
  const sanitized = list
    .map(p => ({
      id: p?.id || generateId('page'),
      url: normalizePath(p?.url || '/'),
      name: typeof p?.name === 'string' ? p.name : '',
      isActive: p?.isActive !== false,
      customization: p?.customization && typeof p.customization === 'object' ? p.customization : {}
    }))
    .filter(Boolean)

  if (sanitized.length) return sanitized

  return [{ id: generateId('page'), url: '/', name: 'Home', isActive: true, customization: {} }]
}

const getEffectiveDraftState = storefront => {
  const draft =
    (storefront?.draft?.data && typeof storefront.draft.data === 'object'
      ? storefront.draft.data
      : {}) || {}

  const savedThemePresets = Array.isArray(draft.savedThemePresets)
    ? draft.savedThemePresets
    : storefront?.savedThemePresets || []

  const customTheme =
    draft.customTheme && typeof draft.customTheme === 'object'
      ? draft.customTheme
      : storefront?.customTheme || {}

  const useCustomTheme =
    draft.useCustomTheme !== undefined
      ? Boolean(draft.useCustomTheme)
      : Boolean(storefront?.useCustomTheme)

  return { draft, savedThemePresets, customTheme, useCustomTheme }
}

const persistDraftState = async (partnerId, draftData, now = new Date()) => {
  // Ensure base doc exists with proper defaults
  await Storefront.getOrCreateForPartner(partnerId)

  await Storefront.updateOne(
    { partner: partnerId },
    {
      $set: { 'draft.data': draftData, 'draft.lastModified': now }
    },
    { timestamps: false }
  )
}

/**
 * GET /storefronts/custom-theme/presets
 * Returns saved presets, including which one is active.
 */
export const getPresets = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const storefront = await Storefront.findOne({ partner: partnerId })
    .select('savedThemePresets customTheme useCustomTheme draft')
    .lean()
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')

  const { savedThemePresets, customTheme } = getEffectiveDraftState(storefront)
  const activePresetId = customTheme?.activePresetId || null

  const presets = (savedThemePresets || []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    isActive: p.id === activePresetId
  }))

  res.json({ success: true, data: presets })
})

export const savePreset = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { name, description = '' } = req.body
  const presetName = String(name || '').trim()
  if (!presetName) throw new BadRequestError('PRESET_NAME_REQUIRED')

  const storefront = await Storefront.findOne({ partner: partnerId }).select(
    'savedThemePresets customTheme useCustomTheme draft'
  )
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')

  const { draft, savedThemePresets, customTheme } = getEffectiveDraftState(storefront)

  if ((savedThemePresets?.length || 0) >= 10) {
    throw new BadRequestError('MAX_PRESETS_REACHED')
  }

  const now = new Date()
  const activePresetId = customTheme?.activePresetId || null
  const active =
    savedThemePresets.find(p => p.id === activePresetId) || savedThemePresets.at(-1) || null

  const pages = ensureDefaultPage(deepClone(active?.pages || []))

  const preset = {
    id: generateId('preset'),
    name: presetName,
    description: String(description || ''),
    pages,
    createdAt: now,
    updatedAt: now
  }

  const nextPresets = [...(savedThemePresets || []), preset]
  const nextDraft = { ...draft, savedThemePresets: nextPresets }

  await persistDraftState(partnerId, nextDraft, now)

  res.status(201).json({ success: true, message: req.t('PRESET_SAVED'), data: preset })
})

export const updatePreset = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { presetId } = req.params
  const { name, description, pages } = req.body

  const storefront = await Storefront.findOne({ partner: partnerId }).select(
    'savedThemePresets customTheme useCustomTheme draft'
  )
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')

  const { draft, savedThemePresets } = getEffectiveDraftState(storefront)
  const presets = [...(savedThemePresets || [])]
  const idx = presets.findIndex(p => p.id === presetId)
  if (idx === -1) throw new NotFoundError('PRESET_NOT_FOUND')

  if (name !== undefined) {
    const nextName = String(name || '').trim()
    if (!nextName) throw new BadRequestError('PRESET_NAME_REQUIRED')
    presets[idx].name = nextName
  }
  if (description !== undefined) presets[idx].description = String(description || '')
  if (pages !== undefined) presets[idx].pages = ensureDefaultPage(deepClone(pages))

  presets[idx].updatedAt = new Date()

  const nextDraft = { ...draft, savedThemePresets: presets }
  await persistDraftState(partnerId, nextDraft, presets[idx].updatedAt)

  res.json({ success: true, message: req.t('PRESET_UPDATED'), data: presets[idx] })
})

export const applyPreset = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { presetId } = req.params
  const storefront = await Storefront.findOne({ partner: partnerId }).select(
    'savedThemePresets customTheme useCustomTheme draft'
  )
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')

  const { draft, savedThemePresets, customTheme } = getEffectiveDraftState(storefront)
  const preset = (savedThemePresets || []).find(p => p.id === presetId)
  if (!preset) throw new NotFoundError('PRESET_NOT_FOUND')

  const now = new Date()
  const nextDraft = {
    ...draft,
    useCustomTheme: true,
    customTheme: { ...(customTheme || {}), activePresetId: presetId }
  }
  await persistDraftState(partnerId, nextDraft, now)
  res.json({ success: true, message: req.t('PRESET_APPLIED'), data: nextDraft.customTheme })
})

export const deletePreset = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { presetId } = req.params

  const storefront = await Storefront.findOne({ partner: partnerId }).select(
    'savedThemePresets customTheme useCustomTheme draft'
  )
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')

  const { draft, savedThemePresets, customTheme } = getEffectiveDraftState(storefront)
  const nextPresets = (savedThemePresets || []).filter(p => p.id !== presetId)

  let nextActive = customTheme?.activePresetId || null
  if (nextActive === presetId) nextActive = nextPresets[0]?.id || null

  const nextDraft = {
    ...draft,
    savedThemePresets: nextPresets,
    customTheme: { ...(customTheme || {}), activePresetId: nextActive }
  }

  await persistDraftState(partnerId, nextDraft, new Date())
  res.json({ success: true, message: req.t('PRESET_DELETED') })
})

// ==================== DRAFT ====================

const DRAFT_PROTECTED_KEYS = new Set([
  '_id',
  'id',
  'partner',
  'legacyAccountId',
  'draft',
  'createdAt',
  'updatedAt',
  '__v'
])

export const saveDraft = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  await Storefront.getOrCreateForPartner(partnerId)
  const incoming = req.body && typeof req.body === 'object' ? req.body : {}
  const draftUpdate = {}
  Object.entries(incoming).forEach(([k, v]) => {
    if (DRAFT_PROTECTED_KEYS.has(k)) return
    if (!DRAFT_ALLOWED_KEYS.has(k)) return
    draftUpdate[k] = v
  })

  const now = new Date()
  const existing = await Storefront.findOne({ partner: partnerId }).select('draft').lean()
  const merged = { ...(existing?.draft?.data || {}), ...draftUpdate }

  await Storefront.updateOne(
    { partner: partnerId },
    {
      $setOnInsert: { partner: partnerId },
      $set: { 'draft.data': merged, 'draft.lastModified': now }
    },
    { upsert: true, timestamps: false }
  )
  res.json({
    success: true,
    message: req.t('DRAFT_SAVED'),
    data: { draft: merged, lastModified: now }
  })
})

export const publishDraft = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const storefront = await Storefront.findOne({ partner: partnerId })
  if (!storefront) throw new NotFoundError('STOREFRONT_NOT_FOUND')

  const draft = storefront.draft?.data || {}
  if (!Object.keys(draft).length)
    return res.json({
      success: true,
      message: req.t('NO_DRAFT_TO_PUBLISH'),
      data: { publishedAt: storefront.updatedAt }
    })

  const themeType = draft.homepageTheme?.type || storefront.homepageTheme?.type || 'home1'
  const target = ['home1', 'home2', 'hotel'].includes(themeType) ? themeType : 'home1'

  // Apply root-level fields to homepageTheme[target]
  const rootFields = ['hero', 'campaignSection', 'locationSection', 'hotels', 'tours']
  rootFields.forEach(f => {
    if (draft[f] !== undefined) {
      if (!storefront.homepageTheme) storefront.homepageTheme = { type: themeType }
      if (!storefront.homepageTheme[target]) storefront.homepageTheme[target] = {}
      storefront.homepageTheme[target][f] = draft[f]
    }
  })

  // Apply other fields
  if (draft.homepageTheme !== undefined) {
    storefront.homepageTheme = {
      ...(storefront.homepageTheme?.toObject?.() || storefront.homepageTheme || {}),
      ...draft.homepageTheme
    }
  }

  ;[
    'settings',
    'header',
    'footer',
    'useCustomTheme',
    'underMaintenance',
    'customTheme',
    'savedThemePresets',
    'photos'
  ].forEach(k => {
    if (draft[k] !== undefined) storefront[k] = draft[k]
  })

  storefront.draft = { data: {}, lastModified: null }
  await storefront.save()

  res.json({
    success: true,
    message: req.t('DRAFT_PUBLISHED'),
    data: {
      customTheme: storefront.customTheme,
      homepageTheme: storefront.homepageTheme,
      useCustomTheme: storefront.useCustomTheme,
      savedThemePresets: storefront.savedThemePresets,
      publishedAt: storefront.updatedAt
    }
  })
})

export const discardDraft = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  await Storefront.updateOne(
    { partner: partnerId },
    { $set: { 'draft.data': {}, 'draft.lastModified': null } },
    { timestamps: false }
  )
  res.json({ success: true, message: req.t('DRAFT_DISCARDED'), data: { discarded: true } })
})

// ==================== AI MIGRATION ====================

export const aiMigrateStorefront = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { jsonData, downloadImages = true } = req.body
  if (!jsonData) throw new BadRequestError('JSON_DATA_REQUIRED')

  logger.info(`Starting AI migration for partner ${partnerId}`)
  const result = await migrateStorefrontData(jsonData, { downloadImages })
  if (!result.success) throw new BadRequestError(result.error || 'MIGRATION_FAILED')

  res.json({
    success: true,
    message: req.t('MIGRATION_PREVIEW_READY'),
    data: result.data,
    images: result.images,
    summary: result.summary
  })
})

export const applyMigratedStorefront = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { migratedData } = req.body
  if (!migratedData) throw new BadRequestError('MIGRATED_DATA_REQUIRED')

  logger.info(`Applying migrated storefront for partner ${partnerId}`)
  let storefront =
    (await Storefront.findOne({ partner: partnerId })) ||
    (await Storefront.getOrCreateForPartner(partnerId))

  const themeType = migratedData.homepageTheme?.type || 'home1'
  const target = ['home1', 'home2', 'hotel'].includes(themeType) ? themeType : 'home1'
  const updates = {}

  // Build homepageTheme
  const existingTheme = storefront.homepageTheme?.toObject?.() || storefront.homepageTheme || {}
  updates.homepageTheme = {
    ...existingTheme,
    type: themeType,
    [target]: existingTheme[target] || {}
  }
  ;['hero', 'locationSection', 'campaignSection', 'hotels', 'tours'].forEach(f => {
    if (migratedData[f]) updates.homepageTheme[target][f] = migratedData[f]
  })

  if (migratedData.homepageTheme) {
    Object.entries(migratedData.homepageTheme).forEach(([k, v]) => {
      if (k !== 'type') updates.homepageTheme[k] = { ...(updates.homepageTheme[k] || {}), ...v }
    })
  }

  if (migratedData.settings || migratedData.themeColor) {
    updates.settings = {
      ...(storefront.settings?.toObject?.() || storefront.settings || {}),
      ...migratedData.settings
    }
    if (migratedData.themeColor) updates.settings.themeColor = migratedData.themeColor
  }
  if (migratedData.header) updates.header = migratedData.header
  if (migratedData.footer) updates.footer = migratedData.footer
  if (migratedData.customTheme) {
    updates.customTheme = migratedData.customTheme
    updates.useCustomTheme = true
  }
  if (migratedData.photos?.length) updates.photos = migratedData.photos

  const updated = await Storefront.findOneAndUpdate(
    { partner: partnerId },
    { $set: updates },
    { new: true }
  )

  // Handle pages separately
  if (migratedData.pages?.length) {
    await Storefront.updateOne({ partner: partnerId }, { $set: { pages: migratedData.pages } })
    logger.info(`Applied ${migratedData.pages.length} pages`)
  }

  res.json({
    success: true,
    message: req.t('MIGRATION_APPLIED'),
    data: updated,
    pagesImported: migratedData.pages?.length || 0,
    themeType,
    targetTheme: target
  })
})

export const downloadAndUploadImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { imageUrl, uploadType, uploadIndex = '0' } = req.body
  if (!imageUrl || !uploadType) throw new BadRequestError('IMAGE_URL_AND_TYPE_REQUIRED')

  const normalized = normalizeStorefrontUploadType(uploadType)
  logger.info(`Downloading image: ${imageUrl} for ${normalized}`)

  const imageData = await downloadImageForUpload(imageUrl)
  if (!imageData) throw new BadRequestError('IMAGE_DOWNLOAD_FAILED')

  // MD5 dedupe: if we already have this exact image bytes for this partner,
  // reuse the existing file instead of writing another copy.
  const md5 = md5BufferHex(imageData.buffer)
  const existingRelativePath = await getExistingStorefrontFileByMd5(partnerId, md5)
  if (existingRelativePath) {
    const existingFilename = path.basename(existingRelativePath)
    const url = getStorefrontUploadsUrlFromRelativePath(partnerId, existingRelativePath)

    let existingSize = imageData.size
    try {
      const abs = path.join(getStorefrontDiskPath(partnerId, ''), existingRelativePath)
      const stat = await fs.promises.stat(abs)
      existingSize = stat.size
    } catch {
      /* ignore */
    }

    return res.json({
      success: true,
      message: req.t('IMAGE_UPLOADED'),
      data: {
        id: existingFilename.replace(/\.[^/.]+$/, ''),
        url,
        link: url,
        filename: existingFilename,
        size: existingSize,
        uploadType: normalized,
        uploadIndex,
        originalUrl: imageUrl,
        reused: true
      }
    })
  }

  const filename = `${normalized}-${Date.now()}-${Math.round(Math.random() * 1e9)}${imageData.extension}`
  const subPath = getStorefrontUploadSubPath({ uploadType: normalized, uploadIndex })
  const uploadsDir = getStorefrontDiskPath(partnerId, subPath)
  await fs.promises.writeFile(path.join(uploadsDir, filename), imageData.buffer)

  const relativePath = `${subPath}/${filename}`
  await setStorefrontFileMd5(partnerId, md5, relativePath)

  const fileUrl = getStorefrontFileUrl(partnerId, normalized, filename, uploadIndex)
  res.json({
    success: true,
    message: req.t('IMAGE_UPLOADED'),
    data: {
      id: filename.replace(/\.[^/.]+$/, ''),
      url: fileUrl,
      link: fileUrl,
      filename,
      size: imageData.size,
      uploadType: normalized,
      uploadIndex,
      originalUrl: imageUrl
    }
  })
})

// ==================== IMAGE UPLOAD ====================

export const uploadImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  if (!req.file) throw new BadRequestError('FILE_REQUIRED')

  const { uploadType = 'general', uploadIndex = '0', sectionType, sectionIndex } = req.body
  const normalized = normalizeStorefrontUploadType(uploadType)

  // Optimize: resize + WebP conversion (before MD5 so dedupe uses optimized hash)
  const optimized = await optimizeUpload(req.file.path, 'storefront')
  req.file.filename = optimized.filename
  req.file.path = optimized.path

  const { filename, size } = req.file

  const subPath = getStorefrontUploadSubPath({
    uploadType: normalized,
    uploadIndex,
    sectionType,
    sectionIndex
  })
  const currentRelativePath = `${subPath}/${filename}`

  // MD5 dedupe (post-upload): if an identical file already exists, delete the new one and reuse.
  let md5 = null
  try {
    md5 = await md5FileHex(req.file.path)
  } catch {
    /* ignore */
  }

  if (md5) {
    const existingRelativePath = await getExistingStorefrontFileByMd5(partnerId, md5)
    if (existingRelativePath && existingRelativePath !== currentRelativePath) {
      try {
        await fs.promises.unlink(req.file.path)
      } catch {
        /* ignore */
      }

      const existingFilename = path.basename(existingRelativePath)
      const url = getStorefrontUploadsUrlFromRelativePath(partnerId, existingRelativePath)

      let existingSize = size
      try {
        const abs = path.join(getStorefrontDiskPath(partnerId, ''), existingRelativePath)
        const stat = await fs.promises.stat(abs)
        existingSize = stat.size
      } catch {
        /* ignore */
      }

      return res.json({
        success: true,
        message: req.t('FILE_UPLOADED'),
        data: {
          id: existingFilename.replace(/\.[^/.]+$/, ''),
          url,
          link: url,
          filename: existingFilename,
          size: existingSize,
          uploadType: normalized,
          uploadIndex,
          reused: true
        }
      })
    }

    await setStorefrontFileMd5(partnerId, md5, currentRelativePath)
  }

  const fileUrl = getStorefrontFileUrl(partnerId, normalized, filename, uploadIndex, {
    sectionType,
    sectionIndex
  })

  res.json({
    success: true,
    message: req.t('FILE_UPLOADED'),
    data: {
      id: filename.replace(/\.[^/.]+$/, ''),
      url: fileUrl,
      link: fileUrl,
      filename,
      size,
      uploadType: normalized,
      uploadIndex
    }
  })
})

export const deleteImage = asyncHandler(async (req, res) => {
  const partnerId = getPartnerIdOrThrow(req)
  const { relativePath } = req.body
  if (!relativePath) throw new BadRequestError('RELATIVE_PATH_REQUIRED')

  const deleted = deleteStorefrontFile(partnerId, relativePath)
  res.json({ success: deleted, message: deleted ? req.t('FILE_DELETED') : req.t('FILE_NOT_FOUND') })
})

export const updateCustomTheme = asyncHandler(async (req, res) => {
  req.body = { customTheme: req.body.customTheme, useCustomTheme: req.body.useCustomTheme }
  return updateStorefront(req, res)
})

// Alias for backwards compatibility
export const getCoreStorefront = getStorefront
