/**
 * Helper functions for Gemini AI processing
 */

import logger from '../../core/logger.js'

/**
 * Set to track used room codes for uniqueness
 */
export const usedCodes = new Set()

/**
 * Reset used codes for each extraction
 */
export const resetUsedCodes = () => {
  usedCodes.clear()
}

/**
 * Generate unique room code from room name
 * Uses a Set to track used codes and appends numbers for duplicates
 */
export const generateRoomCode = (name, index) => {
  const nameLower = name.toLowerCase()
  let baseCode = ''

  // Check for specific room types - more specific first
  if (nameLower.includes('presidential') && nameLower.includes('residence')) baseCode = 'PRE'
  else if (nameLower.includes('executive') && nameLower.includes('residence')) baseCode = 'EXE'
  else if (nameLower.includes('king') && nameLower.includes('residence')) baseCode = 'KNG'
  else if (nameLower.includes('premium') && nameLower.includes('suite')) baseCode = 'PRS'
  else if (nameLower.includes('suite') && nameLower.includes('serenity')) baseCode = 'SRN'
  else if (nameLower.includes('suite') && nameLower.includes('junior')) baseCode = 'JRS'
  else if (nameLower.includes('suite')) baseCode = 'STE'
  else if (nameLower.includes('villa') && nameLower.includes('garden')) baseCode = 'GRV'
  else if (nameLower.includes('villa')) baseCode = 'VIL'
  else if (nameLower.includes('bungalow') || nameLower.includes('bungalov')) baseCode = 'BNG'
  else if (nameLower.includes('residence')) baseCode = 'RES'
  else if (nameLower.includes('luxury') && nameLower.includes('deniz')) baseCode = 'LXD'
  else if (nameLower.includes('luxury') && nameLower.includes('kara')) baseCode = 'LXK'
  else if (nameLower.includes('luxury') && nameLower.includes('yandan')) baseCode = 'LXY'
  else if (nameLower.includes('luxury')) baseCode = 'LUX'
  else if (nameLower.includes('deluxe') && nameLower.includes('deniz')) baseCode = 'DXD'
  else if (nameLower.includes('deluxe') && nameLower.includes('kara')) baseCode = 'DXK'
  else if (nameLower.includes('deluxe') && nameLower.includes('yandan')) baseCode = 'DXY'
  else if (nameLower.includes('deluxe') || nameLower.includes('delüks')) baseCode = 'DLX'
  else if (nameLower.includes('superior') || nameLower.includes('süperior')) baseCode = 'SUP'
  else if (nameLower.includes('standard') || nameLower.includes('standart')) baseCode = 'STD'
  else if (nameLower.includes('family') || nameLower.includes('aile')) baseCode = 'FAM'
  else if (nameLower.includes('economy') || nameLower.includes('ekonomi')) baseCode = 'ECO'
  else if (nameLower.includes('promo')) baseCode = 'PRM'
  else if (nameLower.includes('deniz') || nameLower.includes('sea')) baseCode = 'SEA'
  else if (nameLower.includes('kara') || nameLower.includes('land')) baseCode = 'LND'
  else {
    // Fallback: generate from first letters
    const words = name.split(/\s+/).filter(w => w.length > 2)
    if (words.length >= 2) {
      baseCode = (words[0][0] + words[1][0] + (words[2]?.[0] || '')).toUpperCase()
    } else {
      baseCode = `RM${index + 1}`
    }
  }

  // Ensure uniqueness by appending number if needed
  let finalCode = baseCode
  let counter = 2
  while (usedCodes.has(finalCode)) {
    finalCode = `${baseCode}${counter}`
    counter++
  }
  usedCodes.add(finalCode)

  return finalCode
}

/**
 * Pre-process content to extract room information and group images
 * This helps Gemini understand room structure better
 */
