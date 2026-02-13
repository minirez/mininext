/**
 * PaymentPos static configuration data
 * Extracted from PaymentPos.vue to reduce file size
 */

// Logo path helpers - public klasöründen doğrudan erişim
export function getBankLogo(bankCode) {
  return `/logos/banks/${bankCode}.png`
}

export function getCardLogo(cardCode) {
  return `/logos/cards/${cardCode}.png`
}

export function getAssociationLogo(code) {
  return `/logos/associations/${code}.png`
}

// 3D Secure model options (3D is always active, just choose the model)
export const secureModels = {
  '3d': {
    code: '3d',
    name: '3D Secure',
    description: 'Kart bilgileri sizde, 3D dogrulama bankada'
  },
  '3d_pay': {
    code: '3d_pay',
    name: '3D Pay',
    description: 'Kart bilgileri ve 3D dogrulama bankada'
  },
  '3d_host': {
    code: '3d_host',
    name: '3D Host',
    description: 'Tum islem bankada yapilir (Isbank Bolum)'
  }
}

// For backward compatibility display
export const paymentModels = {
  ...secureModels,
  regular: {
    code: 'regular',
    name: 'Direkt Odeme',
    description: '3D guvenlik dogrulamasi olmadan'
  }
}

// Currency options
export const currencies = [
  { code: 'try', name: 'Turk Lirasi', symbol: '₺' },
  { code: 'usd', name: 'Amerikan Dolari', symbol: '$' },
  { code: 'eur', name: 'Euro', symbol: '€' },
  { code: 'gbp', name: 'Ingiliz Sterlini', symbol: '£' }
]

// Fallback banks list (used if API fails)
export const defaultBanks = [
  // Banka POS'ları
  {
    code: 'garanti',
    name: 'Garanti BBVA',
    color: '#00854a',
    provider: 'garanti',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'akbank',
    name: 'Akbank',
    color: '#e31e24',
    provider: 'akbank',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', 'regular']
  },
  {
    code: 'ykb',
    name: 'Yapi Kredi',
    color: '#004b93',
    provider: 'ykb',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'isbank',
    name: 'Is Bankasi',
    color: '#004990',
    provider: 'payten',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', '3d_host', 'regular']
  },
  {
    code: 'halkbank',
    name: 'Halkbank',
    color: '#00528e',
    provider: 'payten',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'ziraat',
    name: 'Ziraat Bankasi',
    color: '#e30613',
    provider: 'payten',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'vakifbank',
    name: 'VakifBank',
    color: '#fdc600',
    provider: 'vakifbank',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'teb',
    name: 'TEB',
    color: '#00529b',
    provider: 'payten',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'qnb',
    name: 'QNB Finansbank',
    color: '#5c068c',
    provider: 'qnb',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'denizbank',
    name: 'Denizbank',
    color: '#003b73',
    provider: 'denizbank',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'ingbank',
    name: 'ING Bank',
    color: '#ff6200',
    provider: 'payten',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'sekerbank',
    name: 'Sekerbank',
    color: '#ed1c24',
    provider: 'payten',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', '3d_pay', 'regular']
  },
  {
    code: 'kuveytturk',
    name: 'Kuveyt Turk',
    color: '#00a651',
    provider: 'kuveytturk',
    providerSupported: true,
    isAggregator: false,
    supportedPaymentModels: ['3d', 'regular']
  },
  // Entegratorler (Aggregators)
  {
    code: 'paytr',
    name: 'PayTR',
    color: '#2c3e50',
    provider: 'paytr',
    providerSupported: true,
    isAggregator: true,
    supportedPaymentModels: ['3d']
  },
  {
    code: 'iyzico',
    name: 'iyzico',
    color: '#1e64ff',
    provider: 'iyzico',
    providerSupported: true,
    isAggregator: true,
    supportedPaymentModels: ['3d', 'regular']
  },
  {
    code: 'sigmapay',
    name: 'SigmaPay',
    color: '#6366f1',
    provider: 'sigmapay',
    providerSupported: true,
    isAggregator: true,
    supportedPaymentModels: ['regular']
  }
]

