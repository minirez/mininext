/**
 * Multiplier Utils
 * OBP (Occupancy Based Pricing) çarpan sistemi için yardımcı fonksiyonlar
 */

/**
 * Varsayılan yetişkin çarpanlarını oluştur
 * @param {number} maxAdults - Maksimum yetişkin sayısı
 * @param {number} baseOccupancy - Baz doluluk (genellikle 2)
 * @param {number} minAdults - Minimum yetişkin sayısı (varsayılan 1)
 * @returns {Object} { 1: 0.8, 2: 1.0, 3: 1.2, ... }
 */
export function generateDefaultAdultMultipliers(maxAdults, baseOccupancy = 2, minAdults = 1) {
  const multipliers = {}

  for (let i = minAdults; i <= maxAdults; i++) {
    if (i < baseOccupancy) {
      // Baz altı: azalan (her kişi için -0.2)
      // Örnek: baseOccupancy=2 ise, 1 kişi = 1.0 - 0.2 = 0.8
      multipliers[i] = Math.round((1 - (baseOccupancy - i) * 0.2) * 100) / 100
    } else if (i === baseOccupancy) {
      // Baz: 1.0
      multipliers[i] = 1.0
    } else {
      // Baz üstü: artan (her kişi için +0.2)
      // Örnek: baseOccupancy=2 ise, 3 kişi = 1.0 + 0.2 = 1.2
      multipliers[i] = Math.round((1 + (i - baseOccupancy) * 0.2) * 100) / 100
    }
  }

  return multipliers
}

/**
 * Varsayılan çocuk çarpanlarını oluştur
 * @param {number} maxChildren - Maksimum çocuk sayısı
 * @param {Array} ageGroups - Yaş grupları [{code: 'infant', ...}, {code: 'first', ...}]
 * @returns {Object} { 1: { infant: 0, first: 0, second: 0 }, 2: {...}, ... }
 */
export function generateDefaultChildMultipliers(maxChildren, ageGroups) {
  const multipliers = {}

  for (let childOrder = 1; childOrder <= maxChildren; childOrder++) {
    multipliers[childOrder] = {}

    for (const ageGroup of ageGroups) {
      // Varsayılan: tüm çocuklar 0 çarpan (ücretsiz)
      // İlk çocuk genelde ücretsiz, sonrakiler ücretli olabilir
      // Kullanıcı bunu değiştirebilir
      multipliers[childOrder][ageGroup.code] = 0
    }
  }

  return multipliers
}

/**
 * Kombinasyon anahtarı oluştur
 * @param {number} adults - Yetişkin sayısı
 * @param {Array} children - Çocuk listesi [{order: 1, ageGroup: 'infant'}, ...]
 * @returns {string} Örnek: "1", "2", "1+1_infant", "2+2_first_second"
 */
export function generateCombinationKey(adults, children = []) {
  if (children.length === 0) {
    return adults.toString()
  }

  const childPart = children
    .sort((a, b) => a.order - b.order)
    .map(c => c.ageGroup)
    .join('_')

  return `${adults}+${children.length}_${childPart}`
}

/**
 * Kombinasyon adı oluştur (UI için)
 * @param {number} adults - Yetişkin sayısı
 * @param {Array} children - Çocuk listesi
 * @param {Array} ageGroups - Yaş grupları (name bilgisi için)
 * @param {string} locale - Dil kodu
 * @returns {string} Örnek: "Tek Kişilik", "2+1 (Bebek)", "2+2 (Çocuk, Çocuk)"
 */
export function generateCombinationName(adults, children = [], ageGroups = [], locale = 'tr') {
  // Yaş grubu adlarını map'e çevir
  const ageGroupNames = {}
  ageGroups.forEach(ag => {
    ageGroupNames[ag.code] = ag.name?.[locale] || ag.name?.tr || ag.code
  })

  // Sadece yetişkinler
  if (children.length === 0) {
    if (adults === 1) return locale === 'tr' ? 'Tek Kişilik' : 'Single'
    if (adults === 2) return locale === 'tr' ? 'Çift Kişilik' : 'Double'
    return locale === 'tr' ? `${adults} Yetişkin` : `${adults} Adults`
  }

  // Yetişkin + Çocuk
  const childNames = children
    .sort((a, b) => a.order - b.order)
    .map(c => ageGroupNames[c.ageGroup] || c.ageGroup)

  return `${adults}+${children.length} (${childNames.join(', ')})`
}

