<template>
  <MoveablePanel 
    class="symbol-panel" 
    :width="350" 
    :height="560" 
    :left="-270" 
    :top="90"
    :contentStyle="{
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }"
  >
    <div class="close-btn" @click="close()" @mousedown.stop><i-icon-park-outline:close /></div>
    <Tabs 
      :tabs="tabs" 
      v-model:value="selectedSymbolKey" 
      :tabsStyle="{ marginBottom: '8px', width: 'calc(100% - 32px)' }" 
    />

    <div class="emoji-types" v-if="selectedSymbolKey === 'emoji'">
      <div class="emoji-type" 
        :class="{'active': selectedEmojiTypeIndex === index}"
        v-for="(item, index) in emojiTypeList"
        :key="index"
        @click="selectedEmojiTypeIndex = index"
      >{{item}}</div>
    </div>

    <div class="pool" ref="poolRef">
      <div class="symbol-group" v-for="(group, groupIndex) in symbolPool" :key="groupIndex">
        <div class="symbol-item" v-for="(item, index) in group" :key="index" @click="selectSymbol(item)">
          <div class="symbol">{{item}}</div>
        </div>
      </div>
    </div>
  </MoveablePanel>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store/main'
import { SYMBOL_LIST } from '@/configs/symbol'
import { useI18nContext } from '@/i18n/useI18nContext'
import emitter, { EmitterEvents } from '@/utils/emitter'
import { queryPptist } from '@/utils/portal'
import useCreateElement from '@/hooks/useCreateElement'
import MoveablePanel from '@/components/MoveablePanel.vue'
import Tabs from '@/components/Tabs.vue'

const { LL } = useI18nContext()

const mainStore = useMainStore()
const { handleElement } = storeToRefs(mainStore)

const { createTextElement } = useCreateElement()

const poolRef = ref<HTMLElement | null>(null)
const selectedSymbolKey = ref(SYMBOL_LIST[0].key)
const emojiTypeList = computed(() => {
  const types = LL.value.editor.symbolPanel.emojiTypes
  return [
    types.expression(),
    types.action(),
    types.faunaFlora(),
    types.food(),
    types.travel(),
    types.activity(),
    types.objects(),
    types.symbols(),
  ]
})
const selectedEmojiTypeIndex = ref(0)
const symbolPool = computed(() => {
  const selectedSymbol = SYMBOL_LIST.find(item => item.key === selectedSymbolKey.value)

  if (!selectedSymbol) return []

  if (selectedSymbol.key === 'emoji') {
    const emojiList = selectedSymbol.children[selectedEmojiTypeIndex.value]
    return [emojiList]
  }
  return selectedSymbol.children
})

const tabs = computed(() => {
  const symbols = LL.value.configs.symbols
  const labels: Record<string, () => string> = {
    letter: symbols.letter,
    number: symbols.number,
    math: symbols.math,
    arrow: symbols.arrow,
    graph: symbols.graph,
    emoji: symbols.emoji,
  }
  return SYMBOL_LIST.map(item => ({
    key: item.key,
    label: labels[item.key](),
  }))
})

watch([selectedEmojiTypeIndex, selectedSymbolKey], () => {
  if (poolRef.value) poolRef.value.scrollTo(0, 0)
})

const selectSymbol = (value: string) => {
  if (handleElement.value?.type === 'text') {
    emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, { action: { command: 'insert', value } })
    return
  }
  if (handleElement.value?.type === 'shape') {
    const editableElRef = queryPptist(`#editable-element-${handleElement.value.id} .ProseMirror`)
    if (editableElRef) {
      emitter.emit(EmitterEvents.RICH_TEXT_COMMAND, { action: { command: 'insert', value } })
      return
    }
  }
  if (handleElement.value?.type === 'table') {
    const editableElRef = queryPptist(`#editable-element-${handleElement.value.id} .cell.active .cell-text`)
    if (editableElRef) {
      document.execCommand('insertText', false, value)
      return
    }
  }

  createTextElement({
    left: 0,
    top: 0,
    width: 200,
    height: 50,
  }, { content: value })
}

const close = () => {
  mainStore.setSymbolPanelState(false)
}
</script>

<style lang="scss" scoped>
.symbol-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  .emoji-types {
    font-size: 12px;
    display: flex;
    align-items: center;
    margin-bottom: 3px;

    .emoji-type {
      padding: 2px 4px;
      text-align: center;
      border-radius: 4px;
      user-select: none;
      flex-shrink: 0;
      cursor: pointer;

      &.active {
        color: $themeColor;
        background-color: rgba($color: $themeColor, $alpha:.05);
        font-weight: 700;
      }

      & + .emoji-type {
        margin-left: 4px;
      }
    }
  }

  .pool {
    padding: 5px 10px 0;
    margin: 0 -10px;
    flex: 1;
    font-size: 18px;
    user-select: none;

    @include overflow-overlay();
  }
  .symbol-group {
    @include flex-grid-layout();

    & + .symbol-group {
      border-top: 1px solid #f0f0f0;
      padding-top: 10px;
      margin-top: 8px;
    }
  }
  .symbol-item {
    @include flex-grid-layout-children(8, 12%);

    height: 38px;
    position: relative;
    border: 1px solid $borderColor;
    cursor: pointer;

    &:hover {
      color: $themeColor;
      border-color: $themeColor;
      transition: all $transitionDelay;
    }

    .symbol {
      @include absolute-0();

      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #fff;
    }
  }
}
.close-btn {
  width: 32px;
  height: 32px;
  position: absolute;
  top: 8px;
  right: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    color: $themeColor;
  }
}
</style>
