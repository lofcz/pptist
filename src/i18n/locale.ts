import type { Locales } from './i18n-types'
import { isLocale } from './i18n-util'

export type { Locales }

declare global {
  interface Window {
    /** Set by sciobot-next (React host) before PPTist mount in embed mode */
    __PPTIST_LOCALE__?: string
  }
}

const DEFAULT_LOCALE: Locales = 'en'

function detectInitialLocale(): Locales {
  const urlLocale = new URLSearchParams(window.location.search).get('locale')
  if (urlLocale && isLocale(urlLocale)) return urlLocale

  const hostLocale = window.__PPTIST_LOCALE__
  if (hostLocale && isLocale(hostLocale)) return hostLocale

  return DEFAULT_LOCALE
}

let currentLocale: Locales = detectInitialLocale()

/** Default locale for PPTist during migration (English is the canonical key source). */
export const pptistDefaultLocale = DEFAULT_LOCALE

export function getPptistLocale(): Locales {
  return currentLocale
}

export function setPptistLocale(locale: Locales): void {
  currentLocale = locale
}
