/**
 * Frontend Type Definitions (JSDoc)
 *
 * Bu dosya frontend'de kullanılan veri yapılarını tanımlar.
 * IDE autocomplete ve belgeleme için kullanılır.
 *
 * ÖNEMLI: Bu tipler backend modellerinden türetilmiştir.
 * Backend modelinde değişiklik yapıldığında burası da güncellenmelidir.
 *
 * @fileoverview Frontend type definitions for User, Partner, Agency and common types
 */

// ==================== COMMON TYPES ====================

/**
 * @typedef {Object} Avatar
 * @property {string} [filename] - Avatar dosya adı
 * @property {string} [url] - Avatar URL'i (relative path, örn: /uploads/avatars/xxx.png)
 * @property {Date} [uploadedAt] - Yükleme tarihi
 */

/**
 * @typedef {Object} Address
 * @property {string} [street] - Sokak adresi
 * @property {string} [city] - Şehir
 * @property {string} [country] - Ülke
 * @property {string} [postalCode] - Posta kodu
 */

/**
 * @typedef {Object} Document
 * @property {string} _id - Document ID
 * @property {'license'|'certificate'|'tax_certificate'|'contract'|'other'} type - Belge tipi
 * @property {string} [name] - Belge adı
 * @property {string} [url] - Belge URL'i (relative path)
 * @property {Date} uploadedAt - Yükleme tarihi
 */

/**
 * @typedef {'view'|'create'|'edit'|'delete'} PermissionAction
 */

/**
 * @typedef {Object} ModulePermission
 * @property {string} module - Modül adı
 * @property {Object} actions - İzin verilen eylemler
 * @property {boolean} actions.view - Görüntüleme izni
 * @property {boolean} actions.create - Oluşturma izni
 * @property {boolean} actions.edit - Düzenleme izni
 * @property {boolean} actions.delete - Silme izni
 */

// ==================== USER TYPES ====================

/**
 * @typedef {'platform'|'partner'|'agency'} AccountType
 */

/**
 * @typedef {'admin'|'user'} UserRole
 */

/**
 * @typedef {'pending'|'pending_activation'|'active'|'inactive'} UserStatus
 */

/**
 * @typedef {Object} NotificationPreferences
 * @property {Object} email - E-posta bildirimleri
 * @property {boolean} email.bookingConfirmation
 * @property {boolean} email.bookingCancellation
 * @property {boolean} email.bookingReminder
 * @property {boolean} email.paymentReminder
 * @property {boolean} email.promotions
 * @property {boolean} email.systemUpdates
 * @property {Object} sms - SMS bildirimleri
 * @property {boolean} sms.bookingConfirmation
 * @property {boolean} sms.bookingCancellation
 * @property {boolean} sms.bookingReminder
 * @property {boolean} sms.paymentReminder
 * @property {Object} push - Push bildirimleri
 * @property {boolean} push.bookingConfirmation
 * @property {boolean} push.bookingCancellation
 * @property {boolean} push.bookingReminder
 * @property {boolean} push.paymentReminder
 * @property {boolean} push.systemUpdates
 */

/**
 * User object returned from API
 *
 * @typedef {Object} User
 * @property {string} _id - User ID
 * @property {string} [id] - User ID (alias)
 * @property {AccountType} accountType - Hesap tipi (platform, partner, agency)
 * @property {string} accountId - İlişkili hesap ID'si (Partner veya Agency _id)
 * @property {string} name - Kullanıcı adı
 * @property {string} email - E-posta adresi
 * @property {string} [phone] - Telefon numarası
 * @property {Avatar} [avatar] - Avatar bilgisi (OBJECT, string değil!)
 * @property {UserRole} role - Kullanıcı rolü (admin, user)
 * @property {ModulePermission[]} [permissions] - Modül izinleri
 * @property {UserStatus} status - Hesap durumu
 * @property {boolean} [isOnline] - Çevrimiçi durumu
 * @property {Date} [lastLogin] - Son giriş tarihi
 * @property {string} [language] - Dil tercihi (tr, en, de, ru, ar)
 * @property {NotificationPreferences} [notificationPreferences] - Bildirim tercihleri
 * @property {boolean} [twoFactorEnabled] - 2FA aktif mi
 * @property {boolean} [forcePasswordChange] - Şifre değişikliği zorunlu mu
 * @property {Date} [createdAt] - Oluşturulma tarihi
 * @property {Date} [updatedAt] - Güncellenme tarihi
 */

