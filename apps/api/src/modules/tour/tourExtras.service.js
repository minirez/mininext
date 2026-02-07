import { asyncHandler, escapeRegex } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import TourExtra from './tourExtra.model.js'

const requirePartnerId = req => {
  const partnerId = req.partnerId
  if (!partnerId) throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  return partnerId
}

// ==================== EXTRAS ====================

export const getExtras = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { isActive, category, search } = req.query

  const filter = { partner: partnerId }
  if (isActive != null) filter.isActive = String(isActive) === 'true'
  if (category) filter.category = category
  if (search) {
    const escaped = escapeRegex(search)
    filter.$or = [
      { code: { $regex: escaped, $options: 'i' } },
      { 'name.tr': { $regex: escaped, $options: 'i' } },
      { 'name.en': { $regex: escaped, $options: 'i' } }
    ]
  }

  const items = await TourExtra.find(filter).sort({ createdAt: -1 }).lean()
  const decorated = items.map(e => ({
    ...e,
    // Backwards-compatible fields for admin UI
    status: e.isActive ? 'active' : 'inactive',
    defaultPrice: e.price?.value ?? 0,
    currency: e.price?.currency || 'TRY',
    applicableTours: [] // kept for legacy UI
  }))
  res.json({ success: true, data: decorated })
})

export const getExtra = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const item = await TourExtra.findOne({ _id: req.params.id, partner: partnerId }).lean()
  if (!item) throw new NotFoundError('EXTRA_NOT_FOUND')
  res.json({
    success: true,
    data: {
      ...item,
      status: item.isActive ? 'active' : 'inactive',
      defaultPrice: item.price?.value ?? 0,
      currency: item.price?.currency || 'TRY',
      applicableTours: []
    }
  })
})

export const createExtra = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const body = req.body || {}
  if (!body.code) throw new BadRequestError('REQUIRED_CODE')
  if (!body.name?.tr) throw new BadRequestError('REQUIRED_NAME_TR')
  const legacyPriceValue = body.defaultPrice != null ? Number(body.defaultPrice) : null
  const legacyCurrency = body.currency ? String(body.currency) : null

  const price =
    body.price?.value != null && body.price?.currency
      ? body.price
      : legacyPriceValue != null && legacyCurrency
        ? { value: legacyPriceValue, currency: legacyCurrency }
        : null

  if (!price?.value || !price?.currency) throw new BadRequestError('REQUIRED_PRICE')

  const extra = await TourExtra.create({
    ...body,
    partner: partnerId,
    isActive:
      body.isActive != null
        ? Boolean(body.isActive)
        : body.status
          ? body.status === 'active'
          : true,
    price
  })
  const decorated = {
    ...(extra.toObject ? extra.toObject() : extra),
    status: extra.isActive ? 'active' : 'inactive',
    defaultPrice: extra.price?.value ?? 0,
    currency: extra.price?.currency || 'TRY',
    applicableTours: []
  }
  res.status(201).json({ success: true, data: decorated })
})

export const updateExtra = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const extra = await TourExtra.findOne({ _id: req.params.id, partner: partnerId })
  if (!extra) throw new NotFoundError('EXTRA_NOT_FOUND')

  const body = req.body || {}

  // Legacy compatibility: defaultPrice/currency/status -> price/isActive
  if (body.defaultPrice != null || body.currency) {
    const nextValue =
      body.defaultPrice != null ? Number(body.defaultPrice) : Number(extra.price?.value || 0)
    const nextCurrency = body.currency ? String(body.currency) : extra.price?.currency || 'TRY'
    extra.price = { value: nextValue, currency: nextCurrency }
  } else if (body.price) {
    extra.price = body.price
  }

  if (body.status) extra.isActive = body.status === 'active'
  if (body.isActive != null) extra.isActive = Boolean(body.isActive)

  Object.keys(body).forEach(k => {
    if (['defaultPrice', 'currency', 'status', 'isActive', 'price'].includes(k)) return
    extra[k] = body[k]
  })

  await extra.save()
  const decorated = {
    ...(extra.toObject ? extra.toObject() : extra),
    status: extra.isActive ? 'active' : 'inactive',
    defaultPrice: extra.price?.value ?? 0,
    currency: extra.price?.currency || 'TRY',
    applicableTours: []
  }
  res.json({ success: true, data: decorated })
})

export const deleteExtra = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const extra = await TourExtra.findOne({ _id: req.params.id, partner: partnerId })
  if (!extra) throw new NotFoundError('EXTRA_NOT_FOUND')

  await extra.deleteOne()
  res.json({ success: true })
})
