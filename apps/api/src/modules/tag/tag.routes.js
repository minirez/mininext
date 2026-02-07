import express from 'express'
import tagService from './tag.service.js'
import { asyncHandler } from '#helpers'
import { protect, requireAdmin } from '#middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Search tags (for autocomplete - any authenticated user)
router.get('/search', asyncHandler(tagService.searchTags))

// Tag CRUD (admin only)
router.get('/', asyncHandler(tagService.list))
router.get('/:id', asyncHandler(tagService.getById))
router.post('/', requireAdmin, asyncHandler(tagService.create))
router.put('/:id', requireAdmin, asyncHandler(tagService.update))
router.delete('/:id', requireAdmin, asyncHandler(tagService.delete))

export default router
