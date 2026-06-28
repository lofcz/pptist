import { nanoid } from 'nanoid'
import type { TranslationFunctions } from '@/i18n/i18n-types'
import type { PPTTextElement, Slide, SlideTheme, TextAlign, TextInset } from '@/types/slides'
import { computePlaceholderMinBoxHeight } from '@/utils/placeholderLayout'

export interface StarterPresentationOptions {
  title?: string
  titlePlaceholder?: string
  subtitlePlaceholder?: string
  bodyPlaceholder?: string
  /** Title-slide (cover) title size. PowerPoint default ≈ 40. */
  titleFontSize?: number
  /** Title-slide (cover) subtitle size. PowerPoint default ≈ 20. */
  subtitleFontSize?: number
  /** Content-slide title size. PowerPoint default ≈ 28. */
  contentTitleFontSize?: number
  /** Content-slide body (level 1) size. PowerPoint default ≈ 20. */
  bodyFontSize?: number
  placeholderColor?: string
  fontName?: string
  fontColor?: string
  backgroundColor?: string
}

export interface StarterPresentationDocument {
  title: string
  slides: Slide[]
  theme?: Partial<SlideTheme>
}

const DEFAULT_PLACEHOLDER_INSET: TextInset = [10, 10, 10, 10]
const DEFAULT_PLACEHOLDER_LINE_HEIGHT = 1.2

const textPlaceholder = (
  textType: 'title' | 'subtitle' | 'content',
  placeholder: string,
  props: {
    left: number
    top: number
    width: number
    height?: number
    lines?: number
    fontSize: number
    color: string
    fontColor: string
    fontName: string
    align?: TextAlign
    fixedHeight?: boolean
    vAlign?: PPTTextElement['vAlign']
  },
): PPTTextElement => {
  const inset = DEFAULT_PLACEHOLDER_INSET
  const lineHeight = DEFAULT_PLACEHOLDER_LINE_HEIGHT
  const height = props.height ?? computePlaceholderMinBoxHeight({
    placeholderFontSize: props.fontSize,
    lineHeight,
    inset,
    lines: props.lines ?? 1,
  })

  return {
    type: 'text',
    id: nanoid(10),
    left: props.left,
    top: props.top,
    width: props.width,
    height,
    rotate: 0,
    content: '',
    defaultFontName: props.fontName,
    defaultColor: props.fontColor,
    placeholder,
    placeholderFontSize: props.fontSize,
    placeholderColor: props.color,
    placeholderAlign: props.align ?? 'center',
    textType,
    lineHeight,
    inset,
    placeholderLayoutHeight: height,
    ...(props.fixedHeight !== undefined ? { fixedHeight: props.fixedHeight } : {}),
    ...(props.vAlign !== undefined ? { vAlign: props.vAlign } : {}),
  }
}

const defaultThemeColors = ['#5b9bd5', '#ed7d31', '#a5a5a5', '#ffc000', '#4472c4', '#70ad47']

const normalizeStarterOptions = (LL: TranslationFunctions, options: StarterPresentationOptions = {}) => {
  const fontName = options.fontName ?? ''
  const placeholderColor = options.placeholderColor ?? '#9aa3ad'
  const fontColor = options.fontColor ?? '#333'
  const backgroundColor = options.backgroundColor ?? '#fff'

  return {
    title: options.title ?? LL.editor.presentation.untitled(),
    titlePlaceholder: options.titlePlaceholder ?? LL.editor.presentation.clickToAddTitle(),
    subtitlePlaceholder: options.subtitlePlaceholder ?? LL.editor.presentation.clickToAddSubtitle(),
    bodyPlaceholder: options.bodyPlaceholder ?? LL.editor.presentation.clickToAddText(),
    titleFontSize: options.titleFontSize ?? 40,
    subtitleFontSize: options.subtitleFontSize ?? 20,
    contentTitleFontSize: options.contentTitleFontSize ?? 28,
    bodyFontSize: options.bodyFontSize ?? 20,
    placeholderColor,
    fontColor,
    fontName,
    backgroundColor,
  }
}

export const buildTitleSlide = (
  LL: TranslationFunctions,
  options: StarterPresentationOptions = {},
): Slide => {
  const normalized = normalizeStarterOptions(LL, options)

  return {
    id: nanoid(10),
    type: 'cover',
    background: { type: 'solid', color: normalized.backgroundColor },
    elements: [
      textPlaceholder('title', normalized.titlePlaceholder, {
        left: 120,
        top: 155,
        width: 760,
        fontSize: normalized.titleFontSize,
        color: normalized.placeholderColor,
        fontColor: normalized.fontColor,
        fontName: normalized.fontName,
      }),
      textPlaceholder('subtitle', normalized.subtitlePlaceholder, {
        left: 160,
        top: 275,
        width: 680,
        fontSize: normalized.subtitleFontSize,
        color: normalized.placeholderColor,
        fontColor: normalized.fontColor,
        fontName: normalized.fontName,
      }),
    ],
  }
}

export const buildContentSlide = (
  LL: TranslationFunctions,
  options: StarterPresentationOptions = {},
): Slide => {
  const normalized = normalizeStarterOptions(LL, options)

  return {
    id: nanoid(10),
    type: 'content',
    background: { type: 'solid', color: normalized.backgroundColor },
    elements: [
      textPlaceholder('title', normalized.titlePlaceholder, {
        left: 85,
        top: 55,
        width: 830,
        lines: 2,
        fontSize: normalized.contentTitleFontSize,
        color: normalized.placeholderColor,
        fontColor: normalized.fontColor,
        fontName: normalized.fontName,
        align: 'left',
        vAlign: 'middle',
      }),
      textPlaceholder('content', normalized.bodyPlaceholder, {
        left: 85,
        top: 165,
        width: 830,
        lines: 11,
        fontSize: normalized.bodyFontSize,
        color: normalized.placeholderColor,
        fontColor: normalized.fontColor,
        fontName: normalized.fontName,
        align: 'left',
      }),
    ],
  }
}

export const buildStarterPresentation = (
  LL: TranslationFunctions,
  options: StarterPresentationOptions = {},
): StarterPresentationDocument => {
  const normalized = normalizeStarterOptions(LL, options)

  return {
    title: normalized.title,
    slides: [buildTitleSlide(LL, options)],
    theme: {
      backgroundColor: normalized.backgroundColor,
      themeColors: defaultThemeColors,
      fontColor: normalized.fontColor,
      fontName: normalized.fontName,
    },
  }
}
