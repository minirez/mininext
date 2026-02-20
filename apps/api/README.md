# Maxirez API

Modern, modüler ve ölçeklenebilir bir rezervasyon platformu backend'i.

## Özellikler

- ✅ **Multi-tenant**: Platform, Partner ve Agency yapısı
- ✅ **Multi-language**: i18n desteği (TR, EN, DE, RU, AR)
- ✅ **Modüler Mimari**: Temiz ve bakımı kolay kod yapısı
- ✅ **MongoDB**: NoSQL veritabanı
- ✅ **JWT Authentication**: Güvenli kimlik doğrulama
- ✅ **Error Handling**: Merkezi hata yönetimi
- ✅ **Logging**: Winston ile loglama

## Teknoloji Stack

- Node.js (ES6 Modules)
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Winston (Logger)
- Helmet (Security)
- CORS

## Kurulum

```bash
# Dependencies yükle
npm install

# Environment dosyasını ayarla
cp .env.example .env.development

# Geliştirme sunucusunu başlat
npm run dev

# Production sunucusunu başlat
npm start
```

## Proje Yapısı

```
src/
├── config/           # Konfigürasyon
├── core/             # Temel modüller (mongoose, logger, errors)
├── middleware/       # Express middleware'leri
├── modules/          # İş modülleri
│   ├── partner/
│   ├── agency/
│   └── user/
├── helpers/          # Yardımcı fonksiyonlar
├── locales/          # Çok dil desteği
├── app.js            # Express app
└── index.js          # Server başlatma
```

## API Endpoints

- `GET /health` - Sunucu sağlık kontrolü
- `GET /api` - API bilgisi

## Geliştirme

Server otomatik yeniden başlar (--watch flag ile).

```bash
npm run dev
```

## Test

```bash
# Health check
curl http://localhost:4000/health

# API endpoint
curl http://localhost:4000/api

# i18n test (Türkçe)
curl -H "Accept-Language: tr" http://localhost:4000/api

# i18n test (İngilizce)
curl -H "Accept-Language: en" http://localhost:4000/api
```

## Lisans

ISC
