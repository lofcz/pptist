/**
 * Shared text-fitting primitives built on `@chenglou/pretext`.
 *
 * The job: given a fixed-size text box, work out the largest font size at which
 * the content still fits, by *measuring the real wrapped line count* with
 * pretext at candidate sizes (binary search) — never a CSS transform/zoom. The
 * renderer then applies that as an actual font size (a uniform factor over the
 * authored sizes), so a fixed box shrinks its type to fit instead of spilling.
 *
 * pretext measures with a canvas, so this only does real work in a DOM/canvas
 * runtime; callers wrap usage so a non-DOM context falls back gracefully.
 */
import { layout as pretextLayout, prepare as pretextPrepare } from '@chenglou/pretext'

/** ProseMirror's default text size (assets/styles/prosemirror.scss). */
export const DEFAULT_TEXT_FONT_SIZE = 16
/** Horizontal space a list marker + indent steals from a bullet's text column. */
export const BULLET_INDENT = 28

/** A single measurable text block (one paragraph or one list item). */
export interface TextFitBlock {
  /** Plain text of the block (markers stripped). */
  text: string
  /** Authored font size in px (its largest run, to stay safe). */
  size: number
  bold?: boolean
  italic?: boolean
  fontFamily: string
  /** When true, a list marker indent is subtracted from the text column. */
  listItem?: boolean
}

export interface MeasureBlocksOptions {
  /** Box content width in px (insets already removed). */
  innerWidth: number
  /** Line height multiplier (e.g. 1.5). */
  lineHeight: number
  /** Vertical gap added between consecutive blocks, in px (NOT scaled by sizeScale). */
  blockSpace?: number
  /** Indent subtracted from the text column for list items, in px. */
  bulletIndent?: number
  letterSpacing?: number
  /** Multiply every block's font size by this factor before measuring (default 1). */
  sizeScale?: number
}

function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Total wrapped height (px) of `blocks` laid out in a column of `innerWidth`,
 * with each block's font size multiplied by `sizeScale`. Each block is measured
 * independently with pretext, then summed with the (unscaled, px-fixed)
 * inter-block gap. Returns 0 for an empty input.
 */
export function measureTextBlocksHeight(blocks: TextFitBlock[], options: MeasureBlocksOptions): number {
  if (!blocks.length) return 0
  const sizeScale = options.sizeScale ?? 1
  const bulletIndent = options.bulletIndent ?? 0
  let total = 0
  for (const block of blocks) {
    const size = block.size * sizeScale
    if (size <= 0) continue
    const lineHeightPx = Math.ceil(size * options.lineHeight)
    const font = `${block.italic ? 'italic' : 'normal'} ${block.bold ? 700 : 400} ${size}px ${block.fontFamily}`
    const width = Math.max(1, options.innerWidth - (block.listItem ? bulletIndent : 0))
    const prepared = pretextPrepare(block.text, font, options.letterSpacing ? { letterSpacing: options.letterSpacing } : undefined)
    total += pretextLayout(prepared, width, lineHeightPx).height
  }
  // Paragraph/line gaps are fixed px in CSS (var(--paragraphSpace)); they do not
  // scale with the font, so they are added once at full size.
  total += Math.max(0, blocks.length - 1) * (options.blockSpace ?? 0)
  return total
}

export interface FitFontScaleOptions {
  innerWidth: number
  innerHeight: number
  lineHeight: number
  blockSpace?: number
  bulletIndent?: number
  letterSpacing?: number
  /** Smallest font factor to fall back to before clipping takes over (default 0.1). */
  minScale?: number
}

/**
 * Largest uniform font factor in `[minScale, 1]` at which `blocks` fit
 * `innerHeight`, found by binary search over pretext measurements. The factor
 * multiplies the authored font sizes; because wrapping changes as the type
 * shrinks, this re-measures at each candidate (not a single geometric divide).
 * Returns 1 when content already fits (or measurement isn't possible).
 */
export function fitFontScaleForBlocks(blocks: TextFitBlock[], options: FitFontScaleOptions): number {
  const minScale = options.minScale ?? 0.1
  if (!blocks.length || options.innerWidth <= 2 || options.innerHeight <= 2) return 1
  try {
    const fits = (sizeScale: number) =>
      measureTextBlocksHeight(blocks, {
        innerWidth: options.innerWidth,
        lineHeight: options.lineHeight,
        blockSpace: options.blockSpace,
        bulletIndent: options.bulletIndent,
        letterSpacing: options.letterSpacing,
        sizeScale,
      }) <= options.innerHeight

    if (fits(1)) return 1

    let lo = minScale
    let hi = 1
    let best = minScale
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2
      if (fits(mid)) {
        best = mid
        lo = mid
      }
      else hi = mid
    }
    return best
  }
  catch {
    return 1
  }
}

