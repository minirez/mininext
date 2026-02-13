# Booking Engine - Claude Kuralları

## ⛔ YASAKLAR (KESİNLİKLE YAPMA)

- **Dev server başlatma/durdurma**: `turbo dev`, `npm run dev`, `pkill`, `kill` vb. YASAK
- **Hardcode metin**: Her zaman `$t('key')` kullan
- **Doğrudan axios çağrısı**: Service katmanı kullan
- **Yeni UI component**: Önce `components/ui/` kontrol et, varsa kullan
- **Manuel restart**: Dosya değişikliklerinde otomatik reload çalışır
- **Uzak sunucuda sed/awk**: Production/uzak sunucularda dosya düzenlemek için `sed`, `awk` KULLANMA. Write tool ile dosyanın tamamını yaz. Düzenlemeden önce dosyayı mutlaka oku ve yedek tut
- **UI downgrade**: Özel component'i (popover, custom select, vb.) native HTML elemanına (`<select>`, `<input>`) düşürme. Mevcut UX pattern'larını koru

---

## 🏗️ MİMARİ

```
booking-engine/
├── apps/
│   ├── api/          # Express.js Backend (Port 4000)
│   └── admin/        # Vue 3 Frontend (Port 5173)
├── packages/
│   ├── constants/    # Shared constants
│   ├── validation/   # Shared validation schemas
│   └── utils/        # Shared utilities (@booking-engine/utils)
└── turbo.json        # Monorepo config
```

**Stack:**
- Backend: Express + MongoDB + Mongoose + Socket.io + JWT
- Frontend: Vue 3 (Composition API) + Pinia + Tailwind + Vite
- Monorepo: Turborepo + pnpm workspaces

---

## 📁 KRİTİK KONUMLAR

| Amaç | Konum |
|------|-------|
| UI Components | `apps/admin/src/components/ui/` |
| Common Components | `apps/admin/src/components/common/` |
| PMS Shared | `apps/admin/src/modules/shared/components/` |
| Frontend Modules | `apps/admin/src/modules/` |
| Frontend Services | `apps/admin/src/services/` |
| Backend Modules | `apps/api/src/modules/` |
| Backend Services | `apps/api/src/services/` |
| i18n Dosyaları | `apps/admin/src/locales/{tr,en}.json` |

---

## 🚀 YENİ MODÜL OLUŞTURMA

Yeni backend/frontend modülü oluşturmak için **module generator** kullan:

```bash
# Temel modül (model + service + routes + frontend service)
pnpm create-module room-inventory

# Store ile birlikte
pnpm create-module room-inventory --with-store

# Model olmadan (sadece service endpoints)
pnpm create-module room-inventory --no-model
```

Generator şunları oluşturur:
- `apps/api/src/modules/{name}/{name}.model.js`
- `apps/api/src/modules/{name}/{name}.service.js`
- `apps/api/src/modules/{name}/{name}.routes.js`
- `apps/admin/src/services/{name}Service.js`
- `apps/admin/src/stores/{name}.js` (--with-store ile)

**Route'lar otomatik yüklenir!** `/api/{module-name}` endpoint'i hazır.

**Sonraki adımlar:**
1. Çevirileri ekle (`locales/{tr,en}.json`)
2. (Opsiyonel) Özel path için `loaders/routes.js` ROUTE_CONFIG'i düzenle

---

## 📦 BACKEND PATH ALIASES

Backend'de relative import yerine **path aliases** kullan:

```javascript
// ❌ Eski yöntem
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { NotFoundError } from '../../core/errors.js'

// ✅ Yeni yöntem
import { asyncHandler } from '#helpers'
import { NotFoundError } from '#core/errors.js'
```

**Mevcut Aliases:**
| Alias | Yol |
|-------|-----|
| `#config` | `./src/config/index.js` |
| `#constants/*` | `./src/constants/*` |
| `#core/*` | `./src/core/*` |
| `#helpers` | `./src/helpers/index.js` |
| `#helpers/*` | `./src/helpers/*` |
| `#middleware/*` | `./src/middleware/*` |
| `#modules/*` | `./src/modules/*` |
| `#services/*` | `./src/services/*` |
| `#plugins/*` | `./src/plugins/*` |
| `#utils/*` | `./src/utils/*` |

---

## 💡 GELİŞTİRME KURALLARI

