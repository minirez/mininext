/**
 * @module modules/pms-guest/kbsClient
 * @description KBS (Kimlik Bildirim Sistemi) SOAP Client.
 * Handles communication with EGM and Jandarma web services for guest registration.
 */

import soap from 'soap'
import PmsSettings from '#modules/pms-settings/settings.model.js'
import logger from '#core/logger.js'
import { NotFoundError, BadRequestError, ServiceUnavailableError } from '#core/errors.js'

// KBS Error Codes
export const KBS_ERROR_CODES = {
  SUCCESS: '0',
  INVALID_CREDENTIALS: '1',
  INVALID_FACILITY: '2',
  DUPLICATE_RECORD: '3',
  RECORD_NOT_FOUND: '4',
  INVALID_DATA: '5',
  CONNECTION_ERROR: '99'
}

// KBS Response Status
export const KBS_RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error'
}

/**
 * Create SOAP client for KBS
 * @param {string} wsdlUrl - WSDL URL
 * @returns {Promise<object>} SOAP client
 */
const createClient = async wsdlUrl => {
  try {
    const client = await soap.createClientAsync(wsdlUrl, {
      wsdl_options: {
        timeout: 30000
      }
    })
    return client
  } catch (error) {
    logger.error('[KBS Client] Failed to create SOAP client:', error.message)
    throw new ServiceUnavailableError('KBS_CONNECTION_FAILED', {
      wsdlUrl,
      originalError: error.message
    })
  }
}

/**
 * Get KBS settings for hotel
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<object>} KBS settings
 */
const getKbsSettings = async hotelId => {
  const settings = await PmsSettings.findOne({ hotel: hotelId })
  if (!settings || !settings.kbs) {
    throw new NotFoundError('KBS_SETTINGS_NOT_FOUND', { hotelId })
  }
  if (!settings.kbs.enabled) {
    throw new BadRequestError('KBS_INTEGRATION_DISABLED', { hotelId })
  }
  return settings.kbs
}

/**
 * Get WSDL URL based on KBS type
 * @param {object} kbsSettings - KBS settings
 * @returns {string} WSDL URL
 */
const getWsdlUrl = kbsSettings => {
  if (kbsSettings.type === 'jandarma') {
    return (
      kbsSettings.endpoints?.jandarmaWsdl ||
      'https://kbs.jandarma.gov.tr/KBS_Tesis_2/services/KBS?wsdl'
    )
  }
  return (
    kbsSettings.endpoints?.egmWsdl ||
    'https://kbs.egm.gov.tr/kbstesis/services/KbsTesisService?wsdl'
  )
}

/**
 * Build authentication header
 * @param {object} kbsSettings - KBS settings
 * @returns {object} Auth parameters
 */
const buildAuthParams = kbsSettings => {
  return {
    tesisKodu: kbsSettings.facilityCode,
    kullaniciAdi: kbsSettings.username,
    sifre: kbsSettings.password,
    personelTcKimlikNo: kbsSettings.personnelIdNumber || kbsSettings.username
  }
}

/**
 * Format date for KBS (DD.MM.YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
const formatDate = date => {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Format datetime for KBS (DD.MM.YYYY HH:mm)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime
 */
