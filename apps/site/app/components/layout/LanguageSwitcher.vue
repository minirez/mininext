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

    <Transition name="lang-mega">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 w-[540px] max-w-[90vw]"
      >
        <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
          {{ $t('common.language') }}
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1">
          <button
            v-for="lang in allLocales"
            :key="lang.code"
            @click="switchLang(lang.code)"
            class="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors text-left"
            :class="
              locale === lang.code
                ? 'bg-site-primary/10 text-site-primary font-semibold ring-1 ring-site-primary/20'
                : 'text-gray-700 hover:bg-gray-50'
            "
          >
            <span class="text-base leading-none shrink-0">{{ getFlagEmoji(lang.code) }}</span>
            <span class="truncate text-xs">{{ lang.name }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const { t: $t } = useI18n()

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

// Tüm 20 dili her zaman göster
const allLocales = computed(() => {
  return (locales.value as any[]).slice()
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

<style scoped>
.lang-mega-enter-active,
.lang-mega-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.lang-mega-enter-from,
.lang-mega-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.lang-mega-enter-to,
.lang-mega-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
