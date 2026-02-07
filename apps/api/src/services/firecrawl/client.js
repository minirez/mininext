import { getFirecrawlApiKey } from './cache.js'

// Lazy-loaded FirecrawlApp constructor
let _FirecrawlApp = null
const getFirecrawlAppClass = async () => {
  if (!_FirecrawlApp) {
    const mod = await import('@mendable/firecrawl-js')
    _FirecrawlApp = mod.default
  }
  return _FirecrawlApp
}

// Initialize Firecrawl client
let firecrawl = null
let firecrawlApiKeyUsed = null

/**
 * Get or create Firecrawl client (async)
 */
export const getFirecrawl = async () => {
  const apiKey = await getFirecrawlApiKey()

  if (!apiKey) {
    return null
  }

  // Re-create client if API key changed
  if (firecrawl && firecrawlApiKeyUsed === apiKey) {
    return firecrawl
  }

  const FirecrawlApp = await getFirecrawlAppClass()
  firecrawl = new FirecrawlApp({ apiKey })
  firecrawlApiKeyUsed = apiKey
  return firecrawl
}

/**
 * Check if Firecrawl is configured (async)
 */
export const isConfigured = async () => {
  const apiKey = await getFirecrawlApiKey()
  return !!apiKey
}

/**
 * Reset the client (useful for testing or when API key changes)
 */
export const resetClient = () => {
  firecrawl = null
  firecrawlApiKeyUsed = null
}

export default {
  getFirecrawl,
  isConfigured,
  resetClient
}
