import { asyncHandler } from '#helpers'
import { BadRequestError } from '#core/errors.js'

// ======================
// AI EXTRACTION
// ======================

export const aiExtractTourData = asyncHandler(async (req, res) => {
  const { content } = req.body || {}

  if (!content || typeof content !== 'string' || content.trim().length < 50) {
    throw new BadRequestError('Content must be at least 50 characters')
  }

  const { extractTourData } = await import('#services/gemini/tourExtraction.js')
  const result = await extractTourData(content.trim())

  res.json(result)
})
