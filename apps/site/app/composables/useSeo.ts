/**
 * Page-level SEO meta builder
 */
export function useSeo(options: {
  title?: string
  description?: string
  image?: string
  type?: string
  noindex?: boolean
  jsonLd?: any | any[]
}) {
  const route = useRoute()
  const partner = usePartnerStore()

  const siteName = partner.partnerName || 'Booking'
  const fullTitle = options.title ? `${options.title} | ${siteName}` : siteName

  useSeoMeta({
    title: fullTitle,
    ogTitle: fullTitle,
    description: options.description || '',
    ogDescription: options.description || '',
    ogType: (options.type as any) || 'website',
    ogSiteName: siteName,
    ogImage: options.image || partner.logo || '',
    twitterCard: 'summary_large_image',
    twitterTitle: fullTitle,
    twitterDescription: options.description || '',
    twitterImage: options.image || partner.logo || '',
    ...(options.noindex ? { robots: 'noindex, nofollow' } : {}),
  })

  // JSON-LD
  if (options.jsonLd) {
    const scripts = Array.isArray(options.jsonLd) ? options.jsonLd : [options.jsonLd]
    useHead({
      script: scripts.map(ld => ({
        type: 'application/ld+json',
        innerHTML: JSON.stringify(ld),
      })),
    })
  }
}