const formatDateTime = date => {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

/**
 * Check if guest is Turkish citizen
 * @param {object} guest - Guest object
 * @returns {boolean}
 */
const isTurkishCitizen = guest => {
  const nationality = (guest.nationality || '').toLowerCase()
  return (
    nationality === 'tr' ||
    nationality === 'tc' ||
    nationality === 'türkiye' ||
    nationality === 'turkey'
  )
}

/**
 * Build guest data for Turkish citizen check-in
 * @param {object} guest - Guest object
 * @param {object} stay - Stay object
 * @param {object} room - Room object
 * @returns {object} Guest data for KBS
 */
const buildTurkishGuestData = (guest, stay, room) => {
  return {
    tcKimlikNo: guest.idNumber,
    odaNo: room?.roomNumber || '',
    girisTarihi: formatDateTime(stay.checkInDate),
    cikisTarihi: formatDateTime(stay.checkOutDate)
  }
}

/**
 * Build guest data for foreign guest check-in
 * @param {object} guest - Guest object
 * @param {object} stay - Stay object
 * @param {object} room - Room object
 * @returns {object} Guest data for KBS
 */
const buildForeignGuestData = (guest, stay, room) => {
  return {
    pasaportNo: guest.idNumber,
    adi: guest.firstName,
    soyadi: guest.lastName,
    babaAdi: guest.fatherName || '',
    anaAdi: guest.motherName || '',
    dogumTarihi: guest.dateOfBirth ? formatDate(guest.dateOfBirth) : '',
    dogumYeri: guest.birthPlace || '',
    uyruk: guest.nationality || '',
    odaNo: room?.roomNumber || '',
    girisTarihi: formatDateTime(stay.checkInDate),
    cikisTarihi: formatDateTime(stay.checkOutDate)
  }
}

/**
 * Parse KBS response
 * @param {object} result - SOAP response
 * @returns {object} Parsed response
 */
const parseResponse = result => {
  const sonucKodu =
    result?.sonucKodu || result?.return?.sonucKodu || result?.result?.sonucKodu || '99'
  const mesaj = result?.mesaj || result?.return?.mesaj || result?.result?.mesaj || 'Bilinmeyen hata'

  return {
    status: sonucKodu === '0' ? KBS_RESPONSE_STATUS.SUCCESS : KBS_RESPONSE_STATUS.ERROR,
    code: sonucKodu,
    message: mesaj,
    raw: result
  }
}

// ==========================================
// PUBLIC FUNCTIONS
// ==========================================

/**
 * Test KBS connection
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<object>} Connection status
 */
export const testConnection = async hotelId => {
  try {
    const kbsSettings = await getKbsSettings(hotelId)
    const wsdlUrl = getWsdlUrl(kbsSettings)

    // Try to create client and describe services
    const client = await createClient(wsdlUrl)
    const description = client.describe()

    // Update last connection status
    await PmsSettings.findOneAndUpdate(
      { hotel: hotelId },
      {
        'kbs.lastConnection': {
          status: 'success',
          timestamp: new Date(),
          message: 'Bağlantı başarılı'
        }
      }
    )

    return {
      success: true,
      message: 'KBS bağlantısı başarılı',
      services: Object.keys(description),
      wsdlUrl
    }
  } catch (error) {
    // Update last connection status
    await PmsSettings.findOneAndUpdate(
      { hotel: hotelId },
      {
        'kbs.lastConnection': {
          status: 'error',
          timestamp: new Date(),
          message: error.message
        }
      }
    )

    return {
      success: false,
      message: error.message,
      error: error.message
    }
  }
}

/**
 * Send Turkish citizen check-in notification
 */
export const sendTurkishCheckIn = async (hotelId, guest, stay, room) => {
  try {
    const kbsSettings = await getKbsSettings(hotelId)
    const wsdlUrl = getWsdlUrl(kbsSettings)
    const client = await createClient(wsdlUrl)

    const authParams = buildAuthParams(kbsSettings)
    const guestData = buildTurkishGuestData(guest, stay, room)

    const params = {
      ...authParams,
      ...guestData
    }

    const [result] = await client.MusteriKimlikNoGirisAsync(params)

    return parseResponse(result)
  } catch (error) {
    logger.error('[KBS Client] Turkish check-in error:', error)
    return {
      status: KBS_RESPONSE_STATUS.ERROR,
      code: KBS_ERROR_CODES.CONNECTION_ERROR,
      message: error.message
    }
  }
}

/**
 * Send Turkish citizen check-out notification
 */
export const sendTurkishCheckOut = async (hotelId, guest, stay, room) => {
  try {
    const kbsSettings = await getKbsSettings(hotelId)
    const wsdlUrl = getWsdlUrl(kbsSettings)
    const client = await createClient(wsdlUrl)

    const authParams = buildAuthParams(kbsSettings)
    const guestData = buildTurkishGuestData(guest, stay, room)

    const params = {
      ...authParams,
      ...guestData
    }

    const [result] = await client.MusteriKimlikNoCikisAsync(params)

    return parseResponse(result)
  } catch (error) {
    logger.error('[KBS Client] Turkish check-out error:', error)
    return {
      status: KBS_RESPONSE_STATUS.ERROR,
      code: KBS_ERROR_CODES.CONNECTION_ERROR,
      message: error.message
    }
  }
}

/**
 * Send Turkish citizen room change notification
 */
export const sendTurkishRoomChange = async (hotelId, guest, stay, oldRoom, newRoom) => {
  try {
    const kbsSettings = await getKbsSettings(hotelId)
    const wsdlUrl = getWsdlUrl(kbsSettings)
    const client = await createClient(wsdlUrl)

    const authParams = buildAuthParams(kbsSettings)

    const params = {
      ...authParams,
      tcKimlikNo: guest.idNumber,
      eskiOdaNo: oldRoom?.roomNumber || '',
      yeniOdaNo: newRoom?.roomNumber || ''
    }

    const [result] = await client.MusteriKimlikNoGuncelleAsync(params)

    return parseResponse(result)
  } catch (error) {
    logger.error('[KBS Client] Turkish room change error:', error)
    return {
      status: KBS_RESPONSE_STATUS.ERROR,
      code: KBS_ERROR_CODES.CONNECTION_ERROR,
      message: error.message
    }
  }
}

/**
 * Send foreign guest check-in notification
 */
export const sendForeignCheckIn = async (hotelId, guest, stay, room) => {
  try {
    const kbsSettings = await getKbsSettings(hotelId)
    const wsdlUrl = getWsdlUrl(kbsSettings)
    const client = await createClient(wsdlUrl)

    const authParams = buildAuthParams(kbsSettings)
    const guestData = buildForeignGuestData(guest, stay, room)

    const params = {
      ...authParams,
      ...guestData
    }

    const [result] = await client.MusteriYabanciGirisAsync(params)

    return parseResponse(result)
  } catch (error) {
    logger.error('[KBS Client] Foreign check-in error:', error)
    return {
      status: KBS_RESPONSE_STATUS.ERROR,
      code: KBS_ERROR_CODES.CONNECTION_ERROR,
      message: error.message
    }
  }
}

/**
 * Send foreign guest check-out notification
 */
export const sendForeignCheckOut = async (hotelId, guest, stay, room) => {
  try {
    const kbsSettings = await getKbsSettings(hotelId)
    const wsdlUrl = getWsdlUrl(kbsSettings)
    const client = await createClient(wsdlUrl)

    const authParams = buildAuthParams(kbsSettings)
    const guestData = buildForeignGuestData(guest, stay, room)

    const params = {
      ...authParams,
      ...guestData
    }

    const [result] = await client.MusteriYabanciCikisAsync(params)

    return parseResponse(result)
  } catch (error) {
    logger.error('[KBS Client] Foreign check-out error:', error)
    return {
      status: KBS_RESPONSE_STATUS.ERROR,
      code: KBS_ERROR_CODES.CONNECTION_ERROR,
      message: error.message
    }
  }
}

/**
 * Send foreign guest room change notification
 */
export const sendForeignRoomChange = async (hotelId, guest, stay, oldRoom, newRoom) => {
  try {
    const kbsSettings = await getKbsSettings(hotelId)
    const wsdlUrl = getWsdlUrl(kbsSettings)
    const client = await createClient(wsdlUrl)

    const authParams = buildAuthParams(kbsSettings)

    const params = {
      ...authParams,
      pasaportNo: guest.idNumber,
      adi: guest.firstName,
      soyadi: guest.lastName,
      uyruk: guest.nationality,
      eskiOdaNo: oldRoom?.roomNumber || '',
      yeniOdaNo: newRoom?.roomNumber || ''
    }

    const [result] = await client.MusteriYabanciGuncelleAsync(params)

    return parseResponse(result)
  } catch (error) {
    logger.error('[KBS Client] Foreign room change error:', error)
    return {
      status: KBS_RESPONSE_STATUS.ERROR,
      code: KBS_ERROR_CODES.CONNECTION_ERROR,
      message: error.message
    }
  }
}

/**
 * Send guest notification (auto-detect Turkish/Foreign)
 */
export const sendGuestNotification = async (hotelId, action, guest, stay, room, oldRoom = null) => {
  const isTurkish = isTurkishCitizen(guest)

  switch (action) {
    case 'checkin':
      return isTurkish
        ? sendTurkishCheckIn(hotelId, guest, stay, room)
        : sendForeignCheckIn(hotelId, guest, stay, room)

    case 'checkout':
      return isTurkish
        ? sendTurkishCheckOut(hotelId, guest, stay, room)
        : sendForeignCheckOut(hotelId, guest, stay, room)

    case 'roomchange':
      return isTurkish
        ? sendTurkishRoomChange(hotelId, guest, stay, oldRoom, room)
        : sendForeignRoomChange(hotelId, guest, stay, oldRoom, room)

    default:
      return {
        status: KBS_RESPONSE_STATUS.ERROR,
        code: KBS_ERROR_CODES.INVALID_DATA,
        message: `Geçersiz işlem: ${action}`
      }
  }
}

/**
 * Send notifications for all guests in a stay
 */
export const sendStayNotifications = async (hotelId, action, stay, room) => {
  const guests = stay.guests || []
  const results = {
    total: guests.length,
    success: 0,
    failed: 0,
    details: []
  }

  for (const guest of guests) {
    try {
      const result = await sendGuestNotification(hotelId, action, guest, stay, room)

      if (result.status === KBS_RESPONSE_STATUS.SUCCESS) {
        results.success++
      } else {
        results.failed++
      }

      results.details.push({
        guestName: `${guest.firstName} ${guest.lastName}`,
        ...result
      })
    } catch (error) {
      results.failed++
      results.details.push({
        guestName: `${guest.firstName} ${guest.lastName}`,
        status: KBS_RESPONSE_STATUS.ERROR,
        message: error.message
      })
    }
  }

  return results
}

/**
 * Check if current time is within night hours
 */
const isNightTime = (nightStartHour, nightEndHour) => {
  const now = new Date()
  const currentHour = now.getHours()

  if (nightStartHour > nightEndHour) {
    return currentHour >= nightStartHour || currentHour < nightEndHour
  }

  return currentHour >= nightStartHour && currentHour < nightEndHour
}

/**
 * Schedule automatic KBS notification after check-in
 */
export const scheduleAutoSend = async (hotelId, stay, room) => {
  try {
    const settings = await PmsSettings.findOne({ hotel: hotelId })

    if (!settings?.kbs?.enabled || !settings?.kbs?.autoSend?.enabled) {
      return
    }

    const { autoSend } = settings.kbs
    const delayMs = (autoSend.delayMinutes || 5) * 60 * 1000

    if (autoSend.pauseAtNight) {
      const nightStart = autoSend.nightStartHour ?? 23
      const nightEnd = autoSend.nightEndHour ?? 7

      if (isNightTime(nightStart, nightEnd)) {
        return
      }
    }

    setTimeout(async () => {
      try {
        const result = await sendStayNotifications(hotelId, 'checkin', stay, room)

        const Guest = (await import('./guest.model.js')).default
        const { KBS_STATUS } = await import('./guest.model.js')

        for (const detail of result.details) {
          if (detail.status === KBS_RESPONSE_STATUS.SUCCESS) {
            const guest = stay.guests.find(g => `${g.firstName} ${g.lastName}` === detail.guestName)
            if (guest?.idNumber) {
              await Guest.findOneAndUpdate(
                { hotel: hotelId, idNumber: guest.idNumber },
                {
                  $set: {
                    kbsStatus: KBS_STATUS.SENT,
                    kbsSentAt: new Date()
                  }
                }
              )
            }
          }
        }
      } catch (error) {
        logger.error('[KBS AutoSend] Error sending notifications:', error)
      }
    }, delayMs)
  } catch (error) {
    logger.error('[KBS AutoSend] Error scheduling:', error)
  }
}

export default {
  KBS_ERROR_CODES,
  KBS_RESPONSE_STATUS,
  testConnection,
  sendTurkishCheckIn,
  sendTurkishCheckOut,
  sendTurkishRoomChange,
  sendForeignCheckIn,
  sendForeignCheckOut,
  sendForeignRoomChange,
  sendGuestNotification,
  sendStayNotifications,
  scheduleAutoSend
}
