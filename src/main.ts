import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import 'prosemirror-view/style/prosemirror.css'
import 'animate.css'
import '@/assets/styles/prosemirror.scss'
import '@/assets/styles/global.scss'
import '@/assets/styles/font.scss'

import Directive from '@/directive'
import { i18nPlugin } from '@/i18n/i18n-vue'
import { loadLocaleAsync, loadNamespaceAsync } from '@/i18n/i18n-util.async'
import { namespaces } from '@/i18n/i18n-util'
import { getPptistLocale } from '@/i18n/locale'

async function bootstrap() {
  const locale = getPptistLocale()

  await loadLocaleAsync(locale)
  await Promise.all(namespaces.map(ns => loadNamespaceAsync(locale, ns)))

  const app = createApp(App)
  app.use(Directive)
  app.use(createPinia())
  app.use(i18nPlugin, locale)
  app.mount('#app')
}

bootstrap()
