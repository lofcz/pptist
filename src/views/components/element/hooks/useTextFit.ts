import { computed, onMounted, ref, watch, type CSSProperties, type Ref } from 'vue'
import { setLocale as setPretextLocale } from '@chenglou/pretext'
import type { PPTTextElement, TextInset } from '@/types/slides'
import { useI18nContext } from '@/i18n/useI18nContext'
import { BULLET_INDENT, DEFAULT_TEXT_FONT_SIZE, extractFitBlocksFromHtml, fitFontScaleForBlocks, scaleHtmlFontSizes } from '@/utils/textFit'

const DEFAULT_INSET: TextInset = [10, 10, 10, 10]
const DEFAULT_LINE_HEIGHT = 1.5
const DEFAULT_PARAGRAPH_SPACE = 5
const MIN_FIT_SCALE = 0.2
// The real stack a text element renders with when no font is set ($textElementFont
// in variable.scss). pretext feeds this to `ctx.font`, which silently rejects an
// invalid family (e.g. `inherit`) and would freeze measurement at 10px — so the
// fallback must be a concrete, valid font stack.
const DEFAULT_TEXT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif'

function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Auto-fit a fixed-size text box so its content never overflows — by computing a
 * real font size with pretext, not a CSS transform.
 *
 * Only fixed-height (`fixedHeight`) boxes are constrained; normal boxes grow to
 * fit. We measure the wrapped content with pretext (the same engine the agentic
 * layout builder uses) and binary-search the largest uniform font factor at which
 * it still fits. The renderer then applies that factor as actual font sizes:
 *   - text with an explicit inline size renders from `fittedContent` (sizes
 *     rewritten to `size * factor`);
 *   - text using the default size shrinks via the `--text-fit-base-size` CSS
 *     variable (the computed px value), since `.ProseMirror` hardcodes 16px.
 * Vertical (top-to-bottom) text is left untouched.
 */
export default (elementInfo: Ref<PPTTextElement>, liveContent?: Ref<string | null>) => {
  const { locale } = useI18nContext()
  const fitScale = ref(1)

  // While editing, measure the live editor HTML; otherwise the committed content.
  const measuredContent = () => {
    const live = liveContent?.value
    return live !== null && live !== undefined ? live : elementInfo.value.content
  }

  const enabled = computed(() => {
    const el = elementInfo.value
    return !!el.fixedHeight && !el.vertical && !!measuredContent()
  })

  const compute = () => {
    const el = elementInfo.value
    const content = measuredContent()
    if (!el.fixedHeight || el.vertical || !content) {
      fitScale.value = 1
      return
    }

    const inset = el.inset || DEFAULT_INSET
    const innerWidth = el.width - inset[1] - inset[3]
    const innerHeight = el.height - inset[0] - inset[2]

    setPretextLocale(locale.value)
    const { blocks } = extractFitBlocksFromHtml(content, {
      defaultFontFamily: el.defaultFontName || DEFAULT_TEXT_FONT_FAMILY,
    })
    fitScale.value = fitFontScaleForBlocks(blocks, {
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
      liveContent?.value,
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

  // Content with inline sizes rewritten to the fitted size (for static renders).
  const fittedContent = computed(() => {
    const content = measuredContent()
    if (!enabled.value || fitScale.value >= 1) return content
    return scaleHtmlFontSizes(content, fitScale.value)
  })

  // CSS variable holding the fitted *default* size in px. `.ProseMirror` reads
  // it (with a 16px fallback) so default-size text shrinks without a transform.
  const fitVars = computed<CSSProperties>(() => {
    if (!enabled.value || fitScale.value >= 1) return {}
    return { '--text-fit-base-size': `${roundTo(DEFAULT_TEXT_FONT_SIZE * fitScale.value)}px` }
  })

  return {
    fitScale,
    fittedContent,
    fitVars,
  }
}
