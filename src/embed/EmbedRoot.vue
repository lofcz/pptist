<template>
  <template v-if="slides.length">
    <Screen v-if="screening" />
    <Editor v-else-if="_isPC" />
    <Mobile v-else />
  </template>
  <FullscreenSpin
    v-else-if="init.showLoadingData !== false"
    :tip="LL.common.loadingData()"
    loading
    :mask="false"
  />
  <div v-else class="pptist-empty-host-state" />
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
import { buildStarterPresentation } from '@/configs/starterPresentation'
import { registerVueLocaleSync, unregisterVueLocaleSync } from './localeBridge'
import type { PptistDocument, PptistMountOptions } from './types'

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

function applyDocument(document: PptistDocument) {
  slidesStore.setTitle(document.title)
  slidesStore.setSlides(document.slides, document.theme)
}

async function resolveInitialDocument() {
  if (props.init.document) {
    applyDocument(props.init.document)
    return
  }

  const loadedDocument = await props.init.loadDocument?.()
  if (loadedDocument) {
    applyDocument(loadedDocument)
    return
  }

  if (props.init.loadMockOnEmpty === true) {
    const base = (props.init.assetBaseUrl ?? '').replace(/\/$/, '')
    const url = `${base}/mocks/slides.json`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to load mock slides from ${url}`)
    const slides = await res.json()
    slidesStore.setSlides(slides)
    return
  }

  applyDocument(buildStarterPresentation(LL.value, props.init.starterPresentation))
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

.pptist-empty-host-state {
  height: 100%;
  width: 100%;
  min-height: 0;
}
</style>
