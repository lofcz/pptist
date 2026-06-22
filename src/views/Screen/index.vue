<template>
  <!--
    Teleport the slideshow to <body> so it escapes the embed host's stacking
    context and `overflow: hidden`, covering the full viewport above the host
    app's chrome (chat, toolbars, etc.) instead of being trapped inside the
    editor pane.

    The wrapper keeps the `pptist-embed-root` class: the embed build scopes every
    CSS selector under `.pptist-embed-root`, so the teleported subtree needs that
    class for the slideshow's scoped styles to keep matching. In the standalone
    app the class is inert and the inline fixed/inset positioning still supplies
    the viewport box. Positioning is inline (not a scoped class) on purpose — the
    scoping script would rewrite a wrapper class into a `.pptist-embed-root <x>`
    descendant selector that can't match the wrapper element itself.
  -->
  <Teleport to="body">
    <div class="pptist-embed-root" style="position: fixed; inset: 0; z-index: 2147483000">
      <div class="pptist-screen">
        <AudienceView v-if="isAudienceMode" />
        <BaseView :changeViewMode="changeViewMode" v-else-if="viewMode === 'base'" />
        <PresenterView :changeViewMode="changeViewMode" v-else-if="viewMode === 'presenter'" />
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { KEYS } from '@/configs/hotkey'
import useScreening from '@/hooks/useScreening'

import AudienceView from './AudienceView.vue'
import BaseView from './BaseView.vue'
import PresenterView from './PresenterView.vue'

const isAudienceMode = new URLSearchParams(window.location.search).get('mode') === 'audience'

const viewMode = ref<'base' | 'presenter'>('base')

const changeViewMode = (mode: 'base' | 'presenter') => {
  viewMode.value = mode
}

const { exitScreening: _exitScreening } = useScreening()

const syncChannel = !isAudienceMode ? new BroadcastChannel('pptist-audience-sync') : null

const exitScreening = () => {
  syncChannel?.postMessage({ type: 'EXIT' })
  _exitScreening()
}

// 快捷键退出放映（观众视图中 ESC 不响应，由用户直接关闭窗口）
const keydownListener = (e: KeyboardEvent) => {
  const key = e.key.toUpperCase()
  if (key === KEYS.ESC) exitScreening()
}

onMounted(() => {
  if (!isAudienceMode) document.addEventListener('keydown', keydownListener)
})
onUnmounted(() => {
  if (!isAudienceMode) document.removeEventListener('keydown', keydownListener)
  syncChannel?.close()
})
</script>

<style lang="scss" scoped>
.pptist-screen {
  width: 100%;
  height: 100%;
}
</style>