<template>
  <svg 
    class="element-outline"
    v-if="outline"
    overflow="visible" 
    :width="width"
    :height="height"
  >
    <path 
      vector-effect="non-scaling-stroke" 
      stroke-linecap="butt" 
      stroke-miterlimit="8"
      fill="transparent"
      :d="outlinePath" 
      :stroke="outlineColor"
      :stroke-width="outlineWidth" 
      :stroke-dasharray="strokeDashArray" 
    ></path>
	</svg>
</template>

<script lang="ts" setup>
import { computed, toRef } from 'vue'
import type { PPTElementOutline } from '@/types/slides'

import useElementOutline, { useOutlinePath } from '@/views/components/element/hooks/useElementOutline'

const props = defineProps<{
  width: number
  height: number
  outline?: PPTElementOutline
}>()

const outlineRef = toRef(props, 'outline')
const widthRef = computed(() => props.width)
const heightRef = computed(() => props.height)

const {
  outlineWidth,
  outlineColor,
  strokeDashArray,
} = useElementOutline(outlineRef)

const outlinePath = useOutlinePath(outlineRef, widthRef, heightRef)
</script>

<style lang="scss" scoped>
svg {
  overflow: visible;
  position: absolute;
  top: 0;
  left: 0;
}
</style>