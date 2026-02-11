import express from 'express'
import ShortUrl from './shortUrl.model.js'
import logger from '#core/logger.js'

const router = express.Router()

/**
 * GET /:code
 * Kısa URL'i çözümle ve yönlendir
 * Public - Auth gerektirmez
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params

    const shortUrl = await ShortUrl.resolve(code)

    if (!shortUrl) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Link Bulunamadı</title>
          <style>
            body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .card { text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #e74c3c; margin: 0 0 10px; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Bulunamadı</h1>
            <p>Bu link geçersiz veya süresi dolmuş olabilir.</p>
          </div>
        </body>
        </html>
      `)
    }

    // Yönlendir
    res.redirect(302, shortUrl.originalUrl)
  } catch (error) {
    logger.error('ShortUrl resolve error:', error.message)
    res.status(500).send('Bir hata oluştu')
  }
})

export default router
