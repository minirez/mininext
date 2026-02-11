/**
 * SSL Service - Barrel Export
 *
 * DNS dogrulama, Let's Encrypt sertifika yonetimi ve Nginx konfigurasyonu.
 *
 * Flow:
 * 1. Domain girilir
 * 2. DNS A kaydi dogrulanir (sunucu IP'sine yonlendirme kontrolu)
 * 3. Let's Encrypt ile SSL sertifikasi alinir
 * 4. Nginx konfigurasyonu olusturulur ve yuklenir
 */

import logger from '../../core/logger.js'

// DNS Service exports
import { getServerIP, verifyDNS } from './dnsService.js'

// Certificate Service exports
import {
  requestCertificate,
  checkCertificate,
  renewCertificate,
  getCertConfig
} from './certificateService.js'

// Nginx Service exports
import {
  generateNginxConfig,
  installNginxConfig,
  installTempHttpConfig,
  removeNginxConfig,
  getNginxConfig
} from './nginxService.js'

/**
 * Tam SSL kurulum akisi
 * @param {string} domain - Domain adi
 * @param {string} type - 'b2c' | 'b2b' | 'pms'
 * @param {string} partnerId - Partner ID
 * @returns {Promise<{success: boolean, step: string, expiresAt: Date|null, message: string}>}
 */
export const setupSSL = async (domain, type, partnerId) => {
  try {
    logger.info(`[SSL] Starting full SSL setup for ${domain} (${type})`)

    // 1. DNS dogrulama
    const dnsResult = await verifyDNS(domain)
    if (!dnsResult.success) {
      return {
        success: false,
        step: 'dns',
        expiresAt: null,
        message: dnsResult.message,
        details: dnsResult
      }
    }

    // 2. Gecici HTTP nginx config kur (ACME challenge icin)
    const tempResult = await installTempHttpConfig(domain)
    if (!tempResult.success) {
      return {
        success: false,
        step: 'nginx-temp',
        expiresAt: null,
        message: 'NGINX_CONFIG_FAILED',
        details: tempResult
      }
    }

    // 3. Sertifika al
    const certResult = await requestCertificate(domain)
    if (!certResult.success) {
      return {
        success: false,
        step: 'certificate',
        expiresAt: null,
        message: certResult.message
      }
    }

    // 4. Tam Nginx konfigurasyonu olustur ve kur (HTTPS dahil)
    const nginxConfig = generateNginxConfig(domain, type, partnerId)
    const nginxResult = await installNginxConfig(domain, nginxConfig)
    if (!nginxResult.success) {
      return {
        success: false,
        step: 'nginx',
        expiresAt: certResult.expiresAt,
        message: nginxResult.message
      }
    }

    logger.info(`[SSL] Full SSL setup completed for ${domain}`)

    return {
      success: true,
      step: 'complete',
      expiresAt: certResult.expiresAt,
      message: 'SSL_SETUP_COMPLETE'
    }
  } catch (error) {
    logger.error(`[SSL] SSL setup failed for ${domain}:`, error.message)
    return {
      success: false,
      step: 'error',
      expiresAt: null,
      message: 'SSL_SETUP_FAILED'
    }
  }
}

// Named exports
export {
  // DNS Service
  getServerIP,
  verifyDNS,
  // Certificate Service
  requestCertificate,
  checkCertificate,
  renewCertificate,
  getCertConfig,
  // Nginx Service
  generateNginxConfig,
  installNginxConfig,
  installTempHttpConfig,
  removeNginxConfig,
  getNginxConfig
}

// Default export with all functions
export default {
  // DNS Service
  getServerIP,
  verifyDNS,
  // Certificate Service
  requestCertificate,
  checkCertificate,
  renewCertificate,
  getCertConfig,
  // Nginx Service
  generateNginxConfig,
  installNginxConfig,
  installTempHttpConfig,
  removeNginxConfig,
  getNginxConfig,
  // Main setup
  setupSSL
}
