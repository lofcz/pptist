<template>
  <div 
    class="editable-element-text" 
    :class="{ 'lock': elementInfo.lock }"
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
        :class="{ 'placeholder-element': elementInfo.placeholder, 'show-placeholder': showPlaceholder }"
        ref="elementRef"
        :style="{
          width: elementInfo.vertical ? 'auto' : elementInfo.width + 'px',
          height: elementInfo.vertical ? elementInfo.height + 'px' : 'auto',
          backgroundColor: elementInfo.fill,
          opacity: elementInfo.opacity,
          textShadow: shadowStyle,
          lineHeight: elementInfo.lineHeight,
          letterSpacing: (elementInfo.wordSpace || 0) + 'px',
          color: elementInfo.defaultColor,
          fontFamily: elementInfo.defaultFontName,
          fontSize: editorFontSize,
          textAlign: elementInfo.placeholder ? (elementInfo.placeholderAlign ?? 'center') : undefined,
          writingMode: elementInfo.vertical ? 'vertical-rl' : 'horizontal-tb',
          padding: `${inset[0]}px ${inset[1]}px ${inset[2]}px ${inset[3]}px`,
          minHeight: isEmptyPlaceholder ? elementInfo.height + 'px' : undefined,
          '--paragraphSpace': `${elementInfo.paragraphSpace === undefined ? 5 : elementInfo.paragraphSpace}px`,
        }"
        v-contextmenu="contextmenus"
        @mousedown="$event => handleSelectElement($event)"
        @touchstart="$event => handleSelectElement($event)"
      >
        <ElementOutline
          :width="elementInfo.width"
          :height="elementInfo.height"
          :outline="elementInfo.outline"
        />
        <ProsemirrorEditor
          class="text"
          :elementId="elementInfo.id"
          :defaultColor="elementInfo.defaultColor"
          :defaultFontName="elementInfo.defaultFontName"
          :editable="!elementInfo.lock"
          :value="elementInfo.content"
          ref="prosemirrorEditorRef"
          @update="({ value, ignore }) => updateContent(value, ignore)"
          @mousedown="$event => handleSelectElement($event, false)"
          @focus="editorFocused = true"
          @blur="editorFocused = false"
          @emptyChange="empty => editorEmpty = empty"
        />
        <TextPlaceholder
          v-if="showPlaceholder"
          :label="elementInfo.placeholder!"
          :contentType="elementInfo.textType ?? 'content'"
          :fontSize="elementInfo.placeholderFontSize ?? 20"
          :color="placeholderColor"
          :align="elementInfo.placeholderAlign ?? 'center'"
          @activate="activatePlaceholder"
        />

        <!-- 当字号过大且行高较小时，会出现文字高度溢出的情况，导致拖拽区域无法被选中，因此添加了以下节点避免该情况 -->
        <div class="drag-handler top"></div>
        <div class="drag-handler bottom"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { debounce } from 'lodash'
import tinycolor from 'tinycolor2'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTTextElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import useElementShadow from '@/views/components/element/hooks/useElementShadow'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import emitter, { EmitterEvents } from '@/utils/emitter'

import ElementOutline from '@/views/components/element/ElementOutline.vue'
import ProsemirrorEditor from '@/views/components/element/ProsemirrorEditor.vue'
import TextPlaceholder from './TextPlaceholder.vue'

const props = defineProps<{
  elementInfo: PPTTextElement
  selectElement: (e: MouseEvent | TouchEvent, element: PPTTextElement, canMove?: boolean) => void
  contextmenus: () => ContextmenuItem[] | null
}>()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { handleElementId, isScaling } = storeToRefs(mainStore)
const { currentSlide, theme } = storeToRefs(slidesStore)

const { addHistorySnapshot } = useHistorySnapshot()

const elementRef = ref<HTMLElement | null>(null)
const prosemirrorEditorRef = ref<InstanceType<typeof ProsemirrorEditor> | null>(null)
const editorFocused = ref(false)

