# Booking Engine Project - Claude Documentation

## !! EN ONEMLI KURAL - COMPONENT TABANLI YAPI !!

**Bu proje COMPONENT TABANLI bir projedir!**

1. **Mevcut componentleri MUTLAKA kullan**: Yeni bir ozellik eklerken once `/admin/src/components/common/` klasorunu kontrol et
2. **Ayni isi yapan kodu tekrar yazma**: Eger bir component varsa, onu kullan. Sifirdan yazma!
3. **Mevcut common componentler**:
   - `MultiLangInput.vue` - Coklu dil input/textarea (ceviri butonu dahil)
   - `FormField.vue` - Validasyonlu form alani
   - `DatePicker.vue` - Tarih secici
   - `DateRangePicker.vue` - Tarih araligi secici
   - `Modal.vue` - Modal pencere
   - `DataTable.vue` - Tablo componenti
   - `StarSelector.vue` - Yildiz secici
   - `HotelSelector.vue` - Otel secici
   - `PartnerSelector.vue` - Partner secici
   - `LanguageSelector.vue` - Dil secici
   - `Lightbox.vue` - Resim/PDF onizleme

4. **Yeni component olusturma**: Eger benzer bir ihtiyac baska yerlerde de olacaksa, `/admin/src/components/common/` altina yeni component olustur

**YANLIS**: Her formda ayni coklu dil inputunu sifirdan yazmak
**DOGRU**: `<MultiLangInput v-model="form.name" :languages="SUPPORTED_LANGUAGES" />`

---

## Project Overview

Bu proje, seyahat acenteleri için bir rezervasyon motoru platformudur. Multi-tenant yapıda, platformda birden fazla partner (acente) bulunur ve her partner kendi B2C ve B2B sistemlerini yönetir.

### Temel Kavramlar

- **Platform Admin**: Tüm sistemi yöneten üst düzey admin
- **Partner**: Platformdaki her bir seyahat acentesi
- **B2C**: Partner'ların son kullanıcılara (müşterilere) satış yaptığı sistem
- **B2B**: Partner'ların diğer acentelere toptan satış yaptığı sistem (Extranet)

## Proje Yapısı

```
/var/www/mini/booking-engine/
├── admin/          # Vue.js frontend (Platform admin panel)
│   ├── src/
│   │   ├── components/     # Reusable Vue components
│   │   ├── views/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── locales/        # i18n translations (tr.json, en.json)
│   │   └── router/         # Vue router
│   └── package.json
│
└── api/            # Node.js/Express backend
    ├── src/
    │   ├── modules/        # Feature modules
    │   │   ├── auth/       # Authentication
    │   │   ├── partner/    # Partner management
    │   │   ├── agency/     # Agency management
    │   │   └── user/       # User management
    │   ├── helpers/        # Utility functions
    │   ├── middleware/     # Express middlewares
    │   └── config/         # Configuration files
    └── uploads/            # Uploaded files (static)
```

## Tech Stack

### Frontend (Admin Panel)
- **Framework**: Vue 3 (Composition API)
- **State Management**: Reactive refs
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **UI Components**: Custom components + Material Icons
- **Styling**: Tailwind CSS
- **i18n**: Vue I18n (Turkish/English)
- **Toast Notifications**: Vue Toastification
- **Build Tool**: Vite

### Backend (API)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Authentication**: JWT
- **File Upload**: Multer
- **Security**: Helmet, CORS
- **i18n**: i18next

## Önemli Özellikler

### 1. Component-Based Architecture
Proje component ağırlıklı olarak geliştirilmektedir. Her yeni özellik mümkün olduğunca ayrı bir component olarak yazılmalıdır.

**Örnek:**
- `DocumentUpload.vue`: Dosya yükleme işlemleri için reusable component
- `DataTable.vue`: Tablo görüntüleme için generic component
- `Modal.vue`: Modal pencereler için generic component
- `Lightbox.vue`: Resim ve PDF görüntüleme için lightbox component

### 2. Multi-language Support
Tüm metinler translation dosyalarında tanımlanmalıdır.

**Translation Files:**
- `/admin/src/locales/en.json`: English
- `/admin/src/locales/tr.json`: Turkish

**Kullanım:**
```vue
<template>
  <h1>{{ $t('partners.title') }}</h1>
</template>
```

### 3. Partner Management
Partner yönetimi sistemin temel modülüdür.

**Partner Model Fields:**
- `companyName`: Şirket adı
- `email`: İletişim e-postası
- `phone`: Telefon
- `taxOffice`: Vergi dairesi
- `taxNumber`: Vergi numarası
- `address`: Adres bilgileri (street, city, country, postalCode)
- `documents`: Yüklenen belgeler (array)
- `status`: Partner durumu (active/inactive/pending)

