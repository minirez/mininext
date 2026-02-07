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

<!-- Styles in widget.css for Shadow DOM compatibility -->
