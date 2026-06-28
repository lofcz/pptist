import { computed, type Ref } from 'vue'
import type { PPTElementOutline } from '@/types/slides'
import { clampOutlineRadius, roundedRectOutlinePath } from '@/utils/elementOutline'

// Compute outline props with defaults for width, style, and dash array
export default (outline: Ref<PPTElementOutline | undefined>) => {
  const outlineWidth = computed(() => outline.value?.width ?? 0)
  const outlineStyle = computed(() => outline.value?.style || 'solid')
  const outlineColor = computed(() => outline.value?.color || '#d14424')
  const outlineRadius = computed(() => outline.value?.radius ?? 0)

  const strokeDashArray = computed(() => {
    const size = outlineWidth.value
    if (outlineStyle.value === 'dashed') return size <= 6 ? `${size * 4.5} ${size * 2}` : `${size * 4} ${size * 1.5}`
    if (outlineStyle.value === 'dotted') return size <= 6 ? `${size * 1.8} ${size * 1.6}` : `${size * 1.5} ${size * 1.2}`
    return '0 0'
  })

  return {
    outlineWidth,
    outlineStyle,
    outlineColor,
    outlineRadius,
    strokeDashArray,
  }
}

export const useOutlinePath = (
  outline: Ref<PPTElementOutline | undefined>,
  width: Ref<number>,
  height: Ref<number>,
) => {
  return computed(() => {
    return roundedRectOutlinePath(
      width.value,
      height.value,
      outline.value?.radius ?? 0,
    )
  })
}

export const useOutlineRadiusCss = (
  outline: Ref<PPTElementOutline | undefined>,
  width: Ref<number>,
  height: Ref<number>,
) => {
  return computed(() => {
    const radius = outline.value?.radius
    if (!radius) return undefined
    return `${clampOutlineRadius(radius, width.value, height.value)}px`
  })
}