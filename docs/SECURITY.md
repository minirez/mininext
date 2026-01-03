# Güvenlik Mimarisi

## Uygulanan Güvenlik Önlemleri

### Authentication

| Özellik | Detay |
|---------|-------|
| JWT Access Token | 15 dakika ömür |
| JWT Refresh Token | 7 gün ömür |
| Password Hashing | bcryptjs (salt: 10) |
| 2FA Desteği | TOTP (Time-based One-Time Password) |
| Şifre Kuralları | Min 12 karakter + büyük/küçük harf + rakam + özel karakter |

### Rate Limiting

| Endpoint | Limit | Süre |
|----------|-------|------|
| Login | 5 deneme | 15 dk |
| Register | 5 deneme | 15 dk |
| Password Reset | 5 deneme | 15 dk |
| Genel API | 120 istek | 1 dk |
| Arama API | 100 istek | 1 dk |

- Redis desteği (multi-instance deployment için)
- In-memory fallback (Redis yoksa)
- Failed login tracking + 30 dk lockout (5 başarısız deneme sonrası)

### Authorization Levels

| Level | Middleware | Açıklama |
|-------|------------|----------|
| Public | - | Kimlik gerektirmez |
| Protected | `protect` | Giriş yapmış kullanıcı |
| Admin | `requireAdmin` | Admin rolü |
| Platform Admin | `requirePlatformAdmin` | SuperAdmin |

### Multi-Tenant Isolation

- Partner-based filtering
- Hotel-based scoping (PMS)
- User role verification
- JWT context middleware

### Diğer Önlemler

- **Helmet.js**: Security headers
- **CORS**: Dynamic origin validation
- **Body Parser Limit**: 10MB (DoS koruması)
- **Admin Bootstrap**: Rastgele şifre + ilk girişte zorunlu değişiklik
- **JWT Secret Validation**: Placeholder secret production'da hata fırlatır
- **Password Reset**: 1 saat ömürlü token, SHA-256 hash

---

## Konfigürasyon Kontrol Listesi (Production)

- [ ] `JWT_SECRET` güçlü rastgele değer (min 32 karakter)
- [ ] `REDIS_ENABLED=true` (distributed rate limiting için)
- [ ] `CORS_ORIGIN` sadece izin verilen domain'ler
- [ ] `.env.production` dosyası güvenli
- [ ] Admin şifresi değiştirildi
- [ ] 2FA aktif (kritik kullanıcılar için)

---

**Son Güncelleme:** 2026-01-04
