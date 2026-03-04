export default defineNuxtPlugin(() => {
  const searchStore = useSearchStore()
  searchStore.hydrateFromStorage()
})
