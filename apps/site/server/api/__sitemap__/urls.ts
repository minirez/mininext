/**
 * Dynamic sitemap URL generator
 * Fetches hotels and CMS pages from API and generates sitemap entries
 */
export default defineSitemapEventHandler(async (event) => {
  const api = useServerApi(event)
  const partner = event.context.partner
  const urls: any[] = []

  if (!partner?.partnerId) return urls

  try {
    // Fetch hotels
    const hotelsRes = await api.get<{ success: boolean; data: any }>(
      '/api/public/hotels',
      { partner: partner.partnerId, limit: 1000 },
    )

    if (hotelsRes.success && hotelsRes.data?.hotels) {
      for (const hotel of hotelsRes.data.hotels) {
        urls.push({
          loc: `/hotels/${hotel.slug}`,
          changefreq: 'weekly',
          priority: 0.8,
        })
      }
    }
  } catch {
    // Skip hotel URLs on error
  }

  try {
    // Fetch CMS pages
    const pagesRes = await api.get<{ success: boolean; data: any }>(
      '/api/public/storefront/pages',
      { partnerId: partner.partnerId },
    )

    if (pagesRes.success && Array.isArray(pagesRes.data)) {
      for (const page of pagesRes.data) {
        if (page.url) {
          urls.push({
            loc: `/page${page.url.startsWith('/') ? '' : '/'}${page.url}`,
            changefreq: 'monthly',
            priority: 0.5,
          })
        }
      }
    }
  } catch {
    // Skip CMS page URLs on error
  }

  return urls
})
