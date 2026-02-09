/**
 * Reports Service
 * Generates various operational and financial reports
 */

import { asyncHandler } from '#helpers'
import mongoose from 'mongoose'
import Room from '#modules/pms-housekeeping/room.model.js'
import Stay from './stay.model.js'
import Booking from '#modules/booking/booking.model.js'
import Guest from '#modules/pms-guest/guest.model.js'
import Transaction from '#modules/pms-billing/transaction.model.js'
import CashRegister from '#modules/pms-billing/cashRegister.model.js'

// ==========================================
// OCCUPANCY REPORTS
// ==========================================

// Daily occupancy report
export const getOccupancyReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { startDate, endDate } = req.query

  const start = startDate ? new Date(startDate) : new Date()
  start.setHours(0, 0, 0, 0)

  const end = endDate ? new Date(endDate) : new Date(start)
  end.setHours(23, 59, 59, 999)

  // Get total rooms
  const totalRooms = await Room.countDocuments({
    hotel: hotelId,
    isActive: true
  })

  // Get daily occupancy data
  const days = []
  const currentDate = new Date(start)

  while (currentDate <= end) {
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    // Count occupied rooms for this day
    const occupiedRooms = await Stay.countDocuments({
      hotel: hotelId,
      status: { $in: ['checked_in', 'checked_out'] },
      checkInDate: { $lte: dayEnd },
      checkOutDate: { $gte: dayStart }
    })

    // Count arrivals
    const arrivals = await Stay.countDocuments({
      hotel: hotelId,
      checkInDate: { $gte: dayStart, $lte: dayEnd }
    })

    // Count departures
    const departures = await Stay.countDocuments({
      hotel: hotelId,
      checkOutDate: { $gte: dayStart, $lte: dayEnd }
    })

    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0

    days.push({
      date: dayStart.toISOString().split('T')[0],
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms,
      occupancyRate: parseFloat(occupancyRate),
      arrivals,
      departures
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Calculate averages
  const avgOccupancy =
    days.length > 0
      ? (days.reduce((sum, d) => sum + d.occupancyRate, 0) / days.length).toFixed(1)
      : 0

  res.json({
    success: true,
    data: {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        totalRooms,
        averageOccupancy: parseFloat(avgOccupancy),
        totalArrivals: days.reduce((sum, d) => sum + d.arrivals, 0),
        totalDepartures: days.reduce((sum, d) => sum + d.departures, 0)
      },
      daily: days
    }
  })
})

// Room type occupancy breakdown
export const getRoomTypeOccupancy = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { date } = req.query

  const targetDate = date ? new Date(date) : new Date()
  targetDate.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  // Get room counts by type
  const roomsByType = await Room.aggregate([
    {
      $match: {
        hotel: new mongoose.Types.ObjectId(hotelId),
        isActive: true
      }
    },
    {
      $group: {
        _id: '$roomType',
        totalRooms: { $sum: 1 },
        rooms: { $push: '$_id' }
      }
    },
    {
      $lookup: {
        from: 'roomtypes',
        localField: '_id',
        foreignField: '_id',
        as: 'roomTypeInfo'
      }
    },
    {
      $unwind: { path: '$roomTypeInfo', preserveNullAndEmptyArrays: true }
    }
  ])

  // Get occupied rooms by type
  const occupiedByType = await Stay.aggregate([
    {
      $match: {
        hotel: new mongoose.Types.ObjectId(hotelId),
        status: { $in: ['checked_in'] },
        checkInDate: { $lte: endOfDay },
        checkOutDate: { $gte: targetDate }
      }
    },
    {
      $lookup: {
        from: 'rooms',
        localField: 'room',
        foreignField: '_id',
        as: 'roomInfo'
      }
    },
    {
      $unwind: '$roomInfo'
    },
    {
      $group: {
        _id: '$roomInfo.roomType',
        occupiedCount: { $sum: 1 }
      }
    }
  ])

  // Combine data
  const occupiedMap = new Map(occupiedByType.map(o => [o._id?.toString(), o.occupiedCount]))

  const report = roomsByType.map(rt => {
    const occupied = occupiedMap.get(rt._id?.toString()) || 0
    const available = rt.totalRooms - occupied
    const occupancyRate = rt.totalRooms > 0 ? ((occupied / rt.totalRooms) * 100).toFixed(1) : 0

    return {
      roomType: rt.roomTypeInfo?.name?.tr || rt.roomTypeInfo?.name?.en || 'Bilinmiyor',
      roomTypeId: rt._id,
      totalRooms: rt.totalRooms,
      occupiedRooms: occupied,
      availableRooms: available,
      occupancyRate: parseFloat(occupancyRate)
    }
  })

  res.json({
    success: true,
    data: {
      date: targetDate.toISOString().split('T')[0],
      roomTypes: report
    }
  })
})

