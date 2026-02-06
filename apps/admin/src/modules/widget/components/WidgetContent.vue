<template>
  <div class="widget-content-wrapper">
    <!-- Header -->
    <WidgetHeader @close="handleClose" />

    <!-- Steps Indicator -->
    <WidgetSteps />

    <!-- Main Content Area -->
    <div class="widget-main">
      <!-- Content -->
      <div class="widget-content">
        <router-view v-slot="{ Component }">
          <Transition name="slide" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </div>

      <!-- Sidebar (Desktop) -->
      <WidgetSidebar v-if="showSidebar" class="widget-sidebar" />
    </div>

    <!-- Bottom Bar (Mobile) -->
    <WidgetBottomBar v-if="showBottomBar" />
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import WidgetHeader from './WidgetHeader.vue'
import WidgetSteps from './WidgetSteps.vue'
import WidgetSidebar from './WidgetSidebar.vue'
import WidgetBottomBar from './WidgetBottomBar.vue'

const props = defineProps({
  showHeader: {
    type: Boolean,
    default: true
  }
})

const store = inject('widgetStore')
const router = useRouter()
const route = useRoute()

// Show sidebar only on certain steps and desktop
const showSidebar = computed(() => {
  const step = route.meta?.step || 1
  return step >= 2 && step < 5
})

// Show bottom bar on mobile for steps 2-4
const showBottomBar = computed(() => {
  const step = route.meta?.step || 1
  return step >= 2 && step < 5
})

function handleClose() {
  store.closeWidget()
}
</script>

<style scoped>
.widget-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.widget-main {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.widget-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.widget-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: #f9fafb;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
  display: none;
}

@media (min-width: 1024px) {
  .widget-sidebar {
    display: block;
  }
}

:deep(.dark) .widget-sidebar {
  background: #1f2937;
  border-left-color: #374151;
}

/* View transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
