/**
 * Meal Plans Service
 * Handles meal plan CRUD operations
 * Split from planning.service.js for better maintainability
 */

import MealPlan from './mealPlan.model.js'
import Rate from './rate.model.js'
import { NotFoundError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import { getPartnerId, verifyHotelOwnership } from '../../services/helpers.js'

// ==================== MEAL PLANS ====================

export const getStandardMealPlans = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

  const mealPlans = await MealPlan.findStandardByPartner(partnerId)

  res.json({ success: true, data: mealPlans })
})

export const getMealPlans = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const { includeDeleted } = req.query
  const filter = { partner: partnerId, hotel: hotelId }

  if (includeDeleted !== 'true') {
    filter.status = { $ne: 'deleted' }
  }

  const mealPlans = await MealPlan.find(filter).sort('displayOrder')

  res.json({ success: true, data: mealPlans })
})

export const createMealPlan = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const mealPlan = await MealPlan.create({
    ...req.body,
    partner: partnerId,
    hotel: hotelId,
    isStandard: false
  })

  logger.info(`MealPlan created: ${mealPlan.code} for hotel ${hotelId}`)

  res.status(201).json({
    success: true,
    message: req.t('MEAL_PLAN_CREATED'),
    data: mealPlan
  })
})

export const updateMealPlan = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const existing = await MealPlan.findById(id)
  if (existing?.isStandard) throw new BadRequestError('CANNOT_UPDATE_STANDARD_PLAN')

  const mealPlan = await MealPlan.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    req.body,
    { new: true, runValidators: true }
  )

  if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('MEAL_PLAN_UPDATED'),
    data: mealPlan
  })
})

export const deleteMealPlan = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params
  const { deleteRates } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const rateCount = await Rate.countDocuments({ mealPlan: id })

  if (rateCount > 0) {
    if (deleteRates === 'true') {
      const deleteResult = await Rate.deleteMany({
        mealPlan: id,
        hotel: hotelId,
        partner: partnerId
      })
      logger.info(`Deleted ${deleteResult.deletedCount} rates for meal plan ${id}`)
    } else {
      throw new BadRequestError('MEAL_PLAN_HAS_RATES')
    }
  }

  const mealPlan = await MealPlan.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
  if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('MEAL_PLAN_DELETED'),
    data: { deletedRates: rateCount }
  })
})

export const setBaseMealPlan = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  await MealPlan.updateMany({ hotel: hotelId, partner: partnerId }, { isBaseMealPlan: false })

  const mealPlan = await MealPlan.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    { isBaseMealPlan: true, priceAdjustment: 0 },
    { new: true }
  )

  if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

  logger.info(`Base meal plan set: ${mealPlan.code} for hotel ${hotelId}`)

  res.json({
    success: true,
    message: req.t('BASE_MEAL_PLAN_SET'),
    data: mealPlan
  })
})

export const updateMealPlanPriceAdjustment = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, id } = req.params
  const { adjustment } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (adjustment === undefined) throw new BadRequestError('ADJUSTMENT_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const mealPlan = await MealPlan.findOneAndUpdate(
    { _id: id, hotel: hotelId, partner: partnerId },
    { priceAdjustment: adjustment },
    { new: true, runValidators: true }
  )

  if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

  res.json({
    success: true,
    message: req.t('PRICE_ADJUSTMENT_UPDATED'),
    data: mealPlan
  })
})

export const initStandardMealPlans = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

  const standardPlans = MealPlan.getStandardPlans()
  const created = []

  for (const plan of standardPlans) {
    const existing = await MealPlan.findOne({
      partner: partnerId,
      hotel: null,
      code: plan.code,
      isStandard: true
    })

    if (!existing) {
      const newPlan = await MealPlan.create({
        ...plan,
        partner: partnerId,
        hotel: null
      })
      created.push(newPlan)
    }
  }

  res.json({
    success: true,
    message: req.t('STANDARD_PLANS_INITIALIZED'),
    data: { created: created.length }
  })
})

export const addStandardMealPlansToHotel = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { codes } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(codes) || codes.length === 0) throw new BadRequestError('CODES_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const standardPlans = MealPlan.getStandardPlans()
  const created = []
  const skipped = []

  for (const code of codes) {
    const template = standardPlans.find(p => p.code === code.toUpperCase())
    if (!template) {
      skipped.push({ code, reason: 'NOT_FOUND' })
      continue
    }

    const existing = await MealPlan.findOne({
      partner: partnerId,
      hotel: hotelId,
      code: code.toUpperCase()
    })

    if (existing) {
      skipped.push({ code, reason: 'ALREADY_EXISTS' })
      continue
    }

    const newPlan = await MealPlan.create({
      ...template,
      partner: partnerId,
      hotel: hotelId,
      isStandard: false
    })
    created.push(newPlan)
  }

  logger.info(`Added ${created.length} standard meal plans to hotel ${hotelId}`)

  res.status(201).json({
    success: true,
    message: req.t('MEAL_PLANS_ADDED'),
    data: {
      created: created.length,
      skipped: skipped.length,
      plans: created
    }
  })
})
