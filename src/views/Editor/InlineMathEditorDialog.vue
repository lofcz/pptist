<template>
  <Modal
    v-model:visible="visible"
    :width="640"
    @closed="handleClosed()"
  >
    <div class="inline-math-editor">
      <div class="title">{{ LL.components.inlineMathEditor.title() }}</div>
      <div class="field" ref="fieldHostRef"></div>
      <div class="footer">
        <Button class="btn" @click="visible = false">{{ LL.common.cancel() }}</Button>
        <Button class="btn" type="primary" @click="confirm()">{{ LL.common.ok() }}</Button>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { nextTick, ref, watch, onUnmounted } from 'vue'
import emitter, { EmitterEvents, type OpenInlineMathPayload } from '@/utils/emitter'
import { ensureMathliveReady, renderMathToHtml } from '@/utils/math'
import message from '@/utils/message'
import { useI18nContext } from '@/i18n/useI18nContext'

import Modal from '@/components/Modal.vue'
import Button from '@/components/Button.vue'

const { LL } = useI18nContext()

type MathField = HTMLElement & { value: string; getValue: (format?: string) => string }

const visible = ref(false)
const fieldHostRef = ref<HTMLElement | null>(null)
const editing = ref<OpenInlineMathPayload | null>(null)

let mathField: MathField | null = null

const destroyField = () => {
  if (mathField && mathField.parentElement) mathField.parentElement.removeChild(mathField)
  mathField = null
}

// Build the <math-field> imperatively (created via the DOM API, so no Vue
// custom-element compiler config is needed) and seed it with the current LaTeX.
const mountField = async (latex: string) => {
  await ensureMathliveReady()
  await nextTick()
  const host = fieldHostRef.value
  if (!host) return

  destroyField()
  const field = document.createElement('math-field') as MathField
  field.setAttribute('math-virtual-keyboard-policy', 'manual')
  field.value = latex
  host.appendChild(field)
  mathField = field
  requestAnimationFrame(() => field.focus())
}

const openEditor = (payload: OpenInlineMathPayload) => {
  editing.value = payload
  visible.value = true
  mountField(payload.latex)
}

const confirm = () => {
  const target = editing.value
  if (!target || !mathField) return

  const latex = (mathField.getValue ? mathField.getValue('latex') : mathField.value).trim()
  if (!latex) {
    message.error(LL.value.components.inlineMathEditor.empty())
    return
  }

  emitter.emit(EmitterEvents.APPLY_INLINE_MATH, {
    elementId: target.elementId,
    pos: target.pos,
    latex,
    html: renderMathToHtml(latex, target.display),
    display: target.display,
  })
  visible.value = false
}

const handleClosed = () => {
  destroyField()
  editing.value = null
}

// Re-seed the field if the dialog is reopened for a different node.
watch(visible, value => {
  if (!value) destroyField()
})

emitter.on(EmitterEvents.OPEN_INLINE_MATH_EDITOR, openEditor)
onUnmounted(() => {
  emitter.off(EmitterEvents.OPEN_INLINE_MATH_EDITOR, openEditor)
  destroyField()
})
</script>

<style lang="scss" scoped>
.inline-math-editor {
  .title {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 14px;
  }
  .field {
    border: 1px solid $borderColor;
    border-radius: $borderRadius;
    padding: 10px 12px;
    min-height: 56px;

    :deep(math-field) {
      display: block;
      width: 100%;
      font-size: 20px;
    }
  }
  .footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;

    .btn {
      margin-left: 10px;
    }
  }
}
</style>