const shadow = computed(() => props.elementInfo.shadow)
const { shadowStyle } = useElementShadow(shadow)
const inset = computed(() => props.elementInfo.inset || [10, 10, 10, 10])
const computeEmpty = (html: string) => {
  return !html.replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
}
// 由 ProsemirrorEditor 实时（非防抖）回传，确保占位符显隐与正文严格互斥，避免聚焦/失焦时两者同时渲染
const editorEmpty = ref(computeEmpty(props.elementInfo.content))
watch(() => props.elementInfo.content, content => {
  if (editorFocused.value) return
  editorEmpty.value = computeEmpty(content)
})
// 是否为“空占位”元素：仅用于布局（保持设计高度、跳过自动测高），与聚焦状态无关
const isEmptyPlaceholder = computed(() => !!props.elementInfo.placeholder && editorEmpty.value)
// 占位浮层是否可见：聚焦时隐藏，避免与编辑器光标/正文重叠
const showPlaceholder = computed(() => isEmptyPlaceholder.value && !editorFocused.value)
const editorFontSize = computed(() => {
  if (props.elementInfo.placeholder) return `${props.elementInfo.placeholderFontSize ?? 20}px`
  return undefined
})

// 占位提示颜色自适应：占位“幽灵文字”需在任意主题/背景下保持可读。
// 取当前页有效背景色（纯色/渐变中点，缺省回退主题背景），若作者预设的占位
// 色已满足最小对比度则沿用（保留浅色背景下的传统灰）；否则按正文色（或主题字色）
// 派生一个达标的半透明色，正文色仍不达标时再回退黑/白冲淡色。
const PLACEHOLDER_FALLBACK_COLOR = '#9aa3ad'
const MIN_PLACEHOLDER_CONTRAST = 2.2

const slideBackgroundColor = computed(() => {
  const background = currentSlide.value?.background
  let raw: string | undefined
  if (background?.type === 'solid') raw = background.color
  else if (background?.type === 'gradient') {
    const stops = background.gradient?.colors ?? []
    const midStop = stops.length
      ? stops.reduce((closest, stop) => (Math.abs(stop.pos - 50) < Math.abs(closest.pos - 50) ? stop : closest))
      : undefined
    raw = midStop?.color
  }
  // 图片背景无法可靠取色，回退到主题背景色。
  if (!raw) raw = theme.value?.backgroundColor
  if (!raw) return null
  const color = tinycolor(raw)
  return color.isValid() ? color : null
})

const placeholderColor = computed(() => {
  const background = slideBackgroundColor.value
  const authored = props.elementInfo.placeholderColor
  if (!background) return authored ?? PLACEHOLDER_FALLBACK_COLOR

  if (authored) {
    const color = tinycolor(authored)
    if (color.isValid() && tinycolor.readability(color, background) >= MIN_PLACEHOLDER_CONTRAST) return authored
  }

  const textColor = tinycolor(props.elementInfo.defaultColor || theme.value?.fontColor || '#333333')
  const legible = textColor.isValid() && tinycolor.readability(textColor, background) >= MIN_PLACEHOLDER_CONTRAST
    ? textColor
    : tinycolor(background.isLight() ? '#000000' : '#ffffff')
  return legible.setAlpha(0.5).toRgbString()
})

const handleSelectElement = (e: MouseEvent | TouchEvent, canMove = true) => {
  if (props.elementInfo.lock) return
  e.stopPropagation()

  props.selectElement(e, props.elementInfo, canMove)
}

const activatePlaceholder = (e: MouseEvent) => {
  handleSelectElement(e, false)
  editorFocused.value = true
  nextTick(() => {
    prosemirrorEditorRef.value?.focus()
    // 与 PowerPoint 一致：点进内容占位符立即进入无序列表（光标停在首个项目符号处）
    if (props.elementInfo.textType === 'content') {
      emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, {
        target: props.elementInfo.id,
        action: { command: 'bulletList' },
      })
    }
  })
}

