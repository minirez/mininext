# Booking Engine - Modular Architecture Overview

The project has been refactored into a Monorepo using Turborepo with a modular structure for both the Backend (API) and Frontend (Admin).

## Monorepo Structure

```
Root
├── apps/
│   ├── admin/    (Frontend - Vue 3 + Pinia + Tailwind)
│   ├── api/      (Backend - Express.js + MongoDB)
│   └── widget/   (Booking Widget - Vue 3, Shadow DOM, IIFE build)
├── packages/
│   ├── constants/  (Shared constants)
│   ├── validation/ (Shared validation schemas)
│   └── utils/      (Shared utilities - @booking-engine/utils)
└── turbo.json
```

## Backend (apps/api)

The API has been decomposed from a monolithic PMS module into domain-specific modules.

**Location:** `apps/api/src/modules/`

### PMS Modules
- **pms-guest**: Guest profiles, history, statistics.
- **pms-reservation**: Bookings, availability, payments.
- **pms-frontdesk**: Check-in/out, room assignment, stay management.
- **pms-housekeeping**: Room status, cleaning schedules.
- **pms-billing**: Cashier, invoicing, night audit.
- **pms-settings**: Configuration, users, roles.

### Refactored Service Modules (God File Splits)

**Partner Module** (`modules/partner/`):
```
partner.service.js           -> Orkestrasyoncu (re-export)
partnerProfile.service.js    -> Profil CRUD
partnerBranding.service.js   -> Logo, tema, branding
partnerBilling.service.js    -> Fatura, abonelik
partnerDocuments.service.js  -> Dokuman yonetimi
partnerEmail.service.js      -> Email konfigurasyonu
partnerSMS.service.js        -> SMS konfigurasyonu
partnerPMS.service.js        -> PMS entegrasyonu
```

**Booking Module** (`modules/booking/`):
```
bookingCrud.service.js        -> CRUD orkestrasyoncu
bookingCreate.service.js      -> Olusturma mantigi
bookingUpdate.service.js      -> Guncelleme mantigi
bookingStatus.service.js      -> Durum gecisleri
bookingQuery.service.js       -> Sorgulama/listeleme
payment.service.js            -> Odeme orkestrasyoncu
paymentGateway.service.js     -> 3D Secure, POS entegrasyonu
paymentPreAuth.service.js     -> On provizyon islemleri
paymentRefund.service.js      -> Iade islemleri
paymentWebhook.service.js     -> Webhook islemleri
paymentLink.service.js        -> Odeme linki
payment-notifications.service.js -> Odeme bildirimleri
paymentAnalytics.service.js   -> Odeme analitikleri
```

**Booking Route Sub-files** (`modules/booking/`):
```
booking.routes.js             -> Ana booking route'lari
payment.routes.js             -> Odeme route'lari
paymentWebhook.routes.js      -> Webhook route'lari
paymentAnalytics.routes.js    -> Analitik route'lari
```

**Tour Module** (`modules/tour/`):
```
tour.service.js              -> Orkestrasyoncu (re-export)
tourCrud.service.js          -> Tur CRUD
tourDeparture.service.js     -> Hareket yonetimi
tourBooking.service.js       -> Tour rezervasyon
tourMedia.service.js         -> Medya/gorsel yonetimi
tourExtras.service.js        -> Ekstra hizmetler
tourAI.service.js            -> AI entegrasyonu
```

**Public Module** (`modules/public/`):
```
public.routes.js             -> Ana public route'lari
publicStorefront.routes.js   -> Storefront route'lari
```

### Mail Helper (`helpers/mail/`)

```
transporter.js   -> SMTP/SES konfigurasyonu
core.js          -> Template rendering + temel fonksiyonlar
senders.js       -> Email gonderim fonksiyonlari
```

**Key Changes:**
- Dedicated `*.routes.js` for each module.
- `apps/api/src/modules/pms/pms.routes.js` aggregates PMS routes.
- God files split into focused sub-services (avg ~200-300 lines/file).
- Path aliases used for imports (`#helpers`, `#core/*`, `#modules/*`).

## Frontend (apps/admin)

The Admin panel has been refactored from a flat `views/pms` structure to a Feature-Oriented Architecture.

**Location:** `apps/admin/src/modules/`

Each module contains its own `views`, `components`, and potentially `stores` or `services` (feature-specific).

- **guests**: `GuestsView.vue`, `KBSView.vue`, Guest modals.
- **reservations**: `ReservationsView.vue`, Booking wizards.
- **frontdesk**: `FrontDeskView.vue`, `RoomPlanView.vue`.
- **housekeeping**: `HousekeepingView.vue`, `HousekeepingMobileView.vue`.
- **billing**: `BillingView.vue`, `CashierView.vue`, `NightAuditView.vue`.
- **settings**: `SettingsView.vue`, `UsersView.vue`.
- **dashboard**: `DashboardView.vue`.
- **reports**: `ReportsView.vue`.
- **auth**: `LoginView.vue`, `HotelSelectView.vue`.
- **shared**: Common PMS components (`PmsProvider`, `PMSHeader`, etc.).

### Router (Modular)

Router tek dosyadan (721 satir) moduler yapiya donusturuldu (270 satir + 7 route modulu):
```
router/
  index.js          -> Ana router + guard'lar (270 satir)
  routes/
    auth.js         -> Login, register, forgot password
    admin.js        -> Platform admin route'lari
    booking.js      -> Rezervasyon route'lari
    tours.js        -> Tur route'lari
    payment.js      -> Odeme route'lari
    hotels.js       -> Otel route'lari
    site.js         -> Site yonetimi route'lari
```

### i18n Organization

Lokalizasyon dosyalari modular yapiya donusturuldu. `misc.json` %72 kucultuldu:
```
locales/
  tr/                          en/
    common.json                  common.json
    auth.json                    auth.json
    booking.json                 booking.json
    planning.json                planning.json
    tour.json                    tour.json
    hotels.json                  hotels.json
    agencies.json                agencies.json
    partners.json                partners.json
    users.json                   users.json
    settings.json                settings.json
    siteSettings.json            siteSettings.json
    siteManagement.json          siteManagement.json
    website.json                 website.json
    companyProfile.json          companyProfile.json
    notifications.json           notifications.json
    paymentLink.json             paymentLink.json
    mySubscription.json          mySubscription.json
    developers.json              developers.json
    issues.json                  issues.json
    emailLogs.json               emailLogs.json
    pmsIntegration.json          pmsIntegration.json
    widget.json                  widget.json
    misc.json                    misc.json (kucultulmus)
```

**Benefits:**
- **Scalability**: Easier to add new features without cluttering global folders.
- **Maintainability**: Related code is co-located, god files eliminated.
- **Separation of Concerns**: Clear boundaries between domains.
- **i18n Maintainability**: Locale files organized by feature/domain.

## Reform Progress

See `docs/REFORM_PLAN.md` for detailed progress tracking. Summary:
- **Faz 0 (Security)**: Completed - Rate limiter, XSS check, scoped styles fix
- **Faz 1 (Foundations)**: Completed - Workspace config, versions, ESLint, .env.example
- **Faz 2 (Backend God Files)**: Completed - 5 service files + mail helper split
- **Faz 5 (Router + i18n)**: Completed - Router modularized, i18n reorganized
- **Faz 3, 4, 6-9**: Pending

## Next Steps
- Continue developing new features within the established modular patterns.
- Adopt BaseEntityService for simple CRUD modules (Faz 3).
- Split frontend god files (Faz 4).
- Add comprehensive test coverage (Faz 7).
