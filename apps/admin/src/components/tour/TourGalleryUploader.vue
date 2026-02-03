<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ $t('tour.gallery.title') }}
      </h3>
      <div class="flex items-center gap-2">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          :disabled="!tourId || uploading"
          @change="onFilesSelected"
        />
        <button
          type="button"
          class="btn-primary"
          :disabled="!tourId || uploading"
          @click="fileInput?.click()"
        >
          <span v-if="uploading" class="material-icons animate-spin mr-2">refresh</span>
          <span v-else class="material-icons mr-2">upload</span>
          {{ $t('tour.gallery.upload') }}
        </button>
      </div>
    </div>

    <div
      v-if="!tourId"
      class="p-4 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm"
    >
      {{ $t('tour.gallery.saveTourToUpload') }}
    </div>

    <div
      v-if="images.length === 0"
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-10 text-center text-gray-500 dark:text-gray-400"
    >
      <span class="material-icons text-5xl mb-3">photo_library</span>
      <p>{{ $t('tour.gallery.empty') }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="(img, idx) in images"
        :key="img._id || idx"
        class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="flex">
          <div
            class="w-40 h-28 bg-gray-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center"
          >
            <img v-if="img.url" :src="getFileUrl(img.url)" class="w-full h-full object-cover" />
            <span v-else class="material-icons text-gray-300 dark:text-gray-600">image</span>
          </div>
          <div class="flex-1 p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span
                v-if="img.isMain"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
              >
                <span class="material-icons text-xs mr-1">star</span>
                {{ $t('tour.gallery.main') }}
              </span>
              <div class="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
                  :disabled="idx === 0"
                  :title="$t('common.moveUp')"
                  @click="move(idx, -1)"
                >
                  <span class="material-icons text-base">arrow_upward</span>
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
                  :disabled="idx === images.length - 1"
                  :title="$t('common.moveDown')"
                  @click="move(idx, 1)"
                >
                  <span class="material-icons text-base">arrow_downward</span>
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-amber-600"
                  :title="$t('tour.gallery.setMain')"
                  @click="setMain(img)"
                >
                  <span class="material-icons text-base">star</span>
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-red-600"
                  :disabled="!tourId || deletingId === img._id"
                  :title="$t('common.delete')"
                  @click="remove(img)"
                >
                  <span class="material-icons text-base">delete</span>
                </button>
              </div>
            </div>

            <div>
              <label class="form-label">{{ $t('tour.gallery.caption') }}</label>
              <MultiLangInput v-model="img.caption" :languages="B2C_LANGUAGES" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="images.length" class="text-xs text-gray-500 dark:text-gray-400">
      {{ $t('tour.gallery.hint') }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import { B2C_LANGUAGES } from '@/constants/languages'
import { getFileUrl } from '@/utils/imageUrl'
import * as tourService from '@/services/tourService'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  tourId: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const fileInput = ref(null)
const uploading = ref(false)
const deletingId = ref('')

const images = computed({
  get: () => props.modelValue || [],
  set: val => emit('update:modelValue', val)
})

function normalizeOrders(list) {
  return list.map((i, idx) => ({ ...i, order: idx + 1 }))
}

function move(index, dir) {
  const next = [...images.value]
  const target = index + dir
  if (target < 0 || target >= next.length) return
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  images.value = normalizeOrders(next)
}

function setMain(img) {
  const next = images.value.map(i => ({ ...i, isMain: String(i._id) === String(img._id) }))
  images.value = normalizeOrders(next)
}

async function onFilesSelected(e) {
  const files = Array.from(e.target?.files || [])
  if (!files.length || !props.tourId) return

  uploading.value = true
  try {
    for (const file of files) {
      const resp = await tourService.uploadTourGalleryImage(props.tourId, file)
      const added = resp.data?.image
      if (added) {
        images.value = normalizeOrders([...images.value, added])
      } else if (resp.data?.tour?.gallery) {
        images.value = normalizeOrders(resp.data.tour.gallery)
      }
    }
  } finally {
    uploading.value = false
    if (e.target) e.target.value = ''
  }
}

async function remove(img) {
  if (!props.tourId || !img?._id) return
  deletingId.value = img._id
  try {
    const resp = await tourService.deleteTourGalleryImage(props.tourId, img._id)
    images.value = normalizeOrders(resp.data?.gallery || [])
  } finally {
    deletingId.value = ''
  }
}
</script>