// Provider-specific credential field configurations
export const providerCredentials = {
  garanti: {
    merchantId: {
      label: 'Uye Isyeri No (MID)',
      placeholder: 'Banka tarafindan verilen uye isyeri numarasi'
    },
    terminalId: { label: 'Terminal ID (TID)', placeholder: 'Banka tarafindan verilen terminal ID' },
    username: { label: 'Kullanici Adi', placeholder: 'API kullanici adi (PROVAUT)', show: false },
    password: { label: 'Provision Sifresi', placeholder: 'Provizyon sifresi' },
    secretKey: { label: '3D Store Key', placeholder: '3D islemler icin guvenlik anahtari' }
  },
  payten: {
    merchantId: { label: 'Client ID', placeholder: 'NestPay/EST client ID' },
    terminalId: { label: 'Terminal ID', placeholder: 'Terminal numarasi', show: false },
    username: { label: 'API Kullanici Adi', placeholder: 'API kullanici adi' },
    password: { label: 'API Sifresi', placeholder: 'API sifresi' },
    secretKey: { label: 'Store Key', placeholder: '3D guvenlik anahtari (ISLEMLER_HASH_KEY)' },
    section: {
      label: 'BOLUM (Sube Kodu)',
      placeholder: 'Opsiyonel - Girilirse 3D islemlerinde kullanilir',
      show: true
    }
  },
  ykb: {
    merchantId: { label: 'Uye Isyeri No (MID)', placeholder: 'Uye isyeri numarasi' },
    terminalId: { label: 'Terminal ID (TID)', placeholder: 'Terminal numarasi' },
    username: { label: 'POSNET Kullanici Adi', placeholder: 'POSNET kullanici adi' },
    password: { label: 'POSNET Sifresi', placeholder: 'POSNET sifresi' },
    secretKey: { label: 'Enc Key (Sifreleme Anahtari)', placeholder: 'POSNET sifreleme anahtari' },
    posnetId: { label: 'POSNET ID', placeholder: 'POSNET entegrasyon ID', show: true }
  },
  akbank: {
    merchantId: { label: 'Merchant Safe ID', placeholder: 'Merchant Safe ID' },
    terminalId: { label: 'Terminal Safe ID', placeholder: 'Terminal Safe ID' },
    username: { label: 'API Kullanici Adi', placeholder: 'API kullanici adi', show: false },
    password: { label: 'API Sifresi', placeholder: 'API sifresi', show: false },
    secretKey: { label: 'Secret Key', placeholder: 'HMAC Secret Key' }
  },
  vakifbank: {
    merchantId: { label: 'Uye Isyeri No', placeholder: 'Uye isyeri numarasi' },
    terminalId: { label: 'Terminal ID', placeholder: 'Terminal numarasi' },
    username: { label: 'Kullanici Adi', placeholder: 'API kullanici adi', show: false },
    password: { label: 'Sifre', placeholder: 'API sifresi' },
    secretKey: { label: 'Store Key', placeholder: '3D guvenlik anahtari' }
  },
  qnb: {
    merchantId: { label: 'Client ID', placeholder: 'EST client ID' },
    terminalId: { label: 'Terminal ID', placeholder: 'Terminal numarasi', show: false },
    username: { label: 'API Kullanici Adi', placeholder: 'API kullanici adi' },
    password: { label: 'API Sifresi', placeholder: 'API sifresi' },
    secretKey: { label: 'Store Key', placeholder: '3D guvenlik anahtari' }
  },
  denizbank: {
    merchantId: { label: 'Shop Code', placeholder: 'Magaza kodu' },
    terminalId: { label: 'Terminal ID', placeholder: 'Terminal numarasi', show: false },
    username: { label: 'Kullanici Kodu', placeholder: 'InterPOS kullanici kodu' },
    password: { label: 'Kullanici Sifresi', placeholder: 'InterPOS sifresi' },
    secretKey: { label: '3D Store Key', placeholder: '3D guvenlik anahtari' }
  },
  kuveytturk: {
    merchantId: { label: 'Magaza Kodu', placeholder: 'Katilim bankasi magaza kodu' },
    terminalId: { label: 'Musteri Numarasi', placeholder: 'Musteri numarasi' },
    username: { label: 'Kullanici Adi', placeholder: 'API kullanici adi' },
    password: { label: 'API Sifresi', placeholder: 'API sifresi' },
    secretKey: { label: 'Store Key', placeholder: 'Guvenlik anahtari', show: false }
  },
  paytr: {
    merchantId: { label: 'Magaza Numarasi', placeholder: 'PayTR magaza numarasi (Merchant ID)' },
    terminalId: { label: 'Terminal ID', placeholder: '', show: false },
    username: { label: 'Kullanici Adi', placeholder: '', show: false },
    password: { label: 'Merchant Salt', placeholder: 'PayTR Merchant Salt' },
    secretKey: { label: 'Merchant Key', placeholder: 'PayTR Merchant Key' }
  },
  iyzico: {
    merchantId: { label: 'API Key', placeholder: 'iyzico API anahtari' },
    terminalId: { label: 'Terminal ID', placeholder: '', show: false },
    username: { label: 'Kullanici Adi', placeholder: '', show: false },
    password: { label: 'Sifre', placeholder: '', show: false },
    secretKey: { label: 'Secret Key', placeholder: 'iyzico Secret Key' }
  },
  sigmapay: {
    merchantId: { label: 'Client ID', placeholder: 'SigmaPay client ID' },
    terminalId: { label: 'Terminal ID', placeholder: '', show: false },
    username: { label: 'Kullanici Adi', placeholder: '', show: false },
    password: { label: 'Secret Key 2', placeholder: 'SigmaPay Secret Key 2' },
    secretKey: { label: 'Secret Key 1', placeholder: 'SigmaPay Secret Key 1' }
  }
}

