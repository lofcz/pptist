<template>
  <div class="editor" v-click-outside="hideMenuInstance">
    <div 
      class="prosemirror-editor"
    ></div>
  
    <div class="menu">
      <button :class="{ 'active': attr?.bold }" @click="execCommand('bold')"><i-icon-park-outline:text-bold /></button>
      <button :class="{ 'active': attr?.em }" @click="execCommand('em')"><i-icon-park-outline:text-italic /></button>
      <button :class="{ 'active': attr?.underline }" @click="execCommand('underline')"><i-icon-park-outline:text-underline /></button>
      <button :class="{ 'active': attr?.strikethrough }" @click="execCommand('strikethrough')"><i-icon-park-outline:strikethrough /></button>
      <Popover trigger="click" style="width: 30%;">
        <template #content>
          <ColorPicker :modelValue="attr?.color" @update:modelValue="value => execCommand('color', value)" />
        </template>
        <button><i-icon-park-outline:text /></button>
      </Popover>
      <Popover trigger="click" style="width: 30%;">
        <template #content>
          <ColorPicker :modelValue="attr?.backcolor" @update:modelValue="value => execCommand('backcolor', value)" />
        </template>
        <button><i-icon-park-outline:high-light /></button>
      </Popover>
      <button :class="{ 'active': attr?.bulletList }" @click="execCommand('bulletList')"><i-icon-park-outline:list /></button>
      <button :class="{ 'active': attr?.orderedList }" @click="execCommand('orderedList')"><i-icon-park-outline:ordered-list /></button>
      <button @click="execCommand('clear')"><i-icon-park-outline:format /></button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { debounce } from 'lodash'
import { useMainStore } from '@/store'
import { useI18nContext } from '@/i18n/useI18nContext'
import type { EditorView } from 'prosemirror-view'
import { initProsemirrorEditor, createDocument } from '@/utils/prosemirror'
import { addMark, autoSelectAll, getTextAttrs, type TextAttrs } from '@/utils/prosemirror/utils'
import { toggleList } from '@/utils/prosemirror/commands/toggleList'
import { getPptistPortalTarget, queryPptist } from '@/utils/portal'
import tippy, { type Instance } from 'tippy.js'

import ColorPicker from '@/components/ColorPicker/index.vue'
import Popover from '@/components/Popover.vue'
import { toggleMark } from 'prosemirror-commands'

const props = defineProps<{
  value: string
}>()

const emit = defineEmits<{
  (event: 'update', payload: string): void
}>()

const mainStore = useMainStore()
const { LL } = useI18nContext()
let editorView: EditorView
let initTimer: ReturnType<typeof setTimeout> | undefined
let initAttempts = 0

const attr = ref<TextAttrs>()

const menuInstance = ref<Instance>()

const hideMenuInstance = () => {
  if (menuInstance.value) menuInstance.value.hide()
}

const handleInput = debounce(function() {
  emit('update', editorView.dom.innerHTML)
}, 300, { trailing: true })

const handleFocus = () => {
  mainStore.setDisableHotkeysState(true)
}

const handleBlur = () => {
  mainStore.setDisableHotkeysState(false)
}

const updateTextContent = () => {
  if (!editorView) return
  const { doc, tr } = editorView.state
  editorView.dispatch(tr.replaceRangeWith(0, doc.content.size, createDocument(props.value)))
}

const handleMouseup = () => {
  const selection = window.getSelection()

  if (
    !selection ||
    !selection.anchorNode ||
    !selection.focusNode ||
    selection.isCollapsed ||
    selection.type === 'Caret' ||
    selection.type === 'None'
  ) return

  const range = selection.getRangeAt(0)

  if (menuInstance.value) {
    attr.value = getTextAttrs(editorView)

    const { x, y, left, top } = range.getBoundingClientRect()

    menuInstance.value.setProps({
      getReferenceClientRect: () => ({
        x, y, left, top,
        height: 0,
        width: 0,
        right: left,
        bottom: top,
      } as DOMRect),
    })
    menuInstance.value.show()
  }
}

