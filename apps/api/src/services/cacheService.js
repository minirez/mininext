/**
 * @module services/cacheService
 * @description Hybrid caching service with Redis primary + in-memory fallback.
 * Uses Redis when available for distributed caching, falls back to in-memory Map.
 * Provides cache-aside pattern, statistics, and automatic cleanup.
 */

import { getRedisClient, isRedisConnected } from '#core/redis.js'
import logger from '#core/logger.js'

/**
 * Cache entry structure (in-memory)
 * @typedef {Object} CacheEntry
 * @property {*} value - Cached value
 * @property {number} expiresAt - Expiration timestamp
 * @property {number} createdAt - Creation timestamp
 */

/**
 * Cache statistics
 * @typedef {Object} CacheStats
 * @property {number} hits - Number of cache hits
 * @property {number} misses - Number of cache misses
 * @property {number} sets - Number of cache sets
 * @property {number} deletes - Number of cache deletes
 * @property {string} hitRate - Hit rate percentage
 * @property {number} size - Current cache size
 * @property {string} memoryEstimate - Estimated memory usage
 * @property {string} backend - 'redis' or 'memory'
 */

/** @type {Map<string, CacheEntry>} In-memory cache store (fallback) */
const memoryStore = new Map()

/** @type {{hits: number, misses: number, sets: number, deletes: number}} */
let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
}

/** @constant {number} Default TTL: 5 minutes (in ms) */
const DEFAULT_TTL = 5 * 60 * 1000

/** Cache key prefix for namespacing in Redis */
const REDIS_CACHE_PREFIX = 'cache:'

/**
 * Cache prefixes for different data types
 * @constant {Object.<string, string>}
 */
export const CACHE_PREFIXES = {
  PRICE_CALCULATION: 'price:',
  EXCHANGE_RATE: 'exchange:',
  HOTEL_INFO: 'hotel:',
  ROOM_TYPES: 'roomtypes:',
  MEAL_PLANS: 'mealplans:',
  CAMPAIGNS: 'campaigns:',
  AVAILABILITY: 'availability:',
  RATE: 'rate:'
}

/**
 * TTL values for different cache types (in milliseconds)
 * @constant {Object.<string, number>}
 */
export const CACHE_TTL = {
  PRICE_CALCULATION: 5 * 60 * 1000, // 5 minutes
  EXCHANGE_RATE: 6 * 60 * 60 * 1000, // 6 hours
  HOTEL_INFO: 30 * 60 * 1000, // 30 minutes
  ROOM_TYPES: 30 * 60 * 1000, // 30 minutes
  MEAL_PLANS: 30 * 60 * 1000, // 30 minutes
  CAMPAIGNS: 10 * 60 * 1000, // 10 minutes
  AVAILABILITY: 1 * 60 * 1000, // 1 minute (shorter due to real-time nature)
  RATE: 5 * 60 * 1000 // 5 minutes
}

/**
 * Generate cache key from parameters
 * @param {string} prefix - Cache prefix from CACHE_PREFIXES
 * @param {Object|string} params - Parameters to generate key from
 * @returns {string} Cache key
 */
export function generateCacheKey(prefix, params) {
  if (typeof params === 'string') {
    return `${prefix}${params}`
  }

  const sortedKeys = Object.keys(params).sort()
  const keyParts = sortedKeys
    .map(key => {
      const value = params[key]
      if (value === undefined || value === null) return null
      if (typeof value === 'object') {
        if (value instanceof Date) {
          return `${key}:${value.toISOString().split('T')[0]}`
        }
        return `${key}:${JSON.stringify(value)}`
      }
      return `${key}:${value}`
    })
    .filter(Boolean)

  return `${prefix}${keyParts.join('|')}`
}

// ==================== REDIS HELPERS ====================

/**
 * Try to get from Redis, returns null on failure
 * @private
 */
