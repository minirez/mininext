<template>
  <div
    ref="cellRef"
    class="rate-cell h-full min-h-[50px] sm:min-h-[60px] px-0.5 sm:px-1 py-1 sm:py-1.5 cursor-pointer transition-all duration-150 select-none"
    :class="cellClasses"
    :data-cell="`${roomTypeId}-${mealPlanId}-${date}`"
    @click="handleClick"
    @dblclick="$emit('dblclick')"
    @contextmenu.prevent="handleContextMenu"
    @mouseenter="showPopover"
    @mouseleave="hidePopover"
  >
    <!-- Inline Edit Mode -->
    <div v-if="inlineEditMode" class="flex items-center justify-center h-full p-0.5">
      <input
        ref="inlineInput"
        type="number"
        min="0"
        step="1"
        :value="inlineEditValue"
        class="inline-price-input w-full h-7 sm:h-8 text-center text-[10px] sm:text-xs font-semibold border rounded px-0.5 bg-white dark:bg-slate-800 transition-colors"
        :class="[
          inlineEditValue > 0
            ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400',
          isBaseCell ? 'ring-1 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : '',
          isCalculated && !allowEditCalculated
            ? 'bg-gray-100 dark:bg-slate-700 cursor-not-allowed'
            : ''
        ]"
        :readonly="isCalculated && !allowEditCalculated"
        placeholder="0"
        @input="$emit('inline-change', $event.target.value)"
        @keydown.enter="$emit('inline-save')"
        @keydown.tab="$emit('inline-next', $event)"
        @keydown.up.prevent="$emit('inline-up')"
        @keydown.down.prevent="$emit('inline-down')"
      />
    </div>

    <!-- Normal Display Mode -->
    <template v-else>
      <!-- No Rate -->
      <div
        v-if="!rate"
        class="flex flex-col items-center justify-center h-full text-gray-300 dark:text-slate-600"
      >
        <span class="text-[10px] sm:text-xs">-</span>
      </div>

      <!-- Has Rate (stop sale or not - same display, just different colors) -->
      <div v-else class="flex flex-col items-center justify-center h-full">
        <!-- OBP Badge -->
        <div
          v-if="isOBP"
          class="text-[6px] sm:text-[7px] px-0.5 sm:px-1 rounded font-semibold mb-0.5"
          :class="
            isMultiplierOBP
              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300'
              : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300'
          "
        >
          {{ isMultiplierOBP ? 'OBP×' : 'OBP' }}
        </div>
        <!-- Price - RED if stop sale, GREEN if normal -->
        <div
          class="text-xs sm:text-sm font-bold"
          :class="rate.stopSale ? 'text-red-500' : 'text-green-600 dark:text-green-400'"
        >
          {{ formattedPrice }}
        </div>

        <!-- Allotment with mini progress bar -->
        <div class="flex flex-col items-center mt-0.5 w-full px-0.5">
          <div class="flex items-center gap-0.5">
            <span v-if="availableRooms <= 0" class="material-icons text-[8px] text-red-500"
              >error</span
            >
            <span class="text-[7px] sm:text-[9px] font-semibold" :class="allotmentTextColor"
              >{{ availableRooms }}/{{ rate.allotment ?? 0 }}</span
            >
          </div>
          <div
            class="w-full h-[3px] bg-gray-200 dark:bg-slate-600 rounded-full mt-0.5 overflow-hidden"
          >
            <div
              class="h-full rounded-full transition-all"
              :class="allotmentBarColor"
              :style="{ width: `${allotmentPercentage}%` }"
            />
          </div>
        </div>

        <!-- Restrictions Icons (NO STOP text, just CTA/CTD/MinStay/SingleStop) -->
        <div v-if="hasVisibleRestrictions" class="flex gap-0.5 mt-0.5">
          <span
            v-if="rate.singleStop"
            class="text-[6px] sm:text-[8px] text-pink-500 font-bold"
            title="Single Stop"
            >1P</span
          >
          <span
            v-if="rate.closedToArrival"
            class="text-[6px] sm:text-[8px] text-orange-500 font-bold"
            title="Closed to Arrival"
            >CTA</span
          >
          <span
            v-if="rate.closedToDeparture"
            class="text-[6px] sm:text-[8px] text-orange-500 font-bold"
            title="Closed to Departure"
            >CTD</span
          >
          <span
            v-if="rate.minStay > 1"
            class="text-[6px] sm:text-[8px] text-blue-500 font-medium"
            :title="`Min Stay: ${rate.minStay}`"
            >{{ rate.minStay }}+</span
          >
        </div>
      </div>

      <!-- Corner Indicator for OBP or Extra Prices -->
      <div
        v-if="isOBP || hasExtraPrices"
        class="absolute top-0 right-0 w-0 h-0 border-t-[6px] border-r-[6px] border-t-transparent"
        :class="
          isOBP
            ? 'border-r-indigo-500 dark:border-r-indigo-400'
            : 'border-r-blue-500 dark:border-r-blue-400'
        "
        :title="isOBP ? 'Kişi Bazlı Fiyatlandırma (OBP)' : $t('planning.pricing.hasExtraPricing')"
      ></div>
    </template>

    <!-- Selection Overlay -->
    <div
      v-if="isSelected && !inlineEditMode"
      class="absolute inset-0 border-2 border-purple-500 bg-purple-500/10 rounded pointer-events-none"
    ></div>

    <!-- Past Date Overlay -->
    <div
      v-if="isPast && !inlineEditMode"
      class="absolute inset-0 bg-gray-100/50 dark:bg-slate-900/50 pointer-events-none"
    ></div>
  </div>

  <!-- Teleported Popover -->
  <Teleport to="body">
    <Transition name="popover-fade">
      <div
        v-if="isHovered && rate"
        class="fixed z-[9999] pointer-events-none"
        :style="popoverStyle"
      >
        <div
          class="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white rounded-xl shadow-xl border border-slate-600/50 overflow-hidden min-w-[140px]"
        >
          <!-- Header -->
          <div
            class="px-3 py-1.5 border-b border-slate-600/30"
            :class="
              isOBP
                ? isMultiplierOBP
                  ? 'bg-purple-600/20'
                  : 'bg-indigo-600/20'
                : 'bg-green-600/20'
            "
          >
            <span
              class="text-[10px] font-semibold uppercase tracking-wide"
              :class="
                isOBP ? (isMultiplierOBP ? 'text-purple-300' : 'text-indigo-300') : 'text-green-300'
              "
            >
              {{
                isOBP
                  ? isMultiplierOBP
                    ? 'Çarpanlı Kişi Bazlı Fiyat'
                    : 'Kişi Bazlı Fiyat'
                  : 'Ünite Bazlı Fiyat'
              }}
            </span>
          </div>

          <!-- Content -->
          <div class="px-3 py-2 space-y-1.5">
            <!-- OBP: Occupancy Pricing -->
            <template v-if="isOBP && occupancyPricesForDisplay.length > 0">
              <div
                v-for="occ in occupancyPricesForDisplay"
                :key="occ.pax"
                class="flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-1.5">
                  <span class="material-icons text-indigo-400 text-xs">group</span>
                  <span class="text-[10px] text-slate-300">{{ occ.pax }} Yetişkin</span>
                </div>
                <span class="text-xs font-bold text-white">
                  {{ occ.price.toLocaleString() }} {{ currency }}
                </span>
              </div>
            </template>

            <!-- Multiplier Combinations (for multiplier OBP) -->
            <template v-if="isMultiplierOBP && multiplierCombosForDisplay.length > 0">
              <div class="pt-1.5 border-t border-slate-600/30">
                <div class="text-[9px] text-purple-300 font-semibold uppercase mb-1">Çarpanlar</div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="combo in multiplierCombosForDisplay"
                    :key="combo.label"
                    class="px-1.5 py-0.5 bg-purple-900/50 rounded text-[9px] font-medium text-purple-200"
                  >
                    {{ combo.label }}: {{ combo.value }}
                  </span>
                </div>
              </div>
            </template>

            <!-- Unit-based: Base price + Extra Adult -->
            <template v-if="!isOBP">
              <!-- Base Price -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-1.5">
                  <span class="material-icons text-green-400 text-xs">hotel</span>
                  <span class="text-[10px] text-slate-300">Oda Fiyatı</span>
                </div>
                <span class="text-xs font-bold text-white">
                  {{ rate.pricePerNight?.toLocaleString() || 0 }} {{ currency }}
                </span>
              </div>

              <!-- Extra Adult -->
              <div
                v-if="typeof rate.extraAdult === 'number' && rate.extraAdult >= 0"
                class="flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-1.5">
                  <span class="material-icons text-amber-400 text-xs">person_add</span>
                  <span class="text-[10px] text-slate-300">{{
                    $t('planning.pricing.extraAdultShort')
                  }}</span>
                </div>
                <span
                  class="text-xs font-bold"
                  :class="rate.extraAdult === 0 ? 'text-green-400' : 'text-white'"
                >
                  {{
                    rate.extraAdult === 0 ? $t('common.free') : `+${rate.extraAdult} ${currency}`
                  }}
                </span>
              </div>
            </template>

            <!-- Child Prices (same for both pricing types) -->
            <template v-if="childPricesForDisplay.length > 0">
              <div
                v-for="child in childPricesForDisplay"
                :key="child.index"
                class="flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-1.5">
                  <span class="material-icons text-pink-400 text-xs">child_care</span>
                  <span class="text-[10px] text-slate-300"
                    >{{ child.index }}. {{ $t('planning.pricing.child') }}</span
                  >
                </div>
                <span
                  class="text-xs font-bold"
                  :class="child.price === 0 ? 'text-green-400' : 'text-white'"
                >
                  {{ child.price === 0 ? $t('common.free') : `+${child.price} ${currency}` }}
                </span>
              </div>
            </template>

            <!-- Extra Infant -->
            <div
              v-if="typeof rate.extraInfant === 'number' && rate.extraInfant >= 0"
              class="flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-purple-400 text-xs">baby_changing_station</span>
                <span class="text-[10px] text-slate-300">{{
                  $t('planning.pricing.extraInfantShort')
                }}</span>
              </div>
              <span
                class="text-xs font-bold"
                :class="rate.extraInfant === 0 ? 'text-green-400' : 'text-white'"
              >
                {{
                  rate.extraInfant === 0 ? $t('common.free') : `+${rate.extraInfant} ${currency}`
                }}
              </span>
            </div>

            <!-- Single Occupancy Discount (only for unit-based) -->
            <div
              v-if="
                !isOBP && typeof rate.singleSupplement === 'number' && rate.singleSupplement > 0
              "
              class="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-600/30"
            >
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-blue-400 text-xs">person</span>
                <span class="text-[10px] text-slate-300">{{
                  $t('planning.pricing.singleOccupancy')
                }}</span>
              </div>
              <span class="text-xs font-bold text-blue-300">
                -{{ rate.singleSupplement }} {{ currency }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  rate: { type: Object, default: null },
  date: { type: String, required: true },
  roomTypeId: { type: String, required: true },
  mealPlanId: { type: String, required: true },
  roomType: { type: Object, default: null }, // Full room type object for multiplier detection
  bookedCount: { type: Number, default: 0 },
  currency: { type: String, default: 'EUR' },
  isSelected: { type: Boolean, default: false },
  isPast: { type: Boolean, default: false },
  inlineEditMode: { type: Boolean, default: false },
  inlineEditValue: { type: [Number, String], default: '' },
  isBaseCell: { type: Boolean, default: false },
  isCalculated: { type: Boolean, default: false },
  allowEditCalculated: { type: Boolean, default: false }
})