export const preprocessRoomContent = content => {
  if (!content) return { content, roomHints: null }

  // Reset used codes for this extraction
  usedCodes.clear()

  // Extract ALL hotel images - more permissive pattern
  const imagePattern = /https?:\/\/[^\s"'<>\]]+\.(jpg|jpeg|png|webp)/gi
  const rawImages = [...new Set(content.match(imagePattern) || [])]

  // Filter to keep only hotel-related images
  const allImages = rawImages.filter(img => {
    const imgLower = img.toLowerCase()
    // Must be hotel/room related
    const isHotelImage =
      imgLower.includes('hotel') ||
      imgLower.includes('room') ||
      imgLower.includes('oda') ||
      imgLower.includes('ets') ||
      imgLower.includes('cdn') ||
      imgLower.includes('gallery') ||
      imgLower.includes('upload') ||
      imgLower.includes('image') ||
      imgLower.includes('photo') ||
      imgLower.includes('media')
    // Skip icons, logos, social media
    const isExcluded =
      imgLower.includes('icon') ||
      imgLower.includes('logo') ||
      imgLower.includes('favicon') ||
      imgLower.includes('facebook') ||
      imgLower.includes('twitter') ||
      imgLower.includes('instagram') ||
      imgLower.includes('google') ||
      imgLower.includes('pixel') ||
      imgLower.includes('avatar') ||
      imgLower.includes('flag') ||
      /[-_](16|24|32|48|64|icon)[-_.]/.test(imgLower)
    return isHotelImage && !isExcluded
  })

  // Separate property images from room images
  const propertyImages = []
  const roomImages = []

  allImages.forEach(img => {
    const imgLower = img.toLowerCase()
    // Room images: contain etsrooms, /room/, /oda/ in URL
    const isRoomImage =
      imgLower.includes('etsrooms') ||
      imgLower.includes('/room/') ||
      imgLower.includes('/oda/') ||
      imgLower.includes('_room_') ||
      imgLower.includes('_oda_') ||
      /room[-_]?\d/i.test(imgLower)

    if (isRoomImage) {
      roomImages.push(img)
    } else {
      propertyImages.push(img)
    }
  })

  // Group ROOM images by timestamp (images with same timestamp likely belong to same room)
  const imageGroups = {}
  const ungroupedRoomImages = []

  roomImages.forEach(img => {
    // Try multiple timestamp patterns
    const timestampMatch =
      img.match(/_(\d{14})_(\d+)/i) || img.match(/\/(\d{14})_/i) || img.match(/_(\d{12,14})[_-]/i)
    if (timestampMatch) {
      const ts = timestampMatch[1]
      if (!imageGroups[ts]) imageGroups[ts] = []
      imageGroups[ts].push(img)
    } else {
      ungroupedRoomImages.push(img)
    }
  })

  // Sort groups by image count (larger groups are likely main room types)
  const sortedGroups = Object.entries(imageGroups).sort((a, b) => b[1].length - a[1].length)

  // Find room names in content - more comprehensive patterns
  const roomPatterns = [
    // ETS Tur specific - room name before "* * *" separator
    /\.(?:jpg|jpeg|png|webp)\)\n\n([^\n]+)\n\n\* \* \*/gi,
    // ETS Tur - room name with # header
    /###\s*([^\n#]+)/gi,
    // Room type with size
    /\*\*([^*\n]+(?:Oda|Room|Suite|Villa|Bungalow)[^*\n]*)\*\*/gi,
    // Generic room patterns - expanded
    /(?:^|\n)\s*((?:Luxury |Serenity |Laguna |Garden |Sea View |Land View |Deniz Manzaralı |Kara Manzaralı |Yandan |Pool |Beach |Mountain |City |Executive |Presidential |Premium )?(?:Suite|Superior|Süperior|Standard|Standart|Deluxe|Delüks|Family|Aile|Economy|Promo|Villa|Bungalow|Junior|King|Queen|Twin|Double|Single|Connect|Dublex|Duplex|Terrace|Penthouse|Residence)[^\n]{0,40}(?:\s*Oda|\s*Room)?)\s*\n/gi,
    // Turkish room types
    /(?:^|\n)\s*((?:Standart|Delüks|Süit|Süperior|Aile|Ekonomi|Promo|Villa|Bungalov)[^\n]{0,40}(?:\s*Oda)?)\s*\n/gi,
    // Residence types
    /(?:^|\n)\s*((?:King|Executive|Presidential|Premium|Royal)\s+(?:Residence|Suite)[^\n]{0,30})\s*\n/gi,
    // Manzarali patterns
    /(?:^|\n)\s*((?:Luxury|Deluxe|Superior|Süperior)\s+(?:Deniz|Kara|Yandan Deniz)\s+Manzaralı[^\n]{0,20})\s*\n/gi
  ]

  const foundRooms = new Set()
  roomPatterns.forEach(pattern => {
    let match
    const patternCopy = new RegExp(pattern.source, pattern.flags) // Reset lastIndex
    while ((match = patternCopy.exec(content)) !== null) {
      let name = match[1].trim()
      // Clean up the name
      name = name
        .replace(/^\*+|\*+$/g, '')
        .replace(/^#+\s*/, '')
        .trim()
      if (
        name.length > 3 &&
        name.length < 80 &&
        !name.includes('http') &&
        !name.includes('Otel') &&
        !name.includes('Hotel') &&
        !name.includes('Resort') &&
        !name.includes('Puan') &&
        !name.includes('TL') &&
        !name.includes('€') &&
        !name.includes('$')
      ) {
        foundRooms.add(name)
      }
    }
  })

  // Also look for "Tesisin Oda Puani" sections count as a hint
  const roomScoreCount = (content.match(/Tesisin Oda Puanı/gi) || []).length

  // Extract room sizes
  const roomSizes = [...new Set(content.match(/\d+\s*m²/g) || [])]

  // Build room hints
  const roomList = [...foundRooms]
  const roomHints = []

  // If we found room score sections but not enough rooms, note this
  const expectedRoomCount = Math.max(roomList.length, roomScoreCount, sortedGroups.length)

  roomHints.push('=== BULUNAN ODA TiPLERi (TAM LiSTE) ===')
  roomHints.push(`Sayfada tespit edilen oda bölümü sayisi: ${roomScoreCount}`)
  roomHints.push(`Görsel gruplari sayisi: ${sortedGroups.length}`)
  roomHints.push(`Oda boyutlari: ${roomSizes.join(', ')}`)
  roomHints.push('')

  if (roomList.length > 0) {
    roomHints.push('Bulunan oda isimleri:')
    roomList.forEach((name, i) => {
      const code = generateRoomCode(name, i)
      roomHints.push(`${i + 1}. ${name} (Kod: ${code})`)
    })
  } else {
    roomHints.push(
      `DiKKAT: Oda isimleri regex ile bulunamadi ama ${roomScoreCount} oda bölümü var!`
    )
    roomHints.push('Lütfen içerikten oda isimlerini manuel olarak çikar.')
  }

  roomHints.push('')
  roomHints.push(
    `*** TOPLAM ${allImages.length} GÖRSEL: ${propertyImages.length} otel görseli + ${roomImages.length} oda görseli ***`
  )
  roomHints.push('')

  // Property/Hotel images section
  if (propertyImages.length > 0) {
    roomHints.push('=== OTEL GÖRSELLERi (images dizisine ekle, roomTemplates DEGiL!) ===')
    roomHints.push('Bu görseller otelin genel alanlari: havuz, restoran, lobi, dis cephe vb.')
    propertyImages.slice(0, 20).forEach((img, j) => roomHints.push(`  ${j + 1}. ${img}`))
    if (propertyImages.length > 20) {
      roomHints.push(`  ... ve ${propertyImages.length - 20} görsel daha`)
    }
    roomHints.push('')
  }

  // Room image groups section
  roomHints.push('=== ODA GÖRSELLERi (roomTemplates içinde kullan!) ===')
  sortedGroups.forEach(([_ts, imgs], i) => {
    const roomName = roomList[i] || `Bilinmeyen Oda ${i + 1}`
    roomHints.push(`\nGrup ${i + 1} - ${roomName}: ${imgs.length} görsel`)
    // Show ALL images in group
    imgs.forEach((img, j) => roomHints.push(`  ${j + 1}. ${img}`))
  })

  if (ungroupedRoomImages.length > 0) {
    roomHints.push(`\n=== GRUPLANMAMIS ODA GÖRSELLERi (${ungroupedRoomImages.length} adet) ===`)
    roomHints.push('Bu görselleri içeriklerine göre uygun odalara dagit:')
    ungroupedRoomImages.forEach((img, j) => roomHints.push(`  ${j + 1}. ${img}`))
  }

  roomHints.push('')
  roomHints.push(
    '*** ÖNEMLi: Otel görsellerini "images" dizisine, oda görsellerini "roomTemplates" içine koy! ***'
  )
  roomHints.push('*** Otel görselleri ile oda görsellerini KARISTIRMA! ***')

  return {
    content: content,
    roomHints: roomHints.join('\n'),
    imageGroups: sortedGroups,
    roomNames: roomList,
    totalImages: allImages.length,
    propertyImageCount: propertyImages.length,
    roomImageCount: roomImages.length,
    expectedRoomCount
  }
}

/**
 * Check if JSON response is truncated (incomplete)
 */
export const isJsonTruncated = jsonStr => {
  if (!jsonStr) return true
  const trimmed = jsonStr.trim()
  // JSON should end with } or ]
  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) return true
  // Try to count braces
  let braceCount = 0
  let bracketCount = 0
  let inString = false
  let escaped = false
  for (const char of trimmed) {
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (char === '{') braceCount++
      else if (char === '}') braceCount--
      else if (char === '[') bracketCount++
      else if (char === ']') bracketCount--
    }
  }
  return braceCount !== 0 || bracketCount !== 0
}