/**
 * Kombinasyon çarpanını hesapla
 * @param {number} adults - Yetişkin sayısı
 * @param {Array} children - Çocuk listesi
 * @param {Object} adultMultipliers - Yetişkin çarpanları
 * @param {Object} childMultipliers - Çocuk çarpanları
 * @returns {number} Hesaplanan çarpan
 */
export function calculateCombinationMultiplier(
  adults,
  children,
  adultMultipliers,
  childMultipliers
) {
  // Yetişkin çarpanı
  const adultMult = adultMultipliers[adults] || 1

  // Çocuk çarpanları toplamı
  let childMult = 0
  for (const child of children) {
    const orderMults = childMultipliers[child.order]
    if (orderMults) {
      childMult += orderMults[child.ageGroup] || 0
    }
  }

  // Toplam çarpan
  return Math.round((adultMult + childMult) * 100) / 100
}

/**
 * Çocuk kombinasyonlarını oluştur (recursive)
 * @param {number} count - Kaç çocuk
 * @param {Array} ageGroupCodes - Yaş grubu kodları ['infant', 'first', 'second']
 * @param {number} currentOrder - Mevcut çocuk sırası
 * @param {Array} currentChildren - Şu ana kadar oluşturulan çocuklar
 * @returns {Array} Tüm kombinasyonlar
 */
function generateChildCombinations(count, ageGroupCodes, currentOrder = 1, currentChildren = []) {
  if (currentChildren.length === count) {
    return [currentChildren]
  }

  const combinations = []

  for (const ageGroup of ageGroupCodes) {
    const newChild = { order: currentOrder, ageGroup }
    const newChildren = [...currentChildren, newChild]

    if (newChildren.length === count) {
      combinations.push(newChildren)
    } else {
      const subCombinations = generateChildCombinations(
        count,
        ageGroupCodes,
        currentOrder + 1,
        newChildren
      )
      combinations.push(...subCombinations)
    }
  }

  return combinations
}

/**
 * Tüm kombinasyon tablosunu oluştur
 * @param {Object} occupancy - { maxAdults, minAdults, maxChildren, totalMaxGuests, baseOccupancy }
 * @param {Array} ageGroups - Yaş grupları
 * @param {Object} adultMultipliers - Yetişkin çarpanları (opsiyonel, yoksa varsayılan oluşturulur)
 * @param {Object} childMultipliers - Çocuk çarpanları (opsiyonel, yoksa varsayılan oluşturulur)
 * @returns {Array} Kombinasyon tablosu
 */
export function generateCombinationTable(
  occupancy,
  ageGroups,
  adultMultipliers = null,
  childMultipliers = null
) {
  const { maxAdults, minAdults = 1, maxChildren, totalMaxGuests, baseOccupancy } = occupancy
  const ageGroupCodes = ageGroups.map(ag => ag.code)

  // Varsayılan çarpanlar
  if (!adultMultipliers) {
    adultMultipliers = generateDefaultAdultMultipliers(maxAdults, baseOccupancy, minAdults)
  }
  if (!childMultipliers) {
    childMultipliers = generateDefaultChildMultipliers(maxChildren, ageGroups)
  }

  const combinations = []

  // Her yetişkin sayısı için (minAdults'tan başla)
  for (let adults = minAdults; adults <= maxAdults; adults++) {
    // Sadece yetişkinler
    const adultOnlyKey = generateCombinationKey(adults, [])
    combinations.push({
      key: adultOnlyKey,
      adults,
      children: [],
      calculatedMultiplier: calculateCombinationMultiplier(
        adults,
        [],
        adultMultipliers,
        childMultipliers
      ),
      overrideMultiplier: null,
      isActive: true
    })

    // Yetişkin + çocuk kombinasyonları
    // ÖNEMLI: Yetişkin kapasitesi doluysa (adults === maxAdults), çocuk eklenemez
    if (adults >= maxAdults) {
      continue // Kapasite dolu, çocuk kombinasyonu oluşturma
    }

    const remainingCapacity = totalMaxGuests - adults
    const maxChildrenForThisAdult = Math.min(maxChildren, remainingCapacity)

    for (let childCount = 1; childCount <= maxChildrenForThisAdult; childCount++) {
      // Bu çocuk sayısı için tüm yaş grubu kombinasyonlarını oluştur
      const childCombinations = generateChildCombinations(childCount, ageGroupCodes)

      for (const children of childCombinations) {
        const key = generateCombinationKey(adults, children)
        const calculatedMultiplier = calculateCombinationMultiplier(
          adults,
          children,
          adultMultipliers,
          childMultipliers
        )

        combinations.push({
          key,
          adults,
          children,
          calculatedMultiplier,
          overrideMultiplier: null,
          isActive: true
        })
      }
    }
  }

  return combinations
}

