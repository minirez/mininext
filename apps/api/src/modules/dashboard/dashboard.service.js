import mongoose from 'mongoose'
import { asyncHandler } from '#helpers'
import Partner from '../partner/partner.model.js'
import Agency from '../agency/agency.model.js'
import User from '../user/user.model.js'
import Hotel from '../hotel/hotel.model.js'
import Booking from '../booking/booking.model.js'

/**
 * Platform Admin Dashboard
 * - Tüm platform istatistikleri
 */
export const getPlatformDashboard = asyncHandler(async (req, res) => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const _startOfYear = new Date(today.getFullYear(), 0, 1)

  // Paralel sorgular
  const [
    totalPartners,
    activePartners,
    pendingPartners,
    totalAgencies,
    totalUsers,
    totalHotels,
    totalBookings,
    monthlyBookings,
    monthlyRevenue,
    recentBookings,
    topPartners
  ] = await Promise.all([
    Partner.countDocuments(),
    Partner.countDocuments({ status: 'active' }),
    Partner.countDocuments({ status: 'pending' }),
    Agency.countDocuments(),
    User.countDocuments(),
    Hotel.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Booking.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$pricing.grandTotal' } } }
    ]),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('hotel', 'name')
      .select(
        'bookingNumber hotel checkIn checkOut pricing.grandTotal pricing.currency status createdAt'
      ),
    Booking.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$partner', count: { $sum: 1 }, revenue: { $sum: '$pricing.grandTotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'partners', localField: '_id', foreignField: '_id', as: 'partner' } },
      { $unwind: '$partner' },
      { $project: { name: '$partner.companyName', count: 1, revenue: 1 } }
    ])
  ])

  // Aylık trend (son 6 ay)
  const monthlyTrend = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) }
      }
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        bookings: { $sum: 1 },
        revenue: { $sum: '$pricing.grandTotal' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])

  res.json({
    success: true,
    data: {
      stats: {
        partners: { total: totalPartners, active: activePartners, pending: pendingPartners },
        agencies: { total: totalAgencies },
        users: { total: totalUsers },
        hotels: { total: totalHotels },
        bookings: { total: totalBookings, monthly: monthlyBookings },
        revenue: { monthly: monthlyRevenue[0]?.total || 0 }
      },
      recentBookings,
      topPartners,
      monthlyTrend
    }
  })
})

/**
 * Partner Dashboard
 * - Partner'a ait istatistikler
 */
