import * as hostinger from './hostingerProvider.js'
import config from '#config'
import logger from '#core/logger.js'

export { hostinger }
export { extractZoneDomain, extractSubdomain } from './hostingerProvider.js'

const CNAME_TARGET = config.ssl.cnameTarget || 'app.maxirez.com'
const SERVER_IP = config.ssl.serverPublicIp || '85.31.238.34'
const DEFAULT_TTL = 300

/**
 * Determine if domain is a root domain (no subdomain)
 * example.com → true, booking.example.com → false
 */
export const isRootDomain = fullDomain => {
  return !hostinger.extractSubdomain(fullDomain)
}

/**
 * Check if the correct DNS record already exists for the given full domain
 * Root domains → checks A record, subdomains → checks CNAME record
 * @returns {{ exists: boolean, record?: object, isRoot: boolean }}
 */
export const checkExistingRecord = async fullDomain => {
  try {
    const records = await hostinger.getRecords(fullDomain)
    const subdomain = hostinger.extractSubdomain(fullDomain)
    const recordName = subdomain || '@'
    const root = !subdomain

    if (root) {
      // Root domain: check A record pointing to server IP
      const existing = records.find(
        r => r.type === 'A' && r.name === '@' && r.content === SERVER_IP
      )
      return { exists: !!existing, record: existing || null, isRoot: true }
    } else {
      // Subdomain: check CNAME record
      const existing = records.find(r => r.type === 'CNAME' && r.name === recordName)
      return { exists: !!existing, record: existing || null, isRoot: false }
    }
  } catch (err) {
    if (err.code === 'DOMAIN_NOT_IN_HOSTINGER') {
      return { exists: false, record: null, notInHostinger: true, isRoot: isRootDomain(fullDomain) }
    }
    throw err
  }
}

// Backward compat alias
export const checkExistingCname = checkExistingRecord

/**
 * Create the correct DNS record for the domain:
 * - Root domain (example.com) → A record pointing to SERVER_IP
 * - Subdomain (booking.example.com) → CNAME pointing to CNAME_TARGET
 * Does NOT overwrite existing records (safe add)
 */
export const createAutoRecord = async fullDomain => {
  const subdomain = hostinger.extractSubdomain(fullDomain)
  const root = !subdomain

  let record
  if (root) {
    record = {
      name: '@',
      type: 'A',
      content: SERVER_IP,
      ttl: DEFAULT_TTL
    }
    logger.info(`[DNS] Creating auto A record: @ → ${SERVER_IP} (domain: ${fullDomain})`)
  } else {
    record = {
      name: subdomain,
      type: 'CNAME',
      content: CNAME_TARGET,
      ttl: DEFAULT_TTL
    }
    logger.info(`[DNS] Creating auto CNAME: ${subdomain} → ${CNAME_TARGET} (domain: ${fullDomain})`)
  }

  const result = await hostinger.updateRecords(fullDomain, [record], false)
  logger.info(`[DNS] Auto ${record.type} record created for ${fullDomain}`)
  return result
}

// Backward compat alias
export const createAutoCname = createAutoRecord
