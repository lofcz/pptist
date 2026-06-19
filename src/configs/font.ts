import { computed } from 'vue'
import { getLL } from '@/i18n/getLL'
import { useI18nContext } from '@/i18n/useI18nContext'
import { EXTRAS_ENABLED } from '@/configs/featureFlags'

export interface FontOption {
  label: string
  value: string
}

export const FONT_VALUES = [
  '',
  'SourceHanSans',
  'SourceHanSerif',
  'WenDingPLKaiTi',
  'WenDingPLSongTi',
  'ZhuqueFangSong',
  'LXGWWenKai',
  'LXGWNeoZhiSong',
  'LXGWNeoXiHei',
  'AlibabaPuHuiTi',
  'MiSans',
  'DeYiHei',
  'SourceSerif4',
  'JetBrainsMono',
  'Literata',
  'Inter',
  'Roboto',
  'OpenSans',
  'Montserrat',
  'SourceSansPro',
  'Merriweather',
  'Lato',
] as const

export const EASTERN_EXTRAS_FONT_VALUES = [
  'SourceHanSans',
  'SourceHanSerif',
  'WenDingPLKaiTi',
  'WenDingPLSongTi',
  'ZhuqueFangSong',
  'LXGWWenKai',
  'LXGWNeoZhiSong',
  'LXGWNeoXiHei',
  'AlibabaPuHuiTi',
  'MiSans',
  'DeYiHei',
]

/** @deprecated Use FONT_VALUES — kept for loadGoogleFonts preset detection */
export const FONTS: FontOption[] = FONT_VALUES.map(value => ({ label: value, value }))

export function getFonts(): FontOption[] {
  const f = getLL().configs.fonts

  const westernFonts: FontOption[] = [
    { label: f.defaultFont(), value: '' },
    { label: f.sourceSerif4(), value: 'SourceSerif4' },
    { label: f.jetBrainsMono(), value: 'JetBrainsMono' },
    { label: f.literata(), value: 'Literata' },
    { label: f.inter(), value: 'Inter' },
    { label: f.roboto(), value: 'Roboto' },
    { label: f.openSans(), value: 'OpenSans' },
    { label: f.montserrat(), value: 'Montserrat' },
    { label: f.sourceSansPro(), value: 'SourceSansPro' },
    { label: f.merriweather(), value: 'Merriweather' },
    { label: f.lato(), value: 'Lato' },
  ]

  const easternExtrasFonts: FontOption[] = [
    { label: f.sourceHanSans(), value: 'SourceHanSans' },
    { label: f.sourceHanSerif(), value: 'SourceHanSerif' },
    { label: f.wenDingPLKaiTi(), value: 'WenDingPLKaiTi' },
    { label: f.wenDingPLSongTi(), value: 'WenDingPLSongTi' },
    { label: f.zhuqueFangSong(), value: 'ZhuqueFangSong' },
    { label: f.lxgwwenKai(), value: 'LXGWWenKai' },
    { label: f.lxgwNeoZhiSong(), value: 'LXGWNeoZhiSong' },
    { label: f.lxgwNeoXiHei(), value: 'LXGWNeoXiHei' },
    { label: f.alibabaPuHuiTi(), value: 'AlibabaPuHuiTi' },
    { label: f.miSans(), value: 'MiSans' },
    { label: f.deYiHei(), value: 'DeYiHei' },
  ]

  return EXTRAS_ENABLED
    ? [...westernFonts, ...easternExtrasFonts]
    : westernFonts
}

export function useFonts() {
  const { locale } = useI18nContext()

  return computed(() => {
    void locale.value
    return getFonts()
  })
}
