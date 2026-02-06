# Debug ve Troubleshooting Rehberi

Bu komut debugging ve sorun giderme bilgileri sağlar.

---

## Debug Endpoint'leri

### Production API
**Base URL:** `https://app.maxirez.com/api/debug`
**API Key:** `dab1e4a01913bfdbc2dc7239ee07f196c0564f6482ea6adb59873f5962264ad9`

```bash
# Issues listesi
curl -H "x-debug-key: API_KEY" "https://app.maxirez.com/api/debug/issues?status=open"

# Tek issue
curl -H "x-debug-key: API_KEY" "https://app.maxirez.com/api/debug/issues/{issueId}"

# Sistem istatistikleri
curl -H "x-debug-key: API_KEY" "https://app.maxirez.com/api/debug/stats"
```

### Local Development
```bash
# API logs
pm2 logs api

# Tüm logs
pm2 logs

# Son 100 satır
pm2 logs api --lines 100
```

---

## Sunucu Erişimi

```bash
ssh root@194.146.50.11
# Şifre: Mk21093LoPsal

# Dizinler
cd /var/www/booking-engine/apps/api    # Backend
cd /var/www/booking-engine/apps/admin  # Frontend

# PM2 komutları
pm2 status
pm2 restart api
pm2 logs api
```

---

## Yaygın Sorunlar ve Çözümleri

### 1. Payment 3D Secure Çalışmıyor

**Belirtiler:** iframe açılmıyor, callback gelmiyor

**Kontrol:**
```bash
# .env dosyasında
PAYMENT_PUBLIC_URL=https://api.maxirez.com/payment-api
```

**Çözüm:**
1. Environment variable'ı kontrol et
2. Gateway callback URL'ini kontrol et
3. SSL sertifikasını kontrol et

---

### 2. Ödenen Tutar Yanlış Görünüyor

**Sebep:** `booking.payment.paidAmount` denormalize veri

**Çözüm:** Payment collection'dan aggregate ile hesapla
```javascript
const payments = await Payment.aggregate([
  { $match: { booking: bookingId, status: 'completed' } },
  { $group: { _id: null, paidAmount: { $sum: '$amount' } } }
])
```

---

### 3. Email Gönderilmiyor

**Kontrol:**
```bash
# Email log'ları
GET /api/email-log?booking=BOOKING_ID

# SES identity durumu
pm2 logs api | grep -i "ses\|email"
```

**Yaygın sebepler:**
- SES sandbox mode
- Email not verified
- Template değişkenleri eksik

---

### 4. Socket.io Bağlantı Sorunu

**Kontrol:**
```javascript
// Frontend console'da
socket.connected  // true olmalı
```

**Çözüm:**
1. CORS ayarlarını kontrol et
2. Nginx proxy ayarlarını kontrol et
3. `VITE_SOCKET_URL` environment variable

---

### 5. Rate Limiter 429 Hatası

**⚠️ DİKKAT:** Rate limiters şu an deaktif (`auth.routes.js:41`)

**Tekrar aktif etmek için:**
```javascript
// auth.routes.js
router.post('/login', loginLimiter, login)
router.post('/register', registerLimiter, register)
```

---

## Logging

### Backend Logger
```javascript
import logger from '#helpers/logger.js'

logger.info('İşlem başarılı', { bookingId, amount })
logger.error('Hata oluştu', { error: err.message })
logger.warn('Dikkat', { warning: 'Rate limit yaklaşıyor' })
```

### Console.log Kullanmayın!
```javascript
// ❌ YANLIŞ
console.log('Debug:', data)

// ✅ DOĞRU
logger.debug('Debug:', data)
```

---

## Database Queries

### MongoDB Shell
```bash
# Bağlan
mongosh "mongodb://localhost:27017/booking-engine"

# Booking bul
db.bookings.findOne({ bookingNumber: 'BK-123456' })

# Payment'ları listele
db.payments.find({ booking: ObjectId('...') })

# Aggregate örneği
db.payments.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$booking', total: { $sum: '$amount' } } }
])
```

---

## Performance Issues

### Yavaş API Yanıtı
```bash
# Response time kontrolü
curl -w "@curl-format.txt" -o /dev/null -s "API_URL"

# MongoDB slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

### Memory Leak
```bash
# PM2 memory kullanımı
pm2 monit

# Heap snapshot
node --inspect apps/api/src/server.js
```

---

## Test Kartları

### Paratika Test
```
Kart No: 4355 0843 5508 4358
CVV: 000
Son Kullanma: Herhangi gelecek tarih

# 3D Secure onay kodu: 123456
```

---

## Faydalı Komutlar

```bash
# Git durumu
git status
git log --oneline -10

# Bağımlılıkları güncelle
pnpm install

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm typecheck
```

---

## Log Dosyaları

| Log | Konum |
|-----|-------|
| PM2 logs | `~/.pm2/logs/` |
| Nginx access | `/var/log/nginx/access.log` |
| Nginx error | `/var/log/nginx/error.log` |
| MongoDB | `/var/log/mongodb/mongod.log` |
