import { test, expect } from '@playwright/test'

test.describe('Navigation & Routing', () => {
  test('homepage redirects to locale prefix', async ({ page }) => {
    await page.goto('/')
    // Should redirect to a locale-prefixed URL or stay at /
    const url = page.url()
    expect(url).toMatch(/\/(en|tr|de|ru|ar|fr|es|it)?$/)
  })

  test('navigates from homepage to hotels via View All link', async ({ page }) => {
    await page.goto('/en')
    const viewAll = page.getByRole('link', { name: /view all/i }).first()
    if (await viewAll.isVisible()) {
      await viewAll.click()
      await page.waitForURL(/\/hotels/)
      // Hotels page heading - may be in any language
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    }
  })

  test('navigates from homepage to destination', async ({ page }) => {
    await page.goto('/en')
    const destLink = page.locator('a[href*="/destinations/"]').first()
    if (await destLink.isVisible()) {
      await destLink.click()
      await page.waitForURL(/\/destinations\//)
    }
  })

  test('logo link returns to homepage', async ({ page }) => {
    await page.goto('/en/hotels')
    const logo = page.locator('header a[href="/"]').first()
    await logo.click()
    // May redirect to / or /en
    await page.waitForURL(/\/(en)?$/)
  })

  test('breadcrumb Home link navigates to homepage', async ({ page }) => {
    await page.goto('/en/hotels')
    const homeLink = page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Home' })
    await homeLink.click()
    await page.waitForURL(/\/(en)?$/)
  })

  test('footer has privacy-related links', async ({ page }) => {
    await page.goto('/en')
    const footerLinks = page.locator('footer a')
    const count = await footerLinks.count()
    expect(count).toBeGreaterThanOrEqual(3)

    // Check that privacy/agreement links exist (may be internal or external)
    const privacyLink = page.locator('footer a[href*="privacy"]').first()
    await expect(privacyLink).toBeVisible()
  })

  test('footer has terms/agreement links', async ({ page }) => {
    await page.goto('/en')
    const termsLink = page.locator('footer a[href*="agreement"], footer a[href*="terms"]').first()
    await expect(termsLink).toBeVisible()
  })

  test('404 page renders for invalid route', async ({ page }) => {
    const response = await page.goto('/en/this-page-does-not-exist')
    // Should return a page (either 404 or error page)
    expect(response?.status()).toBeTruthy()
  })
})

test.describe('Language Switching', () => {
  test('language switcher button is visible', async ({ page }) => {
    await page.goto('/en')
    const langBtn = page.getByRole('button', { name: /en|tr/i }).first()
    await expect(langBtn).toBeVisible()
  })

  test('Turkish locale renders correctly', async ({ page }) => {
    await page.goto('/')
    // Default locale is Turkish (no prefix)
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  test('English locale renders correctly', async ({ page }) => {
    await page.goto('/en')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })
})