const FONT_SIZE_PX_RE = /(\d+(?:\.\d+)?)px/

function parseFontSizePx(value: string | null | undefined): number {
  if (!value) return 0
  const match = FONT_SIZE_PX_RE.exec(value)
  return match ? parseFloat(match[1]) : 0
}

/** Largest inline px font size declared on `block` or any descendant. */
function blockFontSize(block: Element, defaultSize: number): number {
  let max = parseFontSizePx((block as HTMLElement).style?.fontSize)
  block.querySelectorAll<HTMLElement>('[style]').forEach(el => {
    const size = parseFontSizePx(el.style.fontSize)
    if (size > max) max = size
  })
  return max || defaultSize
}

// `inherit`/`initial`/`unset` are valid CSS but not valid `ctx.font` families;
// canvas would reject the whole font string and measure at its 10px default.
function usableFamily(family: string | undefined | null): string | null {
  if (!family) return null
  const trimmed = family.trim()
  if (!trimmed || trimmed === 'inherit' || trimmed === 'initial' || trimmed === 'unset') return null
  return trimmed
}

/** First usable inline font-family declared on `block` or a descendant, else default. */
function blockFontFamily(block: Element, defaultFamily: string): string {
  const own = usableFamily((block as HTMLElement).style?.fontFamily)
  if (own) return own
  const withFamily = block.querySelector<HTMLElement>('[style*="font-family"]')
  return usableFamily(withFamily?.style.fontFamily) || defaultFamily
}

export interface ExtractedContent {
  blocks: TextFitBlock[]
}

export interface ExtractOptions {
  defaultFontFamily: string
  defaultSize?: number
}

const BLOCK_SELECTOR = 'li, p, blockquote'

/**
 * Parse a PPTist rich-text HTML string into measurable blocks. Each list item
 * and top-level paragraph/quote becomes one block; a block's representative font
 * size is the largest inline size in it (so measurement never under-estimates).
 * Returns no blocks when there's no DOM parser or no text. List items are tagged
 * so the marker indent is accounted for.
 */
export function extractFitBlocksFromHtml(html: string, options: ExtractOptions): ExtractedContent {
  const empty: ExtractedContent = { blocks: [] }
  if (!html || typeof DOMParser === 'undefined') return empty

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const root = doc.body
  if (!root) return empty

  const defaultSize = options.defaultSize ?? DEFAULT_TEXT_FONT_SIZE
  const blockEls = Array.from(root.querySelectorAll(BLOCK_SELECTOR))
    // A list item already contains its own paragraph(s); skip paragraphs nested
    // inside list items so each item is measured exactly once.
    .filter(el => el.tagName === 'LI' || !el.closest('li'))

  const candidates = blockEls.length ? blockEls : Array.from(root.children)
  const blocks: TextFitBlock[] = []

  for (const el of candidates) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
    if (!text) continue
    blocks.push({
      text,
      size: blockFontSize(el, defaultSize),
      bold: !!el.querySelector('strong, b'),
      italic: !!el.querySelector('em, i'),
      fontFamily: blockFontFamily(el, options.defaultFontFamily),
      listItem: el.tagName === 'LI',
    })
  }

  // No block-level wrappers (e.g. a bare text node): measure the whole thing.
  if (!blocks.length) {
    const text = (root.textContent || '').replace(/\s+/g, ' ').trim()
    if (text) {
      blocks.push({
        text,
        size: blockFontSize(root, defaultSize),
        fontFamily: blockFontFamily(root, options.defaultFontFamily),
      })
    }
  }

  return { blocks }
}

/**
 * Return a copy of `html` with every inline `font-size:Npx` multiplied by
 * `scale` (rounded to 0.1px). Text without an explicit size is untouched here —
 * the renderer scales that through the `--text-fit-base-size` CSS variable. A
 * scale >= 1 (or a non-DOM context) returns the HTML unchanged.
 */
export function scaleHtmlFontSizes(html: string, scale: number): string {
  if (!html || scale >= 1 || typeof DOMParser === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.body.querySelectorAll<HTMLElement>('[style]').forEach(el => {
    const size = parseFontSizePx(el.style.fontSize)
    if (size > 0) el.style.fontSize = `${roundTo(size * scale)}px`
  })
  return doc.body.innerHTML
}
