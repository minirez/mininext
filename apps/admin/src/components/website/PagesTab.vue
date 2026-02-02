<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
          {{ $t('website.pages.title') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('website.pages.description') }}
        </p>
      </div>
      <button class="btn-primary" @click="openPageEditor(null)">
        <span class="material-icons text-sm mr-1">add</span>
        {{ $t('website.pages.addPage') }}
      </button>
    </div>

    <!-- Pages List -->
    <div v-if="pages.length > 0" class="space-y-3">
      <div
        v-for="page in pages"
        :key="page.url"
        class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600"
      >
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons text-purple-600">description</span>
          </div>
          <div>
            <h4 class="font-medium text-gray-800 dark:text-white">
              {{ getPageTitle(page, currentLang) || page.url }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              /{{ page.url }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="p-2 text-gray-400 hover:text-purple-600 transition-colors"
            :title="$t('common.edit')"
            @click="openPageEditor(page)"
          >
            <span class="material-icons">edit</span>
          </button>
          <button
            class="p-2 text-gray-400 hover:text-red-600 transition-colors"
            :title="$t('common.delete')"
            @click="confirmDeletePage(page)"
          >
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12 bg-gray-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600"
    >
      <span class="material-icons text-5xl text-gray-400 dark:text-slate-500">description</span>
      <h4 class="mt-4 text-lg font-medium text-gray-600 dark:text-slate-400">
        {{ $t('website.pages.empty') }}
      </h4>
      <p class="mt-1 text-gray-500 dark:text-slate-500">
        {{ $t('website.pages.emptyHint') }}
      </p>
      <button class="btn-primary mt-4" @click="openPageEditor(null)">
        <span class="material-icons text-sm mr-1">add</span>
        {{ $t('website.pages.addPage') }}
      </button>
    </div>

    <!-- Page Editor Modal -->
    <Modal v-model="showEditor" :title="editingPage ? $t('website.pages.editPage') : $t('website.pages.addPage')" size="xl">
      <div class="space-y-4">
        <!-- Page URL -->
        <div>
          <label class="form-label">{{ $t('website.pages.url') }} *</label>
          <div class="flex items-center">
            <span class="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-r-0 border-gray-300 dark:border-slate-600 rounded-l-lg text-gray-500 dark:text-slate-400">
              /
            </span>
            <input
              v-model="pageForm.url"
              type="text"
              class="form-input rounded-l-none"
              :placeholder="$t('website.pages.urlPlaceholder')"
              :disabled="!!editingPage"
            />
          </div>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('website.pages.urlHint') }}
          </p>
        </div>

        <!-- Language Tabs -->
        <div class="flex border-b border-gray-200 dark:border-slate-700">
          <button
            v-for="lang in ['en', 'tr']"
            :key="lang"
            class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
            :class="
              editorLang === lang
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="editorLang = lang"
          >
            {{ lang.toUpperCase() }}
          </button>
        </div>

        <!-- Title -->
        <div>
          <label class="form-label">{{ $t('website.pages.pageTitle') }}</label>
          <input
            :value="getFormTitle(editorLang)"
            type="text"
            class="form-input"
            :placeholder="$t('website.pages.pageTitlePlaceholder')"
            @input="setFormTitle(editorLang, $event.target.value)"
          />
        </div>

        <!-- Content -->
        <div>
          <label class="form-label">{{ $t('website.pages.content') }}</label>
          <div class="border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <!-- Simple WYSIWYG Toolbar -->
            <div class="flex items-center gap-1 p-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-300 dark:border-slate-600">
              <button
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                @click="formatText('bold')"
              >
                <span class="material-icons text-lg">format_bold</span>
              </button>
              <button
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                @click="formatText('italic')"
              >
                <span class="material-icons text-lg">format_italic</span>
              </button>
              <button
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                @click="formatText('underline')"
              >
                <span class="material-icons text-lg">format_underlined</span>
              </button>
              <div class="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>
              <button
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                @click="formatText('insertUnorderedList')"
              >
                <span class="material-icons text-lg">format_list_bulleted</span>
              </button>
              <button
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                @click="formatText('insertOrderedList')"
              >
                <span class="material-icons text-lg">format_list_numbered</span>
              </button>
              <div class="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>
              <button
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                @click="insertLink"
              >
                <span class="material-icons text-lg">link</span>
              </button>
              <button
                class="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
                @click="insertImage"
              >
                <span class="material-icons text-lg">image</span>
              </button>
            </div>
            <div
              ref="contentEditor"
              contenteditable="true"
              class="min-h-[300px] p-4 focus:outline-none prose dark:prose-invert max-w-none"
              @input="handleContentInput"
              v-html="getFormContent(editorLang)"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-secondary" @click="showEditor = false">
          {{ $t('common.cancel') }}
        </button>
        <button class="btn-primary" :disabled="!pageForm.url || saving" @click="savePage">
          {{ saving ? $t('common.loading') : $t('common.save') }}
        </button>
      </template>
    </Modal>

    <!-- URL Prompt Modal (replaces window.prompt) -->
    <Modal v-model="showUrlPrompt" :title="urlPromptTitle" size="sm">
      <div class="space-y-2">
        <label class="form-label">{{ urlPromptLabel }}</label>
        <input
          ref="urlPromptInputRef"
          v-model="urlPromptValue"
          type="url"
          class="form-input w-full"
          :placeholder="urlPromptPlaceholder"
          @keyup.enter="confirmUrlPrompt"
        />
      </div>

      <template #footer>
        <button class="btn-secondary" @click="closeUrlPrompt">
          {{ $t('common.cancel') }}
        </button>
        <button class="btn-primary" :disabled="!urlPromptValue.trim()" @click="confirmUrlPrompt">
          {{ $t('common.add') }}
        </button>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('website.pages.deletePage')" size="sm">
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('website.pages.deleteConfirm') }}
      </p>

      <template #footer>
        <button class="btn-secondary" @click="showDeleteModal = false">
          {{ $t('common.no') }}
        </button>
        <button class="btn-danger" :disabled="saving" @click="deletePage">
          {{ $t('common.yes') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'

const { t, locale } = useI18n()

const props = defineProps({
  storefront: Object,
  saving: Boolean
})

const emit = defineEmits(['save', 'delete'])

const showEditor = ref(false)
const showDeleteModal = ref(false)
const editingPage = ref(null)
const pageToDelete = ref(null)
const editorLang = ref('en')
const contentEditor = ref(null)

// URL prompt (for insert link/image)
const showUrlPrompt = ref(false)
const urlPromptTitle = ref('')
const urlPromptLabel = ref('')
const urlPromptPlaceholder = ref('')
const urlPromptValue = ref('')
const urlPromptInputRef = ref(null)
let urlPromptAction = null

const currentLang = computed(() => locale.value)

const pageForm = ref({
  url: '',
  title: [{ lang: 'en', value: '' }, { lang: 'tr', value: '' }],
  content: [{ lang: 'en', value: '' }, { lang: 'tr', value: '' }]
})

const pages = computed(() => props.storefront?.pages || [])

const getPageTitle = (page, lang) => {
  return page.title?.find(t => t.lang === lang)?.value || ''
}

const getFormTitle = lang => {
  return pageForm.value.title?.find(t => t.lang === lang)?.value || ''
}

const setFormTitle = (lang, value) => {
  const title = [...pageForm.value.title]
  const idx = title.findIndex(t => t.lang === lang)
  if (idx >= 0) {
    title[idx] = { lang, value }
  } else {
    title.push({ lang, value })
  }
  pageForm.value.title = title
}

const getFormContent = lang => {
  return pageForm.value.content?.find(c => c.lang === lang)?.value || ''
}

const setFormContent = (lang, value) => {
  const content = [...pageForm.value.content]
  const idx = content.findIndex(c => c.lang === lang)
  if (idx >= 0) {
    content[idx] = { lang, value }
  } else {
    content.push({ lang, value })
  }
  pageForm.value.content = content
}

const handleContentInput = event => {
  setFormContent(editorLang.value, event.target.innerHTML)
}

const openPageEditor = page => {
  editingPage.value = page
  if (page) {
    pageForm.value = {
      url: page.url,
      title: [...(page.title || [{ lang: 'en', value: '' }, { lang: 'tr', value: '' }])],
      content: [...(page.content || [{ lang: 'en', value: '' }, { lang: 'tr', value: '' }])]
    }
  } else {
    pageForm.value = {
      url: '',
      title: [{ lang: 'en', value: '' }, { lang: 'tr', value: '' }],
      content: [{ lang: 'en', value: '' }, { lang: 'tr', value: '' }]
    }
  }
  editorLang.value = 'en'
  showEditor.value = true
}

// Update content editor when switching languages
watch(editorLang, async () => {
  await nextTick()
  if (contentEditor.value) {
    contentEditor.value.innerHTML = getFormContent(editorLang.value)
  }
})

const formatText = command => {
  document.execCommand(command, false, null)
  contentEditor.value?.focus()
}

const openUrlPrompt = async ({ title, label, placeholder }, action) => {
  urlPromptTitle.value = title
  urlPromptLabel.value = label
  urlPromptPlaceholder.value = placeholder
  urlPromptValue.value = ''
  urlPromptAction = action
  showUrlPrompt.value = true
  await nextTick()
  urlPromptInputRef.value?.focus?.()
}

const closeUrlPrompt = () => {
  showUrlPrompt.value = false
  urlPromptValue.value = ''
  urlPromptAction = null
}

const confirmUrlPrompt = () => {
  const url = urlPromptValue.value.trim()
  if (!url) return
  urlPromptAction?.(url)
  closeUrlPrompt()
}

const insertLink = async () => {
  await openUrlPrompt(
    {
      title: t('website.pages.enterUrl'),
      label: t('website.pages.enterUrl'),
      placeholder: 'https://...'
    },
    (url) => {
      document.execCommand('createLink', false, url)
      contentEditor.value?.focus()
    }
  )
}

const insertImage = async () => {
  await openUrlPrompt(
    {
      title: t('website.pages.enterImageUrl'),
      label: t('website.pages.enterImageUrl'),
      placeholder: 'https://...'
    },
    (url) => {
      document.execCommand('insertImage', false, url)
      contentEditor.value?.focus()
    }
  )
}

const savePage = () => {
  emit('save', {
    url: pageForm.value.url,
    title: pageForm.value.title,
    content: pageForm.value.content
  })
  showEditor.value = false
}

const confirmDeletePage = page => {
  pageToDelete.value = page
  showDeleteModal.value = true
}

const deletePage = () => {
  if (pageToDelete.value) {
    emit('delete', pageToDelete.value.url)
    showDeleteModal.value = false
  }
}
</script>
