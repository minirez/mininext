<template>
  <div>
    <!-- Module Navigation -->
    <ModuleNavigation :items="navItems" color="purple" />

    <!-- Router View for Sub Pages -->
    <div class="py-6">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'

const { t } = useI18n()

const navItems = computed(() => [
  {
    name: 'settings',
    to: '/site-management/settings',
    icon: 'settings',
    label: t('siteManagement.tabs.settings')
  },
  {
    name: 'pages',
    to: '/site-management/pages',
    icon: 'description',
    label: t('siteManagement.tabs.pages')
  },
  {
    name: 'notifications',
    to: '/site-management/notifications',
    icon: 'notifications',
    label: t('siteManagement.tabs.notifications')
  },
  {
    name: 'company',
    to: '/site-management/company',
    icon: 'business',
    label: t('siteManagement.tabs.company')
  }
])
</script>
