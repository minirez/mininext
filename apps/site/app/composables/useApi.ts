/**
 * Client-side API composable using Nuxt's useFetch / $fetch
 * Routes through BFF proxy (/api/*) which server handles
 */
export function useApi() {
  const config = useRuntimeConfig()
  const partner = usePartnerStore()

  const baseURL = config.public.apiBaseUrl || '/api'

  function buildUrl(path: string): string {
    // If path already starts with /api, use as-is
    if (path.startsWith('/api/')) return path
    return `${baseURL}${path.startsWith('/') ? '' : '/'}${path}`
  }

  async function get<T = any>(path: string, query?: Record<string, any>): Promise<T> {
    const url = buildUrl(path)
    return $fetch<T>(url, {
      method: 'GET',
      query: {
        ...query,
        partnerId: query?.partnerId || partner.partnerId || undefined,
      },
    })
  }

  async function post<T = any>(path: string, body?: any, query?: Record<string, any>): Promise<T> {
    const url = buildUrl(path)
    return $fetch<T>(url, {
      method: 'POST',
      body,
      query,
    })
  }

  return { get, post }
}