const emit = defineEmits([
  'click',
  'dblclick',
  'contextmenu',
  'inline-change',
  'inline-save',
  'inline-next',
  'inline-up',
  'inline-down'
])

const inlineInput = ref(null)
const cellRef = ref(null)
const isHovered = ref(false)
const popoverStyle = ref({})

const showPopover = () => {
  // Don't show popover in inline edit mode
  if (props.inlineEditMode) return
  // Show popover if we have a rate
  if (!props.rate) return

  isHovered.value = true

  // Calculate position based on cell
  if (cellRef.value) {
    const rect = cellRef.value.getBoundingClientRect()
    const popoverHeight = 120 // approximate height
    const popoverWidth = 160

    // Position below the cell, centered
    let top = rect.bottom + 4
    let left = rect.left + rect.width / 2 - popoverWidth / 2

    // If would go off bottom, show above
    if (top + popoverHeight > window.innerHeight) {
      top = rect.top - popoverHeight - 4
    }

    // Keep within horizontal bounds
    if (left < 8) left = 8
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8
    }

    popoverStyle.value = {
      top: `${top}px`,
      left: `${left}px`
    }
  }
}

const hidePopover = () => {
  isHovered.value = false
}

const handleClick = event => {
  if (!props.inlineEditMode) {
    emit('click', event)
  }
}

