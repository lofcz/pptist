import type { Locales } from '@/i18n/locale'
import type { Slide, SlideTheme, SlideTemplate } from '@/types/slides'
import type { PptistAgentApi, PptistSlideReference } from './agentic/types'

/** Serializable deck passed between sciobot-next and PPTist. */
export interface PptistDocument {
  title: string
  slides: Slide[]
  theme?: Partial<SlideTheme>
}

export interface PptistMountOptions {
  /** UI locale — same union as sciobot-next (`cs` | `en` | `sk` | `pl`). */
  locale?: Locales
  /** Initial deck; when omitted, mock slides are loaded if `loadMockOnEmpty` is true. */
  document?: PptistDocument
  /** When no `document`, fetch `mocks/slides.json` from `assetBaseUrl` (default: `/`). */
  loadMockOnEmpty?: boolean
  /**
   * Base URL for runtime assets (template covers, mocks).
   * Dev: `http://127.0.0.1:5173` while PPTist dev server runs, or sciobot proxy path.
   */
  assetBaseUrl?: string
  /**
   * Style/template catalog shown in the design picker. Each entry's `id` maps to
   * a `mocks/<id>.json` payload resolved against `assetBaseUrl`. Omit to use the
   * bundled defaults (which fall back to the demo deck when a file is missing).
   */
  templates?: SlideTemplate[]
  /** Fired when title, slides, or theme change (debounced). */
  onChange?: (document: PptistDocument) => void
  onChangeDebounceMs?: number
  /** Fired when PPTist enters or exits slideshow/presentation mode. */
  onPresentationModeChange?: (screening: boolean) => void
}

/** Public embed controller: legacy host methods plus the generic command and domain APIs. */
export interface PptistController extends PptistAgentApi {
  getDocument(): PptistDocument
  setDocument(document: PptistDocument): void
  setTitle(title: string): void
  setLocale(locale: Locales): Promise<void>
  goToSlide(slideIdOrIndex: PptistSlideReference): void
  nextSlide(): void
  previousSlide(): void
  setZoom(scale: number): void
  enterPresentation(): void
  exitPresentation(): void
  destroy(): void
}

export interface PptistMountResult {
  controller: PptistController
  app: import('vue').App
  pinia: import('pinia').Pinia
}
