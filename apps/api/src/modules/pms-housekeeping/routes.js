import express from 'express'
import * as roomService from './room.service.js'
import * as roomTypesService from '#modules/planning/roomTypes.service.js'
import * as mealPlansService from '#modules/planning/mealPlans.service.js'
import { protect, requirePmsAccess, setPmsHotelContext } from '#middleware/auth.js'

const router = express.Router()

const hotelMiddleware = [protect, requirePmsAccess, setPmsHotelContext]

// ===========================================
// ROOM TYPE ROUTES (delegated to planning module)
// ===========================================

router.get('/hotels/:hotelId/room-types', hotelMiddleware, roomTypesService.getRoomTypes)
router.get('/hotels/:hotelId/room-types/:id', hotelMiddleware, roomTypesService.getRoomType)
router.post('/hotels/:hotelId/room-types', hotelMiddleware, roomTypesService.createRoomType)
router.patch('/hotels/:hotelId/room-types/:id', hotelMiddleware, roomTypesService.updateRoomType)
router.delete('/hotels/:hotelId/room-types/:id', hotelMiddleware, roomTypesService.deleteRoomType)

// ===========================================
// MEAL PLAN ROUTES (delegated to planning module)
// ===========================================

router.get('/hotels/:hotelId/meal-plans', hotelMiddleware, mealPlansService.getMealPlans)
router.post('/hotels/:hotelId/meal-plans', hotelMiddleware, mealPlansService.createMealPlan)
router.patch('/hotels/:hotelId/meal-plans/:id', hotelMiddleware, mealPlansService.updateMealPlan)
router.delete('/hotels/:hotelId/meal-plans/:id', hotelMiddleware, mealPlansService.deleteMealPlan)

// ===========================================
// ROOM MANAGEMENT ROUTES
// ===========================================

// Get all rooms for a hotel
router.get('/hotels/:hotelId/rooms', hotelMiddleware, roomService.getRooms)

// Get room statistics
router.get('/hotels/:hotelId/rooms/statistics', hotelMiddleware, roomService.getRoomStatistics)

// Get rooms needing cleaning
router.get(
  '/hotels/:hotelId/rooms/needs-cleaning',
  hotelMiddleware,
  roomService.getRoomsNeedingCleaning
)

// Get rooms by floor
router.get('/hotels/:hotelId/rooms/floor/:floor', hotelMiddleware, roomService.getRoomsByFloor)

// Get single room
router.get('/hotels/:hotelId/rooms/:roomId', hotelMiddleware, roomService.getRoom)

// Create room
router.post('/hotels/:hotelId/rooms', hotelMiddleware, roomService.createRoom)

// Create rooms in bulk
router.post('/hotels/:hotelId/rooms/bulk', hotelMiddleware, roomService.createRoomsBulk)

// Update room
router.put('/hotels/:hotelId/rooms/:roomId', hotelMiddleware, roomService.updateRoom)

// Delete room
router.delete('/hotels/:hotelId/rooms/:roomId', hotelMiddleware, roomService.deleteRoom)

// Update room status
router.patch('/hotels/:hotelId/rooms/:roomId/status', hotelMiddleware, roomService.updateRoomStatus)

// Update housekeeping status
router.patch(
  '/hotels/:hotelId/rooms/:roomId/housekeeping',
  hotelMiddleware,
  roomService.updateHousekeepingStatus
)

// Bulk update housekeeping
router.patch(
  '/hotels/:hotelId/rooms/bulk/housekeeping',
  hotelMiddleware,
  roomService.bulkUpdateHousekeeping
)

// ===========================================
// HOUSEKEEPING ROUTES
// ===========================================

// Get housekeeping dashboard
router.get('/hotels/:hotelId/housekeeping', hotelMiddleware, roomService.getHousekeeping)

export default router
