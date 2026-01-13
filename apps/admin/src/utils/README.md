# Frontend Utils

Ortak yardımcı fonksiyonlar.

## imageUrl.js - URL Helpers

API ve CDN dosyaları için URL oluşturma.

### Fonksiyonlar

```javascript
import { getFileUrl, getAvatarUrl, getImageUrl, getHotelImageUrl, getRoomImageUrl } from '@/utils/imageUrl'

// API dosyaları için (avatar, document, upload)
getFileUrl('/uploads/avatars/xxx.png')
// → https://api.domain.com/uploads/avatars/xxx.png

// User/Partner/Agency avatar'ı için
getAvatarUrl(user)  // user.avatar?.url'i otomatik alır
// → https://api.domain.com/uploads/avatars/xxx.png veya null

// CDN resimleri için (otel, oda görselleri)
getImageUrl('/hotels/123/image.png')
// → https://images.domain.com/hotels/123/image.png

// Otel ana görseli
getHotelImageUrl(hotel)  // hotel.logo veya hotel.images[0]
// → https://images.domain.com/hotels/123/logo.png

// Oda tipi görseli
getRoomImageUrl(roomType)  // roomType.images[0]
// → https://images.domain.com/rooms/456/image.png
```

### Kullanım Örnekleri

```vue
<template>
  <!-- Avatar gösterme -->
  <img v-if="getAvatarUrl(user)" :src="getAvatarUrl(user)" />

  <!-- Document indirme -->
  <a :href="getFileUrl(document.url)">İndir</a>

  <!-- Otel görseli -->
  <img :src="getImageUrl(hotel.images[0].url)" />
</template>

<script setup>
import { getFileUrl, getAvatarUrl, getImageUrl } from '@/utils/imageUrl'
</script>
```

### Ortam Değişkenleri

```env
VITE_API_BASE_URL=https://api.domain.com/api
VITE_IMAGES_URL=https://images.domain.com
VITE_FILE_BASE_URL=https://api.domain.com  # Opsiyonel override
```

## sanitize.js - XSS Koruması

```javascript
import { sanitizeMarkdown, sanitizeHtml } from '@/utils/sanitize'

// Markdown içeriği temizle
const safeHtml = sanitizeMarkdown(userInput)
```

## URL Oluşturma Kuralları

1. **Backend relative path döner** - `/uploads/avatars/xxx.png`
2. **Frontend tam URL'e çevirmeli** - `https://api.domain.com/uploads/...`
3. **String replace KULLANMA** - URL parse kullan
4. **Her zaman null check yap** - `url?.startsWith('http')`

```javascript
// ❌ YANLIŞ
const url = API_URL.replace('/api', '') + path

// ✅ DOĞRU
const url = new URL(API_URL)
return `${url.protocol}//${url.host}${path}`
```
