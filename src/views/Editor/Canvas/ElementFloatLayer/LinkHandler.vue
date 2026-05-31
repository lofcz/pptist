<template>
  <div class="link-handler" :style="handlerStyle">
    <a class="link" v-if="elementInfo.link?.type === 'web'" :href="elementInfo.link.target" target="_blank">{{elementInfo.link.target}}</a>
    <a class="link" v-else-if="elementInfo.link" @click="turnTarget(elementInfo.link.target)">{{ slidePageLabel }}</a>
    <div class="btns">
      <div class="btn" @click="openLinkDialog()">{{ LL.canvas.link.change() }}</div>
      <Divider type="vertical" />
      <div class="btn" @click="removeLink(elementInfo)">{{ LL.canvas.link.remove() }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTElement } from '@/types/slides'
import useLink from '@/hooks/useLink'
import Divider from '@/components/Divider.vue'
import { useI18nContext } from '@/i18n/useI18nContext'

const { LL } = useI18nContext()

const props = defineProps<{
  elementInfo: PPTElement
  handlerStyle: Record<string, string>
  openLinkDialog: () => void
}>()

const mainStore = useMainStore()
const slidesStore = useSlidesStore()
const { slides } = storeToRefs(slidesStore)
const { removeLink } = useLink()

const slidePageLabel = computed(() => {
  const link = props.elementInfo.link
  if (!link || link.type !== 'slide') return ''
  const index = slides.value.findIndex(item => item.id === link.target)
  const number = index >= 0 ? index + 1 : 0
  return LL.value.canvas.link.slidePage({ number })
})

const turnTarget = (slideId: string) => {
  const targetIndex = slides.value.findIndex(item => item.id === slideId)
  if (targetIndex !== -1) {
    mainStore.setActiveElementIdList([])
    slidesStore.updateSlideIndex(targetIndex)
  }
}
</script>

<style lang="scss" scoped>
.link-handler {
  height: 30px;
  position: absolute;
  font-size: 12px;
  padding: 0 10px;
  background-color: #fff;
  box-shadow: $boxShadow;
  display: flex;
  align-items: center;
  color: $themeColor;
  border-radius: $borderRadius;
}
.link {
  max-width: 300px;
  margin-right: 20px;
  word-break: keep-all;
  white-space: nowrap;
  cursor: pointer;

  @include ellipsis-oneline();
}
.btns {
  display: flex;
  align-items: center;

  .btn {
    word-break: keep-all;
    cursor: pointer;
  }
}
</style>
