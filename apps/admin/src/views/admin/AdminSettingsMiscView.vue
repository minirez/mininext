<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

const tabs = [
  {
    id: 'platform-settings',
    label: t('nav.platformSettings'),
    icon: 'settings',
    path: '/admin/settings/platform'
  },
  { id: 'regions', label: t('nav.regionManagement'), icon: 'map', path: '/admin/settings/regions' },
  {
    id: 'migration',
    label: t('migration.title'),
    icon: 'swap_horiz',
    path: '/admin/settings/migration'
  },
  {
    id: 'reservation-migration',
    label: t('migration.resMigration.title'),
    icon: 'import_export',
    path: '/admin/settings/reservation-migration'
  },
  { id: 'tursab', label: t('tursab.title'), icon: 'menu_book', path: '/admin/settings/tursab' },
  {
    id: 'responsive-viewer',
    label: t('nav.responsiveViewer'),
    icon: 'devices',
    path: '/admin/settings/responsive-viewer'
  }
]

const activeTab = computed(() => route.meta?.tab || 'platform-settings')
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6">
      <nav class="flex space-x-6 overflow-x-auto">
        <router-link
          v-for="tab in tabs"
          :key="tab.id"
          :to="tab.path"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap',
            activeTab === tab.id
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-500'
          ]"
        >
          <span class="material-icons text-lg">{{ tab.icon }}</span>
          {{ tab.label }}
        </router-link>
      </nav>
    </div>

    <div class="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-slate-900">
      <router-view />
    </div>
  </div>
</template>