/**
 * Attempt to repair truncated JSON by closing open brackets
 * This is a best-effort recovery for truncated responses
 */
export const repairTruncatedJson = jsonStr => {
  if (!jsonStr) return '{}'

  let repaired = jsonStr.trim()

  // Remove any trailing incomplete property (e.g., "name": "Some incomplete)
  // Find last complete property
  const lastCompleteMatch = repaired.match(
    /^([\s\S]*"[^"]+"\s*:\s*(?:"[^"]*"|[\d.]+|true|false|null|\{[\s\S]*?\}|\[[\s\S]*?\]))\s*,?\s*"[^"]*$/m
  )
  if (lastCompleteMatch) {
    repaired = lastCompleteMatch[1]
  }

  // Remove trailing comma if present
  repaired = repaired.replace(/,\s*$/, '')

  // Count unclosed brackets
  let braceCount = 0
  let bracketCount = 0
  let inString = false
  let escaped = false

  for (const char of repaired) {
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (char === '{') braceCount++
      else if (char === '}') braceCount--
      else if (char === '[') bracketCount++
      else if (char === ']') bracketCount--
    }
  }

  // Close unclosed brackets
  while (bracketCount > 0) {
    repaired += ']'
    bracketCount--
  }
  while (braceCount > 0) {
    repaired += '}'
    braceCount--
  }

  return repaired
}

