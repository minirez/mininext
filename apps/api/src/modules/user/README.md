# User Module

Kullanıcı yönetimi modülü.

## Model Yapısı

```javascript
{
  // Hesap Bilgileri
  accountType: 'platform' | 'partner' | 'agency',
  accountId: ObjectId,      // Partner veya Agency _id

  // Kimlik
  name: String,
  email: String,            // Unique per accountId
  phone: String,

  // Avatar - ⚠️ OBJECT, string DEĞİL!
  avatar: {
    filename: String,       // xxx.png
    url: String,            // /uploads/avatars/xxx.png (relative!)
    uploadedAt: Date
  },

  // Auth
  password: String,         // Hashed, select: false
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,  // select: false
  forcePasswordChange: Boolean,

  // Yetki
  role: 'admin' | 'user',
  permissions: [{
    module: String,         // dashboard, planning, booking, vb.
    actions: {
      view: Boolean,
      create: Boolean,
      edit: Boolean,
      delete: Boolean
    }
  }],

  // Durum
  status: 'pending' | 'pending_activation' | 'active' | 'inactive',
  isOnline: Boolean,
  lastLogin: Date,

  // Tercihler
  language: 'tr' | 'en' | 'de' | 'ru' | 'ar',
  notificationPreferences: { email: {}, sms: {}, push: {} }
}
```

## Avatar Kullanımı

```javascript
// ❌ YANLIŞ
const avatarUrl = user.avatar  // [object Object]

// ✅ DOĞRU
const avatarUrl = user.avatar?.url  // /uploads/avatars/xxx.png

// Frontend'de tam URL için:
import { getAvatarUrl } from '@/utils/imageUrl'
const fullUrl = getAvatarUrl(user)  // https://api.domain.com/uploads/avatars/xxx.png
```

## Endpoints

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/users` | Kullanıcı listesi |
| GET | `/users/:id` | Kullanıcı detayı |
| POST | `/users` | Kullanıcı oluştur |
| PUT | `/users/:id` | Kullanıcı güncelle |
| DELETE | `/users/:id` | Kullanıcı sil |
| POST | `/users/:id/activate` | Aktivasyon linki gönder |
| POST | `/users/:id/reset-password` | Şifre sıfırlama linki gönder |

## Permission Kontrolü

```javascript
// Model metodu ile
user.hasPermission('booking', 'create')  // true/false

// Admin her zaman true döner
user.role === 'admin' // → tüm izinler açık

// Tüm izinleri al (UI için)
const perms = user.getEffectivePermissions()
```

## Durum Akışı

```
pending → pending_activation → active ↔ inactive
          (admin onayı)      (aktivasyon)
```

## İlgili Dosyalar

- `apps/api/src/modules/auth/` - Login, avatar upload
- `apps/api/src/helpers/avatarUpload.js` - Avatar işlemleri
- `apps/admin/src/types/index.js` - Frontend type tanımları
