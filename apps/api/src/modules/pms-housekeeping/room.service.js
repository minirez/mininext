import Room, { ROOM_STATUS, HOUSEKEEPING_STATUS, HOUSEKEEPING_PRIORITY } from './room.model.js'
import RoomType from '#modules/planning/roomType.model.js'
import Stay from '#modules/pms-frontdesk/stay.model.js'
import { asyncHandler } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import logger from '#core/logger.js'

import { emitToRoom } from '#core/socket.js'

const emitRoomStatusChange = (hotelId, roomId, data) => {
  emitToRoom(`hotel:${hotelId}`, 'room:status', { hotelId, timestamp: Date.now(), roomId, ...data })
}
const emitHousekeepingUpdate = (hotelId, data) => {
  emitToRoom(`hotel:${hotelId}`, 'housekeeping', { hotelId, timestamp: Date.now(), ...data })
}

/**
 * Notify hotel PMS users via in-app notification
 */
const notifyHotelUsers = async (
  hotelId,
  excludeUserId,
  { type, title, message, reference, actionUrl }
) => {
  try {
    const Hotel = (await import('#modules/hotel/hotel.model.js')).default
    const User = (await import('#modules/user/user.model.js')).default
    const { broadcastNotification } = await import('#modules/notification/notification.service.js')

    const hotel = await Hotel.findById(hotelId).select('partner')
    if (!hotel?.partner) return

    const users = await User.find({
      accountType: 'partner',
      accountId: hotel.partner,
      status: 'active',
      _id: { $ne: excludeUserId },
      $or: [
        { role: 'admin' },
        { pmsRole: { $ne: null } },
        { pmsPermissions: { $exists: true, $ne: [] } }
      ]
    }).select('_id')

    if (users.length === 0) return

    await broadcastNotification({
      recipientIds: users.map(u => u._id),
      recipientModel: 'User',
      type: `pms:${type}`,
      title,
      message,
      reference,
      hotel: hotelId,
      partner: hotel.partner,
      actionUrl: `/pms${actionUrl}`
    })
  } catch (err) {
    logger.error('[Housekeeping Notification] Error:', err.message)
  }
}

/**
 * Get all rooms for a hotel
 */
export const getRooms = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { floor, status, roomType, housekeepingStatus } = req.query

  const filter = {
    hotel: hotelId,
    isActive: true
  }

  if (floor !== undefined) filter.floor = parseInt(floor)
  if (status) filter.status = status
  if (roomType) filter.roomType = roomType
  if (housekeepingStatus) filter.housekeepingStatus = housekeepingStatus

  const rooms = await Room.find(filter)
    .populate('roomType', 'name code occupancy')
    .populate('assignedHousekeeper', 'firstName lastName')
    .populate('currentBooking', 'bookingNumber')
    .sort({ floor: 1, roomNumber: 1 })

  // Get active stays for occupied rooms to fill in missing guest data
  const occupiedRoomIds = rooms
    .filter(
      r => r.status === ROOM_STATUS.OCCUPIED && (!r.currentGuests || r.currentGuests.length === 0)
    )
    .map(r => r._id)

  if (occupiedRoomIds.length > 0) {
    const activeStays = await Stay.find({
      room: { $in: occupiedRoomIds },
      status: 'checked_in'
    })
      .select('room guests')
      .lean()

    const stayMap = new Map(activeStays.map(s => [s.room.toString(), s]))

    // Attach guest info to rooms missing currentGuests
    rooms.forEach(room => {
      if (
        room.status === ROOM_STATUS.OCCUPIED &&
        (!room.currentGuests || room.currentGuests.length === 0)
      ) {
        const stay = stayMap.get(room._id.toString())
        if (stay?.guests?.length > 0) {
          room.currentGuests = stay.guests.map(g => ({
            firstName: g.firstName,
            lastName: g.lastName,
            isMainGuest: g.isMainGuest || false
          }))
        }
      }
    })
  }

  res.json({
    success: true,
    data: rooms
  })
})

/**
 * Get single room
 */
export const getRoom = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params

  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId
  })
    .populate('roomType', 'name code occupancy amenities')
    .populate('assignedHousekeeper', 'firstName lastName email')
    .populate('currentBooking')
    .populate('lastCleanedBy', 'firstName lastName')
    .populate('lastInspectedBy', 'firstName lastName')

  if (!room) {
    throw new NotFoundError('Oda bulunamadi')
  }

  res.json({
    success: true,
    data: room
  })
})

/**
 * Create new room
 */
