<template>
  <Modal
    v-model="isOpen"
    :title="$t('profile.cropAvatar')"
    size="lg"
    @close="handleClose"
  >
    <div class="space-y-4">
      <!-- Cropper Container -->
      <div class="cropper-wrapper relative bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
        <img
          v-show="imageSrc"
          ref="imageRef"
          :src="imageSrc"
          alt="Crop preview"
        />
      </div>

      <!-- Zoom Controls -->
      <div class="flex items-center justify-center gap-4">
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('profile.zoomOut')"
          @click="zoomOut"
        >
          <span class="material-icons">remove</span>
        </button>

        <div class="flex items-center gap-2 flex-1 max-w-xs">
          <span class="material-icons text-gray-400">photo_size_select_small</span>
          <input
            v-model="zoomLevel"
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            class="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
            @input="handleZoomSlider"
          />
          <span class="material-icons text-gray-400">photo_size_select_large</span>
        </div>

        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('profile.zoomIn')"
          @click="zoomIn"
        >
          <span class="material-icons">add</span>
        </button>
      </div>

      <!-- Move Controls -->
      <div class="flex items-center justify-center gap-2">
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('profile.moveLeft')"
          @click="moveImage(-10, 0)"
        >
          <span class="material-icons">arrow_back</span>
        </button>
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('profile.moveUp')"
          @click="moveImage(0, -10)"
        >
          <span class="material-icons">arrow_upward</span>
        </button>
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('profile.moveDown')"
          @click="moveImage(0, 10)"
        >
          <span class="material-icons">arrow_downward</span>
        </button>
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('profile.moveRight')"
          @click="moveImage(10, 0)"
        >
          <span class="material-icons">arrow_forward</span>
        </button>
        <div class="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-2"></div>
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('profile.rotateLeft')"
          @click="rotateImage(-90)"
        >
          <span class="material-icons">rotate_left</span>
        </button>
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('profile.rotateRight')"
          @click="rotateImage(90)"
        >
          <span class="material-icons">rotate_right</span>
        </button>
        <button
          type="button"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          :title="$t('profile.reset')"
          @click="resetImage"
        >
          <span class="material-icons">restart_alt</span>
        </button>
      </div>

      <!-- Info -->
      <p class="text-sm text-gray-500 dark:text-slate-400 text-center">
        {{ $t('profile.cropInfo') }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button type="button" class="btn-secondary" @click="handleClose">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          :disabled="saving"
          class="btn-primary flex items-center gap-2"
          @click="handleSave"
        >
          <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
          <span v-else class="material-icons">check</span>
          {{ $t('common.save') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Cropper from 'cropperjs'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  file: {
    type: [File, Object],
    default: null
  },
  aspectRatio: {
    type: Number,
    default: 1
  },
  outputWidth: {
    type: Number,
    default: 300
  },
  outputHeight: {
    type: Number,
    default: 300
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'close'])

const isOpen = ref(props.modelValue)
const imageRef = ref(null)
const imageSrc = ref('')
const zoomLevel = ref(1)
const saving = ref(false)
const cropperReady = ref(false)

// Store cropper instance - use shallowRef for non-reactive object
let cropperInstance = null

// Watch modelValue changes
watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val && props.file) {
    loadImage()
  }
})

// Watch isOpen to emit
watch(isOpen, (val) => {
  emit('update:modelValue', val)
})

// Watch file changes
watch(() => props.file, (file) => {
  if (file && isOpen.value) {
    loadImage()
  }
})

// Load image from file
const loadImage = () => {
  if (!props.file) return

  // Destroy existing cropper
  destroyCropper()

  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target.result
    // Wait for DOM update then init cropper
    nextTick(() => {
      setTimeout(() => {
        initCropper()
      }, 100)
    })
  }
  reader.readAsDataURL(props.file)
}

