import type { PPTTextElement, Slide, TextAlignVertical, TextInset } from '@/types/slides'

const DEFAULT_INSET: TextInset = [10, 10, 10, 10]
const DEFAULT_LINE_HEIGHT = 1.2
const DEFAULT_PLACEHOLDER_FONT_SIZE = 20

export interface PlaceholderBoxMetrics {
  placeholderFontSize?: number
  lineHeight?: number
  inset?: TextInset
  /** Lines of placeholder-sized text the box should fit (default 1). */
  lines?: number
  paragraphSpace?: number
}

/**
 * Minimum box height from placeholder typography: vertical inset + text lines at
 * placeholderFontSize × lineHeight (+ paragraph gaps between lines).
 */
export const computePlaceholderMinBoxHeight = (metrics: PlaceholderBoxMetrics = {}): number => {
  const fontSize = metrics.placeholderFontSize ?? DEFAULT_PLACEHOLDER_FONT_SIZE
  const lineHeight = metrics.lineHeight ?? DEFAULT_LINE_HEIGHT
  const inset = metrics.inset ?? DEFAULT_INSET
  const lines = Math.max(1, metrics.lines ?? 1)
  const paragraphSpace = metrics.paragraphSpace ?? 0

  const linePx = fontSize * lineHeight
  const textBlock = linePx * lines + (lines > 1 ? (lines - 1) * paragraphSpace : 0)

  return Math.ceil(inset[0] + inset[2] + textBlock)
}

const typographyMinHeight = (el: PPTTextElement): number => {
  return computePlaceholderMinBoxHeight({
    placeholderFontSize: el.placeholderFontSize,
    lineHeight: el.lineHeight,
    inset: el.inset,
    lines: 1,
    paragraphSpace: el.paragraphSpace,
  })
}

/** Fixed empty-state box height set at placeholder creation (never grows with content). */
export const getPlaceholderBaselineHeight = (el: PPTTextElement): number => {
  return el.placeholderLayoutHeight ?? typographyMinHeight(el)
}

export const isPlaceholderElement = (el: PPTTextElement): boolean => !!el.placeholder

/** Title placeholder on content slides (slide 2+): left-aligned, vertically centered in the layout box. */
export const isContentSlideTitlePlaceholder = (
  el: PPTTextElement,
  slideType?: Slide['type'],
): boolean => {
  if (!el.placeholder || el.textType !== 'title') return false
  if (slideType === 'content') return true
  if (slideType === 'cover' || slideType === 'transition') return false
  // Static/thumbnail render without slide context: content titles use left align.
  return el.placeholderAlign === 'left'
}

export interface TextBoxLayout {
  fixedHeight: boolean
  vAlign: TextAlignVertical
  /** Flex-column vertical centering without locking box height (content slides title). */
  flexCenterInLayoutBox: boolean
}

export const resolveTextBoxLayout = (
  el: PPTTextElement,
  slideType?: Slide['type'],
): TextBoxLayout => {
  const contentTitle = isContentSlideTitlePlaceholder(el, slideType)

  return {
    fixedHeight: !!el.fixedHeight,
    vAlign: el.vAlign ?? (contentTitle ? 'middle' : 'top'),
    flexCenterInLayoutBox: contentTitle && !el.fixedHeight,
  }
}

/**
 * Placeholder shrink guard:
 * - With content: allow shrinking to fit text; only block absurdly small heights.
 * - Empty: keep the baseline layout height (do not inherit peak multiline height).
 */
export const shouldBlockPlaceholderHeightShrink = (
  el: PPTTextElement,
  measuredHeight: number,
  contentEmpty: boolean,
): boolean => {
  if (!isPlaceholderElement(el)) return false

  const floor = contentEmpty ? getPlaceholderBaselineHeight(el) : typographyMinHeight(el)
  return measuredHeight < floor
}