1. **PMS Context**: `usePmsContextInjection()` ile `hotelId` al, tüm PMS sorgularında kullan
2. **API İstekleri**: `services/` klasöründeki fonksiyonları kullan, component içinde axios çağırma
3. **Yeni Modül**: `pnpm create-module <isim>` kullan, manuel oluşturma
4. **Çeviri Ekleme**: Hem `tr.json` hem `en.json`'a ekle
5. **Component Seçimi**: Önce UI → Common → PMS Shared sırasıyla kontrol et
6. **E-posta Şablonları**: Tüm e-postalar Maizzle ile hazırlanmalı (`packages/emails/`)
7. **Backend Imports**: Path aliases kullan (`#helpers`, `#core/*` vb.)
8. **Backend Değişiklik Sonrası**: Hot-reload her zaman güvenilir çalışmayabilir. Backend dosyası değiştirdikten sonra test etmeden önce kullanıcıya PM2/nodemon restart hatırlat
9. **UI Değişiklikleri**: Başlamadan önce mevcut tasarımın nasıl göründüğünü anla (screenshot veya mevcut kodu oku). Mevcut UX pattern'larını (popover, tag selector, avatar, vb.) açıkça değiştirilmesi söylenmedikçe koru

---

## 📧 E-POSTA ŞABLONLARI (MAİZZLE)

**Konum:** `packages/emails/`

**Kurallar:**
- Tüm transactional e-postalar Maizzle ile hazırlanmalı
- Modern, responsive ve güzel tasarımlar kullanılmalı
- Tailwind CSS ile stil verilmeli
- Dark mode desteği eklenmeli
- Build sonrası `apps/api/src/templates/emails/` klasörüne kopyalanmalı

**Mevcut Şablonlar:**
- `activation.html` - Hesap aktivasyonu
- `password-reset.html` - Şifre sıfırlama
- `booking-confirmation.html` - Rezervasyon onayı
- `welcome.html` - Hoşgeldin e-postası

**Build:** `pnpm --filter emails build`

---

## 🧩 MEVCUT UI COMPONENTLER

**Buttons:** `BaseButton`, `IconButton`, `ActionMenu`
**Form:** `PhoneInput`, `PasswordInput`, `Toggle`, `DateRangePicker`, `MultiLangInput`
**Display:** `StatusBadge`, `Avatar`, `Tooltip`, `Timeline`
**Overlay:** `Modal`, `Drawer`
**Feedback:** `Alert`, `ConfirmDialog`, `Spinner`
**Data:** `DataTable`

**Common:** `HotelSelector`, `PartnerSelector`, `DocumentUpload`, `LanguageSelector`

---

## 📦 SHARED UTILS PAKETİ

Hem backend hem frontend'de kullanılabilecek ortak utility fonksiyonları:

```javascript
// Backend veya Frontend'de kullanım
import { formatDate, getNights, formatCurrency, formatPhone, capitalize } from '@booking-engine/utils'

// Veya modül bazlı import
import { formatDate, getNights } from '@booking-engine/utils/date'
import { formatCurrency, formatPhone } from '@booking-engine/utils/format'
import { roundPrice, calculatePrice } from '@booking-engine/utils/pricing'
import { capitalize, slugify, getInitials } from '@booking-engine/utils/string'
```

**Modüller:**
- `date` - Tarih formatlama, gece hesaplama, tarih aralıkları
- `format` - Para birimi, telefon, yüzde, dosya boyutu formatlama
- `pricing` - Fiyat yuvarlama, indirim hesaplama, ADR
- `string` - Capitalize, slugify, initials, HTML escape

---

## 📘 TİP TANIMLARI (JSDoc)

Frontend veri yapıları için JSDoc type tanımları:

**Dosya:** `apps/admin/src/types/index.js`

```javascript
// Type'ları import etmeden IDE autocomplete için kullan:
/** @type {import('@/types').User} */
const user = authStore.user

// Veya fonksiyon parametrelerinde:
/** @param {import('@/types').Partner} partner */
function processPartner(partner) { ... }
```

**Tanımlı Tipler:**
- `User` - Kullanıcı objesi (avatar, permissions, vb.)
- `Partner` - Partner objesi (subscription, branding, vb.)
- `Agency` - Acente objesi (commission, creditLimit, vb.)
- `Session` - Oturum objesi
- `Avatar`, `Address`, `Document` - Ortak tipler
- `ApiResponse`, `PaginatedResponse` - API yanıt formatları

---

