/**
 * Turkish Banks Constants
 * Bank codes, names and SWIFT codes for Turkey
 */

export const BANKS_TR = [
  { code: 'akbank', name: 'Akbank', swift: 'AKBKTRIS' },
  { code: 'denizbank', name: 'Denizbank', swift: 'DENITRIS' },
  { code: 'fibabanka', name: 'Fibabanka', swift: 'FBHLTRIS' },
  { code: 'garanti', name: 'Garanti BBVA', swift: 'TGBATRIS' },
  { code: 'halkbank', name: 'Halkbank', swift: 'TRHBTR2A' },
  { code: 'hsbc', name: 'HSBC', swift: 'HSBCTRIS' },
  { code: 'ing', name: 'ING Bank', swift: 'INGBTRIS' },
  { code: 'isbank', name: 'Türkiye İş Bankası', swift: 'ISBKTRIS' },
  { code: 'kuveytturk', name: 'Kuveyt Türk', swift: 'KTEFTRIS' },
  { code: 'odeabank', name: 'Odeabank', swift: 'ABORTR2I' },
  { code: 'qnb', name: 'QNB Finansbank', swift: 'FABORTR2' },
  { code: 'sekerbank', name: 'Şekerbank', swift: 'SABORTR2' },
  { code: 'teb', name: 'TEB', swift: 'TEBUTRIS' },
  { code: 'vakifbank', name: 'VakıfBank', swift: 'TVBATR2A' },
  { code: 'yapikredi', name: 'Yapı Kredi', swift: 'YAPITRIS' },
  { code: 'ziraat', name: 'Ziraat Bankası', swift: 'TCZBTR2A' },
  { code: 'albaraka', name: 'Albaraka Türk', swift: 'BTFHTRIS' },
  { code: 'turkiyefinans', name: 'Türkiye Finans', swift: 'AFKBTRIS' },
  { code: 'emlak', name: 'Emlak Katılım', swift: 'EMKLTRIS' },
  { code: 'other', name: 'Diğer', swift: '' }
]

/**
 * Get bank by code
 * @param {string} code
 * @returns {{ code: string, name: string, swift: string } | undefined}
 */
export function getBankByCode(code) {
  return BANKS_TR.find(b => b.code === code)
}

/**
 * Get bank options for select/combobox
 * @returns {{ value: string, label: string }[]}
 */
export function getBankOptions() {
  return BANKS_TR.map(b => ({ value: b.code, label: b.name }))
}