// ==========================================
// ARRIVAL / DEPARTURE REPORTS
// ==========================================

// Arrivals report
export const getArrivalsReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { date, status } = req.query

  const targetDate = date ? new Date(date) : new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const query = {
    hotel: hotelId,
    checkInDate: { $gte: startOfDay, $lte: endOfDay }
  }

  if (status && status !== 'all') {
    query.status = status
  }

  const arrivals = await Stay.find(query)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name')
    .sort({ checkInDate: 1 })
    .lean()

  // Helper to get main guest from embedded guests array
  const getMainGuest = stay => {
    if (!stay.guests || stay.guests.length === 0) return null
    return stay.guests.find(g => g.isMainGuest) || stay.guests[0]
  }

  // Group by status
  const byStatus = {
    expected: arrivals.filter(a => a.status === 'pending'),
    checkedIn: arrivals.filter(a => a.status === 'checked_in'),
    noShow: arrivals.filter(a => a.status === 'no_show'),
    cancelled: arrivals.filter(a => a.status === 'cancelled')
  }

  res.json({
    success: true,
    data: {
      date: targetDate.toISOString().split('T')[0],
      summary: {
        total: arrivals.length,
        expected: byStatus.expected.length,
        checkedIn: byStatus.checkedIn.length,
        noShow: byStatus.noShow.length,
        cancelled: byStatus.cancelled.length
      },
      arrivals: arrivals.map(a => {
        const mainGuest = getMainGuest(a)
        return {
          stayNumber: a.stayNumber,
          guestName: mainGuest ? `${mainGuest.firstName} ${mainGuest.lastName}` : 'Bilinmiyor',
          phone: mainGuest?.phone,
          nationality: mainGuest?.nationality,
          roomNumber: a.room?.roomNumber || 'Atanmadi',
          roomType: a.roomType?.name?.tr || a.roomType?.name?.en,
          adults: a.adultsCount,
          children: a.childrenCount,
          nights: a.nights,
          status: a.status,
          totalAmount: a.totalAmount,
          paidAmount: a.paidAmount,
          balance: a.balance,
          source: a.source,
          notes: a.specialRequests
        }
      })
    }
  })
})

// Departures report
export const getDeparturesReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { date, status } = req.query

  const targetDate = date ? new Date(date) : new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const query = {
    hotel: hotelId,
    checkOutDate: { $gte: startOfDay, $lte: endOfDay }
  }

  if (status && status !== 'all') {
    query.status = status
  }

  const departures = await Stay.find(query)
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name')
    .sort({ checkOutDate: 1 })
    .lean()

  // Helper to get main guest from embedded guests array
  const getMainGuest = stay => {
    if (!stay.guests || stay.guests.length === 0) return null
    return stay.guests.find(g => g.isMainGuest) || stay.guests[0]
  }

  // Group by status
  const byStatus = {
    expected: departures.filter(d => d.status === 'checked_in'),
    checkedOut: departures.filter(d => d.status === 'checked_out')
  }

  res.json({
    success: true,
    data: {
      date: targetDate.toISOString().split('T')[0],
      summary: {
        total: departures.length,
        expected: byStatus.expected.length,
        checkedOut: byStatus.checkedOut.length,
        withBalance: departures.filter(d => d.balance > 0).length
      },
      departures: departures.map(d => {
        const mainGuest = getMainGuest(d)
        return {
          stayNumber: d.stayNumber,
          guestName: mainGuest ? `${mainGuest.firstName} ${mainGuest.lastName}` : 'Bilinmiyor',
          phone: mainGuest?.phone,
          roomNumber: d.room?.roomNumber,
          roomType: d.roomType?.name?.tr || d.roomType?.name?.en,
          checkInDate: d.checkInDate,
          nights: d.nights,
          status: d.status,
          totalAmount: d.totalAmount,
          paidAmount: d.paidAmount,
          balance: d.balance,
          actualCheckOut: d.actualCheckOut
        }
      })
    }
  })
})

