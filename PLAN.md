# Booking Engine - Inovasyon Planı V2

> Oluşturulma: 2026-02-16 | Durum: Tasarım | Araştırma: 4 ajan paralel analiz + endüstri araştırması

## Context

Proje kalite iyileştirme planı (PLAN.md) 10/10 tamamlandı. Sistem olgunlaştı: 48 model, 62 route, 36 frontend servis, 15 store. Şimdi sıra rekabet avantajı sağlayacak **inovatif özelliklere** geldi. Türk pazarına odaklı, Cloudbeds/Mews/HotelRunner/HotelLinx'ten farklılaşacak özellikler.

---

## Faz 1: Hızlı Kazanımlar (1-2 hafta/madde)

### 1. WhatsApp Business API Entegrasyonu

**Etki: Çok Yüksek | Efor: Orta**

Türkiye'de WhatsApp %85+ penetrasyona sahip, e-posta açılma oranı %20-30 iken WhatsApp %98.

**Kapsam:**

- WhatsApp Cloud API entegrasyonu (Meta Business Platform)
- Webhook endpoint: `POST /api/whatsapp/webhook`
- Otomatik mesaj akışları:
  - Rezervasyon onayı (booking confirmation sonrası)
  - Ödeme hatırlatma (payment reminder)
  - Check-in öncesi bilgilendirme (1 gün önce)
  - Check-out hatırlatma
- WhatsApp Flows ile basit rezervasyon akışı (tarih seç → oda seç → bilgi gir → ödeme linki)
- Admin panelde WhatsApp mesaj geçmişi görüntüleme

**Dosyalar:**

- Yeni modül: `apps/api/src/modules/whatsapp/`
  - `whatsapp.routes.js` - webhook + send endpoints
  - `whatsapp.service.js` - Meta Cloud API client
  - `whatsappFlow.service.js` - booking flow handler
  - `whatsappTemplates.js` - mesaj şablonları (TR/EN)
- `apps/api/src/modules/booking/payment-notifications.service.js` - WhatsApp kanal ekleme
- `apps/admin/src/components/partner/WhatsAppSettings.vue` - API key, telefon no ayarları
- Partner model'e `whatsappConfig` alanı ekleme

**Mevcut Altyapı:** `notificationService.js` zaten multi-channel (email, push, in-app). WhatsApp 4. kanal olarak eklenir.

---

### 2. AI Concierge (Claude API + WhatsApp)

**Etki: Yüksek | Efor: Orta**

Misafir sorularının %85+'ini otomatik yanıtlayan çok dilli AI chatbot. WhatsApp üzerinden çalışır.

**Kapsam:**

