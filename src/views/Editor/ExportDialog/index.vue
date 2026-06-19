<template>
  <div class="export-dialog">
    <Tabs
      v-if="tabs.length > 1"
      :tabs="tabs"
      :value="dialogForExport"
      card
      @update:value="key => setDialogForExport(key as DialogForExportTypes)"
    />
    <div class="content">
      <component :is="currentDialogComponent" @close="setDialogForExport('')"></component>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import type { DialogForExportTypes } from '@/types/export'
import { isExportTabEnabled } from '@/configs/exportTabs'

import ExportImage from './ExportImage.vue'
import ExportJSON from './ExportJSON.vue'
import ExportPDF from './ExportPDF.vue'
import ExportPPTX from './ExportPPTX.vue'
import Tabs from '@/components/Tabs.vue'
import { useI18nContext } from '@/i18n/useI18nContext'

interface TabItem {
  key: DialogForExportTypes
  label: string
}

const { LL } = useI18nContext()

const mainStore = useMainStore()
const { dialogForExport } = storeToRefs(mainStore)

const setDialogForExport = mainStore.setDialogForExport

const EXPORT_PPTIST_ENABLED = __PPTIST_EXTRAS_ENABLED__
const ExportSpecificFile = EXPORT_PPTIST_ENABLED ? defineAsyncComponent(() => import('./ExportSpecificFile.vue')) : null

const allTabs = computed<TabItem[]>(() => [
  ...(EXPORT_PPTIST_ENABLED && isExportTabEnabled('pptist')
    ? [{ key: 'pptist' as const, label: LL.value.export.dialog.tabs.pptist() }]
    : []),
  ...(isExportTabEnabled('pptx') ? [{ key: 'pptx' as const, label: LL.value.export.dialog.tabs.pptx() }] : []),
  ...(isExportTabEnabled('image') ? [{ key: 'image' as const, label: LL.value.export.dialog.tabs.image() }] : []),
  ...(isExportTabEnabled('json') ? [{ key: 'json' as const, label: LL.value.export.dialog.tabs.json() }] : []),
  ...(isExportTabEnabled('pdf') ? [{ key: 'pdf' as const, label: LL.value.export.dialog.tabs.pdf() }] : []),
])

const tabs = allTabs

const currentDialogComponent = computed<unknown>(() => {
  const dialogMap = {
    'image': ExportImage,
    'json': ExportJSON,
    'pdf': ExportPDF,
    'pptx': ExportPPTX,
    'pptist': ExportSpecificFile,
  }
  if (dialogForExport.value) return dialogMap[dialogForExport.value] || null
  return null
})
</script>

<style lang="scss" scoped>
.export-dialog {
  margin: -20px;
}
.content {
  height: 460px;
  padding: 12px;
  font-size: 13px;

  @include overflow-overlay();
}
</style>