**Partner Documents:**
Her partner için belgeler yüklenebilir (Acente belgesi/Kokart):
- `type`: Belge tipi (license)
- `name`: Dosya adı
- `url`: Dosya yolu
- `uploadedAt`: Yüklenme tarihi

### 4. File Upload System
`/api/src/helpers/upload.js` dosyasında merkezi upload yapılandırması bulunur.

**Ayarlar:**
- Maksimum dosya boyutu: 5MB
- İzin verilen dosya tipleri: JPG, PNG, PDF, DOC, DOCX
- Upload dizini: `/uploads/partners/`
- **Güvenlik**: Dosyalar static olarak serve edilMEZ
- Authenticated endpoint: `GET /api/partners/:id/documents/:documentId/file`
- Sadece yetkili kullanıcılar (protect + requireAdmin middleware) belgelere erişebilir

**Frontend Component:** `DocumentUpload.vue`
- Drag & drop desteği
- Dosya seçme
- Yükleme progress
- Yüklenen belgeleri listeleme
- Belge görüntüleme/silme
- Lightbox ile önizleme

### 5. Lightbox Component
`/admin/src/components/Lightbox.vue`

**Özellikler:**
- Resim önizleme (JPG, PNG, GIF, WEBP)
- PDF görüntüleme (iframe ile)
- Tam ekran overlay
- ESC tuşu ile kapatma
- Overlay'e tıklayarak kapatma
- Dark mode desteği
- Responsive tasarım
- Document dosyaları için indirme butonu
- **Authenticated fetch**: Dosyaları API client ile (auth token ile) alır
- **Blob URL**: Güvenli dosya görüntüleme için blob URL kullanır
- **Memory management**: Close'da blob URL'leri revoke eder

**Kullanım:**
```vue
<Lightbox
  v-model="showLightbox"
  :url="apiEndpointUrl"
  :title="documentTitle"
/>
```

**Güvenlik:**
- img src'de doğrudan URL kullanmak yerine fetch API kullanır
- Authorization header otomatik eklenir (apiClient üzerinden)
- Blob URL oluşturur, memory'den temizler

### 6. Partner Context Reactivity (KURAL!)

**ÖNEMLİ:** Platform admin bir partner'ın ayarlarını görüntülerken ve partner değiştirdiğinde, ilgili view'ın verileri yeniden yüklenmesi **ZORUNLUDUR**.

**Composable:** `/admin/src/composables/usePartnerContext.js`

**Kullanım:**
```vue
<script setup>
import { usePartnerContext } from '@/composables/usePartnerContext'

const fetchData = async () => {
  // Veri yükleme işlemi
}

// Partner değiştiğinde otomatik olarak fetchData çağrılır
usePartnerContext({
  onPartnerChange: (partner) => {
    if (partner) {
      fetchData()
    }
  },
  immediate: true // İlk yüklemede de çağır
})
</script>
```

**Return değerleri:**
- `currentPartnerId`: Geçerli partner ID (computed)
- `currentPartner`: Geçerli partner objesi (computed)
- `hasPartner`: Partner seçili mi? (computed)
- `isViewingAsPartner`: Platform admin partner olarak mı görüntülüyor? (computed)
- `selectPartner(partner)`: Partner seç
- `clearPartner()`: Partner seçimini temizle

**Bu composable'ı kullanması gereken view'lar:**
- `SiteSettingsView.vue`
- `AgenciesView.vue`
- `AgencyUsersView.vue`
- Partner'a bağlı tüm diğer view'lar

### 7. AI Translation Service (Gemini)

Proje yapay zeka destekli çeviri özelliği içerir.

**Backend Service:** `/api/src/services/geminiService.js`
- `translateText(text, sourceLang, targetLang)`: Tek metin çevirisi
- `translateFields(fields, sourceLang, targetLangs)`: Çoklu alan çevirisi
- `batchTranslate(content, sourceLang, allLangs)`: Toplu çeviri

**API Endpoints:**
- `POST /api/translation/translate`: Tek metin
- `POST /api/translation/translate-fields`: Çoklu alan
- `POST /api/translation/batch`: Toplu
- `POST /api/translation/translate-seo`: SEO alanları

**Frontend Service:** `/admin/src/services/translationService.js`

**Desteklenen Diller (20):**
`tr`, `en`, `ru`, `el`, `de`, `es`, `it`, `fr`, `ro`, `bg`, `pt`, `da`, `zh`, `ar`, `fa`, `he`, `sq`, `uk`, `pl`, `az`

**Environment Variable:**
```
GEMINI_API_KEY=your-api-key
```

