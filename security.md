# Booking Engine - Guvenlik Denetim Raporu

> **Tarih:** 2026-02-27
> **Son Güncelleme:** 2026-02-27
> **Kapsam:** Tam kod tabanı güvenlik denetimi (backend + frontend + altyapı)
> **Denetçi:** Claude Code Security Audit

---

## Özet İstatistikler

| Seviye     | Toplam | Düzeltildi | Kalan  |
| ---------- | ------ | ---------- | ------ |
| CRITICAL   | 10     | 9          | 1      |
| HIGH       | 19     | 13         | 6      |
| MEDIUM     | 25     | 0          | 25     |
| LOW        | 12     | 0          | 12     |
| **TOPLAM** | **66** | **22**     | **44** |

### Düzeltme Geçmişi

| Commit    | Tarih      | Düzeltilen Bulgular                   |
| --------- | ---------- | ------------------------------------- |
| `c5e0536` | 2026-02-27 | C5, C6, C7, C8, C10                   |
| `ae016a7` | 2026-02-27 | C1, C2, C3, C4, H8, H10, H12, H13     |
| `da33cd9` | 2026-02-27 | H1, H2, H3, H4, H5, H9, H11, H14, H15 |

---

## CRITICAL Bulgular

### C1. ~~Aynı JWT Secret ile Access ve Refresh Token İmzalama~~ [DÜZELTILDI - ae016a7]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:34,38`
- **Açıklama:** Hem access token hem refresh token aynı `config.jwt.secret` ile imzalanıyor. Refresh token endpoint'i sadece `userId` alanını kontrol ediyor (satır 188). Bir access token çalındığında, aynı anahtar ile refresh token olarak da kullanılabilir — 15 dakikalık access token süresi bypass edilir.
- **Etki:** Çalınan access token ile süresiz erişim sağlanabilir.
- **Çözüm:** Access ve refresh token için ayrı secret kullan veya token payload'ına `type: 'access'|'refresh'` claim ekle.

### C2. ~~Refresh Token Rotasyonu Yok~~ [DÜZELTILDI - ae016a7]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:180-215`
- **Açıklama:** `refreshToken` handler'ı sadece yeni access token üretiyor, refresh token yenilenmiyor. Eski refresh token 7 gün boyunca geçerli kalıyor. Token çalınması tespit edilemez.
- **Etki:** Çalınan refresh token 7 gün boyunca geçerli, revoke edilemez.
- **Çözüm:** Her refresh işleminde yeni refresh token üret, eskisini invalidate et.

### C3. ~~Refresh Token Session Store'a Karşı Doğrulanmıyor~~ [DÜZELTILDI - ae016a7]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:187-214`
- **Açıklama:** Refresh token endpoint'i sadece JWT signature'ı ve kullanıcının aktif olup olmadığını kontrol ediyor. Session'ın terminate edilip edilmediğini KONTROL ETMİYOR. "Diğer oturumları sonlandır" özelliği aslında çalışmıyor — sonlandırılan session'ın refresh token'ı hâlâ geçerli.
- **Etki:** Session yönetimi yanlış güvenlik hissi veriyor.
- **Çözüm:** Refresh token'ı session store'a bağla, her refresh'te session durumunu kontrol et.

### C4. ~~OS Command Injection (Domain Input)~~ [DÜZELTILDI - ae016a7]

- **Dosya:** `apps/api/src/services/ssl/certificateService.js:43-44,123,156`
- **Dosya:** `apps/api/src/services/ssl/hostExec.js:28`
- **Dosya:** `apps/api/src/services/ssl/nginxService.js:54,138,183,211-215,267`
- **Açıklama:** Kullanıcı tarafından girilen domain adları doğrudan shell komutlarına `hostExec()` ve `execAsync()` ile geçiriliyor. `cleanDomain()` sadece `trim().toLowerCase()` yapıyor — shell metacharacter kontrolü yok. `hostExec` sadece çift tırnak escape ediyor, `$(...)` veya backtick ile bypass edilebilir. HOST makinede komut çalıştırılır (nsenter ile).
- **Etki:** Kötü niyetli admin, host makinede arbitrary komut çalıştırabilir.
- **Çözüm:** `validateDomain()` helper'ını (inputValidation.js:46-71) tüm SSL/nginx code path'lerinde kullan. Domain'i strict regex ile doğrula.

### C5. ~~MongoDB NoSQL Injection Koruması Yok~~ [DÜZELTILDI - c5e0536]

