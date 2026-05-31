import type { BaseTranslation } from '../../i18n-types'

const en_components: BaseTranslation = {
  outlineEditor: {
    flags: {
      topic: 'Topic',
      chapter: 'Ch.',
      section: 'Sec.',
    },
    contextmenu: {
      addChildChapter: 'Add child chapter',
      addSiblingChapterAbove: 'Add chapter above',
      addChildSection: 'Add child section',
      deleteChapter: 'Delete this chapter',
      addSiblingSectionAbove: 'Add section above',
      addChildItem: 'Add child item',
      deleteSection: 'Delete this section',
      addSiblingItemAbove: 'Add item above',
      addSiblingItemBelow: 'Add item below',
      deleteItem: 'Delete this item',
    },
    defaultContent: {
      newChapter: 'New chapter',
      newSection: 'New section',
      newItem: 'New item',
    },
  },
  audioPlayer: {
    loadFailed: 'Audio failed to load',
  },
  chartDataEditor: {
    chartTypeLabel: 'Chart type:',
    clickToChange: 'Change',
    clearData: 'Clear data',
    categoryDefault: 'Category {n}',
    seriesDefault: 'Series {n}',
  },
  colorPicker: {
    recentColors: 'Recently used:',
    eyeDropperEscHint: 'Press ESC to close the eyedropper',
    eyeDropperInitFailed: 'Failed to initialize eyedropper',
  },
  latexEditor: {
    inputPlaceholder: 'Enter LaTeX formula',
    previewPlaceholder: 'Formula preview',
    tabSymbols: 'Common symbols',
    tabFormulas: 'Preset formulas',
    formulaEmpty: 'Formula cannot be empty',
  },
}

export default en_components
