<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <div
          class="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-purple-500 to-purple-600"
          >
            <div class="text-white">
              <h3 class="font-semibold">{{ $t('booking.priceBreakdown') }}</h3>
              <p class="text-sm text-white/80">{{ getLocalizedName(option?.mealPlan?.name) }}</p>
            </div>
            <button class="text-white/80 hover:text-white" @click="close">
              <span class="material-icons">close</span>
            </button>
          </div>

          <!-- Daily Prices -->
          <div class="p-5 max-h-[50vh] overflow-y-auto">
            <div class="mb-4">
              <h4
                class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2"
              >
                <span class="material-icons text-purple-500 text-sm">calendar_today</span>
                {{ $t('booking.dailyPrices') }}
              </h4>
              <div class="space-y-1.5">
                <div
                  v-for="(day, index) in option?.dailyBreakdown || []"
                  :key="index"
                  class="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm"
                >
                  <span class="text-gray-600 dark:text-slate-300">{{ formatDate(day.date) }}</span>
                  <div class="flex items-center gap-3">
                    <span
                      v-if="day.originalPrice && day.originalPrice > day.price"
                      class="text-xs text-gray-400 line-through"
                    >
                      {{ formatPrice(day.originalPrice) }}
                    </span>
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ formatPrice(day.price) }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- Empty state if no breakdown -->
              <div
                v-if="!option?.dailyBreakdown?.length"
                class="text-center text-gray-400 dark:text-slate-500 py-4 text-sm"
              >
                Günlük fiyat detayı yok
              </div>
            </div>

            <!-- Applied Campaigns -->
            <div v-if="option?.campaigns?.length > 0" class="mb-4">
              <h4
                class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2"
              >
                <span class="material-icons text-green-500 text-sm">local_offer</span>
                {{ $t('booking.appliedCampaigns') }}
              </h4>
              <div class="space-y-1.5">
                <div
                  v-for="campaign in option.campaigns"
                  :key="campaign.code"
                  class="flex items-center justify-between py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm"
                >
                  <span class="text-green-700 dark:text-green-400">{{ campaign.name }}</span>
                  <span class="font-medium text-green-700 dark:text-green-400">
                    -{{ campaign.discountText || Math.round(campaign.discountPercent) + '%' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Rate Type Selection (Refundable / Non-Refundable) -->
            <div
              v-if="option?.nonRefundable?.enabled"
              class="border-t border-gray-200 dark:border-slate-700 pt-4 mb-4"
            >
              <h4
                class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2"
              >
                <span class="material-icons text-purple-500 text-sm">receipt_long</span>
                Tarife Seçimi
              </h4>

              <div class="grid grid-cols-2 gap-3">
                <!-- Refundable Option -->
                <button
                  :class="[
                    'p-3 rounded-xl border-2 text-left transition-all',
                    selectedRateType === 'refundable'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-green-300'
                  ]"
                  @click="selectedRateType = 'refundable'"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span class="material-icons text-green-500 text-sm">check_circle</span>
                    <span class="text-sm font-semibold text-gray-800 dark:text-white"
                      >İade Edilebilir</span
                    >
                  </div>
                  <div class="text-lg font-bold text-green-600 dark:text-green-400">
                    {{ formatPrice(option?.pricing?.finalTotal) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Ücretsiz iptal imkanı
                  </div>
                </button>

                <!-- Non-Refundable Option -->
                <button
                  :class="[
                    'p-3 rounded-xl border-2 text-left transition-all',
                    selectedRateType === 'non_refundable'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-red-300'
                  ]"
                  @click="selectedRateType = 'non_refundable'"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span class="material-icons text-red-500 text-sm">block</span>
                    <span class="text-sm font-semibold text-gray-800 dark:text-white"
                      >İade Edilmez</span
                    >
                    <span
                      class="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded"
                    >
                      -%{{ option.nonRefundable.discountPercent }}
                    </span>
                  </div>
                  <div class="text-lg font-bold text-red-600 dark:text-red-400">
                    {{ formatPrice(option.nonRefundable.pricing?.finalTotal) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    İptal ve değişiklik yapılamaz
                  </div>
                </button>
              </div>

              <!-- Savings Info -->
              <div
                v-if="selectedRateType === 'non_refundable'"
                class="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400"
              >
                <span class="material-icons text-sm">savings</span>
                {{ formatPrice(option.nonRefundable.savings?.total) }} tasarruf ediyorsunuz!
              </div>
            </div>

            <!-- Custom Discount Section -->
            <div class="border-t border-gray-200 dark:border-slate-700 pt-4 mb-4">
              <h4
                class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2"
              >
                <span class="material-icons text-orange-500 text-sm">percent</span>
                {{ $t('booking.customDiscount') }}
              </h4>

              <div class="flex items-center gap-3">
                <!-- Discount Type Toggle -->
                <div class="flex rounded-lg bg-gray-100 dark:bg-slate-700 p-0.5">
                  <button
                    :class="[
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      discountType === 'percent'
                        ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    ]"
                    @click="discountType = 'percent'"
                  >
                    %
                  </button>
                  <button
                    :class="[
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      discountType === 'amount'
                        ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    ]"
                    @click="discountType = 'amount'"
                  >
                    {{ option?.pricing?.currency || 'TRY' }}
                  </button>
                </div>

                <!-- Discount Input -->
                <div class="flex-1 relative">
                  <input
                    v-model.number="discountValue"
                    type="number"
                    min="0"
                    :max="maxDiscount"
                    class="form-input w-full text-sm pr-10"
                    :placeholder="discountType === 'percent' ? 'İndirim %' : 'İndirim tutarı'"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {{ discountType === 'percent' ? '%' : option?.pricing?.currency }}
                  </span>
                </div>
              </div>

              <!-- Max Discount Info (Real Margin Based) -->
              <div class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-1">
                <p
                  class="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1"
                >
                  <span class="material-icons text-sm">info</span>
                  Kâr Marjı: %{{ realMarginPercent }} ({{ formatPrice(maxDiscountAmount) }})
                </p>
                <p class="text-xs text-blue-600 dark:text-blue-400">
                  {{ $t('common.max') }} {{ $t('booking.discount') }}:
                  <span v-if="discountType === 'percent'" class="font-semibold">
                    %{{ maxDiscount }}
                  </span>
                  <span v-else class="font-semibold">
                    {{ formatPrice(maxDiscount) }}
                  </span>
                </p>
                <p class="text-[10px] text-blue-500 dark:text-blue-400/70">
                  İndirim kâr marjınızdan yapılır, maliyet altına düşülemez
                </p>
              </div>

              <!-- Discount Warning -->
              <div
                v-if="isDiscountBelowCost"
                class="mt-2 flex items-center gap-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1.5 rounded"
              >
                <span class="material-icons text-sm">block</span>
                <span>
                  <strong>Maliyet altına düşüyor!</strong> Son fiyat ({{ formatPrice(finalTotal) }})
                  maliyetin ({{ formatPrice(costAmount) }}) altında olamaz.
                </span>
              </div>
              <div
                v-else-if="discountValue > maxDiscount"
                class="mt-2 flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1.5 rounded"
              >
                <span class="material-icons text-sm">warning</span>
                <span>
                  Maksimum indirim:
                  {{ discountType === 'percent' ? '%' + maxDiscount : formatPrice(maxDiscount) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Footer with Totals -->
          <div
            class="px-5 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
          >
            <div class="space-y-2 text-sm">
              <!-- Original -->
              <div class="flex items-center justify-between text-gray-500 dark:text-slate-400">
                <span>{{ $t('booking.originalPrice') }}</span>
                <span>{{ formatPrice(option?.pricing?.originalTotal) }}</span>
              </div>

              <!-- Campaign Discounts -->
              <div
                v-if="campaignDiscountAmount > 0"
                class="flex items-center justify-between text-green-600 dark:text-green-400"
              >
                <span>{{ $t('booking.discount') }} ({{ $t('booking.campaigns') }})</span>
                <span>-{{ formatPrice(campaignDiscountAmount) }}</span>
              </div>

              <!-- After Campaign Price -->
              <div
                v-if="campaignDiscountAmount > 0 && marginAmount > 0"
                class="flex items-center justify-between text-gray-500 dark:text-slate-400"
              >
                <span>{{ $t('booking.afterCampaign') }}</span>
                <span>{{ formatPrice(afterCampaignTotal) }}</span>
              </div>

              <!-- Partner Margin -->
              <div
                v-if="marginAmount > 0"
                class="flex items-center justify-between text-blue-600 dark:text-blue-400"
              >
                <span>{{ isAgency ? 'Acente İndirimi' : 'Partner İndirimi' }}</span>
                <span>-{{ formatPrice(marginAmount) }}</span>
              </div>

              <!-- Custom Discount -->
              <div
                v-if="calculatedCustomDiscount > 0"
                class="flex items-center justify-between text-orange-600 dark:text-orange-400"
              >
                <span>{{ $t('booking.customDiscount') }}</span>
                <span>-{{ formatPrice(calculatedCustomDiscount) }}</span>
              </div>

              <!-- Final Total -->
              <div
                class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-600"
              >
                <span class="font-semibold text-gray-900 dark:text-white">{{
                  $t('booking.total')
                }}</span>
                <span class="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {{ formatPrice(finalTotal) }}
                </span>
              </div>

              <!-- Per Night -->
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>{{ option?.nights || 0 }} {{ $t('booking.nights') }}</span>
                <span
                  >{{ formatPrice(finalTotal / (option?.nights || 1)) }} /
                  {{ $t('booking.perNight') }}</span
                >
              </div>

              <!-- Cost & Profit Section (for partner/agency) -->
              <div
                v-if="costAmount"
                class="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-slate-600"
              >
                <div class="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span class="flex items-center gap-1">
                    <span class="material-icons text-sm text-blue-500">payments</span>
                    {{ isAgency ? 'Partner Maliyeti' : 'Otel Maliyeti' }}
                  </span>
                  <span>{{ formatPrice(costAmount) }}</span>
                </div>
                <div
                  class="flex items-center justify-between mt-1"
                  :class="
                    profit >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  "
                >
                  <span class="flex items-center gap-1">
                    <span class="material-icons text-sm">{{
                      profit >= 0 ? 'trending_up' : 'trending_down'
                    }}</span>
                    Kâr
                  </span>
                  <span class="font-semibold">{{ formatPrice(profit) }}</span>
                </div>
                <p v-if="profit > 0" class="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  İndirim kârınızdan düşülür
                </p>
              </div>
            </div>

            <!-- Action Button -->
            <button
              :disabled="isDiscountExceeded"
              class="btn-primary w-full mt-4 py-2.5 text-sm font-medium disabled:opacity-50"
              @click="handleAddToCart"
            >
              <span class="material-icons text-sm mr-1.5">add_shopping_cart</span>
              {{ $t('booking.addToCart') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  option: {
    type: Object,
    default: null
  },
  roomType: {
    type: Object,
    default: null
  },
  maxDiscountPercent: {
    type: Number,
    default: 15 // Default max discount from commission
  }
})

const emit = defineEmits(['update:modelValue', 'add-to-cart'])

const { locale } = useI18n()

// Discount state
const discountType = ref('percent')
const discountValue = ref(0)

// Rate type selection (refundable / non-refundable)
const selectedRateType = ref('refundable')

// Campaign discount (pure campaign amount, excluding tier/margin)
const campaignDiscountAmount = computed(() => {
  return props.option?.pricing?.campaignDiscount || props.option?.pricing?.totalDiscount || 0
})

const afterCampaignTotal = computed(() => {
  return (
    props.option?.pricing?.afterCampaignTotal ||
    props.option?.pricing?.originalTotal - campaignDiscountAmount.value ||
    0
  )
})

// Margin = difference between after-campaign price and channel price (b2b/b2c)
const marginAmount = computed(() => {
  const afterCampaign = afterCampaignTotal.value
  const channelPrice = props.option?.pricing?.finalTotal || 0
  const margin = afterCampaign - channelPrice
  return margin > 0 ? margin : 0
})

// Get base price based on rate type selection
const basePriceForCalculation = computed(() => {
  if (selectedRateType.value === 'non_refundable' && props.option?.nonRefundable?.enabled) {
    return props.option.nonRefundable.pricing?.finalTotal || props.option?.pricing?.finalTotal || 0
  }
  return props.option?.pricing?.finalTotal || 0
})

// Calculate custom discount amount
const calculatedCustomDiscount = computed(() => {
  if (!discountValue.value || discountValue.value <= 0) return 0

  // Use the price based on selected rate type
  const basePrice = basePriceForCalculation.value

  if (discountType.value === 'percent') {
    return (basePrice * discountValue.value) / 100
  }
  return discountValue.value
})

// Calculate final total
const finalTotal = computed(() => {
  return Math.max(0, basePriceForCalculation.value - calculatedCustomDiscount.value)
})

// Check if user is an agency
const isAgency = computed(() => authStore.accountType === 'agency')

// Get cost amount based on user type (hotel cost for partners, b2b price for agencies)
const costAmount = computed(() => {
  if (isAgency.value) {
    // Agency sees partner's B2B price as their cost
    if (selectedRateType.value === 'non_refundable' && props.option?.nonRefundable?.enabled) {
      return props.option.nonRefundable.pricing?.b2bPrice || props.option?.pricing?.b2bPrice || 0
    }
    return props.option?.pricing?.b2bPrice || 0
  }
  // Partner sees hotel cost as their cost
  if (selectedRateType.value === 'non_refundable' && props.option?.nonRefundable?.enabled) {
    return props.option.nonRefundable.pricing?.hotelCost || props.option?.pricing?.hotelCost || 0
  }
  return props.option?.pricing?.hotelCost || 0
})

// Calculate profit (sale price - cost - custom discount)
const profit = computed(() => {
  return Math.round((finalTotal.value - costAmount.value) * 100) / 100
})

// Calculate the maximum discount amount that doesn't go below cost
const maxDiscountAmount = computed(() => {
  const basePrice = basePriceForCalculation.value
  const cost = costAmount.value
  // Maximum discount is the difference between sale price and cost
  // Ensure we have valid numbers
  if (!basePrice || !cost || cost <= 0) return basePrice
  return Math.max(0, basePrice - cost)
})

// Calculate max discount based on REAL MARGIN
// Real Margin = (salePrice - cost) / salePrice × 100
// Example: cost=100, sale=110 → margin = 10/110 = 9.09%
// So max 9% discount on sale price = 9.9 TRY → final = 100.1 TRY (no loss)
const maxDiscount = computed(() => {
  const basePrice = basePriceForCalculation.value
  const cost = costAmount.value

  // If no valid cost data, allow reasonable default
  if (!basePrice || !cost || cost <= 0) {
    return discountType.value === 'percent' ? 100 : basePrice
  }

  // Calculate real margin percentage
  const realMarginPercent = ((basePrice - cost) / basePrice) * 100

  if (discountType.value === 'percent') {
    // Return real margin percentage (floored to be safe)
    return Math.floor(realMarginPercent)
  }
  // For amount type, return margin amount
  return Math.floor(basePrice - cost)
})

// Calculated real margin for display
const realMarginPercent = computed(() => {
  const basePrice = basePriceForCalculation.value
  const cost = costAmount.value
  if (!basePrice || !cost || cost <= 0) return 0
  return Math.round(((basePrice - cost) / basePrice) * 10000) / 100 // 2 decimal places
})

// Check if discount would push price below cost - THIS IS THE PRIMARY CHECK
const isDiscountBelowCost = computed(() => {
  const cost = costAmount.value
  const final = finalTotal.value
  // If we don't have cost data, allow the discount
  if (!cost || cost <= 0) return false
  // Check if final price is below cost
  return final < cost
})

// Check if discount input exceeds maximum allowed
const isDiscountExceeded = computed(() => {
  // First check: is the entered value above max?
  if (discountValue.value > maxDiscount.value) return true
  // Second check: would the final price go below cost?
  return isDiscountBelowCost.value
})

// Get localized name
const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

// Format price
const formatPrice = price => {
  if (!price) return '-'
  const currency = props.option?.pricing?.currency || 'TRY'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Format date
const formatDate = date => {
  if (!date) return ''
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

// Close modal
const close = () => {
  emit('update:modelValue', false)
}

// Handle add to cart
const handleAddToCart = () => {
  // Block if discount exceeds limits or would push price below cost
  if (isDiscountExceeded.value || isDiscountBelowCost.value) return

  // Double-check: final price must not be below cost
  if (costAmount.value > 0 && finalTotal.value < costAmount.value) {
    console.warn('Blocked: Final price would be below cost')
    return
  }

  emit('add-to-cart', {
    roomType: props.roomType,
    mealPlan: props.option?.mealPlan,
    option: props.option,
    rateType: selectedRateType.value,
    isNonRefundable: selectedRateType.value === 'non_refundable',
    nonRefundableDiscount:
      selectedRateType.value === 'non_refundable'
        ? props.option?.nonRefundable?.discountPercent || 0
        : 0,
    customDiscount: {
      type: discountType.value,
      value: discountValue.value,
      amount: calculatedCustomDiscount.value
    },
    basePrice: basePriceForCalculation.value,
    finalTotal: finalTotal.value
  })
  close()
}

// Reset state when modal opens
watch(
  () => props.modelValue,
  val => {
    if (val) {
      discountValue.value = 0
      discountType.value = 'percent'
      // Reset rate type to refundable by default
      selectedRateType.value = 'refundable'
    }
  }
)
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .relative,
.modal-fade-leave-to .relative {
  transform: scale(0.95);
}
</style>