// In-house guests report
export const getInHouseReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const inHouse = await Stay.find({
    hotel: hotelId,
    status: 'checked_in'
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name')
    .sort({ 'room.roomNumber': 1 })
    .lean()

  // Helper to get main guest from embedded guests array
  const getMainGuest = stay => {
    if (!stay.guests || stay.guests.length === 0) return null
    return stay.guests.find(g => g.isMainGuest) || stay.guests[0]
  }

  // Group by floor
  const byFloor = {}
  inHouse.forEach(stay => {
    const floor = stay.room?.floor || 0
    if (!byFloor[floor]) byFloor[floor] = []
    byFloor[floor].push(stay)
  })

  res.json({
    success: true,
    data: {
      summary: {
        totalGuests: inHouse.reduce(
          (sum, s) => sum + (s.adultsCount || 0) + (s.childrenCount || 0),
          0
        ),
        totalRooms: inHouse.length,
        vipGuests: inHouse.filter(s => s.isVip).length
      },
      guests: inHouse.map(s => {
        const mainGuest = getMainGuest(s)
        return {
          stayNumber: s.stayNumber,
          roomNumber: s.room?.roomNumber,
          floor: s.room?.floor,
          guestName: mainGuest ? `${mainGuest.firstName} ${mainGuest.lastName}` : 'Bilinmiyor',
          phone: mainGuest?.phone,
          nationality: mainGuest?.nationality,
          isVip: s.isVip,
          adults: s.adultsCount,
          children: s.childrenCount,
          checkInDate: s.checkInDate,
          checkOutDate: s.checkOutDate,
          remainingNights: Math.ceil(
            (new Date(s.checkOutDate) - new Date()) / (1000 * 60 * 60 * 24)
          ),
          balance: s.balance
        }
      }),
      byFloor
    }
  })
})

// ==========================================
// FINANCIAL REPORTS
// ==========================================

