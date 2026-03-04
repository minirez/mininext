<template>
  <section class="py-12 sm:py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div v-if="title" class="mb-8">
        <h2 class="text-3xl font-semibold text-gray-900">{{ title }}</h2>
        <p v-if="description" class="text-gray-500 mt-1">{{ description }}</p>
      </div>

      <div class="space-y-4">
        <div
          v-for="(flight, i) in items.slice(0, 8)"
          :key="i"
          class="rounded border border-gray-200 px-5 py-5 hover:shadow-md transition-shadow"
        >
          <div class="grid grid-cols-12 items-center gap-4">
            <!-- Route info (8/12) -->
            <div class="col-span-12 lg:col-span-8">
              <div class="flex items-center gap-4">
                <!-- Departure -->
                <div class="text-center min-w-[80px]">
                  <div class="text-lg font-bold text-gray-900">{{ flight.from?.city || flight.departure }}</div>
                  <div class="text-sm text-gray-500">{{ flight.from?.code || '' }}</div>
                  <div v-if="flight.departDate" class="text-xs text-gray-400 mt-1">{{ flight.departDate }}</div>
                </div>

                <!-- Connecting dotted line -->
                <div class="flex-1 relative py-3">
                  <div class="flight-line" />
                  <div class="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-white" />
                  <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-site-primary bg-white" />
                  <div v-if="flight.duration" class="absolute left-1/2 -translate-x-1/2 -bottom-1 text-[11px] text-gray-400">
                    {{ flight.duration }}
                  </div>
                </div>

                <!-- Arrival -->
                <div class="text-center min-w-[80px]">
                  <div class="text-lg font-bold text-gray-900">{{ flight.to?.city || flight.arrival }}</div>
                  <div class="text-sm text-gray-500">{{ flight.to?.code || '' }}</div>
                  <div v-if="flight.arriveDate" class="text-xs text-gray-400 mt-1">{{ flight.arriveDate }}</div>
                </div>
              </div>
            </div>

            <!-- Price + CTA (4/12) -->
            <div class="col-span-12 lg:col-span-4 flex items-center justify-end gap-4">
              <div v-if="flight.price" class="text-right">
                <div class="text-xs text-gray-500">{{ $t('common.from') }}</div>
                <div class="text-xl font-bold text-site-primary">{{ flight.price }}</div>
              </div>
              <button
                class="px-8 h-12 border-2 border-site-primary text-site-primary rounded font-medium hover:bg-site-primary hover:text-white transition-colors whitespace-nowrap"
              >
                {{ $t('common.viewDetails') || 'View Details' }}
              </button>
            </div>
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

<style scoped>
.flight-line {
  border-bottom: 2px dashed #ccc;
  position: relative;
}
</style>
