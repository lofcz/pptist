<template>
  <button
    class="text-placeholder"
    :class="[`content-type-${contentType}`, `align-${align}`]"
    type="button"
    :data-content-type="contentType"
    :style="{
      color,
      fontSize: `${fontSize}px`,
      textAlign: align,
    }"
    @mousedown.prevent.stop="event => emit('activate', event)"
  >
    <span class="bullet" v-if="contentType === 'content'">•</span>
    <span class="label">{{ label }}</span>
  </button>
</template>

<script lang="ts" setup>
import type { TextAlign, TextType } from '@/types/slides'

withDefaults(defineProps<{
  label: string
  contentType: TextType
  fontSize: number
  color: string
  align?: TextAlign
}>(), {
  align: 'center',
})

const emit = defineEmits<{
  (event: 'activate', payload: MouseEvent): void
}>()
</script>

<style lang="scss" scoped>
.text-placeholder {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: inherit;
  border: 0;
  background: transparent;
  font: inherit;
  line-height: 1.2;
  cursor: text;
  white-space: pre-wrap;

  &.content-type-content {
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0.35em;
    padding-top: 0;
  }

  &.align-left {
    justify-content: flex-start;
  }

  &.align-right {
    justify-content: flex-end;
  }
}
.bullet {
  flex: 0 0 auto;
}
.label {
  min-width: 0;
}
</style>