// Destroy cropper instance
const destroyCropper = () => {
  cropperReady.value = false
  if (cropperInstance) {
    cropperInstance.destroy()
    cropperInstance = null
  }
}

// Initialize cropper
const initCropper = () => {
  destroyCropper()

  if (!imageRef.value) return

  cropperInstance = new Cropper(imageRef.value, {
    aspectRatio: props.aspectRatio,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 1,
    restore: false,
    guides: true,
    center: true,
    highlight: true,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    background: true,
    responsive: true,
    checkOrientation: true,
    minContainerWidth: 400,
    minContainerHeight: 400,
    ready() {
      cropperReady.value = true
      zoomLevel.value = 1
    },
    zoom(event) {
      if (event.detail && typeof event.detail.ratio === 'number') {
        zoomLevel.value = Math.min(3, Math.max(0.1, event.detail.ratio))
      }
    }
  })
}

// Zoom functions
const zoomIn = () => {
  if (!cropperInstance || !cropperReady.value) return
  cropperInstance.zoom(0.1)
}

const zoomOut = () => {
  if (!cropperInstance || !cropperReady.value) return
  cropperInstance.zoom(-0.1)
}

const handleZoomSlider = () => {
  if (!cropperInstance || !cropperReady.value) return
  cropperInstance.zoomTo(parseFloat(zoomLevel.value))
}

// Move function
const moveImage = (x, y) => {
  if (!cropperInstance || !cropperReady.value) return
  cropperInstance.move(x, y)
}

// Rotate function
const rotateImage = (degree) => {
  if (!cropperInstance || !cropperReady.value) return
  cropperInstance.rotate(degree)
}

// Reset
const resetImage = () => {
  if (!cropperInstance || !cropperReady.value) return
  cropperInstance.reset()
  zoomLevel.value = 1
}

// Save cropped image
const handleSave = async () => {
  if (!cropperInstance || !cropperReady.value) {
    console.error('Cropper instance not found or not ready')
    return
  }

  saving.value = true

  try {
    // Get cropped canvas
    const canvas = cropperInstance.getCroppedCanvas({
      width: props.outputWidth,
      height: props.outputHeight,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    })

    if (!canvas) {
      throw new Error('Could not get cropped canvas')
    }

    // Convert to blob
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b)
          else reject(new Error('Could not create blob'))
        },
        'image/png',
        0.9
      )
    })

    // Create file from blob
    const croppedFile = new File([blob], props.file?.name || 'avatar.png', {
      type: 'image/png'
    })

    emit('save', croppedFile)
    handleClose()
  } catch (error) {
    console.error('Error cropping image:', error)
  } finally {
    saving.value = false
  }
}

// Close modal
const handleClose = () => {
  destroyCropper()
  imageSrc.value = ''
  zoomLevel.value = 1
  isOpen.value = false
  emit('close')
}

// Cleanup
onBeforeUnmount(() => {
  destroyCropper()
})
</script>

<style>
@import 'cropperjs/dist/cropper.css';

/* Cropper wrapper - fixed height for consistent display */
.cropper-wrapper {
  width: 100%;
  height: 450px;
  min-height: 450px;
}

.cropper-wrapper img {
  display: block;
  max-width: 100%;
  width: 100%;
}

/* Custom cropper styles for circular avatar */
.cropper-view-box,
.cropper-face {
  border-radius: 50%;
}

.cropper-view-box {
  box-shadow: 0 0 0 1px #39f;
  outline: 0;
}

.cropper-face {
  background-color: inherit !important;
}

.cropper-dashed,
.cropper-point.point-se,
.cropper-point.point-sw,
.cropper-point.point-nw,
.cropper-point.point-ne,
.cropper-line {
  display: none !important;
}

.cropper-center::before,
.cropper-center::after {
  display: none;
}

/* Make sure cropper container fills the wrapper */
.cropper-container {
  width: 100% !important;
  height: 100% !important;
}

/* Zoom slider styling */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #7c3aed;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #7c3aed;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
