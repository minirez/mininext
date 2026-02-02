<template>
  <div class="space-y-4">
    <!-- Section Title & Description -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="form-label">{{ $t('website.sections.sectionTitle') }}</label>
        <LanguageInput v-model="localData.title" />
      </div>
      <div>
        <label class="form-label">{{ $t('website.sections.sectionDescription') }}</label>
        <LanguageInput v-model="localData.description" />
      </div>
    </div>

    <!-- Testimonials Section -->
    <template v-if="sectionType === 'testimonials'">
      <div class="flex items-center justify-between">
        <label class="form-label">{{ $t('website.sections.testimonialItems') }}</label>
        <button class="btn-outline text-sm" @click="addTestimonial">
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.sections.addTestimonial') }}
        </button>
      </div>
      <div class="space-y-3">
        <div
          v-for="(item, index) in localData.items || []"
          :key="index"
          class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
        >
          <div class="grid grid-cols-2 gap-3 mb-3">
            <input
              v-model="item.name"
              type="text"
              class="form-input text-sm"
              :placeholder="$t('website.sections.testimonialName')"
            />
            <input
              v-model="item.role"
              type="text"
              class="form-input text-sm"
              :placeholder="$t('website.sections.testimonialRole')"
            />
          </div>
          <div class="mb-3">
            <LanguageInput v-model="item.quote" type="textarea" size="sm" />
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <span class="text-sm text-gray-500">{{ $t('website.sections.rating') }}:</span>
              <button
                v-for="star in 5"
                :key="star"
                class="text-yellow-400"
                @click="item.rating = star"
              >
                <span class="material-icons text-sm">
                  {{ star <= (item.rating || 5) ? 'star' : 'star_border' }}
                </span>
              </button>
            </div>
            <button class="text-red-500 hover:text-red-700 text-sm" @click="removeTestimonial(index)">
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Counter Section -->
    <template v-else-if="sectionType === 'counter'">
      <div class="flex items-center justify-between">
        <label class="form-label">{{ $t('website.sections.counterItems') }}</label>
        <button class="btn-outline text-sm" @click="addCounter">
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.sections.addCounter') }}
        </button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          v-for="(item, index) in localData.items || []"
          :key="index"
          class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-center"
        >
          <input
            v-model.number="item.value"
            type="number"
            class="form-input text-sm text-center mb-2"
            :placeholder="$t('website.sections.counterValue')"
          />
          <LanguageInput v-model="item.label" size="sm" />
          <button class="text-red-500 hover:text-red-700 text-sm mt-2" @click="removeCounter(index)">
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </template>

    <!-- Call to Actions Section -->
    <template v-else-if="sectionType === 'call-to-actions'">
      <div class="flex items-center justify-between">
        <label class="form-label">{{ $t('website.sections.ctaItems') }}</label>
        <button class="btn-outline text-sm" @click="addCta">
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.sections.addCta') }}
        </button>
      </div>
      <div class="space-y-3">
        <div
          v-for="(item, index) in localData.items || []"
          :key="index"
          class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
        >
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label class="form-label text-xs">{{ $t('website.sections.ctaTitle') }}</label>
              <LanguageInput v-model="item.title" size="sm" />
            </div>
            <div>
              <label class="form-label text-xs">{{ $t('website.sections.ctaButtonText') }}</label>
              <LanguageInput v-model="item.buttonText" size="sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label text-xs">{{ $t('website.sections.ctaLink') }}</label>
              <input v-model="item.link" type="text" class="form-input text-sm" placeholder="https://" />
            </div>
            <div class="flex items-end">
              <button class="text-red-500 hover:text-red-700 text-sm" @click="removeCta(index)">
                <span class="material-icons text-sm mr-1">delete</span>
                {{ $t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- App Banner Section -->
    <template v-else-if="sectionType === 'app-banner'">
      <div class="space-y-4">
        <div>
          <label class="form-label">{{ $t('website.sections.appStoreUrl') }}</label>
          <input v-model="localData.appStoreUrl" type="text" class="form-input" placeholder="https://apps.apple.com/..." />
        </div>
        <div>
          <label class="form-label">{{ $t('website.sections.playStoreUrl') }}</label>
          <input v-model="localData.playStoreUrl" type="text" class="form-input" placeholder="https://play.google.com/..." />
        </div>
        <div>
          <label class="form-label">{{ $t('website.sections.appBannerText') }}</label>
          <LanguageInput v-model="localData.bannerText" type="textarea" />
        </div>
      </div>
    </template>

    <!-- Why Choose Us Section -->
    <template v-else-if="sectionType === 'why-choose-us'">
      <div class="flex items-center justify-between">
        <label class="form-label">{{ $t('website.sections.features') }}</label>
        <button class="btn-outline text-sm" @click="addFeature">
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.sections.addFeature') }}
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="(item, index) in localData.items || []"
          :key="index"
          class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
        >
          <div class="flex items-start gap-3">
            <input
              v-model="item.icon"
              type="text"
              class="form-input text-sm w-24"
              placeholder="Icon"
            />
            <div class="flex-1">
              <LanguageInput v-model="item.title" size="sm" class="mb-2" />
              <LanguageInput v-model="item.description" type="textarea" size="sm" />
            </div>
            <button class="text-red-500 hover:text-red-700" @click="removeFeature(index)">
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Blog Section -->
    <template v-else-if="sectionType === 'blog'">
      <div class="space-y-4">
        <div>
          <label class="form-label">{{ $t('website.sections.blogUrl') }}</label>
          <input v-model="localData.blogUrl" type="text" class="form-input" placeholder="https://blog.example.com" />
        </div>
        <div>
          <label class="form-label">{{ $t('website.sections.postCount') }}</label>
          <input v-model.number="localData.postCount" type="number" class="form-input w-24" min="1" max="10" />
        </div>
      </div>
    </template>

    <!-- Block Guide Section -->
    <template v-else-if="sectionType === 'block-guide'">
      <div class="flex items-center justify-between">
        <label class="form-label">{{ $t('website.sections.guideItems') }}</label>
        <button class="btn-outline text-sm" @click="addGuideItem">
          <span class="material-icons text-sm mr-1">add</span>
          {{ $t('website.sections.addGuideItem') }}
        </button>
      </div>
      <div class="space-y-3">
        <div
          v-for="(item, index) in localData.items || []"
          :key="index"
          class="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
        >
          <div class="grid grid-cols-3 gap-3 mb-3">
            <input
              v-model="item.icon"
              type="text"
              class="form-input text-sm"
              :placeholder="$t('website.sections.iconName')"
            />
            <div class="col-span-2">
              <LanguageInput v-model="item.title" size="sm" />
            </div>
          </div>
          <div class="mb-3">
            <LanguageInput v-model="item.description" type="textarea" size="sm" />
          </div>
          <div class="flex justify-between items-center">
            <input
              v-model="item.link"
              type="text"
              class="form-input text-sm w-2/3"
              :placeholder="$t('website.sections.link')"
            />
            <button class="text-red-500 hover:text-red-700 text-sm" @click="removeGuideItem(index)">
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Brand Section -->
    <template v-else-if="sectionType === 'brand'">
      <div>
        <label class="form-label">{{ $t('website.sections.brandLogos') }}</label>
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
          {{ $t('website.sections.brandLogosHint') }}
        </p>
        <!-- Brand logos would be uploaded here -->
        <div class="text-sm text-gray-500 dark:text-slate-400 text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg">
          {{ $t('website.sections.brandLogosPlaceholder') }}
        </div>
      </div>
    </template>

    <!-- Default/Unknown Section -->
    <template v-else>
      <div class="text-center py-8 text-gray-500 dark:text-slate-400">
        <span class="material-icons text-4xl mb-2">settings</span>
        <p>{{ $t('website.sections.configureInSettings') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageInput from '@/components/common/LanguageInput.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  saving: Boolean,
  sectionType: {
    type: String,
    required: true
  },
  title: String
})

const emit = defineEmits(['update:modelValue'])

const localData = ref({
  title: [{ lang: 'en', value: '' }],
  description: [{ lang: 'en', value: '' }],
  items: []
})

// Watch for modelValue changes
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      localData.value = {
        title: newValue.title || [{ lang: 'en', value: '' }],
        description: newValue.description || [{ lang: 'en', value: '' }],
        items: newValue.items || [],
        ...newValue
      }
    }
  },
  { immediate: true, deep: true }
)

