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
          <div
            class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"
          >
            <span class="material-icons text-purple-600">description</span>
          </div>
          <div>
            <h4 class="font-medium text-gray-800 dark:text-white">
              {{ getPageTitle(page, currentLang) || page.url }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400">/{{ page.url }}</p>
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
    <Modal
      v-model="showEditor"
      :title="editingPage ? $t('website.pages.editPage') : $t('website.pages.addPage')"
      size="xl"
    >
      <div class="space-y-4">
        <!-- Page URL -->
        <div>
          <label class="form-label">{{ $t('website.pages.url') }} *</label>
          <div class="flex items-center">
            <span
              class="px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-r-0 border-gray-300 dark:border-slate-600 rounded-l-lg text-gray-500 dark:text-slate-400"
            >
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
          <TinyMCE
            :key="`page-editor-${editorLang}`"
            :modelValue="getFormContent(editorLang)"
            :height="400"
            @update:modelValue="val => setFormContent(editorLang, val)"
          />
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import TinyMCE from '@/components/TinyMCE.vue'

const { locale } = useI18n()

const props = defineProps({
  storefront: Object,
  saving: Boolean
})

const emit = defineEmits(['save', 'update', 'delete'])

const showEditor = ref(false)
const showDeleteModal = ref(false)
const editingPage = ref(null)
const pageToDelete = ref(null)
const editorLang = ref('en')

const currentLang = computed(() => locale.value)

const pageForm = ref({
  url: '',
  title: [
    { lang: 'en', value: '' },
    { lang: 'tr', value: '' }
  ],
  content: [
    { lang: 'en', value: '' },
    { lang: 'tr', value: '' }
  ]
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

const openPageEditor = page => {
  editingPage.value = page
  if (page) {
    pageForm.value = {
      url: page.url,
      title: [
        ...(page.title || [
          { lang: 'en', value: '' },
          { lang: 'tr', value: '' }
        ])
      ],
      content: [
        ...(page.content || [
          { lang: 'en', value: '' },
          { lang: 'tr', value: '' }
        ])
      ]
    }
  } else {
    pageForm.value = {
      url: '',
      title: [
        { lang: 'en', value: '' },
        { lang: 'tr', value: '' }
      ],
      content: [
        { lang: 'en', value: '' },
        { lang: 'tr', value: '' }
      ]
    }
  }
  editorLang.value = 'en'
  showEditor.value = true
}

const savePage = () => {
  const data = {
    url: pageForm.value.url,
    title: pageForm.value.title,
    content: pageForm.value.content
  }
  if (editingPage.value) {
    emit('update', { originalUrl: editingPage.value.url, ...data })
  } else {
    emit('save', data)
  }
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
