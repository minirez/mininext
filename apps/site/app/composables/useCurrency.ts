/**
 * Currency formatting composable
 */
export function useCurrency() {
  const { locale } = useI18n()

  const currencyLocaleMap: Record<string, string> = {
    TRY: 'tr-TR',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    RUB: 'ru-RU',
    SAR: 'ar-SA',
  }

  function formatPrice(amount: number, currency: string = 'TRY', options?: Intl.NumberFormatOptions): string {
    const loc = currencyLocaleMap[currency] || locale.value || 'tr-TR'
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount)
  }

  function formatNumber(amount: number): string {
    return new Intl.NumberFormat(locale.value || 'tr-TR').format(amount)
  }

  return { formatPrice, formatNumber }
}
