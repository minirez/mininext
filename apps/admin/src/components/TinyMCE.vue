<template>
  <div>
    <div :id="editorId" class="min-h-[200px]"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getTinyMceConfig } from '@/tinymce/config'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  init: {
    type: Object,
    default: () => ({})
  },
  dark: { type: Boolean, default: null },
  height: { type: Number, default: 0 }
})

const isDarkMode = computed(() => {
  if (props.dark !== null) return props.dark
  if (typeof document !== 'undefined') {
    return (
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark')
    )
  }
  return false
})

const emit = defineEmits(['update:modelValue'])

const editorId = ref(`tinymce-editor-${Math.random().toString(36).substr(2, 9)}`)
let editorInstance = null
let pendingInterval = null

const loadTinyMceScript = () => {
  return new Promise((resolve, reject) => {
    if (window.tinymce) return resolve()
    // Check if script tag already exists
    if (document.querySelector('script[src*="tinymce"]')) {
      let attempts = 0
      const maxAttempts = 200 // 10 seconds at 50ms intervals
      pendingInterval = setInterval(() => {
        attempts++
        if (window.tinymce) {
          clearInterval(pendingInterval)
          pendingInterval = null
          resolve()
        } else if (attempts >= maxAttempts) {
          clearInterval(pendingInterval)
          pendingInterval = null
          reject(new Error('TinyMCE script load timeout'))
        }
      }, 50)
      return
    }
    const script = document.createElement('script')
    script.src = '/tinymce/tinymce.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('TinyMCE script failed to load'))
    document.head.appendChild(script)
  })
}

const initEditor = async () => {
  try {
    await loadTinyMceScript()
  } catch (err) {
    console.error('TinyMCE yüklenemedi:', err)
    return
  }

  if (editorInstance) {
    editorInstance.remove()
    editorInstance = null
  }

  const base = getTinyMceConfig({
    dark: isDarkMode.value,
    height: props.height || props.init.height || 300
  })

  window.tinymce.init({
    selector: `#${editorId.value}`,
    ...base,
    ...props.init,
    setup: editor => {
      editorInstance = editor

      editor.on('init', () => {
        editor.setContent(props.modelValue || '')
      })

      editor.on('change keyup', () => {
        if (editor.initialized && editor.getBody()) {
          try {
            const content = editor.getContent()
            emit('update:modelValue', content)
          } catch (error) {
            console.warn('TinyMCE not ready for getContent:', error)
          }
        }
      })

      if (props.init.setup) {
        props.init.setup(editor)
      }
    }
  })
}

watch(
  () => props.modelValue,
  newValue => {
    if (editorInstance && editorInstance.initialized && editorInstance.getBody()) {
      try {
        const currentContent = editorInstance.getContent()
        if (currentContent !== newValue) {
          editorInstance.setContent(newValue || '')
        }
      } catch (error) {
        console.warn('TinyMCE not ready yet, skipping content update:', error)
      }
    }
  }
)

watch(isDarkMode, () => {
  if (editorInstance) {
    const currentContent = editorInstance.getContent()
    nextTick(() => {
      initEditor()
      setTimeout(() => {
        if (editorInstance && editorInstance.initialized) {
          editorInstance.setContent(currentContent)
        }
      }, 200)
    })
  }
})

onMounted(() => {
  nextTick(() => {
    initEditor()
  })
})

onBeforeUnmount(() => {
  if (pendingInterval) {
    clearInterval(pendingInterval)
    pendingInterval = null
  }
  if (editorInstance) {
    editorInstance.remove()
    editorInstance = null
  }
})
</script>
