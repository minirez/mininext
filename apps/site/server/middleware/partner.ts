/**
 * Server middleware: resolve partner from request hostname on every SSR request.
 * Sets event.context.partner and event.context.storefront for downstream use.
 * Detects /draftlive routes and fetches draft data instead of live.
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (path.startsWith('/_nuxt/') || path.startsWith('/__nuxt') || path.startsWith('/api/') || path.includes('.')) {
    return
  }

  const api = useServerApi(event)
  const isDraftLive = path.startsWith('/draftlive')

  let domain = getRequestHost(event, { xForwardedHost: true })
  if (domain.includes(':')) {
    domain = domain.split(':')[0]
  }

  try {
    let partnerData: any = null

    const resolved = await api.get<{ success: boolean; data: any }>(
      '/api/public/resolve-domain',
      { domain },
    )
    if (resolved.success && resolved.data) {
      partnerData = resolved.data
    }

    if (!partnerData) {
      event.context.partner = null
      event.context.storefront = null
      return
    }

    event.context.partner = partnerData

    try {
      const storefrontEndpoint = isDraftLive
        ? '/api/public/storefront/draftLive'
        : '/api/public/storefront'

      const pagePath = isDraftLive
        ? path.replace('/draftlive', '') || '/'
        : path

      const storefrontRes = await api.get<{ success: boolean; data: any }>(
        storefrontEndpoint,
        {
          partnerId: partnerData.partnerId,
          view: 'full',
          path: pagePath,
        },
      )
      if (storefrontRes.success && storefrontRes.data) {
        event.context.storefront = storefrontRes.data
        if (isDraftLive) {
          event.context.storefront._isDraftMode = true
        }
      }
    } catch {
      event.context.storefront = null
    }

    // Theme color for SSR (prevents flash)
    const themeColor = partnerData?.settings?.themeColor
      || event.context.storefront?.settings?.themeColor
    if (themeColor) {
      event.context.themeColor = themeColor
    }

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
