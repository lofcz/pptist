import { createApp, type App } from 'vue'
import { createPinia, type Pinia } from 'pinia'
import EmbedRoot from './EmbedRoot.vue'

import 'prosemirror-view/style/prosemirror.css'
import 'animate.css'
import '@/assets/styles/prosemirror.scss'
import '@/assets/styles/global.scss'
import '@/assets/styles/font.scss'

import Directive from '@/directive'
import { i18nPlugin } from '@/i18n/i18n-vue'
import { getPptistLocale, setPptistLocale, type Locales } from '@/i18n/locale'
import { clearPptistPortalTarget, setPptistPortalTarget } from '@/utils/portal'
import { setPptistAssetBase } from '@/utils/assetBase'
import { setCustomTemplateLoaders } from '@/configs/templates'
import { applyLocale } from './localeBridge'
import { createController } from './createController'
import type { PptistController, PptistMountOptions, PptistMountResult } from './types'

const activeMounts = new WeakMap<HTMLElement, Promise<PptistMountResult>>()

function resolveHostElement(target: HTMLElement | string): HTMLElement {
  if (typeof target === 'string') {
    const el = document.querySelector<HTMLElement>(target)
    if (!el) throw new Error(`PPTist mount target not found: ${target}`)
    return el
  }
  return target
}

/**
 * Mount PPTist into a DOM node (for React / other embedding hosts).
 * Vue + Pinia are bundled in the embed build — the host does not need Vue installed.
 */
export async function mountPptist(
  target: HTMLElement | string,
  options: PptistMountOptions = {},
): Promise<PptistMountResult> {
  const el = resolveHostElement(target)

  const previousMount = activeMounts.get(el)
  if (previousMount) {
    try {
      const previous = await previousMount
      previous.controller.destroy()
    } catch {
      // A failed previous mount should not block a fresh attempt on the same host.
    }
  }

  const mountPromise = (async () => {
    el.classList.add('pptist-embed-root')
    el.innerHTML = ''

    const appRoot = document.createElement('div')
    appRoot.className = 'pptist-embed-app'
    appRoot.style.cssText = 'display:block;height:100%;width:100%;min-height:0;overflow:hidden;'

    const portalRoot = document.createElement('div')
    portalRoot.className = 'pptist-embed-portal'

    el.appendChild(appRoot)
    el.appendChild(portalRoot)
    setPptistPortalTarget(portalRoot)

    // Resolve runtime data/assets (mocks, template covers, imgs) against the host
    // asset base so the style/template picker and other data lookups work embedded.
    setPptistAssetBase(options.assetBaseUrl)
    setCustomTemplateLoaders(options.templateLoaders)

    const locale: Locales = options.locale ?? getPptistLocale()
    setPptistLocale(locale)
    await applyLocale(locale)

    const pinia = createPinia()
    const app: App = createApp(EmbedRoot, { init: options })
    app.use(Directive)
    app.use(pinia)
    app.use(i18nPlugin, locale)
    app.mount(appRoot)

    const controller: PptistController = createController(pinia, app, {
      onChange: options.onChange,
      onChangeDebounceMs: options.onChangeDebounceMs,
      onPresentationModeChange: options.onPresentationModeChange,
    })

    let destroyed = false
    const originalDestroy = controller.destroy.bind(controller)
    controller.destroy = () => {
      if (destroyed) return
      destroyed = true
      originalDestroy()
      if (activeMounts.get(el) === mountPromise) activeMounts.delete(el)
      clearPptistPortalTarget(portalRoot)
      el.classList.remove('pptist-embed-root')
      el.innerHTML = ''
    }

    return { controller, app, pinia }
  })()

  activeMounts.set(el, mountPromise)

  try {
    return await mountPromise
  } catch (error) {
    if (activeMounts.get(el) === mountPromise) activeMounts.delete(el)
    throw error
  }
}

export async function unmountPptist(result: PptistMountResult): Promise<void> {
  result.controller.destroy()
}
