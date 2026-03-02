/**
 * Server middleware: resolve partner from request hostname on every SSR request.
 * Sets event.context.partner and event.context.storefront for downstream use.
 */
export default defineEventHandler(async (event) => {
  // Skip for static assets and internal routes
  const path = getRequestURL(event).pathname
  if (path.startsWith('/_nuxt/') || path.startsWith('/__nuxt') || path.startsWith('/api/') || path.includes('.')) {
    return
  }

  const api = useServerApi(event)
  const config = useRuntimeConfig()

  // Determine domain from request hostname
  let domain = getRequestHost(event, { xForwardedHost: true })
  // Remove port
  if (domain.includes(':')) {
    domain = domain.split(':')[0]
  }

  try {
    // 1. Resolve domain → partner (always from database)
    let partnerData: any = null

    const resolved = await api.get<{ success: boolean; data: any }>(
      '/api/public/resolve-domain',
      { domain },
    )
    if (resolved.success && resolved.data) {
      partnerData = resolved.data
    }

    if (!partnerData) {
      // Partner not found for this domain
      event.context.partner = null
      event.context.storefront = null
      return
    }

    event.context.partner = partnerData

    // 2. Fetch storefront data
    try {
      const storefrontRes = await api.get<{ success: boolean; data: any }>(
        '/api/public/storefront',
        {
          partnerId: partnerData.partnerId,
          view: 'full',
        },
      )
      if (storefrontRes.success && storefrontRes.data) {
        event.context.storefront = storefrontRes.data
      }
    } catch {
      // Storefront fetch failed - use empty
      event.context.storefront = null
    }

    // 3. Fetch site settings (tracking, languages, etc.)
    try {
      const settingsRes = await api.get<{ success: boolean; data: any }>(
        '/api/public/site-settings',
        { partnerId: partnerData.partnerId },
      )
      if (settingsRes.success && settingsRes.data) {
        event.context.siteSettings = settingsRes.data
      }
    } catch {
      event.context.siteSettings = null
    }
  } catch (err: any) {
    console.error('[partner-middleware] Error resolving partner:', err?.message || err)
    event.context.partner = null
    event.context.storefront = null
    event.context.siteSettings = null
  }
})
