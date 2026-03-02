/**
 * Access partner info from Pinia store or SSR context
 */
export function usePartner() {
  const store = usePartnerStore()
  return store
}
