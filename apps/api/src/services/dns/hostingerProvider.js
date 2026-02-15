import axios from 'axios'
import config from '#config'
import logger from '#core/logger.js'

const API_BASE = 'https://developers.hostinger.com/api/dns/v1/zones'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Auth header interceptor
client.interceptors.request.use(cfg => {
  const apiKey = config.hostinger.apiKey
  if (!apiKey) {
    throw new Error('HOSTINGER_API_KEY is not configured')
  }
  cfg.headers.Authorization = `Bearer ${apiKey}`
  return cfg
})

// Error interceptor
client.interceptors.response.use(
  res => res,
  error => {
    const status = error.response?.status
    const data = error.response?.data

    const errorMap = {
      401: { code: 'AUTH_FAILED', message: 'Hostinger API authentication failed' },
      404: { code: 'DOMAIN_NOT_IN_HOSTINGER', message: 'Domain is not managed by Hostinger' },
      422: { code: 'VALIDATION_FAILED', message: data?.message || 'Validation failed' },
      429: { code: 'RATE_LIMITED', message: 'Hostinger API rate limit exceeded' }
    }

    const mapped = errorMap[status]
    if (mapped) {
      const err = new Error(mapped.message)
      err.code = mapped.code
      err.status = status
      err.details = data
      throw err
    }

    logger.error('[Hostinger DNS] API error:', {
      status,
      url: error.config?.url,
      data
    })
    throw error
  }
)

/**
 * Extract the zone (root) domain from a full domain
 * booking.example.com → example.com
 * www.example.com → example.com
 * example.com → example.com
 */
export const extractZoneDomain = fullDomain => {
  const parts = fullDomain.replace(/\.$/, '').split('.')
  if (parts.length <= 2) return fullDomain
  return parts.slice(-2).join('.')
}

/**
 * Extract subdomain part from a full domain
 * booking.example.com → booking
 * www.example.com → www
 * example.com → '' (empty, root)
 */
export const extractSubdomain = fullDomain => {
  const parts = fullDomain.replace(/\.$/, '').split('.')
  if (parts.length <= 2) return ''
  return parts.slice(0, -2).join('.')
}

/**
 * Get all DNS records for a zone
 * Hostinger returns nested format: { name, type, ttl, records: [{ content }] }
 * We flatten it to: [{ name, type, ttl, content }]
 */
export const getRecords = async domain => {
  const zone = extractZoneDomain(domain)
  logger.info(`[Hostinger DNS] Getting records for zone: ${zone}`)
  const { data } = await client.get(`/${zone}`)

  // Flatten nested records
  const flat = []
  for (const entry of data) {
    for (const rec of entry.records || []) {
      flat.push({
        name: entry.name,
        type: entry.type,
        ttl: entry.ttl,
        content: rec.content,
        disabled: rec.is_disabled || false
      })
    }
  }
  return flat
}

/**
 * Update (add/replace) DNS records
 * Hostinger API expects nested format:
 *   { zone: [{ name, type, ttl, records: [{ content }] }], overwrite }
 *
 * We accept flat format: [{ name, type, content, ttl }] and convert internally
 *
 * @param {string} domain - The full domain
 * @param {Array} records - Array of {name, type, content, ttl}
 * @param {boolean} overwrite - If true, replaces matching records; if false, adds alongside
 */
export const updateRecords = async (domain, records, overwrite = false) => {
  const zone = extractZoneDomain(domain)
  logger.info(`[Hostinger DNS] Updating records for zone: ${zone}, overwrite: ${overwrite}`)

  // Convert flat records to Hostinger nested format
  const zoneEntries = records.map(r => ({
    name: r.name,
    type: r.type,
    ttl: r.ttl || 300,
    records: [{ content: r.content }]
  }))

  const { data } = await client.put(`/${zone}`, {
    zone: zoneEntries,
    overwrite
  })
  return data
}

/**
 * Delete DNS records matching filters
 * @param {string} domain - The full domain
 * @param {Array} filters - Array of {name, type} to delete
 */
export const deleteRecords = async (domain, filters) => {
  const zone = extractZoneDomain(domain)
  logger.info(`[Hostinger DNS] Deleting records from zone: ${zone}`)
  const { data } = await client.delete(`/${zone}`, {
    data: { filters }
  })
  return data
}

/**
 * Validate DNS records before applying
 */
export const validateRecords = async (domain, records) => {
  const zone = extractZoneDomain(domain)
  const { data } = await client.post(`/${zone}/validate`, { records })
  return data
}

/**
 * Get zone snapshots
 */
export const getSnapshots = async domain => {
  const zone = extractZoneDomain(domain)
  const { data } = await client.get(`/${zone}/snapshots`)
  return data
}

/**
 * Restore a zone snapshot
 */
export const restoreSnapshot = async (domain, snapshotId) => {
  const zone = extractZoneDomain(domain)
  const { data } = await client.post(`/${zone}/snapshots/restore`, { snapshot_id: snapshotId })
  return data
}

/**
 * Reset zone to defaults
 */
export const resetToDefaults = async domain => {
  const zone = extractZoneDomain(domain)
  const { data } = await client.post(`/${zone}/reset`)
  return data
}
