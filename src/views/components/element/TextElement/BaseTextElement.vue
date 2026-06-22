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
        :style="{
          width: elementInfo.vertical && !elementInfo.fixedHeight ? 'auto' : elementInfo.width + 'px',
          height: !elementInfo.vertical && !elementInfo.fixedHeight ? 'auto' : elementInfo.height + 'px',
          backgroundColor: elementInfo.fill,
          opacity: elementInfo.opacity,
          textShadow: shadowStyle,
          lineHeight: elementInfo.lineHeight,
          letterSpacing: (elementInfo.wordSpace || 0) + 'px',
          color: elementInfo.defaultColor,
          fontFamily: elementInfo.defaultFontName,
          fontSize: elementInfo.placeholder ? `${elementInfo.placeholderFontSize ?? 20}px` : undefined,
          textAlign: elementInfo.placeholder ? (elementInfo.placeholderAlign ?? 'center') : undefined,
          writingMode: elementInfo.vertical ? 'vertical-rl' : 'horizontal-tb',
          padding: `${inset[0]}px ${inset[1]}px ${inset[2]}px ${inset[3]}px`,
          minHeight: elementInfo.placeholder ? elementInfo.height + 'px' : undefined,
          display: elementInfo.fixedHeight ? 'flex' : undefined,
          flexDirection: elementInfo.fixedHeight ? 'column' : undefined,
          justifyContent: fixedContentJustify,
          overflow: elementInfo.fixedHeight ? 'hidden' : undefined,
          '--paragraphSpace': `${elementInfo.paragraphSpace === undefined ? 5 : elementInfo.paragraphSpace}px`,
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
          :style="fitStyle"
          v-html="elementInfo.content"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type CSSProperties } from 'vue'
import type { PPTTextElement } from '@/types/slides'
import ElementOutline from '@/views/components/element/ElementOutline.vue'

import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useTextFit from '@/views/components/element/hooks/useTextFit'

const props = defineProps<{
  elementInfo: PPTTextElement
  target?: string
}>()

const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)
const inset = computed(() => props.elementInfo.inset || [10, 10, 10, 10])

const elementInfoRef = computed(() => props.elementInfo)
const { fitStyle } = useTextFit(elementInfoRef)
const fixedContentJustify = computed<CSSProperties['justifyContent']>(() => {
  if (!props.elementInfo.fixedHeight) return undefined

  const vAlignMap: Record<NonNullable<PPTTextElement['vAlign']>, CSSProperties['justifyContent']> = {
    top: 'flex-start',
    middle: 'center',
    bottom: 'flex-end',
  }
  return vAlignMap[props.elementInfo.vAlign || 'top']
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

  ::v-deep(.ProseMirror-static) {
    font-size: inherit;
  }
}
</style>