// 监听文本元素的尺寸变化，当高度变化时，更新高度到vuex
// 如果高度变化时正处在缩放操作中，则等待缩放操作结束后再更新
const realHeightCache = ref(-1)
const realWidthCache = ref(-1)

watch(isScaling, () => {
  if (handleElementId.value !== props.elementInfo.id) return

  if (!isScaling.value) {
    if (!props.elementInfo.vertical && realHeightCache.value !== -1) {
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { height: realHeightCache.value },
      })
      realHeightCache.value = -1
    }
    if (props.elementInfo.vertical && realWidthCache.value !== -1) {
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { width: realWidthCache.value },
      })
      realWidthCache.value = -1
    }
  }
})

watch(() => props.elementInfo.inset, () => {
  nextTick(() => {
    if (!elementRef.value) return

    if (!props.elementInfo.vertical && props.elementInfo.height !== elementRef.value.offsetHeight) {
      if (isEmptyPlaceholder.value) return
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { height: elementRef.value.offsetHeight },
      })
    }
    if (props.elementInfo.vertical && props.elementInfo.width !== elementRef.value.offsetWidth) {
      if (isEmptyPlaceholder.value) return
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { width: elementRef.value.offsetWidth },
      })
    }
  })
})

const updateTextElementHeight = (entries: ResizeObserverEntry[]) => {
  const contentRect = entries[0].contentRect
  if (!elementRef.value) return

  const realHeight = contentRect.height + inset.value[0] + inset.value[2]
  const realWidth = contentRect.width + inset.value[1] + inset.value[3]
  if (isEmptyPlaceholder.value) return

  if (!props.elementInfo.vertical && props.elementInfo.height !== realHeight) {
    if (!isScaling.value) {
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { height: realHeight },
      })
    }
    else realHeightCache.value = realHeight
  }
  if (props.elementInfo.vertical && props.elementInfo.width !== realWidth) {
    if (!isScaling.value) {
      slidesStore.updateElement({
        id: props.elementInfo.id,
        props: { width: realWidth },
      })
    }
    else realWidthCache.value = realWidth
  }
}
const resizeObserver = new ResizeObserver(updateTextElementHeight)

onMounted(() => {
  if (elementRef.value) resizeObserver.observe(elementRef.value)
})
onUnmounted(() => {
  if (elementRef.value) resizeObserver.unobserve(elementRef.value)
})

const updateContent = (content: string, ignore = false) => {
  slidesStore.updateElement({
    id: props.elementInfo.id,
    props: { content },
  })
  
  if (!ignore) addHistorySnapshot()
}

const checkEmptyText = debounce(function() {
  if (props.elementInfo.placeholder) return
  const pureText = props.elementInfo.content.replace(/<[^>]+>/g, '')
  if (!pureText) slidesStore.deleteElement(props.elementInfo.id)
}, 300, { trailing: true })

const isHandleElement = computed(() => handleElementId.value === props.elementInfo.id)
watch(isHandleElement, () => {
  if (!isHandleElement.value) checkEmptyText()
})
</script>

<style lang="scss" scoped>
.editable-element-text {
  position: absolute;

  &.lock .element-content {
    cursor: default;
  }
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
  cursor: move;

  .text {
    position: relative;
  }

  &.placeholder-element {
    .text {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 100%;
    }

    ::v-deep(.ProseMirror) {
      width: 100%;
      min-height: 1.2em;
      font-size: inherit;
      caret-color: currentColor;
    }
  }

  // 占位提示浮层显示时（未聚焦且为空），隐藏富文本编辑器本体，
  // 确保任何残留的空列表/段落标记都不会与占位浮层叠加出现“重影”
  &.show-placeholder .text {
    visibility: hidden;
  }

  ::v-deep(a) {
    cursor: text;
  }
}
.drag-handler {
  height: 10px;
  position: absolute;
  left: 0;
  right: 0;

  &.top {
    top: 0;
  }
  &.bottom {
    bottom: 0;
  }
}
</style>
