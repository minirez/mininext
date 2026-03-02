/**
 * Dynamic robots.txt based on partner maintenance status
 */
export default defineEventHandler((event) => {
  const storefront = event.context.storefront

  setResponseHeader(event, 'Content-Type', 'text/plain')

  if (storefront?.underMaintenance) {
    return `User-agent: *\nDisallow: /\n`
  }

  return `User-agent: *
Allow: /
Disallow: /booking/
Disallow: /payment/
Disallow: /api/

Sitemap: /sitemap.xml
`
})
