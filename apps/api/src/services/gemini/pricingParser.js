import logger from '../../core/logger.js'
import { generateContent } from './client.js'

/**
 * Parse a natural language pricing command using Gemini AI
 */
export const parsePricingCommand = async (command, context = {}) => {
  if (!command || command.trim() === '') {
    throw new Error('Command is required')
  }

  const today = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()

  // Build context string for AI
  const roomTypesStr =
    context.roomTypes
      ?.map(rt => {
        const statusTag = rt.status === 'inactive' ? ' [inaktif]' : ''
        return `${rt.code}: ${rt.name}${statusTag}`
      })
      .join(', ') || 'Belirtilmemis'
  const mealPlansStr =
    context.mealPlans?.map(mp => `${mp.code}: ${mp.name}`).join(', ') || 'Belirtilmemis'
  const seasonsStr =
    context.seasons
      ?.map(s => {
        const startDate = s.dateRanges?.[0]?.startDate
          ? new Date(s.dateRanges[0].startDate).toISOString().split('T')[0]
          : ''
        const endDate = s.dateRanges?.[0]?.endDate
          ? new Date(s.dateRanges[0].endDate).toISOString().split('T')[0]
          : ''
        return `${s.code}: ${s.name} (${startDate} - ${endDate})`
      })
      .join(', ') || 'Belirtilmemis'

  // Build current month context
  let currentMonthStr = ''
  if (context.currentMonth?.year && context.currentMonth?.month) {
    const monthNames = [
      'Ocak',
      'Subat',
      'Mart',
      'Nisan',
      'Mayis',
      'Haziran',
      'Temmuz',
      'Agustos',
      'Eylül',
      'Ekim',
      'Kasim',
      'Aralik'
    ]
    const monthName = monthNames[context.currentMonth.month - 1]
    currentMonthStr = `${monthName} ${context.currentMonth.year}`
  }

  logger.info('AI Context - Seasons: ' + seasonsStr)
  logger.info('AI Context - RoomTypes: ' + roomTypesStr)
  logger.info('AI Context - MealPlans: ' + mealPlansStr)
  logger.info('AI Context - Current Month: ' + currentMonthStr)

  // Build the current month date range for the prompt
  let currentMonthDateRange = ''
  if (context.currentMonth?.year && context.currentMonth?.month) {
    const year = context.currentMonth.year
    const month = context.currentMonth.month
    const lastDay = new Date(year, month, 0).getDate()
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    currentMonthDateRange = `${startDate} ile ${endDate} arasi`
  }

  // Build selection context string for AI
  let selectionStr = ''
  if (context.selectionContext) {
    const sel = context.selectionContext
    selectionStr = `
###############################################
# SECILI HÜCRELER (KULLANICI TARAFINDAN SECILDI!)
# Hücre Sayisi: ${sel.count}
# Tarih Araligi: ${sel.startDate} - ${sel.endDate}
# Odalar: ${sel.roomTypes?.join(', ') || 'Tümü'}
# Pansiyonlar: ${sel.mealPlans?.join(', ') || 'Tümü'}
###############################################
`
    logger.info('AI Context - Selection: ' + JSON.stringify(sel))
  }

  const prompt = `Otel fiyatlandirma asistanisin. Komutu JSON'a cevir.

Bugün: ${today}
${
  currentMonthStr
    ? `
###############################################
# EKRANDA GÖRÜNTÜLENEN AY: ${currentMonthStr}
# TARIH ARALIGI: ${currentMonthDateRange}
# "asagidaki" = BU AY = ${currentMonthStr}
###############################################
`
    : ''
}${selectionStr}
Odalar: ${roomTypesStr}
Pansiyonlar: ${mealPlansStr}
Sezonlar: ${seasonsStr}

Komut: "${command}"

JSON formati (SADECE JSON döndür):
{
  "success": true,
  "actions": [{"action": "ACTION", "filters": {"roomTypes": "all", "mealPlans": "all", "daysOfWeek": "all"}, "value": 100, "valueType": "percentage"}],
  "dateRange": {"startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"},
  "summary": {"tr": "...", "en": "..."}
}

ACTION: stop_sale, open_sale, single_stop, open_single, set_price, update_price, update_single_supplement, update_extra_adult, update_extra_child, update_child_order_pricing, update_allotment, update_min_stay, update_max_stay, close_to_arrival, close_to_departure

EK YETISKIN/COCUK FIYATI (COK ÖNEMLI!):
- "ek yetiskin", "ekstra yetiskin", "extra adult" -> update_extra_adult
- "ek cocuk", "ekstra cocuk", "extra child" -> update_extra_child veya update_child_order_pricing
- "tek kisi farki", "single supplement" -> update_single_supplement
- Bu action'lar icin value: fiyat (sayi), valueType: "fixed" (varsayilan) veya "percentage"
- "1. cocuk", "birinci cocuk", "ilk cocuk" -> update_child_order_pricing, childIndex: 1
- "2. cocuk", "ikinci cocuk" -> update_child_order_pricing, childIndex: 2

CTA/CTD KURALLARI (COK ÖNEMLI!):
- close_to_arrival (CTA) ve close_to_departure (CTD) icin value: true veya false OLMALI
- "CTA/CTD kaldir", "CTA/CTD ac", "CTA/CTD iptal" -> value: false (kisitlamayi KALDIR)
- "CTA/CTD ekle", "CTA/CTD uygula", "CTA/CTD kapat" -> value: true (kisitlama EKLE)
- "bütün ctd'leri kaldir" = close_to_departure, value: false
- "girise kapat" = close_to_arrival, value: true
- "cikisa ac" = close_to_departure, value: false

SECILI HÜCRELER (EN ÖNCELIKLI!):
- "secili", "secilen", "secilmis", "isaretli", "isaretlenen" kelimelerinden BIRI VARSA VE SECILI HÜCRELER VARSA:
  -> MUTLAKA secili hücrelerin tarih araligini kullan!
  -> filters.roomTypes = secili odalar
  -> filters.mealPlans = secili pansiyonlar
  -> Kullanici takvimden sectigi günlere islem uygulamak istiyor!
- SECILI HÜCRELER YOKSA ve "secili" denirse -> Hata döndür: {"success":false,"error":"Secili hücre yok. Önce takvimden hücre secin."}

TARIH BELIRLEME (COK ÖNEMLI!):
- "asagidaki", "asagida", "bu ay", "görüntülenen", "ekrandaki", "su anki", "mevcut" kelimelerinden BIRI VARSA:
  -> MUTLAKA ${currentMonthStr ? `${currentMonthStr} (${currentMonthDateRange.replace(' ile ', ' - ').replace(' arasi', '')})` : 'Görüntülenen ayi'} kullan!
  -> SEZON KULLANMA! Sadece görüntülenen ayin tarihlerini kullan!
- SADECE "sezon" veya "tüm sezon" denirse -> Sezonlar listesinden tarihleri al
- Tarih belirtilmemisse -> ${currentMonthStr ? currentMonthStr : 'Görüntülenen ayi kullan'}

GÜN FILTRESI (daysOfWeek - SADECE STRING!):
- "haftasonu", "weekend", "cmt paz", "cumartesi pazar" -> ["saturday", "sunday"]
- "haftaici", "weekday" -> ["monday", "tuesday", "wednesday", "thursday", "friday"]
- "cuma", "friday" -> ["friday"]
- "pazartesi sali" -> ["monday", "tuesday"]
- Belirtilmemisse -> "all"

ISLEM TIPI:
- Yeni fiyat: set_price (value: sabit TL)
- Zam/indirim: update_price (valueType: "percentage" veya "fixed")
- Stop: stop_sale, Ac: open_sale
- Single Stop: single_stop (tek kisi satisi kapat), open_single (tek kisi satisi ac)
- Pansiyon farki: set_supplement

DIGER:
- Birden fazla islem -> actions dizisine hepsini ekle
- summary gelecek zamanda: "uygulanacak", "girilecek"
- [inaktif] odalar dahil

ÖRNEK 1 - "asagidaki haftasonlarina %10 zam" (Görüntülenen: ${currentMonthStr || 'Haziran 2026'}):
NOT: "asagidaki" dedigi icin SEZON DEGIL, görüntülenen ayi kullandik!
{"success":true,"actions":[{"action":"update_price","filters":{"roomTypes":"all","mealPlans":"all","daysOfWeek":["saturday","sunday"]},"value":10,"valueType":"percentage"}],"dateRange":{"startDate":"${context.currentMonth ? `${context.currentMonth.year}-${String(context.currentMonth.month).padStart(2, '0')}-01` : '2026-06-01'}","endDate":"${context.currentMonth ? `${context.currentMonth.year}-${String(context.currentMonth.month).padStart(2, '0')}-${new Date(context.currentMonth.year, context.currentMonth.month, 0).getDate()}` : '2026-06-30'}"},"summary":{"tr":"${currentMonthStr || 'Haziran 2026'} haftasonlarina %10 zam uygulanacak","en":"..."}}

ÖRNEK 2 - "tüm sezon icin fiyatlari güncelle":
NOT: "sezon" dedigi icin Sezonlar listesinden tarih aldik!
{"success":true,"actions":[{"action":"update_price",...}],"dateRange":{"startDate":"2026-04-01","endDate":"2026-10-31"},...}

ÖRNEK 3 - "secili günlere stop cek" (SECILI HÜCRELER: 2026-06-15 - 2026-06-20, Odalar: STD, DBL, Pansiyonlar: AI):
NOT: "secili" dedigi icin SECILI HÜCRELERIN tarih araligini ve filtrelerini kullandik!
{"success":true,"actions":[{"action":"stop_sale","filters":{"roomTypes":["STD","DBL"],"mealPlans":["AI"],"daysOfWeek":"all"},"value":true}],"dateRange":{"startDate":"2026-06-15","endDate":"2026-06-20"},"summary":{"tr":"Secili 6 hücreye stop sale uygulanacak","en":"Stop sale will be applied to 6 selected cells"}}

ÖRNEK 4 - "DFV odasina 5-10 mayis arasi ek yetiskin 200 euro, ek cocuk 100 euro":
NOT: Birden fazla islem oldugu icin actions dizisine hepsini ekledik!
{"success":true,"actions":[{"action":"update_extra_adult","filters":{"roomTypes":["DFV"],"mealPlans":"all","daysOfWeek":"all"},"value":200,"valueType":"fixed"},{"action":"update_child_order_pricing","filters":{"roomTypes":["DFV"],"mealPlans":"all","daysOfWeek":"all"},"value":100,"valueType":"fixed","childIndex":1}],"dateRange":{"startDate":"2026-05-05","endDate":"2026-05-10"},"summary":{"tr":"DFV odasina 5-10 Mayis arasi ek yetiskin 200€, 1. cocuk 100€ olarak ayarlanacak","en":"DFV room will have extra adult 200€, 1st child 100€ for May 5-10"}}

ÖRNEK 5 - "tüm odalara tek kisi farki 50 euro":
{"success":true,"actions":[{"action":"update_single_supplement","filters":{"roomTypes":"all","mealPlans":"all","daysOfWeek":"all"},"value":50,"valueType":"fixed"}],"dateRange":{"startDate":"...","endDate":"..."},"summary":{"tr":"Tüm odalara tek kisi farki 50€ olarak girilecek","en":"Single supplement will be set to 50€ for all rooms"}}`

  try {
    const responseText = await generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 65536,
      thinkingLevel: 'low'
    })

    if (!responseText) {
      throw new Error('No response received from AI')
    }

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

    try {
      const parsed = JSON.parse(cleanedResponse)
      logger.info('AI parsed response: ' + JSON.stringify(parsed))
      return parsed
    } catch (parseError) {
      logger.error('Failed to parse AI response: ' + cleanedResponse)
      return {
        success: false,
        error: 'AI yaniti parse edilemedi',
        rawResponse: cleanedResponse.substring(0, 500)
      }
    }
  } catch (error) {
    logger.error('AI parsing error: ' + error.message)
    throw error
  }
}
