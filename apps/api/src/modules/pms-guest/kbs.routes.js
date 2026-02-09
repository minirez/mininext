/**
 * KBS (Kimlik Bildirim Sistemi) Routes
 * Turkish police/gendarmerie guest notification system endpoints
 */

import express from 'express'
import {
  getKBSPending,
  generateKBSXML,
  markAsSent,
  getKBSReport,
  updateGuestKBSFields,
  testKBSConnection,
  sendToKBS,
  sendStayToKBS
} from './kbs.service.js'

const router = express.Router({ mergeParams: true })

// Note: Authentication is handled by parent router (routes.js)
// via protect + requirePmsAccess + setPmsHotelContext middleware

/**
 * @route   POST /api/pms/guests/hotels/:hotelId/kbs/test-connection
 * @desc    Test KBS web service connection
 * @access  Private
 */
router.post('/test-connection', testKBSConnection)

/**
 * @route   POST /api/pms/guests/hotels/:hotelId/kbs/send
 * @desc    Send guest notification to KBS
 * @body    { stayId, guestId, action: 'checkin' | 'checkout' | 'roomchange' }
 * @access  Private
 */
router.post('/send', sendToKBS)

/**
 * @route   POST /api/pms/guests/hotels/:hotelId/kbs/send-stay
 * @desc    Send all guests in a stay to KBS
 * @body    { stayId, action: 'checkin' | 'checkout' }
 * @access  Private
 */
router.post('/send-stay', sendStayToKBS)

/**
 * @route   GET /api/pms/guests/hotels/:hotelId/kbs/pending
 * @desc    Get pending KBS notifications
 * @query   startDate, endDate - Optional date range filters
 * @access  Private
 */
router.get('/pending', getKBSPending)

/**
 * @route   POST /api/pms/guests/hotels/:hotelId/kbs/generate-xml
 * @desc    Generate KBS XML file for download
 * @body    { guestIds: string[] } - Array of guest IDs to include
 * @access  Private
 */
router.post('/generate-xml', generateKBSXML)

/**
 * @route   POST /api/pms/guests/hotels/:hotelId/kbs/mark-sent
 * @desc    Mark guests as sent to KBS
 * @body    { guestIds: string[], kbsReference?: string }
 * @access  Private
 */
router.post('/mark-sent', markAsSent)

/**
 * @route   GET /api/pms/guests/hotels/:hotelId/kbs/report
 * @desc    Get KBS report for date range
 * @query   startDate, endDate - Date range (default: last 30 days)
 * @access  Private
 */
router.get('/report', getKBSReport)

/**
 * @route   PUT /api/pms/guests/hotels/:hotelId/kbs/stays/:stayId/guests/:guestId
 * @desc    Update guest KBS fields
 * @body    { fatherName, motherName, birthPlace, dateOfBirth, nationality, idNumber, idType }
 * @access  Private
 */
router.put('/stays/:stayId/guests/:guestId', updateGuestKBSFields)

export default router
