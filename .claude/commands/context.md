# Context - Proje Bağlam Yükleyici

Yeni oturum başında projeyi hızlıca anlamak için çalıştırılır. `PROJECT_CONTEXT.md` snapshot dosyasını okur veya yoksa/eskiyse yeniden oluşturur.

## Adımlar

### 1. Snapshot Kontrolü

`PROJECT_CONTEXT.md` dosyasını kontrol et:

- Dosya varsa ve son 3 günden yeniyse → **sadece oku ve özetle**
- Dosya yoksa veya eskiyse → **yeniden oluştur** (Adım 2)

```bash
# Dosya yaşını kontrol et
find /var/www/mini/booking-engine/PROJECT_CONTEXT.md -mtime -3 2>/dev/null
```

### 2. Snapshot Yenileme (Gerekirse)

Eğer snapshot güncel değilse, şu adımları sırayla uygula:

**a) Model şemalarını tara:**

```bash
# Tüm model dosyalarını bul
find apps/api/src/modules -name "*.model.js" -type f
```

Her model dosyasından şema alanlarını, ref'leri ve önemli virtual'ları çıkar.

**b) Route endpoint'lerini tara:**

```bash
# Tüm route dosyalarını bul
find apps/api/src/modules -name "*.routes.js" -type f
```

Her route dosyasından HTTP method + path kombinasyonlarını çıkar.

**c) Frontend service'leri tara:**

```bash
ls apps/admin/src/services/
```

**d) Store'ları tara:**

```bash
ls apps/admin/src/stores/
```

**e) Son değişiklikleri al:**

```bash
git log --oneline -20
git diff --stat HEAD~5
```

**f) Bekleyen plan/todo dosyalarını kontrol et:**

```bash
ls -la PLAN.md TODO.md *.plan.md 2>/dev/null
```

**g) Tüm bilgiyi `PROJECT_CONTEXT.md` dosyasına yaz.**

### 3. Bağlam Özeti

Snapshot'ı okuduktan sonra kullanıcıya kısa bir özet sun:

- Toplam model/route/service sayısı
- Son yapılan değişiklikler (son 5 commit)
- Varsa bekleyen plan/todo dosyaları
- Projenin genel durumu

### 4. Hazır Ol

Özetten sonra kullanıcıya sor:

- "Proje bağlamı yüklendi. Ne üzerinde çalışmak istiyorsunuz?"

## Önemli Kurallar

- Snapshot'ı gereksiz yere yenileme (3 günden yeniyse oku)
- Her model için TÜM alanları değil, sadece önemli alanları ve ref'leri kaydet
- Route'ları HTTP method + path olarak kısa tut
- Dosya 500 satırı geçmesin, özet ve referans odaklı yaz
- `PROJECT_CONTEXT.md` dosyası git'e commit edilmemeli (.gitignore'a ekle)
