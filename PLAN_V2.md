# Proje Kalite Iyileştirme Planı V2

> Oluşturulma: 2026-02-15 | Durum: Aktif | Toplam: 15 madde
> Önceki plan (PLAN.md) tamamlandı. Bu plan yeni iyileştirmeleri kapsar.

---

## Kategori A: Güvenlik & Kararlılık (Kritik)

### 1. 🔴 Request ID & Distributed Tracing

- **Durum:** ⏳ Bekliyor
- **Neden:** Hata takibi ve log korelasyonu yapılamıyor. Bir request'in tüm yaşam döngüsü izlenemiyor
- **Yapılacak:**
  - `X-Request-ID` middleware (UUID v4 üret, header'dan da kabul et)
  - Tüm log çıktılarına requestId ekle (Winston child logger)
  - Sentry breadcrumb'lara requestId ekle
  - Response header'da döndür (debugging kolaylığı)
  - Payment service'e propagate et (cross-service tracing)
- **Dosyalar:** Yeni: `apps/api/src/middleware/requestId.js`, Düzenle: `apps/api/src/app.js`, `core/logger.js`
- **Efor:** 2-3 saat

### 2. 🔴 Environment Variable Validation

- **Durum:** ⏳ Bekliyor
- **Neden:** Eksik/yanlış env var sessizce başarısız oluyor, production'da beklenmeyen davranışlar
- **Yapılacak:**
  - Startup'ta tüm required env var'ları validate et (JWT_SECRET, MONGODB_URI, ENCRYPTION_KEY)
  - JWT_SECRET minimum 64 karakter kontrolü
  - Eksik var'larda anlamlı hata mesajı ile process.exit(1)
  - Opsiyonel var'lar için warning log
- **Dosyalar:** Yeni: `apps/api/src/config/validateEnv.js`, Düzenle: `apps/api/src/index.js`
- **Efor:** 1-2 saat

### 3. 🔴 Request Timeout & Circuit Breaker

- **Durum:** ⏳ Bekliyor
- **Neden:** Uzun süren request'ler worker'ları blokluyor, external servis hatası cascade yapıyor
- **Yapılacak:**
  - Global request timeout middleware (30s default, configurable)
  - External servisler için circuit breaker (PayTR, iyzico, SES, BIN lookup)
  - Circuit breaker state: closed → open → half-open
  - Fallback stratejileri (cache'den serve et, graceful degrade)
- **Dosyalar:** Yeni: `apps/api/src/middleware/timeout.js`, `apps/api/src/core/circuitBreaker.js`
- **Efor:** 4-5 saat

### 4. 🔴 Güvenlik Sıkılaştırma (Quick Wins)

- **Durum:** ⏳ Bekliyor
- **Neden:** Birkaç küçük ama önemli güvenlik açığı var
- **Yapılacak:**
  - bcrypt salt rounds: 10 → 12 (OWASP önerisi)
  - Debug API key'i query param'dan kaldır (sadece header)
  - File upload magic byte validation (`file-type` paketi)
  - Sentry payload'dan payment body'yi sanitize et
  - Upload dizininde script execution engelle
  - Graceful shutdown timeout ekle (30s)
- **Dosyalar:** `user.model.js`, `debug.routes.js`, `upload.js`, `errorHandler.js`, `server.js`
- **Efor:** 3-4 saat

---

## Kategori B: Performans & Optimizasyon (Yüksek)

### 5. 🟠 Image Processing Pipeline

- **Durum:** ⏳ Bekliyor
- **Neden:** Kullanıcılar 5MB avatar yüklüyor, sıkıştırma/resize yok, disk ve bandwidth israfı
- **Yapılacak:**
  - `sharp` ile upload sonrası otomatik resize (avatar: 200x200, hotel: 1200x800)
  - WebP formatına dönüşüm (original'i de sakla)
  - Thumbnail üretimi (avatar: 40x40, hotel: 300x200)
  - Quality optimizasyonu (%80 JPEG, %85 WebP)
  - Mevcut görselleri batch convert eden migration script
- **Dosyalar:** Yeni: `apps/api/src/helpers/imageProcessor.js`, Düzenle: `avatarUpload.js`, `hotelUpload.js`
- **Efor:** 4-5 saat

### 6. 🟠 Frontend Bundle Optimizasyonu

- **Durum:** ⏳ Bekliyor
- **Neden:** Tek vendor chunk, initial load büyük, code splitting yetersiz
- **Yapılacak:**
  - Vendor chunk'ı parçala: vue-core, http, ui-heavy, editor
  - TipTap editor lazy load (sadece kullanıldığında)
  - Leaflet harita lazy load
  - Bundle analyzer entegrasyonu (rollup-plugin-visualizer)
  - Size budget: main.js < 250KB gzip target
  - Preload/prefetch stratejisi
- **Dosyalar:** `apps/admin/vite.config.js`, route tanımları
- **Efor:** 3-4 saat

### 7. 🟠 Widget Bundle Küçültme

- **Durum:** ⏳ Bekliyor
- **Neden:** Widget 338KB (IIFE), 4G'de 2-3s download süresi, embed eden siteler etkileniyor
- **Yapılacak:**
  - Kullanılmayan locale'leri lazy load (20 dil → sadece seçili dil)
  - Payment view dynamic import (ilk açılışta yükleme)
  - CSS code splitting (temel stiller + payment stiller)
  - Tree-shaking audit (Vue/Pinia tam mı bundled?)
  - Target: 150KB altı (gzip)
- **Dosyalar:** `apps/widget/vite.config.js`, `widget-entry.js`, locale dosyaları
- **Efor:** 4-5 saat

### 8. 🟠 Database Index & Query Optimizasyonu

- **Durum:** ⏳ Bekliyor
- **Neden:** Eksik index'ler, bazı yoğun sorgularda collection scan riski
- **Yapılacak:**
  - Booking: `{ 'leadGuest.firstName': 1 }`, `{ 'leadGuest.lastName': 1 }`, `{ payment.status: 1, partner: 1 }`
  - Payment: aggregation query'leri tek pipeline'a birleştir
  - Availability cache TTL: 1dk → 5dk (event-driven invalidation ile)
  - MongoDB connection pool tuning (10 → 25)
  - Query timeout: 30s default
- **Dosyalar:** `booking.model.js`, `payment.model.js`, `bookingQuery.service.js`, `cacheService.js`, `mongoose.js`
- **Efor:** 3-4 saat

---

## Kategori C: Erişilebilirlik & UX (Orta)

### 9. 🟡 Widget Accessibility (WCAG AA)

- **Durum:** ⏳ Bekliyor
- **Neden:** Widget'ta sıfır ARIA attribute var, screen reader kullanıcıları erişemiyor
- **Yapılacak:**
  - Tüm form input'lara `aria-required`, `aria-invalid`, `aria-describedby`
  - DateRangePicker'a `role="grid"`, `aria-label`, keyboard navigation (Arrow keys)
  - Modal/overlay'a `role="dialog"`, `aria-modal="true"`, focus trap
  - Dropdown'lara `aria-expanded`, `aria-controls`, `role="listbox"`
  - Step indicator'a `aria-current="step"`
  - Hata mesajlarına `aria-live="polite"`
  - RTL desteği (Arapça, Farsça, İbranice)
- **Dosyalar:** Widget component'leri, `widget.css`
- **Efor:** 6-8 saat

### 10. 🟡 Admin Panel Accessibility İyileştirmeleri

- **Durum:** ⏳ Bekliyor
- **Neden:** Bazı UI component'lerde ARIA eksik, keyboard navigation yetersiz
- **Yapılacak:**
  - Modal/Drawer: focus trap, `aria-modal`, ESC ile kapatma
  - DataTable: keyboard navigation, `aria-sort` header'ları
  - Dropdown: `aria-expanded`, `aria-controls`
  - Form'larda unsaved changes uyarısı (beforeLeave guard)
  - Skip navigation link
  - Color contrast audit (WCAG AA 4.5:1)
- **Dosyalar:** `components/ui/Modal.vue`, `Drawer.vue`, `Dropdown.vue`, `DataTable.vue`
- **Efor:** 5-6 saat

### 11. 🟡 Skeleton Loading & Empty States

- **Durum:** ⏳ Bekliyor
- **Neden:** Loading state'lerde sadece spinner var, perceived performance düşük
- **Yapılacak:**
  - `<SkeletonLoader>` component (text, avatar, card, table varyantları)
  - `<StateContainer>` wrapper: loading → skeleton, error → retry button, empty → illustration
  - Kritik sayfalar: Booking listesi, Dashboard, Hotel detay
  - Error state'lerde retry mekanizması
  - Empty state illustration'ları
- **Dosyalar:** Yeni: `components/ui/SkeletonLoader.vue`, `components/ui/StateContainer.vue`
- **Efor:** 4-5 saat

---

## Kategori D: Kod Kalitesi & Maintainability (Orta)

### 12. 🟡 Console.log Temizliği & Structured Logging

- **Durum:** ⏳ Bekliyor
- **Neden:** Frontend'te 391 `console.*` instance var, production'da gereksiz output
- **Yapılacak:**
  - Tüm `console.log` → `logger.debug` dönüşümü (mevcut `utils/logger.js` kullan)
  - Production'da logger.debug silent
  - ESLint `no-console: error` kuralı (sadece logger.\* izinli)
  - Widget'ta da console.log temizliği (7 instance)
- **Dosyalar:** Frontend service/view dosyaları, ESLint config
- **Efor:** 2-3 saat

### 13. 🟡 Büyük Component Refactoring

- **Durum:** ⏳ Bekliyor
- **Neden:** ThemeContentEditor (1826 satır), TourScheduleBuilder (1260 satır) gibi dev component'ler bakımı zorlaştırıyor
- **Yapılacak:**
  - ThemeContentEditor → alt component'lere böl (SectionEditor, PageEditor, StyleEditor)
  - TourScheduleBuilder → composable'lara ayır (useTourPricing, useTourSchedule)
  - SeasonFormGeneralTab (1044 satır) → tab bazlı alt component'ler
  - Widget store (705 satır) → SearchStore, BookingStore, PaymentStore
  - Hedef: max 400 satır/component
- **Dosyalar:** İlgili büyük component'ler
- **Efor:** 8-10 saat

### 14. 🟡 Shared Validation Genişletme

- **Durum:** ⏳ Bekliyor
- **Neden:** packages/validation sadece guest ve booking schema'ları kapsıyor, diğer modüller validation'sız
- **Yapılacak:**
  - Hotel schema (widget'tan gelen veriler için)
  - Partner/Agency validation schema
  - PromoCode validation schema
  - Payment installment validation
  - Currency enum'u constants paketinden al (hardcode kaldır)
  - Eksik para birimleri ekle (AED, SAR, QAR, JOD)
- **Dosyalar:** `packages/validation/src/schemas/`
- **Efor:** 4-5 saat

---

## Kategori E: DevOps & Altyapı (Orta-Düşük)

### 15. 🔵 Prometheus Metrics & Monitoring

- **Durum:** ⏳ Bekliyor
- **Neden:** APM yok, request latency/error rate/memory tracking yok, proaktif alarm yok
- **Yapılacak:**
  - `prom-client` ile metrics middleware
  - HTTP request duration histogram (method, route, status)
  - Active connections gauge
  - MongoDB query duration
  - Memory & CPU usage
  - `/metrics` endpoint (Prometheus scrape)
  - Grafana dashboard (opsiyonel, docker-compose'a ekle)
  - Alerting: error rate > %5, latency P95 > 5s
- **Dosyalar:** Yeni: `apps/api/src/middleware/metrics.js`, Düzenle: `app.js`, `docker-compose.yml`
- **Efor:** 5-6 saat

---

## İlerleme Özeti

| #   | Madde                         | Kategori   | Öncelik | Efor  | Durum         |
| --- | ----------------------------- | ---------- | ------- | ----- | ------------- |
| 1   | Request ID & Tracing          | Güvenlik   | 🔴 P0   | 2-3s  | ✅ Tamamlandı |
| 2   | Env Var Validation            | Güvenlik   | 🔴 P0   | 1-2s  | ✅ Tamamlandı |
| 3   | Timeout & Circuit Breaker     | Güvenlik   | 🔴 P0   | 4-5s  | ✅ Tamamlandı |
| 4   | Güvenlik Quick Wins           | Güvenlik   | 🔴 P0   | 3-4s  | ✅ Tamamlandı |
| 5   | Image Processing              | Performans | 🟠 P1   | 4-5s  | ✅ Tamamlandı |
| 6   | Frontend Bundle Optimizasyonu | Performans | 🟠 P1   | 3-4s  | ✅ Tamamlandı |
| 7   | Widget Bundle Küçültme        | Performans | 🟠 P1   | 4-5s  | ✅ Tamamlandı |
| 8   | DB Index & Query Optimizasyon | Performans | 🟠 P1   | 3-4s  | ✅ Tamamlandı |
| 9   | Widget Accessibility          | UX         | 🟡 P2   | 6-8s  | ✅ Tamamlandı |
| 10  | Admin Accessibility           | UX         | 🟡 P2   | 5-6s  | ✅ Tamamlandı |
| 11  | Skeleton Loading & States     | UX         | 🟡 P2   | 4-5s  | ✅ Tamamlandı |
| 12  | Console.log Temizliği         | Kod Kalite | 🟡 P2   | 2-3s  | ✅ Tamamlandı |
| 13  | Büyük Component Refactoring   | Kod Kalite | 🟡 P2   | 8-10s | ✅ Tamamlandı |
| 14  | Shared Validation Genişletme  | Kod Kalite | 🟡 P2   | 4-5s  | ✅ Tamamlandı |
| 15  | Prometheus Metrics            | DevOps     | 🔵 P3   | 5-6s  | ✅ Tamamlandı |

**Toplam Tahmini Efor:** ~60-75 saat

---

## Uygulama Stratejisi

### Faz 1 - Güvenlik & Kararlılık (Madde 1-4)

Hemen yapılmalı. Üretim ortamı güvenliğini ve kararlılığını doğrudan etkiliyor.

### Faz 2 - Performans (Madde 5-8)

Kullanıcı deneyimini en çok etkileyecek optimizasyonlar. Widget hızı = dönüşüm oranı.

### Faz 3 - UX & Erişilebilirlik (Madde 9-11)

Yasal zorunluluk (WCAG) ve kullanıcı memnuniyeti. Özellikle widget accessibility kritik.

### Faz 4 - Kod Kalitesi (Madde 12-14)

Uzun vadeli bakım kolaylığı. Teknik borç azaltma.

### Faz 5 - Monitoring (Madde 15)

Proaktif sorun tespiti. Diğer iyileştirmelerin etkisini ölçmek için gerekli.
