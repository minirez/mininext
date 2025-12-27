import express from 'express'
import * as tagService from './tag.service.js'
import { protect, requireAdmin } from '../../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Search tags (for autocomplete - any authenticated user)
router.get('/search', tagService.searchTags)

// Tag CRUD (admin only)
router.get('/', tagService.getTags)
router.get('/:id', tagService.getTag)
router.post('/', requireAdmin, tagService.createTag)
router.put('/:id', requireAdmin, tagService.updateTag)
router.delete('/:id', requireAdmin, tagService.deleteTag)

export default router
