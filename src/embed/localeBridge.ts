import type { Locales } from '@/i18n/locale'
import { setPptistLocale } from '@/i18n/locale'
import { clearLLCache } from '@/i18n/getLL'
import { loadLocaleAsync, loadNamespaceAsync } from '@/i18n/i18n-util.async'
import { namespaces } from '@/i18n/i18n-util'

/** Set by EmbedRoot on mount — typesafe-i18n Vue context lives inside the app tree. */
let syncVueLocale: ((locale: Locales) => void) | null = null

export function registerVueLocaleSync(fn: (locale: Locales) => void) {
  syncVueLocale = fn
}

export function unregisterVueLocaleSync() {
  syncVueLocale = null
}

export async function applyLocale(locale: Locales): Promise<void> {
  setPptistLocale(locale)
  clearLLCache()
  await loadLocaleAsync(locale)
  await Promise.all(namespaces.map(ns => loadNamespaceAsync(locale, ns)))
  syncVueLocale?.(locale)
}
