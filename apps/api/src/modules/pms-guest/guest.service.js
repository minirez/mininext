/**
 * Guest Service
 * API handlers for guest management
 */

import { asyncHandler, escapeRegex, sanitizeSort, isValidObjectId } from '#helpers'
import { parsePagination } from '#services/queryBuilder.js'
import Guest, { VIP_LEVELS, ID_TYPES } from './guest.model.js'
import Stay from '#modules/pms-frontdesk/stay.model.js'
import Hotel from '#modules/hotel/hotel.model.js'

// Allowed sort fields for guests
const GUEST_SORT_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'createdAt',
  'updatedAt',
  'statistics.lastStayDate',
  'statistics.totalStays',
  'statistics.totalSpent',
  'vipLevel',
  'isBlacklisted'
]

// Get all guests with search and filters
export const getGuests = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const {
    search,
    vipLevel,
    isBlacklisted,
    sort: querySort = '-statistics.lastStayDate'
  } = req.query

  const { page, limit, skip } = parsePagination(req.query)
  const sort = sanitizeSort(querySort, GUEST_SORT_FIELDS, '-statistics.lastStayDate')

  const query = { hotel: hotelId, isActive: true }

  // VIP filter
  if (vipLevel && vipLevel !== 'all') {
    query.vipLevel = vipLevel
  }

  // Blacklist filter
  if (isBlacklisted === 'true') {
    query.isBlacklisted = true
  } else if (isBlacklisted === 'false') {
    query.isBlacklisted = false
  }

  // Search - escape regex special characters to prevent injection
  if (search) {
    const escapedSearch = escapeRegex(search)
    query.$or = [
      { firstName: { $regex: escapedSearch, $options: 'i' } },
      { lastName: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { phone: { $regex: escapedSearch, $options: 'i' } },
      { idNumber: { $regex: escapedSearch, $options: 'i' } }
    ]
  }

  const [guests, total] = await Promise.all([
    Guest.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Guest.countDocuments(query)
  ])

  res.json({
    success: true,
    data: guests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

// Get single guest
export const getGuest = asyncHandler(async (req, res) => {
  const { hotelId, guestId } = req.params

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  }).lean()

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  res.json({
    success: true,
    data: guest
  })
})

// Get guest statistics
export const getGuestStats = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const stats = await Guest.getStatistics(hotelId)

  res.json({
    success: true,
    data: stats
  })
})

// Get VIP guests
export const getVipGuests = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const guests = await Guest.getVipGuests(hotelId)

  res.json({
    success: true,
    data: guests
  })
})

// Get blacklisted guests
export const getBlacklistedGuests = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const guests = await Guest.getBlacklisted(hotelId)

  res.json({
    success: true,
    data: guests
  })
})

// Get recent guests
export const getRecentGuests = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { days = 30 } = req.query

  const guests = await Guest.getRecentGuests(hotelId, parseInt(days))

  res.json({
    success: true,
    data: guests
  })
})

// Create new guest
export const createGuest = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const guestData = req.body

  // Get hotel
  const hotel = await Hotel.findById(hotelId)
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: 'Hotel not found'
    })
  }

  // Check for duplicate
  if (guestData.idNumber) {
    const existing = await Guest.findOne({
      hotel: hotelId,
      idNumber: guestData.idNumber
    })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bu kimlik numarasina sahip misafir zaten mevcut'
      })
    }
  }

  const guest = new Guest({
    ...guestData,
    hotel: hotelId
  })

  await guest.save()

  res.status(201).json({
    success: true,
    data: guest
  })
})

// Update guest
export const updateGuest = asyncHandler(async (req, res) => {
  const { hotelId, guestId } = req.params
  const updates = req.body

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  })

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  // Fields that can be updated
  const allowedUpdates = [
    'title',
    'firstName',
    'lastName',
    'gender',
    'dateOfBirth',
    'nationality',
    'idType',
    'idNumber',
    'idExpiry',
    'idIssuingCountry',
    'email',
    'phone',
    'alternatePhone',
    'whatsapp',
    'address',
    'company',
    'preferences',
    'contactPreferences',
    'loyaltyNumber',
    'tags',
    'photoUrl'
  ]

  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      guest[field] = updates[field]
    }
  })

  await guest.save()

  res.json({
    success: true,
    data: guest
  })
})

// Delete guest (soft delete)
export const deleteGuest = asyncHandler(async (req, res) => {
  const { hotelId, guestId } = req.params

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  })

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  guest.isActive = false
  await guest.save()

  res.json({
    success: true,
    message: 'Guest deleted'
  })
})

// Set VIP level
export const setVipLevel = asyncHandler(async (req, res) => {
  const { hotelId, guestId } = req.params
  const { vipLevel } = req.body

  if (!Object.values(VIP_LEVELS).includes(vipLevel)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid VIP level'
    })
  }

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  })

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  guest.vipLevel = vipLevel
  await guest.save()

  res.json({
    success: true,
    data: guest
  })
})

// Blacklist guest
export const blacklistGuest = asyncHandler(async (req, res) => {
  const { hotelId, guestId } = req.params
  const { reason } = req.body

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Blacklist reason is required'
    })
  }

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  })

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  await guest.blacklist(reason, req.user._id)

  res.json({
    success: true,
    data: guest
  })
})

