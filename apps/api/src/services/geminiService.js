/**
 * Gemini AI Service
 *
 * This file re-exports all functions from the modular gemini/ directory
 * for backward compatibility with existing imports.
 *
 * The service has been split into smaller modules:
 * - gemini/client.js - API key, client initialization, generateContent
 * - gemini/helpers.js - preprocessRoomContent, generateRoomCode, JSON repair
 * - gemini/translation.js - translateText, translateFields, batchTranslate
 * - gemini/hotelExtraction.js - extractHotelData, extractHotelDataFromUrl
 * - gemini/pricingParser.js - parsePricingCommand
 * - gemini/contractParser.js - parseHotelContract
 */

// Re-export all named exports
export {
  // Client
  getAI,
  generateContent,
  languageNames,
  GEMINI_MODEL,
  // Helpers
  usedCodes,
  resetUsedCodes,
  generateRoomCode,
  preprocessRoomContent,
  isJsonTruncated,
  repairTruncatedJson,
  cleanAndParseJson,
  validatePricingCompleteness,
  // Translation
  translateText,
  translateFields,
  batchTranslate,
  // Hotel extraction
  extractHotelData,
  extractHotelDataFromUrl,
  // Pricing parser
  parsePricingCommand,
  // Contract parser
  parseHotelContract
} from './gemini/index.js'

// Re-export default
export { default } from './gemini/index.js'