export const createRoom = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { roomNumber, floor, roomType, features, notes } = req.body

  // Validate room type belongs to this hotel
  const roomTypeDoc = await RoomType.findOne({
    _id: roomType,
    hotel: hotelId
  })

  if (!roomTypeDoc) {
    throw new BadRequestError('Gecersiz oda tipi')
  }

  // Check if room number already exists
  const existingRoom = await Room.findOne({
    hotel: hotelId,
    roomNumber
  })

  if (existingRoom) {
    throw new BadRequestError('Bu oda numarasi zaten mevcut')
  }

  const room = await Room.create({
    hotel: hotelId,
    roomNumber,
    floor,
    roomType,
    features,
    notes
  })

  const populatedRoom = await Room.findById(room._id).populate('roomType', 'name code')

  res.status(201).json({
    success: true,
    data: populatedRoom
  })
})

/**
 * Create multiple rooms (bulk)
 */
export const createRoomsBulk = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { rooms } = req.body

  if (!Array.isArray(rooms) || rooms.length === 0) {
    throw new BadRequestError('Odalar dizisi gerekli')
  }

  // Validate all room types
  const roomTypeIds = [...new Set(rooms.map(r => r.roomType))]
  const validRoomTypes = await RoomType.find({
    _id: { $in: roomTypeIds },
    hotel: hotelId
  })

  if (validRoomTypes.length !== roomTypeIds.length) {
    throw new BadRequestError('Gecersiz oda tipi/tipleri')
  }

  // Check for duplicate room numbers
  const roomNumbers = rooms.map(r => r.roomNumber)
  const existingRooms = await Room.find({
    hotel: hotelId,
    roomNumber: { $in: roomNumbers }
  })

  if (existingRooms.length > 0) {
    const existingNumbers = existingRooms.map(r => r.roomNumber)
    throw new BadRequestError(`Bu oda numaralari zaten mevcut: ${existingNumbers.join(', ')}`)
  }

  // Create rooms
  const roomDocs = rooms.map(r => ({
    hotel: hotelId,
    roomNumber: r.roomNumber,
    floor: r.floor,
    roomType: r.roomType,
    features: r.features || [],
    notes: r.notes || ''
  }))

  const createdRooms = await Room.insertMany(roomDocs)

  res.status(201).json({
    success: true,
    data: createdRooms,
    count: createdRooms.length
  })
})

/**
 * Update room
 */
export const updateRoom = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params
  const { roomNumber, floor, roomType, features, notes, isActive } = req.body

  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId
  })

  if (!room) {
    throw new NotFoundError('Oda bulunamadi')
  }

  // If changing room type, validate it
  if (roomType && roomType !== room.roomType.toString()) {
    const roomTypeDoc = await RoomType.findOne({
      _id: roomType,
      hotel: hotelId
    })
    if (!roomTypeDoc) {
      throw new BadRequestError('Gecersiz oda tipi')
    }
    room.roomType = roomType
  }

  // If changing room number, check uniqueness
  if (roomNumber && roomNumber !== room.roomNumber) {
    const existingRoom = await Room.findOne({
      hotel: hotelId,
      roomNumber,
      _id: { $ne: roomId }
    })
    if (existingRoom) {
      throw new BadRequestError('Bu oda numarasi zaten mevcut')
    }
    room.roomNumber = roomNumber
  }

  if (floor !== undefined) room.floor = floor
  if (features) room.features = features
  if (notes !== undefined) room.notes = notes
  if (isActive !== undefined) room.isActive = isActive

  await room.save()

  const updatedRoom = await Room.findById(roomId).populate('roomType', 'name code')

  res.json({
    success: true,
    data: updatedRoom
  })
})

/**
 * Delete room
 */
export const deleteRoom = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params

  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId
  })

  if (!room) {
    throw new NotFoundError('Oda bulunamadi')
  }

  // Don't allow deletion if occupied
  if (room.status === ROOM_STATUS.OCCUPIED) {
    throw new BadRequestError('Dolu oda silinemez')
  }

  await room.deleteOne()

  res.json({
    success: true,
    message: 'Oda silindi'
  })
})

/**
 * Update room status
 */
