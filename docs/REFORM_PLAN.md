# Booking Engine - Yapısal Reform Planı

**Oluşturulma Tarihi:** 2026-01-06
**Durum:** 🔄 Devam Ediyor

---

## Özet

Bu doküman, booking-engine projesinin bakımını kolaylaştırmak için yapılacak yapısal reformları detaylı şekilde açıklar.

---

## Faz 1: Güvenlik ve Kritik Düzeltmeler

### 1.1 Object.assign Güvenlik Açığı (🔴 Kritik)

**Sorun:** 4 modülde `Object.assign(entity, req.body)` kullanılıyor - field whitelisting yok.

**Etkilenen Dosyalar:**
- `apps/api/src/modules/partner/partner.service.js`
- `apps/api/src/modules/agency/agency.service.js`
- `apps/api/src/modules/user/user.service.js`
- Diğer olası dosyalar

**Çözüm:** Her update fonksiyonunda `allowedFields` pattern'i uygulanacak.

```javascript
// ÖNCE (Tehlikeli)
Object.assign(partner, req.body)

// SONRA (Güvenli)
const allowedFields = ['name', 'email', 'phone', 'address', 'settings']
allowedFields.forEach(field => {
  if (req.body[field] !== undefined) {
    partner[field] = req.body[field]
  }
})
```

---

## Faz 2: Shared Constants Package

### 2.1 Package Oluşturma

**Yeni Dizin:** `packages/constants/`

**Dosya Yapısı:**
```
packages/constants/
├── package.json
├── src/
│   ├── index.js
│   ├── currencies.js
│   ├── languages.js
│   ├── payment.js
│   ├── booking.js
│   ├── transaction.js
│   ├── room.js
│   └── guest.js
└── README.md
```

### 2.2 Migration

1. `apps/api/src/constants/languages.js` → `packages/constants/src/languages.js`
2. `apps/admin/src/constants/languages.js` → Import from package
3. Diğer duplicate constant'lar birleştirilecek

---

## Faz 3: Backend Service Refactoring

### 3.1 BaseEntityService Sınıfı

**Dosya:** `apps/api/src/services/base/BaseEntityService.js`

**Özellikler:**
- Standart CRUD operasyonları
- Pagination helper
- Field whitelisting
- Audit logging

### 3.2 QueryBuilder Kullanımı Yaygınlaştırma

Mevcut `queryBuilder.js` tüm list endpoint'lerinde kullanılacak.

### 3.3 Büyük Servis Dosyalarını Bölme

**planning.service.js (3900 satır):**
- `rates.service.js` - Rate plan CRUD
- `seasons.service.js` - Season management
- `markets.service.js` - Market management
- `campaigns.service.js` - Campaign/promotion logic
- `inventory.service.js` - Inventory/availability

**booking.service.js (3467 satır):**
- `bookingSearch.service.js` - Search/availability
- `bookingPricing.service.js` - Price calculation
- `bookingDraft.service.js` - Draft management
- `bookingManagement.service.js` - CRUD operations

---

## Faz 4: Frontend Standardization

### 4.1 useListView Yaygınlaştırma

**Hedef View'lar:**
- AgenciesView.vue
- PartnersView.vue
- GuestsView.vue
- BookingListView.vue

### 4.2 Shared Components

**Oluşturulacak Component'ler:**
- `StatsCard.vue` - İstatistik kartları
- `FilterBar.vue` - Arama ve filtre kombinasyonu
- `ActiveFilters.vue` - Aktif filtre pilleri

### 4.3 Büyük View'ları Bölme

**AgenciesView.vue (1518 satır):**
- Modal → `AgencyFormModal.vue`
- Tab içerikleri → Ayrı component'ler

---

## Faz 5: Validation Package Yaygınlaştırma

### 5.1 Backend'de Kullanım

Tüm modüller için validation middleware eklenecek:
- Request body validation
- Query parameter validation
- Path parameter validation

### 5.2 Eksik Schema'lar

- Transaction schema
- Stay schema
- Room schema

---

## İlerleme Takibi

| Görev | Durum | Commit |
|-------|-------|--------|
| 1.1 Object.assign fix | ⏳ | - |
| 2.1 Constants package | ⏳ | - |
| 2.2 Language migration | ⏳ | - |
| 3.1 BaseEntityService | ⏳ | - |
| 3.2 QueryBuilder usage | ⏳ | - |
| 3.3 planning.service split | ⏳ | - |
| 3.3 booking.service split | ⏳ | - |
| 4.1 useListView migration | ⏳ | - |
| 4.2 Shared components | ⏳ | - |
| 4.3 AgenciesView split | ⏳ | - |

---

## Notlar

- Her değişiklik sonrası commit yapılacak
- Mevcut API kontratları korunacak
- Breaking change yapılmayacak
- Test edilebilirlik artırılacak

---

**Son Güncelleme:** 2026-01-06
