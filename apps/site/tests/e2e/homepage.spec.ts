import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en')
  })

  test('renders with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/VIP TRAVELLERS/)
  })

  test('displays hero section with heading and search bar', async ({ page }) => {
    const hero = page.locator('section').first()
    await expect(hero).toBeVisible()

    // Hero heading
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    const h1Text = await h1.textContent()
    expect(h1Text!.length).toBeGreaterThan(0)

    // Search bar
    const searchBar = page.getByPlaceholder(/where|nereye/i)
    await expect(searchBar).toBeVisible()
  })

  test('displays search form with all fields', async ({ page }) => {
    // Destination input
    await expect(page.getByPlaceholder(/where|nereye/i)).toBeVisible()

    // Date inputs (check-in, check-out)
    const dateInputs = page.locator('input[type="date"]')
    await expect(dateInputs).toHaveCount(2)

    // Guest selector
    const guestButton = page.getByRole('button', { name: /adult|yetişkin|guest|misafir/i })
    await expect(guestButton).toBeVisible()

    // Search button
    const searchBtn = page.getByRole('button', { name: /search|ara/i })
    await expect(searchBtn).toBeVisible()
  })

  test('displays popular destinations section', async ({ page }) => {
    const destinationsHeading = page.getByRole('heading', { name: /destinasyonlar|destinations/i })
    await expect(destinationsHeading).toBeVisible()

    // Should have destination cards
    const destinationLinks = page.locator('a[href*="/destinations/"]')
    const count = await destinationLinks.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('displays popular hotels section', async ({ page }) => {
    const hotelsHeading = page.getByRole('heading', { name: /hotel/i }).first()
    await expect(hotelsHeading).toBeVisible()

    // Should have hotel cards
    const hotelLinks = page.locator('a[href*="/hotels/"]')
    const count = await hotelLinks.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('displays trust features section', async ({ page }) => {
    const trustHeading = page.getByRole('heading', { name: /choose|tercih/i })
    await expect(trustHeading).toBeVisible()

    // Should have 3 feature cards
    const featureTitles = page.locator('h3').filter({ hasText: /price|booking|support|fiyat|rezervasyon|destek/i })
    await expect(featureTitles).toHaveCount(3)
  })

  test('displays newsletter section', async ({ page }) => {
    const newsletterHeading = page.getByRole('heading', { name: /newsletter|bülten/i })
    await expect(newsletterHeading).toBeVisible()

    const emailInput = page.getByPlaceholder(/email|e-posta/i)
    await expect(emailInput).toBeVisible()

    const subscribeBtn = page.getByRole('button', { name: /subscribe|abone/i })
    await expect(subscribeBtn).toBeVisible()
  })

  test('displays header with logo and navigation', async ({ page }) => {
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Logo
    const logo = header.getByAltText(/VIP TRAVELLERS/i)
    await expect(logo).toBeVisible()

    // Language switcher
    const langBtn = page.getByRole('button', { name: /en|tr/i }).first()
    await expect(langBtn).toBeVisible()

    // Currency switcher
    const currencyBtn = page.getByRole('button', { name: /TRY|USD|EUR/i })
    await expect(currencyBtn).toBeVisible()
  })

  test('displays footer with links', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Copyright text
    const copyright = footer.getByText(/© 2026/)
    await expect(copyright).toBeVisible()

    // Footer link columns
    const footerLinks = footer.locator('a')
    const count = await footerLinks.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })
})
