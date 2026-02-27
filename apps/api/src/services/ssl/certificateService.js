/**
 * Certificate Service
 *
 * Let's Encrypt certificate operations.
 * Handles SSL certificate request, renewal, and status checking.
 *
 * Docker container'dan çalışır:
 * - certbot komutları hostExec (nsenter) ile host'ta çalıştırılır
 * - Sertifika dosyaları volume-mounted /etc/letsencrypt/ dizininden okunur
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import logger from '../../core/logger.js'
import appConfig from '../../config/index.js'
import { hostExec } from './hostExec.js'
import { validateDomain } from '../../helpers/inputValidation.js'

const execAsync = promisify(exec)

// Konfigurasyon (config module'den alınıyor)
const CONFIG = {
  // Let's Encrypt
  certbotEmail: appConfig.ssl.certbotEmail,
  certbotWebroot: appConfig.ssl.certbotWebroot,

  // Sertifika dizini
  certDir: '/etc/letsencrypt/live'
}

/**
 * Let's Encrypt SSL sertifikasi al
 * @param {string} domain - Sertifika alinacak domain
 * @returns {Promise<{success: boolean, certPath: string|null, expiresAt: Date|null, message: string}>}
 */
export const requestCertificate = async domain => {
  try {
    // Validate domain to prevent shell injection
    validateDomain(domain)

    logger.info(`[SSL] Requesting certificate for ${domain}`)

    // Certbot komutu - host üzerinde çalışır (nsenter ile)
    const certbotCmd = !appConfig.isDev
      ? `certbot certonly --webroot -w ${CONFIG.certbotWebroot} -d ${domain} --email ${CONFIG.certbotEmail} --agree-tos --non-interactive`
      : `certbot certonly --standalone -d ${domain} --email ${CONFIG.certbotEmail} --agree-tos --non-interactive --dry-run`

    const { stdout, stderr } = await hostExec(certbotCmd, { timeout: 120000 })

    logger.info(`[SSL] Certbot output for ${domain}:`, stdout)

    if (stderr && !stderr.includes('Congratulations')) {
      logger.warn(`[SSL] Certbot stderr for ${domain}:`, stderr)
    }

    // Sertifika yolunu kontrol et (volume-mounted dizin üzerinden)
    const certPath = path.join(CONFIG.certDir, domain)

    // Production'da sertifika dosyalarini kontrol et
    if (!appConfig.isDev) {
      try {
        await fs.access(path.join(certPath, 'fullchain.pem'))
        await fs.access(path.join(certPath, 'privkey.pem'))
      } catch {
        throw new Error('CERTIFICATE_FILES_NOT_FOUND')
      }
    }

    // Sertifika bitis tarihini hesapla (Let's Encrypt = 90 gun)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    logger.info(`[SSL] Certificate obtained for ${domain}, expires: ${expiresAt.toISOString()}`)

    return {
      success: true,
      certPath,
      expiresAt,
      message: 'CERTIFICATE_OBTAINED'
    }
  } catch (error) {
    logger.error(`[SSL] Certificate request failed for ${domain}:`, error.message)

    // Hata mesajini analiz et
    if (error.message.includes('too many certificates') || error.message.includes('rate limit')) {
      return {
        success: false,
        certPath: null,
        expiresAt: null,
        message: 'RATE_LIMIT_EXCEEDED'
      }
    }

    if (error.message.includes('DNS problem') || error.message.includes('unauthorized')) {
      return {
        success: false,
        certPath: null,
        expiresAt: null,
        message: 'DNS_VERIFICATION_FAILED'
      }
    }

    return {
      success: false,
      certPath: null,
      expiresAt: null,
      message: 'CERTIFICATE_REQUEST_FAILED'
    }
  }
}

/**
 * SSL sertifikasini kontrol et
 * Sertifika dosyaları volume-mounted olduğundan container içinden okunabilir.
 * @param {string} domain - Domain adi
 * @returns {Promise<{exists: boolean, expiresAt: Date|null, daysRemaining: number|null}>}
 */
export const checkCertificate = async domain => {
  const certPath = path.join(CONFIG.certDir, domain, 'fullchain.pem')

  try {
    await fs.access(certPath)

    // Sertifika bitis tarihini al (container içinde openssl ile)
    const { stdout } = await execAsync(`openssl x509 -enddate -noout -in ${certPath}`)

    // "notAfter=Dec 31 23:59:59 2024 GMT" formatindan parse et
    const match = stdout.match(/notAfter=(.+)/)
    if (match) {
      const expiresAt = new Date(match[1])
      const now = new Date()
      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))

      return {
        exists: true,
        expiresAt,
        daysRemaining
      }
    }

    return { exists: true, expiresAt: null, daysRemaining: null }
  } catch {
    return { exists: false, expiresAt: null, daysRemaining: null }
  }
}

/**
 * SSL sertifikasini yenile
 * @param {string} domain - Domain adi
 * @returns {Promise<{success: boolean, expiresAt: Date|null, message: string}>}
 */
export const renewCertificate = async domain => {
  try {
    logger.info(`[SSL] Renewing certificate for ${domain}`)

    // Host'ta certbot renew çalıştır
    const { stdout, stderr } = await hostExec(
      `certbot renew --cert-name ${domain} --non-interactive`,
      { timeout: 120000 }
    )

    logger.info(`[SSL] Renewal output for ${domain}:`, stdout)

    // Yeni bitis tarihini al
    const certInfo = await checkCertificate(domain)

    // Host'ta nginx'i reload et
    await hostExec('nginx -s reload')

    return {
      success: true,
      expiresAt: certInfo.expiresAt,
      message: 'CERTIFICATE_RENEWED'
    }
  } catch (error) {
    logger.error(`[SSL] Certificate renewal failed for ${domain}:`, error.message)
    return {
      success: false,
      expiresAt: null,
      message: 'CERTIFICATE_RENEWAL_FAILED'
    }
  }
}

/**
 * Get certificate configuration
 * @returns {object} Certificate configuration
 */
export const getCertConfig = () => CONFIG

export default {
  requestCertificate,
  checkCertificate,
  renewCertificate,
  getCertConfig
}
