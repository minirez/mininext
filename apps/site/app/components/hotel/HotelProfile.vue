<template>
  <div v-if="sections.length" class="space-y-6">
    <div
      v-for="key in sections"
      :key="key"
      class="border border-gray-200 rounded-xl overflow-hidden"
    >
      <button
        @click="toggle(key)"
        class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <h3 class="font-semibold text-gray-800">{{ $t(`hotel.${key}`) }}</h3>
        <svg
          class="w-5 h-5 text-gray-400 transition-transform"
          :class="{ 'rotate-180': openSections.includes(key) }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        v-show="openSections.includes(key)"
        class="px-5 pb-4 text-gray-700 leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-2 [&_strong]:font-semibold [&_br]:leading-loose"
        v-html="ml(hotel.profile?.[key]?.content)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { ml } = useMultiLang()

defineProps<{
  hotel: any
  sections: string[]
}>()

const openSections = ref<string[]>(['overview'])

function toggle(key: string) {
  const idx = openSections.value.indexOf(key)
  if (idx >= 0) openSections.value.splice(idx, 1)
  else openSections.value.push(key)
}
</script>
