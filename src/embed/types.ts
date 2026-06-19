import type { PptistExportTabsConfig } from '@/configs/exportTabs'
import type { Locales } from '@/i18n/locale'
import type { Slide, SlideTheme, SlideTemplate } from '@/types/slides'
import type { PptistAgentApi, PptistSlideReference } from './agentic/types'

export interface PptistTemplatePayload {
  title?: string
  width?: number
  height?: number
  slides: Slide[]
  theme?: Partial<SlideTheme>
}

export type PptistTemplateLoader = () => Promise<PptistTemplatePayload | Slide[]>
export type PptistDocumentLoader = () => Promise<PptistDocument | null | undefined>

export interface PptistStarterPresentationOptions {
  title?: string
  titlePlaceholder?: string
  subtitlePlaceholder?: string
  bodyPlaceholder?: string
  titleFontSize?: number
  subtitleFontSize?: number
  contentTitleFontSize?: number
  bodyFontSize?: number
  placeholderColor?: string
  fontName?: string
  fontColor?: string
  backgroundColor?: string
}

/** Serializable deck passed between the embedding host and PPTist. */
export interface PptistDocument {
  title: string
  slides: Slide[]
  theme?: Partial<SlideTheme>
}

export interface PptistMountOptions {
  /** UI locale (`cs` | `en` | `sk` | `pl`). */
  locale?: Locales
  /** Initial deck; takes precedence over `loadDocument` and the starter slide. */
  document?: PptistDocument
  /** Optional async document loader for hosts that resolve a deck from the current URL/session. */
  loadDocument?: PptistDocumentLoader
  /** Legacy demo behavior: when explicitly true, load `mocks/slides.json` instead of the starter slide. */
  loadMockOnEmpty?: boolean
  /** Set false when the embed host renders its own empty/loading state. */
  showLoadingData?: boolean
  /** Customize the default one-slide starter deck used when no existing document is loaded. */
  starterPresentation?: PptistStarterPresentationOptions
  /** Base URL for runtime image/font assets and fallback mock decks. */
  assetBaseUrl?: string
  /**
   * Style/template catalog shown in the design picker. Built-in template ids are
   * loaded from lazy bundled JSON chunks. Custom ids can be resolved with
   * `templateLoaders`, or as a fallback from `mocks/<id>.json` at `assetBaseUrl`.
   */
  templates?: SlideTemplate[]
  /** Optional custom template payload loaders keyed by `templates[].id`. */
  templateLoaders?: Record<string, PptistTemplateLoader>
  /** Fired when title, slides, or theme change (debounced). */
  onChange?: (document: PptistDocument) => void
  onChangeDebounceMs?: number
  /** Fired when PPTist enters or exits slideshow/presentation mode. */
  onPresentationModeChange?: (screening: boolean) => void
  /**
   * Toggle export dialog tabs (`pptx`, `image`, `json`, `pdf`, `pptist`).
   * Omitted keys stay enabled. The `pptist` tab also requires `PPTIST_EXTRAS_ENABLED=true` at build time.
   */
  exportTabs?: PptistExportTabsConfig
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
