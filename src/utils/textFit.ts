/**
 * Shared text-fitting primitives built on `@chenglou/pretext`.
 *
 * Two jobs:
 *  1. `measureTextBlocksHeight` — measure the real wrapped height of a set of
 *     text blocks (paragraphs / list items) at given font sizes. This is the
 *     single measurement engine used by both the agentic layout builder (to bake
 *     an initial font size at build time) and the runtime renderer (to guarantee
 *     a fixed-size box never overflows).
 *  2. `fitScaleForBlocks` — given a fixed inner box, return the largest uniform
 *     scale (<= 1) at which the blocks fit. The renderer applies this as a CSS
 *     `transform: scale(...)`, so a fixed-height text box shrinks its content
 *     down from the authored size instead of clipping or overflowing.
 *
 * pretext measures with a canvas, so these only do real work in a DOM/canvas
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
  /** Font size in px the block renders at (its largest run, to stay safe). */
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
  /** Vertical gap added between consecutive blocks, in px. */
  blockSpace?: number
  /** Indent subtracted from the text column for list items, in px. */
  bulletIndent?: number
  letterSpacing?: number
  /** Multiply every size + gap by this factor before measuring (default 1). */
  scale?: number
}

/**
 * Total wrapped height (px) of `blocks` laid out in a column of `innerWidth`.
 * Each block is measured independently with its own font, then summed with the
 * inter-block gap. Returns 0 for an empty input.
 */
export function measureTextBlocksHeight(blocks: TextFitBlock[], options: MeasureBlocksOptions): number {
  if (!blocks.length) return 0
  const scale = options.scale ?? 1
  const bulletIndent = options.bulletIndent ?? 0
  let total = 0
  for (const block of blocks) {
    const size = block.size * scale
    if (size <= 0) continue
    const lineHeightPx = Math.ceil(size * options.lineHeight)
    const font = `${block.italic ? 'italic' : 'normal'} ${block.bold ? 700 : 400} ${size}px ${block.fontFamily}`
    const width = Math.max(1, options.innerWidth - (block.listItem ? bulletIndent : 0))
    const prepared = pretextPrepare(block.text, font, options.letterSpacing ? { letterSpacing: options.letterSpacing } : undefined)
    total += pretextLayout(prepared, width, lineHeightPx).height
  }
  total += Math.max(0, blocks.length - 1) * (options.blockSpace ?? 0) * scale
  return total
}

export interface FitScaleOptions {
  innerWidth: number
  innerHeight: number
  lineHeight: number
  blockSpace?: number
  bulletIndent?: number
  letterSpacing?: number
  /** Smallest scale to fall back to before clipping takes over (default 0.2). */
  minScale?: number
}

/**
 * Largest uniform scale in `[minScale, 1]` at which `blocks` fit `innerHeight`.
 *
 * The renderer applies the result as `transform: scale(s)`, which scales the
 * already-wrapped block geometrically — so the on-screen height is exactly
 * `naturalHeight * s`. That makes the fit a single measurement (no search):
 * `s = innerHeight / naturalHeight`, clamped. Returns 1 when content already
 * fits (or when measurement isn't possible).
 */
export function fitScaleForBlocks(blocks: TextFitBlock[], options: FitScaleOptions): number {
  const minScale = options.minScale ?? 0.2
  if (!blocks.length || options.innerWidth <= 2 || options.innerHeight <= 2) return 1
  try {
    const natural = measureTextBlocksHeight(blocks, {
      innerWidth: options.innerWidth,
      lineHeight: options.lineHeight,
      blockSpace: options.blockSpace,
      bulletIndent: options.bulletIndent,
      letterSpacing: options.letterSpacing,
    })
    if (natural <= 0 || natural <= options.innerHeight) return 1
    return Math.max(minScale, Math.min(1, options.innerHeight / natural))
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

/** First inline font-family declared on `block` or a descendant, else default. */
function blockFontFamily(block: Element, defaultFamily: string): string {
  const own = (block as HTMLElement).style?.fontFamily
  if (own) return own
  const withFamily = block.querySelector<HTMLElement>('[style*="font-family"]')
  return withFamily?.style.fontFamily || defaultFamily
}

function blockAlign(block: Element): TextFitAlign {
  const align = (block as HTMLElement).style?.textAlign
  if (align === 'center' || align === 'right') return align
  return 'left'
}

export type TextFitAlign = 'left' | 'center' | 'right'

export interface ExtractedContent {
  blocks: TextFitBlock[]
  /** Dominant horizontal alignment (first non-empty block), for the scale origin. */
  align: TextFitAlign
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
  const empty: ExtractedContent = { blocks: [], align: 'left' }
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
  let align: TextFitAlign | null = null

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
    if (align === null) align = blockAlign(el)
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

  return { blocks, align: align ?? 'left' }
}
