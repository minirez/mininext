/**
 * Gemini AI Service - Barrel Export
 *
 * This file re-exports all functions from the modular Gemini service files
 * for backward compatibility with existing imports.
 */

// Client exports
export { getAI, generateContent, languageNames, GEMINI_MODEL } from './client.js'

// Helper exports
export {
  usedCodes,
  resetUsedCodes,
  generateRoomCode,
  preprocessRoomContent,
  isJsonTruncated,
  repairTruncatedJson,
  cleanAndParseJson,
  validatePricingCompleteness
} from './helpers.js'

// Translation exports
export { translateText, translateFields, batchTranslate } from './translation.js'

// Hotel extraction exports
export { extractHotelData, extractHotelDataFromUrl } from './hotelExtraction.js'

// Tour extraction exports
export { extractTourData } from './tourExtraction.js'

// Pricing parser exports
export { parsePricingCommand } from './pricingParser.js'

// Contract parser exports
export { parseHotelContract } from './contractParser.js'

// Lazy module cache for default export
const _modules = {}
const _lazyLoad = async mod => {
  if (!_modules[mod]) {
    _modules[mod] = await import(`./${mod}.js`)
  }
  return _modules[mod]
}

// Default export for backward compatibility
// Methods are lazy-loaded on first call to avoid loading heavy dependencies at startup
export default {
  translateText: (...args) => _lazyLoad('translation').then(m => m.translateText(...args)),
  translateFields: (...args) => _lazyLoad('translation').then(m => m.translateFields(...args)),
  batchTranslate: (...args) => _lazyLoad('translation').then(m => m.batchTranslate(...args)),
  parsePricingCommand: (...args) =>
    _lazyLoad('pricingParser').then(m => m.parsePricingCommand(...args)),
  extractHotelData: (...args) =>
    _lazyLoad('hotelExtraction').then(m => m.extractHotelData(...args)),
  extractHotelDataFromUrl: (...args) =>
    _lazyLoad('hotelExtraction').then(m => m.extractHotelDataFromUrl(...args)),
  parseHotelContract: (...args) =>
    _lazyLoad('contractParser').then(m => m.parseHotelContract(...args)),
  get languageNames() {
    return import('./client.js').then(m => m.languageNames)
  }
}
