/**
 * Extract localized string from multilingual data.
 * Supports both array format [{ lang: 'tr', value: '...' }] and flat object format { tr: '...', en: '...' }
 * Falls back to first available value if current locale not found.
 */
export function useMultiLang() {
  const { locale } = useI18n()

  function ml(items: Array<{ lang: string; value: string }> | Record<string, string> | string | undefined | null, fallback: string = ''): string {
    if (!items) return fallback
    if (typeof items === 'string') return items

    // Flat object format: { tr: '...', en: '...' }
    if (!Array.isArray(items) && typeof items === 'object') {
      const obj = items as Record<string, string>
      if (obj[locale.value]) return obj[locale.value]
      if (obj.en) return obj.en
      if (obj.tr) return obj.tr
      const first = Object.values(obj).find(v => v)
      return first || fallback
    }

    if (!Array.isArray(items)) return fallback

    // Array format: [{ lang: 'tr', value: '...' }, ...]
    const current = items.find(i => i.lang === locale.value)
    if (current?.value) return current.value

    const en = items.find(i => i.lang === 'en')
    if (en?.value) return en.value

    const tr = items.find(i => i.lang === 'tr')
    if (tr?.value) return tr.value

    const first = items.find(i => i.value)
    return first?.value || fallback
  }

  return { ml }
}
