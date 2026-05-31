<template>
  <MoveablePanel 
    class="notes-panel" 
    :width="300" 
    :height="130" 
    :title="LL.editor.markup.title()" 
    :left="-270" 
    :top="90"
    @close="close()"
  >
    <div class="container">
      <div class="row">
        <div style="width: 40%;">{{ LL.editor.markup.slideTypeLabel() }}</div>
        <Select
          style="width: 60%;"
          :value="slideType"
          @update:value="value => updateSlide(value as SlideType | '')"
          :options="slideTypeOptions"
        />
      </div>
      <div class="row" v-if="handleElement && (handleElement.type === 'text' || (handleElement.type === 'shape' && handleElement.text))">
        <div style="width: 40%;">{{ LL.editor.markup.textTypeLabel() }}</div>
        <Select
          style="width: 60%;"
          :value="textType"
          @update:value="value => updateElement(value as TextType | '')"
          :options="textTypeOptions"
        />
      </div>
      <div class="row" v-else-if="handleElement && handleElement.type === 'image'">
        <div style="width: 40%;">{{ LL.editor.markup.imageTypeLabel() }}</div>
        <Select
          style="width: 60%;"
          :value="imageType"
          @update:value="value => updateElement(value as ImageType | '')"
          :options="imageTypeOptions"
        />
      </div>
      <div class="placeholder" v-else>{{ LL.editor.markup.placeholder() }}</div>
    </div>
  </MoveablePanel>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { ImageType, SlideType, TextType } from '@/types/slides'

import MoveablePanel from '@/components/MoveablePanel.vue'
import Select from '@/components/Select.vue'
import { useI18nContext } from '@/i18n/useI18nContext'

const { LL } = useI18nContext()

const slidesStore = useSlidesStore()
const mainStore = useMainStore()
const { currentSlide } = storeToRefs(slidesStore)
const { handleElement, handleElementId } = storeToRefs(mainStore)

const slideTypeOptions = computed(() => [
  { label: LL.value.editor.markup.unmarked(), value: '' as const },
  { label: LL.value.editor.markup.slideTypes.cover(), value: 'cover' as const },
  { label: LL.value.editor.markup.slideTypes.contents(), value: 'contents' as const },
  { label: LL.value.editor.markup.slideTypes.transition(), value: 'transition' as const },
  { label: LL.value.editor.markup.slideTypes.content(), value: 'content' as const },
  { label: LL.value.editor.markup.slideTypes.end(), value: 'end' as const },
])

const textTypeOptions = computed(() => [
  { label: LL.value.editor.markup.unmarked(), value: '' as const },
  { label: LL.value.editor.markup.textTypes.title(), value: 'title' as const },
  { label: LL.value.editor.markup.textTypes.subtitle(), value: 'subtitle' as const },
  { label: LL.value.editor.markup.textTypes.content(), value: 'content' as const },
  { label: LL.value.editor.markup.textTypes.item(), value: 'item' as const },
  { label: LL.value.editor.markup.textTypes.itemTitle(), value: 'itemTitle' as const },
  { label: LL.value.editor.markup.textTypes.notes(), value: 'notes' as const },
  { label: LL.value.editor.markup.textTypes.header(), value: 'header' as const },
  { label: LL.value.editor.markup.textTypes.footer(), value: 'footer' as const },
  { label: LL.value.editor.markup.textTypes.partNumber(), value: 'partNumber' as const },
  { label: LL.value.editor.markup.textTypes.itemNumber(), value: 'itemNumber' as const },
])

const imageTypeOptions = computed(() => [
  { label: LL.value.editor.markup.unmarked(), value: '' as const },
  { label: LL.value.editor.markup.imageTypes.pageFigure(), value: 'pageFigure' as const },
  { label: LL.value.editor.markup.imageTypes.itemFigure(), value: 'itemFigure' as const },
  { label: LL.value.editor.markup.imageTypes.background(), value: 'background' as const },
])

const slideType = computed(() => currentSlide.value?.type || '')
const textType = computed(() => {
  if (!handleElement.value) return ''
  if (handleElement.value.type === 'text') return handleElement.value.textType || ''
  if (handleElement.value.type === 'shape' && handleElement.value.text) return handleElement.value.text.type || ''
  return ''
})
const imageType = computed(() => {
  if (!handleElement.value) return ''
  if (handleElement.value.type === 'image') return handleElement.value.imageType || ''
  return ''
})

const updateSlide = (type: SlideType | '') => {
  if (type) slidesStore.updateSlide({ type })
  else {
    slidesStore.removeSlideProps({
      id: currentSlide.value.id,
      propName: 'type',
    })
  }
}

const updateElement = (type: TextType | ImageType | '') => {
  if (!handleElement.value) return
  if (handleElement.value.type === 'image') {
    if (type) {
      slidesStore.updateElement({ id: handleElementId.value, props: { imageType: type as ImageType } })
    }
    else {
      slidesStore.removeElementProps({
        id: handleElementId.value,
        propName: 'imageType',
      })
    }
  }
  if (handleElement.value.type === 'text') {
    if (type) {
      slidesStore.updateElement({ id: handleElementId.value, props: { textType: type as TextType } })
    }
    else {
      slidesStore.removeElementProps({
        id: handleElementId.value,
        propName: 'textType',
      })
    }
  }
  if (handleElement.value.type === 'shape') {
    const text = handleElement.value.text
    if (!text) return

    if (type) {
      slidesStore.updateElement({
        id: handleElementId.value,
        props: { text: { ...text, type: type as TextType } },
      })
    }
    else {
      delete text.type
      slidesStore.updateElement({
        id: handleElementId.value,
        props: { text },
      })
    }
  }
}

const close = () => {
  mainStore.setMarkupPanelState(false)
}
</script>

<style lang="scss" scoped>
.notes-panel {
  height: 100%;
  font-size: 12px;
  user-select: none;
}
.container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;

  & + .row {
    margin-top: 5px;
  }
}
.placeholder {
  height: 30px;
  line-height: 30px;
  text-align: center;
  color: #999;
  font-style: italic;
  border: 1px dashed #ccc;
  border-radius: $borderRadius;
  margin-top: 5px;
}
</style>
