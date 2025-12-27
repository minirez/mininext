<template>
  <div>
    <!-- Header with label and translate button -->
    <div class="flex items-center justify-between mb-2">
      <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-slate-300">{{ label }}</label>
      <button
        v-if="showTranslate && languages.length > 1"
        type="button"
        @click="handleTranslate"
        :disabled="translating || !modelValue[selectedLang]"
        class="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 disabled:opacity-50"
      >
        <span v-if="translating" class="material-icons text-sm animate-spin">sync</span>
        <span v-else class="material-icons text-sm">translate</span>
        {{ translating ? $t('common.translating') : $t('common.translateAll') }}
      </button>
    </div>

    <!-- Language tabs -->
    <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
      <div class="flex border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 overflow-x-auto">
        <button
          v-for="lang in visibleLanguages"
          :key="lang"
          type="button"
          @click="selectedLang = lang"
          :title="getLanguageName(lang)"
          class="relative px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors"
          :class="[
            selectedLang === lang
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
              : modelValue[lang] && modelValue[lang].trim()
                ? 'text-green-600 dark:text-green-400 font-semibold'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
          ]"
        >
          <span v-if="modelValue[lang] && modelValue[lang].trim() && selectedLang !== lang"
                class="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></span>
          {{ lang.toUpperCase() }}
        </button>
        <button
          v-if="!showAllLanguages && languages.length > 5"
          type="button"
          @click="showAllLanguages = true"
          class="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-500"
        >
          +{{ languages.length - 5 }}
        </button>
      </div>

      <!-- Toolbar -->
      <div v-if="editor" class="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/30">
        <!-- Text formatting -->
        <button
          type="button"
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'bg-purple-100 dark:bg-purple-900/30 text-purple-600': editor.isActive('bold') }"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="Bold"
        >
          <span class="material-icons text-lg">format_bold</span>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'bg-purple-100 dark:bg-purple-900/30 text-purple-600': editor.isActive('italic') }"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="Italic"
        >
          <span class="material-icons text-lg">format_italic</span>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleUnderline().run()"
          :class="{ 'bg-purple-100 dark:bg-purple-900/30 text-purple-600': editor.isActive('underline') }"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="Underline"
        >
          <span class="material-icons text-lg">format_underlined</span>
        </button>

        <div class="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>

        <!-- Headings -->
        <button
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'bg-purple-100 dark:bg-purple-900/30 text-purple-600': editor.isActive('heading', { level: 2 }) }"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'bg-purple-100 dark:bg-purple-900/30 text-purple-600': editor.isActive('heading', { level: 3 }) }"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
          title="Heading 3"
        >
          H3
        </button>

        <div class="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>

        <!-- Lists -->
        <button
          type="button"
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'bg-purple-100 dark:bg-purple-900/30 text-purple-600': editor.isActive('bulletList') }"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="Bullet List"
        >
          <span class="material-icons text-lg">format_list_bulleted</span>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'bg-purple-100 dark:bg-purple-900/30 text-purple-600': editor.isActive('orderedList') }"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="Numbered List"
        >
          <span class="material-icons text-lg">format_list_numbered</span>
        </button>

        <div class="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>

        <!-- Link -->
        <button
          type="button"
          @click="setLink"
          :class="{ 'bg-purple-100 dark:bg-purple-900/30 text-purple-600': editor.isActive('link') }"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="Add Link"
        >
          <span class="material-icons text-lg">link</span>
        </button>
        <button
          v-if="editor.isActive('link')"
          type="button"
          @click="editor.chain().focus().unsetLink().run()"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-red-500"
          title="Remove Link"
        >
          <span class="material-icons text-lg">link_off</span>
        </button>

        <div class="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>

        <!-- Undo/Redo -->
        <button
          type="button"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-30"
          title="Undo"
        >
          <span class="material-icons text-lg">undo</span>
        </button>
        <button
          type="button"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-30"
          title="Redo"
        >
          <span class="material-icons text-lg">redo</span>
        </button>
      </div>

      <!-- Editor area -->
      <div class="p-3">
        <editor-content
          :editor="editor"
          class="prose prose-sm dark:prose-invert max-w-none min-h-[150px] focus:outline-none"
        />
      </div>
    </div>

    <!-- Helper text -->
    <p v-if="help" class="mt-1 text-xs text-gray-500 dark:text-slate-400">{{ help }}</p>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import translationService from '@/services/translationService'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  languages: {
    type: Array,
    default: () => ['tr', 'en']
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  help: {
    type: String,
    default: ''
  },
  showTranslate: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const toast = useToast()
const { t } = useI18n()

const selectedLang = ref(props.languages[0] || 'tr')
const translating = ref(false)
const showAllLanguages = ref(false)

// Preferred language order
const preferredOrder = ['tr', 'en', 'de', 'ru', 'es']

const sortedLanguages = computed(() => {
  const sorted = [...props.languages].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a)
    const bIndex = preferredOrder.indexOf(b)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })
  return sorted
})

