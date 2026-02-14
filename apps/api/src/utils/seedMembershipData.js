/**
 * Seed Membership Data
 *
 * Mevcut hardcoded SUBSCRIPTION_PLANS verilerini
 * MembershipService ve MembershipPackage koleksiyonlarına migrate eder.
 *
 * Kullanım:
 *   node -e "import('./src/utils/seedMembershipData.js').then(m => m.seedMembershipData())"
 *
 * Veya API startup'ta bir kez çalıştırmak için:
 *   import { seedMembershipData } from '#utils/seedMembershipData.js'
 *   await seedMembershipData()
 */

import MembershipService from '#modules/membership-service/membership-service.model.js'
import MembershipPackage from '#modules/membership-package/membership-package.model.js'
import { SUBSCRIPTION_PLANS } from '#constants/subscriptionPlans.js'

const SERVICE_DEFINITIONS = [
  {
    code: 'pms-access',
    name: { tr: 'PMS Erişimi', en: 'PMS Access' },
    description: { tr: 'Otel yönetim sistemi erişimi', en: 'Hotel management system access' },
    category: 'pms',
    pricing: {
      billingType: 'recurring',
      interval: 'yearly',
      prices: [{ currency: 'USD', amount: 100 }]
    },
    features: new Map([
      ['enabled', true],
      ['maxHotels', 5]
    ]),
    icon: 'hotel',
    sortOrder: 1
  },
  {
    code: 'pms-unlimited',
    name: { tr: 'Sınırsız PMS', en: 'Unlimited PMS' },
    description: { tr: 'Sınırsız otel ile PMS erişimi', en: 'PMS access with unlimited hotels' },
    category: 'pms',
    pricing: {
      billingType: 'recurring',
      interval: 'yearly',
      prices: [{ currency: 'USD', amount: 200 }]
    },
    features: new Map([
      ['enabled', true],
      ['maxHotels', -1]
    ]),
    icon: 'all_inclusive',
    sortOrder: 2
  },
  {
    code: 'web-design',
    name: { tr: 'Web Tasarım', en: 'Web Design' },
    description: { tr: 'Web sitesi tasarım ve hosting', en: 'Website design and hosting' },
    category: 'web',
    pricing: {
      billingType: 'recurring',
      interval: 'yearly',
      prices: [{ currency: 'USD', amount: 29 }]
    },
    features: new Map([
      ['enabled', true],
      ['maxSites', 1],
      ['ssl', true],
      ['customDomain', true]
    ]),
    icon: 'web',
    sortOrder: 3
  }
]

const PACKAGE_DEFINITIONS = [
  {
    code: 'webdesign',
    name: { tr: 'Web Design', en: 'Web Design' },
    description: { tr: 'Web tasarım ve domain yönetimi', en: 'Web design and domain management' },
    targetPartnerType: 'all',
    serviceCodes: ['web-design'],
    pricing: {
      interval: 'yearly',
      priceMode: 'override',
      prices: [{ currency: 'USD', amount: 29 }]
    },
    icon: 'palette',
    color: '#3B82F6',
    sortOrder: 1
  },
  {
    code: 'business',
    name: { tr: 'Business', en: 'Business' },
    description: { tr: 'Orta ölçekli işletmeler için', en: 'For medium-sized businesses' },
    targetPartnerType: 'all',
    serviceCodes: [],
    pricing: {
      interval: 'yearly',
      priceMode: 'override',
      prices: [{ currency: 'USD', amount: 118.9 }]
    },
    icon: 'business',
    color: '#10B981',
    sortOrder: 2
  },
  {
    code: 'professional',
    name: { tr: 'Professional', en: 'Professional' },
    description: {
      tr: 'PMS entegrasyonu dahil profesyonel paket',
      en: 'Professional package with PMS integration'
    },
    targetPartnerType: 'hotel',
    serviceCodes: ['pms-access'],
    pricing: {
      interval: 'yearly',
      priceMode: 'override',
      prices: [{ currency: 'USD', amount: 178.8 }]
    },
    icon: 'verified',
    color: '#8B5CF6',
    badge: 'Popular',
    sortOrder: 3
  },
  {
    code: 'enterprise',
    name: { tr: 'Enterprise', en: 'Enterprise' },
    description: {
      tr: 'Sınırsız PMS ile kurumsal paket',
      en: 'Enterprise package with unlimited PMS'
    },
    targetPartnerType: 'hotel',
    serviceCodes: ['pms-unlimited'],
    pricing: {
      interval: 'yearly',
      priceMode: 'override',
      prices: [{ currency: 'USD', amount: 298.8 }]
    },
    icon: 'diamond',
    color: '#F59E0B',
    badge: 'Best Value',
    sortOrder: 4
  }
]

export async function seedMembershipData() {
  console.log('[Seed] Starting membership data seed...')

  // 1. Servisleri oluştur (varsa atla)
  const serviceMap = {}
  for (const svcDef of SERVICE_DEFINITIONS) {
    let svc = await MembershipService.findOne({ code: svcDef.code })
    if (svc) {
      console.log(`[Seed] Service "${svcDef.code}" already exists, skipping`)
      serviceMap[svcDef.code] = svc._id
      continue
    }
    svc = await MembershipService.create(svcDef)
    serviceMap[svcDef.code] = svc._id
    console.log(`[Seed] Created service: ${svcDef.code} (${svc._id})`)
  }

  // 2. Paketleri oluştur (varsa atla)
  for (const pkgDef of PACKAGE_DEFINITIONS) {
    let pkg = await MembershipPackage.findOne({ code: pkgDef.code })
    if (pkg) {
      console.log(`[Seed] Package "${pkgDef.code}" already exists, skipping`)
      continue
    }

    const services = pkgDef.serviceCodes
      .map(code => ({
        service: serviceMap[code],
        included: true
      }))
      .filter(s => s.service)

    const { serviceCodes, ...rest } = pkgDef
    pkg = await MembershipPackage.create({
      ...rest,
      services,
      isPublic: true,
      status: 'active'
    })
    console.log(`[Seed] Created package: ${pkgDef.code} (${pkg._id})`)
  }

  console.log('[Seed] Membership data seed completed!')
}

export default seedMembershipData
