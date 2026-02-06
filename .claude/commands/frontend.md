# Frontend Yapısı Rehberi

Bu komut Vue 3 frontend yapısı hakkında bilgi sağlar.

---

## Dizin Yapısı

```
apps/admin/src/
├── assets/              # Statik dosyalar
├── components/          # Reusable componentler
│   ├── ui/              # Base UI componentler
│   ├── common/          # Ortak componentler
│   └── booking/         # Booking-specific
├── composables/         # Vue composables
├── constants/           # Sabitler
├── features/            # Feature-based components
├── layouts/             # Layout templates
├── locales/             # i18n (tr, en)
├── modules/             # Module-based organization
│   └── shared/          # PMS shared components
├── router/              # Vue Router
├── services/            # API clients
├── stores/              # Pinia stores
├── types/               # JSDoc type definitions
├── utils/               # Utility functions
└── views/               # Page components
```

---

## Service Listesi

### Core Services
| Service | Dosya | Satır | Açıklama |
|---------|-------|-------|----------|
| bookingService | `services/bookingService.js` | 278 | Rezervasyon API |
| hotelService | `services/hotelService.js` | 593 | Otel API |
| tourService | `services/tourService.js` | 444 | Tur API |
| paymentService | `services/paymentService.js` | 295 | Ödeme API |
| partnerService | `services/partnerService.js` | - | Partner API |
| agencyService | `services/agencyService.js` | - | Acente API |

### Planning Services
| Service | Açıklama |
|---------|----------|
| rateService | Rate plan yönetimi |
| roomTypeService | Oda tipi yönetimi |
| contractService | Kontrat yönetimi |
| pricingService | Fiyatlandırma |
| allotmentService | Kontenjan |
| restrictionService | Kısıtlamalar |

### Integration Services
| Service | Açıklama |
|---------|----------|
| virtualPosService | Sanal POS |
| paximumService | Paximum entegrasyonu |
| locationService | Konum servisi |
| translationService | Çeviri servisi |

---

## Store Listesi (Pinia)

| Store | Dosya | Satır | Açıklama |
|-------|-------|-------|----------|
| booking | `stores/booking.js` | 606 | Rezervasyon state |
| tour | `stores/tour.js` | 700 | Tur state |
| payment | `stores/payment.js` | 288 | Ödeme state |
| auth | `stores/auth.js` | 224 | Auth state |
| hotel | `stores/hotel.js` | - | Otel state |
| partner | `stores/partner.js` | - | Partner state |
| notification | `stores/notification.js` | - | Bildirim state |

### Booking Store Modülleri
```
stores/booking.js (ana)
├── stores/booking/cartActions.js
├── stores/booking/searchActions.js
├── stores/booking/draftActions.js
└── stores/booking/paximumActions.js
```

---

## UI Componentler

### Base UI (`components/ui/`)
| Component | Açıklama |
|-----------|----------|
| BaseButton | Temel buton |
| IconButton | Icon buton |
| ActionMenu | Dropdown menu |
| Modal | Modal dialog |
| Drawer | Yan panel |
| Tooltip | Tooltip |
| Alert | Uyarı mesajı |
| ConfirmDialog | Onay dialog |
| Spinner | Loading spinner |
| StatusBadge | Durum badge |
| Avatar | Avatar |
| Timeline | Zaman çizelgesi |
| DataTable | Veri tablosu |

### Form Components
| Component | Açıklama |
|-----------|----------|
| PhoneInput | Telefon input |
| PasswordInput | Şifre input |
| Toggle | On/off switch |
| DateRangePicker | Tarih aralığı |
| MultiLangInput | Çok dilli input |

### Common Components (`components/common/`)
| Component | Açıklama |
|-----------|----------|
| HotelSelector | Otel seçici |
| PartnerSelector | Partner seçici |
| DocumentUpload | Dosya yükleme |
| LanguageSelector | Dil seçici |

---

## i18n Kullanımı

### Dosyalar
```
locales/
├── tr/
│   ├── common.json
│   ├── booking.json
│   ├── hotel.json
│   └── ...
└── en/
    ├── common.json
    ├── booking.json
    ├── hotel.json
    └── ...
```

### Kullanım
```vue
<template>
  {{ $t('booking.status.confirmed') }}
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
console.log(t('common.save'))
</script>
```

---

## URL Helper'lar

```javascript
// apps/admin/src/utils/imageUrl.js

// API dosyaları için (avatar, document)
import { getFileUrl } from '@/utils/imageUrl'
const url = getFileUrl('/uploads/avatars/xxx.png')

// Avatar için
import { getAvatarUrl } from '@/utils/imageUrl'
const url = getAvatarUrl(user) // user.avatar?.url

// CDN resimleri için
import { getImageUrl } from '@/utils/imageUrl'
const url = getImageUrl(hotel.mainImage)
```

---

## Type Tanımları (JSDoc)

```javascript
// apps/admin/src/types/index.js

/** @type {import('@/types').User} */
const user = authStore.user

/** @type {import('@/types').Partner} */
const partner = data.partner

// Mevcut tipler:
// User, Partner, Agency, Session
// Avatar, Address, Document
// ApiResponse, PaginatedResponse
```

---

## Composables

| Composable | Açıklama |
|------------|----------|
| usePmsContextInjection | PMS context (hotelId) |
| useAuth | Auth state & methods |
| useNotification | Toast notifications |
| useConfirm | Confirmation dialogs |
| useDebounce | Debounce helper |

### Örnek Kullanım
```vue
<script setup>
import { usePmsContextInjection } from '@/composables/usePmsContext'

const { hotelId, currentHotel } = usePmsContextInjection()
// Tüm PMS sorgularında hotelId kullan
</script>
```

---

## Booking Wizard

### Adımlar
```
Step1Search → Step2Rooms → Step3Guests → Step4Payment → Step5Summary
```

### Componentler
```
components/booking/wizard/
├── Step1Search.vue
├── Step2Rooms.vue
├── Step3Guests.vue
├── Step4Payment.vue
├── Step5Summary.vue
├── CreditCardPaymentOptions.vue
└── PaymentMethodSelector.vue
```

---

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_CDN_URL=https://cdn.maxirez.com
```

```javascript
// Kullanım
const apiUrl = import.meta.env.VITE_API_BASE_URL
```