async function redisGet(key) {
  try {
    const client = getRedisClient()
    if (!client) return null
    const data = await client.get(`${REDIS_CACHE_PREFIX}${key}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

/**
 * Try to set in Redis, returns false on failure
 * @private
 */
async function redisSet(key, value, ttlMs) {
  try {
    const client = getRedisClient()
    if (!client) return false
    const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000))
    await client.setex(`${REDIS_CACHE_PREFIX}${key}`, ttlSeconds, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Try to delete from Redis
 * @private
 */
async function redisDel(key) {
  try {
    const client = getRedisClient()
    if (!client) return false
    await client.del(`${REDIS_CACHE_PREFIX}${key}`)
    return true
  } catch {
    return false
  }
}

/**
 * Delete Redis keys matching pattern
 * @private
 */
async function redisDeleteByPattern(pattern) {
  try {
    const client = getRedisClient()
    if (!client) return 0

    // Use SCAN to safely find matching keys (no KEYS in production)
    let cursor = '0'
    let count = 0
    const fullPattern = `${REDIS_CACHE_PREFIX}${pattern}*`

    do {
      const [newCursor, keys] = await client.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100)
      cursor = newCursor
      if (keys.length > 0) {
        await client.del(...keys)
        count += keys.length
      }
    } while (cursor !== '0')

    return count
  } catch {
    return 0
  }
}

// ==================== PUBLIC API ====================

/**
 * Get value from cache (Redis first, then memory fallback)
 * @param {string} key - Cache key
 * @returns {*} Cached value or null if not found/expired
 */
export function get(key) {
  // Sync path: try memory first for speed
  const memEntry = memoryStore.get(key)
  if (memEntry && Date.now() <= memEntry.expiresAt) {
    stats.hits++
    return memEntry.value
  }

  // Clean up expired memory entry
  if (memEntry) memoryStore.delete(key)

  stats.misses++
  return null
}

/**
 * Async get - tries Redis if memory miss
 * Use this when Redis cache is important (distributed scenarios)
 * @param {string} key - Cache key
 * @returns {Promise<*>} Cached value or null
 */
export async function getAsync(key) {
  // Try memory first (sync, fast)
  const memEntry = memoryStore.get(key)
  if (memEntry && Date.now() <= memEntry.expiresAt) {
    stats.hits++
    return memEntry.value
  }
  if (memEntry) memoryStore.delete(key)

  // Try Redis
  if (isRedisConnected()) {
    const value = await redisGet(key)
    if (value !== null) {
      stats.hits++
      // Write-back to memory for faster subsequent access
      memoryStore.set(key, {
        value,
        expiresAt: Date.now() + DEFAULT_TTL,
        createdAt: Date.now()
      })
      return value
    }
  }

  stats.misses++
  return null
}

/**
 * Set value in cache (both Redis and memory)
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} [ttl=300000] - Time to live in milliseconds
 */
export function set(key, value, ttl = DEFAULT_TTL) {
  stats.sets++

  // Always set in memory (sync, fast)
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttl,
    createdAt: Date.now()
  })

  // Also set in Redis (async, fire-and-forget)
  if (isRedisConnected()) {
    redisSet(key, value, ttl).catch(() => {})
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 */
export function del(key) {
  stats.deletes++
  memoryStore.delete(key)

  if (isRedisConnected()) {
    redisDel(key).catch(() => {})
  }
}

/**
 * Delete all keys matching a pattern (prefix match)
 * @param {string} pattern - Pattern to match (prefix)
 * @returns {number} Number of deleted memory entries
 */
export function deleteByPattern(pattern) {
  let count = 0
  for (const key of memoryStore.keys()) {
    if (key.startsWith(pattern)) {
      memoryStore.delete(key)
      count++
    }
  }
  stats.deletes += count

  // Also clean Redis
  if (isRedisConnected()) {
    redisDeleteByPattern(pattern).catch(() => {})
  }

  return count
}

/**
 * Clear entire cache
 */
export function clear() {
  const size = memoryStore.size
  memoryStore.clear()
  stats.deletes += size

  if (isRedisConnected()) {
    redisDeleteByPattern('').catch(() => {})
  }
}

/**
 * Get cache statistics
 * @returns {CacheStats}
 */
export function getStats() {
  const hitRate =
    stats.hits + stats.misses > 0
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2)
      : 0

  return {
    ...stats,
    hitRate: `${hitRate}%`,
    size: memoryStore.size,
    memoryEstimate: estimateMemoryUsage(),
    backend: isRedisConnected() ? 'redis+memory' : 'memory'
  }
}

/**
 * Reset cache statistics counters
 */
export function resetStats() {
  stats = { hits: 0, misses: 0, sets: 0, deletes: 0 }
}

/**
 * Estimate memory usage (rough estimate)
 * @private
 */
function estimateMemoryUsage() {
  let bytes = 0
  for (const [key, entry] of memoryStore) {
    bytes += key.length * 2
    bytes += JSON.stringify(entry.value).length * 2
    bytes += 16
  }

  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Clean up expired entries (memory only, Redis handles its own TTL)
 * @returns {number} Number of cleaned entries
 */
export function cleanup() {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of memoryStore) {
    if (now > entry.expiresAt) {
      memoryStore.delete(key)
      cleaned++
    }
  }

  return cleaned
}

/**
 * Get or set cached value (cache-aside pattern)
 * Tries Redis first for distributed cache, then memory, then fetches
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch value if not cached
 * @param {number} [ttl=300000] - Time to live in milliseconds
 * @returns {Promise<*>} Cached or fetched value
 */
export async function getOrSet(key, fetchFn, ttl = DEFAULT_TTL) {
  // Try memory first (fast path)
  const memEntry = memoryStore.get(key)
  if (memEntry && Date.now() <= memEntry.expiresAt) {
    stats.hits++
    return memEntry.value
  }
  if (memEntry) memoryStore.delete(key)

  // Try Redis
  if (isRedisConnected()) {
    const redisValue = await redisGet(key)
    if (redisValue !== null) {
      stats.hits++
      // Write-back to memory
      memoryStore.set(key, {
        value: redisValue,
        expiresAt: Date.now() + ttl,
        createdAt: Date.now()
      })
      return redisValue
    }
  }

  stats.misses++

  // Fetch and cache
  const value = await fetchFn()
  if (value !== undefined && value !== null) {
    set(key, value, ttl)
  }

  return value
}

/**
 * Invalidate cache for specific entity
 * @param {'hotel'|'rate'|'campaign'} entityType - Entity type
 * @param {string} entityId - Entity ID
 */
export function invalidateEntity(entityType, entityId) {
  const patterns = []

  switch (entityType) {
    case 'hotel':
      patterns.push(
        `${CACHE_PREFIXES.HOTEL_INFO}${entityId}`,
        `${CACHE_PREFIXES.ROOM_TYPES}${entityId}`,
        `${CACHE_PREFIXES.MEAL_PLANS}${entityId}`,
        `${CACHE_PREFIXES.CAMPAIGNS}${entityId}`
      )
      deleteByPattern(`${CACHE_PREFIXES.PRICE_CALCULATION}hotelId:${entityId}`)
      deleteByPattern(`${CACHE_PREFIXES.AVAILABILITY}hotelId:${entityId}`)
      break

    case 'rate':
      del(`${CACHE_PREFIXES.RATE}${entityId}`)
      break

    case 'campaign': {
      const campaignKey = `${CACHE_PREFIXES.CAMPAIGNS}${entityId}`
      del(campaignKey)
      break
    }

    default:
      patterns.forEach(pattern => deleteByPattern(pattern))
  }

  patterns.forEach(pattern => del(pattern))
}

// Run memory cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000)

export default {
  CACHE_PREFIXES,
  CACHE_TTL,
  generateCacheKey,
  get,
  getAsync,
  set,
  del,
  deleteByPattern,
  clear,
  getStats,
  resetStats,
  cleanup,
  getOrSet,
  invalidateEntity
}