## 🔗 REFERANSLAR

- Type Tanımları: `apps/admin/src/types/index.js`
- URL Helpers: `apps/admin/src/utils/imageUrl.js`
- Güvenlik notları: `docs/SECURITY.md`
- Mimari detayları: `docs/ARCHITECTURE_V2.md`
- Pricing modülü: `docs/pricing-module-research.md`

---

## 🗃️ KRİTİK VERİ YAPILARI

### Avatar (User, Partner, Agency modelleri)
```javascript
avatar: {
  url: String,       // Relative path: /uploads/avatars/xxx.png
  filename: String,  // Dosya adı: xxx.png
  uploadedAt: Date
}
// ⚠️ DİKKAT: avatar bir OBJECT, string DEĞİL!
// ❌ row.avatar
// ✅ row.avatar?.url
```

### Session
```javascript
// Login'de MUTLAKA session oluştur:
await Session.createFromToken(user._id, accessToken, {
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip
})

// Logout'ta MUTLAKA session sonlandır:
const session = await Session.findByToken(token)
await session.terminate(req.user._id, 'logout')
```

### API Response Formatları
```javascript
// Standart
{ success: boolean, data: any, message?: string }

// Pagination ile
{ success: true, data: { items: [], pagination: { page, limit, total } } }

// Hata
{ success: false, error: string, details?: any }
```

---

## 🔗 URL OLUŞTURMA KURALLARI

### Dosya/Resim URL'leri (Avatar, Upload, vb.)

**Sorun:** Backend relative path döner (`/uploads/avatars/xxx.png`), frontend tam URL'e çevirmeli.

```javascript
// ✅ DOĞRU YÖNTEM - URL parse kullan
const getFileUrl = (relativePath) => {
  if (!relativePath) return null
  if (relativePath.startsWith('http')) return relativePath

  try {
    const url = new URL(import.meta.env.VITE_API_BASE_URL)
    return `${url.protocol}//${url.host}${relativePath}`
  } catch {
    return relativePath
  }
}

// ❌ YANLIŞ - String replace kullanma!
const url = API_URL.replace('/api', '') + path  // HATALI!
```

**Ortak Helper:** `apps/admin/src/utils/imageUrl.js` dosyasında:
- `getFileUrl(relativePath)` - API dosyaları için (avatar, document, vb.)
- `getAvatarUrl(entity)` - User/Partner/Agency avatar'ı için
- `getImageUrl(url)` - CDN resimleri için (otel, oda görselleri)

---

## 🤖 CLAUDE İLE ÇALIŞMA REHBERİ

### Görev Verirken

| ✅ Yapın | ❌ Yapmayın |
|----------|-------------|
| Küçük, odaklı görevler | Belirsiz büyük görevler |
| Bağlam verin: "avatar bir object" | Varsayımlara bırakma |
| Referans gösterin: "ProfileView'a bak" | Sıfırdan bulmamı bekleme |
| Adım adım onay isteyin | Tek seferde her şeyi bekleme |

### İş Akışı (Context Rot Önleme)

```
1. GÖREV → 2. ARAŞTIRMA → 3. PLAN (onay) → 4. UYGULAMA → 5. DOĞRULAMA
```

**Araştırma adımını ATLAMA!** Önce:
- İlgili model'i oku (veri yapısını öğren)
- Mevcut kullanımları ara (pattern'ı öğren)
- Sonra kod yaz

### Oturum Sürekliliği

Kullanıcı "önceki oturumdan devam et" veya "plana devam et" dediğinde:
1. Proje kökünde `PLAN.md`, `TODO.md` veya güncel markdown dosyalarını kontrol et
2. İlgili plan/todo belgesini oku
3. Soru sormadan veya kodu yeniden keşfetmeden ÖNCE mevcut durumu anla

### Hata Olduğunda

```
❌ "Düzelt"
✅ "Sorun X. Muhtemelen Y yüzünden. Z dosyasına bak ve düzelt."
```

---

## 📋 ENTEGRASYON KONTROL LİSTESİ

Yeni özellik eklerken kontrol et:

- [ ] Model yapısı doğru anlaşıldı mı? (nested object, array, vb.)
- [ ] URL'ler doğru oluşturuluyor mu? (relative → absolute)
- [ ] Session/Auth entegrasyonu gerekiyor mu?
- [ ] i18n çevirileri eklendi mi? (tr + en)
- [ ] Mevcut helper/util var mı? (yeniden yazma)

### API Endpoint Kontrol Listesi

- [ ] Route adı frontend ve backend arasında birebir eşleşiyor mu?
- [ ] Gerekli auth/context alanları dahil mi? (`companyId`, `userId`, `hotelId`)
- [ ] Vite proxy yeni API prefix veya statik dosya yolu için yapılandırılmış mı?
- [ ] Mongoose model şeması kontrol edildi mi? (alan adları, population path'leri)

### Bug Düzeltme Protokolü

Bug düzeltmeden önce şu sırayı takip et:
1. İlgili Mongoose model şemasını oku (alan adlarını doğrula)
2. Backend route handler'ı oku
3. Frontend API çağrısını oku
4. Temel neden hipotezini belirt
5. Ancak o zaman düzeltme öner

---

## 🔧 DEBUG ENDPOİNTLERİ (Claude Code Erişimi)

Production sistemine hızlı erişim için debug endpoint'leri:

**Base URL:** `https://app.maxirez.com/api/debug`

