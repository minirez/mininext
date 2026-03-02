import { test, expect } from '@playwright/test'

test.describe('Booking Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/hotels/rixos-tersane-istanbul/book')
  })

  test('renders booking page', async ({ page }) => {
    await expect(page).toHaveTitle(/RIXOS TERSANE ISTANBUL|Book|VIP TRAVELLERS/)
  })

  test('displays hotel name in booking context', async ({ page }) => {
    const hotelName = page.getByText(/RIXOS TERSANE ISTANBUL/i)
    await expect(hotelName.first()).toBeVisible()
  })

  test('displays check-in and check-out labels', async ({ page }) => {
    const checkIn = page.getByText(/check.in/i)
    await expect(checkIn.first()).toBeVisible()

    const checkOut = page.getByText(/check.out/i)
    await expect(checkOut.first()).toBeVisible()
  })

  test('uses booking layout with logo', async ({ page }) => {
    const logo = page.locator('img[alt*="VIP"], img[alt*="TRAVELLERS"]')
    await expect(logo.first()).toBeVisible()
  })
})

test.describe('Booking Lookup Page', () => {
  test('renders booking lookup page', async ({ page }) => {
    await page.goto('/en/booking/TEST123')
    await expect(page).toHaveURL(/\/booking\/TEST123/)
  })
})
