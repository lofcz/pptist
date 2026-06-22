import type { NamespaceComponentsTranslation } from '../../i18n-types'

const sk_components: NamespaceComponentsTranslation = {
  outlineEditor: {
    flags: {
      topic: 'Téma',
      chapter: 'Kap.',
      section: 'Odd.',
    },
    contextmenu: {
      addChildChapter: 'Pridať podradenú kapitolu',
      addSiblingChapterAbove: 'Pridať kapitolu nad',
      addChildSection: 'Pridať podradený oddiel',
      deleteChapter: 'Odstrániť túto kapitolu',
      addSiblingSectionAbove: 'Pridať oddiel nad',
      addChildItem: 'Pridať podradenú položku',
      deleteSection: 'Odstrániť tento oddiel',
      addSiblingItemAbove: 'Pridať položku nad',
      addSiblingItemBelow: 'Pridať položku pod',
      deleteItem: 'Odstrániť túto položku',
    },
    defaultContent: {
      newChapter: 'Nová kapitola',
      newSection: 'Nový oddiel',
      newItem: 'Nová položka',
    },
  },
  audioPlayer: {
    loadFailed: 'Audio sa nepodarilo načítať',
  },
  chartDataEditor: {
    chartTypeLabel: 'Typ grafu:',
    clickToChange: 'Zmeniť',
    clearData: 'Vymazať údaje',
    categoryDefault: 'Kategória {n}',
    seriesDefault: 'Rad {n}',
  },
  colorPicker: {
    recentColors: 'Naposledy použité:',
    eyeDropperEscHint: 'Ukončite výber farby klávesou ESC',
    eyeDropperInitFailed: 'Výber farby sa nepodarilo spustiť',
  },
  latexEditor: {
    inputPlaceholder: 'Zadajte vzorec v LaTeXe',
    previewPlaceholder: 'Náhľad vzorca',
    tabSymbols: 'Symboly',
    tabFormulas: 'Vzorce',
    formulaEmpty: 'Vzorec nesmie byť prázdny',
  },
  inlineMathEditor: {
    title: 'Upraviť vzorec',
    inputPlaceholder: 'Zadajte vzorec',
    empty: 'Vzorec nesmie byť prázdny',
  },
}

export default sk_components
