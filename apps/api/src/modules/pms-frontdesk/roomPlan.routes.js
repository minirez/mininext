/**
 * Room Plan Routes
 * Timeline view for room occupancy management
 */

import express from 'express'
import {
  getRoomsWithOccupancy,
  changeStayDates,
  moveStayToRoom,
  checkRoomAvailability
} from './roomPlan.service.js'

const router = express.Router({ mergeParams: true })

/**
 * @route   GET /api/hotels/:hotelId/room-plan
 * @desc    Get rooms with occupancy for timeline view
 * @query   start, end - Date range (ISO format)
 * @access  Private
 */
router.get('/', getRoomsWithOccupancy)

/**
 * @route   PUT /api/hotels/:hotelId/room-plan/stays/:stayId/dates
 * @desc    Change stay dates (drag horizontally on timeline)
 * @body    { newCheckIn, newCheckOut, reason }
 * @access  Private
 */
router.put('/stays/:stayId/dates', changeStayDates)

/**
 * @route   PUT /api/hotels/:hotelId/room-plan/stays/:stayId/room
 * @desc    Move stay to different room (drag vertically on timeline)
 * @body    { newRoomId, newCheckIn?, newCheckOut?, reason }
 * @access  Private
 */
router.put('/stays/:stayId/room', moveStayToRoom)

/**
 * @route   GET /api/hotels/:hotelId/room-plan/rooms/:roomId/availability
 * @desc    Check room availability for date range
 * @query   checkIn, checkOut, excludeStayId?
 * @access  Private
 */
router.get('/rooms/:roomId/availability', checkRoomAvailability)

export default router
