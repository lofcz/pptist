<template>
  <div 
    class="editable-element"
    ref="elementRef"
    :id="`editable-element-${elementInfo.id}`"
    :style="{
      zIndex: elementIndex,
    }"
  >
    <component
      :is="currentElementComponent"
      :elementInfo="elementInfo"
      :selectElement="selectElement"
      :contextmenus="contextmenus"
    ></component>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { ElementTypes, type PPTElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'

import useLockElement from '@/hooks/useLockElement'
import useDeleteElement from '@/hooks/useDeleteElement'
import useCombineElement from '@/hooks/useCombineElement'
import useOrderElement from '@/hooks/useOrderElement'
import useAlignElementToCanvas from '@/hooks/useAlignElementToCanvas'
import useCopyAndPasteElement from '@/hooks/useCopyAndPasteElement'
import useSelectElement from '@/hooks/useSelectElement'

import { ElementOrderCommands, ElementAlignCommands } from '@/types/edit'
import { useI18nContext } from '@/i18n/useI18nContext'

import ImageElement from '@/views/components/element/ImageElement/index.vue'
import TextElement from '@/views/components/element/TextElement/index.vue'
import ShapeElement from '@/views/components/element/ShapeElement/index.vue'
import LineElement from '@/views/components/element/LineElement/index.vue'
import ChartElement from '@/views/components/element/ChartElement/index.vue'
import TableElement from '@/views/components/element/TableElement/index.vue'
import LatexElement from '@/views/components/element/LatexElement/index.vue'
import VideoElement from '@/views/components/element/VideoElement/index.vue'
import AudioElement from '@/views/components/element/AudioElement/index.vue'

const { LL } = useI18nContext()

const props = defineProps<{
  elementInfo: PPTElement
  elementIndex: number
  isMultiSelect: boolean
  selectElement: (e: MouseEvent | TouchEvent, element: PPTElement, canMove?: boolean) => void
  openLinkDialog: () => void
}>()

const currentElementComponent = computed<unknown>(() => {
  const elementTypeMap = {
    [ElementTypes.IMAGE]: ImageElement,
    [ElementTypes.TEXT]: TextElement,
    [ElementTypes.SHAPE]: ShapeElement,
    [ElementTypes.LINE]: LineElement,
    [ElementTypes.CHART]: ChartElement,
    [ElementTypes.TABLE]: TableElement,
    [ElementTypes.LATEX]: LatexElement,
    [ElementTypes.VIDEO]: VideoElement,
    [ElementTypes.AUDIO]: AudioElement,
  }
  return elementTypeMap[props.elementInfo.type] || null
})

const { orderElement } = useOrderElement()
const { alignElementToCanvas } = useAlignElementToCanvas()
const { combineElements, uncombineElements } = useCombineElement()
const { deleteElement } = useDeleteElement()
const { lockElement, unlockElement } = useLockElement()
const { copyElement, pasteElement, cutElement } = useCopyAndPasteElement()
const { selectAllElements } = useSelectElement()

const contextmenus = (): ContextmenuItem[] => {
  const canvasMenu = LL.value.canvas.contextMenu
  const alignMenu = LL.value.editor.multiPosition

  if (props.elementInfo.lock) {
    return [{
      text: canvasMenu.unlock(),
      handler: () => unlockElement(props.elementInfo),
    }]
  }

  return [
    {
      text: canvasMenu.cut(),
      subText: 'Ctrl + X',
      handler: cutElement,
    },
    {
      text: canvasMenu.copy(),
      subText: 'Ctrl + C',
      handler: copyElement,
    },
    {
      text: canvasMenu.paste(),
      subText: 'Ctrl + V',
      handler: pasteElement,
    },
    { divider: true },
    {
      text: alignMenu.alignHorizontalCenter(),
      handler: () => alignElementToCanvas(ElementAlignCommands.HORIZONTAL),
      children: [
        { text: canvasMenu.alignCenter(), handler: () => alignElementToCanvas(ElementAlignCommands.CENTER) },
        { text: alignMenu.alignHorizontalCenter(), handler: () => alignElementToCanvas(ElementAlignCommands.HORIZONTAL) },
        { text: alignMenu.alignLeft(), handler: () => alignElementToCanvas(ElementAlignCommands.LEFT) },
        { text: alignMenu.alignRight(), handler: () => alignElementToCanvas(ElementAlignCommands.RIGHT) },
      ],
    },
    {
      text: alignMenu.alignVerticalCenter(),
      handler: () => alignElementToCanvas(ElementAlignCommands.VERTICAL),
      children: [
        { text: canvasMenu.alignCenter(), handler: () => alignElementToCanvas(ElementAlignCommands.CENTER) },
        { text: alignMenu.alignVerticalCenter(), handler: () => alignElementToCanvas(ElementAlignCommands.VERTICAL) },
        { text: alignMenu.alignTop(), handler: () => alignElementToCanvas(ElementAlignCommands.TOP) },
        { text: alignMenu.alignBottom(), handler: () => alignElementToCanvas(ElementAlignCommands.BOTTOM) },
      ],
    },
    { divider: true },
    {
      text: canvasMenu.bringToFront(),
      disable: props.isMultiSelect && !props.elementInfo.groupId,
      handler: () => orderElement(props.elementInfo, ElementOrderCommands.TOP),
      children: [
        { text: canvasMenu.bringToFront(), handler: () => orderElement(props.elementInfo, ElementOrderCommands.TOP) },
        { text: canvasMenu.bringForward(), handler: () => orderElement(props.elementInfo, ElementOrderCommands.UP) },
      ],
    },
    {
      text: canvasMenu.sendToBack(),
      disable: props.isMultiSelect && !props.elementInfo.groupId,
      handler: () => orderElement(props.elementInfo, ElementOrderCommands.BOTTOM),
      children: [
        { text: canvasMenu.sendToBack(), handler: () => orderElement(props.elementInfo, ElementOrderCommands.BOTTOM) },
        { text: canvasMenu.sendBackward(), handler: () => orderElement(props.elementInfo, ElementOrderCommands.DOWN) },
      ],
    },
    { divider: true },
    {
      text: canvasMenu.setLink(),
      handler: props.openLinkDialog,
    },
    {
      text: props.elementInfo.groupId ? alignMenu.ungroup() : alignMenu.group(),
      subText: 'Ctrl + G',
      handler: props.elementInfo.groupId ? uncombineElements : combineElements,
      hide: !props.isMultiSelect,
    },
    {
      text: canvasMenu.selectAll(),
      subText: 'Ctrl + A',
      handler: selectAllElements,
    },
    {
      text: canvasMenu.lock(),
      subText: 'Ctrl + L',
      handler: lockElement,
    },
    {
      text: LL.value.common.delete(),
      subText: 'Delete',
      handler: deleteElement,
    },
  ]
}
</script>