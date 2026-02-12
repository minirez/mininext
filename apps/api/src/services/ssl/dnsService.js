/**
 * DNS Service
 *
 * DNS verification functions for SSL certificate provisioning.
 * Handles DNS CNAME record validation to ensure domain points to our servers.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import dns from 'dns'
import logger from '../../core/logger.js'
import config from '../../config/index.js'

const execAsync = promisify(exec)
const dnsResolve4 = promisify(dns.resolve4)
const dnsResolveCname = promisify(dns.resolveCname)

/**
 * Sunucu IP adresini al
 * @returns {Promise<string>} Sunucu public IP
 */
export const getServerIP = async () => {
  try {
    // Önce config'den kontrol et
    if (config.ssl.serverPublicIp) {
      return config.ssl.serverPublicIp
    }

    // curl ile public IP al
    const { stdout } = await execAsync('curl -s ifconfig.me || curl -s icanhazip.com')
    return stdout.trim()
  } catch (error) {
    logger.error('[SSL] Failed to get server IP:', error.message)
    throw new Error('SERVER_IP_FETCH_FAILED')
  }
}

/**
 * CNAME hedef adresini al
 * @returns {string} CNAME target (e.g. app.maxirez.com)
 */
export const getCnameTarget = () => {
  return config.ssl.cnameTarget || 'app.maxirez.com'
}

/**
 * DNS CNAME kaydini dogrula
 * Domain'in CNAME kaydı cnameTarget'a yönlendirilmiş mi kontrol eder.
 * Fallback olarak A kaydı ile IP eşleşmesi de kontrol eder.
 *
 * @param {string} domain - Dogrulanacak domain
 * @returns {Promise<{success: boolean, cnameTarget: string, serverIP: string, domainIP: string|null, message: string}>}
 */
export const verifyDNS = async domain => {
  const cnameTarget = getCnameTarget()

  try {
    // Sunucu IP'sini al (fallback ve SSL setup için gerekli)
    const serverIP = await getServerIP()

    // 1. Önce CNAME kaydını kontrol et
    try {
      const cnameRecords = await dnsResolveCname(domain)

      if (cnameRecords && cnameRecords.length > 0) {
        // CNAME kaydı var - hedefi kontrol et
        const isPointingToTarget = cnameRecords.some(
          record => record.toLowerCase() === cnameTarget.toLowerCase()
        )

        if (isPointingToTarget) {
          logger.info(`[SSL] DNS CNAME verification successful for ${domain} -> ${cnameTarget}`)
          return {
            success: true,
            cnameTarget,
            serverIP,
            domainIP: cnameRecords[0],
            message: 'DNS_VERIFIED'
          }
        } else {
          logger.warn(
            `[SSL] DNS CNAME mismatch for ${domain}: expected ${cnameTarget}, got ${cnameRecords.join(', ')}`
          )
          return {
            success: false,
            cnameTarget,
            serverIP,
            domainIP: cnameRecords[0],
            message: 'DNS_NOT_POINTING_TO_SERVER'
          }
        }
      }
    } catch (cnameError) {
      // CNAME kaydı yok - A kaydı ile fallback kontrol yap
      logger.info(`[SSL] No CNAME record for ${domain}, checking A record as fallback`)
    }

    // 2. Fallback: A kaydı ile IP eşleşmesi kontrol et
    // (CNAME yoksa veya sorgulanamazsa, A kaydı ile cnameTarget'ın IP'si eşleşiyor mu?)
    try {
      const domainIPs = await dnsResolve4(domain)
      const targetIPs = await dnsResolve4(cnameTarget)

      const hasMatchingIP = domainIPs.some(ip => targetIPs.includes(ip))

      if (hasMatchingIP) {
        logger.info(`[SSL] DNS A record fallback verification successful for ${domain}`)
        return {
          success: true,
          cnameTarget,
          serverIP,
          domainIP: domainIPs[0],
          message: 'DNS_VERIFIED'
        }
      } else {
        logger.warn(
          `[SSL] DNS mismatch for ${domain}: domain IPs ${domainIPs.join(', ')} don't match target IPs ${targetIPs.join(', ')}`
        )
        return {
          success: false,
          cnameTarget,
          serverIP,
          domainIP: domainIPs[0],
          message: 'DNS_NOT_POINTING_TO_SERVER'
        }
      }
    } catch (aRecordError) {
      logger.warn(`[SSL] DNS lookup failed for ${domain}:`, aRecordError.message)
      return {
        success: false,
        cnameTarget,
        serverIP,
        domainIP: null,
        message: 'DNS_RECORD_NOT_FOUND'
      }
    }
  } catch (error) {
    logger.error('[SSL] DNS verification error:', error.message)
    throw error
  }
}

export default {
  getServerIP,
  getCnameTarget,
  verifyDNS
}
