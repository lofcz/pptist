<template>
  <div class="text-style-panel">
    <div class="preset-style">
      <div 
        class="preset-style-item"
        v-for="item in presetStyles"
        :key="item.key"
        @click="emitBatchRichTextCommand(item.cmd)"
      >
        <FitText
          :text="item.label"
          :max-font-size="item.preview.maxFontSize"
          :min-font-size="11"
          :font-weight="item.preview.fontWeight"
          :font-style="item.preview.fontStyle"
          :text-decoration="item.preview.textDecoration"
          :max-lines="1"
          :line-height="1.15"
        />
      </div>
    </div>

    <Divider />
    <RichTextBase />
    <Divider />

    <div class="row">
      <div style="width: 40%;">{{ LL.editor.stylePanel.shared.lineHeight() }}</div>
      <Select style="width: 60%;"
        :value="lineHeight || 1"
        @update:value="value => updateText({ lineHeight: value as number })"
        :options="lineHeightSelectOptions"
      >
        <template #icon>
          <i-icon-park-outline:row-height />
        </template>
      </Select>
    </div>
    <div class="row">
      <div style="width: 40%;">{{ LL.editor.stylePanel.shared.paragraphSpace() }}</div>
      <Select style="width: 60%;"
        :value="paragraphSpace || 0"
        @update:value="value => updateText({ paragraphSpace: value as number })"
        :options="paragraphSpaceSelectOptions"
      >
        <template #icon>
          <i-icon-park-outline:vertical-spacing-between-items />
        </template>
      </Select>
    </div>
    <div class="row">
      <div style="width: 40%;">{{ LL.editor.stylePanel.shared.wordSpace() }}</div>
      <Select style="width: 60%;"
        :value="wordSpace || 0"
        @update:value="value => updateText({ wordSpace: value as number })"
        :options="wordSpaceSelectOptions"
      >
        <template #icon>
          <i-icon-park-outline:fullwidth />
        </template>
      </Select>
    </div>
    <div class="row">
      <div style="width: 40%;">{{ LL.editor.stylePanel.text.textBoxFill() }}</div>
      <Popover trigger="click" style="width: 60%;">
        <template #content>
          <ColorPicker
            :modelValue="fill"
            @update:modelValue="value => updateText({ fill: value })"
          />
        </template>
        <ColorButton :color="fill" />
      </Popover>
    </div>

    <Divider />
    
    <div class="row">
      <NumberInput
        :min="0"
        :max="50"
        :value="inset[0]"
        @update:value="value => updateInset(0, value)"
        style="width: 45%;"
      >
        <template #prefix>{{ LL.editor.stylePanel.shared.paddingTop() }}</template>
      </NumberInput>
      <div style="width: 10%;"></div>
      <NumberInput
        :min="0"
        :max="50"
        :value="inset[2]"
        @update:value="value => updateInset(2, value)"
        style="width: 45%;"
      >
        <template #prefix>{{ LL.editor.stylePanel.shared.paddingBottom() }}</template>
      </NumberInput>
    </div>
    <div class="row">
      <NumberInput
        :min="0"
        :max="50"
        :value="inset[3]"
        @update:value="value => updateInset(3, value)"
        style="width: 45%;"
      >
        <template #prefix>{{ LL.editor.stylePanel.shared.paddingLeft() }}</template>
      </NumberInput>
      <div style="width: 10%;"></div>
      <NumberInput
        :min="0"
        :max="50"
        :value="inset[1]"
        @update:value="value => updateInset(1, value)"
        style="width: 45%;"
      >
        <template #prefix>{{ LL.editor.stylePanel.shared.paddingRight() }}</template>
      </NumberInput>
    </div>

    <Divider />
    <ElementOutline />
    <Divider />
    <ElementShadow />
    <Divider />
    <ElementOpacity />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18nContext } from '@/i18n/useI18nContext'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTTextElement, TextInset } from '@/types/slides'
import emitter, { EmitterEvents, type RichTextAction } from '@/utils/emitter'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import ElementOpacity from '../common/ElementOpacity.vue'
import ElementOutline from '../common/ElementOutline.vue'
import ElementShadow from '../common/ElementShadow.vue'
import RichTextBase from '../common/RichTextBase.vue'
import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'
import Divider from '@/components/Divider.vue'
import NumberInput from '@/components/NumberInput.vue'
import Select from '@/components/Select.vue'
import Popover from '@/components/Popover.vue'
import FitText from '@/components/FitText.vue'

const { LL } = useI18nContext()

