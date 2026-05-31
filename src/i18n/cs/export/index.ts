import type { NamespaceExportTranslation } from '../../i18n-types'

const cs_export: NamespaceExportTranslation = {
  exportImageFailed: 'Nepodařilo se exportovat obrázek',
  exportFailed: 'Nepodařilo se exportovat',
  chartSeries: 'Řada {index}',
  dialog: {
    tabs: {
      pptist: 'Exportovat soubor PPTIST',
      pptx: 'Exportovat PPTX',
      image: 'Exportovat obrázky',
      json: 'Exportovat JSON',
      pdf: 'Tisk / Export PDF',
    },
    exportRange: 'Rozsah exportu:',
    rangeAll: 'Vše',
    rangeCurrent: 'Aktuální snímek',
    rangeCustom: 'Vlastní',
    customRange: 'Vlastní rozsah:',
    customRangeHint: '({min} ~ {max})',
    exporting: 'Probíhá export…',
  },
  pdf: {
    slidesPerPage: 'Počet snímků na stránce:',
    pageMargin: 'Odsazení od okraje:',
    printTip:
      'Tip: V dialogu tisku zaškrtněte „Grafika na pozadí“ a u okrajů zvolte „Výchozí“.',
    exportButton: 'Tisk / Export PDF',
  },
  pptx: {
    exportMode: 'Režim exportu:',
    modeStandard: 'Standardní verze',
    modeImageOnly: 'Verze z obrázků',
    ignoreMedia: 'Ignorovat audio/video:',
    ignoreMediaTooltip:
      'Audio a video se při exportu ve výchozím nastavení neexportují. Chcete-li je zahrnout do souboru PPTX, vypněte tuto volbu — export potom výrazně potrvá.',
    overwriteMaster: 'Přepsat výchozí vzor snímků:',
    mediaExportTip:
      'Tip: 1. Podporované formáty: avi, mp4, mov, wmv, mp3, wav; 2. Zdroje z jiných domén nelze exportovat.',
    exportButton: 'Exportovat PPTX',
  },
  pptist: {
    fileTip:
      'Tip: .pptist je vlastní přípona této aplikace — soubory v tomto formátu lze znovu naimportovat.',
    exportButton: 'Exportovat soubor PPTIST',
  },
  image: {
    formatLabel: 'Formát exportu:',
    qualityLabel: 'Kvalita obrázku:',
    ignoreWebfontLabel: 'Ignorovat webová písma:',
    ignoreWebfontTooltip:
      'Při exportu se standardně ignorují webová písma. Pokud ve snímcích používáte webová písma a chcete zachovat jejich vzhled po exportu, vypněte tuto volbu — export pak potrvá déle.',
    exportButton: 'Exportovat obrázky',
  },
  json: {
    exportButton: 'Exportovat JSON',
  },
}

export default cs_export
