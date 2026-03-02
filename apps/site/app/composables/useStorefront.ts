/**
 * Access storefront data from Pinia store
 */
export function useStorefront() {
  const store = useStorefrontStore()
  return store
}
