import logger from '../../core/logger.js'
import config from '../../config/index.js'

export const GEMINI_MODEL = 'gemini-3-flash-preview'

// Cache for API key and client
let cachedApiKey = null
let cachedApiKeyExpiry = 0
const API_KEY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Initialize the AI client
let ai = null
let aiKeyHash = null

// Lazy-loaded GoogleGenAI constructor
let _GoogleGenAI = null
const getGoogleGenAI = async () => {
  if (!_GoogleGenAI) {
    const mod = await import('@google/genai')
    _GoogleGenAI = mod.GoogleGenAI
  }
  return _GoogleGenAI
}

// Language names for better translation context
export const languageNames = {
  tr: 'Turkish',
  en: 'English',
  ru: 'Russian',
  el: 'Greek',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  fr: 'French',
  ro: 'Romanian',
  bg: 'Bulgarian',
  pt: 'Portuguese',
  da: 'Danish',
  zh: 'Chinese',
  ar: 'Arabic',
  fa: 'Persian',
  he: 'Hebrew',
  sq: 'Albanian',
  uk: 'Ukrainian',
  pl: 'Polish',
  az: 'Azerbaijani'
}

/**
 * Get Gemini API key from PlatformSettings or environment
 */
const getGeminiApiKey = async () => {
  // Check cache first
  if (cachedApiKey && Date.now() < cachedApiKeyExpiry) {
    return cachedApiKey
  }

  try {
    // Dynamic import to avoid circular dependencies
    const { default: PlatformSettings } =
      await import('../../modules/platform-settings/platformSettings.model.js')
    const settings = await PlatformSettings.getSettings()
    const credentials = settings.getGeminiCredentials()

    if (credentials?.apiKey) {
      cachedApiKey = credentials.apiKey
      cachedApiKeyExpiry = Date.now() + API_KEY_CACHE_TTL
      logger.info('Using Gemini API key from PlatformSettings')
      return cachedApiKey
    }
  } catch (error) {
    logger.warn('Failed to load Gemini API key from database:', error.message)
  }

  // Fall back to config (environment variable)
  if (config.gemini.apiKey) {
    cachedApiKey = config.gemini.apiKey
    cachedApiKeyExpiry = Date.now() + API_KEY_CACHE_TTL
    logger.info('Using Gemini API key from config')
    return cachedApiKey
  }

  return null
}

/**
 * Get AI client instance
 */
export const getAI = async () => {
  const apiKey = await getGeminiApiKey()
  if (!apiKey) return null

  // Create new client if key changed or not initialized
  const keyHash = apiKey.substring(0, 10)
  if (!ai || aiKeyHash !== keyHash) {
    const GoogleGenAI = await getGoogleGenAI()
    ai = new GoogleGenAI({ apiKey })
    aiKeyHash = keyHash
  }
  return ai
}

/**
 * Generate content using Gemini AI
 */
export const generateContent = async (prompt, options = {}) => {
  const client = await getAI()
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured. Please configure it in Platform Settings.')
  }

  const config = {
    temperature: options.temperature || 0.3,
    maxOutputTokens: options.maxOutputTokens || 16000,
    ...(options.thinkingLevel && {
      thinkingConfig: {
        thinkingLevel: options.thinkingLevel
      }
    })
  }

  logger.info('Gemini request - model: ' + GEMINI_MODEL + ', config: ' + JSON.stringify(config))

  // Use streaming to collect complete response
  const response = await client.models.generateContentStream({
    model: GEMINI_MODEL,
    config,
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  })

  // Collect all chunks
  let fullText = ''
  let chunkCount = 0
  for await (const chunk of response) {
    chunkCount++
    if (chunk.text) {
      fullText += chunk.text
    }
  }

  logger.info('Gemini response - chunks: ' + chunkCount + ', totalLength: ' + fullText.length)

  return fullText
}
