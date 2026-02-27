# Fix Bug - Yapılandırılmış Bug Düzeltme Süreci

Sistematik bug düzeltme protokolü. Varsayımlara atlamadan önce araştırma yapar.

## Adımlar

### 1. Bug Bilgisini Al

Kullanıcıdan şunları iste (eksikse):

- Hatanın ne olduğu (ne bekleniyor vs ne oluyor)
- Hangi sayfada/endpoint'te oluşuyor
- Hata mesajı veya console çıktısı varsa

### 2. Zorunlu Araştırma (ATLAMA!)

Bug düzeltmeye başlamadan önce şu sırayla araştır:

**a) Model şemasını oku:**
İlgili Mongoose model dosyasını bul ve oku. Alan adlarını, tiplerini, referansları ve virtual'ları not et.

```
apps/api/src/modules/{modul}/{modul}.model.js
```

**b) Backend route/service'i oku:**
İlgili endpoint'in route handler'ını ve service fonksiyonunu oku. Parametre isimlerini, middleware'leri ve query yapısını not et.

```
apps/api/src/modules/{modul}/{modul}.routes.js
apps/api/src/modules/{modul}/{modul}.service.js
```

**c) Frontend API çağrısını oku:**
İlgili frontend service ve component'i oku. Gönderilen parametre isimlerinin backend ile eşleşip eşleşmediğini kontrol et.

```
apps/admin/src/services/{modul}Service.js
apps/admin/src/modules/{modul}/...
```

### 3. Hipotez Belirt

Araştırma sonuçlarına dayanarak:

- Temel nedenin ne olduğunu belirt
- Hangi dosya(lar)da değişiklik gerektiğini listele
- Kullanıcıya hipotezini açıkla ve onay al

### 4. Düzeltmeyi Uygula

Onaydan sonra:

- Minimum gerekli değişiklikleri yap (over-engineering yapma)
- İlgili tüm dosyaları güncelle (backend + frontend + i18n)
- Her değişikliği açıkla

### 5. Doğrulama

- Değişikliklerin syntax hatası içermediğini doğrula
- İlgili API endpoint'ini curl ile test et (mümkünse)
- Backend değişikliği varsa kullanıcıya restart hatırlat

## Önemli Kurallar

- **Adım 2'yi ASLA ATLAMA** - Araştırmadan düzeltme önerme
- Mongoose model şemasını okumadan population/query değiştirme
- Frontend-backend arası alan adı eşleşmesini doğrula
- Mevcut pattern'lardan sapma - benzer çalışan koda bak ve aynı pattern'ı uygula
- Tek seferde tek bug düzelt, karıştırma
