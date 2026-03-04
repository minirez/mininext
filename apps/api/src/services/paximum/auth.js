/**
 * Paximum Authentication Module
 *
 * Handles token management and authentication with Paximum API
 */

import axios from 'axios'
import dayjs from 'dayjs'
import PlatformSettings from '../../modules/platform-settings/platformSettings.model.js'
import logger from '../../core/logger.js'

// API paths
export const AUTH_SERVICE = '/api/authenticationservice'

/**
 * Get or refresh Paximum API token
 * Token is cached in PlatformSettings and refreshed when expired
 */
export async function getToken() {
  const settings = await PlatformSettings.getSettings()
  const creds = settings.getPaximumCredentials()

  if (!creds) {
    throw new Error('Paximum entegrasyonu yapılandırılmamış')
  }

  // Check if we have a valid cached token
  if (creds.token && creds.tokenExpiresOn) {
    const expiresAt = dayjs(creds.tokenExpiresOn)
    // Add 5 minute buffer before expiry
    if (expiresAt.isAfter(dayjs().add(5, 'minute'))) {
      return creds.token
    }
  }

  // Token expired or not available - get a new one
  logger.info('Paximum: Refreshing authentication token')

  if (!creds.agency || !creds.user || !creds.password) {
    logger.error('Paximum: Decrypted credentials are empty – ENCRYPTION_KEY may have changed', {
      hasAgency: !!creds.agency,
      hasUser: !!creds.user,
      hasPassword: !!creds.password
    })
    throw new Error(
      'Paximum kimlik bilgileri çözülemedi (agency/user/password boş). ' +
        "ENCRYPTION_KEY değişmiş olabilir – lütfen Platform Ayarları'ndan Paximum bilgilerini yeniden kaydedin."
    )
  }

  const loginUrl = `${creds.endpoint}${AUTH_SERVICE}/login`

  try {
    const response = await axios.post(
      loginUrl,
      { Agency: creds.agency, User: creds.user, Password: creds.password },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
        validateStatus: () => true
      }
    )

    const rawBody = typeof response.data === 'string'
      ? response.data.slice(0, 2000)
      : JSON.stringify(response.data).slice(0, 2000)

    logger.info('Paximum: Login raw response', {
      url: loginUrl,
      httpStatus: response.status,
      contentType: response.headers?.['content-type'],
      body: rawBody
    })

    if (response.status < 200 || response.status >= 300) {
      const msg = response.data?.header?.messages?.[0]?.message || `HTTP ${response.status}`
      throw new Error(`Paximum HTTP ${response.status}: ${msg}`)
    }

    if (!response.data?.body?.token) {
      const paxMsg = response.data?.header?.messages?.[0]?.message || 'no token in body'
      throw new Error(`Paximum login yanıtında token bulunamadı: ${paxMsg} | raw: ${rawBody}`)
    }

    const { token, expiresOn } = response.data.body
    await settings.updatePaximumToken(token, new Date(expiresOn))

    logger.info('Paximum: Token refreshed successfully')
    return token
  } catch (error) {
    logger.error('Paximum: Authentication failed', {
      error: error.message,
      url: loginUrl
    })
    throw new Error(`Paximum kimlik doğrulama hatası: ${error.message}`)
  }
}

/**
 * Get Paximum API endpoint from settings
 */
export async function getEndpoint() {
  const settings = await PlatformSettings.getSettings()
  const creds = settings.getPaximumCredentials()
  if (!creds) {
    throw new Error('Paximum entegrasyonu yapılandırılmamış')
  }
  return creds.endpoint
}

/**
 * Make authenticated request to Paximum API
 */
export async function makeRequest(path, data, options = {}) {
  const token = await getToken()
  const endpoint = await getEndpoint()

  try {
    const response = await axios.post(`${endpoint}${path}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: options.timeout || 60000
    })

    return response.data
  } catch (error) {
    logger.error(`Paximum API error: ${path}`, {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    })

    if (error.response?.status === 401) {
      // Token might be invalid - clear cache and retry once
      const settings = await PlatformSettings.getSettings()
      await settings.updatePaximumToken(null, null)
      throw new Error('Paximum oturum süresi dolmuş, lütfen tekrar deneyin')
    }

    throw new Error(`Paximum API hatası: ${error.message}`)
  }
}

/**
 * Check if Paximum integration is enabled
 */
export async function isEnabled() {
  const settings = await PlatformSettings.getSettings()
  return settings.paximum?.enabled === true
}

/**
 * Get default markup percentage
 */
export async function getDefaultMarkup() {
  const settings = await PlatformSettings.getSettings()
  return settings.paximum?.defaultMarkup || 10
}
