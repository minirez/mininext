/**
 * @module tag/tag.service.test
 * @description Unit tests for TagService CRUD operations.
 * Tests the TagService class which extends BaseEntityService.
 * Uses mocked Mongoose model and response helpers to isolate business logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mockRequest,
  mockResponse,
  mockNext,
  createTestTag,
  generateObjectId
} from '../../tests/helpers/testUtils.js'

// ── Mock dependencies before importing service ──────────────────────────────

// Mock the Tag model
const mockTagModel = vi.fn((data) => ({
  ...data,
  _id: data?._id || generateObjectId(),
  save: vi.fn().mockResolvedValue(undefined)
}))
mockTagModel.find = vi.fn()
mockTagModel.findById = vi.fn()
mockTagModel.findOne = vi.fn()
mockTagModel.create = vi.fn()
mockTagModel.search = vi.fn()

vi.mock('./tag.model.js', () => ({
  default: mockTagModel,
  TAG_LANGUAGES: ['tr', 'en', 'de', 'fr', 'es', 'ru', 'el', 'it', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']
}))

// Mock geminiService (used via dynamic import in create)
vi.mock('#services/geminiService.js', () => ({
  batchTranslate: vi.fn().mockResolvedValue({
    tr: 'Sahil',
    en: 'Beach',
    de: 'Strand',
    fr: 'Plage',
    es: 'Playa',
    ru: '', el: '', it: '', ro: '', bg: '', pt: '', da: '', zh: '', ar: '', fa: '', he: '', sq: '', uk: '', pl: '', az: ''
  })
}))

// Mock queryBuilder (used by BaseEntityService)
vi.mock('#services/queryBuilder.js', () => ({
  paginatedQuery: vi.fn(),
  buildFilterFromQuery: vi.fn().mockReturnValue({}),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20 })
}))

// Mock responseHelper
vi.mock('#services/responseHelper.js', () => ({
  sendSuccess: vi.fn((res, data, statusCode = 200) => {
    res.status(statusCode).json({ success: true, data })
  }),
  sendCreated: vi.fn((res, data) => {
    res.status(201).json({ success: true, data })
  }),
  sendMessage: vi.fn((res, message, data = null) => {
    const response = { success: true, message }
    if (data !== null) response.data = data
    res.json(response)
  })
}))

// ── Import the service after all mocks ──────────────────────────────────────

const { default: tagService } = await import('./tag.service.js')

// ── Test Suites ─────────────────────────────────────────────────────────────

describe('TagService', () => {
  let req, res, next

  beforeEach(() => {
    req = mockRequest()
    res = mockResponse()
    next = mockNext()
    vi.clearAllMocks()
  })

  // ── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('should return all active tags sorted by name.tr', async () => {
      const tags = [
        createTestTag({ name: { tr: 'Aile', en: 'Family' } }),
        createTestTag({ name: { tr: 'Sahil', en: 'Beach' } })
      ]

      const sortMock = vi.fn().mockResolvedValue(tags)
      mockTagModel.find.mockReturnValue({ sort: sortMock })

      req.query = {}

      await tagService.list(req, res)

      expect(mockTagModel.find).toHaveBeenCalledWith({ isActive: true })
      expect(sortMock).toHaveBeenCalledWith({ 'name.tr': 1 })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: tags
      })
    })

    it('should return all tags (including inactive) when active=false', async () => {
      const tags = [createTestTag({ isActive: false })]
      const sortMock = vi.fn().mockResolvedValue(tags)
      mockTagModel.find.mockReturnValue({ sort: sortMock })

      req.query = { active: 'false' }

      await tagService.list(req, res)

      expect(mockTagModel.find).toHaveBeenCalledWith({})
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: tags
      })
    })

    it('should apply search filter on tr and en fields', async () => {
      const tags = [createTestTag({ name: { tr: 'Sahil', en: 'Beach' } })]
      const sortMock = vi.fn().mockResolvedValue(tags)
      mockTagModel.find.mockReturnValue({ sort: sortMock })

      req.query = { search: 'sahil', active: 'true' }

      await tagService.list(req, res)

      expect(mockTagModel.find).toHaveBeenCalledWith({
        isActive: true,
        $or: [
          { 'name.tr': { $regex: 'sahil', $options: 'i' } },
          { 'name.en': { $regex: 'sahil', $options: 'i' } }
        ]
      })
    })
  })

  // ── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('should return a tag by ID via findByIdWithTenant', async () => {
      const tag = createTestTag()
      const execMock = vi.fn().mockResolvedValue(tag)
      mockTagModel.findOne.mockReturnValue({ exec: execMock })

      req.params = { id: tag._id }

      await tagService.getById(req, res)

      // BaseEntityService.findByIdWithTenant uses findOne({ _id, ...tenantFilter })
      expect(mockTagModel.findOne).toHaveBeenCalledWith({ _id: tag._id })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: tag
      })
    })

    it('should throw NotFoundError when tag does not exist', async () => {
      const execMock = vi.fn().mockResolvedValue(null)
      mockTagModel.findOne.mockReturnValue({ exec: execMock })

      req.params = { id: generateObjectId() }

      await expect(tagService.getById(req, res)).rejects.toThrow('TAG_NOT_FOUND')
    })
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a tag with auto-translation', async () => {
      mockTagModel.findOne.mockResolvedValue(null)

      const createdTag = createTestTag({ name: { tr: 'Sahil', en: 'Beach' } })
      mockTagModel.create.mockResolvedValue(createdTag)

      req.body = {
        name: { tr: 'Sahil' },
        color: '#ef4444',
        sourceLang: 'tr'
      }

      await tagService.create(req, res)

      expect(mockTagModel.findOne).toHaveBeenCalled()
      expect(mockTagModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(Object),
          color: '#ef4444',
          isActive: true
        })
      )
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('should throw BadRequestError when name is missing', async () => {
      req.body = {}

      await expect(tagService.create(req, res)).rejects.toThrow('TAG_NAME_REQUIRED')
    })

    it('should throw BadRequestError when source language name is missing', async () => {
      req.body = { name: { en: 'Beach' }, sourceLang: 'tr' }

      await expect(tagService.create(req, res)).rejects.toThrow('TAG_NAME_REQUIRED')
    })

    it('should throw BadRequestError when tag already exists', async () => {
      const existing = createTestTag({ name: { tr: 'Sahil', en: 'Beach' } })
      mockTagModel.findOne.mockResolvedValue(existing)

      req.body = {
        name: { tr: 'Sahil' },
        sourceLang: 'tr'
      }

      await expect(tagService.create(req, res)).rejects.toThrow('TAG_ALREADY_EXISTS')
    })

    it('should use default color when not provided', async () => {
      mockTagModel.findOne.mockResolvedValue(null)

      const createdTag = createTestTag()
      mockTagModel.create.mockResolvedValue(createdTag)

      req.body = {
        name: { tr: 'Sahil' },
        sourceLang: 'tr'
      }

      await tagService.create(req, res)

      expect(mockTagModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '#6366f1'
        })
      )
    })

    it('should continue with source language if translation fails', async () => {
      mockTagModel.findOne.mockResolvedValue(null)

      // Override batchTranslate to throw
      const { batchTranslate } = await import('#services/geminiService.js')
      batchTranslate.mockRejectedValueOnce(new Error('Translation API error'))

      const createdTag = createTestTag()
      mockTagModel.create.mockResolvedValue(createdTag)

      req.body = {
        name: { tr: 'Sahil' },
        sourceLang: 'tr'
      }

      await tagService.create(req, res)

      // Should still create with source language only
      expect(mockTagModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: { tr: 'Sahil' }
        })
      )
      expect(res.status).toHaveBeenCalledWith(201)
    })
  })

  // ── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update tag name by merging', async () => {
      const tag = createTestTag()
      tag.save = vi.fn().mockResolvedValue(tag)
      tag.name = { ...tag.name }

      const execMock = vi.fn().mockResolvedValue(tag)
      mockTagModel.findOne.mockReturnValue({ exec: execMock })

      req.params = { id: tag._id }
      req.body = {
        name: { tr: 'Guncellenmiş', en: 'Updated' }
      }

      await tagService.update(req, res)

      expect(tag.save).toHaveBeenCalled()
      // Name should be merged
      expect(tag.name.tr).toBe('Guncellenmiş')
      expect(tag.name.en).toBe('Updated')
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should update tag color', async () => {
      const tag = createTestTag()
      tag.save = vi.fn().mockResolvedValue(tag)

      const execMock = vi.fn().mockResolvedValue(tag)
      mockTagModel.findOne.mockReturnValue({ exec: execMock })

      req.params = { id: tag._id }
      req.body = { color: '#ef4444' }

      await tagService.update(req, res)

      expect(tag.color).toBe('#ef4444')
      expect(tag.save).toHaveBeenCalled()
    })

    it('should update tag isActive status', async () => {
      const tag = createTestTag({ isActive: true })
      tag.save = vi.fn().mockResolvedValue(tag)

      const execMock = vi.fn().mockResolvedValue(tag)
      mockTagModel.findOne.mockReturnValue({ exec: execMock })

      req.params = { id: tag._id }
      req.body = { isActive: false }

      await tagService.update(req, res)

      expect(tag.isActive).toBe(false)
      expect(tag.save).toHaveBeenCalled()
    })

    it('should throw when updating non-existent tag', async () => {
      const execMock = vi.fn().mockResolvedValue(null)
      mockTagModel.findOne.mockReturnValue({ exec: execMock })

      req.params = { id: generateObjectId() }
      req.body = { color: '#000000' }

      await expect(tagService.update(req, res)).rejects.toThrow('TAG_NOT_FOUND')
    })
  })

  // ── delete ───────────────────────────────────────────────────────────────

  describe('delete (inherited from BaseEntityService)', () => {
    it('should delete an existing tag', async () => {
      const tag = createTestTag()
      tag.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 })

      const execMock = vi.fn().mockResolvedValue(tag)
      mockTagModel.findOne.mockReturnValue({ exec: execMock })

      req.params = { id: tag._id }
      // BaseEntityService.delete uses req.t for the message
      req.t = vi.fn((key) => key)

      await tagService.delete(req, res)

      expect(tag.deleteOne).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'TAG_DELETED'
        })
      )
    })

    it('should throw NotFoundError when deleting non-existent tag', async () => {
      const execMock = vi.fn().mockResolvedValue(null)
      mockTagModel.findOne.mockReturnValue({ exec: execMock })

      req.params = { id: generateObjectId() }
      req.t = vi.fn((key) => key)

      await expect(tagService.delete(req, res)).rejects.toThrow('TAG_NOT_FOUND')
    })
  })

  // ── searchTags ──────────────────────────────────────────────────────────

  describe('searchTags', () => {
    it('should return empty array when query is too short', async () => {
      req.query = { q: 'a' }

      await tagService.searchTags(req, res)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      })
    })

    it('should return empty array when query is missing', async () => {
      req.query = {}

      await tagService.searchTags(req, res)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      })
    })

    it('should search tags by language and return results', async () => {
      const tags = [createTestTag({ name: { tr: 'Sahil', en: 'Beach' } })]
      const limitMock = vi.fn().mockResolvedValue(tags)
      mockTagModel.search.mockReturnValue({ limit: limitMock })

      req.query = { q: 'sahil', lang: 'tr', limit: '5' }

      await tagService.searchTags(req, res)

      expect(mockTagModel.search).toHaveBeenCalledWith('sahil', 'tr')
      expect(limitMock).toHaveBeenCalledWith(5)
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should use default language (tr) and limit (10) when not specified', async () => {
      const tags = []
      const limitMock = vi.fn().mockResolvedValue(tags)
      mockTagModel.search.mockReturnValue({ limit: limitMock })

      req.query = { q: 'test' }

      await tagService.searchTags(req, res)

      expect(mockTagModel.search).toHaveBeenCalledWith('test', 'tr')
      expect(limitMock).toHaveBeenCalledWith(10)
    })
  })

  // ── buildFilter ──────────────────────────────────────────────────────────

  describe('buildFilter', () => {
    it('should return isActive:true filter by default', () => {
      req.query = {}
      const filter = tagService.buildFilter(req)

      expect(filter).toEqual({ isActive: true })
    })

    it('should return empty filter when active=false', () => {
      req.query = { active: 'false' }
      const filter = tagService.buildFilter(req)

      expect(filter).toEqual({})
    })

    it('should include search $or when search param is provided', () => {
      req.query = { search: 'test', active: 'true' }
      const filter = tagService.buildFilter(req)

      expect(filter).toEqual({
        isActive: true,
        $or: [
          { 'name.tr': { $regex: 'test', $options: 'i' } },
          { 'name.en': { $regex: 'test', $options: 'i' } }
        ]
      })
    })
  })

  // ── getTenantFilter ──────────────────────────────────────────────────────

  describe('getTenantFilter', () => {
    it('should return empty object (tags are global, not tenant-scoped)', () => {
      req.partnerId = generateObjectId()
      const filter = tagService.getTenantFilter(req)

      expect(filter).toEqual({})
    })
  })
})