// Revenue report
export const getRevenueReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { startDate, endDate, groupBy = 'day' } = req.query

  const start = startDate ? new Date(startDate) : new Date()
  start.setHours(0, 0, 0, 0)

  const end = endDate ? new Date(endDate) : new Date()
  end.setHours(23, 59, 59, 999)

  // Get transactions
  const transactions = await Transaction.aggregate([
    {
      $match: {
        hotel: new mongoose.Types.ObjectId(hotelId),
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category'
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])

  // Group by category
  const byCategory = {}
  transactions.forEach(t => {
    const cat = t._id.category || 'other'
    if (!byCategory[cat]) {
      byCategory[cat] = { total: 0, count: 0, types: {} }
    }
    byCategory[cat].total += t.total
    byCategory[cat].count += t.count
    byCategory[cat].types[t._id.type] = {
      total: t.total,
      count: t.count
    }
  })

  // Daily breakdown
  const dailyRevenue = await Transaction.aggregate([
    {
      $match: {
        hotel: new mongoose.Types.ObjectId(hotelId),
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' },
        type: { $nin: ['refund', 'void', 'discount'] }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // Payment method breakdown
  const byPaymentMethod = await Transaction.aggregate([
    {
      $match: {
        hotel: new mongoose.Types.ObjectId(hotelId),
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])

  // Calculate totals
  const grossRevenue = transactions
    .filter(t => !['refund', 'void', 'discount', 'expense', 'payout'].includes(t._id.type))
    .reduce((sum, t) => sum + t.total, 0)

  const refunds = transactions
    .filter(t => t._id.type === 'refund')
    .reduce((sum, t) => sum + Math.abs(t.total), 0)

  const discounts = transactions
    .filter(t => t._id.type === 'discount')
    .reduce((sum, t) => sum + Math.abs(t.total), 0)

  res.json({
    success: true,
    data: {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        grossRevenue,
        refunds,
        discounts,
        netRevenue: grossRevenue - refunds - discounts,
        transactionCount: transactions.reduce((sum, t) => sum + t.count, 0)
      },
      byCategory,
      byPaymentMethod: byPaymentMethod.map(p => ({
        method: p._id,
        total: p.total,
        count: p.count
      })),
      daily: dailyRevenue.map(d => ({
        date: d._id,
        total: d.total,
        count: d.count
      }))
    }
  })
})

// Cashier/shift report
export const getShiftReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { startDate, endDate } = req.query

  const start = startDate ? new Date(startDate) : new Date()
  start.setHours(0, 0, 0, 0)

  const end = endDate ? new Date(endDate) : new Date()
  end.setHours(23, 59, 59, 999)

  const shifts = await CashRegister.find({
    hotel: hotelId,
    openedAt: { $gte: start, $lte: end }
  })
    .populate('cashier', 'name email')
    .populate('closedBy', 'name email')
    .sort({ openedAt: -1 })
    .lean()

  // Calculate totals
  const totals = {
    totalShifts: shifts.length,
    closedShifts: shifts.filter(s => s.status === 'closed').length,
    totalTransactions: 0,
    grossSales: 0,
    netSales: 0,
    cashReceived: 0,
    cardReceived: 0,
    refunds: 0,
    totalDiscrepancy: 0
  }

  shifts.forEach(s => {
    totals.totalTransactions += s.transactionCounts?.total || 0
    totals.grossSales += s.totals?.grossSales || 0
    totals.netSales += s.totals?.netSales || 0
    totals.cashReceived += s.totals?.cashReceived || 0
    totals.cardReceived += s.totals?.cardReceived || 0
    totals.refunds += s.totals?.refunds || 0
    totals.totalDiscrepancy += s.discrepancy || 0
  })

  res.json({
    success: true,
    data: {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: totals,
      shifts: shifts.map(s => ({
        shiftNumber: s.shiftNumber,
        cashierName: s.cashierName,
        status: s.status,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        openingCash: s.openingBalance?.cash || 0,
        transactionCount: s.transactionCounts?.total || 0,
        grossSales: s.totals?.grossSales || 0,
        netSales: s.totals?.netSales || 0,
        cashReceived: s.totals?.cashReceived || 0,
        cardReceived: s.totals?.cardReceived || 0,
        expectedCash: s.expectedCash || 0,
        actualCash: s.actualCash || 0,
        discrepancy: s.discrepancy || 0
      }))
    }
  })
})

// ==========================================
// HOUSEKEEPING REPORTS
// ==========================================

// Housekeeping status report
export const getHousekeepingReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const rooms = await Room.find({
    hotel: hotelId,
    isActive: true
  })
    .populate('roomType', 'name')
    .sort({ roomNumber: 1 })
    .lean()

  // Group by status
  const byStatus = {
    clean: rooms.filter(r => r.housekeepingStatus === 'clean'),
    dirty: rooms.filter(r => r.housekeepingStatus === 'dirty'),
    inspected: rooms.filter(r => r.housekeepingStatus === 'inspected'),
    out_of_order: rooms.filter(r => r.housekeepingStatus === 'out_of_order'),
    in_progress: rooms.filter(r => r.housekeepingStatus === 'in_progress')
  }

  // Group by floor
  const byFloor = {}
  rooms.forEach(r => {
    const floor = r.floor || 0
    if (!byFloor[floor]) {
      byFloor[floor] = {
        clean: 0,
        dirty: 0,
        inspected: 0,
        out_of_order: 0,
        in_progress: 0,
        total: 0
      }
    }
    byFloor[floor][r.housekeepingStatus]++
    byFloor[floor].total++
  })

  res.json({
    success: true,
    data: {
      summary: {
        total: rooms.length,
        clean: byStatus.clean.length,
        dirty: byStatus.dirty.length,
        inspected: byStatus.inspected.length,
        outOfOrder: byStatus.out_of_order.length,
        inProgress: byStatus.in_progress.length,
        cleanPercentage:
          rooms.length > 0
            ? (((byStatus.clean.length + byStatus.inspected.length) / rooms.length) * 100).toFixed(
                1
              )
            : 0
      },
      byFloor,
      rooms: rooms.map(r => ({
        roomNumber: r.roomNumber,
        floor: r.floor,
        roomType: r.roomType?.name?.tr || r.roomType?.name?.en,
        status: r.status,
        housekeepingStatus: r.housekeepingStatus,
        lastCleaned: r.lastCleaned,
        notes: r.housekeepingNotes
      }))
    }
  })
})

// ==========================================
// GUEST REPORTS
// ==========================================

// Guest nationality report
export const getGuestNationalityReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { startDate, endDate } = req.query

  const start = startDate ? new Date(startDate) : new Date()
  start.setMonth(start.getMonth() - 1) // Default: last month
  start.setHours(0, 0, 0, 0)

  const end = endDate ? new Date(endDate) : new Date()
  end.setHours(23, 59, 59, 999)

  const byNationality = await Stay.aggregate([
    {
      $match: {
        hotel: new mongoose.Types.ObjectId(hotelId),
        checkInDate: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: 'guests',
        localField: 'guest',
        foreignField: '_id',
        as: 'guestInfo'
      }
    },
    {
      $unwind: '$guestInfo'
    },
    {
      $group: {
        _id: '$guestInfo.nationality',
        guestCount: { $sum: 1 },
        totalNights: { $sum: '$nights' },
        totalRevenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { guestCount: -1 } }
  ])

  const totalGuests = byNationality.reduce((sum, n) => sum + n.guestCount, 0)

  res.json({
    success: true,
    data: {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        totalGuests,
        uniqueNationalities: byNationality.length
      },
      nationalities: byNationality.map(n => ({
        nationality: n._id || 'Bilinmiyor',
        guestCount: n.guestCount,
        percentage: totalGuests > 0 ? ((n.guestCount / totalGuests) * 100).toFixed(1) : 0,
        totalNights: n.totalNights,
        totalRevenue: n.totalRevenue
      }))
    }
  })
})

