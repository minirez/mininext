import express from 'express'
import * as issueService from './issue.service.js'
import { protect, requirePlatformUser } from '#middleware/auth.js'
import { issueUpload } from '#helpers/issueUpload.js'

const router = express.Router()

// All routes require platform user
router.use(protect)
router.use(requirePlatformUser)

// Main routes
router.get('/', issueService.getIssues)
router.get('/stats', issueService.getStats)
router.get('/users', issueService.getPlatformUsers)
router.post('/', issueService.createIssue)
router.get('/:id', issueService.getIssue)
router.put('/:id', issueService.updateIssue)
router.delete('/:id', issueService.deleteIssue)
router.patch('/:id/restore', issueService.restoreIssue)

// Status & Assignment
router.patch('/:id/status', issueService.changeStatus)
router.patch('/:id/assign', issueService.assignIssue)
router.patch('/:id/watch', issueService.toggleWatcher)
router.patch('/:id/pin', issueService.togglePin)
router.post('/:id/nudge', issueService.nudgeIssue)

// Comments
router.post('/:id/comments', issueService.addComment)
router.put('/:id/comments/:commentId', issueService.updateComment)
router.delete('/:id/comments/:commentId', issueService.deleteComment)

// Attachments
router.post('/:id/attachments', issueUpload.single('file'), issueService.uploadAttachment)
router.delete('/:id/attachments/:attachmentId', issueService.deleteAttachment)

export default router
