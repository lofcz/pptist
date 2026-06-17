import { typesafeI18n } from './i18n-vue'

/**
 * Vue composable for i18n — mirrors the typesafe-i18n `useI18nContext()` API.
 * Returns reactive `{ LL, locale, setLocale }`.
 */
export function useI18nContext() {
  return typesafeI18n()
}
