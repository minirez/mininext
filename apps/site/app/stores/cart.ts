export interface CartItem {
  id: string
  type: 'tour' | 'flight' | 'transfer' | 'cruise' | 'activity'
  title: string
  image?: string
  location?: string
  startDate?: string
  endDate?: string
  duration?: string
  guests: { adults: number; children: number }
  pricePerPerson: number
  totalPrice: number
  currency: string
  addedAt: string
  raw?: any
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])

  const totalItems = computed(() => items.value.length)

  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  })

  const currency = computed(() => items.value[0]?.currency || 'TRY')

  function addItem(item: Omit<CartItem, 'id' | 'addedAt'>) {
    const id = `${item.type}-${Date.now()}-${items.value.length}`
    items.value.push({
      ...item,
      id,
      addedAt: new Date().toISOString(),
    })
    return id
  }

  function removeItem(id: string) {
    items.value = items.value.filter(item => item.id !== id)
  }

  function clearCart() {
    items.value = []
  }

  function hasItemOfType(type: string): boolean {
    return items.value.some(item => item.type === type)
  }

  return {
    items,
    totalItems,
    totalPrice,
    currency,
    addItem,
    removeItem,
    clearCart,
    hasItemOfType,
  }
})
