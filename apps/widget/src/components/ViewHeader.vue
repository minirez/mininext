<script setup>
import { useWidgetStore } from '../stores/widget'

defineProps({
  title: {
    type: String,
    default: ''
  },
  showBack: {
    type: Boolean,
    default: true
  }
})

const widgetStore = useWidgetStore()

function goBack() {
  widgetStore.goBack()
}
</script>

<template>
  <div class="view-header">
    <button v-if="showBack" class="back-btn" @click="goBack" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
    <h2 v-if="title" class="view-title">{{ title }}</h2>
    <slot></slot>
  </div>
</template>

<style scoped>
.view-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.back-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.back-btn:active {
  transform: scale(0.95);
}

.view-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
</style>
