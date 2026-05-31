<template>
  <div class="element-filter">
    <div class="row">
      <div style="flex: 2;">{{ LL.editor.elementFilter.enableFilter() }}</div>
      <div class="switch-wrapper" style="flex: 3;">
        <Switch 
          :value="hasFilters" 
          @update:value="value => toggleFilters(value)" 
        />
      </div>
    </div>
    <template v-if="hasFilters">
      <div class="presets">
        <div class="preset-item" v-for="(item, index) in presetFilters" :key="index" @click="applyPresetFilters(item.values)">
          <img :src="handleImageElement.src" alt="" :style="{ filter: filters2Style(item.values) }">
          <span class="preset-label">{{ item.label }}</span>
        </div>
      </div>
      <div class="filter">
        <div class="filter-item" v-for="filter in filterOptions" :key="filter.key">
          <div class="name">{{filter.label}}</div>
          <Slider
            class="filter-slider"
            :max="filter.max"
            :min="0"
            :step="filter.step"
            :value="filter.value"
            @update:value="value => updateFilter(filter, value as number)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { ImageElementFilterKeys, ImageElementFilters, PPTImageElement } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { useI18nContext } from '@/i18n/useI18nContext'

import Switch from '@/components/Switch.vue'
import Slider from '@/components/Slider.vue'

interface FilterOption {
  label: string
  key: ImageElementFilterKeys
  default: number
  value: number
  unit: string
  max: number
  step: number
}

const { LL } = useI18nContext()

const createDefaultFilters = (): FilterOption[] => [
  { label: LL.value.editor.elementFilter.blur(), key: 'blur', default: 0, value: 0, unit: 'px', max: 10, step: 1 },
  { label: LL.value.editor.elementFilter.brightness(), key: 'brightness', default: 100, value: 100, unit: '%', max: 200, step: 5 },
  { label: LL.value.editor.elementFilter.contrast(), key: 'contrast', default: 100, value: 100, unit: '%', max: 200, step: 5 },
  { label: LL.value.editor.elementFilter.grayscale(), key: 'grayscale', default: 0, value: 0, unit: '%', max: 100, step: 5 },
  { label: LL.value.editor.elementFilter.saturate(), key: 'saturate', default: 100, value: 100, unit: '%', max: 200, step: 5 },
  { label: LL.value.editor.elementFilter.hueRotate(), key: 'hue-rotate', default: 0, value: 0, unit: 'deg', max: 360, step: 10 },
  { label: LL.value.editor.elementFilter.sepia(), key: 'sepia', default: 0, value: 0, unit: '%', max: 100, step: 5 },
  { label: LL.value.editor.elementFilter.invert(), key: 'invert', default: 0, value: 0, unit: '%', max: 100, step: 5 },
  { label: LL.value.editor.elementFilter.opacity(), key: 'opacity', default: 100, value: 100, unit: '%', max: 100, step: 5 },
]

const presetFilters = computed(() => [
  { label: LL.value.editor.elementFilter.presetBlackWhite(), values: { 'grayscale': '100%' } as ImageElementFilters },
  { label: LL.value.editor.elementFilter.presetVintage(), values: { 'sepia': '50%', 'contrast': '110%', 'brightness': '90%' } },
  { label: LL.value.editor.elementFilter.presetSharpen(), values: { 'contrast': '150%' } },
  { label: LL.value.editor.elementFilter.presetSoft(), values: { 'brightness': '110%', 'contrast': '90%' } },
  { label: LL.value.editor.elementFilter.presetWarm(), values: { 'sepia': '30%', 'saturate': '135%' } },
  { label: LL.value.editor.elementFilter.presetBright(), values: { 'brightness': '110%', 'contrast': '110%' } },
  { label: LL.value.editor.elementFilter.presetVivid(), values: { 'saturate': '200%' } },
  { label: LL.value.editor.elementFilter.presetBlur(), values: { 'blur': '2px' } },
  { label: LL.value.editor.elementFilter.presetInvert(), values: { 'invert': '100%' } },
])

const slidesStore = useSlidesStore()
const { handleElement, handleElementId } = storeToRefs(useMainStore())

const handleImageElement = handleElement as Ref<PPTImageElement>

const activeFilterValues = ref<Partial<Record<ImageElementFilterKeys, number>>>({})
const hasFilters = ref(false)

const filterOptions = computed((): FilterOption[] => {
  const defaults = createDefaultFilters()
  return defaults.map(item => ({
    ...item,
    value: activeFilterValues.value[item.key] ?? item.value,
  }))
})

const { addHistorySnapshot } = useHistorySnapshot()

watch(handleElement, () => {
  if (!handleElement.value || handleElement.value.type !== 'image') return
  
  const filters = handleElement.value.filters
  if (filters) {
    const values: Partial<Record<ImageElementFilterKeys, number>> = {}
    for (const item of createDefaultFilters()) {
      const filterItem = filters[item.key]
      if (filterItem) values[item.key] = parseInt(filterItem)
    }
    activeFilterValues.value = values
    hasFilters.value = true
  }
  else {
    activeFilterValues.value = {}
    hasFilters.value = false
  }
}, { deep: true, immediate: true })

// 将滤镜配置转为css
const filters2Style = (filters: ImageElementFilters) => {
  let filter = ''
  const keys = Object.keys(filters) as ImageElementFilterKeys[]
  for (const key of keys) {
    filter += `${key}(${filters[key]}) `
  }
  return filter
}

// 设置滤镜
const updateFilter = (filter: FilterOption, value: number) => {
  const _handleElement = handleElement.value as PPTImageElement
  
  const originFilters = _handleElement.filters || {}
  const filters = { ...originFilters, [filter.key]: `${value}${filter.unit}` }
  slidesStore.updateElement({ id: handleElementId.value, props: { filters } })
  addHistorySnapshot()
}

const toggleFilters = (checked: boolean) => {
  if (!handleElement.value) return
  if (checked) {
    slidesStore.updateElement({ id: handleElement.value.id, props: { filters: {} } })
  }
  else {
    slidesStore.removeElementProps({ id: handleElement.value.id, propName: 'filters' })
  }
  addHistorySnapshot()
}

const applyPresetFilters = (filters: ImageElementFilters) => {
  slidesStore.updateElement({ id: handleElementId.value, props: { filters } })
  addHistorySnapshot()
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.switch-wrapper {
  text-align: right;
}
.filter {
  font-size: 12px;
}
.filter-item {
  padding: 6px 0;
  display: flex;
  justify-content: center;
  align-items: center;

  .name {
    width: 60px;
  }
  .filter-slider {
    flex: 1;
    margin: 0 6px;
  }
}
.presets {
  margin-bottom: 5px;
  @include flex-grid-layout();
}
.preset-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  @include flex-grid-layout-children(3, 31%);

  img {
    max-width: 100%;
    max-height: 120px;
  }
  .preset-label {
    font-size: 12px;
    color: #888;
  }
}
</style>
