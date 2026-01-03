# Booking Engine - Claude Kuralları

## ⛔ YASAKLAR (KESİNLİKLE YAPMA)

- **Dev server başlatma/durdurma**: `turbo dev`, `npm run dev`, `pkill`, `kill` vb. YASAK
- **Hardcode metin**: Her zaman `$t('key')` kullan
- **Doğrudan axios çağrısı**: Service katmanı kullan
- **Yeni UI component**: Önce `components/ui/` kontrol et, varsa kullan
- **Manuel restart**: Dosya değişikliklerinde otomatik reload çalışır

---

## 🏗️ MİMARİ

```
booking-engine/
├── apps/
│   ├── api/          # Express.js Backend (Port 4000)
│   └── admin/        # Vue 3 Frontend (Port 5173)
├── packages/
│   └── validation/   # Shared validation schemas
└── turbo.json        # Monorepo config
```

**Stack:**
- Backend: Express + MongoDB + Mongoose + Socket.io + JWT
- Frontend: Vue 3 (Composition API) + Pinia + Tailwind + Vite
- Monorepo: Turborepo + pnpm workspaces

---

## 📁 KRİTİK KONUMLAR

| Amaç | Konum |
|------|-------|
| UI Components | `apps/admin/src/components/ui/` |
| Common Components | `apps/admin/src/components/common/` |
| PMS Shared | `apps/admin/src/modules/shared/components/` |
| Frontend Modules | `apps/admin/src/modules/` |
| Frontend Services | `apps/admin/src/services/` |
| Backend Modules | `apps/api/src/modules/` |
| Backend Services | `apps/api/src/services/` |
| i18n Dosyaları | `apps/admin/src/locales/{tr,en}.json` |

---

## 💡 GELİŞTİRME KURALLARI

1. **PMS Context**: `usePmsContextInjection()` ile `hotelId` al, tüm PMS sorgularında kullan
2. **API İstekleri**: `services/` klasöründeki fonksiyonları kullan, component içinde axios çağırma
3. **Yeni Özellik**: İlgili `modules/` klasöründe çalış (DDD yapısı)
4. **Çeviri Ekleme**: Hem `tr.json` hem `en.json`'a ekle
5. **Component Seçimi**: Önce UI → Common → PMS Shared sırasıyla kontrol et

---

## 🧩 MEVCUT UI COMPONENTLER

**Buttons:** `BaseButton`, `IconButton`, `ActionMenu`
**Form:** `PhoneInput`, `PasswordInput`, `Toggle`, `DateRangePicker`, `MultiLangInput`
**Display:** `StatusBadge`, `Avatar`, `Tooltip`, `Timeline`
**Overlay:** `Modal`, `Drawer`
**Feedback:** `Alert`, `ConfirmDialog`, `Spinner`
**Data:** `DataTable`

**Common:** `HotelSelector`, `PartnerSelector`, `DocumentUpload`, `LanguageSelector`

---

## 🔗 REFERANSLAR

- Güvenlik notları: `docs/SECURITY.md`
- Mimari detayları: `docs/ARCHITECTURE_V2.md`
- Pricing modülü: `docs/pricing-module-research.md`

---

**Son Güncelleme:** 2026-01-04
