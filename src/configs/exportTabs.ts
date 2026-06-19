import type { DialogForExportTypes } from '@/types/export'

/** Non-empty export dialog tab ids. */
export type ExportTabId = Exclude<DialogForExportTypes, ''>

export type PptistExportTabsConfig = Partial<Record<ExportTabId, boolean>>

const ALL_EXPORT_TAB_IDS: ExportTabId[] = ['pptx', 'image', 'json', 'pdf', 'pptist']

const DEFAULT_EXPORT_TABS: Record<ExportTabId, boolean> = {
  pptx: true,
  image: true,
  json: true,
  pdf: true,
  pptist: true,
}

let exportTabs: Record<ExportTabId, boolean> = { ...DEFAULT_EXPORT_TABS }

/** Configure which export dialog tabs are available in an embedded host. Omitted keys stay enabled. */
export function setPptistExportTabs(config?: PptistExportTabsConfig) {
  exportTabs = { ...DEFAULT_EXPORT_TABS, ...config }
}

export function getPptistExportTabs(): Readonly<Record<ExportTabId, boolean>> {
  return exportTabs
}

export function isExportTabEnabled(tab: ExportTabId): boolean {
  return exportTabs[tab] ?? true
}

export function getEnabledExportTabs(): ExportTabId[] {
  return ALL_EXPORT_TAB_IDS.filter(tab => isExportTabEnabled(tab))
}

/** Resolve a requested export tab to an enabled one, or close the dialog when none are enabled. */
export function resolveExportDialogType(type: DialogForExportTypes): DialogForExportTypes {
  if (!type) return ''
  if (isExportTabEnabled(type)) return type
  return getEnabledExportTabs()[0] ?? ''
}
