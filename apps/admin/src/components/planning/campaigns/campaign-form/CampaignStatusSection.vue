<template>
  <div class="space-y-3">
    <!-- Status & Combinable Row -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Status Toggle -->
      <div
        class="flex-1 flex items-center justify-between p-3 rounded-lg border"
        :class="
          form.status === 'active'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'
        "
      >
        <div class="flex items-center gap-2">
          <span
            class="material-icons text-sm"
            :class="form.status === 'active' ? 'text-green-500' : 'text-gray-400'"
          >
            {{ form.status === 'active' ? 'check_circle' : 'pause_circle' }}
          </span>
          <span
            class="text-sm font-medium"
            :class="
              form.status === 'active'
                ? 'text-green-700 dark:text-green-400'
                : 'text-gray-600 dark:text-slate-400'
            "
          >
            {{
              form.status === 'active'
                ? $t('planning.campaigns.statusActive')
                : $t('planning.campaigns.statusInactive')
            }}
          </span>
        </div>
        <button
          type="button"
          class="relative w-10 h-5 rounded-full transition-colors"
          :class="form.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'"
          @click="$emit('toggle-status')"
        >
          <span
            class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
            :class="form.status === 'active' ? 'translate-x-5' : ''"
          ></span>
        </button>
      </div>

      <!-- Combinable Toggle -->
      <div
        class="flex-1 flex items-center justify-between p-3 rounded-lg border"
        :class="
          form.combinable
            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
            : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'
        "
      >
        <div class="flex items-center gap-2">
          <span
            class="material-icons text-sm"
            :class="form.combinable ? 'text-purple-500' : 'text-gray-400'"
            >link</span
          >
          <span
            class="text-sm font-medium"
            :class="
              form.combinable
                ? 'text-purple-700 dark:text-purple-400'
                : 'text-gray-600 dark:text-slate-400'
            "
          >
            {{ $t('planning.campaigns.combinable') }}
          </span>
        </div>
        <button
          type="button"
          class="relative w-10 h-5 rounded-full transition-colors"
          :class="form.combinable ? 'bg-purple-500' : 'bg-gray-300 dark:bg-slate-600'"
          @click="form.combinable = !form.combinable"
        >
          <span
            class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
            :class="form.combinable ? 'translate-x-5' : ''"
          ></span>
        </button>
      </div>
    </div>

    <!-- B2B & B2C Visibility Row -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- B2C Toggle -->
      <div
        class="flex-1 flex items-center justify-between p-3 rounded-lg border"
        :class="
          form.visibility.b2c
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'
        "
      >
        <div class="flex items-center gap-2">
          <span
            class="material-icons text-sm"
            :class="form.visibility.b2c ? 'text-blue-500' : 'text-gray-400'"
            >person</span
          >
          <span
            class="text-sm font-medium"
            :class="
              form.visibility.b2c
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-slate-400'
            "
          >
            B2C
          </span>
        </div>
        <button
          type="button"
          class="relative w-10 h-5 rounded-full transition-colors"
          :class="form.visibility.b2c ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'"
          @click="form.visibility.b2c = !form.visibility.b2c"
        >
          <span
            class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
            :class="form.visibility.b2c ? 'translate-x-5' : ''"
          ></span>
        </button>
      </div>

      <!-- B2B Toggle -->
      <div
        class="flex-1 flex items-center justify-between p-3 rounded-lg border"
        :class="
          form.visibility.b2b
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'
        "
      >
        <div class="flex items-center gap-2">
          <span
            class="material-icons text-sm"
            :class="form.visibility.b2b ? 'text-orange-500' : 'text-gray-400'"
            >business</span
          >
          <span
            class="text-sm font-medium"
            :class="
              form.visibility.b2b
                ? 'text-orange-700 dark:text-orange-400'
                : 'text-gray-600 dark:text-slate-400'
            "
          >
            B2B
          </span>
        </div>
        <button
          type="button"
          class="relative w-10 h-5 rounded-full transition-colors"
          :class="form.visibility.b2b ? 'bg-orange-500' : 'bg-gray-300 dark:bg-slate-600'"
          @click="form.visibility.b2b = !form.visibility.b2b"
        >
          <span
            class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
            :class="form.visibility.b2b ? 'translate-x-5' : ''"
          ></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true }
})

defineEmits(['toggle-status'])
</script>