- Claude API (claude-haiku-4-5) entegrasyonu - düşük maliyet, yüksek hız
- Hotel-specific context: otel bilgileri, oda tipleri, politikalar, restoran menüsü, WiFi şifresi, çevredeki yerler
- Çok dilli destek (TR, EN, DE, RU, AR - Türkiye'nin ana pazarları)
- Misafir intent detection: bilgi sorusu → AI yanıt, rezervasyon talebi → booking flow, şikayet → staff escalation
- Conversation history (MongoDB'de sakla)

**Dosyalar:**

- `apps/api/src/modules/whatsapp/aiConcierge.service.js` - Claude API client + context builder
- `apps/api/src/modules/hotel/hotel.model.js` - `conciergeContext` alanı (SSS, menü, yerel rehber)
- Admin panelde: "AI Concierge Ayarları" sayfası (context düzenleme, FAQ yönetimi)

**Teknik:** Her otel için system prompt oluşturulur: otel bilgileri + politikalar + SSS + yerel rehber. Misafir mesajı geldiğinde context + mesaj Claude'a gönderilir.

---

### 3. Akıllı Upselling Motoru

**Etki: Yüksek | Efor: Orta**

Oteller upselling ile ek gelirin %10-20'sini artırabilir. Pre-arrival timing: check-in'den 7 gün önce gönderilen teklifler %8.23 dönüşüm oranına sahip.

**Kapsam:**

- Upsell teklif motoru: oda upgrade, erken check-in, geç check-out, transfer, spa paketi, hoş geldin paketi
- Otomatik zamanlama: 7 gün önce (e-posta), 3 gün önce (WhatsApp), check-in anı (admin bildirim)
- Misafir profili bazlı teklif seçimi (VIP → premium teklifler, first-time → welcome paketi)
- Tracking: görüntülenme, tıklanma, kabul/red, gelir attribution
- A/B testing desteği (farklı fiyat/sunum testleri)

**Dosyalar:**

- Yeni modül: `apps/api/src/modules/upsell/`
  - `upsellOffer.model.js` - teklif modeli
  - `upsellTemplate.model.js` - otel bazlı teklif şablonları
  - `upsell.service.js` - teklif oluşturma, gönderme, tracking
  - `upsell.routes.js` - admin CRUD + public kabul/red
- BullMQ worker: `apps/api/src/workers/upsellWorker.js` - zamanlı gönderim
- Widget/public: basit upsell kabul sayfası (token-based, PaymentLink benzeri)
- Admin: Upsell dashboard (dönüşüm oranları, gelir raporu)

**Mevcut Altyapı:** Guest model'de `statistics.totalStays`, `statistics.totalSpent`, `vipLevel`, `preferences` zaten var. PaymentLink sistemi tekliflerin ödemesi için kullanılabilir.

---

### 4. Matterport / 360° Sanal Tur Entegrasyonu

**Etki: Orta | Efor: Düşük**

Marriott: Matterport entegrasyonu sonrası online booking etkileşimi %67 arttı. Minimal efor, yüksek etki.

**Kapsam:**

- Hotel model'e `virtualTour` alanı ekleme (provider, url, isActive)
- RoomType model'e `virtualTourUrl` alanı ekleme
- Widget'ta "Sanal Tur" butonu (Matterport iframe embed)
- Admin panelde URL yönetimi
- Storefront'ta sanal tur sayfası

**Dosyalar:**

- `apps/api/src/modules/hotel/hotel.model.js` - virtualTour field
- `apps/api/src/modules/planning/roomType.model.js` - virtualTourUrl field
- `apps/widget/src/components/RoomCard.vue` - "Sanal Tur" butonu
- `apps/admin/src/components/hotel/VirtualTourTab.vue` - URL yönetimi

---

## Faz 2: Rekabet Avantajı (2-4 hafta/madde)

### 5. E-Fatura / E-Arşiv GIB Entegrasyonu

**Etki: Kritik (Yasal Zorunluluk) | Efor: Yüksek**

01.07.2026'da konaklama işletmeleri (brüt satış >= 500K TL) için e-Fatura zorunlu. Rakiplerin çoğunda yok.

**Kapsam:**

- GIB onaylı entegratör API entegrasyonu (Sovos/Foriba veya Uyumsoft)
- UBL-TR 1.0 XML oluşturma (konaklama KDV: %8)
- Booking → e-Fatura otomatik oluşturma
- e-Arşiv fatura (B2C) desteği
- Fatura durumu takibi (gönderildi, onaylandı, reddedildi)
- Admin panelde fatura listesi, PDF indirme, yeniden gönderme

**Dosyalar:**

- Yeni modül: `apps/api/src/modules/einvoice/`
  - `einvoice.model.js` - fatura kaydı
  - `einvoice.service.js` - UBL-TR builder + entegratör API client
  - `einvoice.routes.js` - CRUD + gönderim + PDF
  - `providers/sovos.js` - Sovos/Foriba API adapter
  - `providers/uyumsoft.js` - Uyumsoft API adapter
- `apps/api/src/modules/booking/booking.model.js` - `invoiceDetails` zaten var, `einvoiceId` ref ekleme
- Admin: Fatura listesi view, fatura detay drawer, ayarlar sayfası

**Mevcut Altyapı:** Booking model'de `invoiceDetails` (individual/corporate, taxNumber, taxOffice) zaten mevcut. Direkt UBL-TR mapping yapılabilir.

---

### 6. Google Hotel Ads / Metasearch Entegrasyonu

**Etki: Çok Yüksek | Efor: Yüksek**

OTA komisyonları %15-25. Google Hotel Ads ile direkt rezervasyon artışı, Free Booking Links ile ücretsiz görünürlük.

**Kapsam:**

- ARI (Availability, Rates, Inventory) XML feed oluşturma
- Google Hotel Center API entegrasyonu
- Free Booking Links desteği (ücretsiz, OTA'sız)
- Fiyat doğruluk skoru takibi
- Landing page optimizasyonu (widget ile doğrudan booking)
- Rate parity monitoring (Google vs OTA fiyat karşılaştırma)

**Dosyalar:**

- Yeni modül: `apps/api/src/modules/metasearch/`
  - `googleHotelAds.service.js` - ARI XML builder
  - `metasearch.routes.js` - feed endpoints
  - `rateParityMonitor.service.js` - parity check
- Cron job: Her 15 dakikada ARI feed güncelleme
- Admin: Google Hotel Center bağlantı ayarları

**Mevcut Altyapı:** Rate model'de günlük fiyat, allotment, stopSale zaten var. ARI feed'e direkt mapping yapılabilir.

---

### 7. AI Revenue Management (Kural Bazlı Başlangıç)

**Etki: Yüksek | Efor: Orta**

Başlangıçta kural bazlı, sonra ML ile genişletilebilir. Doluluk > %70 → fiyat artır, < %30 → fiyat düşür.

**Kapsam:**

- Doluluk bazlı fiyat önerisi motoru
- Lead time bazlı fiyat ayarı (son dakika ↑, erken rezervasyon ↓)
- Hafta içi/sonu fark önerisi
- Geçmiş yıl karşılaştırmalı pace raporu
- Admin dashboard: fiyat önerisi kabul/red arayüzü
- Otomatik veya yarı-otomatik mod seçimi

**Dosyalar:**

- Yeni modül: `apps/api/src/modules/revenue-management/`
  - `revenueRules.model.js` - kural tanımları
  - `revenueEngine.service.js` - fiyat öneri motoru
  - `revenueAnalytics.service.js` - pace raporu, doluluk analizi
  - `revenue.routes.js` - öneri listesi, kabul/red, ayarlar
- BullMQ worker: günlük fiyat önerisi hesaplama
- Admin: Revenue dashboard, kural yönetimi, öneri listesi

**Mevcut Altyapı:** Rate model'de `allotment`, `sold` var. Booking model'de tarih bazlı doluluk hesaplanabilir. `paymentAnalytics.service.js` gelir analizi zaten yapıyor.

---

### 8. Online Check-in + Pasaport OCR + KBS Otomasyonu

**Etki: Yüksek | Efor: Yüksek**

Misafirlerin %73'ü mobil check-in sunan otelleri tercih ediyor. KBS otomasyonu front desk yükünü azaltır.

**Kapsam:**

- Misafir self-servis pre-registration formu (mobil web)
- Pasaport/TC kimlik fotoğraf çekme + OCR (Tesseract.js veya Mindee API)
- MRZ (Machine Readable Zone) okuma ile otomatik form doldurma
- TC Kimlik doğrulama (NVI API)
- KBS otomatik gönderim (kbs.egm.gov.tr XML entegrasyonu)
- Dijital imza (canvas-based)
- Oda seçimi (müsait odalar arasından)

**Dosyalar:**

- Yeni modül: `apps/api/src/modules/online-checkin/`
  - `onlineCheckin.service.js` - check-in flow orchestrator
  - `ocrService.js` - OCR/MRZ processing
  - `kbsSubmission.service.js` - KBS XML gönderim
  - `onlineCheckin.routes.js` - public token-based endpoints
- `apps/api/src/modules/pms-guest/kbs.service.js` - zaten var, genişletilecek
- Public web sayfası: check-in formu (widget benzeri embed veya standalone)

**Mevcut Altyapı:** Guest model'de KBS alanları (`kbsStatus`, `kbsSentAt`, `fatherName`, `motherName`, `birthPlace`) zaten var. `kbsClient.js` mevcut.

---

## Faz 3: Gelir Artırıcılar (4-8 hafta/madde)

### 9. Guest 360 CRM + Predictive Analytics

**Etki: Çok Yüksek | Efor: Yüksek**

Misafir yaşam boyu değeri (CLV) hesaplama, churn tahmini, RFM segmentasyonu.

**Kapsam:**

- RFM (Recency, Frequency, Monetary) segmentasyonu: Champion, Loyal, At Risk, Lost, New
- CLV (Customer Lifetime Value) hesaplama
- Churn probability skoru (0-1)
- Misafir tercih hafızası ("Geçen seferkiyle aynı oda ister misiniz?")
- Özel gün takibi (doğum günü, evlilik yıldönümü)
- Segmente göre otomatik kampanya tetikleme
- Guest 360 dashboard (tüm etkileşim geçmişi tek ekranda)

**Dosyalar:**

- `apps/api/src/modules/pms-guest/guest.model.js` - RFM skoru, CLV, churn probability alanları ekleme
- Yeni: `apps/api/src/modules/guest-crm/`
  - `guestSegmentation.service.js` - RFM hesaplama
  - `guestPrediction.service.js` - churn + CLV
  - `guestCampaign.service.js` - segmente göre otomatik aksiyonlar
- BullMQ worker: haftalık RFM güncelleme
- Admin: Guest 360 dashboard view

**Mevcut Altyapı:** Guest model'de `statistics` (totalStays, totalSpent, lastStayDate, avgStayLength, noShowCount, cancellationCount) ve `vipLevel`, `loyaltyPoints` zaten var. Mükemmel başlangıç noktası.

---

### 10. Grup Rezervasyon Yönetimi

**Etki: Yüksek | Efor: Orta**

Türkiye grup turizmi için popüler (tur operatörleri, kurumsal etkinlikler, düğünler). Şu an grup süreci manuel.

**Kapsam:**

- Grup rezervasyon talep formu (public)
- Allotment yönetimi (blok oda + cutoff tarihi)
- Rooming list import/yönetimi
- Grup özel fiyat (negotiated rates)
- Master/bireysel faturalama
- Depozit takibi (aşamalı ödeme planı)
- Grup dashboard (aktif gruplar, pick-up %, gelir potansiyeli)

**Dosyalar:**

- Yeni modül: `apps/api/src/modules/group-booking/`
  - `groupBooking.model.js`
  - `groupBooking.service.js`
  - `groupAllotment.service.js`
  - `roomingList.service.js`
  - `groupBooking.routes.js`
- Admin: Grup listesi, grup detay, rooming list yönetimi views

---

### 11. Review / Reputation Yönetimi

**Etki: Çok Yüksek | Efor: Orta**

Booking.com'da 1 puan artış = %10-25 daha fazla rezervasyon. Türk otelleri OTA puanlarında yoğun rekabet ediyor.

**Kapsam:**

- Review aggregation (Booking.com, Google, TripAdvisor API'leri)
- AI sentiment analizi (Claude API ile tema çıkarma: temizlik, personel, yemek, konum)
- Yanıt yönetimi (AI-assisted yanıt taslağı)
- Competitor benchmarking (rakip otellerin puanları)
- Review solicitation (checkout sonrası otomatik e-posta/WhatsApp)
- Trend analizi (puan değişimi zaman serisi)

**Dosyalar:**

- Yeni modül: `apps/api/src/modules/reputation/`
  - `review.model.js` - birleştirilmiş review kaydı
  - `reviewAggregator.service.js` - platform API'lerinden çekme
  - `sentimentAnalysis.service.js` - Claude API ile analiz
  - `reputation.routes.js`
- Admin: Reputation dashboard, review listesi, yanıt yönetimi

---

### 12. BI Dashboard + Hotel KPI'lar

**Etki: Çok Yüksek | Efor: Orta**

Çoğu orta ölçekli Türk oteli Excel'e bağımlı. Built-in analitik büyük fark yaratır.

**Kapsam:**

- Otel seviyesi KPI'lar: RevPAR, ADR, Occupancy %, ALOS, Lead Time
- Kanal bazlı gelir dağılımı (direkt vs OTA vs acente)
- Pace raporu (geçen yıl vs bu yıl karşılaştırma)
- İptal oranı ve no-show analizi
- Kaynak pazar analizi (misafir milliyetine göre)
- Haftalık/aylık otomatik rapor e-postası
- PDF/Excel export

**Dosyalar:**

- Genişletme: `apps/api/src/modules/dashboard/`
  - `hotelKpi.service.js` - RevPAR, ADR, occupancy hesaplama
  - `paceReport.service.js` - YoY karşılaştırma
  - `channelAnalytics.service.js` - kanal bazlı analiz
- Admin: Interactive BI dashboard (chart library: lightweight-charts veya Chart.js)
- BullMQ worker: günlük KPI hesaplama + cache

**Mevcut Altyapı:** `dashboard.service.js` temel istatistikleri zaten hesaplıyor. `paymentAnalytics.service.js` gelir analizi var. `stats.service.js` booking istatistikleri var.

---

## Faz 4: Platform Oyunu (2-3 ay/madde)

### 13. Transfer Yönetim Modülü

**Etki: Yüksek | Efor: Düşük**

Havalimanı transferi Türk tatil otellerinde standart. Şu an WhatsApp+manuel yönetiliyor.

**Kapsam:**

- Transfer rezervasyonu (booking flow'a eklenti)
- Araç/şoför atama
- Uçuş bilgisi takibi
- Otomatik PMS billing entegrasyonu
- Misafir bilgilendirme (WhatsApp ile şoför bilgisi)

---

### 14. Bakım/Arıza Takip Sistemi (CMMS)

**Etki: Yüksek | Efor: Orta**

Yapılandırılmış bakım takibi: iş emri, öncelik, maliyet, periyodik bakım takvimi.

---

### 15. Sosyal Medya İçerik AI

**Etki: Orta | Efor: Düşük**

Claude API ile booking verisinden sosyal medya post önerileri. Sezonsal kampanyalar, misafir trendleri, yerel etkinlikler bazlı.

---

## Uygulama Sırası ve Öncelik Matrisi

| #   | Özellik                          | Faz   | Efor   | Etki       | Öncelik |
| --- | -------------------------------- | ----- | ------ | ---------- | ------- |
| 1   | WhatsApp Business API            | Faz 1 | Orta   | Çok Yüksek | P0      |
| 2   | AI Concierge (Claude + WhatsApp) | Faz 1 | Orta   | Yüksek     | P0      |
| 3   | Akıllı Upselling                 | Faz 1 | Orta   | Yüksek     | P1      |
| 4   | Sanal Tur (Matterport)           | Faz 1 | Düşük  | Orta       | P1      |
| 5   | E-Fatura / GIB                   | Faz 2 | Yüksek | Kritik     | P0      |
| 6   | Google Hotel Ads                 | Faz 2 | Yüksek | Çok Yüksek | P1      |
| 7   | AI Revenue Management            | Faz 2 | Orta   | Yüksek     | P1      |
| 8   | Online Check-in + OCR            | Faz 2 | Yüksek | Yüksek     | P2      |
| 9   | Guest 360 CRM                    | Faz 3 | Yüksek | Çok Yüksek | P1      |
| 10  | Grup Rezervasyon                 | Faz 3 | Orta   | Yüksek     | P2      |
| 11  | Reputation Management            | Faz 3 | Orta   | Çok Yüksek | P1      |
| 12  | BI Dashboard + KPI               | Faz 3 | Orta   | Çok Yüksek | P0      |
| 13  | Transfer Yönetimi                | Faz 4 | Düşük  | Yüksek     | P2      |
| 14  | Bakım Takip (CMMS)               | Faz 4 | Orta   | Yüksek     | P2      |
| 15  | Sosyal Medya AI                  | Faz 4 | Düşük  | Orta       | P3      |

**P0** = Hemen başla (en yüksek ROI veya yasal zorunluluk)
**P1** = Sonraki sprint
**P2** = Sırada bekle
**P3** = Nice-to-have

## Reddedilen Fikirler

| Fikir                    | Neden Reddedildi                                   |
| ------------------------ | -------------------------------------------------- |
| Blockchain/NFT Loyalty   | Türk pazarı için erken, karmaşıklık > değer        |
| In-Room Voice AI (Alexa) | Türkçe desteği zayıf, donanım maliyeti yüksek      |
| F&B Envanter Yönetimi    | Çekirdek PMS'den çok farklı alan, ayrı ürün olmalı |
| Spa/Aktivite Booking     | Niş segment, öncelik düşük                         |
| IoT Donanım Entegrasyonu | Platform seviyesinde donanım yönetimi pratik değil |

## Doğrulama

Her modül için:

1. Backend: Route'lar çalışıyor mu? (curl/Postman test)
2. Frontend: Admin panel'de CRUD çalışıyor mu?
3. Entegrasyon: Mevcut sistemlerle (booking, payment, notification) entegre mi?
4. i18n: TR + EN çeviriler eklendi mi?
5. Production: Deploy sonrası smoke test

## Notlar

- Her modül `pnpm create-module` ile oluşturulacak
- Path aliases kullanılacak (`#helpers`, `#core/*`, `#modules/*`)
- Tüm metinler i18n ile (`$t('key')`)
- Widget etkileşimleri shadow DOM kurallarına uyacak
- WhatsApp + AI Concierge birlikte geliştirilmeli (bağımlı)
- E-Fatura entegratör seçimi kullanıcı ile netleştirilmeli
