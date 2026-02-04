<template>
  <Modal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" size="full" :closable="true" :scrollable="false">
    <!-- Custom Header with Device Selector -->
    <template #header>
      <div class="flex items-center justify-between w-full pr-8">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('website.preview.title') }}
        </h3>
        
        <div class="flex items-center gap-3">
          <!-- Page Selector (optional) -->
          <div v-if="Array.isArray(pages) && pages.length > 0" class="flex items-center gap-2">
            <span class="text-sm text-gray-500 dark:text-slate-300">{{
              $t('website.preview.page')
            }}</span>
            <select
              class="form-select text-sm py-1"
              :value="selectedPageId || ''"
              @change="$emit('update:selectedPageId', $event.target.value)"
            >
              <option v-for="p in pages" :key="p.id" :value="p.id">
                {{ (p.name || p.url || '/') + (p.url ? ` (${p.url})` : '') }}
              </option>
            </select>
          </div>

          <!-- Device Selector -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              v-for="device in devices"
              :key="device.id"
              class="p-2 rounded-md transition-all duration-200"
              :class="activeDevice === device.id 
                ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
              :title="device.label"
              @click="activeDevice = device.id"
            >
              <span class="material-icons text-lg">{{ device.icon }}</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <div class="h-[85vh] w-full flex flex-col">
      <!-- Preview Container -->
      <div class="flex-1 flex items-center justify-center bg-gray-100 dark:bg-slate-900 rounded-lg p-4 overflow-hidden">
        <!-- Device Frame -->
        <Transition name="device" mode="out-in">
          <div 
            :key="activeDevice"
            class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out flex flex-col"
            :style="deviceStyle"
          >
            <!-- Device Header (for mobile/tablet) -->
            <div v-if="activeDevice !== 'desktop'" class="h-6 bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <div class="w-16 h-1 bg-gray-400 dark:bg-slate-500 rounded-full"></div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-hidden">
              <iframe 
                v-if="url" 
                :src="url" 
                class="w-full h-full border-0" 
                frameborder="0" 
                allowfullscreen
              />
              <div v-else class="flex items-center justify-center h-full">
                <div class="text-center">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p class="text-gray-600 dark:text-gray-400">{{ $t('website.preview.loading') }}</p>
                </div>
              </div>
            </div>

            <!-- Device Footer (for mobile/tablet) -->
            <div v-if="activeDevice !== 'desktop'" class="h-4 bg-gray-200 dark:bg-slate-700 flex-shrink-0"></div>
          </div>
        </Transition>
      </div>

      <!-- Device Info -->
      <div class="mt-3 text-center text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
        <span class="inline-flex items-center gap-2">
          <span class="material-icons text-base">{{ currentDevice.icon }}</span>
          {{ currentDevice.label }} - {{ currentDevice.width }}px
        </span>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/overlay/Modal.vue'

const { t } = useI18n()

defineProps({
  modelValue: Boolean,
  url: String,
  pages: { type: Array, default: () => [] },
  selectedPageId: { type: [String, null], default: null }
})
defineEmits(['update:modelValue', 'update:selectedPageId'])

const activeDevice = ref('desktop')

const devices = computed(() => [
  { id: 'mobile', icon: 'smartphone', label: t('website.preview.mobile') || 'Mobile', width: 375, height: 667 },
  { id: 'tablet', icon: 'tablet', label: t('website.preview.tablet') || 'Tablet', width: 768, height: 1024 },
  { id: 'desktop', icon: 'desktop_windows', label: t('website.preview.desktop') || 'Desktop', width: 1440, height: 900 }
])

const currentDevice = computed(() => devices.value.find(d => d.id === activeDevice.value) || devices.value[2])

const deviceStyle = computed(() => {
  const device = currentDevice.value
  if (device.id === 'desktop') {
    return { width: '100%', height: '100%', maxWidth: '100%' }
  }
  // For mobile/tablet, constrain to device dimensions
  return {
    width: `${device.width}px`,
    maxWidth: '100%',
    height: '100%',
    maxHeight: `${device.height + 40}px` // Account for device chrome
  }
})
</script>

<style scoped>
.device-enter-active,
.device-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.device-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.device-leave-to {
  opacity: 0;
  transform: scale(1.02);
}
</style>
