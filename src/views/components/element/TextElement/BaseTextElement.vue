<template>
  <div 
    class="base-element-text"
    :style="{
      top: elementInfo.top + 'px',
      left: elementInfo.left + 'px',
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div 
        class="element-content"
        :class="{ 'content-title-placeholder': textBoxLayout.flexCenterInLayoutBox }"
        :style="{
          width: elementInfo.vertical && !textBoxLayout.fixedHeight ? 'auto' : elementInfo.width + 'px',
          height: !elementInfo.vertical && !textBoxLayout.fixedHeight ? 'auto' : elementInfo.height + 'px',
          backgroundColor: elementInfo.fill,
          opacity: elementInfo.opacity,
          textShadow: shadowStyle,
          lineHeight: elementInfo.lineHeight,
          letterSpacing: (elementInfo.wordSpace || 0) + 'px',
          color: elementInfo.defaultColor,
          fontFamily: elementInfo.defaultFontName,
          fontSize: elementInfo.placeholder ? `${elementInfo.placeholderFontSize ?? 20}px` : undefined,
          textAlign: elementInfo.placeholder ? (elementInfo.placeholderAlign ?? 'center') : undefined,
          ...(elementInfo.placeholder ? { '--text-fit-base-size': `${elementInfo.placeholderFontSize ?? 20}px` } : {}),
          writingMode: elementInfo.vertical ? 'vertical-rl' : 'horizontal-tb',
          padding: `${inset[0]}px ${inset[1]}px ${inset[2]}px ${inset[3]}px`,
          minHeight: contentTitleLayoutMinHeight ?? placeholderMinHeight,
          display: textBoxLayout.fixedHeight || textBoxLayout.flexCenterInLayoutBox ? 'flex' : undefined,
          flexDirection: textBoxLayout.fixedHeight || textBoxLayout.flexCenterInLayoutBox ? 'column' : undefined,
          justifyContent: contentBoxJustify,
          overflow: textBoxLayout.fixedHeight || outlineBorderRadius ? 'hidden' : undefined,
          borderRadius: outlineBorderRadius,
          '--paragraphSpace': `${elementInfo.paragraphSpace === undefined ? 5 : elementInfo.paragraphSpace}px`,
          ...fitVars,
        }"
      >
        <ElementOutline
          :width="elementInfo.width"
          :height="elementInfo.height"
          :outline="elementInfo.outline"
        />
        <!-- 占位提示仅是编辑态的交互辅助，缩略图/放映视图永远不渲染占位文字（空占位元素正文为空，自然不显示） -->
        <div
          class="text ProseMirror-static"
          :class="{ 'thumbnail': target === 'thumbnail' }"
          v-html="fittedContent"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'
import type { PPTTextElement, Slide } from '@/types/slides'
import ElementOutline from '@/views/components/element/ElementOutline.vue'

import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useTextFit from '@/views/components/element/hooks/useTextFit'
import { useOutlineRadiusCss } from '@/views/components/element/hooks/useElementOutline'
import { getPlaceholderBaselineHeight, resolveTextBoxLayout } from '@/utils/placeholderLayout'

const props = defineProps<{
  elementInfo: PPTTextElement
  target?: string
  slideType?: Slide['type']
}>()

const isEmptyContent = computed(() => {
  return !props.elementInfo.content.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
})

const placeholderMinHeight = computed(() => {
  if (!props.elementInfo.placeholder || !isEmptyContent.value) return undefined
  return `${getPlaceholderBaselineHeight(props.elementInfo)}px`
})

const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)
const inset = computed(() => props.elementInfo.inset || [10, 10, 10, 10])

const elementInfoRef = computed(() => props.elementInfo)
const { fittedContent, fitVars } = useTextFit(elementInfoRef)

const outlineRef = computed(() => props.elementInfo.outline)
const elementWidthRef = computed(() => props.elementInfo.width)
const elementHeightRef = computed(() => props.elementInfo.height)
const outlineBorderRadius = useOutlineRadiusCss(outlineRef, elementWidthRef, elementHeightRef)
const textBoxLayout = computed(() => resolveTextBoxLayout(props.elementInfo, props.slideType))

const fixedContentJustify = computed<CSSProperties['justifyContent']>(() => {
  if (!textBoxLayout.value.fixedHeight) return undefined

  const vAlignMap: Record<NonNullable<PPTTextElement['vAlign']>, CSSProperties['justifyContent']> = {
    top: 'flex-start',
    middle: 'center',
    bottom: 'flex-end',
  }
  return vAlignMap[textBoxLayout.value.vAlign]
})

const contentBoxJustify = computed<CSSProperties['justifyContent']>(() => {
  if (textBoxLayout.value.flexCenterInLayoutBox) return 'center'
  return fixedContentJustify.value
})

const contentTitleLayoutMinHeight = computed(() => {
  if (!textBoxLayout.value.flexCenterInLayoutBox) return undefined
  return `${props.elementInfo.height}px`
})
</script>

<style lang="scss" scoped>
.base-element-text {
  position: absolute;
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  position: relative;
  line-height: 1.5;
  word-break: break-word;
  font-family: $textElementFont;

  .text {
    position: relative;

    &.thumbnail {
      pointer-events: none;
    }
  }

  &.content-title-placeholder .text {
    flex: 0 0 auto;
    width: 100%;
  }

  ::v-deep(.ProseMirror-static) {
    font-size: var(--text-fit-base-size, inherit);
  }
}
</style>
