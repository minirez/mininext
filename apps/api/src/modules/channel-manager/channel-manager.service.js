import { asyncHandler } from '#helpers'
import { BadRequestError, NotFoundError } from '#core/errors.js'
import { sendSuccess, sendCreated, parsePagination, paginatedQuery } from '#services/helpers.js'
import logger from '#core/logger.js'
import ChannelConnection from './channelConnection.model.js'
import ChannelLog from './channelLog.model.js'
import * as reselivaClient from './reseliva.client.js'
import { processReservations } from './reservationSync.service.js'
import { fullSync } from './inventorySync.service.js'
import { getSchedulerStatus as getSchedulerInfo } from './channelScheduler.js'

/**
 * Get connection for a hotel
 */
export const getConnection = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner

  const connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId
  })

  sendSuccess(res, { connection: connection || null })
})

/**
 * Create or update connection
 */
export const createOrUpdateConnection = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner
  const { credentials, integrationType, settings } = req.body

  if (
    !credentials?.userId ||
    !credentials?.password ||
    !credentials?.propertyId ||
    !credentials?.serviceUrl
  ) {
    throw new BadRequestError('All credential fields are required')
  }

  let connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId,
    provider: 'reseliva'
  })

  if (connection) {
    // Update existing
    connection.credentials = credentials
    if (integrationType) connection.integrationType = integrationType
    if (settings) connection.settings = { ...connection.settings.toObject(), ...settings }
    connection._auditContext = { actor: req.user._id }
    await connection.save()
  } else {
    // Create new
    connection = new ChannelConnection({
      partner: partnerId,
      hotel: hotelId,
      provider: 'reseliva',
      credentials,
      integrationType: integrationType || 'one_way',
      settings: settings || {}
    })
    connection._auditContext = { actor: req.user._id }
    await connection.save()
  }

  sendSuccess(res, { connection })
})

/**
 * Test connection
 */
export const testConnection = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner

  const connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId
  })

  if (!connection) {
    throw new NotFoundError('Connection not found')
  }

  try {
    const products = await reselivaClient.fetchProductList(connection)

    // Update status
    connection.status = 'active'
    connection.lastError = null
    await connection.save()

    sendSuccess(res, {
      success: true,
      message: 'Connection successful',
      products
    })
  } catch (error) {
    connection.status = 'error'
    connection.lastError = {
      message: error.message,
      occurredAt: new Date(),
      context: 'connection_test'
    }
    await connection.save()

    sendSuccess(res, {
      success: false,
      message: `Connection failed: ${error.message}`
    })
  }
})

/**
 * Delete connection
 */
export const deleteConnection = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner

  const connection = await ChannelConnection.findOneAndDelete({
    partner: partnerId,
    hotel: hotelId
  })

  if (!connection) {
    throw new NotFoundError('Connection not found')
  }

  sendSuccess(res, { message: 'Connection deleted' })
})

/**
 * Fetch products from Reseliva (for mapping UI)
 */
export const fetchProducts = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner

  const connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId
  })

  if (!connection) {
    throw new NotFoundError('Connection not found')
  }

  const products = await reselivaClient.fetchProductList(connection)
  sendSuccess(res, { products })
})

/**
 * Save room/rate mappings
 */
export const saveRoomMappings = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner
  const { mappings } = req.body

  if (!Array.isArray(mappings)) {
    throw new BadRequestError('Mappings must be an array')
  }

  const connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId
  })

  if (!connection) {
    throw new NotFoundError('Connection not found')
  }

  connection.roomMappings = mappings
  connection._auditContext = { actor: req.user._id }
  await connection.save()

  sendSuccess(res, { connection })
})

/**
 * Fetch OTA list
 */
export const fetchOTAs = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner

  const connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId
  })

  if (!connection) {
    throw new NotFoundError('Connection not found')
  }

  const otaList = await reselivaClient.fetchOtaList(connection)

  // Save connected OTAs to connection
  connection.connectedOTAs = [
    ...otaList.connected.map(name => ({ name, status: 'connected' })),
    ...otaList.notConnected.map(name => ({ name, status: 'not_connected' }))
  ]
  await connection.save()

  sendSuccess(res, { otaList })
})

/**
 * Fetch OTA product list
 */
export const fetchOTAProducts = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner

  const connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId
  })

  if (!connection) {
    throw new NotFoundError('Connection not found')
  }

  const otaProducts = await reselivaClient.fetchOtaProductList(connection)
  sendSuccess(res, { otaProducts })
})

/**
 * Get logs
 */
export const getLogs = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner
  const { type, status } = req.query
  const { page, limit } = parsePagination(req.query)

  const filter = {
    partner: partnerId,
    hotel: hotelId
  }
  if (type) filter.type = type
  if (status) filter.status = status

  const result = await paginatedQuery(ChannelLog, filter, {
    page,
    limit,
    sort: { createdAt: -1 }
  })

  sendSuccess(res, result)
})

