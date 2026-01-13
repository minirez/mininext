# Session Module

Kullanıcı oturumlarını takip eden modül.

## Model Yapısı

```javascript
{
  user: ObjectId,           // User referansı
  tokenHash: String,        // JWT hash (güvenli arama için)
  status: 'active' | 'expired' | 'terminated',

  // Cihaz bilgileri
  browser: String,          // Chrome, Firefox, vb.
  browserVersion: String,
  os: String,               // Windows, macOS, Linux
  osVersion: String,
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown',

  // Konum
  ipAddress: String,
  location: {
    city: String,
    region: String,
    country: String,
    countryCode: String
  },

  // Zaman
  lastActivity: Date,
  expiresAt: Date,
  terminatedAt: Date,
  terminatedBy: ObjectId,
  terminationReason: 'logout' | 'expired' | 'admin' | 'security' | 'password_change'
}
```

## Kullanım

### Session Oluşturma (Login'de)

```javascript
import Session from '../session/session.model.js'

const session = await Session.createFromToken(userId, accessToken, {
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip || req.headers['x-forwarded-for']?.split(',')[0]
})
```

### Session Bulma

```javascript
// Token ile bul
const session = await Session.findByToken(accessToken)

// Kullanıcının aktif oturumlarını bul
const sessions = await Session.findActiveByUser(userId)
```

### Session Sonlandırma

```javascript
// Tek oturum
await session.terminate(userId, 'logout')

// Tüm oturumlar (şifre değişikliğinde)
await Session.terminateAllByUser(userId, userId, 'password_change')

// Diğer oturumlar (mevcut hariç)
await Session.terminateOthers(userId, currentSessionId)
```

## Endpoints (auth routes üzerinden)

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/auth/sessions` | Aktif oturumlar |
| DELETE | `/auth/sessions/:id` | Oturum sonlandır |
| DELETE | `/auth/sessions` | Diğerlerini sonlandır |

## Response Format

```javascript
// GET /auth/sessions
{
  success: true,
  data: [{
    _id: string,
    browser: string,
    os: string,
    deviceType: string,
    ipAddress: string,
    location: { city, country },
    lastActivity: Date,
    isCurrent: boolean    // Mevcut oturum mu?
  }]
}
```

## İlgili Dosyalar

- `apps/api/src/modules/auth/` - Auth modülü (session endpoint'leri burada)
- `apps/api/src/middleware/auth.js` - Session güncelleme
