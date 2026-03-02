export function useCarousel(options: { itemsPerView?: number; gap?: number } = {}) {
  const containerRef = ref<HTMLElement>()
  const currentIndex = ref(0)
  const isDragging = ref(false)

  // Touch/swipe state
  let startX = 0
  let startScrollLeft = 0

  const totalSlides = computed(() => {
    if (!containerRef.value) return 0
    return containerRef.value.children.length
  })

  const canScrollPrev = computed(() => currentIndex.value > 0)

  const canScrollNext = computed(() => {
    if (!containerRef.value) return false
    const el = containerRef.value
    return el.scrollLeft < el.scrollWidth - el.clientWidth - 10
  })

  function scrollTo(index: number) {
    if (!containerRef.value) return
    const el = containerRef.value
    const child = el.children[index] as HTMLElement
    if (!child) return
    el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
    currentIndex.value = index
  }

  function scrollPrev() {
    if (!containerRef.value) return
    const el = containerRef.value
    const scrollAmount = el.clientWidth * 0.8
    el.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  }

  function scrollNext() {
    if (!containerRef.value) return
    const el = containerRef.value
    const scrollAmount = el.clientWidth * 0.8
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  // Update currentIndex on scroll
  function onScroll() {
    if (!containerRef.value) return
    const el = containerRef.value
    const children = Array.from(el.children) as HTMLElement[]
    if (!children.length) return

    let closest = 0
    let minDist = Infinity
    for (let i = 0; i < children.length; i++) {
      const dist = Math.abs(children[i].offsetLeft - el.scrollLeft)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    }
    currentIndex.value = closest
  }

  // Touch support
  function onTouchStart(e: TouchEvent) {
    if (!containerRef.value) return
    startX = e.touches[0].clientX
    startScrollLeft = containerRef.value.scrollLeft
    isDragging.value = true
  }

  function onTouchEnd(e: TouchEvent) {
    if (!isDragging.value) return
    isDragging.value = false
    const endX = e.changedTouches[0].clientX
    const diff = startX - endX
    if (Math.abs(diff) > 50) {
      if (diff > 0) scrollNext()
      else scrollPrev()
    }
  }

  onMounted(() => {
    if (!containerRef.value) return
    const el = containerRef.value
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    if (!containerRef.value) return
    const el = containerRef.value
    el.removeEventListener('scroll', onScroll)
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchend', onTouchEnd)
  })

  return {
    containerRef,
    currentIndex,
    totalSlides,
    canScrollPrev,
    canScrollNext,
    scrollTo,
    scrollPrev,
    scrollNext,
  }
}
