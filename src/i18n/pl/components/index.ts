import type { NamespaceComponentsTranslation } from '../../i18n-types'

const pl_components: NamespaceComponentsTranslation = {
  outlineEditor: {
    flags: {
      topic: 'Temat',
      chapter: 'Rozdz.',
      section: 'Sekc.',
    },
    contextmenu: {
      addChildChapter: 'Dodaj podrozdział',
      addSiblingChapterAbove: 'Dodaj rozdział powyżej',
      addChildSection: 'Dodaj podsekcję',
      deleteChapter: 'Usuń ten rozdział',
      addSiblingSectionAbove: 'Dodaj sekcję powyżej',
      addChildItem: 'Dodaj podpunkt',
      deleteSection: 'Usuń tę sekcję',
      addSiblingItemAbove: 'Dodaj punkt powyżej',
      addSiblingItemBelow: 'Dodaj punkt poniżej',
      deleteItem: 'Usuń ten punkt',
    },
    defaultContent: {
      newChapter: 'Nowy rozdział',
      newSection: 'Nowa sekcja',
      newItem: 'Nowy punkt',
    },
  },
  audioPlayer: {
    loadFailed: 'Nie udało się wczytać dźwięku',
  },
  chartDataEditor: {
    chartTypeLabel: 'Typ wykresu:',
    clickToChange: 'Kliknij, aby zmienić',
    clearData: 'Wyczyść dane',
    categoryDefault: 'Kategoria {n}',
    seriesDefault: 'Seria {n}',
  },
  colorPicker: {
    recentColors: 'Ostatnio używane:',
    eyeDropperEscHint: 'Naciśnij ESC, aby zamknąć pipetę',
    eyeDropperInitFailed: 'Nie udało się zainicjować pipety',
  },
  latexEditor: {
    inputPlaceholder: 'Wpisz wzór LaTeX',
    previewPlaceholder: 'Podgląd wzoru',
    tabSymbols: 'Popularne symbole',
    tabFormulas: 'Gotowe wzory',
    formulaEmpty: 'Wzór nie może być pusty',
  },
}

export default pl_components
