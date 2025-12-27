import Tag, { TAG_LANGUAGES } from './tag.model.js'
import { NotFoundError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { batchTranslate } from '../../services/geminiService.js'
import logger from '../../core/logger.js'

/**
 * Get all tags
 */
export const getTags = asyncHandler(async (req, res) => {
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

	const tags = await Tag.find(filter).sort({ 'name.tr': 1 })

	res.json({
		success: true,
		data: tags
	})
})

/**
 * Get single tag by ID
 */
export const getTag = asyncHandler(async (req, res) => {
	const tag = await Tag.findById(req.params.id)

	if (!tag) {
		throw new NotFoundError('TAG_NOT_FOUND')
	}

	res.json({
		success: true,
		data: tag
	})
})

/**
 * Create a new tag with auto-translation
 */
export const createTag = asyncHandler(async (req, res) => {
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

		// Use batchTranslate for all 20 languages
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

	const tag = new Tag({
		name: translatedName,
		color: color || '#6366f1',
		isActive: true
	})

	await tag.save()

	res.status(201).json({
		success: true,
		data: tag,
		message: 'TAG_CREATED'
	})
})

/**
 * Update tag
 */
export const updateTag = asyncHandler(async (req, res) => {
	const { name, color, isActive } = req.body

	const tag = await Tag.findById(req.params.id)

	if (!tag) {
		throw new NotFoundError('TAG_NOT_FOUND')
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

	res.json({
		success: true,
		data: tag,
		message: 'TAG_UPDATED'
	})
})

/**
 * Delete tag
 */
export const deleteTag = asyncHandler(async (req, res) => {
	const tag = await Tag.findById(req.params.id)

	if (!tag) {
		throw new NotFoundError('TAG_NOT_FOUND')
	}

	await tag.deleteOne()

	res.json({
		success: true,
		message: 'TAG_DELETED'
	})
})

/**
 * Search tags (for autocomplete)
 */
export const searchTags = asyncHandler(async (req, res) => {
	const { q, lang = 'tr', limit = 10 } = req.query

	if (!q || q.length < 2) {
		return res.json({
			success: true,
			data: []
		})
	}

	const tags = await Tag.search(q, lang).limit(parseInt(limit))

	res.json({
		success: true,
		data: tags
	})
})