// ==================== PARTNER TYPES ====================

/**
 * @typedef {'active'|'inactive'|'pending'} PartnerStatus
 */

/**
 * @typedef {'TRY'|'USD'|'EUR'|'GBP'} Currency
 */

/**
 * @typedef {'business'|'professional'|'enterprise'} SubscriptionPlan
 */

/**
 * @typedef {'active'|'expired'|'grace_period'|'cancelled'|'suspended'} SubscriptionStatus
 */

/**
 * @typedef {Object} PartnerBranding
 * @property {string} [logo] - Logo URL'i
 * @property {string} [favicon] - Favicon URL'i
 * @property {string} [siteDomain] - B2C site domain
 * @property {string} [extranetDomain] - B2B extranet domain
 * @property {string} [pmsDomain] - PMS domain
 */

/**
 * @typedef {Object} PartnerMarkup
 * @property {number} hotel - Otel markup yüzdesi (0-100)
 * @property {number} tour - Tur markup yüzdesi (0-100)
 * @property {number} transfer - Transfer markup yüzdesi (0-100)
 */

/**
 * @typedef {Object} PartnerStats
 * @property {number} totalAgencies - Toplam acente sayısı
 * @property {number} totalBookings - Toplam rezervasyon sayısı
 * @property {number} totalRevenue - Toplam gelir
 */

/**
 * @typedef {Object} SubscriptionPurchase
 * @property {string} _id - Purchase ID
 * @property {SubscriptionPlan} plan - Paket tipi
 * @property {Object} period - Dönem bilgisi
 * @property {Date} period.startDate - Başlangıç tarihi
 * @property {Date} period.endDate - Bitiş tarihi
 * @property {Object} price - Fiyat bilgisi
 * @property {number} price.amount - Tutar
 * @property {Currency} price.currency - Para birimi
 * @property {Object} [payment] - Ödeme bilgisi
 * @property {Date} [payment.date] - Ödeme tarihi
 * @property {string} [payment.method] - Ödeme yöntemi
 * @property {string} [payment.reference] - Referans
 * @property {string} [invoice] - Fatura ID'si
 * @property {'pending'|'active'|'expired'|'cancelled'|'refunded'} status - Durum
 * @property {Date} createdAt - Oluşturulma tarihi
 */

/**
 * @typedef {Object} PartnerSubscription
 * @property {SubscriptionStatus} status - Abonelik durumu
 * @property {Object} [customLimits] - Özel limitler
 * @property {number} [customLimits.pmsMaxHotels] - PMS otel limiti
 * @property {SubscriptionPurchase[]} purchases - Satın alımlar
 * @property {string} [notes] - Admin notları
 */

/**
 * Partner object returned from API
 *
 * @typedef {Object} Partner
 * @property {string} _id - Partner ID
 * @property {string} [id] - Partner ID (alias)
 * @property {PartnerStatus} status - Partner durumu
 * @property {string} [code] - Partner kodu (PMS girişi için)
 * @property {string} companyName - Şirket adı
 * @property {string} [tradeName] - Ticari isim
 * @property {string} email - E-posta
 * @property {string} [phone] - Telefon
 * @property {string} [taxOffice] - Vergi dairesi
 * @property {string} [taxNumber] - Vergi numarası
 * @property {Address} [address] - Adres bilgisi
 * @property {Document[]} [documents] - Belgeler
 * @property {PartnerBranding} [branding] - Marka ayarları
 * @property {Currency} [currency] - Para birimi
 * @property {PartnerMarkup} [markup] - Markup ayarları
 * @property {PartnerStats} [stats] - İstatistikler
 * @property {PartnerSubscription} [subscription] - Abonelik bilgisi
 * @property {Date} [createdAt] - Oluşturulma tarihi
 * @property {Date} [updatedAt] - Güncellenme tarihi
 */

// ==================== AGENCY TYPES ====================