const handleContextMenu = event => {
  // Only emit in inline edit mode
  if (props.inlineEditMode) {
    emit('contextmenu', event)
  }
}

const cellClasses = computed(() => {
  const classes = ['relative']

  if (props.isSelected) {
    classes.push('bg-purple-50 dark:bg-purple-900/20')
  } else if (props.isPast) {
    classes.push('opacity-60')
  }

  if (!props.isPast) {
    classes.push('hover:bg-gray-50 dark:hover:bg-slate-700/50')
  }

  return classes
})

// Check if rate uses OBP (per_person pricing)
const isOBP = computed(() => {
  return props.rate?.pricingType === 'per_person'
})

// Check if rate uses multiplier OBP (per_person with multipliers)
const isMultiplierOBP = computed(() => {
  return props.roomType?.pricingType === 'per_person' && props.roomType?.useMultipliers === true
})

// Get multiplier combinations for display in popover (first 5)
const multiplierCombosForDisplay = computed(() => {
  if (!isMultiplierOBP.value || !props.roomType?.multiplierTemplate) return []

  const template = props.roomType.multiplierTemplate
  const combos = []

  // Get adult combinations (most important)
  if (template.adults) {
    const entries = Object.entries(template.adults)
      .filter(([, v]) => v !== null && v !== undefined)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .slice(0, 5) // First 5

    entries.forEach(([count, multiplier]) => {
      combos.push({ label: `${count}Y`, value: multiplier })
    })
  }

  return combos
})

