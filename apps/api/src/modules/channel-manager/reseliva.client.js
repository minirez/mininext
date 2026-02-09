import axios from 'axios'
import logger from '#core/logger.js'
import ChannelLog from './channelLog.model.js'
import {
  buildProductListRequest,
  buildReservationListRequest,
  buildReservationConfirmRequest,
  buildInventoryUpdateRequest,
  buildOtaListRequest,
  buildOtaProductListRequest
} from './reseliva.xmlBuilder.js'
import {
  parseProductList,
  parseReservationList,
  parseConfirmResponse,
  parseInventoryResponse,
  parseOtaList,
  parseOtaProductList
} from './reseliva.xmlParser.js'

const TIMEOUT = 30000 // 30 seconds

/**
 * Make HTTP request to Reseliva API
 * @param {Object} connection - ChannelConnection document
 * @param {string} endpoint - API endpoint (e.g., 'product_list')
 * @param {string} xmlBody - XML request body
 * @param {string} logType - Type for channel log
 * @returns {string} XML response
 */
async function makeRequest(connection, endpoint, xmlBody, logType) {
  const creds = connection.getDecryptedCredentials()
  const url = `${creds.serviceUrl}/${endpoint}`
  const startTime = Date.now()

  try {
    const response = await axios.post(url, xmlBody, {
      headers: { 'Content-Type': 'application/xml' },
      timeout: TIMEOUT,
      responseType: 'text'
    })

    const duration = Date.now() - startTime

    // Log success
    await ChannelLog.log({
      connection,
      type: logType,
      direction: 'outbound',
      status: 'success',
      request: xmlBody,
      response: response.data,
      metadata: { duration }
    })

    return response.data
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error.response?.data || error.message

    // Log error
    await ChannelLog.log({
      connection,
      type: logType,
      direction: 'outbound',
      status: 'error',
      request: xmlBody,
      response: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
      errorMessage: error.message,
      metadata: { duration }
    })

    logger.error(`Reseliva API error [${endpoint}]:`, error.message)
    throw error
  }
}

/**
 * Service 1: Fetch Product List
 */
export async function fetchProductList(connection) {
  const creds = connection.getDecryptedCredentials()
  const xml = buildProductListRequest(creds)
  const response = await makeRequest(connection, 'product_list', xml, 'product_sync')
  const result = await parseProductList(response)

  // Update last sync time
  connection.lastSync.products = new Date()
  await connection.save()

  return result
}

/**
 * Service 2: Fetch Reservations
 */
export async function fetchReservations(connection) {
  const creds = connection.getDecryptedCredentials()
  const includeBreakdown = connection.settings.includeBreakdown
  const xml = buildReservationListRequest(creds, includeBreakdown)
  const response = await makeRequest(connection, 'reservation_list', xml, 'reservation_fetch')
  return parseReservationList(response)
}

/**
 * Service 3: Confirm Reservations
 * @param {Array<{reselivaId, pmsId, changetoken}>} reservations
 */
export async function confirmReservations(connection, reservations) {
  const creds = connection.getDecryptedCredentials()
  const xml = buildReservationConfirmRequest(creds, reservations)
  const response = await makeRequest(connection, 'reservation_confirm', xml, 'reservation_confirm')
  return parseConfirmResponse(response)
}

/**
 * Service 5: Update Inventory
 * @param {Array} updates - Inventory update data
 */
export async function updateInventory(connection, updates) {
  const creds = connection.getDecryptedCredentials()
  const xml = buildInventoryUpdateRequest(creds, updates)
  const response = await makeRequest(connection, 'inventory', xml, 'inventory_update')
  return parseInventoryResponse(response)
}

/**
 * Service 7: Fetch OTA List
 */
export async function fetchOtaList(connection) {
  const creds = connection.getDecryptedCredentials()
  const xml = buildOtaListRequest(creds)
  const response = await makeRequest(connection, 'ota_list', xml, 'ota_sync')
  return parseOtaList(response)
}

/**
 * Service 8: Fetch OTA Product List
 */
export async function fetchOtaProductList(connection) {
  const creds = connection.getDecryptedCredentials()
  const xml = buildOtaProductListRequest(creds)
  const response = await makeRequest(connection, 'ota_product_list', xml, 'ota_sync')
  return parseOtaProductList(response)
}

export default {
  fetchProductList,
  fetchReservations,
  confirmReservations,
  updateInventory,
  fetchOtaList,
  fetchOtaProductList
}
