import { test, expect } from '@playwright/test'

test.describe('Responsive Design - Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('homepage renders correctly on mobile', async ({ page }) => {
    await page.goto('/en')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  test('mobile menu hamburger is visible', async ({ page }) => {
    await page.goto('/en')
    const hamburger = page.getByRole('button', { name: /menu|open/i })
    await expect(hamburger).toBeVisible()
  })

  test('desktop navigation is hidden on mobile', async ({ page }) => {
    await page.goto('/en')
    const nav = page.locator('header nav')
    await expect(nav).toBeHidden()
  })

  test('search bar is visible on mobile', async ({ page }) => {
    await page.goto('/en')
    const searchForm = page.locator('form').first()
    await expect(searchForm).toBeVisible()
  })

  test('hotel listing loads on mobile', async ({ page }) => {
    await page.goto('/en/hotels')
    // Wait for hotels to load client-side
    const hotelCard = page.locator('a[href*="/hotels/"]').filter({ has: page.locator('h3') }).first()
    await expect(hotelCard).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Responsive Design - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('homepage renders correctly on tablet', async ({ page }) => {
    await page.goto('/en')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  test('hotel listing renders on tablet', async ({ page }) => {
    await page.goto('/en/hotels')
    // Wait for client-side data to load
    const hotelCard = page.locator('a[href*="/hotels/"]').filter({ has: page.locator('h3') }).first()
    await expect(hotelCard).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Responsive Design - Desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('homepage renders correctly on desktop', async ({ page }) => {
    await page.goto('/en')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  test('desktop navigation is visible', async ({ page }) => {
    await page.goto('/en')
    const langSwitcher = page.locator('header').getByRole('button', { name: /en|tr/i }).first()
    await expect(langSwitcher).toBeVisible()
  })

  test('hotels page shows sidebar filters', async ({ page }) => {
    await page.goto('/en/hotels')
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
  })
})
