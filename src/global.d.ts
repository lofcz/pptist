// Compile-time feature flag injected via Vite `define` (see vite.config*.ts).
// Defaults to `false` so demo/upstream-only chrome (AI/AIPPT, GitHub links,
// feedback/FAQ, demo disclaimer) is dead-code-eliminated from consumer builds.
declare const __PPTIST_EXTRAS_ENABLED__: boolean

declare module 'markdown-it-texmath' {
  import type MarkdownIt from 'markdown-it'

  const plugin: (md: MarkdownIt, options: unknown) => void
  export default plugin
}

interface HTMLElement {
  webkitRequestFullScreen(options?: FullscreenOptions): Promise<void>
  mozRequestFullScreen(options?: FullscreenOptions): Promise<void>
  msRequestFullscreen(options?: FullscreenOptions): Promise<void>
}

interface Document {
  webkitFullscreenElement: Element | null
  mozFullScreenElement: Element | null
  msFullscreenElement: Element | null
  webkitCurrentFullScreenElement: Element | null

  mozCancelFullScreen(): Promise<void>
  webkitExitFullscreen(): Promise<void>
  msExitFullscreen(): Promise<void>
}