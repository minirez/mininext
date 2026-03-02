<template>
  <section class="py-12 sm:py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">
          {{ title || $t('sections.flightDeals') }}
        </h2>
        <p v-if="description" class="mt-2 text-gray-500 max-w-2xl mx-auto">{{ description }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(flight, i) in items.slice(0, 6)"
          :key="i"
          class="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
          :class="`stagger-${Math.min(i + 1, 6)}`"
        >
          <!-- Airline -->
          <div class="flex items-center gap-2 mb-4">
            <div v-if="flight.airlineLogo" class="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
              <img
                :src="flight.airlineLogo"
                :alt="flight.airline"
                class="w-full h-full object-contain"
              />
            </div>
            <div
              v-else
              class="w-8 h-8 rounded-full bg-site-primary/10 flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-site-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-700">{{ flight.airline }}</span>
          </div>

          <!-- Route -->
          <div class="flex items-center justify-between mb-4">
            <div class="text-center">
              <span class="block text-lg font-bold text-gray-900">{{ flight.from?.code }}</span>
              <span class="block text-xs text-gray-400">{{ flight.from?.city }}</span>
              <span v-if="flight.departTime" class="block text-xs text-gray-500 mt-1">{{
                flight.departTime
              }}</span>
            </div>

            <!-- Route line -->
            <div class="flex-1 mx-4 relative">
              <div class="border-t border-dashed border-gray-300" />
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-300 rounded-full"
              />
              <div
                class="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-site-primary rounded-full"
              />
              <span
                v-if="flight.duration"
                class="absolute top-full left-1/2 -translate-x-1/2 text-[10px] text-gray-400 mt-1 whitespace-nowrap"
              >
                {{ flight.duration }}
              </span>
            </div>

            <div class="text-center">
              <span class="block text-lg font-bold text-gray-900">{{ flight.to?.code }}</span>
              <span class="block text-xs text-gray-400">{{ flight.to?.city }}</span>
              <span v-if="flight.arriveTime" class="block text-xs text-gray-500 mt-1">{{
                flight.arriveTime
              }}</span>
            </div>
          </div>

          <!-- Price -->
          <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span class="text-xs text-gray-400">{{ $t('common.from') }}</span>
            <span class="text-lg font-bold text-site-primary">{{ flight.price }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  items: any[]
}>()
</script>