export const getPartnerDashboard = asyncHandler(async (req, res) => {
  // Use authenticated user's accountId; platform admin can specify via header
  const partnerIdStr =
    req.user.accountType === 'platform'
      ? req.headers['x-partner-id'] || req.user.accountId
      : req.user.accountId

  if (!partnerIdStr) {
    return res.status(400).json({ success: false, message: 'Partner ID required' })
  }

  // Convert to ObjectId for MongoDB queries
  const partnerId = new mongoose.Types.ObjectId(partnerIdStr)
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))

  const [
    totalAgencies,
    activeAgencies,
    totalUsers,
    totalHotels,
    activeHotels,
    totalBookings,
    monthlyBookings,
    weeklyBookings,
    pendingBookings,
    monthlyRevenue,
    recentBookings,
    topAgencies,
    topHotels
  ] = await Promise.all([
    Agency.countDocuments({ partner: partnerId }),
    Agency.countDocuments({ partner: partnerId, status: 'active' }),
    User.countDocuments({ accountType: 'partner', accountId: partnerId }),
    Hotel.countDocuments({ partner: partnerId }),
    Hotel.countDocuments({ partner: partnerId, status: 'active' }),
    Booking.countDocuments({ partner: partnerId }),
    Booking.countDocuments({ partner: partnerId, createdAt: { $gte: startOfMonth } }),
    Booking.countDocuments({ partner: partnerId, createdAt: { $gte: startOfWeek } }),
    Booking.countDocuments({ partner: partnerId, status: 'pending' }),
    Booking.aggregate([
      {
        $match: {
          partner: partnerId,
          createdAt: { $gte: startOfMonth },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.grandTotal' } } }
    ]),
    Booking.find({ partner: partnerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('hotel', 'name')
      .populate('source.agencyId', 'name')
      .select(
        'bookingNumber hotel source.agencyId source.agencyName checkIn checkOut pricing.grandTotal pricing.currency status createdAt leadGuest'
      ),
    Booking.aggregate([
      { $match: { partner: partnerId, createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: '$source.agencyId',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.grandTotal' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'agencies', localField: '_id', foreignField: '_id', as: 'agency' } },
      { $unwind: { path: '$agency', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$agency.name', 'Direct'] }, count: 1, revenue: 1 } }
    ]),
    Booking.aggregate([
      { $match: { partner: partnerId, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$hotel', count: { $sum: 1 }, revenue: { $sum: '$pricing.grandTotal' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'hotels', localField: '_id', foreignField: '_id', as: 'hotel' } },
      { $unwind: '$hotel' },
      { $project: { name: '$hotel.name', count: 1, revenue: 1 } }
    ])
  ])

  // Günlük trend (son 14 gün)
  const dailyTrend = await Booking.aggregate([
    {
      $match: {
        partner: partnerId,
        createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        bookings: { $sum: 1 },
        revenue: { $sum: '$pricing.grandTotal' }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // Bugünkü check-in/out
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999))

  const [todayCheckIns, todayCheckOuts] = await Promise.all([
    Booking.countDocuments({ partner: partnerId, checkIn: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({ partner: partnerId, checkOut: { $gte: todayStart, $lte: todayEnd } })
  ])

  res.json({
    success: true,
    data: {
      stats: {
        agencies: { total: totalAgencies, active: activeAgencies },
        users: { total: totalUsers },
        hotels: { total: totalHotels, active: activeHotels },
        bookings: {
          total: totalBookings,
          monthly: monthlyBookings,
          weekly: weeklyBookings,
          pending: pendingBookings
        },
        revenue: { monthly: monthlyRevenue[0]?.total || 0 },
        today: { checkIns: todayCheckIns, checkOuts: todayCheckOuts }
      },
      recentBookings,
      topAgencies,
      topHotels,
      dailyTrend
    }
  })
})

/**
 * Agency Dashboard
 * - Acenteye ait istatistikler
 */
export const getAgencyDashboard = asyncHandler(async (req, res) => {
  const agencyIdStr = req.user.accountId

  if (!agencyIdStr) {
    return res.status(400).json({ success: false, message: 'Agency ID required' })
  }

  const agencyId = new mongoose.Types.ObjectId(agencyIdStr)
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))

  const [
    totalUsers,
    totalBookings,
    monthlyBookings,
    weeklyBookings,
    pendingBookings,
    confirmedBookings,
    monthlyRevenue,
    monthlyCommission,
    recentBookings
  ] = await Promise.all([
    User.countDocuments({ accountType: 'agency', accountId: agencyId }),
    Booking.countDocuments({ 'source.agencyId': agencyId }),
    Booking.countDocuments({ 'source.agencyId': agencyId, createdAt: { $gte: startOfMonth } }),
    Booking.countDocuments({ 'source.agencyId': agencyId, createdAt: { $gte: startOfWeek } }),
    Booking.countDocuments({ 'source.agencyId': agencyId, status: 'pending' }),
    Booking.countDocuments({ 'source.agencyId': agencyId, status: 'confirmed' }),
    Booking.aggregate([
      {
        $match: {
          'source.agencyId': agencyId,
          createdAt: { $gte: startOfMonth },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.grandTotal' } } }
    ]),
    Booking.aggregate([
      {
        $match: {
          'source.agencyId': agencyId,
          createdAt: { $gte: startOfMonth },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.commission' } } }
    ]),
    Booking.find({ 'source.agencyId': agencyId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('hotel', 'name')
      .select(
        'bookingNumber hotel checkIn checkOut pricing.grandTotal pricing.currency pricing.commission status createdAt leadGuest'
      )
  ])

  // Günlük trend (son 14 gün)
  const dailyTrend = await Booking.aggregate([
    {
      $match: {
        'source.agencyId': agencyId,
        createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        bookings: { $sum: 1 },
        revenue: { $sum: '$pricing.grandTotal' },
        commission: { $sum: '$pricing.commission' }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // En çok rezervasyon yapılan oteller
  const topHotels = await Booking.aggregate([
    { $match: { 'source.agencyId': agencyId, createdAt: { $gte: startOfMonth } } },
    { $group: { _id: '$hotel', count: { $sum: 1 }, revenue: { $sum: '$pricing.grandTotal' } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'hotels', localField: '_id', foreignField: '_id', as: 'hotel' } },
    { $unwind: '$hotel' },
    { $project: { name: '$hotel.name', count: 1, revenue: 1 } }
  ])

  res.json({
    success: true,
    data: {
      stats: {
        users: { total: totalUsers },
        bookings: {
          total: totalBookings,
          monthly: monthlyBookings,
          weekly: weeklyBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings
        },
        revenue: { monthly: monthlyRevenue[0]?.total || 0 },
        commission: { monthly: monthlyCommission[0]?.total || 0 }
      },
      recentBookings,
      topHotels,
      dailyTrend
    }
  })
})
