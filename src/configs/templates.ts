import type { TranslationFunctions } from '@/i18n/i18n-types'
import type { Slide, SlideTheme } from '@/types/slides'
import { EXTRAS_ENABLED } from '@/configs/featureFlags'
import { EASTERN_EXTRAS_FONT_VALUES } from '@/configs/font'
import { resolveTemplateAssetUrl } from '@/configs/templateAssets'

export type BuiltInTemplateId =
  | 'template_1'
  | 'template_2'
  | 'template_3'
  | 'template_4'
  | 'template_5'
  | 'template_6'
  | 'template_7'
  | 'template_8'

export interface TemplatePayload {
  title?: string
  width?: number
  height?: number
  slides: Slide[]
  theme?: Partial<SlideTheme>
}

export type TemplatePayloadLoader = () => Promise<TemplatePayload | Slide[]>

type TemplateTextToken =
  | 'presentationTitle'
  | 'coverTitle'
  | 'coverSubtitle'
  | 'coverDescription'
  | 'presenter'
  | 'date'
  | 'time'
  | 'businessReport'
  | 'contentsTitle'
  | 'sectionTitle'
  | 'sectionBody'
  | 'contentTitle'
  | 'itemTitle'
  | 'itemBody'
  | 'thankYou'
  | 'welcome'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'title4'
  | 'bodyText'
  | 'contentsItem'

export interface TemplateNormalizationConfig {
  stripFontFamiliesWhenExtrasDisabled: string[]
}

const BUILT_IN_TEMPLATE_LOADERS: Record<BuiltInTemplateId, () => Promise<TemplatePayload>> = {
  template_1: () => import('@/assets/templates/template_1.json').then(module => module.default as TemplatePayload),
  template_2: () => import('@/assets/templates/template_2.json').then(module => module.default as TemplatePayload),
  template_3: () => import('@/assets/templates/template_3.json').then(module => module.default as TemplatePayload),
  template_4: () => import('@/assets/templates/template_4.json').then(module => module.default as TemplatePayload),
  template_5: () => import('@/assets/templates/template_5.json').then(module => module.default as TemplatePayload),
  template_6: () => import('@/assets/templates/template_6.json').then(module => module.default as TemplatePayload),
  template_7: () => import('@/assets/templates/template_7.json').then(module => module.default as TemplatePayload),
  template_8: () => import('@/assets/templates/template_8.json').then(module => module.default as TemplatePayload),
}

let customTemplateLoaders: Record<string, TemplatePayloadLoader> = {}

export const setCustomTemplateLoaders = (loaders?: Record<string, TemplatePayloadLoader>) => {
  customTemplateLoaders = loaders ?? {}
}

export const TEMPLATE_NORMALIZATION_CONFIG: TemplateNormalizationConfig = {
  stripFontFamiliesWhenExtrasDisabled: EASTERN_EXTRAS_FONT_VALUES,
}

export const isBuiltInTemplateId = (id: string): id is BuiltInTemplateId => {
  return Object.prototype.hasOwnProperty.call(BUILT_IN_TEMPLATE_LOADERS, id)
}

export const loadBuiltInTemplate = async (id: string) => {
  if (!isBuiltInTemplateId(id)) return null
  return BUILT_IN_TEMPLATE_LOADERS[id]()
}

export const loadConfiguredTemplate = async (id: string) => {
  const customLoader = customTemplateLoaders[id]
  if (customLoader) return customLoader()
  return loadBuiltInTemplate(id)
}

const TEMPLATE_TOKEN_RE = /\{\{pptist:([a-zA-Z0-9]+)(?::(\d+))?\}\}/g
const TEMPLATE_ASSET_TOKEN_RE = /\{\{pptistAsset:([^}]+)\}\}/g
const TEMPLATE_TEXT_TOKENS = new Set<TemplateTextToken>([
  'presentationTitle',
  'coverTitle',
  'coverSubtitle',
  'coverDescription',
  'presenter',
  'date',
  'time',
  'businessReport',
  'contentsTitle',
  'sectionTitle',
  'sectionBody',
  'contentTitle',
  'itemTitle',
  'itemBody',
  'thankYou',
  'welcome',
  'title1',
  'title2',
  'title3',
  'title4',
  'bodyText',
  'contentsItem',
])

const replacementForToken = (token: TemplateTextToken, LL: TranslationFunctions, index?: string) => {
  const placeholders = LL.editor.templates.placeholderText
  if (token === 'contentsItem') {
    return placeholders.contentsItem({ index: Number(index) || 1 })
  }

  const values: Record<TemplateTextToken, string> = {
    presentationTitle: LL.editor.presentation.untitled(),
    coverTitle: placeholders.coverTitle(),
    coverSubtitle: placeholders.coverSubtitle(),
    coverDescription: placeholders.coverDescription(),
    presenter: placeholders.presenter(),
    date: placeholders.date(),
    time: placeholders.time(),
    businessReport: placeholders.businessReport(),
    contentsTitle: placeholders.contentsTitle(),
    sectionTitle: placeholders.sectionTitle(),
    sectionBody: placeholders.sectionBody(),
    contentTitle: placeholders.contentTitle(),
    itemTitle: placeholders.itemTitle(),
    itemBody: placeholders.itemBody(),
    thankYou: placeholders.thankYou(),
    welcome: placeholders.welcome(),
    title1: placeholders.title1(),
    title2: placeholders.title2(),
    title3: placeholders.title3(),
    title4: placeholders.title4(),
    bodyText: placeholders.bodyText(),
    contentsItem: '',
  }
  return values[token]
}

const stripConfiguredFontFamilies = (value: string, config: TemplateNormalizationConfig) => {
  if (EXTRAS_ENABLED) return value
  return config.stripFontFamiliesWhenExtrasDisabled.reduce((text, font) => {
    return text
      .replace(new RegExp(`font-family:\\s*${font}\\s*;?`, 'gi'), '')
      .replace(new RegExp(`font-family:\\s*['"]?${font}['"]?\\s*;?`, 'gi'), '')
  }, value)
}

const localizeTemplateString = (value: string, LL: TranslationFunctions, config: TemplateNormalizationConfig) => {
  const withoutExtrasFonts = stripConfiguredFontFamilies(value, config)
  const withLocalAssets = withoutExtrasFonts.replace(TEMPLATE_ASSET_TOKEN_RE, (_match, asset: string) => {
    return resolveTemplateAssetUrl(asset)
  })
  return withLocalAssets.replace(TEMPLATE_TOKEN_RE, (match, token: TemplateTextToken, index?: string) => {
    if (!TEMPLATE_TEXT_TOKENS.has(token)) return match
    return replacementForToken(token, LL, index)
  })
}

export const normalizeTemplatePayload = (
  payload: TemplatePayload | Slide[],
  LL: TranslationFunctions,
  config: TemplateNormalizationConfig = TEMPLATE_NORMALIZATION_CONFIG,
): TemplatePayload => {
  const data = Array.isArray(payload) ? { slides: payload } : payload
  const normalized = JSON.parse(JSON.stringify(data), (_key, value) => {
    return typeof value === 'string' ? localizeTemplateString(value, LL, config) : value
  }) as TemplatePayload
  normalized.slides = Array.isArray(normalized.slides) ? normalized.slides : []
  return normalized
}
