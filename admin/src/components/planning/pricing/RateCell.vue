<template>
  <div
    ref="cellRef"
    class="rate-cell h-full min-h-[50px] sm:min-h-[60px] px-0.5 sm:px-1 py-1 sm:py-1.5 cursor-pointer transition-all duration-150 select-none"
    :class="cellClasses"
    :data-cell="`${roomTypeId}-${mealPlanId}-${date}`"
    @click="handleClick"
    @dblclick="$emit('dblclick')"
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
        @input="$emit('inline-change', $event.target.value)"
        @keydown.enter="$emit('inline-save')"
        @keydown.tab="$emit('inline-next', $event)"
        class="inline-price-input w-full h-7 sm:h-8 text-center text-[10px] sm:text-xs font-semibold border rounded px-0.5 bg-white dark:bg-slate-800 transition-colors"
        :class="[
          inlineEditValue > 0
            ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400',
          isBaseCell ? 'ring-1 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : '',
          isCalculated && !allowEditCalculated ? 'bg-gray-100 dark:bg-slate-700 cursor-not-allowed' : ''
        ]"
        :readonly="isCalculated && !allowEditCalculated"
        placeholder="0"
      />
    </div>

    <!-- Normal Display Mode -->
    <template v-else>
      <!-- No Rate -->
      <div v-if="!rate" class="flex flex-col items-center justify-center h-full text-gray-300 dark:text-slate-600">
        <span class="text-[10px] sm:text-xs">-</span>
      </div>

      <!-- Has Rate (stop sale or not - same display, just different colors) -->
      <div v-else class="flex flex-col items-center justify-center h-full">
        <!-- Price - RED if stop sale, GREEN if normal -->
        <div class="text-xs sm:text-sm font-bold" :class="rate.stopSale ? 'text-red-500' : 'text-green-600 dark:text-green-400'">
          {{ formattedPrice }}
        </div>

        <!-- Allotment Bar -->
        <div class="w-full mt-0.5 sm:mt-1 px-0.5 sm:px-1">
          <div class="h-0.5 sm:h-1 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="allotmentBarColor"
              :style="{ width: `${allotmentPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Allotment Count -->
        <div class="text-[8px] sm:text-[10px] mt-0.5" :class="allotmentTextColor">
          {{ rate.allotment ?? 0 }}
        </div>

        <!-- Restrictions Icons (NO STOP text, just CTA/CTD/MinStay/SingleStop) -->
        <div v-if="hasVisibleRestrictions" class="flex gap-0.5 mt-0.5">
          <span v-if="rate.singleStop" class="text-[6px] sm:text-[8px] text-pink-500 font-bold" title="Single Stop">1P</span>
          <span v-if="rate.closedToArrival" class="text-[6px] sm:text-[8px] text-orange-500 font-bold" title="Closed to Arrival">CTA</span>
          <span v-if="rate.closedToDeparture" class="text-[6px] sm:text-[8px] text-orange-500 font-bold" title="Closed to Departure">CTD</span>
          <span v-if="rate.minStay > 1" class="text-[6px] sm:text-[8px] text-blue-500 font-medium" :title="`Min Stay: ${rate.minStay}`">{{ rate.minStay }}+</span>
        </div>
      </div>

      <!-- Corner Indicator for Extra Prices -->
      <div
        v-if="hasExtraPrices"
        class="absolute top-0 right-0 w-0 h-0 border-t-[6px] border-r-[6px] border-t-transparent border-r-blue-500 dark:border-r-blue-400"
        :title="$t('planning.pricing.hasExtraPricing')"
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
        v-if="isHovered && hasExtraPrices"
        class="fixed z-[9999] pointer-events-none"
        :style="popoverStyle"
      >
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white rounded-xl shadow-xl border border-slate-600/50 overflow-hidden min-w-[140px]">
          <!-- Header -->
          <div class="px-3 py-1.5 bg-blue-600/20 border-b border-slate-600/30">
            <span class="text-[10px] font-semibold text-blue-300 uppercase tracking-wide">{{ $t('planning.pricing.extraPrices') }}</span>
          </div>

          <!-- Content -->
          <div class="px-3 py-2 space-y-1.5">
            <!-- Extra Adult -->
            <div v-if="typeof rate.extraAdult === 'number' && rate.extraAdult >= 0" class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-amber-400 text-xs">person_add</span>
                <span class="text-[10px] text-slate-300">{{ $t('planning.pricing.extraAdultShort') }}</span>
              </div>
              <span class="text-xs font-bold" :class="rate.extraAdult === 0 ? 'text-green-400' : 'text-white'">
                {{ rate.extraAdult === 0 ? $t('common.free') : `+${rate.extraAdult} ${currency}` }}
              </span>
            </div>

            <!-- Child Prices -->
            <template v-if="childPricesForDisplay.length > 0">
              <div
                v-for="child in childPricesForDisplay"
                :key="child.index"
                class="flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-1.5">
                  <span class="material-icons text-pink-400 text-xs">child_care</span>
                  <span class="text-[10px] text-slate-300">{{ child.index }}. {{ $t('planning.pricing.child') }}</span>
                </div>
                <span class="text-xs font-bold" :class="child.price === 0 ? 'text-green-400' : 'text-white'">
                  {{ child.price === 0 ? $t('common.free') : `+${child.price} ${currency}` }}
                </span>
              </div>
            </template>

            <!-- Extra Infant -->
            <div v-if="typeof rate.extraInfant === 'number' && rate.extraInfant >= 0" class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-purple-400 text-xs">baby_changing_station</span>
                <span class="text-[10px] text-slate-300">{{ $t('planning.pricing.extraInfantShort') }}</span>
              </div>
              <span class="text-xs font-bold" :class="rate.extraInfant === 0 ? 'text-green-400' : 'text-white'">
                {{ rate.extraInfant === 0 ? $t('common.free') : `+${rate.extraInfant} ${currency}` }}
              </span>
            </div>

            <!-- Single Occupancy Discount -->
            <div v-if="typeof rate.singleSupplement === 'number' && rate.singleSupplement > 0" class="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-600/30">
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-blue-400 text-xs">person</span>
                <span class="text-[10px] text-slate-300">{{ $t('planning.pricing.singleOccupancy') }}</span>
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
  currency: { type: String, default: 'EUR' },
  isSelected: { type: Boolean, default: false },
  isPast: { type: Boolean, default: false },
  inlineEditMode: { type: Boolean, default: false },
  inlineEditValue: { type: [Number, String], default: '' },
  isBaseCell: { type: Boolean, default: false },
  isCalculated: { type: Boolean, default: false },
  allowEditCalculated: { type: Boolean, default: false }
})

