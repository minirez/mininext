<template>
  <div class="widget-steps">
    <template v-for="(step, index) in visibleSteps" :key="step.id">
      <!-- Connector -->
      <div
        v-if="index > 0"
        class="widget-step-connector"
        :class="{ 'is-completed': currentStep > step.id }"
      />

      <!-- Step -->
      <div
        class="widget-step"
        :class="{
          'is-active': currentStep === step.id,
          'is-completed': currentStep > step.id,
          'is-clickable': currentStep > step.id
        }"
        @click="goToStep(step.id)"
      >
        <div class="widget-step-dot">
          <WidgetIcon v-if="currentStep > step.id" name="check" :size="16" />
          <WidgetIcon v-else :name="step.icon" :size="16" />
        </div>
        <span class="widget-step-label">{{ $t(`widget.steps.${step.key}`) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import WidgetIcon from './WidgetIcon.vue'

const store = inject('widgetStore')
const router = useRouter()
const route = useRoute()

const steps = [
  { id: 1, key: 'search', icon: 'calendar' },
  { id: 2, key: 'rooms', icon: 'bed' },
  { id: 3, key: 'guests', icon: 'user' },
  { id: 4, key: 'payment', icon: 'credit-card' },
  { id: 5, key: 'confirmation', icon: 'check-circle' }
]

const currentStep = computed(() => route.meta?.step || store.currentStep)

// Don't show confirmation step in progress
const visibleSteps = computed(() => {
  if (currentStep.value === 5) {
    return steps
  }
  return steps.slice(0, 4)
})

function goToStep(stepId) {
  // Only allow going back, not forward
  if (stepId < currentStep.value) {
    const stepRoutes = {
      1: 'widget-search',
      2: 'widget-rooms',
      3: 'widget-guests',
      4: 'widget-payment'
    }
    const routeName = stepRoutes[stepId]
    if (routeName) {
      router.push({ name: routeName })
    }
  }
}
</script>

<style scoped>
.widget-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  gap: 0.25rem;
}

:deep(.dark) .widget-steps {
  background: #111827;
  border-bottom-color: #374151;
}

.widget-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.widget-step.is-clickable {
  cursor: pointer;
}

.widget-step-dot {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #9ca3af;
  transition: all 200ms ease;
}

.widget-step.is-active .widget-step-dot {
  background: var(--widget-primary, #7c3aed);
  color: white;
  box-shadow: 0 0 0 4px var(--widget-primary-100, #f3e8ff);
}

.widget-step.is-completed .widget-step-dot {
  background: #10b981;
  color: white;
}

.widget-step-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #9ca3af;
  display: none;
}

@media (min-width: 640px) {
  .widget-step-label {
    display: block;
  }
}

.widget-step.is-active .widget-step-label {
  color: var(--widget-primary, #7c3aed);
}

.widget-step.is-completed .widget-step-label {
  color: #10b981;
}

.widget-step-connector {
  width: 1.5rem;
  height: 2px;
  background: #e5e7eb;
  transition: background 200ms ease;
}

@media (min-width: 640px) {
  .widget-step-connector {
    width: 3rem;
  }
}

.widget-step-connector.is-completed {
  background: #10b981;
}
</style>
