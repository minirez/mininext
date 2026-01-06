/**
 * Campaigns Service
 * Handles campaign CRUD operations
 * Split from planning.service.js for better maintainability
 */

import Campaign from './campaign.model.js'
import { NotFoundError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import { getPartnerId, verifyHotelOwnership } from '../../services/helpers.js'

// ==================== CAMPAIGNS ====================

export const getCampaigns = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const { status, type } = req.query
  const filter = { partner: partnerId, hotel: hotelId }
  if (status) filter.status = status
  if (type) filter.type = type

  const campaigns = await Campaign.find(filter)
    .populate('conditions.applicableRoomTypes', 'name code')
    .populate('conditions.applicableMarkets', 'name code')
    .populate('conditions.applicableMealPlans', 'name code')
    .sort('displayOrder')

  res.json({ success: true, data: campaigns })
})

export const getCampaign = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const campaign = await Campaign.findOne({ _id: id, hotel: hotelId, partner: partnerId })
    .populate('conditions.applicableRoomTypes', 'name code')
    .populate('conditions.applicableMarkets', 'name code')
    .populate('conditions.applicableMealPlans', 'name code')

  if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

  res.json({ success: true, data: campaign })
})

export const createCampaign = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const campaign = await Campaign.create({
    ...req.body,
    partner: partnerId,
    hotel: hotelId
  })

  logger.info(`Campaign created: ${campaign.code} for hotel ${hotelId}`)

  res.status(201).json({
    success: true,
    message: req.t('CAMPAIGN_CREATED'),
    data: campaign
  })
})

export const updateCampaign = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const campaign = await Campaign.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    req.body,
    { new: true, runValidators: true }
  )

  if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('CAMPAIGN_UPDATED'),
    data: campaign
  })
})

export const deleteCampaign = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const campaign = await Campaign.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
  if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('CAMPAIGN_DELETED')
  })
})

export const updateCampaignStatus = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params
  const { status } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!['draft', 'active', 'inactive', 'expired'].includes(status))
    throw new BadRequestError('INVALID_STATUS')

  await verifyHotelOwnership(hotelId, partnerId)

  const campaign = await Campaign.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    { status },
    { new: true }
  )

  if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('STATUS_UPDATED'),
    data: campaign
  })
})
