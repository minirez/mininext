<template>
  <div class="widget-trigger">
    <button
      class="widget-trigger-button"
      @click="$emit('open')"
    >
      <WidgetIcon name="calendar" :size="20" />
      <span>{{ $t('widget.bookNow') }}</span>
    </button>
  </div>
</template>

<script setup>
import WidgetIcon from './WidgetIcon.vue'

defineEmits(['open'])
</script>

<style scoped>
.widget-trigger {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 1050;
}

.widget-trigger-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  background: var(--widget-primary, #7c3aed);
  color: white;
  border: none;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  transition: all 200ms ease;
}

.widget-trigger-button:hover {
  transform: scale(1.05);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.widget-trigger-button:active {
  transform: scale(0.98);
}
</style>
