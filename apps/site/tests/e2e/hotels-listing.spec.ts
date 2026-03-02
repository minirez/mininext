import { test, expect } from '@playwright/test'

test.describe('Hotels Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/hotels')
    // Wait for client-side data to load (hotels are fetched client-side after hydration)
    await page.waitForSelector('a[href*="/hotels/"] h3', { timeout: 15000 }).catch(() => {})
  })

  test('renders with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Hotels/)
  })

  test('displays breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(breadcrumb).toBeVisible()

    const homeLink = breadcrumb.getByRole('link', { name: 'Home' })
    await expect(homeLink).toBeVisible()

    await expect(breadcrumb.getByText('Hotels')).toBeVisible()
  })

  test('displays hotel count after loading', async ({ page }) => {
    // Wait for the count to update from "0" to a real number
    const countText = page.getByText(/[1-9]\d* hotels? found/i)
    await expect(countText).toBeVisible({ timeout: 15000 })
  })

  test('displays hotel cards after loading', async ({ page }) => {
    // Wait for hotel cards to render (client-side)
    const hotelCard = page.locator('a[href*="/hotels/"]').filter({ has: page.locator('h3') }).first()
    await expect(hotelCard).toBeVisible({ timeout: 15000 })

    // Should have multiple hotels
    const hotelLinks = page.locator('a[href*="/hotels/"]').filter({ has: page.locator('h3') })
    const count = await hotelLinks.count()
    expect(count).toBeGreaterThanOrEqual(10)
  })

  test('hotel cards have hotel names', async ({ page }) => {
    // Wait for hotel cards to render
    const firstCard = page.locator('a[href*="/hotels/"]').filter({ has: page.locator('h3') }).first()
    await expect(firstCard).toBeVisible({ timeout: 15000 })

    const hotelHeadings = page.locator('a[href*="/hotels/"] h3')
    const count = await hotelHeadings.count()
    expect(count).toBeGreaterThanOrEqual(10)

    // First heading should have a name
    const name = await hotelHeadings.first().textContent()
    expect(name!.trim().length).toBeGreaterThan(0)
  })

  test('displays star rating filter', async ({ page }) => {
    const starFilter = page.getByText(/star rating/i)
    await expect(starFilter).toBeVisible()
  })

  test('displays hotel type filter', async ({ page }) => {
    const typeFilter = page.getByText(/hotel type/i)
    await expect(typeFilter).toBeVisible()
  })

  test('displays sort dropdown', async ({ page }) => {
    const sortBtn = page.getByRole('button', { name: /recommended|sort/i })
    await expect(sortBtn).toBeVisible()
  })

  test('displays pagination after loading', async ({ page }) => {
    // Wait for hotels to load first
    await page.locator('a[href*="/hotels/"]').filter({ has: page.locator('h3') }).first().waitFor({ timeout: 15000 }).catch(() => {})
    const nextBtn = page.getByRole('button', { name: /next/i })
    await expect(nextBtn).toBeVisible()
  })

  test('hotel card links to hotel detail page', async ({ page }) => {
    // Wait for hotel cards to load
    const firstHotelLink = page.locator('a[href*="/hotels/"]').filter({ has: page.locator('h3') }).first()
    await expect(firstHotelLink).toBeVisible({ timeout: 15000 })

    const href = await firstHotelLink.getAttribute('href')
    expect(href).toMatch(/\/hotels\/[\w-]+/)
  })

  test('clicking a hotel card navigates to detail page', async ({ page }) => {
    // Wait for hotel cards
    const hotelLink = page.locator('a[href*="/hotels/"]').filter({ has: page.locator('h3') }).first()
    await expect(hotelLink).toBeVisible({ timeout: 15000 })

    await hotelLink.click()
    await page.waitForURL(/\/hotels\/[\w-]+/)

    // Should be on a detail page
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })

  test('show map button exists', async ({ page }) => {
    const mapBtn = page.getByRole('button', { name: /map|harita/i })
    await expect(mapBtn).toBeVisible()
  })
})