// VIP guests report
export const getVipGuestsReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const vipGuests = await Guest.find({
    hotel: hotelId,
    vipLevel: { $ne: 'none' }
  })
    .sort({ 'statistics.totalSpent': -1 })
    .lean()

  // Group by VIP level
  const byLevel = {
    platinum: vipGuests.filter(g => g.vipLevel === 'platinum'),
    gold: vipGuests.filter(g => g.vipLevel === 'gold'),
    silver: vipGuests.filter(g => g.vipLevel === 'silver')
  }

  res.json({
    success: true,
    data: {
      summary: {
        total: vipGuests.length,
        platinum: byLevel.platinum.length,
        gold: byLevel.gold.length,
        silver: byLevel.silver.length,
        totalSpent: vipGuests.reduce((sum, g) => sum + (g.statistics?.totalSpent || 0), 0)
      },
      guests: vipGuests.map(g => ({
        name: `${g.firstName} ${g.lastName}`,
        email: g.email,
        phone: g.phone,
        vipLevel: g.vipLevel,
        totalStays: g.statistics?.totalStays || 0,
        totalNights: g.statistics?.totalNights || 0,
        totalSpent: g.statistics?.totalSpent || 0,
        lastStayDate: g.statistics?.lastStayDate
      }))
    }
  })
})

