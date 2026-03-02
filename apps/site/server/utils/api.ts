import type { H3Event } from 'h3'

/**
 * Server-side API client for Express backend
 * Uses runtimeConfig.apiBaseUrl (server-only, not exposed to client)
 */
export function useServerApi(event?: H3Event) {
  const config = useRuntimeConfig()
  const baseURL = config.apiBaseUrl || 'http://localhost:4000'

  async function request<T = any>(path: string, options: RequestInit & { query?: Record<string, any> } = {}): Promise<T> {
    let url = `${baseURL}${path}`

    if (options.query) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      }
      const qs = params.toString()
      if (qs) url += `?${qs}`
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    // Forward client IP for rate limiting / geo detection
    if (event) {
      const clientIp = getHeader(event, 'x-forwarded-for')
        || getHeader(event, 'x-real-ip')
        || ''
      if (clientIp) {
        headers['X-Forwarded-For'] = clientIp
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw createError({
        statusCode: response.status,
        statusMessage: (errorData as any)?.message || response.statusText,
        data: errorData,
      })
    }

    return response.json() as Promise<T>
  }

  return {
    get: <T = any>(path: string, query?: Record<string, any>) =>
      request<T>(path, { method: 'GET', query }),

    post: <T = any>(path: string, body?: any, query?: Record<string, any>) =>
      request<T>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
        query,
      }),

    put: <T = any>(path: string, body?: any) =>
      request<T>(path, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),

    delete: <T = any>(path: string) =>
      request<T>(path, { method: 'DELETE' }),
  }
}