/**
 * Çarpanları yeniden hesapla (yetişkin/çocuk çarpanları değiştiğinde)
 * Mevcut override'ları ve isActive durumlarını korur
 * @param {Array} existingTable - Mevcut kombinasyon tablosu
 * @param {Object} adultMultipliers - Yeni yetişkin çarpanları
 * @param {Object} childMultipliers - Yeni çocuk çarpanları
 * @returns {Array} Güncellenmiş kombinasyon tablosu
 */
export function recalculateCombinationTable(existingTable, adultMultipliers, childMultipliers) {
  return existingTable.map(combo => {
    const newCalculated = calculateCombinationMultiplier(
      combo.adults,
      combo.children,
      adultMultipliers,
      childMultipliers
    )

    return {
      ...combo,
      calculatedMultiplier: newCalculated
      // overrideMultiplier ve isActive korunur
    }
  })
}

/**
 * Efektif çarpanı al (override varsa onu, yoksa hesaplananı)
 * @param {Object} combination - Kombinasyon objesi
 * @returns {number|null} Çarpan değeri (isActive=false ise null)
 */
export function getEffectiveMultiplier(combination) {
  if (!combination.isActive) {
    return null // Satışa kapalı
  }

  if (combination.overrideMultiplier !== null && combination.overrideMultiplier !== undefined) {
    return combination.overrideMultiplier
  }

  return combination.calculatedMultiplier
}

/**
 * Fiyat hesapla
 * @param {number} basePrice - Baz fiyat (ppDbl - kişi başı double fiyat)
 * @param {number} multiplier - Çarpan
 * @param {string} roundingRule - Yuvarlama kuralı
 * @returns {number} Hesaplanan fiyat
 */
export function calculatePrice(basePrice, multiplier, roundingRule = 'none') {
  const rawPrice = basePrice * multiplier

  switch (roundingRule) {
    case 'nearest':
      return Math.round(rawPrice)
    case 'up':
      return Math.ceil(rawPrice)
    case 'down':
      return Math.floor(rawPrice)
    case 'nearest5':
      return Math.round(rawPrice / 5) * 5
    case 'nearest10':
      return Math.round(rawPrice / 10) * 10
    default:
      return rawPrice
  }
}

/**
 * Kombisanyon tablosunu doğrula
 * @param {Array} table - Kombinasyon tablosu
 * @param {number} minAdults - Minimum yetişkin sayısı (varsayılan 1)
 * @returns {Object} { isValid: boolean, errors: [] }
 */
export function validateCombinationTable(table, minAdults = 1) {
  const errors = []

  // En az bir aktif kombinasyon olmalı
  const activeCount = table.filter(c => c.isActive).length
  if (activeCount === 0) {
    errors.push('En az bir kombinasyon aktif olmalı')
  }

  // Çift kişilik (2 yetişkin) aktif olmalı (bu baz fiyat için gerekli)
  // Ancak minAdults > 2 ise bu kontrol atlanmalı
  if (minAdults <= 2) {
    const doubleCombo = table.find(c => c.adults === 2 && c.children.length === 0)
    if (doubleCombo && !doubleCombo.isActive) {
      errors.push('Çift kişilik (2 yetişkin) kombinasyonu aktif olmalı - bu baz fiyat referansıdır')
    }
  }

  // Override değerleri negatif olmamalı
  for (const combo of table) {
    if (combo.overrideMultiplier !== null && combo.overrideMultiplier < 0) {
      errors.push(`${combo.key} için negatif çarpan geçersiz`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export default {
  generateDefaultAdultMultipliers,
  generateDefaultChildMultipliers,
  generateCombinationKey,
  generateCombinationName,
  calculateCombinationMultiplier,
  generateCombinationTable,
  recalculateCombinationTable,
  getEffectiveMultiplier,
  calculatePrice,
  validateCombinationTable
}
