import { test, expect } from '@playwright/test'

test.describe('Hotel Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/hotels/rixos-tersane-istanbul')
  })

  test('renders with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/RIXOS TERSANE ISTANBUL/)
  })

  test('displays hotel name as h1', async ({ page }) => {
    const h1 = page.locator('h1')
    await expect(h1).toContainText('RIXOS TERSANE ISTANBUL')
  })

  test('displays star rating', async ({ page }) => {
    // Stars should be visible near the h1
    const starRating = page.locator('[class*="stars"], [aria-label*="stars"]').first()
    await expect(starRating).toBeVisible()
  })

  test('displays breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(breadcrumb).toBeVisible()

    await expect(breadcrumb.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(breadcrumb.getByRole('link', { name: 'Hotels' })).toBeVisible()
    await expect(breadcrumb.getByText('RIXOS TERSANE ISTANBUL')).toBeVisible()
  })

  test('displays hotel address', async ({ page }) => {
    const address = page.getByText(/İstanbul|istanbul/i)
    await expect(address.first()).toBeVisible()
  })

  test('displays image gallery', async ({ page }) => {
    // Should have multiple images
    const images = page.locator('main img')
    const count = await images.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('displays amenities section', async ({ page }) => {
    const amenitiesHeading = page.getByRole('heading', { name: /amenities/i })
    await expect(amenitiesHeading).toBeVisible()

    // Should list amenities
    const amenityItems = page.locator('main').getByText(/bar|gym|pool|restaurant/i)
    const count = await amenityItems.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('displays policies section', async ({ page }) => {
    const policiesHeading = page.getByRole('heading', { name: /policies/i })
    await expect(policiesHeading).toBeVisible()

    // Check-in and check-out
    await expect(page.getByText('Check-in')).toBeVisible()
    await expect(page.getByText('Check-out')).toBeVisible()
  })

  test('displays Book Now button', async ({ page }) => {
    const bookBtn = page.getByRole('link', { name: /book now/i }).first()
    await expect(bookBtn).toBeVisible()

    const href = await bookBtn.getAttribute('href')
    expect(href).toContain('/book')
  })

  test('Book Now button navigates to booking page', async ({ page }) => {
    const bookBtn = page.getByRole('link', { name: /book now/i }).first()
    await bookBtn.click()
    await page.waitForURL(/\/hotels\/rixos-tersane-istanbul\/book/)
  })

  test('displays contact info sidebar', async ({ page }) => {
    const contactHeading = page.getByRole('heading', { name: /contact/i })
    await expect(contactHeading).toBeVisible()

    // Phone or email should be visible
    const contactLink = page.locator('a[href^="tel:"], a[href^="mailto:"]').first()
    await expect(contactLink).toBeVisible()
  })

  test('displays correct SEO meta tags', async ({ page }) => {
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /RIXOS TERSANE ISTANBUL/)

    const ogType = page.locator('meta[property="og:type"]')
    await expect(ogType).toHaveAttribute('content', /hotel|website/)
  })
})