// Remove from blacklist
export const removeFromBlacklist = asyncHandler(async (req, res) => {
  const { hotelId, guestId } = req.params

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  })

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  await guest.removeFromBlacklist()

  res.json({
    success: true,
    data: guest
  })
})

// Add note to guest
export const addNote = asyncHandler(async (req, res) => {
  const { hotelId, guestId } = req.params
  const { content, isImportant = false } = req.body

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Note content is required'
    })
  }

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  })

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  guest.notes.unshift({
    content,
    isImportant,
    createdBy: req.user._id,
    createdAt: new Date()
  })

  await guest.save()

  res.json({
    success: true,
    data: guest
  })
})

// Delete note from guest
export const deleteNote = asyncHandler(async (req, res) => {
  const { hotelId, guestId, noteId } = req.params

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  })

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  guest.notes = guest.notes.filter(note => note._id.toString() !== noteId)
  await guest.save()

  res.json({
    success: true,
    data: guest
  })
})

// Update tags
export const updateTags = asyncHandler(async (req, res) => {
  const { hotelId, guestId } = req.params
  const { tags } = req.body

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  })

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  guest.tags = tags || []
  await guest.save()

  res.json({
    success: true,
    data: guest
  })
})

// Get guest stay history
export const getStayHistory = asyncHandler(async (req, res) => {
  const { hotelId, guestId } = req.params
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 10 })

  const guest = await Guest.findOne({
    _id: guestId,
    hotel: hotelId
  })

  if (!guest) {
    return res.status(404).json({
      success: false,
      message: 'Guest not found'
    })
  }

  // Get full stay history from Stay collection
  const [stays, total] = await Promise.all([
    Stay.find({
      hotel: hotelId,
      'guests.guest': guestId
    })
      .populate('room', 'roomNumber floor')
      .populate('roomType', 'code name')
      .sort({ checkInDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Stay.countDocuments({
      hotel: hotelId,
      'guests.guest': guestId
    })
  ])

  res.json({
    success: true,
    data: stays,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

// Merge guests (combine duplicate profiles)
export const mergeGuests = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { primaryGuestId, secondaryGuestId } = req.body

  // Validate required fields
  if (!primaryGuestId || !secondaryGuestId) {
    return res.status(400).json({
      success: false,
      message: 'Both guest IDs are required'
    })
  }

  // Validate ObjectId format
  if (!isValidObjectId(primaryGuestId) || !isValidObjectId(secondaryGuestId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid guest ID format'
    })
  }

  // Prevent self-merge
  if (primaryGuestId === secondaryGuestId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot merge a guest with itself'
    })
  }

  const [primary, secondary] = await Promise.all([
    Guest.findOne({ _id: primaryGuestId, hotel: hotelId }),
    Guest.findOne({ _id: secondaryGuestId, hotel: hotelId })
  ])

  if (!primary || !secondary) {
    return res.status(404).json({
      success: false,
      message: 'One or both guests not found'
    })
  }

  // Merge statistics
  primary.statistics.totalStays += secondary.statistics.totalStays
  primary.statistics.totalNights += secondary.statistics.totalNights
  primary.statistics.totalSpent += secondary.statistics.totalSpent
  primary.statistics.noShowCount += secondary.statistics.noShowCount
  primary.statistics.cancellationCount += secondary.statistics.cancellationCount

  if (secondary.statistics.firstStayDate < primary.statistics.firstStayDate) {
    primary.statistics.firstStayDate = secondary.statistics.firstStayDate
  }
  if (secondary.statistics.lastStayDate > primary.statistics.lastStayDate) {
    primary.statistics.lastStayDate = secondary.statistics.lastStayDate
  }

  primary.statistics.averageStayLength =
    primary.statistics.totalNights / primary.statistics.totalStays

  // Merge recent stays
  primary.recentStays = [...primary.recentStays, ...secondary.recentStays]
    .sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate))
    .slice(0, 10)

  // Merge notes
  primary.notes = [...primary.notes, ...secondary.notes].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  // Merge tags
  primary.tags = [...new Set([...primary.tags, ...secondary.tags])]

  // Fill missing fields from secondary
  if (!primary.email && secondary.email) primary.email = secondary.email
  if (!primary.phone && secondary.phone) primary.phone = secondary.phone
  if (!primary.idNumber && secondary.idNumber) primary.idNumber = secondary.idNumber
  if (!primary.dateOfBirth && secondary.dateOfBirth) primary.dateOfBirth = secondary.dateOfBirth
  if (!primary.nationality && secondary.nationality) primary.nationality = secondary.nationality

  // Keep higher VIP level
  const vipOrder = [VIP_LEVELS.NONE, VIP_LEVELS.SILVER, VIP_LEVELS.GOLD, VIP_LEVELS.PLATINUM]
  if (vipOrder.indexOf(secondary.vipLevel) > vipOrder.indexOf(primary.vipLevel)) {
    primary.vipLevel = secondary.vipLevel
  }

  // Update stays to reference primary guest
  await Stay.updateMany(
    { hotel: hotelId, 'guests.guestId': secondaryGuestId },
    { $set: { 'guests.$.guestId': primaryGuestId } }
  )

  // Soft delete secondary
  secondary.isActive = false
  await secondary.save()

  // Save primary
  await primary.save()

  res.json({
    success: true,
    data: primary,
    message: 'Guests merged successfully'
  })
})