// ==========================================
// SUMMARY DASHBOARD REPORT
// ==========================================

export const getDashboardReport = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  // Parallel queries
  const [
    totalRooms,
    occupiedRooms,
    todayArrivals,
    todayDepartures,
    inHouseGuests,
    todayRevenue,
    monthlyRevenue,
    housekeepingStatus,
    pendingReservations
  ] = await Promise.all([
    Room.countDocuments({ hotel: hotelId, isActive: true }),
    // Count rooms with status 'occupied' (matches room plan)
    Room.countDocuments({
      hotel: hotelId,
      isActive: true,
      status: 'occupied'
    }),
    // Count reservations with today's check-in (not Stay records)
    Booking.countDocuments({
      hotel: hotelId,
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'confirmed'] }
    }),
    // Count reservations with today's check-out (not Stay records)
    Booking.countDocuments({
      hotel: hotelId,
      checkOut: { $gte: today, $lt: tomorrow },
      status: 'confirmed'
    }),
    // In-house guests: from Stay records with checked_in status
    Stay.aggregate([
      {
        $match: {
          hotel: new mongoose.Types.ObjectId(hotelId),
          status: 'checked_in'
        }
      },
      {
        $group: {
          _id: null,
          // Count from guests array (more reliable)
          totalGuests: { $sum: { $size: { $ifNull: ['$guests', []] } } },
          // Also get adultsCount/childrenCount as fallback
          adults: { $sum: { $ifNull: ['$adultsCount', 1] } },
          children: { $sum: { $ifNull: ['$childrenCount', 0] } },
          roomCount: { $sum: 1 }
        }
      }
    ]),
    Transaction.aggregate([
      {
        $match: {
          hotel: new mongoose.Types.ObjectId(hotelId),
          createdAt: { $gte: today, $lt: tomorrow },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: { _id: null, total: { $sum: '$amount' } }
      }
    ]),
    Transaction.aggregate([
      {
        $match: {
          hotel: new mongoose.Types.ObjectId(hotelId),
          createdAt: { $gte: monthStart },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: { _id: null, total: { $sum: '$amount' } }
      }
    ]),
    Room.aggregate([
      {
        $match: { hotel: new mongoose.Types.ObjectId(hotelId), isActive: true }
      },
      {
        $group: {
          _id: '$housekeepingStatus',
          count: { $sum: 1 }
        }
      }
    ]),
    // Count pending reservations
    Booking.countDocuments({
      hotel: hotelId,
      status: 'pending'
    })
  ])

  const guestCount = inHouseGuests[0] || { totalGuests: 0, adults: 0, children: 0, roomCount: 0 }
  // Use guests array count if available, otherwise fall back to adults+children
  const totalGuestsCount =
    guestCount.totalGuests > 0
      ? guestCount.totalGuests
      : (guestCount.adults || 0) + (guestCount.children || 0)
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0
  const hkStatus = {}
  housekeepingStatus.forEach(h => {
    hkStatus[h._id] = h.count
  })

  res.json({
    success: true,
    data: {
      occupancy: {
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        occupancyRate: parseFloat(occupancyRate)
      },
      movements: {
        todayArrivals,
        todayDepartures
      },
      guests: {
        inHouseRooms: occupiedRooms,
        adults: guestCount.adults || 0,
        children: guestCount.children || 0,
        total: totalGuestsCount
      },
      revenue: {
        today: todayRevenue[0]?.total || 0,
        monthly: monthlyRevenue[0]?.total || 0
      },
      housekeeping: {
        clean: hkStatus.clean || 0,
        dirty: hkStatus.dirty || 0,
        inspected: hkStatus.inspected || 0,
        outOfOrder: hkStatus.out_of_order || 0,
        inProgress: hkStatus.in_progress || 0
      },
      pendingReservations
    }
  })
})
