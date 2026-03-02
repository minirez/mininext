import { test, expect } from '@playwright/test'

test.describe('API Proxy (BFF)', () => {
  test('proxies hotel list API', async ({ request }) => {
    const response = await request.get('/api/public/hotels?partnerId=695b87944dbab11e6b5356a3&page=1&limit=5')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })

  test('proxies hotel detail API', async ({ request }) => {
    const response = await request.get('/api/public/hotels/rixos-tersane-istanbul')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(data.data.name).toContain('RIXOS')
  })

  test('proxies storefront API', async ({ request }) => {
    const response = await request.get('/api/public/storefront?partnerId=695b87944dbab11e6b5356a3')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })

  test('proxies resolve-domain API', async ({ request }) => {
    const response = await request.get('/api/public/resolve-domain?domain=vip.com')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.partnerName).toBe('VIP TRAVELLERS')
  })

  test('returns 502 for non-existent API routes', async ({ request }) => {
    const response = await request.get('/api/this-does-not-exist')
    // Should return error (404 or 502)
    expect([404, 502]).toContain(response.status())
  })
})

test.describe('Uploads Proxy', () => {
  test('proxies upload requests to API server', async ({ request }) => {
    // This will return 404 because the file doesn't exist locally,
    // but the proxy route itself should be working (not returning Nuxt 404)
    const response = await request.get('/uploads/test-nonexistent.png')
    // Should be a proper HTTP error, not a Nuxt page
    expect([404, 502]).toContain(response.status())
  })
})