export const updateRoomStatus = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params
  const { status, notes } = req.body

  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId
  })

  if (!room) {
    throw new NotFoundError('Oda bulunamadi')
  }

  // Validate status transition
  const validStatuses = Object.values(ROOM_STATUS)
  if (!validStatuses.includes(status)) {
    throw new BadRequestError('Gecersiz oda durumu')
  }

  // Cannot manually set to occupied (should be done via check-in)
  if (status === ROOM_STATUS.OCCUPIED && room.status !== ROOM_STATUS.OCCUPIED) {
    throw new BadRequestError('Oda durumu check-in islemiyle degistirilmelidir')
  }

  const oldStatus = room.status
  room.status = status
  if (notes) {
    if (status === ROOM_STATUS.MAINTENANCE || status === ROOM_STATUS.OUT_OF_ORDER) {
      room.maintenanceNotes = notes
    } else {
      room.notes = notes
    }
  }

  // Update housekeeping status accordingly
  if (status === ROOM_STATUS.VACANT_CLEAN || status === ROOM_STATUS.INSPECTED) {
    room.housekeepingStatus = HOUSEKEEPING_STATUS.CLEAN
  } else if (status === ROOM_STATUS.VACANT_DIRTY || status === ROOM_STATUS.CHECKOUT) {
    room.housekeepingStatus = HOUSEKEEPING_STATUS.DIRTY
  }

  await room.save()

  const updatedRoom = await Room.findById(roomId).populate('roomType', 'name code')

  // Emit socket event for real-time updates
  const staffName = req.user.firstName
    ? `${req.user.firstName} ${req.user.lastName}`
    : req.user.email
  emitRoomStatusChange(hotelId, roomId, {
    roomNumber: room.roomNumber,
    newStatus: status,
    oldStatus: oldStatus,
    updatedBy: staffName
  })

  // Send notification when room becomes dirty (needs cleaning)
  if (status === ROOM_STATUS.VACANT_DIRTY || status === ROOM_STATUS.CHECKOUT) {
    notifyHotelUsers(hotelId, req.user._id, {
      type: 'room:dirty',
      title: 'Oda Kirli',
      message: `Oda ${room.roomNumber} temizlik bekliyor`,
      reference: { model: 'Room', id: roomId },
      actionUrl: '/housekeeping'
    }).catch(err => logger.error('[Notification] Room dirty notification error:', err.message))
  } else if (status === ROOM_STATUS.VACANT_CLEAN || status === ROOM_STATUS.INSPECTED) {
    notifyHotelUsers(hotelId, req.user._id, {
      type: 'room:ready',
      title: 'Oda Hazir',
      message: `Oda ${room.roomNumber} temizlendi ve hazir`,
      reference: { model: 'Room', id: roomId },
      actionUrl: '/front-desk'
    }).catch(err => logger.error('[Notification] Room ready notification error:', err.message))
  }

  res.json({
    success: true,
    data: updatedRoom
  })
})

/**
 * Update housekeeping status
 */
export const updateHousekeepingStatus = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params
  const { housekeepingStatus, priority, assignedHousekeeper } = req.body

  const room = await Room.findOne({
    _id: roomId,
    hotel: hotelId
  })

  if (!room) {
    throw new NotFoundError('Oda bulunamadi')
  }

  if (housekeepingStatus) {
    const validStatuses = Object.values(HOUSEKEEPING_STATUS)
    if (!validStatuses.includes(housekeepingStatus)) {
      throw new BadRequestError('Gecersiz housekeeping durumu')
    }
    room.housekeepingStatus = housekeepingStatus

    // If marking as clean, update room status too
    if (housekeepingStatus === HOUSEKEEPING_STATUS.CLEAN) {
      await room.markCleaned(req.user._id)
    } else if (housekeepingStatus === HOUSEKEEPING_STATUS.INSPECTED) {
      await room.markInspected(req.user._id)
    } else {
      await room.save()
    }
  }

  if (priority) {
    const validPriorities = Object.values(HOUSEKEEPING_PRIORITY)
    if (!validPriorities.includes(priority)) {
      throw new BadRequestError('Gecersiz oncelik')
    }
    room.housekeepingPriority = priority
    await room.save()
  }

  if (assignedHousekeeper !== undefined) {
    room.assignedHousekeeper = assignedHousekeeper || null
    await room.save()
  }

  const updatedRoom = await Room.findById(roomId)
    .populate('roomType', 'name code')
    .populate('assignedHousekeeper', 'firstName lastName')

  // Emit socket event for real-time updates
  emitHousekeepingUpdate(hotelId, {
    roomId: roomId,
    roomNumber: room.roomNumber,
    status: housekeepingStatus || room.housekeepingStatus,
    priority: priority || room.housekeepingPriority,
    assignedTo: updatedRoom.assignedHousekeeper?.firstName
      ? `${updatedRoom.assignedHousekeeper.firstName} ${updatedRoom.assignedHousekeeper.lastName}`
      : null
  })

  // Send notification based on housekeeping status change
  const currentStatus = housekeepingStatus || room.housekeepingStatus
  if (currentStatus === HOUSEKEEPING_STATUS.CLEAN) {
    notifyHotelUsers(hotelId, req.user._id, {
      type: 'room:ready',
      title: 'Oda Hazir',
      message: `Oda ${room.roomNumber} temizlendi ve hazir`,
      reference: { model: 'Room', id: roomId },
      actionUrl: '/front-desk'
    }).catch(err => logger.error('[Notification] Room ready notification error:', err.message))
  } else if (currentStatus === HOUSEKEEPING_STATUS.DIRTY) {
    notifyHotelUsers(hotelId, req.user._id, {
      type: 'room:dirty',
      title: 'Oda Kirli',
      message: `Oda ${room.roomNumber} temizlik bekliyor`,
      reference: { model: 'Room', id: roomId },
      actionUrl: '/housekeeping'
    }).catch(err => logger.error('[Notification] Room dirty notification error:', err.message))
  }

  res.json({
    success: true,
    data: updatedRoom
  })
})