/**
 * Get log detail
 */
export const getLogDetail = asyncHandler(async (req, res) => {
  const { logId } = req.params

  const log = await ChannelLog.findById(logId)
  if (!log) {
    throw new NotFoundError('Log not found')
  }

  sendSuccess(res, { log })
})

/**
 * Get sync status
 */
export const getSyncStatus = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner

  const connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId
  })

  if (!connection) {
    sendSuccess(res, { status: null })
    return
  }

  sendSuccess(res, {
    status: {
      connectionStatus: connection.status,
      integrationType: connection.integrationType,
      lastSync: connection.lastSync,
      lastError: connection.lastError,
      mappingsCount: connection.roomMappings.length,
      connectedOTAs: connection.connectedOTAs.filter(o => o.status === 'connected').length
    }
  })
})

/**
 * Trigger manual reservation sync
 */
export const triggerManualSync = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner

  const connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId,
    status: { $ne: 'inactive' }
  })

  if (!connection) {
    throw new NotFoundError('Active connection not found')
  }

  const results = await processReservations(connection)
  sendSuccess(res, { results })
})

/**
 * Trigger full inventory sync
 */
export const triggerInventorySync = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const partnerId = req.pmsPartner || req.user.partner

  const connection = await ChannelConnection.findOne({
    partner: partnerId,
    hotel: hotelId,
    status: { $ne: 'inactive' },
    integrationType: 'two_way'
  })

  if (!connection) {
    throw new NotFoundError('Active two-way connection not found')
  }

  // Simple availability function based on room count
  // In production, this would check actual room inventory
  const getAvailability = async (hotel, roomTypeId, date) => {
    // Placeholder: return 0 (implement with actual inventory logic)
    return 0
  }

  const results = await fullSync(connection, getAvailability)
  sendSuccess(res, { results })
})

/**
 * Handle reservation push webhook
 * Called by Reseliva when new/modified/cancelled reservation exists
 * No auth required - connection matched by hotel_id query param
 */
export const handleReservationPush = asyncHandler(async (req, res) => {
  const hotelPropertyId = req.query.hotel_id

  if (!hotelPropertyId) {
    throw new BadRequestError('hotel_id query parameter required')
  }

  // Find connection by decrypting propertyId
  const connections = await ChannelConnection.find({
    status: 'active',
    provider: 'reseliva'
  })

  let matchedConnection = null
  for (const conn of connections) {
    const creds = conn.getDecryptedCredentials()
    if (creds.propertyId === String(hotelPropertyId)) {
      matchedConnection = conn
      break
    }
  }

  if (!matchedConnection) {
    logger.warn(`Reservation push: no connection found for hotel_id ${hotelPropertyId}`)
    return res.status(200).json({ success: true, message: 'Acknowledged' })
  }

  // Log the push notification
  await ChannelLog.log({
    connection: matchedConnection,
    type: 'reservation_fetch',
    direction: 'inbound',
    status: 'success',
    request: JSON.stringify({ hotel_id: hotelPropertyId, method: 'push' }),
    metadata: {}
  })

  // Process reservations
  try {
    const results = await processReservations(matchedConnection)
    res.status(200).json({ success: true, results })
  } catch (err) {
    logger.error('Push reservation sync failed:', err.message)
    res.status(200).json({ success: true, message: 'Acknowledged with errors' })
  }
})

/**
 * Handle error report webhook
 * Called by Reseliva when OTA returns errors for inventory updates
 */
export const handleErrorReport = asyncHandler(async (req, res) => {
  const hotelPropertyId = req.query.hotel_id
  const errors = req.body // Array of error objects

  if (!hotelPropertyId) {
    throw new BadRequestError('hotel_id query parameter required')
  }

  // Find connection
  const connections = await ChannelConnection.find({
    status: { $ne: 'inactive' },
    provider: 'reseliva'
  })

  let matchedConnection = null
  for (const conn of connections) {
    const creds = conn.getDecryptedCredentials()
    if (creds.propertyId === String(hotelPropertyId)) {
      matchedConnection = conn
      break
    }
  }

  if (!matchedConnection) {
    return res.status(200).json({ success: true, message: 'Acknowledged' })
  }

  // Log the error report
  await ChannelLog.log({
    connection: matchedConnection,
    type: 'error_report',
    direction: 'inbound',
    status: 'error',
    request: JSON.stringify(errors),
    errorMessage: Array.isArray(errors)
      ? errors.map(e => `${e.ch}: ${e.err}`).join(', ')
      : 'Unknown error',
    metadata: {
      rqid: Array.isArray(errors) && errors[0]?.rqid
    }
  })

  res.status(200).json({ success: true, message: 'Error report received' })
})

/**
 * Get scheduler status
 */
export const getSchedulerStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, { scheduler: getSchedulerInfo() })
})
