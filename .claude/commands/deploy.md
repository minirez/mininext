# Deploy - Production'a Deploy

Production sunucusuna güvenli deploy süreci.

## Bilgiler

- **Sunucu:** root@85.31.238.34
- **Şifre:** CwQGE8NDAUU6eaH9siDg
- **Mimari:** Docker Compose + Nginx
- **Proje dizini:** /var/www/booking-engine
- **Docker compose:** /var/www/docker-compose.yml
- **Container'lar:** maxirez-booking-api, maxirez-payment-service, minirez-mongodb
- **Admin Frontend:** Nginx serve (`/var/www/booking-engine/apps/admin/dist`) → `app.maxirez.com`
- **SSH prefix:** `sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34`

## Mimari Notlar

- **API (backend):** Docker container (`maxirez-booking-api`) → port 4000 → `api.maxirez.com`
- **Payment Service:** Docker container (`maxirez-payment-service`) → port 7043
- **Admin (frontend):** Docker'da DEĞİL! Nginx direkt `apps/admin/dist/` klasöründen serve eder. Sunucuda `pnpm build` çalıştırılmalı.
- **Widget:** CDN'den serve edilir (`widget.maxirez.com`)

## Adımlar

### 1. Ön Kontrol

```bash
# Commit edilmemiş değişiklik var mı?
git status

# Son commit'leri göster (neyin deploy edileceğini anlamak için)
git log --oneline -5
```

Commit edilmemiş değişiklik varsa önce commit et veya kullanıcıya sor.

### 2. Neyin deploy edileceğini belirle

Değişen dosyalara göre otomatik belirle:

| Değişen dizin           | Deploy edilecek                                   |
| ----------------------- | ------------------------------------------------- |
| `apps/api/`             | API (Docker rebuild)                              |
| `apps/payment-service/` | Payment Service (Docker rebuild)                  |
| `apps/admin/`           | Admin Frontend (sunucuda pnpm build)              |
| `packages/`             | Hem API hem Admin (her ikisi de bağımlı olabilir) |

### 3. Push + Pull

```bash
# Lokal: push
git push origin main

# Remote: pull
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "cd /var/www/booking-engine && git pull origin main"
```

### 4a. API Deploy (backend değişiklikleri)

```bash
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "cd /var/www && docker compose build booking-api && docker compose up -d booking-api"
```

### 4b. Payment Service Deploy

```bash
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "cd /var/www && docker compose build payment-service && docker compose up -d payment-service"
```

### 4c. Admin Frontend Deploy

**ÖNEMLİ:** Admin frontend Docker'da DEĞİL. Sunucuda direkt build edilmeli:

```bash
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "cd /var/www/booking-engine && pnpm --filter booking-engine-admin build"
```

Nginx otomatik olarak yeni `dist/` klasörünü serve eder, restart gerekmez.

### 4d. Hem API Hem Admin Deploy (en yaygın senaryo)

```bash
# API build + restart
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "cd /var/www && docker compose build booking-api && docker compose up -d booking-api"

# Admin frontend build
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "cd /var/www/booking-engine && pnpm --filter booking-engine-admin build"
```

### 4e. Full Deploy (her şey)

```bash
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "cd /var/www && docker compose build booking-api payment-service && docker compose up -d booking-api payment-service && cd booking-engine && pnpm --filter booking-engine-admin build"
```

### 5. Doğrulama

```bash
# Container durumu
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'maxirez|minirez'"

# API logları (hata var mı?)
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "docker logs maxirez-booking-api --tail 10 2>&1"

# API health check
curl -s https://api.maxirez.com/api/health 2>/dev/null | head -5
```

### 6. Sonuç Raporu

Kullanıcıya kısaca raporla:

- Deploy edilen bileşen(ler): API / Payment / Admin / Hepsi
- Build durumu: başarılı / başarısız
- Container durumu: running / error
- Hata var mı: loglardan kontrol

## Önemli Kurallar

- Admin frontend Docker'da DEĞİL - sunucuda `pnpm build` çalıştır
- git pull conflict varsa DUR, kullanıcıya bildir
- Docker build/restart sonrası mutlaka log kontrol et
- Deploy sırasında dosya düzenlemek için sed/awk KULLANMA
- Frontend değişikliği varsa MUTLAKA admin build yap (Adım 4c)