/**
 * Bulk update housekeeping status
 */
export const bulkUpdateHousekeeping = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { roomIds, housekeepingStatus, priority, assignedHousekeeper } = req.body

  if (!Array.isArray(roomIds) || roomIds.length === 0) {
    throw new BadRequestError('Oda listesi gerekli')
  }

  const updateData = {}

  if (housekeepingStatus) {
    updateData.housekeepingStatus = housekeepingStatus
    if (housekeepingStatus === HOUSEKEEPING_STATUS.CLEAN) {
      updateData.lastCleanedAt = new Date()
      updateData.lastCleanedBy = req.user._id
    }
  }

  if (priority) {
    updateData.housekeepingPriority = priority
  }

  if (assignedHousekeeper !== undefined) {
    updateData.assignedHousekeeper = assignedHousekeeper || null
  }

  const result = await Room.updateMany(
    {
      _id: { $in: roomIds },
      hotel: hotelId
    },
    { $set: updateData }
  )

  res.json({
    success: true,
    modifiedCount: result.modifiedCount
  })
})

/**
 * Get room statistics
 */
export const getRoomStatistics = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const stats = await Room.getStatistics(hotelId)
  const floorSummary = await Room.getFloorSummary(hotelId)

  res.json({
    success: true,
    data: {
      summary: stats,
      floors: floorSummary
    }
  })
})

/**
 * Get rooms needing cleaning
 */
export const getRoomsNeedingCleaning = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const rooms = await Room.getNeedingCleaning(hotelId)

  res.json({
    success: true,
    data: rooms
  })
})

/**
 * Get rooms by floor
 */
export const getRoomsByFloor = asyncHandler(async (req, res) => {
  const { hotelId, floor } = req.params

  const rooms = await Room.getByFloor(hotelId, parseInt(floor))

  res.json({
    success: true,
    data: rooms
  })
})

/**
 * Get room types for hotel (from planning module)
 */
export const getRoomTypes = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const roomTypes = await RoomType.find({
    hotel: hotelId,
    status: 'active'
  }).sort('name')

  res.json({
    success: true,
    data: roomTypes
  })
})

/**
 * Get housekeeping dashboard - rooms organized by status
 */
export const getHousekeeping = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const rooms = await Room.find({
    hotel: hotelId,
    isActive: true
  })
    .populate('roomType', 'name code')
    .populate('assignedHousekeeper', 'firstName lastName')
    .sort({ floor: 1, roomNumber: 1 })

  // Group by housekeeping status
  const grouped = {
    dirty: rooms.filter(r => r.housekeepingStatus === HOUSEKEEPING_STATUS.DIRTY),
    inProgress: rooms.filter(r => r.housekeepingStatus === HOUSEKEEPING_STATUS.IN_PROGRESS),
    clean: rooms.filter(r => r.housekeepingStatus === HOUSEKEEPING_STATUS.CLEAN),
    inspected: rooms.filter(r => r.housekeepingStatus === HOUSEKEEPING_STATUS.INSPECTED),
    outOfService: rooms.filter(r => r.housekeepingStatus === HOUSEKEEPING_STATUS.OUT_OF_SERVICE)
  }

  res.json({
    success: true,
    data: rooms,
    summary: {
      dirty: grouped.dirty.length,
      inProgress: grouped.inProgress.length,
      clean: grouped.clean.length,
      inspected: grouped.inspected.length,
      outOfService: grouped.outOfService.length,
      total: rooms.length
    }
  })
})

// Export enums for use in routes
export { ROOM_STATUS, HOUSEKEEPING_STATUS, HOUSEKEEPING_PRIORITY }
