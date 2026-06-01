import { watch } from 'vue'
import type { Pinia } from 'pinia'
import type { App } from 'vue'
import { buildDefaultTemplates, useSlidesStore } from '@/store/slides'
import { useScreenStore } from '@/store/screen'
import type { PptistController, PptistDocument } from './types'
import { applyLocale } from './localeBridge'
import type { Locales } from '@/i18n/locale'
import { createAgenticApi } from './agentic/createAgenticApi'

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined
  const debounced = ((...args: never[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
  ;(debounced as T & { cancel: () => void }).cancel = () => clearTimeout(timer)
  return debounced
}

function clampSlideIndex(index: number, length: number): number {
  if (!Number.isFinite(index)) return 0
  return Math.max(0, Math.min(Math.trunc(index), Math.max(length - 1, 0)))
}

async function assertLegacyCommand(command: Promise<{ ok: boolean; errors?: Array<{ message: string }> }>) {
  const result = await command
  if (!result.ok) throw new Error(result.errors?.map(error => error.message).join('; ') || 'PPTist command failed')
}

export function createController(
  pinia: Pinia,
  app: App,
  options: {
    onChange?: (document: PptistDocument) => void
    onChangeDebounceMs?: number
    onPresentationModeChange?: (screening: boolean) => void
  },
): PptistController {
  const slidesStore = useSlidesStore(pinia)
  const screenStore = useScreenStore(pinia)
  const agentic = createAgenticApi(pinia, app, {
    async setLocale(locale) {
      await applyLocale(locale)
      slidesStore.setTemplates(buildDefaultTemplates())
    },
  })

  const emitChange = options.onChange
    ? debounce(() => {
        options.onChange?.({
          title: slidesStore.title,
          slides: JSON.parse(JSON.stringify(slidesStore.slides)) as PptistDocument['slides'],
          theme: { ...slidesStore.theme },
        })
      }, options.onChangeDebounceMs ?? 400)
    : null

  const stopChangeWatch = emitChange
    ? watch(
        () => [slidesStore.title, slidesStore.slides, slidesStore.theme] as const,
        () => emitChange(),
        { deep: true },
      )
    : null

  const stopPresentationModeWatch = options.onPresentationModeChange
    ? watch(
        () => screenStore.screening,
        screening => options.onPresentationModeChange?.(screening),
      )
    : null

  let destroyed = false

  const runLegacyCommand = (command: Promise<unknown>) => {
    void command
  }

  const resolveSlideIndex = (slideIdOrIndex: string | number) => {
    const index = typeof slideIdOrIndex === 'number'
      ? clampSlideIndex(slideIdOrIndex, slidesStore.slides.length)
      : slidesStore.slides.findIndex(slide => slide.id === slideIdOrIndex)
    if (index < 0) throw new Error(`Slide not found: ${slideIdOrIndex}`)
    return index
  }

  const controller: PptistController = {
    ...agentic.api,

    getDocument(): PptistDocument {
      return agentic.api.deck.get()
    },

    setDocument(document: PptistDocument) {
      if (destroyed) return
      runLegacyCommand(agentic.api.deck.set(document, { source: 'host' }))
      emitChange?.()
    },

    setTitle(title: string) {
      if (destroyed) return
      runLegacyCommand(agentic.api.deck.setTitle(title, { source: 'host' }))
    },

    async setLocale(locale: Locales) {
      if (destroyed) return
      await assertLegacyCommand(agentic.api.view.setLocale(locale))
    },

    goToSlide(slideIdOrIndex: string | number) {
      if (destroyed) return
      resolveSlideIndex(slideIdOrIndex)
      runLegacyCommand(agentic.api.view.goToSlide(slideIdOrIndex, { source: 'host' }))
    },

    nextSlide() {
      if (destroyed) return
      runLegacyCommand(agentic.api.view.nextSlide({ source: 'host' }))
    },

    previousSlide() {
      if (destroyed) return
      runLegacyCommand(agentic.api.view.previousSlide({ source: 'host' }))
    },

    setZoom(scale: number) {
      if (destroyed) return
      runLegacyCommand(agentic.api.view.setZoom(scale, { source: 'host' }))
    },

    enterPresentation() {
      if (destroyed) return
      runLegacyCommand(agentic.api.view.enterPresentation())
    },

    exitPresentation() {
      if (destroyed) return
      runLegacyCommand(agentic.api.view.exitPresentation())
    },

    destroy() {
      if (destroyed) return
      destroyed = true
      stopChangeWatch?.()
      stopPresentationModeWatch?.()
      ;(emitChange as (typeof emitChange & { cancel?: () => void }))?.cancel?.()
      agentic.stop()
    },
  }

  return controller
}
