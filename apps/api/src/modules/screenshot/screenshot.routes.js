import express from 'express'
import puppeteer from 'puppeteer'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'
import config from '#config'

const router = express.Router()

const ALLOWED_DOMAINS = config.isDev
  ? ['app.maxirez.com', 'app.minirez.com', 'localhost']
  : ['app.maxirez.com', 'app.minirez.com']

let browserInstance = null

async function getBrowser() {
  if (browserInstance?.connected) return browserInstance

  browserInstance = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  })

  browserInstance.on('disconnected', () => {
    browserInstance = null
  })
  return browserInstance
}

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url)
    if (!config.isDev && parsed.protocol !== 'https:') return false
    return ALLOWED_DOMAINS.some(d => parsed.hostname === d)
  } catch {
    return false
  }
}

/**
 * GET /screenshot/capture
 * Takes a screenshot of an allowed URL at a given viewport size.
 * Injects the caller's JWT into the target page's localStorage so
 * the SPA renders the authenticated view instead of the login screen.
 * Query params: url, width, height, scrollY
 */
router.get('/capture', protect, requirePlatformAdmin, async (req, res) => {
  const { url, width = '1280', height = '800', scrollY = '0' } = req.query

  if (!url) {
    return res.status(400).json({ success: false, error: 'url parameter is required' })
  }

  if (!isAllowedUrl(url)) {
    return res.status(403).json({ success: false, error: 'URL not allowed' })
  }

  const vpWidth = Math.min(Math.max(parseInt(width) || 1280, 320), 3840)
  const vpHeight = Math.min(Math.max(parseInt(height) || 800, 320), 2560)
  const scroll = Math.max(parseInt(scrollY) || 0, 0)

  const authToken = req.headers.authorization?.replace('Bearer ', '')

  let page = null
  try {
    const browser = await getBrowser()
    page = await browser.newPage()

    await page.setViewport({ width: vpWidth, height: vpHeight, deviceScaleFactor: 2 })

    const parsed = new URL(url)
    const origin = parsed.origin

    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 15000 })

    if (authToken) {
      await page.evaluate(token => {
        localStorage.setItem('token', token)
      }, authToken)
    }

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 2000))

    if (scroll > 0) {
      // eslint-disable-next-line no-undef
      await page.evaluate(y => window.scrollTo(0, y), scroll)
      await new Promise(r => setTimeout(r, 500))
    }

    const screenshot = await page.screenshot({ type: 'png', fullPage: false })

    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=300'
    })
    res.send(screenshot)
  } catch {
    res.status(500).json({ success: false, error: 'Screenshot capture failed' })
  } finally {
    if (page) await page.close().catch(() => {})
  }
})

export default router