const formattedPrice = computed(() => {
  if (!props.rate) return '-'

  // Multiplier OBP (OBPx): Show base price (pricePerNight)
  if (isMultiplierOBP.value) {
    const basePrice = props.rate.pricePerNight
    if (basePrice === undefined || basePrice === null) return '-'
    return basePrice.toLocaleString()
  }

  // Standard OBP: Show first available occupancy price (2 person is most common)
  if (isOBP.value && props.rate.occupancyPricing) {
    // Find the first defined price (prioritize 2, then 1, then others)
    const priorities = [2, 1, 3, 4, 5, 6, 7, 8, 9, 10]
    for (const pax of priorities) {
      const price = props.rate.occupancyPricing[pax]
      if (price !== undefined && price !== null && price >= 0) {
        return price.toLocaleString()
      }
    }
    return '-'
  }

  // Unit-based: Show pricePerNight
  if (props.rate.pricePerNight === undefined && props.rate.pricePerNight !== 0) return '-'

  // Simple format without currency symbol for compactness
  return props.rate.pricePerNight?.toLocaleString() || '-'
})

const availableRooms = computed(() => Math.max(0, (props.rate?.allotment ?? 0) - props.bookedCount))

const allotmentPercentage = computed(() => {
  const total = props.rate?.allotment ?? 0
  return total === 0 ? 0 : Math.round((availableRooms.value / total) * 100)
})

const allotmentBarColor = computed(() => {
  if (availableRooms.value <= 0) return 'bg-red-500'
  if (allotmentPercentage.value < 30) return 'bg-red-500'
  if (allotmentPercentage.value <= 60) return 'bg-amber-500'
  return 'bg-green-500'
})

const allotmentTextColor = computed(() => {
  if (availableRooms.value === 0) return 'text-red-500 font-bold'
  if (availableRooms.value <= 2) return 'text-red-500 font-semibold'
  if (availableRooms.value <= 5) return 'text-amber-600 dark:text-amber-400'
  return 'text-gray-500 dark:text-slate-400'
})

// Visible restrictions (excluding stopSale which is shown via red color)
const hasVisibleRestrictions = computed(() => {
  if (!props.rate) return false
  return (
    props.rate.singleStop ||
    props.rate.closedToArrival ||
    props.rate.closedToDeparture ||
    (props.rate.minStay && props.rate.minStay > 1)
  )
})

// Check if rate has any extra person pricing (with valid values)
const hasExtraPrices = computed(() => {
  if (!props.rate) return false
  const hasAdult = typeof props.rate.extraAdult === 'number' && props.rate.extraAdult >= 0
  const hasInfant = typeof props.rate.extraInfant === 'number' && props.rate.extraInfant >= 0
  const hasChild = props.rate.childOrderPricing?.some(p => typeof p === 'number' && p >= 0)
  const hasSingle =
    typeof props.rate.singleSupplement === 'number' && props.rate.singleSupplement > 0
  return hasAdult || hasInfant || hasChild || hasSingle
})

// Get child prices as structured array for display
const childPricesForDisplay = computed(() => {
  if (!props.rate?.childOrderPricing?.length) return []
  return props.rate.childOrderPricing
    .map((p, i) => ({
      index: i + 1,
      price: typeof p === 'number' ? p : null,
      isValid: typeof p === 'number' && p >= 0
    }))
    .filter(item => item.isValid)
})

// Get occupancy prices for OBP display in popover
const occupancyPricesForDisplay = computed(() => {
  if (!isOBP.value || !props.rate?.occupancyPricing) return []

  const prices = []
  for (let pax = 1; pax <= 10; pax++) {
    const price = props.rate.occupancyPricing[pax]
    if (price !== undefined && price !== null && price >= 0) {
      prices.push({ pax, price })
    }
  }
  return prices
})
</script>

<style scoped>
.rate-cell {
  min-width: 50px;
}

/* Hide number input spin buttons */
.inline-price-input::-webkit-outer-spin-button,
.inline-price-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.inline-price-input[type='number'] {
  -moz-appearance: textfield;
}

/* Popover fade transition */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.15s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
}
</style>
