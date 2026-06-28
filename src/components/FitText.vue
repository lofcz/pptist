<template>
  <span
    ref="elRef"
    class="fit-text"
    :title="text"
  >
    <span
      class="fit-text-content"
      :class="{ 'single-line': maxLines === 1 }"
      :style="fitStyle"
    >{{ text }}</span>
  </span>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { layout, prepare, setLocale as setPretextLocale } from '@chenglou/pretext'
import { useI18nContext } from '@/i18n/useI18nContext'

const DEFAULT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif'

const props = withDefaults(defineProps<{
  text: string
  maxFontSize?: number
  minFontSize?: number
  fontWeight?: number | string
  fontStyle?: string
  fontFamily?: string
  textDecoration?: string
  lineHeight?: number
  letterSpacing?: number
  maxLines?: number
  /** Extra px allowed in the height fit check (underline / descenders). */
  measureHeightSlack?: number
}>(), {
  maxFontSize: 13,
  minFontSize: 10,
  fontWeight: 400,
  fontStyle: 'normal',
  fontFamily: '',
  textDecoration: 'none',
  lineHeight: 1.25,
  letterSpacing: 0,
  maxLines: 1,
  measureHeightSlack: 0,
})

const { locale } = useI18nContext()
const elRef = ref<HTMLElement | null>(null)
const fontSize = ref(props.maxFontSize)

const measureFontFamily = computed(() => props.fontFamily || DEFAULT_FONT_FAMILY)

const fitStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  fontWeight: props.fontWeight,
  fontStyle: props.fontStyle,
  fontFamily: props.fontFamily || 'inherit',
  textDecoration: props.textDecoration,
  lineHeight: `${props.lineHeight}`,
  letterSpacing: `${props.letterSpacing}px`,
  WebkitLineClamp: props.maxLines,
}))

const fit = () => {
  const el = elRef.value
  if (!el || !props.text) {
    fontSize.value = props.maxFontSize
    return
  }

  const width = el.clientWidth
  const height = el.clientHeight + (props.measureHeightSlack ?? 0)
  if (width <= 0 || height <= 0) return

  setPretextLocale(locale.value)

  for (let size = props.maxFontSize; size >= props.minFontSize; size -= 0.5) {
    const lineHeightPx = Math.ceil(size * props.lineHeight)
    const font = `${props.fontStyle} ${props.fontWeight} ${size}px ${measureFontFamily.value}`
    const prepared = prepare(props.text, font, { letterSpacing: props.letterSpacing })
    const result = layout(prepared, width, lineHeightPx)
    if (result.height <= height && result.lineCount <= props.maxLines) {
      fontSize.value = size
      return
    }
  }

  fontSize.value = props.minFontSize
}

const scheduleFit = () => {
  void nextTick(() => fit())
}

const resizeObserver = new ResizeObserver(scheduleFit)

onMounted(() => {
  if (elRef.value) resizeObserver.observe(elRef.value)
  scheduleFit()
})

onBeforeUnmount(() => {
  resizeObserver.disconnect()
})

watch(
  () => [
    props.text,
    props.maxFontSize,
    props.minFontSize,
    props.fontWeight,
    props.fontStyle,
    props.fontFamily,
    props.lineHeight,
    props.letterSpacing,
    props.maxLines,
    props.measureHeightSlack,
    locale.value,
  ],
  scheduleFit,
)
</script>

<style lang="scss" scoped>
.fit-text {
  display: flex;
  align-items: center;
  justify-content: inherit;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  text-align: inherit;
}

.fit-text-content {
  display: -webkit-box;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  text-align: inherit;
  -webkit-box-orient: vertical;
}

.fit-text-content.single-line {
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