**API Key:** `dab1e4a01913bfdbc2dc7239ee07f196c0564f6482ea6adb59873f5962264ad9`

### Kullanım

```bash
# Tüm açık issues'ları getir
curl -H "x-debug-key: dab1e4a01913bfdbc2dc7239ee07f196c0564f6482ea6adb59873f5962264ad9" \
  "https://app.maxirez.com/api/debug/issues?status=open"

# Tek bir issue detayı
curl -H "x-debug-key: dab1e4a01913bfdbc2dc7239ee07f196c0564f6482ea6adb59873f5962264ad9" \
  "https://app.maxirez.com/api/debug/issues/{issueId}"

# Sistem istatistikleri
curl -H "x-debug-key: dab1e4a01913bfdbc2dc7239ee07f196c0564f6482ea6adb59873f5962264ad9" \
  "https://app.maxirez.com/api/debug/stats"
```

### Endpoint'ler

| Endpoint | Açıklama |
|----------|----------|
| `GET /debug/issues` | Tüm issues (query: status, limit) |
| `GET /debug/issues/:id` | Tek issue detayı (yorumlar dahil) |
| `GET /debug/stats` | Sistem istatistikleri |

### WebFetch ile Kullanım

```
WebFetch URL: https://app.maxirez.com/api/debug/issues?status=open&key=dab1e4a01913bfdbc2dc7239ee07f196c0564f6482ea6adb59873f5962264ad9
```

---

## 🖥️ SUNUCU ERİŞİMİ

### Production Sunucusu (Docker)

```bash
ssh root@85.31.238.34
# Şifre: CwQGE8NDAUU6eaH9siDg
```

**Mimari:** Docker Compose (`/var/www/docker-compose.yml`)
- `maxirez-booking-api` - API servisi (Dockerfile.api)
- `maxirez-payment-service` - Ödeme servisi (Dockerfile.payment)
- `minirez-mongodb` - MongoDB (mongo:7, replicaSet=rs0)

**Önemli Dizinler:**
- Proje kökü: `/var/www/booking-engine`
- Docker compose: `/var/www/docker-compose.yml`
- Container logları: `docker logs maxirez-booking-api --tail 50`

**Deploy Komutu:**
```bash
cd /var/www/booking-engine && git pull origin main && \
cd /var/www && docker compose build booking-api payment-service && \
docker compose up -d booking-api payment-service
```

### Eski Sunucu (PM2 - Artık Kullanılmıyor)

```bash
ssh root@194.146.50.11
# Şifre: Mk21093LoPsal
```

**Uzak Sunucu Kuralları:**
- Dosya düzenlemek için `sed`/`awk` KULLANMA → Write tool ile tamamını yaz
- AWS işlemlerinde hedef bölgeyi kullanıcıyla DOĞRULA, varsayma (production: `us-east-1`)
- Yıkıcı komutları (`rm -rf`, `drop`, `--force`) çalıştırmadan ÖNCE kullanıcı onayı al
- Deploy öncesi her zaman build'in başarılı olduğunu doğrula

---

## 🧪 TEST HESABI

Lokal ve production testleri için:

```
Email: metinweb@gmail.com
Şifre: iJqt92PivLurFWb
```

**Lokal Test URL'leri:**
- Frontend: http://localhost:5173
- API: http://localhost:4000

---

**Son Güncelleme:** 2026-02-13 (v5)
