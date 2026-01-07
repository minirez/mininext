import logger from '../../core/logger.js'
import { getAI, generateContent, GEMINI_MODEL } from './client.js'
import { preprocessRoomContent, isJsonTruncated, repairTruncatedJson } from './helpers.js'
import { JSDOM } from 'jsdom'

/**
 * Fetch URL content using HTTP with browser-like headers
 * This is a fallback for when Firecrawl is not available and Gemini direct fails
 */
const fetchUrlContent = async (url, options = {}) => {
  const { progress } = options

  try {
    logger.info('Fetching URL content with HTTP: ' + url)

    // Fetch with browser-like headers to bypass basic bot protection
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      redirect: 'follow',
      timeout: 30000 // 30 seconds
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    logger.info(`Fetched ${html.length} characters from ${url}`)

    // Parse HTML and extract text content
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Remove script and style tags
    const scripts = document.querySelectorAll('script, style, noscript')
    scripts.forEach(script => script.remove())

    // Get text content
    const textContent = document.body.textContent || ''

    // Extract meta description
    const metaDescription =
      document.querySelector('meta[name="description"]')?.getAttribute('content') || ''

    // Extract all image URLs
    const images = Array.from(document.querySelectorAll('img'))
      .map(img => img.src)
      .filter(src => src && (src.startsWith('http') || src.startsWith('//')))
      .map(src => (src.startsWith('//') ? 'https:' + src : src))

    // Combine content
    const combinedContent = `
URL: ${url}
Meta Description: ${metaDescription}

${textContent}

Images found: ${images.join('\n')}
    `.trim()

    logger.info(
      `Extracted content: ${combinedContent.length} chars, ${images.length} images from ${url}`
    )

    return {
      success: true,
      content: combinedContent,
      images: images.slice(0, 100), // Limit to first 100 images
      textLength: textContent.length
    }
  } catch (error) {
    logger.error(`Failed to fetch URL with HTTP: ${error.message}`)
    throw error
  }
}

/**
 * Extract hotel data from text, URL content, or document using Gemini AI
 * Returns structured JSON matching the hotel schema with confidence scores
 * Includes retry logic for truncated responses
 */
