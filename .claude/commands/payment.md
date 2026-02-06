# Payment (Ödeme) Sistemi Rehberi

Bu komut ödeme sistemi hakkında bilgi sağlar.

---

## Dosya Konumları

### Backend
| Dosya | Satır | Açıklama |
|-------|-------|----------|
| `apps/api/src/modules/booking/payment.model.js` | 482 | Payment MongoDB modeli |
| `apps/api/src/modules/booking/payment.service.js` | 1202 | Ana ödeme servisi |
| `apps/api/src/modules/booking/payment.routes.js` | 489 | Route tanımları |
| `apps/api/src/modules/booking/paymentAnalytics.service.js` | 416 | Analitik servisi |
| `apps/api/src/modules/paymentLink/paymentLink.service.js` | 903 | Ödeme linki servisi |

### Frontend
| Dosya | Açıklama |
|-------|----------|
| `apps/admin/src/services/paymentService.js` | API client (295 satır) |
| `apps/admin/src/stores/payment.js` | Pinia store (288 satır) |
| `apps/admin/src/components/booking/payment/` | Payment componentleri |

### Payment Service (Harici)
| Dosya | Açıklama |
|-------|----------|
| `apps/payment-service/` | Virtual POS entegrasyonu |

---

## Payment Model Yapısı

```javascript
{
  booking: ObjectId,            // Booking referansı
  partner: ObjectId,            // Partner referansı

  // Tutar bilgileri
  amount: Number,               // Ödeme tutarı
  currency: String,             // TRY, EUR, USD

  // Durum
  status: String,               // pending, processing, completed, failed, refunded
  type: String,                 // credit_card, bank_transfer, cash, agency_credit, pay_at_checkin

  // Kredi kartı detayları
  cardDetails: {
    maskedNumber: String,       // **** **** **** 1234
    holderName: String,
    brand: String,              // visa, mastercard
    installment: Number
  },

  // Gateway bilgileri
  gateway: {
    provider: String,           // paratika, paytr, iyzico
    transactionId: String,
    response: Mixed
  },

  // Banka havalesi
  bankTransfer: {
    bankName: String,
    reference: String,
    accountHolder: String,
    receipt: String             // Dekont URL
  },

  // Pre-authorization
  preAuth: {
    isPreAuth: Boolean,
    capturedAt: Date,
    capturedAmount: Number
  },

  // İade
  refund: {
    amount: Number,
    reason: String,
    refundedAt: Date
  }
}
```

---

## Ödeme Tipleri

| Tip | Açıklama | Kullanım |
|-----|----------|----------|
| `credit_card` | Kredi kartı | 3D Secure ile |
| `bank_transfer` | Banka havalesi | Dekont yükleme |
| `cash` | Nakit | Manuel kayıt |
| `agency_credit` | Acente kredisi | B2B ödemeler |
| `pay_at_checkin` | Girişte öde | Ertelenmiş ödeme |

---

## Kritik Bilgiler

### 1. 3D Secure Akışı
```
1. Frontend: Kart bilgileri → /payment/card/initiate
2. Backend: Gateway'e istek → 3D URL döner
3. Frontend: iframe'de 3D sayfası açılır
4. Müşteri: Bankada onay verir
5. Gateway: Callback URL'e POST
6. Backend: Status güncelle
7. Frontend: postMessage ile sonuç al
```

### 2. Payment Link
```javascript
// Ödeme linki oluşturma
POST /api/payment-link/create
{
  amount: 1000,
  currency: 'TRY',
  description: 'Rezervasyon ödemesi',
  customerEmail: 'test@test.com',
  expiresAt: '2026-01-25'
}

// Mevcut ödeme için link
POST /api/booking/payment/:paymentId/create-link
```

### 3. Pre-Authorization
```javascript
// Pre-auth başlat
POST /api/booking/:bookingId/payment/pre-auth

// Pre-auth'u capture et
POST /api/booking/:bookingId/payment/:paymentId/capture
```

### 4. Single Source of Truth
```javascript
// ⚠️ ÖNEMLİ: Ödenen tutarı her zaman Payment collection'dan hesapla
const payments = await Payment.aggregate([
  { $match: { booking: bookingId, status: 'completed' } },
  { $group: { _id: null, paidAmount: { $sum: '$amount' } } }
])
```

---

## API Endpoints

### Booking Payment
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/booking/:id/payments` | Ödeme listesi |
| POST | `/api/booking/:id/payment` | Yeni ödeme ekle |
| PUT | `/api/booking/:id/payment/:paymentId` | Güncelle |
| DELETE | `/api/booking/:id/payment/:paymentId` | Sil |
| POST | `/api/booking/:id/payment/:paymentId/refund` | İade |

### Credit Card
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/booking/payment/card/initiate` | 3D başlat |
| POST | `/api/booking/payment/card/complete` | 3D tamamla |
| POST | `/api/payment/query-bin` | BIN sorgusu |

### Payment Link
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/payment-link/create` | Link oluştur |
| GET | `/api/payment-link/:token` | Link detay |
| POST | `/api/payment-link/:token/pay` | Link ile öde |

---

## Environment Variables

```env
# Payment Gateway
PAYMENT_GATEWAY=paratika
PARATIKA_MERCHANT_ID=xxx
PARATIKA_MERCHANT_KEY=xxx
PARATIKA_MERCHANT_PASSWORD=xxx

# Public URL (3D Secure callback için)
PAYMENT_PUBLIC_URL=https://api.maxirez.com/payment-api
```

---

## İlgili Modüller
- Booking: `/booking` komutu
- PaymentLink: `apps/api/src/modules/paymentLink/`
- VirtualPOS: `apps/admin/src/services/virtualPosService.js`
