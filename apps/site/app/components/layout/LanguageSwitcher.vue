<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="open = !open"
      class="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg hover:bg-gray-100/20 transition-colors"
    >
      <span class="text-base leading-none">{{ flagEmoji }}</span>
      <span class="uppercase font-medium text-xs">{{ locale }}</span>
      <svg
        class="w-3 h-3 transition-transform"
        :class="open ? 'rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 dropdown-panel py-1 min-w-[160px] z-50"
      >
        <button
          v-for="lang in availableLocales"
          :key="lang.code"
          @click="switchLang(lang.code)"
          class="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
          :class="{ 'font-semibold text-site-primary bg-site-primary/5': locale === lang.code }"
        >
          <span class="text-base leading-none">{{ getFlagEmoji(lang.code) }}</span>
          {{ lang.name }}
          <svg
            v-if="locale === lang.code"
            class="w-4 h-4 ml-auto text-site-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const partner = usePartnerStore()

const open = ref(false)
const dropdownRef = ref<HTMLElement>()

const FLAG_MAP: Record<string, string> = {
  tr: '\u{1F1F9}\u{1F1F7}',
  en: '\u{1F1EC}\u{1F1E7}',
  de: '\u{1F1E9}\u{1F1EA}',
  ru: '\u{1F1F7}\u{1F1FA}',
  ar: '\u{1F1F8}\u{1F1E6}',
  fr: '\u{1F1EB}\u{1F1F7}',
  es: '\u{1F1EA}\u{1F1F8}',
  it: '\u{1F1EE}\u{1F1F9}',
  nl: '\u{1F1F3}\u{1F1F1}',
  pt: '\u{1F1F5}\u{1F1F9}',
  ja: '\u{1F1EF}\u{1F1F5}',
  ko: '\u{1F1F0}\u{1F1F7}',
  zh: '\u{1F1E8}\u{1F1F3}',
  pl: '\u{1F1F5}\u{1F1F1}',
  uk: '\u{1F1FA}\u{1F1E6}',
  cs: '\u{1F1E8}\u{1F1FF}',
  sv: '\u{1F1F8}\u{1F1EA}',
  he: '\u{1F1EE}\u{1F1F1}',
  fa: '\u{1F1EE}\u{1F1F7}',
  ro: '\u{1F1F7}\u{1F1F4}'
}

function getFlagEmoji(code: string) {
  return FLAG_MAP[code] || '\u{1F310}'
}

const flagEmoji = computed(() => getFlagEmoji(locale.value))

const availableLocales = computed(() => {
  const activeLangs = partner.activeLanguages
  const all = locales.value as any[]
  if (activeLangs.length > 1) {
    return all.filter(l => activeLangs.includes(l.code))
  }
  // Fallback: backend'den dil ayarı gelmediyse tüm locale'leri göster
  return all
})

function switchLang(code: string) {
  setLocale(code)
  open.value = false
}

onMounted(() => {
  const handler = (e: Event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
      open.value = false
    }
  }
  document.addEventListener('click', handler)
  onUnmounted(() => document.removeEventListener('click', handler))
})
</script>
