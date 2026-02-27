<template>
  <div>
    <!-- Info Box -->
    <div
      class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6 border border-indigo-200 dark:border-indigo-800"
    >
      <div class="flex items-start gap-3">
        <span class="material-icons text-indigo-500 text-xl">info</span>
        <div>
          <h4 class="font-medium text-indigo-800 dark:text-indigo-300 mb-1">
            {{ $t('planning.markets.pricingOverrideInfo') }}
          </h4>
          <p class="text-sm text-indigo-700 dark:text-indigo-400">
            {{ $t('planning.markets.pricingOverrideDescription') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Cancellation Policy Warning -->
    <div
      v-if="!hotel.policies?.cancellationRules?.length"
      class="p-3 mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg flex items-center gap-3"
    >
      <span class="material-icons text-amber-500 text-xl flex-shrink-0">warning</span>
      <p class="text-sm text-amber-700 dark:text-amber-300">
        {{ $t('hotels.policies.noCancellationWarning') }}
      </p>
    </div>

    <!-- No Rooms Warning -->
    <div v-if="pricingRoomTypes.length === 0" class="text-center py-12">
      <div
        class="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4"
      >
        <span class="material-icons text-3xl text-gray-400 dark:text-slate-500">hotel</span>
      </div>
      <h5 class="font-medium text-gray-600 dark:text-slate-400 mb-2">
        {{ $t('planning.markets.noRooms') }}
      </h5>
      <p class="text-sm text-gray-500 dark:text-slate-500 max-w-md mx-auto">
        {{ $t('planning.markets.noRoomsHint') }}
      </p>
    </div>

    <!-- Room Type Tabs for Pricing Overrides -->
    <div v-else>
      <!-- Room Selection Tabs -->
      <div
        class="flex gap-1 flex-wrap pb-2 mb-4 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-[5] -mx-4 px-4"
      >
        <button
          v-for="rt in pricingRoomTypes"
          :key="rt._id"
          type="button"
          class="px-4 py-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px rounded-t-lg"
          :class="
            selectedPricingRoom === rt._id
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300'
          "
          @click="$emit('update:selectedPricingRoom', rt._id)"
        >
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-1">
              <span class="font-bold">{{ rt.code }}</span>
              <span
                v-if="hasRoomOverride(rt._id)"
                class="w-2 h-2 rounded-full bg-indigo-500"
              ></span>
            </div>
            <span
              class="text-[10px] font-mono opacity-60"
              :class="
                rt.pricingType === 'per_person'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 dark:text-slate-400'
              "
            >
              {{ rt.pricingType === 'per_person' ? 'obp' : 'ünite' }}
            </span>
          </div>
        </button>
      </div>

      <!-- Selected Room Pricing Override -->
      <div v-if="selectedPricingRoom && currentSelectedRoom" class="space-y-4">
        <!-- Room Info -->
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div
            class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm"
          >
            {{ currentSelectedRoom.code }}
          </div>
          <div class="flex-1">
            <div class="font-medium text-gray-800 dark:text-white text-sm">
              {{ currentSelectedRoom.name?.[locale] || currentSelectedRoom.name?.tr }}
            </div>
            <div class="text-xs text-gray-500 dark:text-slate-400">
              {{
                currentSelectedRoom.pricingType === 'per_person'
                  ? 'Kişi Bazlı (OBP)'
                  : 'Ünite Bazlı'
              }}
              <template v-if="currentSelectedRoom.useMultipliers"> + Çarpan Sistemi</template>
              | Max: {{ currentSelectedRoom.occupancy?.maxAdults || 2 }} Yetişkin,
              {{ currentSelectedRoom.occupancy?.maxChildren || 0 }} Çocuk
            </div>
          </div>
        </div>

        <!-- Pricing Type Override -->
        <PricingTypeOverride
          :current-room-override="currentRoomOverride"
          :current-selected-room="currentSelectedRoom"
          @update="updateRoomOverride"
        />

        <!-- Min Adults Override -->
        <MinAdultsOverride
          :current-room-override="currentRoomOverride"
          :current-selected-room="currentSelectedRoom"
          @update="updateRoomOverride"
          @adjust="$emit('adjustMinAdults', $event)"
        />

        <!-- Multiplier Override -->
        <MultiplierOverride
          v-if="
            effectivePricingType === 'per_person' &&
            (currentSelectedRoom.useMultipliers || currentRoomOverride.usePricingTypeOverride)
          "
          :current-room-override="currentRoomOverride"
          :current-selected-room="currentSelectedRoom"
          :effective-pricing-type="effectivePricingType"
          :hotel="hotel"
          :currency="currency"
          @update="updateRoomOverride"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import PricingTypeOverride from './sections/PricingTypeOverride.vue'
import MinAdultsOverride from './sections/MinAdultsOverride.vue'
import MultiplierOverride from './sections/MultiplierOverride.vue'

defineProps({
  pricingRoomTypes: { type: Array, default: () => [] },
  selectedPricingRoom: { type: String, default: '' },
  currentSelectedRoom: { type: Object, default: null },
  currentRoomOverride: { type: Object, default: null },
  effectivePricingType: { type: String, default: 'unit' },
  hotel: { type: Object, required: true },
  currency: { type: String, default: 'EUR' },
  locale: { type: String, default: 'tr' },
  hasRoomOverride: { type: Function, required: true }
})

const emit = defineEmits(['update:selectedPricingRoom', 'adjustMinAdults', 'updateRoomOverride'])

const updateRoomOverride = (field, value) => {
  emit('updateRoomOverride', { field, value })
}
</script>