// IP address tips for specific banks
export const ipAddressTips = {
  garanti: {
    type: 'warning',
    icon: 'router',
    title: 'IP Adresi Ayari Gerekli',
    message: 'Garanti Bankasinda IP adresi POS yonetici ekranindan degistirilmelidir.'
  },
  ykb: {
    type: 'info',
    icon: 'support_agent',
    title: 'IP Adresi Bildirimi',
    message: 'Yapi Kredi Bankasinda IP adresi sanal pos destege bildirilmelidir.'
  },
  qnb: {
    type: 'info',
    icon: 'support_agent',
    title: 'IP Adresi Bildirimi',
    message: "QNB Finansbank'ta IP adresi sanal pos destege bildirilmelidir."
  }
}

// Bank to card family mapping
export const bankCardFamilies = {
  garanti: { code: 'bonus', name: 'Bonus' },
  ykb: { code: 'world', name: 'World' },
  akbank: { code: 'axess', name: 'Axess' },
  isbank: { code: 'maximum', name: 'Maximum' },
  qnb: { code: 'cardfinans', name: 'CardFinans' },
  halkbank: { code: 'paraf', name: 'Paraf' },
  ziraat: { code: 'bankkart', name: 'Bankkart Combo' },
  vakifbank: { code: 'world', name: 'World' },
  teb: { code: 'bonus', name: 'Bonus' },
  denizbank: { code: 'bonus', name: 'Bonus' },
  ingbank: { code: 'bonus', name: 'Bonus' },
  sekerbank: { code: 'bonus', name: 'Bonus' },
  kuveytturk: { code: 'senyap', name: 'Senyap' },
  // Aggregators - tum kartlari destekler
  paytr: { code: 'all', name: 'Tum Kartlar' },
  iyzico: { code: 'all', name: 'Tum Kartlar' },
  sigmapay: { code: 'all', name: 'Tum Kartlar' }
}

// Modal tab definitions
export const modalTabs = [
  { id: 'general', label: 'Genel Bilgiler', icon: 'info' },
  { id: 'credentials', label: 'POS Bilgileri', icon: 'key' },
  { id: 'installment', label: 'Taksit Ayarlari', icon: 'calendar_month' },
  { id: 'commissions', label: 'Komisyon Oranlari', icon: 'percent' }
]
