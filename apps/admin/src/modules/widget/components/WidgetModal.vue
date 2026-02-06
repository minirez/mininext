<template>
  <!-- No Teleport/Transition - required for Shadow DOM compatibility -->
  <div
    v-if="isOpen"
    class="widget-modal-backdrop"
  >
    <div
      class="widget-modal-container"
      :class="{ 'is-mobile': isMobile }"
    >
      <div class="widget-modal-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

// Detect mobile
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    emit('close')
  }
}

// Handle escape key
function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

// Lock body scroll when modal is open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style>
/* Not scoped - required for Teleport to work properly */
.widget-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.widget-modal-container {
  width: 100%;
  max-width: 1100px;
  max-height: calc(100vh - 2rem);
  display: flex;
}

.widget-modal-container.is-mobile {
  max-width: 100%;
  max-height: 100vh;
  height: 100vh;
  padding: 0;
}

.widget-modal-content {
  width: 100%;
  height: 100%;
  max-height: calc(100vh - 2rem);
  background: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.is-mobile .widget-modal-content {
  border-radius: 0;
  max-height: 100vh;
  height: 100vh;
}

:deep(.dark) .widget-modal-content {
  background: #1f2937;
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .widget-modal-backdrop {
    padding: 0;
    align-items: flex-start;
  }

  .widget-modal-container {
    height: 100vh;
    max-height: 100vh;
  }
}
</style>