const visibleLanguages = computed(() => {
  if (showAllLanguages.value || sortedLanguages.value.length <= 5) {
    return sortedLanguages.value
  }
  return sortedLanguages.value.slice(0, 5)
})

const availableLanguages = [
  { code: 'tr', name: 'Turkce', flag: '' },
  { code: 'en', name: 'English', flag: '' },
  { code: 'de', name: 'Deutsch', flag: '' },
  { code: 'ru', name: 'Russian', flag: '' },
  { code: 'es', name: 'Espanol', flag: '' },
  { code: 'el', name: 'Greek', flag: '' },
  { code: 'it', name: 'Italiano', flag: '' },
  { code: 'fr', name: 'Francais', flag: '' },
  { code: 'ro', name: 'Romana', flag: '' },
  { code: 'bg', name: 'Bulgarian', flag: '' },
  { code: 'pt', name: 'Portugues', flag: '' },
  { code: 'da', name: 'Dansk', flag: '' },
  { code: 'zh', name: 'Chinese', flag: '' },
  { code: 'ar', name: 'Arabic', flag: '' },
  { code: 'fa', name: 'Persian', flag: '' },
  { code: 'he', name: 'Hebrew', flag: '' },
  { code: 'sq', name: 'Albanian', flag: '' },
  { code: 'uk', name: 'Ukrainian', flag: '' },
  { code: 'pl', name: 'Polski', flag: '' },
  { code: 'az', name: 'Azerbaijani', flag: '' }
]

const getLanguageName = (code) => {
  const translatedName = t(`common.languages.${code}`)
  if (translatedName && !translatedName.includes('common.languages.')) {
    return translatedName
  }
  return availableLanguages.find(l => l.code === code)?.name || code.toUpperCase()
}

// TipTap Editor
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [2, 3]
      }
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-purple-600 hover:text-purple-800 underline'
      }
    })
  ],
  content: props.modelValue[selectedLang.value] || '',
  editorProps: {
    attributes: {
      class: 'outline-none min-h-[120px] text-gray-800 dark:text-slate-200'
    }
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    const newValue = { ...props.modelValue }
    // Store empty string if content is just empty paragraph
    newValue[selectedLang.value] = html === '<p></p>' ? '' : html
    emit('update:modelValue', newValue)
  }
})

// Watch language change
watch(selectedLang, (newLang) => {
  if (editor.value) {
    const content = props.modelValue[newLang] || ''
    editor.value.commands.setContent(content)
  }
})

// Watch modelValue changes from outside
watch(() => props.modelValue, (newValue) => {
  if (editor.value) {
    const currentContent = editor.value.getHTML()
    const newContent = newValue[selectedLang.value] || ''
    // Only update if content is different (avoid cursor jump)
    if (currentContent !== newContent && newContent !== '<p></p>') {
      editor.value.commands.setContent(newContent)
    }
  }
}, { deep: true })

// Watch languages prop
watch(() => props.languages, (newLangs) => {
  if (!newLangs.includes(selectedLang.value)) {
    selectedLang.value = newLangs[0] || 'tr'
  }
}, { immediate: true })

// Set link
const setLink = () => {
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL:', previousUrl)

  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// Translate
const handleTranslate = async () => {
  const sourceText = props.modelValue[selectedLang.value]

  if (!sourceText || !sourceText.trim()) {
    toast.warning(t('siteSettings.general.noContentToTranslate'))
    return
  }

  translating.value = true
  try {
    const response = await translationService.batchTranslate(
      props.modelValue,
      selectedLang.value,
      props.languages
    )

    if (response.success) {
      emit('update:modelValue', { ...props.modelValue, ...response.data })
      toast.success(t('siteSettings.general.translationSuccess'))
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('siteSettings.general.translationFailed'))
  } finally {
    translating.value = false
  }
}

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style>
/* TipTap Editor Styles */
.ProseMirror {
  outline: none;
}

.ProseMirror p {
  margin: 0.5em 0;
}

.ProseMirror h2 {
  font-size: 1.25em;
  font-weight: 600;
  margin: 0.75em 0 0.5em;
}

.ProseMirror h3 {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0.75em 0 0.5em;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.ProseMirror li {
  margin: 0.25em 0;
}

.ProseMirror a {
  color: #7c3aed;
  text-decoration: underline;
}

.ProseMirror a:hover {
  color: #5b21b6;
}

/* Dark mode */
.dark .ProseMirror {
  color: #e2e8f0;
}

.dark .ProseMirror a {
  color: #a78bfa;
}

.dark .ProseMirror a:hover {
  color: #c4b5fd;
}

/* Placeholder */
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}
</style>
