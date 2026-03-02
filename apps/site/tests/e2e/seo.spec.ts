import { test, expect } from '@playwright/test'

test.describe('SEO & Meta Tags', () => {
  test('homepage has correct meta tags', async ({ page }) => {
    await page.goto('/en')

    // Title should contain partner name or default
    await expect(page).toHaveTitle(/VIP TRAVELLERS|Booking/)

    // OG tags
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /.+/)

    const ogType = page.locator('meta[property="og:type"]')
    await expect(ogType).toHaveAttribute('content', 'website')

    // Twitter card
    const twitterCard = page.locator('meta[name="twitter:card"]')
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image')
  })

  test('hotel detail page has correct SEO title', async ({ page }) => {
    await page.goto('/en/hotels/rixos-tersane-istanbul')
    await expect(page).toHaveTitle(/RIXOS TERSANE ISTANBUL/)
  })

  test('hotels listing page has correct SEO title', async ({ page }) => {
    await page.goto('/en/hotels')
    await expect(page).toHaveTitle(/Hotels/)
  })

  test('pages have charset and viewport meta', async ({ page }) => {
    await page.goto('/en')

    const charset = page.locator('meta[charset]')
    await expect(charset).toHaveAttribute('charset', 'utf-8')

    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveAttribute('content', /width=device-width/)
  })

  test('homepage has favicon', async ({ request }) => {
    // Check SSR HTML for favicon (avoids hydration timing issues)
    const response = await request.get('/en')
    const html = await response.text()
    expect(html).toMatch(/link[^>]+rel="icon"[^>]+href="[^"]+"/i)
  })

  test('pages have preconnect hints', async ({ page }) => {
    await page.goto('/en')
    const preconnects = page.locator('link[rel="preconnect"]')
    const count = await preconnects.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('SSR Content', () => {
  test('homepage SSR includes partner name', async ({ request }) => {
    const response = await request.get('/en')
    const html = await response.text()

    expect(html).toContain('VIP TRAVELLERS')
  })

  test('homepage SSR includes section content', async ({ request }) => {
    const response = await request.get('/en')
    const html = await response.text()

    // Destination section rendered server-side
    expect(html).toMatch(/Belek|Bodrum|Kemer/i)
  })

  test('hotel detail SSR includes hotel info', async ({ request }) => {
    const response = await request.get('/en/hotels/rixos-tersane-istanbul')
    const html = await response.text()

    expect(html).toContain('RIXOS TERSANE ISTANBUL')
    expect(html).toContain('Amenities')
    expect(html).toContain('Check-in')
  })

  test('SSR payload is embedded in HTML', async ({ request }) => {
    const response = await request.get('/en')
    const html = await response.text()

    expect(html).toContain('data-ssr="true"')
  })
})