/**
 * @typedef {'active'|'inactive'|'pending'|'suspended'} AgencyStatus
 */

/**
 * @typedef {Object} AgencyContactPerson
 * @property {string} [name] - Yetkili kişi adı
 * @property {string} [phone] - Telefon
 * @property {string} [email] - E-posta
 */

/**
 * @typedef {Object} AgencyCommissionSettings
 * @property {'percentage'|'fixed'} type - Komisyon tipi
 * @property {number} rate - Komisyon oranı
 * @property {boolean} extraMarkupAllowed - Ekstra markup izni
 * @property {number} maxExtraMarkup - Max ekstra markup yüzdesi
 */

/**
 * @typedef {Object} AgencyCreditLimit
 * @property {boolean} enabled - Kredi limiti aktif mi
 * @property {number} amount - Kredi limiti tutarı
 * @property {Currency} currency - Para birimi
 * @property {number} used - Kullanılan kredi
 */

/**
 * @typedef {Object} AgencyStats
 * @property {number} totalBookings - Toplam rezervasyon
 * @property {number} totalRevenue - Toplam gelir
 * @property {Date} [lastBookingDate] - Son rezervasyon tarihi
 */

/**
 * Agency object returned from API
 *
 * @typedef {Object} Agency
 * @property {string} _id - Agency ID
 * @property {string} [id] - Agency ID (alias)
 * @property {string} partner - Partner ID
 * @property {AgencyStatus} status - Acente durumu
 * @property {string} companyName - Şirket adı
 * @property {string} [tradeName] - Ticari isim
 * @property {string} [name] - Şirket adı (legacy)
 * @property {string} email - E-posta
 * @property {string} [phone] - Telefon
 * @property {string} [taxOffice] - Vergi dairesi
 * @property {string} [taxNumber] - Vergi numarası
 * @property {Address} [address] - Adres bilgisi
 * @property {AgencyContactPerson} [contactPerson] - Yetkili kişi
 * @property {Document[]} [documents] - Belgeler
 * @property {AgencyCommissionSettings} [commissionSettings] - Komisyon ayarları
 * @property {PartnerMarkup} [markup] - Markup ayarları (legacy)
 * @property {AgencyCreditLimit} [creditLimit] - Kredi limiti
 * @property {AgencyStats} [stats] - İstatistikler
 * @property {number} [availableCredit] - Kullanılabilir kredi (virtual)
 * @property {Date} [createdAt] - Oluşturulma tarihi
 * @property {Date} [updatedAt] - Güncellenme tarihi
 */

// ==================== SESSION TYPES ====================

/**
 * @typedef {'active'|'expired'|'terminated'} SessionStatus
 */

/**
 * @typedef {Object} Session
 * @property {string} _id - Session ID
 * @property {string} user - User ID
 * @property {SessionStatus} status - Oturum durumu
 * @property {string} [browser] - Tarayıcı adı
 * @property {string} [os] - İşletim sistemi
 * @property {'desktop'|'mobile'|'tablet'|'unknown'} [deviceType] - Cihaz tipi
 * @property {string} [ipAddress] - IP adresi
 * @property {Object} [location] - Konum bilgisi
 * @property {string} [location.city] - Şehir
 * @property {string} [location.country] - Ülke
 * @property {Date} [lastActivity] - Son aktivite tarihi
 * @property {boolean} [isCurrent] - Mevcut oturum mu
 * @property {Date} [createdAt] - Oluşturulma tarihi
 */

// ==================== API RESPONSE TYPES ====================

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - İşlem başarılı mı
 * @property {string} [message] - Mesaj
 * @property {*} [data] - Veri
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {boolean} success - İşlem başarılı mı
 * @property {Object} data - Veri
 * @property {Array} data.items - Öğeler
 * @property {Object} data.pagination - Sayfalama bilgisi
 * @property {number} data.pagination.page - Mevcut sayfa
 * @property {number} data.pagination.limit - Sayfa başına öğe
 * @property {number} data.pagination.total - Toplam öğe sayısı
 * @property {number} data.pagination.pages - Toplam sayfa sayısı
 */

// Export for IDE recognition (not actually used at runtime)
export default {}
