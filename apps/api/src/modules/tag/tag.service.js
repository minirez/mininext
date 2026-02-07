import Tag, { TAG_LANGUAGES } from './tag.model.js'
import { BadRequestError } from '#core/errors.js'
import { BaseEntityService } from '#services/base/BaseEntityService.js'
import { sendSuccess, sendCreated } from '#services/responseHelper.js'
import logger from '#core/logger.js'

class TagService extends BaseEntityService {
  constructor() {
    super(Tag, {
      entityName: 'tag',
      allowedFields: ['name', 'color', 'isActive'],
      searchFields: ['name.tr', 'name.en'],
      defaultSort: { 'name.tr': 1 }
    })

    // Bind custom methods
    this.searchTags = this.searchTags.bind(this)
  }

  /**
   * Tags are global (not tenant-scoped)
   */
  getTenantFilter(_req) {
    return {}
  }

  /**
   * Custom filter: active filter + multilingual search
   */
  buildFilter(req) {
    const { search, active = 'true' } = req.query
    const filter = {}

    if (active === 'true') {
      filter.isActive = true
    }

    if (search) {
      filter.$or = [
        { 'name.tr': { $regex: search, $options: 'i' } },
        { 'name.en': { $regex: search, $options: 'i' } }
      ]
    }

    return filter
  }

  /**
   * Override list to return all tags without pagination (backward compat)
   */
  async list(req, res) {
    const filter = this.buildFilter(req)

    const tags = await Tag.find(filter).sort(this.config.defaultSort)

    res.json({
      success: true,
      data: tags
    })
  }

  /**
   * Override create: duplicate check + auto-translation via batchTranslate
   */
  async create(req, res) {
    const { name, color, sourceLang = 'tr' } = req.body

    if (!name || !name[sourceLang]) {
      throw new BadRequestError('TAG_NAME_REQUIRED')
    }

    // Check for duplicate
    const existingTag = await Tag.findOne({
      [`name.${sourceLang}`]: { $regex: `^${name[sourceLang]}$`, $options: 'i' }
    })

    if (existingTag) {
      throw new BadRequestError('TAG_ALREADY_EXISTS')
    }

    // Auto-translate to all languages
    let translatedName = { ...name }

    try {
      logger.info(`Translating tag "${name[sourceLang]}" to ${TAG_LANGUAGES.length} languages...`)

      const { batchTranslate } = await import('#services/geminiService.js')
      translatedName = await batchTranslate(
        { [sourceLang]: name[sourceLang] },
        sourceLang,
        TAG_LANGUAGES
      )

      logger.info('Tag translation completed successfully')
    } catch (error) {
      logger.error('Tag translation failed:', error.message)
      // Continue with source language only if translation fails
      translatedName = { [sourceLang]: name[sourceLang] }
    }

    const tag = await Tag.create({
      name: translatedName,
      color: color || '#6366f1',
      isActive: true
    })

    sendCreated(res, tag)
  }

  /**
   * Override update: merge name object instead of replacing
   */
  async update(req, res) {
    const { name, color, isActive } = req.body

    const tag = await this.findByIdWithTenant(req.params.id, req)

    if (!tag) {
      throw new BadRequestError('TAG_NOT_FOUND')
    }

    if (name) {
      tag.name = { ...tag.name, ...name }
    }

    if (color !== undefined) {
      tag.color = color
    }

    if (isActive !== undefined) {
      tag.isActive = isActive
    }

    await tag.save()

    sendSuccess(res, tag)
  }

  /**
   * Search tags for autocomplete
   */
  async searchTags(req, res) {
    const { q, lang = 'tr', limit = 10 } = req.query

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      })
    }

    const tags = await Tag.search(q, lang).limit(parseInt(limit))

    sendSuccess(res, tags)
  }
}

const tagService = new TagService()

export default tagService