- **Dosya:** `apps/api/src/app.js`
- **Açıklama:** `express-mongo-sanitize` veya eşdeğeri middleware KULLANILMIYOR. `req.body`, `req.query`, `req.params` içindeki `$`-prefix'li operatörler (`$gt`, `$ne`, `$regex`, `$where`) temizlenmiyor. Herhangi bir endpoint'te kullanıcı input'u doğrudan MongoDB query'sine geçirildiğinde NoSQL injection mümkün.
- **Etki:** Authentication bypass, veri sızıntısı, unauthorized data access.
- **Çözüm:** `express-mongo-sanitize` middleware'ini app.js'e ekle.

### C6. ~~SVG Upload ile Stored XSS~~ [DÜZELTILDI - c5e0536]

- **Dosya:** `apps/api/src/helpers/siteUpload.js:44`
- **Dosya:** `apps/api/src/helpers/storefrontUpload.js:327`
- **Açıklama:** SVG dosyası yüklemeye izin veriliyor (`/jpeg|jpg|png|gif|webp|svg|ico/`). SVG dosyaları `<script>`, `onload=` gibi JavaScript içerebilir. `/uploads` üzerinden `express.static` ile servis edildiğinde, tarayıcı gömülü JavaScript'i uygulama origin'inde çalıştırır.
- **Etki:** Stored XSS — cookie/session çalma, kullanıcı adına işlem yapma.
- **Çözüm:** SVG upload'ı engelle veya SVG sanitizer kullan (DOMPurify).

### C7. ~~Hardcoded Payment Secrets (Weak Defaults)~~ [DÜZELTILDI - c5e0536]

- **Dosya:** `apps/api/src/services/paymentGateway.js:12`
- **Dosya:** `apps/api/src/modules/booking/paymentWebhook.service.js:40`
- **Dosya:** `apps/api/src/modules/booking/paymentWebhook.routes.js:52`
- **Dosya:** `apps/api/src/modules/my/my.routes.js:15`
- **Açıklama:** Environment variable tanımlı değilse `'payment-webhook-secret'` ve `'pws-internal-api-key-2026'` gibi tahmin edilebilir default değerler kullanılıyor.
- **Etki:** Saldırgan, webhook çağrıları forge ederek ödemeleri tamamlanmış olarak işaretleyebilir (finansal dolandırıcılık).
- **Çözüm:** Fallback değerleri kaldır, env variable yoksa `throw new Error()` ile uygulama başlatılmasın.

### C8. ~~SSH Şifreleri ve Credential'lar Git'te~~ [KISMİ DÜZELTME - c5e0536]

