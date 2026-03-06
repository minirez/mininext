export const useUiStore = defineStore('ui', () => {
  const mobileMenuOpen = ref(false)
  const mapView = ref(false)
  const lightboxOpen = ref(false)
  const lightboxImages = ref<any[]>([])
  const lightboxIndex = ref(0)
  const filterPanelOpen = ref(false)
  const favorites = ref<string[]>([])
  const cartDrawerOpen = ref(false)

  function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }

  function toggleMapView() {
    mapView.value = !mapView.value
  }

  function openLightbox(images: any[], index: number = 0) {
    lightboxImages.value = images
    lightboxIndex.value = index
    lightboxOpen.value = true
  }

  function closeLightbox() {
    lightboxOpen.value = false
    lightboxImages.value = []
    lightboxIndex.value = 0
  }

  function toggleFilterPanel() {
    filterPanelOpen.value = !filterPanelOpen.value
  }

  function toggleFavorite(hotelId: string) {
    const idx = favorites.value.indexOf(hotelId)
    if (idx >= 0) {
      favorites.value.splice(idx, 1)
    } else {
      favorites.value.push(hotelId)
    }
  }

  function toggleCartDrawer() {
    cartDrawerOpen.value = !cartDrawerOpen.value
  }

  return {
    mobileMenuOpen, mapView,
    lightboxOpen, lightboxImages, lightboxIndex,
    filterPanelOpen, favorites, cartDrawerOpen,
    toggleMobileMenu, toggleMapView,
    openLightbox, closeLightbox, toggleFilterPanel,
    toggleFavorite, toggleCartDrawer,
  }
})
