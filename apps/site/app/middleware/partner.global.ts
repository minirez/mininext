/**
 * Client-side global middleware: ensure partner store is populated
 * On SSR this is already done by the plugin, but on client-side navigation
 * we verify the store is hydrated.
 */
export default defineNuxtRouteMiddleware((to) => {
  const partner = usePartnerStore()
  const storefront = useStorefrontStore()

  // If storefront is in maintenance mode, show error
  if (storefront.underMaintenance && to.path !== '/') {
    throw createError({
      statusCode: 503,
      statusMessage: 'Under Maintenance',
    })
  }
})
