import type { NamespaceComponentsTranslation } from '../../i18n-types'

const cs_components: NamespaceComponentsTranslation = {
  outlineEditor: {
    flags: {
      topic: 'Téma',
      chapter: 'Kap.',
      section: 'Odd.',
    },
    contextmenu: {
      addChildChapter: 'Přidat podřazenou kapitolu',
      addSiblingChapterAbove: 'Přidat kapitolu nad',
      addChildSection: 'Přidat podřazený oddíl',
      deleteChapter: 'Smazat tuto kapitolu',
      addSiblingSectionAbove: 'Přidat oddíl nad',
      addChildItem: 'Přidat podřazenou položku',
      deleteSection: 'Smazat tento oddíl',
      addSiblingItemAbove: 'Přidat položku nad',
      addSiblingItemBelow: 'Přidat položku pod',
      deleteItem: 'Smazat tuto položku',
    },
    defaultContent: {
      newChapter: 'Nová kapitola',
      newSection: 'Nový oddíl',
      newItem: 'Nová položka',
    },
  },
  audioPlayer: {
    loadFailed: 'Audio se nepodařilo načíst',
  },
  chartDataEditor: {
    chartTypeLabel: 'Typ grafu:',
    clickToChange: 'Změnit',
    clearData: 'Vymazat data',
    categoryDefault: 'Kategorie {n}',
    seriesDefault: 'Řada {n}',
  },
  colorPicker: {
    recentColors: 'Naposledy použité:',
    eyeDropperEscHint: 'Ukončete výběr barvy klávesou ESC',
    eyeDropperInitFailed: 'Výběr barvy se nepodařilo spustit',
  },
  latexEditor: {
    inputPlaceholder: 'Zadejte vzorec v LaTeXu',
    previewPlaceholder: 'Náhled vzorce',
    tabSymbols: 'Symboly',
    tabFormulas: 'Vzorce',
    formulaEmpty: 'Vzorec nesmí být prázdný',
  },
  inlineMathEditor: {
    title: 'Upravit vzorec',
    inputPlaceholder: 'Zadejte vzorec',
    empty: 'Vzorec nesmí být prázdný',
  },
}

export default cs_components
