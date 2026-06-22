import { computed, onMounted, ref, watch, type CSSProperties, type Ref } from 'vue'
import { setLocale as setPretextLocale } from '@chenglou/pretext'
import type { PPTTextElement, TextInset } from '@/types/slides'
import { useI18nContext } from '@/i18n/useI18nContext'
import { BULLET_INDENT, extractFitBlocksFromHtml, fitScaleForBlocks, type TextFitAlign } from '@/utils/textFit'

const DEFAULT_INSET: TextInset = [10, 10, 10, 10]
const DEFAULT_LINE_HEIGHT = 1.5
const DEFAULT_PARAGRAPH_SPACE = 5
const MIN_FIT_SCALE = 0.2

/**
 * Auto-fit a fixed-size text box so its content never overflows.
 *
 * Only fixed-height (`fixedHeight`) text boxes are constrained — they have a
 * locked region instead of growing to fit. We measure the rendered content with
 * pretext (the same engine the agentic layout builder uses) and return a uniform
 * scale (<= 1) plus a transform-origin that respects the box's horizontal
 * alignment and `vAlign`. The renderer applies these to the text node as a CSS
 * transform, shrinking the type down from its authored size only as far as
 * needed. Vertical (top-to-bottom) text is left unscaled.
 */
export default (elementInfo: Ref<PPTTextElement>) => {
  const { locale } = useI18nContext()
  const fitScale = ref(1)
  const fitAlign = ref<TextFitAlign>('left')

  const compute = () => {
    const el = elementInfo.value
    if (!el.fixedHeight || el.vertical || !el.content) {
      fitScale.value = 1
      return
    }

    const inset = el.inset || DEFAULT_INSET
    const innerWidth = el.width - inset[1] - inset[3]
    const innerHeight = el.height - inset[0] - inset[2]

    setPretextLocale(locale.value)
    const { blocks, align } = extractFitBlocksFromHtml(el.content, {
      defaultFontFamily: el.defaultFontName || 'inherit',
    })
    fitAlign.value = align
    fitScale.value = fitScaleForBlocks(blocks, {
      innerWidth,
      innerHeight,
      lineHeight: el.lineHeight ?? DEFAULT_LINE_HEIGHT,
      blockSpace: el.paragraphSpace ?? DEFAULT_PARAGRAPH_SPACE,
      bulletIndent: BULLET_INDENT,
      minScale: MIN_FIT_SCALE,
    })
  }

  watch(
    () => [
      elementInfo.value.content,
      elementInfo.value.width,
      elementInfo.value.height,
      elementInfo.value.fixedHeight,
      elementInfo.value.vertical,
      elementInfo.value.lineHeight,
      elementInfo.value.paragraphSpace,
      elementInfo.value.defaultFontName,
      elementInfo.value.inset,
      locale.value,
    ],
    compute,
    { immediate: true, deep: true },
  )

  // Re-measure once webfonts finish loading: their real metrics can differ from
  // the fallback used on the first synchronous pass.
  onMounted(() => {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(compute).catch(() => {})
    }
  })

  const fitStyle = computed<CSSProperties>(() => {
    if (fitScale.value >= 1) return {}
    const vAlign = elementInfo.value.vAlign
    // Anchor the shrink so the box's alignment is preserved: text stays pinned to
    // its horizontal edge and its `vAlign` corner as it scales below 1.
    const vertical = vAlign === 'middle' ? 'center' : vAlign === 'bottom' ? 'bottom' : 'top'
    const horizontal = fitAlign.value === 'center' ? 'center' : fitAlign.value === 'right' ? 'right' : 'left'
    return {
      transform: `scale(${fitScale.value})`,
      transformOrigin: `${horizontal} ${vertical}`,
    }
  })

  return {
    fitScale,
    fitStyle,
  }
}
