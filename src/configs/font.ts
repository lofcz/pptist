import { computed } from 'vue'
import { getLL } from '@/i18n/getLL'
import { useI18nContext } from '@/i18n/useI18nContext'
import { EXTRAS_ENABLED } from '@/configs/featureFlags'

export interface FontOption {
  label: string
  value: string
}

export const EASTERN_EXTRAS_FONT_VALUES = [
  'SourceHanSans',
  'SourceHanSerif',
  'WenDingPLKaiTi',
  'WenDingPLSongTi',
  'ZhuqueFangSong',
  'LXGWWenKai',
  'AlibabaPuHuiTi',
  'MiSans',
  'DeYiHei',
  'CangerXiaowanzi',
  'YousheTitleBlack',
  'FengguangMingrui',
  'ShetuModernSquare',
  'ZcoolHappy',
  'ZizhiQuXiMai',
  'SucaiJishiKangkang',
  'SucaiJishiCoolSquare',
  'TuniuRounded',
  'RuiziZhenyan',
]

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
  ]

  const easternExtrasFonts: FontOption[] = [
    { label: f.sourceHanSans(), value: EASTERN_EXTRAS_FONT_VALUES[0] },
    { label: f.sourceHanSerif(), value: EASTERN_EXTRAS_FONT_VALUES[1] },
    { label: f.wenDingPLKaiTi(), value: EASTERN_EXTRAS_FONT_VALUES[2] },
    { label: f.wenDingPLSongTi(), value: EASTERN_EXTRAS_FONT_VALUES[3] },
    { label: f.zhuqueFangSong(), value: EASTERN_EXTRAS_FONT_VALUES[4] },
    { label: f.lxgwwenKai(), value: EASTERN_EXTRAS_FONT_VALUES[5] },
    { label: f.alibabaPuHuiTi(), value: EASTERN_EXTRAS_FONT_VALUES[6] },
    { label: f.miSans(), value: EASTERN_EXTRAS_FONT_VALUES[7] },
    { label: f.deYiHei(), value: EASTERN_EXTRAS_FONT_VALUES[8] },
    { label: f.cangerXiaowanzi(), value: EASTERN_EXTRAS_FONT_VALUES[9] },
    { label: f.yousheTitleBlack(), value: EASTERN_EXTRAS_FONT_VALUES[10] },
    { label: f.fengguangMingrui(), value: EASTERN_EXTRAS_FONT_VALUES[11] },
    { label: f.shetuModernSquare(), value: EASTERN_EXTRAS_FONT_VALUES[12] },
    { label: f.zcoolHappy(), value: EASTERN_EXTRAS_FONT_VALUES[13] },
    { label: f.zizhiQuXiMai(), value: EASTERN_EXTRAS_FONT_VALUES[14] },
    { label: f.sucaiJishiKangkang(), value: EASTERN_EXTRAS_FONT_VALUES[15] },
    { label: f.sucaiJishiCoolSquare(), value: EASTERN_EXTRAS_FONT_VALUES[16] },
    { label: f.tuniuRounded(), value: EASTERN_EXTRAS_FONT_VALUES[17] },
    { label: f.ruiziZhenyan(), value: EASTERN_EXTRAS_FONT_VALUES[18] },
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
