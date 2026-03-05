/**
 * Server middleware: proxy /uploads/* to the Express API backend.
 * In production nginx serves uploaded files directly from disk, but this
 * middleware covers SSR image rendering and local development.
 */
export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/uploads/')) return

  const config = useRuntimeConfig()
  const targetUrl = `${config.apiBaseUrl}${path}`

  try {
    const response = await fetch(targetUrl)

    if (!response.ok) {
      setResponseStatus(event, response.status)
      return ''
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const cacheControl = response.headers.get('cache-control') || 'public, max-age=86400'

    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    })

    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer)
  } catch {
    setResponseStatus(event, 502)
    return ''
  }
})
