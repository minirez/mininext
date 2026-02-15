<template>
  <div class="h-[520px] overflow-y-auto px-6 py-4 space-y-4">
    <!-- PMS Limitleri Karti -->
    <div
      class="bg-white dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-5"
    >
      <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-base text-purple-500">tune</span>
        {{ $t('partners.subscription.pmsLimitsTitle') || 'PMS Limitleri' }}
      </h4>

      <label class="flex items-center gap-2 cursor-pointer">
        <input
          :checked="useCustomPmsLimit"
          type="checkbox"
          class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          @change="$emit('update:useCustomPmsLimit', $event.target.checked)"
        />
        <span class="text-sm text-gray-700 dark:text-slate-300">
          {{ $t('partners.subscription.useCustomLimit') }}
        </span>
      </label>

      <div v-if="useCustomPmsLimit" class="mt-3 ml-6">
        <label class="form-label">{{ $t('partners.subscription.maxPmsHotels') }}</label>
        <input
          :value="customLimits.pmsMaxHotels"
          type="number"
          class="form-input w-32"
          min="-1"
          @input="$emit('update:customLimitsPmsMaxHotels', Number($event.target.value))"
        />
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('partners.subscription.maxPmsHotelsHint') }}
        </p>
      </div>

      <!-- PMS Durum Gostergesi -->
      <div v-if="pmsStatus" class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
        <dl class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-gray-500 dark:text-slate-400 text-xs mb-1">
              {{ $t('partners.subscription.provisionedHotels') }}
            </dt>
            <dd class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {{ pmsStatus.provisionedHotels || 0 }} /
              {{ pmsStatus.maxHotelsDisplay === 'unlimited' ? '∞' : pmsStatus.maxHotels || 0 }}
              <!-- Progress bar -->
              <div
                v-if="pmsStatus.maxHotelsDisplay !== 'unlimited' && pmsStatus.maxHotels > 0"
                class="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden"
              >
                <div
                  class="h-full rounded-full transition-all"
                  :class="
                    pmsUsagePercent >= 90
                      ? 'bg-red-500'
                      : pmsUsagePercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  "
                  :style="{ width: `${Math.min(pmsUsagePercent, 100)}%` }"
                />
              </div>
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-slate-400 text-xs mb-1">
              {{ $t('partners.subscription.pmsStatus') }}
            </dt>
            <dd>
              <span
                v-if="pmsStatus.canProvisionMore"
                class="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm"
              >
                <span class="material-icons text-sm">check_circle</span>
                {{ $t('partners.subscription.canProvision') }}
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-sm"
              >
                <span class="material-icons text-sm">block</span>
                {{ $t('partners.subscription.limitReached') }}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Notlar Karti -->
    <div
      class="bg-white dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600 p-5"
    >
      <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <span class="material-icons text-base text-purple-500">notes</span>
        {{ $t('partners.subscription.notes') }}
      </h4>
      <textarea
        :value="notes"
        class="form-input"
        rows="4"
        :placeholder="$t('partners.subscription.notesPlaceholder')"
        @input="$emit('update:notes', $event.target.value)"
      />
    </div>

    <!-- Kaydet -->
    <div class="flex justify-end">
      <button class="btn-primary" :disabled="saving" @click="$emit('save')">
        <span v-if="saving" class="material-icons text-sm animate-spin mr-1.5">refresh</span>
        {{ saving ? $t('common.loading') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  useCustomPmsLimit: { type: Boolean, default: false },
  customLimits: { type: Object, default: () => ({ pmsMaxHotels: null }) },
  pmsStatus: { type: Object, default: null },
  notes: { type: String, default: '' },
  saving: { type: Boolean, default: false }
})

defineEmits(['update:useCustomPmsLimit', 'update:customLimitsPmsMaxHotels', 'update:notes', 'save'])

const pmsUsagePercent = computed(() => {
  if (!props.pmsStatus || !props.pmsStatus.maxHotels) return 0
  return Math.round((props.pmsStatus.provisionedHotels / props.pmsStatus.maxHotels) * 100)
})
</script>
