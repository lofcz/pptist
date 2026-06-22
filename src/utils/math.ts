import { ref } from 'vue'

/**
 * Shared MathLive typesetting helpers.
 *
 * LaTeX is the single source of truth for in-text math. It is carried on a
 * canonical wrapper element:
 *
 *   <span class="pptist-math" data-latex="\frac{1}{2}" data-display="false">…markup…</span>
 *
 * The inner markup is MathLive's `convertLatexToMarkup` output, preserved in the
 * stored HTML so the static render paths (`v-html`) and ProseMirror round-trips
 * never need to re-typeset existing content. MathLive itself is lazy-loaded the
 * first time math actually appears (or the editor opens), so decks without math
 * never pull it into the bundle. Static styling comes from `mathlive/static.css`
 * + `mathlive/fonts.css`, imported once at app/embed bootstrap.
 */

export const MATH_CLASS = 'pptist-math'

type ConvertLatexToMarkup = (latex: string, options?: { defaultMode?: 'inline-math' | 'math' | 'text' }) => string

interface MathliveModule {
  convertLatexToMarkup: ConvertLatexToMarkup
  MathfieldElement: {
    fontsDirectory: string | null
    soundsDirectory: string | null
  }
}

let mathlive: MathliveModule | null = null
let mathlivePromise: Promise<MathliveModule> | null = null

/**
 * Reactive flag flipped to `true` once MathLive has loaded. Reading it inside a
 * render (e.g. table `formatText`) registers a dependency so the math re-renders
 * the moment the engine becomes available.
 */
export const mathReady = ref(false)

/** Lazily import MathLive and configure it for a bundled (offline) font setup. */
export function ensureMathliveReady(): Promise<MathliveModule> {
  if (mathlivePromise) return mathlivePromise

  mathlivePromise = import('mathlive').then(mod => {
    const resolved = mod as unknown as MathliveModule
    // Fonts/sounds ship via the bundled `mathlive/fonts.css` (@font-face is
    // visible inside the math-field shadow tree), so disable MathLive's own
    // network font/sound loading which would 404 against the embed chunk path.
    try {
      resolved.MathfieldElement.fontsDirectory = null
      resolved.MathfieldElement.soundsDirectory = null
    }
    catch { /* MathfieldElement not present in some SSR builds — ignore. */ }
    mathlive = resolved
    mathReady.value = true
    return resolved
  })

  return mathlivePromise
}

/** Escape a string for safe inclusion in a double-quoted HTML attribute. */
export function escapeLatexAttr(latex: string): string {
  return latex
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Escape plain text for safe inclusion in HTML element content. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Render `latex` to the canonical `span.pptist-math` wrapper HTML string. Must
 * only be called once {@link ensureMathliveReady} has resolved (the markdown
 * pipeline and editor await it; tables fall back to literal source until ready).
 */
export function renderMathToHtml(latex: string, display = false): string {
  const attrs = `class="${MATH_CLASS}" data-latex="${escapeLatexAttr(latex)}"${display ? ' data-display="true"' : ''}`
  if (!mathlive) {
    // Engine not loaded yet: emit the wrapper carrying the source so it still
    // round-trips and is re-typeset once MathLive is ready.
    return `<span ${attrs} data-pending="true">${escapeHtml(latex)}</span>`
  }
  const markup = mathlive.convertLatexToMarkup(latex, { defaultMode: display ? 'math' : 'inline-math' })
  return `<span ${attrs}>${markup}</span>`
}

/**
 * Build a real `span.pptist-math` DOM node for the given latex/markup. Used by
 * the ProseMirror schema `toDOM` so the editor DOM (and the innerHTML persisted
 * on edit) is the same canonical wrapper the parser reads back.
 */
export function buildMathElement(latex: string, html: string, display = false): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = MATH_CLASS
  span.setAttribute('data-latex', latex)
  if (display) span.setAttribute('data-display', 'true')
  span.setAttribute('contenteditable', 'false')
  span.innerHTML = html || escapeHtml(latex)
  return span
}

/** Engine adapter that lets `markdown-it-texmath` typeset via MathLive. */
export const texmathEngine = {
  renderToString(latex: string, options?: { displayMode?: boolean }): string {
    return renderMathToHtml(latex, !!options?.displayMode)
  },
}

const MATH_HTML_RE = /class=["']?pptist-math|data-latex=|<eq[\s>]|<eqn[\s>]/i

/** True when an HTML string already contains rendered/wrapped math. */
export function htmlContainsMath(html: string): boolean {
  return !!html && MATH_HTML_RE.test(html)
}