const execCommand = (command: string, value?: string) => {
  if (command === 'color' && value) {
    const mark = editorView.state.schema.marks.forecolor.create({ color: value })
    autoSelectAll(editorView)
    addMark(editorView, mark)
  }
  else if (command === 'backcolor' && value) {
    const mark = editorView.state.schema.marks.backcolor.create({ backcolor: value })
    autoSelectAll(editorView)
    addMark(editorView, mark)
  }
  else if (command === 'bold') {
    autoSelectAll(editorView)
    toggleMark(editorView.state.schema.marks.strong)(editorView.state, editorView.dispatch)
  }
  else if (command === 'em') {
    autoSelectAll(editorView)
    toggleMark(editorView.state.schema.marks.em)(editorView.state, editorView.dispatch)
  }
  else if (command === 'underline') {
    autoSelectAll(editorView)
    toggleMark(editorView.state.schema.marks.underline)(editorView.state, editorView.dispatch)
  }
  else if (command === 'strikethrough') {
    autoSelectAll(editorView)
    toggleMark(editorView.state.schema.marks.strikethrough)(editorView.state, editorView.dispatch)
  }
  else if (command === 'bulletList') {
    const { bullet_list: bulletList, list_item: listItem } = editorView.state.schema.nodes
    toggleList(bulletList, listItem, '')(editorView.state, editorView.dispatch)
  }
  else if (command === 'orderedList') {
    const { ordered_list: orderedList, list_item: listItem } = editorView.state.schema.nodes
    toggleList(orderedList, listItem, '')(editorView.state, editorView.dispatch)
  }
  else if (command === 'clear') {
    autoSelectAll(editorView)
    const { $from, $to } = editorView.state.selection
    editorView.dispatch(editorView.state.tr.removeMark($from.pos, $to.pos))
  }

  editorView.focus()
  handleInput()
  attr.value = getTextAttrs(editorView)
}

const initEditor = () => {
  if (editorView) return
  const editorViewEl = queryPptist<HTMLElement>('.remark .prosemirror-editor')
  const menuEl = queryPptist<HTMLElement>('.remark .menu')
  if (!editorViewEl || !menuEl) {
    if (initAttempts < 30) {
      initAttempts++
      initTimer = setTimeout(initEditor, 16)
    }
    return
  }

  try {
    editorView = initProsemirrorEditor(editorViewEl, props.value, {
      handleDOMEvents: {
        focus: handleFocus,
        blur: handleBlur,
        mouseup: handleMouseup,
        mousedown: () => {
          window.getSelection()?.removeAllRanges()
          hideMenuInstance()
        },
        keydown: hideMenuInstance,
        input: handleInput,
      },
    }, {
      placeholder: LL.value.editor.remark.clickToEnterSpeakerNotes(),
    })

    menuInstance.value = tippy(editorViewEl, {
      duration: 0,
      content: menuEl,
      interactive: true,
      trigger: 'manual',
      placement: 'top-start',
      appendTo: getPptistPortalTarget(),
      hideOnClick: 'toggle',
      offset: [0, 6],
    })
  }
  catch (error) {
    throw error
  }
}

onMounted(() => {
  nextTick(() => {
    initTimer = setTimeout(initEditor, 0)
  })
})

watch(() => props.value, () => {
  nextTick(updateTextContent)
})

onUnmounted(() => {
  if (initTimer) clearTimeout(initTimer)
  editorView && editorView.destroy()
})
</script>

<style lang="scss" scoped>
.editor {
  height: 100%;
  overflow: auto;
}
.prosemirror-editor {
  height: 100%;
  cursor: text;

  ::v-deep(.ProseMirror) {
    height: 100%;
    font-size: 12px;
    overflow: auto;
    padding: 8px;
    line-height: 1.5;

    & > p[data-placeholder]::before {
      content: attr(data-placeholder);
      pointer-events: none;
      position: absolute;
      font-size: 12px;
      color: rgba(#666, 0.5);
    }
  }
}
.menu {
  display: flex;
  background-color: #fff;
  padding: 6px 4px;
  border: 1px solid $borderColor;
  box-shadow: $boxShadow;
  border-radius: $borderRadius;

  button {
    outline: 0;
    border: 0;
    background-color: #fff;
    padding: 3px;
    border-radius: $borderRadius;
    font-size: 16px;
    margin: 0 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover, &.active {
      background-color: $themeColor;
      color: #fff;
    }
  }
}
</style>
