import { test, expect } from '@playwright/test'

test.describe('Search Page', () => {
  test('renders search page', async ({ page }) => {
    await page.goto('/en/search')
    await expect(page).toHaveURL(/\/search/)
  })

  test('displays search form', async ({ page }) => {
    await page.goto('/en/search')
    // Search inputs should be present
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

test.describe('Destinations Page', () => {
  test('renders destination page', async ({ page }) => {
    await page.goto('/en/destinations/Belek')
    await expect(page).toHaveURL(/\/destinations\/Belek/)
  })

  test('displays destination content', async ({ page }) => {
    await page.goto('/en/destinations/Belek')
    // Should show city name
    const cityText = page.getByText(/Belek/i)
    await expect(cityText.first()).toBeVisible()
  })
})

test.describe('CMS Pages', () => {
  test('renders privacy page', async ({ page }) => {
    const response = await page.goto('/en/page/privacy')
    expect(response?.status()).toBe(200)
  })

  test('renders terms page', async ({ page }) => {
    const response = await page.goto('/en/page/terms')
    expect(response?.status()).toBe(200)
  })
})
