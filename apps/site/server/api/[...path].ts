/**
 * BFF Proxy: Forward all /api/* client requests to Express backend
 * This avoids CORS issues and keeps API URL private
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const path = getRouterParam(event, 'path') || ''
  const targetUrl = `${config.apiBaseUrl}/api/${path}`

  // Forward query params
  const query = getQuery(event)
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  }
  const qs = params.toString()
  const fullUrl = qs ? `${targetUrl}?${qs}` : targetUrl

  // Forward request method and body
  const method = getMethod(event)
  let body: any
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    body = await readBody(event)
  }

  // Forward headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const clientIp = getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip')
  if (clientIp) headers['X-Forwarded-For'] = clientIp

  const userAgent = getHeader(event, 'user-agent')
  if (userAgent) headers['User-Agent'] = userAgent

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    // Set status code from upstream
    setResponseStatus(event, response.status)

    return data
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: 'API proxy error',
      data: { message: err?.message },
    })
  }
})
