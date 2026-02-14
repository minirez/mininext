/**
 * @deprecated Bu dosya eski hardcoded plan sistemi için kullanılıyordu.
 * Yeni sistemde MembershipService ve MembershipPackage modülleri kullanılmaktadır.
 * Migration tamamlandıktan sonra tamamen kaldırılacaktır.
 * Bkz: apps/api/src/modules/membership-service/ ve membership-package/
 *
 * Subscription Plans Configuration
 * Paket tipleri, fiyatlar ve ozellikleri.
 * 4 paket: Web Design, Business, Professional, Enterprise
 */

export const SUBSCRIPTION_PLANS = {
  webdesign: {
    name: 'Web Design',
    description: 'Web tasarım ve domain yönetimi',
    price: {
      yearly: 29,
      currency: 'USD'
    },
    features: {
      pms: {
        enabled: false,
        maxHotels: 0
      },
      webDesign: {
        enabled: true,
        maxSites: 1,
        ssl: true,
        customDomain: true
      }
    }
  },
  business: {
    name: 'Business',
    description: 'Orta ölçekli işletmeler için',
    price: {
      yearly: 118.9,
      currency: 'USD'
    },
    features: {
      pms: {
        enabled: false,
        maxHotels: 0
      },
      webDesign: {
        enabled: false,
        maxSites: 0,
        ssl: false,
        customDomain: false
      }
    }
  },
  professional: {
    name: 'Professional',
    description: 'PMS entegrasyonu dahil profesyonel paket',
    price: {
      yearly: 178.8,
      currency: 'USD'
    },
    features: {
      pms: {
        enabled: true,
        maxHotels: 5
      },
      webDesign: {
        enabled: false,
        maxSites: 0,
        ssl: false,
        customDomain: false
      }
    }
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Sınırsız PMS ile kurumsal paket',
    price: {
      yearly: 298.8,
      currency: 'USD'
    },
    features: {
      pms: {
        enabled: true,
        maxHotels: -1 // -1 = sınırsız
      },
      webDesign: {
        enabled: false,
        maxSites: 0,
        ssl: false,
        customDomain: false
      }
    }
  }
}

// Grace period ve hatırlatma konfigürasyonu
export const SUBSCRIPTION_CONFIG = {
  gracePeriodDays: 14,
  reminderDaysBefore: [30, 14, 7, 3, 1] // Yenileme hatırlatma günleri
}

// Abonelik durumları
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  GRACE_PERIOD: 'grace_period',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended'
}

export const PLAN_TYPES = Object.keys(SUBSCRIPTION_PLANS)

export default SUBSCRIPTION_PLANS
