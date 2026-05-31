import { getLL } from '@/i18n/getLL'

const types = getLL().configs.element.types

export const ELEMENT_TYPE_ZH: Record<string, string> = {
  text: types.text(),
  image: types.image(),
  shape: types.shape(),
  line: types.line(),
  chart: types.chart(),
  table: types.table(),
  video: types.video(),
  audio: types.audio(),
  latex: types.latex(),
}

export const MIN_SIZE: Record<string, number> = {
  text: 40,
  image: 20,
  shape: 20,
  chart: 200,
  table: 30,
  video: 250,
  audio: 20,
  latex: 20,
}
