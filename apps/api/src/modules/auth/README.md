# Auth Module

Kimlik doğrulama ve oturum yönetimi modülü.

## Endpoints

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/auth/login` | Kullanıcı girişi |
| POST | `/auth/logout` | Kullanıcı çıkışı |
| POST | `/auth/refresh` | Token yenileme |
| GET | `/auth/me` | Mevcut kullanıcı bilgisi |
| POST | `/auth/change-password` | Şifre değiştirme |
| POST | `/auth/forgot-password` | Şifre sıfırlama isteği |
| POST | `/auth/reset-password` | Şifre sıfırlama |
| POST | `/auth/register` | Partner kaydı |

## 2FA Endpoints

| Method | Path | Açıklama |
|--------|------|----------|
| POST | `/auth/2fa/enable` | 2FA aktifleştirme başlat (QR kod) |
| POST | `/auth/2fa/verify-setup` | 2FA kurulum doğrulama |
| POST | `/auth/2fa/disable` | 2FA devre dışı bırakma |

## Session Endpoints

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/auth/sessions` | Aktif oturumlar listesi |
| DELETE | `/auth/sessions/:id` | Oturum sonlandırma |
| DELETE | `/auth/sessions` | Diğer oturumları sonlandırma |

## Kritik Entegrasyonlar

### Login'de Session Oluşturma

```javascript
// auth.service.js - login fonksiyonunda
import Session from '../session/session.model.js'

// Token oluşturduktan sonra:
await Session.createFromToken(user._id, accessToken, {
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip
})
```

### Logout'ta Session Sonlandırma

```javascript
// auth.service.js - logout fonksiyonunda
const token = req.headers.authorization?.replace('Bearer ', '')
const session = await Session.findByToken(token)
if (session) {
  await session.terminate(req.user._id, 'logout')
}
```

## Login Response Format

```javascript
{
  success: true,
  data: {
    user: {
      id: string,
      name: string,
      email: string,
      role: 'admin' | 'user',
      accountType: 'platform' | 'partner' | 'agency',
      accountId: string,
      permissions: Array,
      avatar: { url: string, filename: string, uploadedAt: Date } // OBJECT!
    },
    account: { id: string, name: string, type: string },
    accessToken: string,
    refreshToken: string,
    forcePasswordChange: boolean
  }
}
```

## Güvenlik

- Rate limiting: 5 başarısız deneme → 15 dk kilit
- 10 başarısız deneme → kalıcı blok (admin müdahalesi gerekir)
- JWT expiry: Access 1 saat, Refresh 7 gün
- 2FA: Google Authenticator uyumlu TOTP

## İlgili Dosyalar

- `apps/api/src/modules/session/` - Session modülü
- `apps/api/src/helpers/twoFactor.js` - 2FA helper
- `apps/api/src/middleware/rateLimiter.js` - Rate limiter
