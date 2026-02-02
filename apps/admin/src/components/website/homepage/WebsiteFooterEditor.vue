<template>
  <div class="h-full overflow-y-auto pr-2 space-y-6">
    <div
      class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
    >
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-500">view_column</span>
          {{ $t('website.footer.columns') || 'Footer Columns' }}
        </h4>
        <button
          class="btn-secondary text-sm"
          :disabled="footer.items.length >= 3"
          @click="addFooterColumn"
        >
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.footer.addColumn') }}
        </button>
      </div>

      <!-- Footer Columns -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TransitionGroup name="list">
          <div
            v-for="(column, colIndex) in footer.items"
            :key="`col-${colIndex}`"
            class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-slate-600"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1">
                <LanguageInput
                  v-model="column.title"
                  size="sm"
                  :placeholder="$t('website.footer.columnTitle')"
                />
              </div>
              <button
                class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                @click="removeFooterColumn(colIndex)"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>

            <!-- Footer Links -->
            <div class="space-y-2">
              <div
                v-for="(link, linkIndex) in column.subItems"
                :key="`link-${colIndex}-${linkIndex}`"
                class="flex items-center gap-2"
              >
                <div class="flex-1">
                  <LanguageInput
                    v-model="link.title"
                    size="sm"
                    :placeholder="$t('website.footer.linkTitle')"
                  />
                </div>
                <input
                  v-model="link.link"
                  type="text"
                  class="form-input text-sm flex-1"
                  :placeholder="$t('website.footer.linkUrl')"
                />
                <button
                  class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  @click="removeFooterLink(colIndex, linkIndex)"
                >
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
            </div>

            <button
              class="text-xs text-purple-600 hover:text-purple-700 flex items-center"
              :disabled="column.subItems.length >= 8"
              @click="addFooterLink(colIndex)"
            >
              <span class="material-icons text-xs mr-0.5">add</span>
              {{ $t('website.footer.addLink') }}
            </button>
          </div>
        </TransitionGroup>
      </div>

      <div v-if="!footer.items?.length" class="text-center py-8 text-gray-400 dark:text-slate-500">
        <span class="material-icons text-3xl mb-2">view_column</span>
        <p class="text-sm">{{ $t('website.footer.noColumns') || 'No footer columns yet' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LanguageInput from '@/components/common/LanguageInput.vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  saving: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

// Same reasoning as header: keep mutation behavior identical.
const footer = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const ensureFooter = () => {
  if (!footer.value.items) footer.value.items = []
}

const addFooterColumn = () => {
  ensureFooter()
  if (footer.value.items.length >= 3) return
  footer.value.items.push({
    id: `footer-${Date.now()}`,
    title: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    link: '',
    subItems: []
  })
}

const removeFooterColumn = index => {
  footer.value.items.splice(index, 1)
}

const addFooterLink = colIndex => {
  const col = footer.value.items[colIndex]
  if (!col.subItems) col.subItems = []
  if (col.subItems.length >= 8) return
  col.subItems.push({
    id: `link-${Date.now()}`,
    title: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    link: ''
  })
}

const removeFooterLink = (colIndex, linkIndex) => {
  footer.value.items[colIndex].subItems.splice(linkIndex, 1)
}
</script>