const emit = defineEmits(['click', 'dblclick', 'inline-change', 'inline-save', 'inline-next'])

const inlineInput = ref(null)
const cellRef = ref(null)
const isHovered = ref(false)
const popoverStyle = ref({})

const showPopover = () => {
  // Don't show popover in inline edit mode
  if (props.inlineEditMode) return
  if (!props.rate || !hasExtraPrices.value) return

  isHovered.value = true

  // Calculate position based on cell
  if (cellRef.value) {
    const rect = cellRef.value.getBoundingClientRect()
    const popoverHeight = 120 // approximate height
    const popoverWidth = 160

    // Position below the cell, centered
    let top = rect.bottom + 4
    let left = rect.left + (rect.width / 2) - (popoverWidth / 2)

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

const handleClick = (event) => {
  if (!props.inlineEditMode) {
    emit('click', event)
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

const formattedPrice = computed(() => {
  if (!props.rate?.pricePerNight && props.rate?.pricePerNight !== 0) return '-'

  // Simple format without currency symbol for compactness
  return props.rate.pricePerNight.toLocaleString()
})

const allotmentPercentage = computed(() => {
  if (!props.rate) return 0
  const allotment = props.rate.allotment ?? 0
  // Assume max allotment is 20 for visualization
  return Math.min((allotment / 20) * 100, 100)
})

const allotmentBarColor = computed(() => {
  const allotment = props.rate?.allotment ?? 0

  if (allotment === 0) return 'bg-red-500'
  if (allotment <= 2) return 'bg-red-400'
  if (allotment <= 5) return 'bg-amber-400'
  return 'bg-green-400'
})

const allotmentTextColor = computed(() => {
  const allotment = props.rate?.allotment ?? 0

  if (allotment === 0) return 'text-red-500 font-bold'
  if (allotment <= 2) return 'text-red-500 font-semibold'
  if (allotment <= 5) return 'text-amber-600 dark:text-amber-400'
  return 'text-gray-500 dark:text-slate-400'
})

// Visible restrictions (excluding stopSale which is shown via red color)
const hasVisibleRestrictions = computed(() => {
  if (!props.rate) return false
  return props.rate.singleStop || props.rate.closedToArrival || props.rate.closedToDeparture || (props.rate.minStay && props.rate.minStay > 1)
})

// Check if rate has any extra person pricing (with valid values)
const hasExtraPrices = computed(() => {
  if (!props.rate) return false
  const hasAdult = typeof props.rate.extraAdult === 'number' && props.rate.extraAdult >= 0
  const hasInfant = typeof props.rate.extraInfant === 'number' && props.rate.extraInfant >= 0
  const hasChild = props.rate.childOrderPricing?.some(p => typeof p === 'number' && p >= 0)
  const hasSingle = typeof props.rate.singleSupplement === 'number' && props.rate.singleSupplement > 0
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
.inline-price-input[type=number] {
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
