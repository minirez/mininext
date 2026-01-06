<template>
  <Transition name="slide">
    <div
      v-if="hasConflicts"
      class="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-300 dark:border-red-800"
    >
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-red-500">warning</span>
        <h4 class="font-medium text-red-700 dark:text-red-400">
          {{ $t('planning.campaigns.conflictDetected') }}
        </h4>
        <span
          class="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-medium"
        >
          {{ conflictingCampaigns.length }} {{ $t('planning.campaigns.campaignConflicts') }}
        </span>
      </div>

      <p class="text-sm text-red-600 dark:text-red-400 mb-3">
        {{ $t('planning.campaigns.conflictWarning') }}
      </p>

      <div class="space-y-2 max-h-40 overflow-y-auto">
        <div
          v-for="conflict in conflictingCampaigns"
          :key="conflict._id"
          class="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-700"
        >
          <div class="flex items-center gap-2">
            <span class="material-icons text-sm text-red-500">campaign</span>
            <div>
              <div class="font-medium text-sm text-gray-800 dark:text-white">
                {{ conflict.name }}
              </div>
              <div class="text-xs text-gray-500 flex items-center gap-2">
                <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">{{
                  conflict.code
                }}</span>
                <span>{{ $t(`planning.campaigns.types.${conflict.type}`) }}</span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div
              class="text-sm font-bold"
              :class="conflict.discountType === 'percentage' ? 'text-green-600' : 'text-blue-600'"
            >
              {{
                conflict.discountType === 'percentage'
                  ? `-${conflict.discountValue}%`
                  : `-${conflict.discountValue}€`
              }}
            </div>
            <div class="text-xs text-gray-400">
              {{
                conflict.combinable
                  ? $t('planning.campaigns.combinableShort')
                  : $t('planning.campaigns.notCombinable')
              }}
            </div>
          </div>
        </div>
      </div>

      <div class="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
        <span class="material-icons text-sm">info</span>
        <span>{{ $t('planning.campaigns.conflictResolutionHint') }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  hasConflicts: { type: Boolean, default: false },
  conflictingCampaigns: { type: Array, default: () => [] }
})
</script>