- **Dosya:** `CLAUDE.md` (git'e commit edilmiş)
- **Açıklama:** Root SSH şifreleri (`CwQGE8NDAUU6eaH9siDg`, `Mk21093LoPsal`), test hesap bilgileri ve debug API key'i repository'de açık metin olarak mevcut. Repo erişimi olan herkes (eski çalışanlar, contractor'lar) tam sunucu erişimi kazanır.
- **Etki:** Tam sunucu kontrolü, veri ihlali.
- **Çözüm:** Credential'ları CLAUDE.md'den kaldır, şifreleri değiştir. SSH key-based auth'a geç.
- **Yapılan:** CLAUDE.md `git rm --cached` ile git takibinden çıkarıldı (.gitignore'da zaten vardı). Yeni commit'lerde dosya paylaşılmıyor.
- **KALAN:** SSH şifreleri değiştirilmeli, SSH key-based auth'a geçilmeli. Git history'den eski commit'lerdeki credential'lar hâlâ erişilebilir (git filter-branch veya BFG ile temizlenmeli).

### C9. Kart Verisi API Sunucusundan Geçiyor (PCI DSS İhlali) [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/booking/paymentGateway.service.js:290-432`
- **Dosya:** `apps/api/src/modules/public/publicPayment.service.js:213-391`
- **Dosya:** `apps/api/src/modules/booking/paymentPreAuth.service.js:35-87`
- **Açıklama:** Tam kart numarası ve CVV, Express API sunucusuna geliyor, memory'de işleniyor ve payment service'e iletiliyor. Veritabanına kaydedilmese de, transit ve in-memory handling PCI DSS kapsamına giriyor (SAQ D).
- **Etki:** PCI DSS uyumsuzluğu, kart verisi sızıntısı riski.
- **Çözüm:** Tarayıcıdan doğrudan payment gateway'e tokenization (iyzico/PayTR JS SDK). API sadece token görmeli.

### C10. ~~Socket.IO'da Authentication Yok~~ [DÜZELTILDI - c5e0536]

- **Dosya:** `apps/api/src/core/socket.js:23-57`
- **Açıklama:** Socket.IO bağlantılarında hiçbir JWT doğrulaması yok. Herhangi bir istemci `authenticate` event'i ile istediği userId'yi gönderebilir ve `join` event'i ile istediği room'a katılabilir. Ödeme durumu, bildirimler gibi hassas gerçek zamanlı verilere erişim sağlanabilir.
- **Etki:** Yetkisiz kullanıcılar başkalarının real-time verilerini okuyabilir.
- **Çözüm:** Socket.IO middleware'i ile JWT doğrulaması ekle.

---

## HIGH Bulgular

### H1. ~~2FA Replay Attack (90 Saniyelik Pencere)~~ [DÜZELTILDI - da33cd9]

- **Dosya:** `apps/api/src/helpers/twoFactor.js:45-57`
- **Açıklama:** `speakeasy.totp.verify` ile `window: 1` kullanılıyor (90 saniye pencere). Aynı TOTP kodu pencere içinde tekrar kullanılabilir — kod replay koruması yok.
- **Çözüm:** Son kullanılan TOTP timestamp'ini kullanıcı bazında takip et.

### H2. ~~Backup Code'lar Math.random() ile Üretiliyor~~ [DÜZELTILDI - da33cd9]

- **Dosya:** `apps/api/src/helpers/twoFactor.js:64-71`
- **Açıklama:** `Math.random().toString(36)` kriptografik olarak güvensiz. Tahmin edilebilir.
- **Çözüm:** `crypto.randomBytes()` kullan.

### H3. ~~Session Sonlandırmada Ownership Kontrolü Yok (IDOR)~~ [DÜZELTILDI - da33cd9]

- **Dosya:** `apps/api/src/modules/session/session.service.js:58-69`
- **Açıklama:** `DELETE /my-sessions/:sessionId` — session'ın `userId`'si ile `req.user._id` eşleşmesi kontrol edilmiyor. Herhangi bir authenticated kullanıcı, başkalarının session'larını sonlandırabilir.
- **Çözüm:** `session.userId.equals(req.user._id)` kontrolü ekle.

### H4. ~~Şifre Değişikliği Mevcut Session'ları Geçersiz Kılmıyor~~ [DÜZELTILDI - da33cd9]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:326-352`
- **Açıklama:** Şifre değişikliğinde `passwordChangedAt` güncelleniyor ve access token'lar reddediliyor. Ancak refresh token endpoint'i `changedPasswordAfter` kontrolü YAPMIYOR. Çalınan refresh token, şifre değişikliğinden sonra bile 7 gün geçerli.
- **Çözüm:** Refresh token endpoint'ine de `changedPasswordAfter` kontrolü ekle.

### H5. ~~Session Limiti Uygulanmıyor~~ [DÜZELTILDI - da33cd9]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:140-149`
- **Açıklama:** `SessionService.checkSessionLimit` metodu var ama login sırasında hiç çağrılmıyor. Sınırsız eş zamanlı session oluşturulabilir.
- **Çözüm:** Login handler'da `checkSessionLimit` çağır.

### H6. Tutarsız Şifre Minimum Uzunluk [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:333,522`
- **Dosya:** `apps/api/src/modules/auth/auth.routes.js:232,353`
- **Açıklama:** `changePassword` 8 karakter kabul ederken, `resetPassword` service'de 12 karakter gerektiriyor. Route validation ise her ikisinde de `minLength: 8`. Tutarsız politika.
- **Çözüm:** Tek bir minimum uzunluk belirle ve tüm endpoint'lerde uygula.

### H7. Mass Assignment — `...req.body` Spread ile Model.create() [BEKLIYOR]

- **Dosyalar:**
  - `apps/api/src/modules/agency/agency.service.js:38,333`
  - `apps/api/src/modules/hotel/hotel.service.js:143`
  - `apps/api/src/modules/planning/seasons.service.js:70`
  - `apps/api/src/modules/planning/markets.service.js:49`
  - `apps/api/src/modules/planning/mealPlans.service.js:52`
  - `apps/api/src/modules/planning/rates.service.js:230`
  - `apps/api/src/modules/planning/campaigns.service.js:61`
  - `apps/api/src/modules/planning/roomTypes.service.js:89`
- **Açıklama:** `...req.body` doğrudan `Model.create()` içinde spread ediliyor. Özellikle `agency.service.js:333`'te `User.create({ ...req.body, accountType: 'agency' })` — saldırgan `role: 'admin'`, `permissions: [...]`, `status: 'active'` inject edebilir.
- **Çözüm:** Explicit field destructuring kullan, kabul edilen alanları whitelist'le.

### H8. ~~Unescaped $regex ile ReDoS ve Regex Injection (26+ Dosya)~~ [DÜZELTILDI - ae016a7]

- **Dosyalar:** (Başlıca)
  - `apps/api/src/modules/user/user.service.js:188-189`
  - `apps/api/src/modules/hotel/hotel.service.js:56,61-62`
  - `apps/api/src/modules/agency/agency.service.js:108-111,289-290`
  - `apps/api/src/modules/public/publicHotel.service.js:39` **(PUBLIC ENDPOINT!)**
  - `apps/api/src/services/queryBuilder.js:182` **(Merkezi fonksiyon)**
  - `apps/api/src/modules/booking/hotelListing.service.js:161`
  - `apps/api/src/modules/tag/tag.service.js:40-41`
  - Ve 15+ dosya daha
- **Açıklama:** `req.query.search` gibi kullanıcı input'u doğrudan `{ $regex: search, $options: 'i' }` içinde kullanılıyor. `escapeRegex()` helper'ı mevcut ama bu dosyalarda kullanılmamış. `publicHotel.service.js:39` public endpoint — auth gerektirmez.
- **Çözüm:** Tüm `$regex` kullanımlarında `escapeRegex()` fonksiyonunu uygula. `queryBuilder.buildSearchFilter` fonksiyonunu düzelt.

### H9. ~~SNS SubscribeURL SSRF~~ [DÜZELTILDI - da33cd9]

- **Dosya:** `apps/api/src/modules/mailbox/mailbox.service.js:49`
- **Dosya:** `apps/api/src/modules/email-log/emailLog.service.js:120`
- **Açıklama:** SNS mesajının `SubscribeURL`'si signature doğrulaması YAPILMADAN fetch ediliyor. Saldırgan sahte SNS mesajı göndererek sunucuyu internal servislere istek yapmaya zorlayabilir (`http://169.254.169.254/latest/meta-data/`, `http://localhost:27017`).
- **Çözüm:** AWS SNS message validator kullan, SubscribeURL'nin AWS domain'ine ait olduğunu doğrula.

### H10. ~~Agency CRUD'da Partner Ownership Kontrolü Yok (IDOR)~~ [DÜZELTILDI - ae016a7]

- **Dosya:** `apps/api/src/modules/agency/agency.service.js:138-149,152-190,193-214`
- **Açıklama:** `getAgency`, `updateAgency`, `deleteAgency` — istekte bulunan partner'ın agency'nin sahibi olup olmadığı kontrol edilmiyor. Partner A'nın admin'i, Partner B'nin agency'sini okuyabilir/değiştirebilir/silebilir.
- **Çözüm:** Her single-resource endpoint'inde `agency.partner.equals(partnerId)` kontrolü ekle.

### H11. ~~Dashboard'da X-Partner-Id Header Bypass~~ [DÜZELTILDI - da33cd9]

- **Dosya:** `apps/api/src/modules/dashboard/dashboard.service.js:103`
- **Açıklama:** `getPartnerDashboard` fonksiyonu `X-Partner-Id` header'ını doğrudan okuyor (`partnerContext` middleware'ini bypass ederek). Partner kullanıcısı `X-Partner-Id`'yi başka bir partner'ın ID'si ile set ederek onun dashboard verilerini görebilir.
- **Çözüm:** `req.partnerContext.partnerId` kullan, doğrudan header okuma.

### H12. ~~changePassword Cross-Account Escalation~~ [DÜZELTILDI - ae016a7]

- **Dosya:** `apps/api/src/modules/user/user.service.js:542`
- **Açıklama:** `changePassword` fonksiyonu `role === 'admin'` kontrolü yapıyor ama aynı account'a ait olup olmadığını kontrol etmiyor. Partner A'nın admin'i, Partner B'nin kullanıcılarının veya platform admin'lerin şifresini değiştirebilir.
- **Çözüm:** `user.accountId.equals(req.user.accountId)` kontrolü ekle.

### H13. ~~Webhook Signature — Timing Attack~~ [DÜZELTILDI - ae016a7]

- **Dosyalar:** Tüm API key karşılaştırmaları:
  - `apps/api/src/modules/booking/paymentWebhook.service.js:42`
  - `apps/api/src/modules/booking/paymentWebhook.routes.js:54`
  - `apps/api/src/modules/debug/debug.routes.js:24`
  - `apps/api/src/modules/debug/metrics.routes.js:22`
  - `apps/api/src/middleware/storefrontAuth.js:34`
  - `apps/api/src/modules/paymentLink/paymentLink.service.js:806`
- **Açıklama:** API key karşılaştırmaları `!==` ile yapılıyor. İlk farklı karakterde short-circuit yapar, timing side-channel attack mümkün.
- **Çözüm:** `crypto.timingSafeEqual()` kullan.

### H14. ~~Agency Dashboard'da Account Type Kontrolü Yok~~ [DÜZELTILDI - da33cd9]

- **Dosya:** `apps/api/src/modules/dashboard/dashboard.routes.js:14`
- **Açıklama:** Agency dashboard route'u sadece `protect` gerektiriyor. Herhangi bir authenticated kullanıcı (partner admin, platform admin) agency dashboard'a erişebilir.
- **Çözüm:** `requireAccountType('agency')` middleware'i ekle.

### H15. ~~Agency Document sendFile'da Path Traversal~~ [DÜZELTILDI - da33cd9]

- **Dosya:** `apps/api/src/modules/agency/agency.service.js:580`
- **Açıklama:** `res.sendFile(document.url, { root: '.' })` — database'den gelen `document.url` path validation olmadan kullanılıyor. Veritabanı compromise edilirse arbitrary dosya okunabilir. `payment.service.js:388-404`'teki doğru pattern (path.basename + containment check) burada yok.
- **Çözüm:** `path.resolve()` ve directory containment check ekle.

### H16. Payment Webhook — Weak Default Key ile Duplicate Handler [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/booking/paymentWebhook.service.js` vs `paymentWebhook.routes.js`
- **Açıklama:** İki ayrı webhook handler var. Routes handler transaction kullanmıyor, service handler kullanıyor. İkisi farklı event format'ları handle ediyor. Bu durum race condition ve tutarsız ödeme durumlarına yol açabilir.
- **Çözüm:** Tek bir webhook handler kullan, HMAC signature doğrulaması ile.

### H17. Tüm Upload Dosyaları Public Erişimde [BEKLIYOR]

- **Dosya:** `apps/api/src/app.js:28`
- **Açıklama:** `express.static` ile `/uploads` altındaki TÜM dosyalar auth olmadan servis ediliyor. Agency belgeleri, ödeme makbuzları, issue ekleri dahil. Dosya yolunu bilen/tahmin eden herkes erişebilir.
- **Çözüm:** Hassas dosyalar için auth middleware ekle veya signed URL kullan.

### H18. Public CORS — origin: true [BEKLIYOR]

- **Dosya:** `apps/api/src/app.js:55,58`
- **Açıklama:** `/api/public` ve `/api/channel-manager/webhook` route'ları `cors({ origin: true })` ile herhangi bir origin'den erişime açık. Widget için gerekli ancak döndürülen veri kapsamı değerlendirilmeli.
- **Çözüm:** Public endpoint'lerin döndürdüğü verileri gözden geçir.

### H19. Payment Card Details'e Mass Assignment [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/booking/payment.service.js:235-248`
- **Açıklama:** `updatePayment` endpoint'i `cardDetails` alanını spread ile güncelliyor: `{ ...payment.cardDetails, ...req.body.cardDetails }`. Saldırgan `gatewayTransactionId`, `gatewayStatus` gibi alanları manipüle edebilir.
- **Çözüm:** `cardDetails` için sub-field whitelist kullan.

---

## MEDIUM Bulgular

### M1. strictLimiter Authenticated Kullanıcıları Atlıyor [BEKLIYOR]

- **Dosya:** `apps/api/src/middleware/rateLimiter.js:188`
- **Açıklama:** `skip: req => !!req.user` — `change-password` endpoint'inde `protect`'ten sonra uygulanıyor, bu yüzden rate limit hiç çalışmıyor. Authenticated saldırgan mevcut şifreyi brute-force edebilir.

### M2. Rate Limiting X-Forwarded-For ile Bypass Edilebilir [BEKLIYOR]

- **Dosya:** `apps/api/src/middleware/rateLimiter.js:43-46,224-226`
- **Açıklama:** IP-bazlı rate limiting `X-Forwarded-For` header'ını kullanıyor ama `app.set('trust proxy')` yapılandırılmamış. Header spoof edilerek tüm rate limit'ler bypass edilebilir.

### M3. In-Memory Rate Limiting (Multi-Instance'da Etkisiz) [BEKLIYOR]

- **Dosya:** `apps/api/src/middleware/rateLimiter.js:14-15`
- **Açıklama:** Redis disabled ise in-memory `Map` kullanılıyor. Docker container restart'larında veya multi-instance deploy'da rate limit sıfırlanıyor.

### M4. Logout Sonrası Access Token Geçerli Kalıyor [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:218-239`
- **Açıklama:** Logout session'ı terminate ediyor ama JWT access token 15 dakika daha geçerli. Token blacklisting yok.

### M5. Password Reset Token Override (DoS) [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:440-511`
- **Açıklama:** `forgotPassword` her çağrıldığında önceki reset token'ı geçersiz kılıyor. Saldırgan, kurbanın email'i için tekrar tekrar çağırarak meşru reset'i engelleyebilir.

### M6. requireAdmin Yanlış HTTP Status Kodu [BEKLIYOR]

- **Dosya:** `apps/api/src/middleware/auth.js:82`
- **Açıklama:** `UnauthorizedError(401)` fırlatılıyor, `ForbiddenError(403)` olmalı. Frontend sonsuz token refresh döngüsüne girebilir.

### M7. CSRF Koruması JSON Content-Type ile Bypass [BEKLIYOR]

- **Dosya:** `apps/api/src/middleware/csrf.js:71-77`
- **Açıklama:** `Content-Type: application/json` olan tüm istekler CSRF kontrolünden geçiyor. Navigator.sendBeacon veya bazı tarayıcı bug'ları ile bypass mümkün.

### M8. File Upload'da Tutarsız fileFilter (OR vs AND) [BEKLIYOR]

- **OR Logic (Zayıf):** `roomTypeUpload.js:54`, `issueUpload.js:45`, `siteUpload.js:50`, `storefrontUpload.js:333`
- **AND Logic (Doğru):** `upload.js:41`, `avatarUpload.js:44`, `hotelUpload.js:46`
- **Açıklama:** Bazı upload handler'lar extension VEYA MIME type eşleşmesini kabul ediyor. İkisinin de eşleşmesi gerekli.

### M9. uploadType Path Injection [BEKLIYOR]

- **Dosya:** `apps/api/src/helpers/storefrontUpload.js:317-319`
- **Açıklama:** `req.body.uploadType` dosya adında doğrudan kullanılıyor. `../../etc/passwd` gibi değer ile path traversal mümkün.

### M10. Sentry Body Sanitization Eksik [BEKLIYOR]

- **Dosya:** `apps/api/src/core/sentry.js:138-146`
- **Açıklama:** `cardNumber` ve `cvv` siliniyor ama gerçek istek yapısı `card.number` ve `card.cvv` (nested). `card` objesi silinmiyor.

### M11. Payment Analytics'te Role Kontrolü Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/booking/paymentAnalytics.routes.js:14-48`
- **Açıklama:** Sadece `protect` middleware'i var. Agency user'lar dahil herkes analytics verilerine erişebilir.

### M12. Notification Log'da Role/Permission Kontrolü Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/notification-log/notification-log.routes.js:12-30`
- **Açıklama:** Sadece `protect`. Tüm notification log'lar her authenticated user'a açık.

### M13. Translation Route'larında Rate Limiting ve Role Kontrolü Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/translation/translation.routes.js:8-22`
- **Açıklama:** AI çeviri servisleri maliyet oluşturur ama herhangi bir authenticated user sınırsız kullanabilir.

### M14. Channel Manager Scheduler Status — Role Kontrolü Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/channel-manager/channel-manager.routes.js:49`
- **Açıklama:** Internal sistem bilgisi herhangi bir authenticated user'a açık.

### M15. Storefront GET — Admin Kontrolü Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/storefront/storefront.routes.js:23-26`
- **Açıklama:** Storefront konfigürasyonu (hassas partner ayarları) admin olmayan kullanıcılara da açık.

### M16. İki Farklı requirePermission Sistemi [BEKLIYOR]

- **Dosya:** `apps/api/src/middleware/auth.js:87-109` vs `apps/api/src/middleware/permission.js:15-43`
- **Açıklama:** İki farklı davranış: auth.js platform user'lara tam bypass veriyor; permission.js tüm admin'lere bypass veriyor. Route'lar tutarsız şekilde farklı dosyalardan import ediyor.

### M17. Public Payment Link — Rate Limiting Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/paymentLink/paymentLinkPublic.routes.js:12-17`
- **Açıklama:** `GET /:token` ve `POST /:token/complete` — auth yok, rate limit yok. Token brute-force mümkün.

### M18. Payment Link Completion — API Key Yoksa Auth Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/paymentLink/paymentLink.service.js:804-817`
- **Açıklama:** `PAYMENT_WEBHOOK_KEY` set edilmemişse, `completePaymentLink` herhangi bir isteği kabul ediyor.

### M19. Gateway Response Mixed Type — Sanitization Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/booking/payment.model.js:98`
- **Açıklama:** `gatewayResponse: Mixed` — ham gateway yanıtı veritabanında saklanıyor ve frontend'e döndürülüyor. Hassas gateway bilgileri sızabilir.

### M20. No-Origin İstekleri CORS Bypass [BEKLIYOR]

- **Dosya:** `apps/api/src/app.js:105-107`
- **Açıklama:** `Origin` header'ı olmayan istekler her zaman kabul ediliyor. cURL/server-side proxy ile CORS bypass.

### M21. Channel Manager Webhook — Auth Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/channel-manager/channel-manager.routes.js:14,17`
- **Açıklama:** Webhook endpoint'lerinde API key veya signature doğrulaması yok. Sahte reservation/error report gönderilebilir.

### M22. Public Payment — Weak Authorization (Email + BookingNumber) [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/public/publicPayment.service.js:227-237`
- **Açıklama:** Public ödeme endpoint'i sadece bookingNumber + email ile çalışıyor. Booking number'lar tahmin edilebilir format olabilir.

### M23. Bootstrap Password Log'a Yazılıyor [BEKLIYOR]

- **Dosya:** `apps/api/src/core/bootstrap.js:75`
- **Açıklama:** İlk admin şifresi `logger.warn()` ile log'a yazılıyor. Log aggregation servislerinde kalıcı olarak saklanabilir.

### M24. Public Payment Status — Rate Limiting Yok [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/public/routes/publicPayment.routes.js:172-179`
- **Açıklama:** Payment status endpoint'inde rate limiter yok. Booking number + email enumerate edilebilir.

### M25. Prototype Pollution — Object.assign ile User Input [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/pms-settings/settings.service.js:169,206,243,327,367,508-557`
- **Açıklama:** `Object.assign(settings.invoicing, rest)` — `rest` destructured `req.body`'den geliyor. `__proto__` payload ile prototype pollution mümkün (Mongoose koruması ile sınırlı risk).

---

## LOW Bulgular

### L1. Login Yanıtında Kalan Deneme Sayısı Sızdırılıyor [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:89`
- **Açıklama:** `remainingAttempts` brute-force planlama bilgisi veriyor.

### L2. Registration ile Email Enumeration [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/auth/auth.service.js:380-387`
- **Açıklama:** Register endpoint'i `EMAIL_ALREADY_EXISTS` döndürüyor. `forgotPassword` doğru şekilde her durumda aynı yanıt veriyor.

### L3. Session Expiry Hardcoded (7 Gün) [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/session/session.model.js:88`
- **Açıklama:** Environment variable ile yapılandırılamıyor.

### L4. Original Filename Upload'da Kullanılıyor [BEKLIYOR]

- **Dosya:** `apps/api/src/helpers/upload.js:29`
- **Açıklama:** `path.basename(file.originalname)` kullanılıyor. Özel karakterler dosya sistemi sorunlarına yol açabilir.

### L5. Upload Rate Limiting / Quota Yok [BEKLIYOR]

- **Açıklama:** Dosya boyut limiti var (5-50MB) ama kullanıcı/IP başına yükleme oranı veya toplam depolama kotası yok.

### L6. Broad Wildcard Domain CORS [BEKLIYOR]

- **Dosya:** `apps/api/src/app.js:136-143`
- **Açıklama:** `*.maxirez.com` ve `*.minirez.com` subdomain'leri CORS'a izin veriyor. Subdomain takeover riski.

### L7. ShortUrl Open Redirect [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/shortUrl/shortUrl.routes.js:43`
- **Açıklama:** `res.redirect(302, shortUrl.originalUrl)` — URL doğrulaması yok. Şu an internal kullanım ama gelecekte risk.

### L8. Payment Webhook Test Endpoint [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/booking/paymentWebhook.routes.js:248-254`
- **Açıklama:** `GET /webhook/test` public erişimli. Endpoint keşif bilgisi veriyor.

### L9. User Update'te Role Escalation [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/user/user.service.js:271-295`
- **Açıklama:** `allowedFields` listesinde `role` ve `permissions` var. Users edit yetkisi olan biri başka kullanıcıyı admin yapabilir.

### L10. DCC Dönüşüm Detayları Log'da [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/booking/paymentGateway.service.js:400`
- **Açıklama:** Finansal detaylar `info` seviyesinde loglanıyor.

### L11. JSON.parse try-catch Eksik [BEKLIYOR]

- **Dosya:** `apps/api/src/modules/hotel/hotelImage.service.js:70`
- **Açıklama:** `req.body.caption` malformed JSON olursa unhandled exception.

### L12. Dev Proxy allowedHosts: true [BEKLIYOR]

- **Dosya:** `apps/admin/vite.config.js:21`
- **Açıklama:** Development'ta DNS rebinding attack mümkün. Production'ı etkilemez.

---

## Pozitif Bulgular (İyi Yapılan Şeyler)

| #   | Bulgu                                                            | Dosya                           |
| --- | ---------------------------------------------------------------- | ------------------------------- |
| P1  | bcrypt cost factor 12 ile password hashing                       | `user.model.js:328`             |
| P2  | JWT secret startup validation (min length, known-insecure check) | `config/index.js:104-131`       |
| P3  | Password reset token SHA-256 hash ile saklanıyor                 | `user.model.js:468-480`         |
| P4  | Booking query'leri partner-scoped                                | `bookingQuery.service.js`       |
| P5  | ObjectId validation global middleware                            | `loaders/routes.js:156`         |
| P6  | Helmet security headers (CSP, X-Frame-Options vb.)               | `app.js:37-52`                  |
| P7  | 3D Secure varsayılan olarak aktif                                | `paymentGateway.service.js:445` |
| P8  | Payment receipt'te proper path traversal koruması                | `payment.service.js:388-404`    |
| P9  | Email enumeration prevention (forgotPassword)                    | `auth.service.js:457-465`       |
| P10 | Kart numarası saklanmıyor, sadece lastFour                       | `payment.model.js`              |

---

## Öncelikli Aksiyon Planı

### ~~Acil (Bu Hafta)~~ — TAMAMLANDI

1. ~~**`express-mongo-sanitize` middleware ekle** (C5)~~ ✅
2. ~~**CLAUDE.md'yi git takibinden çıkar** (C8)~~ ✅ (kısmi — SSH şifreleri henüz değiştirilmedi)
3. ~~**Payment secret fallback'leri kaldır** — env variable zorunlu yap (C7)~~ ✅
4. ~~**Socket.IO JWT auth ekle** (C10)~~ ✅
5. ~~**SVG upload'ı engelle** (C6)~~ ✅

### ~~Kısa Vade (2 Hafta)~~ — TAMAMLANDI

6. ~~Access/refresh token için type claim + rotation (C1, C2, C3)~~ ✅
7. ~~Tüm API key karşılaştırmalarında `crypto.timingSafeEqual()` kullan (H13)~~ ✅
8. ~~Agency CRUD'da partner ownership kontrolü (H10)~~ ✅
9. ~~`changePassword`'da cross-account kontrolü (H12)~~ ✅
10. ~~Tüm `$regex` kullanımlarında `escapeRegex()` uygula (H8)~~ ✅
11. **`...req.body` spread'leri explicit field destructuring ile değiştir (H7)** ⏳
12. ~~Domain input'larını shell komutlarından önce validate et (C4)~~ ✅

### Sonraki Adımlar (Bekleyen HIGH Bulgular)

| #   | Bulgu                               | Zorluk         | Etki                         |
| --- | ----------------------------------- | -------------- | ---------------------------- |
| C9  | PCI DSS kart tokenization           | Büyük refactor | Payment flow tamamen değişir |
| H6  | Tutarsız şifre uzunluğu             | Kolay          | Tek değer belirle            |
| H7  | Mass assignment (`...req.body`)     | Orta           | 8+ dosyada whitelist gerekli |
| H16 | Duplicate webhook handler           | Orta           | Tek handler'a birleştir      |
| H17 | Upload dosyaları public             | Orta           | Auth middleware + signed URL |
| H18 | Public CORS review                  | Kolay          | origin: true → whitelist     |
| H19 | Payment cardDetails mass assignment | Kolay          | Sub-field whitelist          |

### Sonraki Adımlar (Bekleyen MEDIUM Bulgular)

| Grup            | Bulgular                         | Açıklama                                          |
| --------------- | -------------------------------- | ------------------------------------------------- |
| Rate Limiting   | M1, M2, M3, M17, M24             | trust proxy + Redis store + endpoint bazlı limit  |
| Auth/Permission | M6, M11, M12, M13, M14, M15, M16 | Eksik middleware + permission sistemi birleştirme |
| Token/Session   | M4, M5                           | Token blacklisting + reset token koruması         |
| CSRF/CORS       | M7, M20                          | Content-Type check + no-origin handling           |
| Upload/File     | M8, M9                           | fileFilter tutarlılığı + path sanitization        |
| Data Exposure   | M10, M19, M23                    | Sentry sanitization + log temizliği               |
| Webhook         | M21                              | Channel manager auth                              |
| Payment         | M18, M22, M25                    | API key zorunlu + prototype pollution             |

### Sonraki Adımlar (LOW Bulgular)

| Bulgular | Açıklama                                     |
| -------- | -------------------------------------------- |
| L1, L2   | Info disclosure (login attempts, email enum) |
| L3       | Session expiry config                        |
| L4, L5   | Upload filename + rate limit                 |
| L6       | Wildcard CORS                                |
| L7       | Open redirect                                |
| L8       | Webhook test endpoint                        |
| L9       | Role escalation in user update               |
| L10, L11 | Log exposure + JSON.parse                    |
| L12      | Dev proxy (non-production)                   |

---

_Bu rapor statik kod analizi ile üretilmiştir. Penetration test ile desteklenmesi önerilir._
_Son güncelleme: 2026-02-27 — 22/66 bulgu düzeltildi (9 CRITICAL, 13 HIGH)_
