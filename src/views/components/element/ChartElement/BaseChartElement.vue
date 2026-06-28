<template>
  <div class="base-element-chart"
    :class="{ 'is-thumbnail': target === 'thumbnail' }"
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
        :style="{
          backgroundColor: elementInfo.fill,
          borderRadius: outlineBorderRadius,
          overflow: outlineBorderRadius ? 'hidden' : undefined,
        }"
      >
        <ElementOutline
          :width="elementInfo.width"
          :height="elementInfo.height"
          :outline="elementInfo.outline"
        />
        <Chart
          :width="elementInfo.width"
          :height="elementInfo.height"
          :type="elementInfo.chartType"
          :data="elementInfo.data"
          :themeColors="elementInfo.themeColors"
          :textColor="elementInfo.textColor"
          :lineColor="elementInfo.lineColor"
          :options="elementInfo.options"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTChartElement } from '@/types/slides'
import { useOutlineRadiusCss } from '@/views/components/element/hooks/useElementOutline'

import ElementOutline from '@/views/components/element/ElementOutline.vue'
import Chart from './Chart.vue'

const props = defineProps<{
  elementInfo: PPTChartElement
  target?: string
}>()

const outlineRef = computed(() => props.elementInfo.outline)
const elementWidthRef = computed(() => props.elementInfo.width)
const elementHeightRef = computed(() => props.elementInfo.height)
const outlineBorderRadius = useOutlineRadiusCss(outlineRef, elementWidthRef, elementHeightRef)
</script>

<style lang="scss" scoped>
.base-element-chart {
  position: absolute;

  &.is-thumbnail {
    pointer-events: none;
  }
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
}
</style>