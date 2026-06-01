<template>
  <template v-if="slides.length">
    <Screen v-if="screening" />
    <Editor v-else-if="_isPC" />
    <Mobile v-else />
  </template>
  <FullscreenSpin :tip="LL.common.loadingData()" v-else loading :mask="false" />
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useScreenStore, useSnapshotStore, useSlidesStore } from '@/store'
import { deleteDiscardedDB } from '@/utils/database'
import { isPC } from '@/utils/common'
import Editor from '@/views/Editor/index.vue'
import Screen from '@/views/Screen/index.vue'
import Mobile from '@/views/Mobile/index.vue'
import FullscreenSpin from '@/components/FullscreenSpin.vue'
import { useI18nContext } from '@/i18n/useI18nContext'
import { registerVueLocaleSync, unregisterVueLocaleSync } from './localeBridge'
import type { PptistMountOptions } from './types'

const props = defineProps<{
  init: PptistMountOptions
}>()

const { LL, setLocale } = useI18nContext()

const _isPC = isPC()

const slidesStore = useSlidesStore()
const snapshotStore = useSnapshotStore()
const screenStore = useScreenStore()
const { slides } = storeToRefs(slidesStore)
const { screening } = storeToRefs(screenStore)

async function resolveInitialDocument() {
  if (props.init.document) {
    slidesStore.setTitle(props.init.document.title)
    slidesStore.setSlides(props.init.document.slides, props.init.document.theme)
    return
  }

  if (props.init.loadMockOnEmpty === false) {
    slidesStore.setSlides([{ id: 'empty', elements: [] }])
    return
  }

  const base = (props.init.assetBaseUrl ?? '').replace(/\/$/, '')
  const url = `${base}/mocks/slides.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load mock slides from ${url}`)
  const slides = await res.json()
  slidesStore.setSlides(slides)
}

onMounted(async () => {
  registerVueLocaleSync(setLocale)
  if (props.init.templates?.length) slidesStore.setTemplates(props.init.templates)
  await resolveInitialDocument()
  await deleteDiscardedDB()
  snapshotStore.initSnapshotDatabase()
})

onUnmounted(() => {
  unregisterVueLocaleSync()
})
</script>

<style lang="scss">
:host,
.pptist-embed-root {
  display: block;
  height: 100%;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