/**
 * Clean AI response text and parse as JSON
 * Handles markdown code blocks, truncation repair, etc.
 */
export const cleanAndParseJson = text => {
  if (!text) throw new Error('Empty AI response')

  let cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }

  if (isJsonTruncated(cleaned)) {
    logger.warn('AI response truncated, attempting repair')
    cleaned = repairTruncatedJson(cleaned)
  }

  return JSON.parse(cleaned)
}

/**
 * Validate pricing completeness - compare expected vs found entries
 * @param {object} structure - Extracted structure (periods, roomTypes, mealPlans)
 * @param {Array} pricing - Extracted pricing entries
 * @returns {object} { completeness, totalExpected, totalFound, missingEntries }
 */
export const validatePricingCompleteness = (structure, pricing) => {
  const periods = structure.periods || []
  const rooms = structure.roomTypes || []
  const meals = structure.mealPlans || []

  const totalExpected = periods.length * rooms.length * meals.length
  if (totalExpected === 0) {
    return { completeness: 100, totalExpected: 0, totalFound: 0, missingEntries: [] }
  }

  // Build a set of found combinations
  const foundSet = new Set()
  for (const p of pricing) {
    foundSet.add(`${p.periodCode}|${p.roomCode}|${p.mealPlanCode}`)
  }

  // Find missing combinations
  const missingEntries = []
  for (const period of periods) {
    for (const room of rooms) {
      const roomCode = room.contractCode || room.suggestedCode || room.contractName
      for (const meal of meals) {
        const mealCode = meal.contractCode || meal.suggestedCode || meal.contractName
        const key = `${period.code}|${roomCode}|${mealCode}`
        if (!foundSet.has(key)) {
          missingEntries.push({ periodCode: period.code, roomCode, mealPlanCode: mealCode })
        }
      }
    }
  }

  const totalFound = totalExpected - missingEntries.length
  const completeness = totalExpected > 0 ? Math.round((totalFound / totalExpected) * 100) : 100

  return { completeness, totalExpected, totalFound, missingEntries }
}