// 注意，存在一个未知原因的BUG，如果文本加粗后文本框高度增加，画布的可视区域定位会出现错误
// 因此在执行预置样式命令时，将加粗命令放在尽可能靠前的位置，避免字号增大后再加粗
const presetStyleDefs = [
  {
    key: 'largeTitle',
    preview: {
      maxFontSize: 24,
      fontWeight: 700,
      fontStyle: 'normal',
      textDecoration: 'none',
    },
    cmd: [
      { command: 'clear' },
      { command: 'bold' },
      { command: 'fontsize', value: '66px' },
      { command: 'align', value: 'center' },
    ],
  },
  {
    key: 'smallTitle',
    preview: {
      maxFontSize: 18,
      fontWeight: 700,
      fontStyle: 'normal',
      textDecoration: 'none',
    },
    cmd: [
      { command: 'clear' },
      { command: 'bold' },
      { command: 'fontsize', value: '40px' },
      { command: 'align', value: 'center' },
    ],
  },
  {
    key: 'body',
    preview: {
      maxFontSize: 18,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
    },
    cmd: [
      { command: 'clear' },
      { command: 'fontsize', value: '20px' },
    ],
  },
  {
    key: 'bodySmall',
    preview: {
      maxFontSize: 16,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
    },
    cmd: [
      { command: 'clear' },
      { command: 'fontsize', value: '18px' },
    ],
  },
  {
    key: 'note1',
    preview: {
      maxFontSize: 15,
      fontWeight: 400,
      fontStyle: 'italic',
      textDecoration: 'none',
    },
    cmd: [
      { command: 'clear' },
      { command: 'fontsize', value: '16px' },
      { command: 'em' },
    ],
  },
  {
    key: 'note2',
    preview: {
      maxFontSize: 15,
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'underline',
    },
    cmd: [
      { command: 'clear' },
      { command: 'fontsize', value: '16px' },
      { command: 'underline' },
    ],
  },
]

const presetStyles = computed(() => {
  const labels: Record<(typeof presetStyleDefs)[number]['key'], string> = {
    largeTitle: LL.value.editor.stylePanel.text.presetLargeTitle(),
    smallTitle: LL.value.editor.stylePanel.text.presetSmallTitle(),
    body: LL.value.editor.stylePanel.text.presetBody(),
    bodySmall: LL.value.editor.stylePanel.text.presetBodySmall(),
    note1: LL.value.editor.stylePanel.text.presetNote1(),
    note2: LL.value.editor.stylePanel.text.presetNote2(),
  }
  return presetStyleDefs.map(item => ({
    key: item.key,
    label: labels[item.key],
    preview: item.preview,
    cmd: item.cmd as RichTextAction[],
  }))
})

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(mainStore)

const { addHistorySnapshot } = useHistorySnapshot()

const updateText = (props: Partial<PPTTextElement>) => {
  slidesStore.updateElement({ id: handleElementId.value, props })
  addHistorySnapshot()
}

const fill = ref<string>('#000')
const lineHeight = ref<number>()
const wordSpace = ref<number>()
const paragraphSpace = ref<number>()
const inset = ref<TextInset>([10, 10, 10, 10])

watch(handleElement, () => {
  if (!handleElement.value || handleElement.value.type !== 'text') return

  fill.value = handleElement.value.fill || '#fff'
  lineHeight.value = handleElement.value.lineHeight || 1.5
  wordSpace.value = handleElement.value.wordSpace || 0
  paragraphSpace.value = handleElement.value.paragraphSpace === undefined ? 5 : handleElement.value.paragraphSpace
  inset.value = handleElement.value.inset || [10, 10, 10, 10]
  emitter.emit(EmitterEvents.SYNC_RICH_TEXT_ATTRS_TO_STORE)
}, { deep: true, immediate: true })

const lineHeightOptions = [0.9, 1.0, 1.15, 1.2, 1.4, 1.5, 1.8, 2.0, 2.5, 3.0]
const wordSpaceOptions = [0, 1, 2, 3, 4, 5, 6, 8, 10]
const paragraphSpaceOptions = [0, 5, 10, 15, 20, 25, 30, 40, 50, 80]

const lineHeightSelectOptions = computed(() =>
  lineHeightOptions.map(item => ({
    label: LL.value.editor.stylePanel.shared.lineHeightOption({ value: item }),
    value: item,
  })),
)
const paragraphSpaceSelectOptions = computed(() =>
  paragraphSpaceOptions.map(item => ({
    label: LL.value.editor.stylePanel.shared.pixelValue({ value: item }),
    value: item,
  })),
)
const wordSpaceSelectOptions = computed(() =>
  wordSpaceOptions.map(item => ({
    label: LL.value.editor.stylePanel.shared.pixelValue({ value: item }),
    value: item,
  })),
)

// 发送富文本设置命令（批量）
const emitBatchRichTextCommand = (action: RichTextAction[]) => {
  emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, { action })
}

const updateInset = (index: number, value: number) => {
  const _inset: TextInset = [...inset.value]
  _inset[index] = value
  updateText({ inset: _inset })
}
</script>

<style lang="scss" scoped>
.text-style-panel {
  user-select: none;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.preset-style {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.preset-style-item {
  width: 50%;
  height: 50px;
  border: solid 1px #d6d6d6;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 8px;
  position: relative;
  cursor: pointer;
  transition: all $transitionDelay;

  &:hover {
    border-color: $themeColor;
    color: $themeColor;
    z-index: 1;
  }

  &:nth-child(2n) {
    margin-left: -1px;
  }
  &:nth-child(n+3) {
    margin-top: -1px;
  }
}
</style>