### 8. API Routes

#### Partners
```
GET    /api/partners                                 # List all partners
GET    /api/partners/:id                             # Get single partner
POST   /api/partners                                 # Create partner
PUT    /api/partners/:id                             # Update partner
DELETE /api/partners/:id                             # Delete partner
POST   /api/partners/:id/approve                     # Approve partner
POST   /api/partners/:id/upload                      # Upload document
DELETE /api/partners/:id/documents/:documentId       # Delete document
GET    /api/partners/:id/documents/:documentId/file  # Serve document (authenticated)
```

#### Authentication
```
POST /api/auth/login          # Login
POST /api/auth/register       # Partner registration
POST /api/auth/verify-2fa     # 2FA verification
GET  /api/auth/me             # Get current user
POST /api/auth/logout         # Logout
```

## Geliştirme Kuralları

### 1. Component Yazma
Yeni bir özellik eklerken:
- Mümkünse reusable bir component yap
- Props ve emits kullan
- Component'i `/admin/src/components/` altına koy
- Generic component'ler `/admin/src/components/common/` altında

### 2. Service Functions
Backend API çağrıları için service kullan:
```javascript
// /admin/src/services/partnerService.js
const createPartner = async (data) => {
  const response = await apiClient.post('/partners', data)
  return response.data
}
```

### 3. Error Handling
- Backend'de custom error class'ları kullan (NotFoundError, BadRequestError)
- Frontend'de try-catch ve toast notification kullan
- Kullanıcıya anlamlı hata mesajları göster

### 4. Translation Keys
Yeni özellik eklerken:
1. `en.json` ve `tr.json` dosyalarına key'leri ekle
2. Nested yapı kullan (örn: `partners.documentUpload`)
3. Template'de `$t('key')` ile kullan

### 5. Form Validation
- Backend'de mongoose schema validation
- Frontend'de basic validation
- Required field'ler için UI feedback

## Deployment

### Development
```bash
# Backend (Port 4000)
cd /var/www/mini/booking-engine/api
npm install
npm run dev

# Frontend (Port 5174)
cd /var/www/mini/booking-engine/admin
npm install
npm run dev
```

### Environment Variables
`.env` dosyası gerekli:
```
MONGODB_URI=mongodb://localhost:27017/booking-engine
JWT_SECRET=your-secret-key
PORT=4000
NODE_ENV=development
```

## Gelecek Geliştirmeler

### Planlanan Modüller
1. **B2C Site Setup**: Partner'ların kendi booking sitelerini yapılandırmaları
   - Domain ayarları
   - Branding (logo, renkler, tema)
   - SEO ayarları

2. **Hotel Management**: Otel yönetimi
   - Otel ekleme/düzenleme
   - Oda tipleri
   - Fiyatlandırma

3. **Tour Management**: Tur yönetimi
   - Tur programları
   - Fiyat takvimleri

4. **Transfer Management**: Transfer yönetimi
   - Transfer noktaları
   - Araç tipleri
   - Fiyatlandırma

5. **Booking System**: Rezervasyon yönetimi
   - Rezervasyon alma
   - Ödeme işlemleri
   - Rezervasyon takibi

6. **Extranet (B2B)**: Partner'ların diğer acentelere satış yapması
   - Markup ayarları
   - B2B kullanıcı yönetimi

## Best Practices

### Vue Component Template
```vue
<template>
  <div>
    <!-- Component content -->
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  propName: String
})

// Emits
const emit = defineEmits(['eventName'])

// Reactive state
const state = ref(null)

// Functions
const handleAction = () => {
  emit('eventName', data)
}
</script>
```

### Express Route Module Template
```javascript
// routes.js
import express from 'express'
import * as service from './service.js'

const router = express.Router()

router.get('/', service.getAll)
router.post('/', service.create)

export default router

// service.js
import asyncHandler from '../../middleware/asyncHandler.js'
import Model from './model.js'

export const getAll = asyncHandler(async (req, res) => {
  const items = await Model.find()
  res.json({ success: true, data: items })
})
```

## Notlar

- **NEVER** hardcode text - always use translations
- **ALWAYS** use components for reusable UI
- **ALWAYS** use service functions for API calls
- **ALWAYS** handle errors with try-catch
- **ALWAYS** give user feedback (toast notifications)
- Dark mode support is built-in - use Tailwind dark: classes

## Son Güncellemeler

### 2024 - Initial Development
- Partner management module completed
- Document upload system implemented
- Authentication with 2FA
- Multi-language support (TR/EN)
- Component-based architecture established

---

**Son güncelleme**: 2024
**Geliştirici notu**: Bu döküman her yeni özellik eklendiğinde güncellenmelidir.
