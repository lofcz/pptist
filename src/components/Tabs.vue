<template>
  <div
    ref="scrollRef"
    class="tabs-scroll"
    :class="{ 'card': card, 'scrollable': isScrollable }"
    :style="tabsStyle || {}"
    @mousedown.stop
    @pointerdown.stop
    @wheel="handleWheel"
  >
    <div ref="tabsRef" class="tabs"
      :class="{
        'card': card,
        'space-around': spaceAround,
        'space-between': spaceBetween,
      }"
    >
      <div
        class="tab"
        :class="{ 'active': tab.key === value, 'disabled': tab.disabled }"
        v-for="tab in tabs"
        :key="tab.key"
        :style="{
          ...(tabStyle || {}),
          '--color': tab.color,
        }"
        @click="!tab.disabled && emit('update:value', tab.key)"
      >{{tab.label}}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { OverlayScrollbars } from 'overlayscrollbars'

import 'overlayscrollbars/overlayscrollbars.css'

interface TabItem {
  key: string
  label: string
  color?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  value: string
  tabs: TabItem[]
  card?: boolean
  tabsStyle?: CSSProperties
  tabStyle?: CSSProperties
  spaceAround?: boolean
  spaceBetween?: boolean
}>(), {
  card: false,
  spaceAround: false,
  spaceBetween: false,
})

const emit = defineEmits<{
  (event: 'update:value', payload: string): void
}>()

const scrollRef = ref<HTMLElement | null>(null)
const tabsRef = ref<HTMLElement | null>(null)
const isScrollable = ref(false)
let scrollbars: ReturnType<typeof OverlayScrollbars> | null = null

const hasHorizontalOverflow = () => {
  if (!scrollRef.value || !tabsRef.value) return false
  return tabsRef.value.scrollWidth > scrollRef.value.clientWidth + 1
}

const getScrollViewport = () => {
  return scrollbars?.elements().viewport ?? scrollRef.value
}

const handleWheel = (event: WheelEvent) => {
  if (!isScrollable.value) return

  const viewport = getScrollViewport()
  if (!viewport) return

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  if (!delta) return

  event.preventDefault()
  event.stopPropagation()
  viewport.scrollLeft += delta
}

const updateScrollbars = () => {
  void nextTick(() => {
    const overflowing = hasHorizontalOverflow()
    isScrollable.value = overflowing

    if (overflowing) {
      if (!scrollbars && scrollRef.value) {
        scrollbars = OverlayScrollbars(scrollRef.value, {
          overflow: {
            x: 'scroll',
            y: 'hidden',
          },
          scrollbars: {
            visibility: 'auto',
            autoHide: 'leave',
            autoHideDelay: 300,
          },
        })
      }
      else scrollbars?.update(true)
    }
    else if (scrollbars) {
      scrollbars.destroy()
      scrollbars = null
    }
  })
}

const resizeObserver = new ResizeObserver(updateScrollbars)

onMounted(() => {
  if (scrollRef.value) resizeObserver.observe(scrollRef.value)
  if (tabsRef.value) resizeObserver.observe(tabsRef.value)
  updateScrollbars()
})

onBeforeUnmount(() => {
  resizeObserver.disconnect()
  scrollbars?.destroy()
  scrollbars = null
})

watch(() => [props.tabs, props.value, props.tabsStyle, props.tabStyle], updateScrollbars, { deep: true })
</script>

<style lang="scss" scoped>
.tabs-scroll {
  position: relative;
  width: 100%;
  overflow: hidden;

  &.card {
    height: 40px;
    flex-shrink: 0;
  }

  &.scrollable {
    padding-bottom: 10px;

    &::before,
    &::after {
      content: '';
      width: 18px;
      position: absolute;
      top: 0;
      bottom: 10px;
      z-index: 2;
      pointer-events: none;
    }

    &::before {
      left: 0;
      background: linear-gradient(90deg, #fff 0%, rgba(#fff, 0) 100%);
    }

    &::after {
      right: 0;
      background: linear-gradient(270deg, #fff 0%, rgba(#fff, 0) 100%);
    }
  }
}
.tabs {
  display: flex;
  width: max-content;
  min-width: 100%;
  user-select: none;
  line-height: 1;

  &:not(.card) {
    font-size: 13px;
    align-items: center;
    justify-content: flex-start;
    border-bottom: 1px solid $borderColor;

    &.space-around {
      justify-content: space-around;
    }
    &.space-between {
      justify-content: space-between;
    }

    .tab {
      flex: 0 0 auto;
      text-align: center;
      border-bottom: 2px solid transparent;
      padding: 8px 10px;
      cursor: pointer;

      &.active {
        border-bottom: 2px solid var(--color, $themeColor);
      }
      &.disabled {
        opacity: 0.35;
        cursor: default;
      }
    }
  }

  &.card {
    height: 40px;
    font-size: 12px;
    flex-shrink: 0;

    .tab {
      flex: 1 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: $lightGray;
      border-bottom: 1px solid $borderColor;
      cursor: pointer;

      &.active {
        background-color: transparent;
        border-bottom-color: transparent;
      }

      & + .tab {
        border-left: 1px solid $borderColor;
      }
    }
  }
}
</style>