// Watch for local changes
watch(
  localData,
  newValue => {
    emit('update:modelValue', newValue)
  },
  { deep: true }
)

// Testimonials
const addTestimonial = () => {
  if (!localData.value.items) localData.value.items = []
  localData.value.items.push({
    name: '',
    role: '',
    quote: [{ lang: 'en', value: '' }],
    rating: 5
  })
}

const removeTestimonial = index => {
  localData.value.items.splice(index, 1)
}

// Counter
const addCounter = () => {
  if (!localData.value.items) localData.value.items = []
  localData.value.items.push({
    value: 0,
    label: [{ lang: 'en', value: '' }]
  })
}

const removeCounter = index => {
  localData.value.items.splice(index, 1)
}

// CTA
const addCta = () => {
  if (!localData.value.items) localData.value.items = []
  localData.value.items.push({
    title: [{ lang: 'en', value: '' }],
    buttonText: [{ lang: 'en', value: '' }],
    link: ''
  })
}

const removeCta = index => {
  localData.value.items.splice(index, 1)
}

// Features (Why Choose Us)
const addFeature = () => {
  if (!localData.value.items) localData.value.items = []
  localData.value.items.push({
    icon: 'check_circle',
    title: [{ lang: 'en', value: '' }],
    description: [{ lang: 'en', value: '' }]
  })
}

const removeFeature = index => {
  localData.value.items.splice(index, 1)
}

// Guide Items
const addGuideItem = () => {
  if (!localData.value.items) localData.value.items = []
  localData.value.items.push({
    icon: 'help_outline',
    title: [{ lang: 'en', value: '' }],
    description: [{ lang: 'en', value: '' }],
    link: ''
  })
}

const removeGuideItem = index => {
  localData.value.items.splice(index, 1)
}
</script>