export const extractHotelData = async (content, contentType = 'text', retryCount = 0) => {
  const MAX_RETRIES = 2

  if (!content || content.trim() === '') {
    throw new Error('Content is required')
  }

  // Pre-process content to extract room information
  const preprocessed = preprocessRoomContent(content)
  const roomHintsSection = preprocessed.roomHints ? `\n${preprocessed.roomHints}\n` : ''

  logger.info(
    `Preprocessed: ${preprocessed.roomNames?.length || 0} rooms found, ${preprocessed.totalImages || 0} images (${preprocessed.propertyImageCount || 0} property + ${preprocessed.roomImageCount || 0} room)`
  )

  const prompt = `Sen bir otel veri cikarma uzmanisin. Asagidaki ${contentType === 'url' ? 'web sayfasi iceriginden' : contentType === 'pdf' ? 'PDF dökümandan' : 'metinden'} otel bilgilerini cikar ve JSON formatinda döndür.

ÖNEMLI KURALLAR:
1. SADECE gecerli JSON döndür, baska bir sey ekleme
2. Bulamadigin alanlari bos string "" veya null olarak birak
3. Her alan icin confidence (güven) skoru ekle (0-100 arasi)
4. Coklu dil alanlarinda Türkce (tr) ve Ingilizce (en) icin deger ver, digerlerini bos birak
5. amenities ve profile.features icin sadece belirtilen enum degerlerini kullan
6. Koordinatlari ondalikli sayi olarak ver (örn: 36.8523)
7. Resimleri cikarirken: sadece otel fotograflarini al (banner, icon, reklam resimlerini alma), TAM URL kullan (https://... ile baslamali), en az 5-10 resim bul

OTEL VERI SEMASI:

{
  "name": "Otel adi (string)",
  "description": {
    "tr": "Türkce aciklama",
    "en": "English description"
  },
  "stars": 5,
  "type": "hotel|apart|boutique|resort|hostel|villa|guesthouse|motel|pension|camping",
  "category": "economy|standard|superior|deluxe|luxury|ultra-luxury",
  "address": {
    "street": "Sokak/Cadde",
    "district": "Ilce",
    "city": "Sehir",
    "country": "Ülke",
    "postalCode": "Posta kodu",
    "coordinates": {
      "lat": 36.8523,
      "lng": 30.7233
    }
  },
  "contact": {
    "phone": "+90 xxx",
    "email": "email@hotel.com",
    "website": "https://...",
    "fax": "+90 xxx"
  },
  "amenities": [
    "wifi", "parking", "freeParking", "valetParking",
    "pool", "indoorPool", "outdoorPool", "spa", "gym", "sauna", "hammam",
    "restaurant", "bar", "roomService", "breakfast",
    "reception24h", "concierge", "laundry", "dryCleaning", "airportShuttle",
    "businessCenter", "meetingRooms", "conferenceHall",
    "kidsClub", "playground", "babysitting",
    "beachAccess", "privateBeach", "garden", "terrace",
    "wheelchairAccessible", "elevator",
    "petFriendly", "smokingArea", "nonSmoking",
    "casino", "nightclub", "cinema", "gameRoom",
    "tennis", "golf", "diving", "surfing", "skiing"
  ],
  "roomConfig": {
    "totalRooms": 100,
    "floors": 5,
    "hasElevator": true
  },
  "policies": {
    "checkIn": "14:00",
    "checkOut": "12:00",
    "maxBabyAge": 2,
    "maxChildAge": 12,
    "childPolicy": { "tr": "...", "en": "..." },
    "petPolicy": { "tr": "...", "en": "..." }
  },
  "profile": {
    "overview": {
      "content": { "tr": "...", "en": "..." },
      "establishedYear": 2010,
      "renovationYear": 2023,
      "chainBrand": "Marka adi"
    },
    "facilities": {
      "content": { "tr": "...", "en": "..." },
      "features": ["wifi", "freeWifi", "parking", "freeParking", "reception24h", "concierge", "elevator", "airConditioning", "laundry", "garden", "terrace"]
    },
    "dining": {
      "content": { "tr": "...", "en": "..." },
      "features": ["mainRestaurant", "alacarteRestaurant", "buffetRestaurant", "snackBar", "poolBar", "beachBar", "lobbyBar", "roomService", "minibar"],
      "restaurants": [{ "name": "...", "cuisine": "...", "reservationRequired": false }]
    },
    "sportsEntertainment": {
      "content": { "tr": "...", "en": "..." },
      "features": ["fitness", "tennis", "volleyball", "waterSports", "animation", "liveMusic", "disco"]
    },
    "spaWellness": {
      "content": { "tr": "...", "en": "..." },
      "features": ["spa", "hammam", "sauna", "jacuzzi", "massage"]
    },
    "familyKids": {
      "content": { "tr": "...", "en": "..." },
      "features": ["kidsClub", "playground", "babyPool", "kidsPool", "waterSlides", "babysitting", "kidsMenu"],
      "kidsClubAges": { "min": 4, "max": 12 }
    },
    "beachPool": {
      "content": { "tr": "...", "en": "..." },
      "features": ["privateBeach", "sandyBeach", "sunbeds", "outdoorPool", "indoorPool", "kidsPool", "waterSlides"],
      "beachDetails": { "distance": 0, "type": "sand|pebble|platform|mixed", "length": 500 },
      "pools": [{ "type": "outdoor|indoor|kids", "heated": false, "dimensions": "25x12m" }]
    },
    "honeymoon": {
      "content": { "tr": "...", "en": "..." },
      "features": ["romanticRoomDecoration", "champagne", "romanticDinner", "couplesSpa"],
      "available": true
    },
    "location": {
      "content": { "tr": "...", "en": "..." },
      "distances": [
        { "place": "Havalimani", "distance": 45, "unit": "km" },
        { "place": "Sehir merkezi", "distance": 10, "unit": "km" },
        { "place": "Plaj", "distance": 0, "unit": "m" }
      ]
    }
  },
  "images": [
    {
      "url": "https://hotel.com/full-path/image.jpg (tam URL, relative path degil)",
      "alt": "Resim aciklamasi",
      "category": "exterior|lobby|room|pool|beach|restaurant|spa|garden|other"
    }
  ],
  "logo": "https://hotel.com/logo.png (otel logosu tam URL, varsa)",
  "roomTemplates": [
    {
      "code": "STD|DLX|STE|FAM|SGL|DBL|TWN|SUITE|BUNG|VILLA (ÖNEMLI: maksimum 10 karakter)",
      "name": { "tr": "Standart Oda", "en": "Standard Room" },
      "description": { "tr": "Oda aciklamasi", "en": "Room description" },
      "images": [
        { "url": "https://hotel.com/room1-image1.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image2.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image3.jpg", "caption": { "tr": "", "en": "" } }
      ],
      "amenities": [
        "wifi", "airConditioning", "heating", "tv", "satelliteTV", "smartTV", "minibar", "refrigerator", "kettle", "coffeeMachine",
        "privateBathroom", "bathtub", "shower", "rainShower", "jacuzzi", "hairdryer", "toiletries", "bathrobes", "slippers",
        "seaView", "poolView", "gardenView", "cityView", "mountainView", "balcony", "terrace", "privatePool",
        "safe", "desk", "sofa", "wardrobe", "ironingEquipment", "soundproofing",
        "roomService", "dailyHousekeeping", "wheelchairAccessible", "connectedRooms", "nonSmoking", "petFriendly"
      ],
      "size": 25,
      "bedConfiguration": [
        { "type": "single|double|queen|king|twin|sofa|bunk|extra", "count": 1 }
      ],
      "occupancy": {
        "maxAdults": 2,
        "maxChildren": 2,
        "totalMaxGuests": 4
      }
    }
  ],

ÖNEMLI - Kapasite Limitleri:
- maxAdults: 1-30 arası (standart oda: 2-4, suite: 6-8, villa: 10-20, büyük villa/malikane: 20-30)
- maxChildren: 0-20 arası
- maxInfants: 0-10 arası
- totalMaxGuests: maxAdults + maxChildren + maxInfants toplamı, maksimum 50
  "confidence": {
    "name": 95,
    "description": 80,
    "stars": 100,
    "address": 90,
    "contact": 85,
    "amenities": 75,
    "profile": 70,
    "images": 60,
    "roomTemplates": 70
  }
}

ODA SABLONLARI TALIMATLARI (COK ÖNEMLI!):
- "BULUNAN ODA TIPLERI" bölümünde listelenen TÜM odalari cikar - HICBIRINI ATLAMA!
- Her oda icin BENZERSIZ kod kullan (ayni kodu iki odada kullanma!)
- KRITIK: Oda kodlari MAKSIMUM 10 KARAKTER olmali! (ör: STD, DLX, DELUXE, SUITE, VILLA gibi kisa kodlar)
- Oda olanaklarini (amenities) sadece yukaridaki listeden sec
- Oda boyutunu (m2), yatak tipini ve kapasiteyi cikar

GÖRSEL ATAMA KURALLARI (EN ÖNEMLI!):
- "OTEL GÖRSELLERI" bölümündeki görseller -> "images" dizisine (havuz, restoran, lobi, dis cephe)
- "ODA GÖRSELLERI" bölümündeki görseller -> "roomTemplates[].images" dizisine
- OTEL görsellerini ODA görsellerine KARISTIRMA!
- URL'de "etsrooms" gecen görseller SADECE odalara ait - "images" dizisine KOYMA!
- URL'de "hotelImages" gecen görseller SADECE otele ait - "roomTemplates" icine KOYMA!
- Her oda grubundaki TÜM görselleri ilgili odaya ekle
- Navbar, icon, banner, logo, sosyal medya görsellerini KULLANMA

${roomHintsSection}

ICERIK:
"""
${content}
"""

Sadece JSON döndür:`

  try {
    // Use higher token limit for comprehensive extraction
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 65536 // Maximum for Gemini
    })

    if (!responseText) {
      throw new Error('No response received from AI')
    }

    logger.info(`Gemini raw response length: ${responseText.length} chars`)

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // Try to extract JSON if there's extra text
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0]
    }

    // Check if response is truncated
    if (isJsonTruncated(cleanedResponse)) {
      logger.warn(
        `Gemini response appears truncated (${cleanedResponse.length} chars), retry ${retryCount + 1}/${MAX_RETRIES}`
      )

      if (retryCount < MAX_RETRIES) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractHotelData(content, contentType, retryCount + 1)
      }

      // Last resort: try to repair truncated JSON by closing brackets
      logger.warn('Max retries reached, attempting to repair truncated JSON')
      cleanedResponse = repairTruncatedJson(cleanedResponse)
    }

    try {
      const parsed = JSON.parse(cleanedResponse)
      logger.info(
        'Hotel data extraction completed - fields: ' +
          Object.keys(parsed).length +
          ', rooms: ' +
          (parsed.roomTemplates?.length || 0)
      )
      return {
        success: true,
        data: parsed
      }
    } catch (parseError) {
      logger.error('Failed to parse AI response: ' + cleanedResponse.substring(0, 500))

      // If we haven't exhausted retries, try again
      if (retryCount < MAX_RETRIES) {
        logger.info(`Retrying due to parse error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)))
        return extractHotelData(content, contentType, retryCount + 1)
      }

      return {
        success: false,
        error: 'AI yaniti parse edilemedi',
        rawResponse: cleanedResponse.substring(0, 1000)
      }
    }
  } catch (error) {
    logger.error('Hotel data extraction error: ' + error.message)

    // Retry on network/API errors
    if (
      retryCount < MAX_RETRIES &&
      (error.message.includes('timeout') || error.message.includes('network'))
    ) {
      logger.info(`Retrying due to error, attempt ${retryCount + 2}/${MAX_RETRIES + 1}`)
      await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)))
      return extractHotelData(content, contentType, retryCount + 1)
    }

    throw error
  }
}

/**
 * Fetch URL content using Firecrawl and extract hotel data with Gemini
 * Firecrawl crawls multiple pages (about, rooms, facilities, etc.) for comprehensive data
 * @param {string} url - Hotel URL to extract data from
 * @param {object} options - Options including progress emitter
 * @param {ProgressEmitter} options.progress - Optional progress emitter for real-time updates
 */
export const extractHotelDataFromUrl = async (url, options = {}) => {
  const { progress } = options

  if (!url || !url.trim()) {
    throw new Error('URL is required')
  }

  const client = await getAI()
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured. Please configure it in Platform Settings.')
  }

  // Initialize progress steps if emitter provided
  if (progress) {
    progress.setSteps([
      { id: 'init', label: { tr: 'Baslatiliyor', en: 'Initializing' } },
      { id: 'crawl', label: { tr: 'Web sayfasi taraniyor', en: 'Crawling web page' } },
      { id: 'preprocess', label: { tr: 'Icerik ön isleniyor', en: 'Preprocessing content' } },
      { id: 'extract', label: { tr: 'AI ile veri cikariliyor', en: 'Extracting data with AI' } },
      { id: 'validate', label: { tr: 'Veriler dogrulaniyor', en: 'Validating data' } }
    ])
    progress.startStep('init', { url })
  }

  let webContent = null
  let crawledPages = []

  // Try Firecrawl first for better content extraction
  try {
    const firecrawl = await import('../firecrawlService.js')

    if (await firecrawl.isConfigured()) {
      logger.info('Using Firecrawl to crawl hotel website: ' + url)

      if (progress) {
        progress.completeStep('init')
        progress.startStep('crawl', { method: 'firecrawl', maxPages: 12 })
      }

      const crawlResult = await firecrawl.smartFetch(url, {
        maxPages: 12,
        onPageScraped: pageInfo => {
          // Emit progress for each scraped page
          if (progress) {
            progress.updateStep('crawl', {
              currentPage: pageInfo.url,
              pagesScraped: pageInfo.index + 1,
              totalChars: pageInfo.totalChars,
              imagesFound: pageInfo.imagesFound
            })
          }
        }
      })

      if (crawlResult && crawlResult.success && crawlResult.content) {
        webContent = crawlResult.content
        crawledPages = crawlResult.pages || []
        logger.info(`Firecrawl success: ${crawledPages.length} pages, ${webContent.length} chars`)

        if (progress) {
          progress.completeStep('crawl', {
            pagesScraped: crawledPages.length,
            totalChars: webContent.length,
            uniqueImages: crawlResult.uniqueImages || 0
          })
        }
      }
    }
  } catch (firecrawlError) {
    logger.warn('Firecrawl failed, will use Gemini direct: ' + firecrawlError.message)
    if (progress) {
      progress.updateStep('crawl', { error: firecrawlError.message, fallback: true })
    }
  }

  // If we have content from Firecrawl, use extractHotelData with that content
  if (webContent && webContent.length > 500) {
    logger.info('Extracting hotel data from Firecrawl content')

    if (progress) {
      progress.startStep('preprocess')
    }

    // Pre-process to get room hints
    const preprocessed = preprocessRoomContent(webContent)

    if (progress) {
      progress.completeStep('preprocess', {
        roomsFound: preprocessed.roomNames?.length || 0,
        imagesFound: preprocessed.totalImages || 0,
        roomNames: preprocessed.roomNames || []
      })
      progress.startStep('extract', { method: 'firecrawl_content' })
    }

    const result = await extractHotelData(webContent, 'url', 0, progress)

    if (result.success) {
      if (progress) {
        progress.completeStep('extract', {
          fieldsExtracted: Object.keys(result.data).length,
          roomTemplates: result.data.roomTemplates?.length || 0
        })
        progress.startStep('validate')
        progress.completeStep('validate', {
          valid: true,
          roomCodes: result.data.roomTemplates?.map(r => r.code) || []
        })
        progress.complete({
          success: true,
          hotelName: result.data.name,
          roomCount: result.data.roomTemplates?.length || 0,
          imageCount: result.data.images?.length || 0
        })
      }

      return {
        ...result,
        sourceUrl: url,
        crawledPages: crawledPages
      }
    }
  }

  // Try HTTP fetch fallback before Gemini direct
  try {
    logger.info('Trying HTTP fetch fallback: ' + url)

    if (progress) {
      if (!progress.steps.find(s => s.id === 'crawl')?.status) {
        progress.completeStep('init')
      }
      progress.startStep('crawl', { method: 'http_fetch' })
    }

    const fetchResult = await fetchUrlContent(url, { progress })

    if (fetchResult.success && fetchResult.content && fetchResult.content.length > 500) {
      logger.info(
        `HTTP fetch success: ${fetchResult.textLength} chars, ${fetchResult.images.length} images`
      )

      if (progress) {
        progress.completeStep('crawl', {
          method: 'http_fetch',
          textLength: fetchResult.textLength,
          imagesFound: fetchResult.images.length
        })
        progress.startStep('preprocess')
      }

      // Pre-process to get room hints
      const preprocessed = preprocessRoomContent(fetchResult.content)

      if (progress) {
        progress.completeStep('preprocess', {
          roomsFound: preprocessed.roomNames?.length || 0,
          imagesFound: preprocessed.totalImages || 0,
          roomNames: preprocessed.roomNames || []
        })
        progress.startStep('extract', { method: 'http_fetch_content' })
      }

      const result = await extractHotelData(fetchResult.content, 'url', 0, progress)

      if (result.success) {
        if (progress) {
          progress.completeStep('extract', {
            fieldsExtracted: Object.keys(result.data).length,
            roomTemplates: result.data.roomTemplates?.length || 0
          })
          progress.startStep('validate')
          progress.completeStep('validate', {
            valid: true,
            roomCodes: result.data.roomTemplates?.map(r => r.code) || []
          })
          progress.complete({
            success: true,
            method: 'http_fetch',
            hotelName: result.data.name,
            roomCount: result.data.roomTemplates?.length || 0,
            imageCount: result.data.images?.length || 0
          })
        }

        return {
          ...result,
          sourceUrl: url,
          method: 'http_fetch'
        }
      }
    }
  } catch (httpError) {
    logger.warn('HTTP fetch fallback failed: ' + httpError.message)
    if (progress) {
      progress.updateStep('crawl', { httpError: httpError.message, fallback: true })
    }
  }

  // Last Fallback: Use Gemini's direct URL reading capability
  logger.info('Falling back to Gemini direct URL reading (last resort): ' + url)

  if (progress) {
    if (!progress.steps.find(s => s.id === 'crawl')?.status) {
      progress.completeStep('init')
    }
    progress.startStep('crawl', { method: 'gemini_direct' })
  }

  const prompt = `Sen bir otel veri cikarma uzmanisin. Bu web sayfasindan otel bilgilerini cikar ve JSON formatinda döndür.

ÖNEMLI KURALLAR:
1. SADECE gecerli JSON döndür, baska bir sey ekleme
2. Bulamadigin alanlari bos string "" veya null olarak birak
3. Her alan icin confidence (güven) skoru ekle (0-100 arasi)
4. Coklu dil alanlarinda - sayfanin dilinde icerik var ise o dile yaz, yoksa Türkce ve Ingilizce icin tahmin et
5. amenities ve profile.features icin sadece belirtilen enum degerlerini kullan
6. Koordinatlari ondalikli sayi olarak ver (örn: 36.8523)
7. Resimleri cikarirken: sadece otel fotograflarini al (banner, icon, reklam resimlerini alma), TAM URL kullan (https://... ile baslamali), en az 5-10 resim bul

OTEL VERI SEMASI:

{
  "name": "Otel adi (string)",
  "description": {
    "tr": "Türkce aciklama",
    "en": "English description"
  },
  "stars": 5,
  "type": "hotel|apart|boutique|resort|hostel|villa|guesthouse|motel|pension|camping",
  "category": "economy|standard|superior|deluxe|luxury|ultra-luxury",
  "address": {
    "street": "Sokak/Cadde",
    "district": "Ilce",
    "city": "Sehir",
    "country": "Ülke",
    "postalCode": "Posta kodu",
    "coordinates": {
      "lat": 36.8523,
      "lng": 30.7233
    }
  },
  "contact": {
    "phone": "+90 xxx",
    "email": "email@hotel.com",
    "website": "https://...",
    "fax": "+90 xxx"
  },
  "amenities": [
    "wifi", "parking", "freeParking", "valetParking",
    "pool", "indoorPool", "outdoorPool", "spa", "gym", "sauna", "hammam",
    "restaurant", "bar", "roomService", "breakfast",
    "reception24h", "concierge", "laundry", "dryCleaning", "airportShuttle",
    "businessCenter", "meetingRooms", "conferenceHall",
    "kidsClub", "playground", "babysitting",
    "beachAccess", "privateBeach", "garden", "terrace",
    "wheelchairAccessible", "elevator",
    "petFriendly", "smokingArea", "nonSmoking",
    "casino", "nightclub", "cinema", "gameRoom",
    "tennis", "golf", "diving", "surfing", "skiing"
  ],
  "roomConfig": {
    "totalRooms": 100,
    "floors": 5,
    "hasElevator": true
  },
  "policies": {
    "checkIn": "14:00",
    "checkOut": "12:00",
    "maxBabyAge": 2,
    "maxChildAge": 12,
    "childPolicy": { "tr": "...", "en": "..." },
    "petPolicy": { "tr": "...", "en": "..." }
  },
  "profile": {
    "overview": {
      "content": { "tr": "...", "en": "..." },
      "establishedYear": 2010,
      "renovationYear": 2023,
      "chainBrand": "Marka adi"
    },
    "facilities": {
      "content": { "tr": "...", "en": "..." },
      "features": ["wifi", "freeWifi", "parking", "freeParking", "reception24h", "concierge", "elevator", "airConditioning", "laundry", "garden", "terrace"]
    },
    "dining": {
      "content": { "tr": "...", "en": "..." },
      "features": ["mainRestaurant", "alacarteRestaurant", "buffetRestaurant", "snackBar", "poolBar", "beachBar", "lobbyBar", "roomService", "minibar"],
      "restaurants": [{ "name": "...", "cuisine": "...", "reservationRequired": false }]
    },
    "sportsEntertainment": {
      "content": { "tr": "...", "en": "..." },
      "features": ["fitness", "tennis", "volleyball", "waterSports", "animation", "liveMusic", "disco"]
    },
    "spaWellness": {
      "content": { "tr": "...", "en": "..." },
      "features": ["spa", "hammam", "sauna", "jacuzzi", "massage"]
    },
    "familyKids": {
      "content": { "tr": "...", "en": "..." },
      "features": ["kidsClub", "playground", "babyPool", "kidsPool", "waterSlides", "babysitting", "kidsMenu"],
      "kidsClubAges": { "min": 4, "max": 12 }
    },
    "beachPool": {
      "content": { "tr": "...", "en": "..." },
      "features": ["privateBeach", "sandyBeach", "sunbeds", "outdoorPool", "indoorPool", "kidsPool", "waterSlides"],
      "beachDetails": { "distance": 0, "type": "sand|pebble|platform|mixed", "length": 500 },
      "pools": [{ "type": "outdoor|indoor|kids", "heated": false, "dimensions": "25x12m" }]
    },
    "honeymoon": {
      "content": { "tr": "...", "en": "..." },
      "features": ["romanticRoomDecoration", "champagne", "romanticDinner", "couplesSpa"],
      "available": true
    },
    "location": {
      "content": { "tr": "...", "en": "..." },
      "distances": [
        { "place": "Havalimani", "distance": 45, "unit": "km" },
        { "place": "Sehir merkezi", "distance": 10, "unit": "km" },
        { "place": "Plaj", "distance": 0, "unit": "m" }
      ]
    }
  },
  "images": [
    {
      "url": "https://hotel.com/full-path/image.jpg (tam URL, relative path degil)",
      "alt": "Resim aciklamasi",
      "category": "exterior|lobby|room|pool|beach|restaurant|spa|garden|other"
    }
  ],
  "logo": "https://hotel.com/logo.png (otel logosu tam URL, varsa)",
  "roomTemplates": [
    {
      "code": "STD|DLX|STE|FAM|SGL|DBL|TWN|SUITE|BUNG|VILLA (ÖNEMLI: maksimum 10 karakter)",
      "name": { "tr": "Standart Oda", "en": "Standard Room" },
      "description": { "tr": "Oda aciklamasi", "en": "Room description" },
      "images": [
        { "url": "https://hotel.com/room1-image1.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image2.jpg", "caption": { "tr": "", "en": "" } },
        { "url": "https://hotel.com/room1-image3.jpg", "caption": { "tr": "", "en": "" } }
      ],
      "amenities": [
        "wifi", "airConditioning", "heating", "tv", "satelliteTV", "smartTV", "minibar", "refrigerator", "kettle", "coffeeMachine",
        "privateBathroom", "bathtub", "shower", "rainShower", "jacuzzi", "hairdryer", "toiletries", "bathrobes", "slippers",
        "seaView", "poolView", "gardenView", "cityView", "mountainView", "balcony", "terrace", "privatePool",
        "safe", "desk", "sofa", "wardrobe", "ironingEquipment", "soundproofing",
        "roomService", "dailyHousekeeping", "wheelchairAccessible", "connectedRooms", "nonSmoking", "petFriendly"
      ],
      "size": 25,
      "bedConfiguration": [
        { "type": "single|double|queen|king|twin|sofa|bunk|extra", "count": 1 }
      ],
      "occupancy": {
        "maxAdults": 2,
        "maxChildren": 2,
        "totalMaxGuests": 4
      }
    }
  ],

ÖNEMLI - Kapasite Limitleri:
- maxAdults: 1-30 arası (standart oda: 2-4, suite: 6-8, villa: 10-20, büyük villa/malikane: 20-30)
- maxChildren: 0-20 arası
- maxInfants: 0-10 arası
- totalMaxGuests: maxAdults + maxChildren + maxInfants toplamı, maksimum 50
  "confidence": {
    "name": 95,
    "description": 80,
    "stars": 100,
    "address": 90,
    "contact": 85,
    "amenities": 75,
    "profile": 70,
    "images": 60,
    "roomTemplates": 70
  }
}

ODA SABLONLARI TALIMATLARI (ÖNEMLI!):
- Otel web sitesinden TÜM oda tiplerini cikar (en az 3-5 farkli oda tipi bul)
- Her oda tipi icin: kod, isim, aciklama bul
- KRITIK: Oda kodlari MAKSIMUM 10 KARAKTER olmali! Kisa ve anlamli kodlar kullan (ör: STD, DLX, SUITE, FAMILY, VILLA)
- ÖNEMLI: Her oda tipi icin TÜM görselleri al (oda basina 5-10 görsel olabilir). Galeri, slider veya fotograf koleksiyonundaki tüm resimleri dahil et!
- Oda görsellerini oda tipine göre grupla (sadece o odaya ait fotograflari al)
- Oda olanaklarini (amenities) sadece yukaridaki listeden sec
- Oda boyutunu (m2), yatak tipini ve kapasiteyi cikar
- Oda tipleri genellikle "Odalar", "Rooms", "Accommodation", "Oda Tipleri" gibi sayfalarda bulunur

Sadece JSON döndür:`

  try {
    // Use Gemini's URL fetching capability as fallback with retry
    const MAX_DIRECT_RETRIES = 2

    if (progress) {
      progress.updateStep('crawl', { usingGeminiDirect: true })
    }

    for (let attempt = 0; attempt <= MAX_DIRECT_RETRIES; attempt++) {
      try {
        if (progress && attempt > 0) {
          progress.updateStep('crawl', { retry: attempt })
        }

        const response = await client.models.generateContentStream({
          model: GEMINI_MODEL,
          config: {
            temperature: 0.1,
            maxOutputTokens: 65536 // Maximum for comprehensive extraction
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  fileData: {
                    fileUri: url,
                    mimeType: 'text/html'
                  }
                },
                { text: prompt }
              ]
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
          // Update progress every 50 chunks
          if (progress && chunkCount % 50 === 0) {
            progress.updateStep('crawl', { chunks: chunkCount, chars: fullText.length })
          }
        }

        logger.info(
          `Gemini direct response - chunks: ${chunkCount}, length: ${fullText.length} chars`
        )

        if (progress) {
          progress.completeStep('crawl', { chunks: chunkCount, chars: fullText.length })
          progress.startStep('preprocess')
          progress.completeStep('preprocess', { method: 'gemini_direct' })
          progress.startStep('extract')
        }

        if (!fullText) {
          throw new Error('No response received from AI')
        }

        // Clean up response
        let cleanedResponse = fullText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0]
        }

        // Check for truncation
        if (isJsonTruncated(cleanedResponse)) {
          if (attempt < MAX_DIRECT_RETRIES) {
            logger.warn(`Gemini direct response truncated (attempt ${attempt + 1}), retrying...`)
            if (progress) {
              progress.updateStep('extract', { truncated: true, retry: attempt + 1 })
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)))
            continue
          }
          // Last attempt - try to repair
          logger.warn('Max retries reached for Gemini direct, attempting to repair JSON')
          cleanedResponse = repairTruncatedJson(cleanedResponse)
        }

        const parsed = JSON.parse(cleanedResponse)
        logger.info(
          'Hotel data extraction from URL completed (Gemini direct) - rooms: ' +
            (parsed.roomTemplates?.length || 0)
        )

        if (progress) {
          progress.completeStep('extract', {
            roomTemplates: parsed.roomTemplates?.length || 0,
            images: parsed.images?.length || 0
          })
          progress.startStep('validate')
          progress.completeStep('validate', {
            valid: true,
            roomCodes: parsed.roomTemplates?.map(r => r.code) || []
          })
          progress.complete({
            success: true,
            hotelName: parsed.name,
            roomCount: parsed.roomTemplates?.length || 0,
            imageCount: parsed.images?.length || 0
          })
        }

        return {
          success: true,
          data: parsed,
          sourceUrl: url
        }
      } catch (parseError) {
        if (attempt < MAX_DIRECT_RETRIES && parseError.message?.includes('JSON')) {
          logger.warn(`JSON parse error on attempt ${attempt + 1}, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)))
          continue
        }
        throw parseError
      }
    }

    // Should not reach here, but fallback
    if (progress) {
      progress.fail('AI yaniti parse edilemedi (tüm denemeler basarisiz)')
    }
    return {
      success: false,
      error: 'AI yaniti parse edilemedi (tüm denemeler basarisiz)'
    }
  } catch (error) {
    logger.error('Hotel data extraction from URL error: ' + error.message)
    if (progress) {
      progress.fail(error.message)
    }
    throw error
  }
}
