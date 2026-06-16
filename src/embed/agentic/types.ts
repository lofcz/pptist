import type { Locales } from '@/i18n/locale'
import type { ShapeCategoryKey, ShapePoolItem } from '@/configs/shapes'
import type {
  Broken2LineDirection,
  ChartData,
  ChartOptions,
  ChartType,
  Gradient,
  LinePoint,
  LineStyleType,
  Note,
  NoteReply,
  PPTAnimation,
  PPTAudioElement,
  PPTChartElement,
  PPTElement,
  PPTElementLink,
  PPTElementOutline,
  PPTElementShadow,
  PPTImageElement,
  PPTLatexElement,
  PPTLineElement,
  PPTShapeElement,
  PPTTableElement,
  PPTTextElement,
  PPTVideoElement,
  ShapeText,
  Slide,
  SlideBackground,
  SlideTemplate,
  SlideTheme,
  TableCell,
  TableCellStyle,
  TextAlign,
  TurningMode,
} from '@/types/slides'
import type { PptistDocument } from '../types'
import type {
  PptistTemplateSlidesCatalogResult,
  PptistTemplateSummary,
} from './templates'
import type {
  PptistLayout,
  PptistLayoutBackgroundMode,
} from './layouts'
import type { PptistStyleSummary } from './styles'
import type {
  PptistAgenticDocs,
  PptistCommandDescription,
  PptistDesignGuide,
  PptistDomainSummary,
} from './manifestDocs'

export type {
  PptistAgenticDocs,
  PptistCommandDescription,
  PptistCommandDoc,
  PptistDesignGuide,
  PptistDesignSystem,
  PptistDocParam,
  PptistDomainDoc,
  PptistDomainSummary,
} from './manifestDocs'

export type {
  PptistTemplateSummary,
  PptistTemplateSlideEntry,
  PptistTemplateSlidesCatalog,
  PptistTemplateSlidesCatalogResult,
} from './templates'

export type {
  PptistLayout,
  PptistLayoutSlotDef,
  PptistLayoutBackgroundMode,
} from './layouts'

export type {
  PptistStyleSummary,
  PptistStylePreset,
  PptistStylePalette,
  PptistStyleScale,
  PptistStyleFonts,
} from './styles'

export type PptistKnownCommandType = keyof PptistCommandPayloadMap
export type PptistCommandType = PptistKnownCommandType | (string & {})

export interface PptistDeckViewport {
  size: number
  ratio: number
}

export type PptistSlideThemePatch = Omit<Partial<SlideTheme>, 'outline' | 'shadow'> & {
  outline?: Partial<SlideTheme['outline']>
  shadow?: Partial<SlideTheme['shadow']>
}

export type PptistDeckDocument = Omit<PptistDocument, 'theme'> & {
  theme: SlideTheme
  viewport: PptistDeckViewport
  templates: SlideTemplate[]
}

export type PptistDeckInput = Omit<PptistDocument, 'theme'> & {
  theme?: PptistSlideThemePatch
  viewport?: Partial<PptistDeckViewport>
  templates?: SlideTemplate[]
}

export interface PptistDeckPatch {
  title?: string
  slides?: Slide[]
  theme?: PptistSlideThemePatch
  viewport?: Partial<PptistDeckViewport>
  templates?: SlideTemplate[]
}

export type PptistDocumentImportPayload = PptistDeckInput | { document: PptistDeckInput }

export interface PptistThemeExtractionOptions {
  slideIds?: string[]
  maxThemeColors?: number
}

export interface PptistApplyThemeOptions {
  applyToSlides?: boolean
  includeElementStyles?: boolean
}

export interface PptistCommandMeta {
  commit?: boolean
  dryRun?: boolean
  source?: 'agent' | 'host' | 'ui'
  label?: string
}

export interface PptistAgentCommand<TPayload = unknown, TType extends PptistCommandType = PptistCommandType> {
  id?: string
  type: TType
  payload?: TPayload
  meta?: PptistCommandMeta
}

export type PptistKnownAgentCommand<TType extends PptistKnownCommandType = PptistKnownCommandType> = {
  [Type in TType]: PptistAgentCommand<PptistCommandPayloadMap[Type], Type>
}[TType]

export type PptistKnownCommandResult<TType extends PptistKnownCommandType = PptistKnownCommandType> = {
  [Type in TType]: PptistCommandResult<PptistCommandResultDataMap[Type]>
}[TType]

export interface PptistCommandIssue {
  code: string
  message: string
  path?: string
  recoverable?: boolean
}

export interface PptistCommandResult<TData = unknown> {
  ok: boolean
  commandId?: string
  type: PptistCommandType
  changed: boolean
  documentVersion: number
  snapshotId?: number
  data?: TData
  errors?: PptistCommandIssue[]
  warnings?: PptistCommandIssue[]
}

export interface PptistBatchOptions {
  atomic?: boolean
  commit?: boolean
  dryRun?: boolean
}

export type PptistJsonPrimitive = string | number | boolean | null
export type PptistJsonValue = PptistJsonPrimitive | PptistJsonValue[] | { [key: string]: PptistJsonValue }
export type PptistMediaAssetKind = 'image' | 'video' | 'audio'
export type PptistMediaAssetInput = string | PptistMediaAsset

export interface PptistMediaAsset {
  id?: string
  kind?: PptistMediaAssetKind
  src: string
  ext?: string
  mimeType?: string
  filename?: string
  title?: string
  width?: number
  height?: number
  size?: number
  poster?: string
  metadata?: { [key: string]: PptistJsonValue }
}

export interface PptistMediaAssetResolverRequest {
  kind: PptistMediaAssetKind
  asset: PptistMediaAssetInput
  slideId?: string
  elementId?: string
}

export interface PptistMediaAssetResolverResult {
  asset: PptistMediaAsset
  warnings?: PptistCommandIssue[]
}

export type PptistBridgeEventType =
  | 'documentChanged'
  | 'selectionChanged'
  | 'commandApplied'
  | 'commandFailed'
  | 'destroyed'

export interface PptistBridgeEvent<TData = unknown> {
  type: PptistBridgeEventType
  documentVersion: number
  command?: PptistAgentCommand
  result?: PptistCommandResult
  data?: TData
}

export interface PptistDocumentChangedEvent extends PptistBridgeEvent<PptistDocument> {
  type: 'documentChanged'
}

export interface PptistSelectionChangedEvent extends PptistBridgeEvent<PptistBridgeState> {
  type: 'selectionChanged'
}

export interface PptistCommandAppliedEvent<TData = unknown> extends PptistBridgeEvent<TData> {
  type: 'commandApplied'
  command: PptistAgentCommand
  result: PptistCommandResult<TData>
}

export interface PptistCommandFailedEvent extends PptistBridgeEvent {
  type: 'commandFailed'
  command: PptistAgentCommand
  result: PptistCommandResult
}

export interface PptistDestroyedEvent extends PptistBridgeEvent {
  type: 'destroyed'
}

export type PptistTypedBridgeEvent =
  | PptistDocumentChangedEvent
  | PptistSelectionChangedEvent
  | PptistCommandAppliedEvent
  | PptistCommandFailedEvent
  | PptistDestroyedEvent

export type PptistBridgeListener = (event: PptistBridgeEvent) => void
export type PptistUnsubscribe = () => void

export interface PptistBridgeState {
  title: string
  slideIndex: number
  slideCount: number
  currentSlideId?: string
  selectedSlideIndexes: number[]
  selectedElementIds: string[]
  handleElementId: string
  activeGroupElementId: string
  hiddenElementIds: string[]
  viewportSize: number
  viewportRatio: number
  canvasScale: number
  canvasPercentage: number
  screening: boolean
  canUndo: boolean
  canRedo: boolean
  documentVersion: number
  locale?: Locales
}

export interface PptistAgentCapability {
  ok: boolean
  reason?: string
  warnings?: PptistCommandIssue[]
}

export interface PptistCreateSlideInput {
  slide?: Partial<Slide>
  index?: number
  select?: boolean
}

export interface PptistDeleteSlidesResult {
  deleted: string[]
  slideIndex: number
  currentSlideId?: string
}

export type PptistIdMap = Record<string, string>

export interface PptistIdRemap {
  slideIds: PptistIdMap
  elementIds: PptistIdMap
  groupIds: PptistIdMap
  animationIds: PptistIdMap
}

export interface PptistInsertSlidesInput {
  slides: Slide | Slide[]
  index?: number
  select?: boolean
  preserveExternalSlideLinks?: boolean
}

export interface PptistInsertSlidesResult {
  slides: Slide[]
  remap: PptistIdRemap
}

export interface PptistCreateElementInput {
  slideId?: string
  index?: number
  element: Partial<PPTElement> & { type: PPTElement['type'] }
  select?: boolean
}

export interface PptistShapePreset extends ShapePoolItem {
  id: string
  categoryKey: ShapeCategoryKey
  index: number
}

export type PptistShapePatch = Omit<Partial<Pick<
  PPTShapeElement,
  | 'path'
  | 'viewBox'
  | 'fixedRatio'
  | 'fill'
  | 'gradient'
  | 'pattern'
  | 'outline'
  | 'text'
  | 'pathFormula'
  | 'keypoints'
  | 'left'
  | 'top'
  | 'width'
  | 'height'
  | 'rotate'
  | 'opacity'
  | 'flipH'
  | 'flipV'
  | 'shadow'
  | 'special'
>>, 'outline' | 'text'> & {
  outline?: Partial<NonNullable<PPTShapeElement['outline']>>
  text?: Partial<ShapeText>
}

export type PptistShapeFillInput = string | Pick<PptistShapePatch, 'fill' | 'gradient' | 'pattern'>

export type PptistCreateShapeInput = PptistShapePatch & {
  slideId?: string
  index?: number
  select?: boolean
  presetId?: string
  categoryKey?: ShapeCategoryKey
  presetIndex?: number
  preset?: ShapePoolItem
  element?: Partial<PPTShapeElement>
}

export interface PptistInsertElementsInput {
  slideId?: string
  index?: number
  elements: PPTElement | PPTElement[]
  animations?: PPTAnimation[]
  offset?: number | { left?: number; top?: number }
  select?: boolean
  preserveExternalSlideLinks?: boolean
  slideIdMap?: PptistIdMap
}

export interface PptistInsertElementsResult {
  slideId: string
  elements: PPTElement[]
  animations: PPTAnimation[]
  remap: Omit<PptistIdRemap, 'slideIds'> & { slideIds?: PptistIdMap }
}

export interface PptistLatexElementSizing {
  left?: number
  top?: number
  width?: number
  height?: number
  rotate?: number
}

export type PptistLatexElementInput = PptistLatexElementSizing
  & Pick<PPTLatexElement, 'latex' | 'path'>
  & Partial<Pick<PPTLatexElement, 'id' | 'color' | 'strokeWidth' | 'viewBox' | 'fixedRatio' | 'link' | 'name' | 'lock' | 'groupId'>>

export type PptistLatexElementPatch = Partial<PptistLatexElementSizing
  & Pick<PPTLatexElement, 'latex' | 'path' | 'color' | 'strokeWidth' | 'viewBox' | 'fixedRatio' | 'link' | 'name' | 'lock' | 'groupId'>>

export interface PptistCreateLatexElementInput {
  slideId?: string
  index?: number
  element: PptistLatexElementInput
  select?: boolean
}

export type PptistLinePoint = PPTLineElement['start']
export type PptistLineDirectionInput = Broken2LineDirection | 'auto'

export type PptistLineElementInput =
  Partial<Pick<PPTLineElement, 'id' | 'left' | 'top' | 'width' | 'style' | 'color' | 'points' | 'shadow' | 'broken' | 'broken2' | 'broken2Direction' | 'curve' | 'cubic' | 'link' | 'name' | 'lock' | 'groupId'>>
  & Pick<PPTLineElement, 'start' | 'end'>

export type PptistLineElementPatch = Partial<Pick<
  PPTLineElement,
  | 'left'
  | 'top'
  | 'width'
  | 'start'
  | 'end'
  | 'style'
  | 'color'
  | 'points'
  | 'shadow'
  | 'broken'
  | 'broken2'
  | 'broken2Direction'
  | 'curve'
  | 'cubic'
  | 'link'
  | 'name'
  | 'lock'
  | 'groupId'
>>

export interface PptistCreateLineElementInput {
  slideId?: string
  index?: number
  element: PptistLineElementInput
  select?: boolean
}

export interface PptistLineStyleInput {
  style?: LineStyleType
  color?: string
  width?: number
}

export interface PptistCreateTextInput {
  slideId?: string
  index?: number
  /** HTML content (wins over `markdown` when both are supplied). */
  content?: string
  /** Markdown content; converted to HTML by the bridge. */
  markdown?: string
  element?: Partial<PPTTextElement>
  select?: boolean
}

export interface PptistTextContentUpdateInput {
  content?: string
  prepend?: string
  append?: string
}

export type PptistTextStylePatch = Partial<Pick<
  PPTTextElement,
  | 'defaultFontName'
  | 'defaultColor'
  | 'outline'
  | 'fill'
  | 'lineHeight'
  | 'wordSpace'
  | 'opacity'
  | 'shadow'
  | 'paragraphSpace'
  | 'vertical'
  | 'textType'
  | 'inset'
>>

export interface PptistVideoPlaybackPatch {
  src?: string
  ext?: string
  autoplay?: boolean
  poster?: string
}

export interface PptistVideoSourcePatch {
  src: string
  ext?: string
}

export interface PptistVideoSizePatch {
  width?: number
  height?: number
}

export interface PptistVideoPositionPatch {
  left?: number
  top?: number
  rotate?: number
}

export interface PptistVideoStylePatch {
  lock?: boolean
  groupId?: string
  name?: string
  link?: PPTElementLink
}

export type PptistVideoPatch =
  PptistVideoPlaybackPatch &
  PptistVideoSizePatch &
  PptistVideoPositionPatch &
  PptistVideoStylePatch

export interface PptistChartElementPatch {
  chartType?: ChartType
  data?: ChartData
  options?: ChartOptions
  fill?: PPTChartElement['fill']
  outline?: Partial<NonNullable<PPTChartElement['outline']>>
  themeColors?: string[]
  textColor?: string
  lineColor?: string
}

export type PptistCreateChartInput = PptistChartElementPatch & Partial<Pick<PPTChartElement, 'id' | 'left' | 'top' | 'width' | 'height' | 'rotate'>> & {
  slideId?: string
  index?: number
  select?: boolean
}

export type PptistTableElementPatch = Partial<Omit<PPTTableElement, 'type' | 'id' | 'outline' | 'theme'>> & {
  outline?: Partial<PPTTableElement['outline']>
  theme?: Partial<NonNullable<PPTTableElement['theme']>>
}

export type PptistCreateTableInput = PptistTableElementPatch & {
  id?: string
  slideId?: string
  index?: number
  select?: boolean
  element?: Partial<PPTTableElement>
}

export type PptistSlideReference = string | number

export type PptistRichTextStylePatch =
  Partial<Pick<PPTTextElement, 'defaultFontName' | 'defaultColor' | 'lineHeight' | 'paragraphSpace' | 'wordSpace' | 'inset' | 'vertical'>> &
  Partial<Pick<ShapeText, 'align'>>

export interface PptistRichTextParagraphAttrs {
  align?: TextAlign | ''
  indent?: number
  textIndent?: number
}

export type PptistRichTextElement = PPTTextElement | PPTShapeElement
export type PptistOutlineElement = PPTTextElement | PPTImageElement | PPTShapeElement | PPTChartElement | PPTTableElement
export type PptistShadowElement = PPTTextElement | PPTImageElement | PPTShapeElement | PPTLineElement
export type PptistFillElement = PPTTextElement | PPTShapeElement | PPTChartElement

export interface PptistAnimationPreset {
  name: string
  value: string
}

export interface PptistAnimationPresetGroup {
  type: string
  name: string
  children: PptistAnimationPreset[]
}

export interface PptistSlideAnimationPreset {
  label: string
  value: TurningMode
}

export interface PptistAnimationCatalog {
  enter: PptistAnimationPresetGroup[]
  exit: PptistAnimationPresetGroup[]
  attention: PptistAnimationPresetGroup[]
  slide: PptistSlideAnimationPreset[]
}

export interface PptistAnimationSequenceStep {
  index: number
  animations: PPTAnimation[]
  autoNext: boolean
}

export interface PptistSlideTransition {
  slideId: string
  turningMode?: TurningMode
}

export interface PptistElementTransformPatch {
  left?: number
  top?: number
  width?: number
  height?: number
  rotate?: number
  opacity?: number
  flipH?: boolean
  flipV?: boolean
}

export type PptistAudioTransformPatch = Pick<PptistElementTransformPatch, 'left' | 'top' | 'width' | 'height' | 'rotate'>

export type PptistAudioSourceInput = PptistMediaAssetInput

export type PptistAudioElementPatch = Partial<Pick<
  PPTAudioElement,
  | 'src'
  | 'ext'
  | 'autoplay'
  | 'loop'
  | 'color'
  | 'fixedRatio'
  | 'link'
  | 'name'
  | 'lock'
  | 'groupId'
>> & {
  transform?: PptistAudioTransformPatch
}

export interface PptistCreateAudioInput extends PptistAudioElementPatch {
  id?: string
  source?: PptistAudioSourceInput
  slideId?: string
  index?: number
  select?: boolean
}

export interface PptistElementMoveInput {
  left?: number
  top?: number
  dx?: number
  dy?: number
}

export interface PptistElementResizeInput {
  width?: number
  height?: number
  dw?: number
  dh?: number
}

export interface PptistElementFlipInput {
  flipH?: boolean
  flipV?: boolean
}

export interface PptistApplyTemplateResult {
  templateId: string
  theme: SlideTheme
}

export interface PptistInsertFromTemplateInput {
  /** Built-in template id from `templates.catalog` (e.g. `template_1` = Crimson landscape). */
  templateId: string
  /** Slide slug from `templates.slidesCatalog` (e.g. `cover_1`, `content_2`). */
  slug: string
  index?: number
  select?: boolean
  /** Apply the template theme when the deck is still empty (default true). */
  applyTemplateTheme?: boolean
}

export interface PptistInsertFromTemplateResult {
  slideId: string
  templateId: string
  slug: string
  elementIds: string[]
  textElementIds: string[]
  placeholderElementIds: string[]
}

export interface PptistAgentTemplatesApi {
  /** List built-in presentation templates (styles) shown in the template picker. */
  catalog(): PptistTemplateSummary[]
  /** List insertable slides for a template, grouped by type (cover, contents, …). */
  slidesCatalog(templateId: string, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistTemplateSlidesCatalogResult>>
}

export interface PptistApplyStyleResult {
  /** The preset id actually applied (the requested one, or the default fallback). */
  styleId: string
  theme: SlideTheme
}

export interface PptistCreateFromLayoutInput {
  /** Layout id from `layouts.catalog` (e.g. `title`, `bullets`, `twoColumn`). */
  layoutId: string
  /** Content slots for the layout. Keys + shapes are described per layout in the catalog. */
  slots?: Record<string, unknown>
  index?: number
  select?: boolean
  /** Force a feature (dark) or plain background; defaults to the layout's own preference. */
  backgroundMode?: PptistLayoutBackgroundMode
}

export interface PptistCreateFromLayoutResult {
  slideId: string
  layoutId: string
  elementIds: string[]
  textElementIds: string[]
}

export interface PptistAgentStylesApi {
  /** List the contrast-safe visual identity presets (academic/minimal/bold/playful). */
  catalog(): PptistStyleSummary[]
}

export interface PptistAgentLayoutsApi {
  /** List the compositional slide recipes and their content slots. */
  catalog(): PptistLayout[]
}

export interface PptistAgentDeckApi {
  get(): PptistDeckDocument
  set(document: PptistDeckInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistDeckDocument>>
  patch(patch: PptistDeckPatch, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistDeckDocument>>
  setTitle(title: string, meta?: PptistCommandMeta): Promise<PptistCommandResult<{ title: string }>>
  getTheme(): SlideTheme
  setTheme(theme: PptistSlideThemePatch, meta?: PptistCommandMeta): Promise<PptistCommandResult<SlideTheme>>
  applyTemplate(templateId: string, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistApplyTemplateResult>>
  /** Apply a style preset (from `styles.catalog`) as the deck's visual identity; records `theme.styleId`. */
  applyStyle(styleId: string, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistApplyStyleResult>>
  applyTheme(theme: PptistSlideThemePatch, options?: PptistApplyThemeOptions, meta?: PptistCommandMeta): Promise<PptistCommandResult<SlideTheme>>
  extractTheme(options?: PptistThemeExtractionOptions): SlideTheme
  setViewport(viewport: { size?: number; ratio?: number }, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistBridgeState>>
  setTemplates(templates: SlideTemplate[], meta?: PptistCommandMeta): Promise<PptistCommandResult<SlideTemplate[]>>
}

export interface PptistAgentSlidesApi {
  list(): Slide[]
  get(slideIdOrIndex?: PptistSlideReference): Slide | null
  current(): Slide | null
  read(slideIdOrIndex?: PptistSlideReference, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide | null>>
  create(input?: PptistCreateSlideInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide>>
  /** Build + insert a themed slide from a layout recipe (from `layouts.catalog`) using the active style preset. */
  createFromLayout(input: PptistCreateFromLayoutInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistCreateFromLayoutResult>>
  insertFromTemplate(input: PptistInsertFromTemplateInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistInsertFromTemplateResult>>
  insert(input: PptistInsertSlidesInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistInsertSlidesResult>>
  update(slideId: string, patch: Partial<Slide>, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide>>
  delete(slideId: string | string[], meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistDeleteSlidesResult>>
  duplicate(slideIdOrIndex?: PptistSlideReference, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide>>
  move(slideIdOrIndex: PptistSlideReference, toIndex: number, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide[]>>
  select(slideIdOrIndex: PptistSlideReference, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistBridgeState>>
  setBackground(slideId: string, background?: SlideBackground, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide>>
  applyBackground(background: SlideBackground, slideIds?: string[], meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide[]>>
  applyBackgroundToAll(background: SlideBackground, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide[]>>
  getTransition(slideId?: string): PptistSlideTransition
  setTransition(slideId: string, turningMode?: TurningMode, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide>>
  getRemark(slideId?: string): string
  setRemark(slideId: string, remark: string, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide>>
}

export interface PptistAgentElementsApi {
  list(slideId?: string): PPTElement[]
  get(elementId: string, slideId?: string): PPTElement | null
  create(input: PptistCreateElementInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTElement>>
  insert(input: PptistInsertElementsInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistInsertElementsResult>>
  update(elementId: string | string[], patch: Partial<PPTElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  setTransform(elementId: string | string[], transform: PptistElementTransformPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  move(elementId: string | string[], position: PptistElementMoveInput, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  resize(elementId: string | string[], size: PptistElementResizeInput, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  rotate(elementId: string | string[], rotate: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  setOpacity(elementId: string | string[], opacity: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  setFlip(elementId: string | string[], flip: PptistElementFlipInput, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  delete(elementId: string | string[], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<{ deleted: string[] }>>
  reorder(elementId: string, toIndex: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  bringForward(elementId: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  sendBackward(elementId: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  bringToFront(elementId: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  sendToBack(elementId: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  select(elementId: string | string[], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistBridgeState>>
  selectGroup(groupIdOrElementId: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistBridgeState>>
  clearSelection(meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistBridgeState>>
  setHandle(elementId: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistBridgeState>>
  group(elementIds: string[], groupId?: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  ungroup(groupIdOrElementId: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  lock(elementId: string | string[], locked?: boolean, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTElement[]>>
  unlock(elementId: string | string[], meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTElement[]>>
  hide(elementId: string | string[], hidden?: boolean, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistBridgeState>>
  show(elementId: string | string[], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistBridgeState>>
  setLink(elementId: string, link?: PPTElementLink, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  setOutline(elementId: string | string[], outline: PPTElementOutline, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistOutlineElement[]>>
  setShadow(elementId: string | string[], shadow: PPTElementShadow, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistShadowElement[]>>
  setFill(elementId: string | string[], fill: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistFillElement[]>>
  setGradient(elementId: string | string[], gradient: Gradient, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTShapeElement[]>>
  setColorMask(elementId: string | string[], colorMask: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement[]>>
}

export interface PptistAgentTextApi {
  list(slideId?: string): PPTTextElement[]
  get(elementId: string, slideId?: string): PPTTextElement | null
  create(input?: PptistCreateTextInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTTextElement>>
  update(elementId: string, patch: Partial<PPTTextElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTextElement>>
  delete(elementId: string | string[], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<{ deleted: string[] }>>
  getContent(elementId: string, slideId?: string): string | null
  setContent(elementId: string, content: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTextElement>>
  /** Replace content from a Markdown string (converted to HTML). */
  setMarkdown(elementId: string, markdown: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTextElement>>
  updateContent(elementId: string, update: PptistTextContentUpdateInput, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTextElement>>
  clearContent(elementId: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTextElement>>
  setStyle(elementId: string, style: PptistTextStylePatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTextElement>>
}

export interface PptistAgentShapesApi {
  presets(categoryKey?: ShapeCategoryKey): PptistShapePreset[]
  get(elementId: string, slideId?: string): PPTShapeElement | null
  create(input?: PptistCreateShapeInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTShapeElement>>
  patch(elementId: string, patch: PptistShapePatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTShapeElement>>
  update(elementId: string, patch: PptistShapePatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTShapeElement>>
  setPath(elementId: string, path: string, options?: Pick<PptistShapePatch, 'viewBox' | 'fixedRatio'>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTShapeElement>>
  setFormula(elementId: string, pathFormula: PPTShapeElement['pathFormula'], keypoints?: number[], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTShapeElement>>
  setFill(elementId: string, fill: PptistShapeFillInput, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTShapeElement>>
  setOutline(elementId: string, outline?: PptistShapePatch['outline'], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTShapeElement>>
  setText(elementId: string, text: Partial<ShapeText>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTShapeElement>>
}

export interface PptistAgentLinesApi {
  get(elementId: string, slideId?: string): PPTLineElement | null
  create(input: PptistCreateLineElementInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTLineElement>>
  update(elementId: string, patch: PptistLineElementPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTLineElement>>
  setStyle(elementId: string, style: PptistLineStyleInput, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTLineElement>>
  setArrowheads(elementId: string, points: [LinePoint, LinePoint], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTLineElement>>
  setDirection(elementId: string, direction?: PptistLineDirectionInput, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTLineElement>>
}

export interface PptistAgentAnimationsApi {
  list(slideId?: string, elementId?: string): PPTAnimation[]
  catalog(): PptistAnimationCatalog
  sequence(slideId?: string): PptistAnimationSequenceStep[]
  create(slideId: string, animation: Partial<PPTAnimation> & { elId: string; effect: string; type: PPTAnimation['type'] }, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTAnimation>>
  update(slideId: string, animationId: string, patch: Partial<PPTAnimation>, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTAnimation>>
  setTrigger(slideId: string, animationId: string, trigger: PPTAnimation['trigger'], meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTAnimation>>
  setDuration(slideId: string, animationId: string, duration: number, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTAnimation>>
  delete(slideId: string, animationId: string | string[], meta?: PptistCommandMeta): Promise<PptistCommandResult<{ deleted: string[] }>>
  reorder(slideId: string, animationId: string, toIndex: number, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTAnimation[]>>
}

export interface PptistAgentTablesApi {
  get(elementId: string, slideId?: string): PPTTableElement | null
  create(input?: PptistCreateTableInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTTableElement>>
  update(elementId: string, patch: PptistTableElementPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
  setCell(elementId: string, row: number, col: number, patch: Partial<TableCell>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
  setCellStyle(elementId: string, row: number, col: number, style: Partial<TableCellStyle>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
  insertRow(elementId: string, rowIndex: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
  deleteRow(elementId: string, rowIndex: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
  insertColumn(elementId: string, colIndex: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
  deleteColumn(elementId: string, colIndex: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
  mergeCells(elementId: string, row: number, col: number, rowspan: number, colspan: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
  splitCell(elementId: string, row: number, col: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
}

export interface PptistAgentChartsApi {
  get(elementId: string, slideId?: string): PPTChartElement | null
  create(input?: PptistCreateChartInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTChartElement>>
  update(elementId: string, patch: PptistChartElementPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
  setType(elementId: string, chartType: ChartType, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
  setData(elementId: string, data: ChartData, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
  setLabels(elementId: string, labels: string[], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
  setLegends(elementId: string, legends: string[], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
  setSeries(elementId: string, index: number, series: number[], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
  addSeries(elementId: string, series: number[], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
  deleteSeries(elementId: string, index: number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
  setOptions(elementId: string, options: ChartOptions, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
}

export type PptistImageFilterKey = keyof NonNullable<PPTImageElement['filters']>

export interface PptistImageMaskInput {
  shape?: NonNullable<PPTImageElement['clip']>['shape']
  radius?: PPTImageElement['radius']
  colorMask?: PPTImageElement['colorMask']
}

export interface PptistImageBackgroundOptions {
  slideId?: string
  size?: NonNullable<SlideBackground['image']>['size']
  deleteElement?: boolean
}

export interface PptistAgentImagesApi {
  get(elementId: string, slideId?: string): PPTImageElement | null
  update(elementId: string, patch: Partial<PPTImageElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setSource(elementId: string, asset: PptistMediaAssetInput, patch?: Partial<PPTImageElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setClip(elementId: string, clip?: PPTImageElement['clip'], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setCrop(elementId: string, range: NonNullable<PPTImageElement['clip']>['range'], shape?: NonNullable<PPTImageElement['clip']>['shape'], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setMask(elementId: string, mask: PptistImageMaskInput, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setRadius(elementId: string, radius?: PPTImageElement['radius'], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setFilters(elementId: string, filters?: PPTImageElement['filters'], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setFilter(elementId: string, key: PptistImageFilterKey, value?: string | number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setOpacity(elementId: string, opacity: string | number, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setFlip(elementId: string, flip: Pick<PPTImageElement, 'flipH' | 'flipV'>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setShadow(elementId: string, shadow?: Partial<NonNullable<PPTImageElement['shadow']>>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setColorMask(elementId: string, colorMask?: PPTImageElement['colorMask'], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setImageType(elementId: string, imageType?: PPTImageElement['imageType'], meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setAsBackground(elementId: string, options?: PptistImageBackgroundOptions, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<Slide>>
}

export interface PptistAgentMediaApi {
  resolveAsset(asset: PptistMediaAssetInput, kind?: PptistMediaAssetKind): PptistMediaAsset
  setImageSource(elementId: string, asset: PptistMediaAssetInput, patch?: Partial<PPTImageElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  setVideoSource(elementId: string, asset: PptistMediaAssetInput, patch?: Partial<PPTVideoElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTVideoElement>>
  setAudioSource(elementId: string, asset: PptistMediaAssetInput, patch?: Partial<PPTAudioElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTAudioElement>>
}

export interface PptistAgentVideosApi {
  get(elementId: string, slideId?: string): PPTVideoElement | null
  update(elementId: string, patch: PptistVideoPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTVideoElement>>
  setSource(elementId: string, source: PptistVideoSourcePatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTVideoElement>>
  setPlayback(elementId: string, playback: PptistVideoPlaybackPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTVideoElement>>
  setAutoplay(elementId: string, autoplay: boolean, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTVideoElement>>
  setPoster(elementId: string, poster: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTVideoElement>>
  setSize(elementId: string, size: PptistVideoSizePatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTVideoElement>>
  setPosition(elementId: string, position: PptistVideoPositionPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTVideoElement>>
}

export interface PptistAgentAudioApi {
  get(elementId: string, slideId?: string): PPTAudioElement | null
  create(input: PptistCreateAudioInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTAudioElement>>
  update(elementId: string, patch: PptistAudioElementPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTAudioElement>>
  setSource(elementId: string, source: PptistAudioSourceInput, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTAudioElement>>
  setPlayback(elementId: string, playback: Pick<PptistAudioElementPatch, 'autoplay' | 'loop'>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTAudioElement>>
  setIcon(elementId: string, icon: Pick<PptistAudioElementPatch, 'color' | 'fixedRatio'>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTAudioElement>>
  transform(elementId: string, transform: PptistAudioTransformPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTAudioElement>>
}

export interface PptistAgentLatexApi {
  get(elementId: string, slideId?: string): PPTLatexElement | null
  create(input: PptistCreateLatexElementInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PPTLatexElement>>
  update(elementId: string, patch: PptistLatexElementPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTLatexElement>>
}

export type PptistNoteReplyInput = Partial<NoteReply> & { content: string; user: string }

export type PptistNoteInput = Partial<Omit<Note, 'replies'>> & {
  content: string
  user: string
  replies?: PptistNoteReplyInput[]
}

export type PptistNotePatch = Partial<Omit<Note, 'replies'>> & {
  replies?: PptistNoteReplyInput[]
}

export interface PptistAgentNotesApi {
  list(slideId: string): Note[]
  create(slideId: string, note: PptistNoteInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<Note>>
  update(slideId: string, noteId: string, patch: PptistNotePatch, meta?: PptistCommandMeta): Promise<PptistCommandResult<Note>>
  delete(slideId: string, noteId: string | string[], meta?: PptistCommandMeta): Promise<PptistCommandResult<{ deleted: string[] }>>
  reply(slideId: string, noteId: string, reply: PptistNoteReplyInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<NoteReply>>
  listReplies(slideId: string, noteId: string): NoteReply[]
  updateReply(slideId: string, noteId: string, replyId: string, patch: Partial<NoteReply>, meta?: PptistCommandMeta): Promise<PptistCommandResult<NoteReply>>
  deleteReply(slideId: string, noteId: string, replyId: string | string[], meta?: PptistCommandMeta): Promise<PptistCommandResult<{ deleted: string[] }>>
}

export interface PptistSectionRange {
  slideId: string
  index: number
  section: NonNullable<Slide['sectionTag']>
  startIndex: number
  endIndex: number
  slideIds: string[]
}

export interface PptistAgentSectionsApi {
  set(slideId: string, section: NonNullable<Slide['sectionTag']>, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide>>
  clear(sectionIdOrSlideId: string, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide>>
  rename(sectionId: string, title: string, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide[]>>
  delete(sectionId: string, meta?: PptistCommandMeta): Promise<PptistCommandResult<{ deleted: string[] }>>
  assignRange(startIndex: number, endIndex: number, section: NonNullable<Slide['sectionTag']>, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide[]>>
  move(sectionId: string, toIndex: number, meta?: PptistCommandMeta): Promise<PptistCommandResult<Slide[]>>
  list(): PptistSectionRange[]
}

export interface PptistSearchResult {
  slideId: string
  elementId: string
  elementType: PPTElement['type']
  path: string
  match: string
  start?: number
  end?: number
  row?: number
  col?: number
}

export interface PptistSearchOptions {
  caseSensitive?: boolean
  regex?: boolean
}

export interface PptistReplaceOptions extends PptistSearchOptions {
  replaceAll?: boolean
}

export interface PptistSearchResults {
  count: number
  results: PptistSearchResult[]
}

export interface PptistSearchReplaceResult {
  count: number
}

export interface PptistAgentSearchApi {
  find(query: string, options?: PptistSearchOptions): Promise<PptistCommandResult<PptistSearchResult[]>>
  replace(query: string, replacement: string, options?: PptistReplaceOptions, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistSearchReplaceResult>>
}

export interface PptistAgentHistoryApi {
  commit(label?: string): Promise<PptistCommandResult<PptistBridgeState>>
  undo(): Promise<PptistCommandResult<PptistBridgeState>>
  redo(): Promise<PptistCommandResult<PptistBridgeState>>
}

export interface PptistAgentExportApi {
  /** Returns the serializable deck model; DOM-dependent PDF/PPTX/image exports are not part of the agentic bridge. */
  json(): PptistDocument
}

export interface PptistAgentImportApi {
  /** Replaces the deck from a JSON-safe document payload. */
  json(document: PptistDeckInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistDeckDocument>>
  /** Replaces the deck from an already-decoded native `.pptist` document payload. */
  pptist(document: PptistDeckInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistDeckDocument>>
  /** Replaces the deck from PPTX data that has already been converted to a JSON-safe document payload. */
  pptxSafe(document: PptistDeckInput, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistDeckDocument>>
}

export interface PptistAgentLinksApi {
  set(elementId: string, link?: PPTElementLink, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
  remove(elementId: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTElement[]>>
}

export interface PptistAgentViewApi {
  getState(): PptistBridgeState
  setLocale(locale: Locales): Promise<PptistCommandResult<{ locale: Locales }>>
  goToSlide(slideIdOrIndex: PptistSlideReference, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistBridgeState>>
  nextSlide(meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistBridgeState>>
  previousSlide(meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistBridgeState>>
  setZoom(scale: number, meta?: PptistCommandMeta): Promise<PptistCommandResult<PptistBridgeState>>
  enterPresentation(): Promise<PptistCommandResult<PptistBridgeState>>
  exitPresentation(): Promise<PptistCommandResult<PptistBridgeState>>
}

export interface PptistAgentElementSubtypeApi {
  text(elementId: string, patch: Partial<PPTTextElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTextElement>>
  setTextContent(elementId: string, content: string, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistRichTextElement>>
  setTextStyle(elementId: string, style: PptistRichTextStylePatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistRichTextElement>>
  setParagraphAttrs(elementId: string, attrs: PptistRichTextParagraphAttrs, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PptistRichTextElement>>
  image(elementId: string, patch: Partial<PPTImageElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTImageElement>>
  shape(elementId: string, patch: PptistShapePatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTShapeElement>>
  line(elementId: string, patch: Partial<PPTLineElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTLineElement>>
  chart(elementId: string, patch: PptistChartElementPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTChartElement>>
  table(elementId: string, patch: Partial<PPTTableElement>, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTTableElement>>
  latex(elementId: string, patch: PptistLatexElementPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTLatexElement>>
  video(elementId: string, patch: PptistVideoPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTVideoElement>>
  audio(elementId: string, patch: PptistAudioElementPatch, meta?: PptistCommandMeta & { slideId?: string }): Promise<PptistCommandResult<PPTAudioElement>>
}

export interface PptistAgentApi {
  getState(): PptistBridgeState
  execute<TData = unknown>(command: PptistAgentCommand): Promise<PptistCommandResult<TData>>
  executeBatch(commands: PptistAgentCommand[], options?: PptistBatchOptions): Promise<PptistCommandResult[]>
  canExecute(command: PptistAgentCommand): PptistAgentCapability
  subscribe(listener: PptistBridgeListener): PptistUnsubscribe
  /** Convert a Markdown string to the HTML PPTist stores. Math support is loaded on demand. */
  markdownToHtml(markdown: string): Promise<string>
  /** Full authoring docs: design system, domain/command notes, and guides. */
  docs(): PptistAgenticDocs
  /** Domains with their live command lists, for hierarchical discovery. */
  domains(): PptistDomainSummary[]
  /** Drill into one command: its doc annotation merged with live registry facts. */
  describe(commandType: string): PptistCommandDescription | null
  /** Slide composition recipes; pass a guide id to fetch a single guide. */
  guides(guideId?: string): PptistDesignGuide[] | PptistDesignGuide | null
  deck: PptistAgentDeckApi
  slides: PptistAgentSlidesApi
  templates: PptistAgentTemplatesApi
  styles: PptistAgentStylesApi
  layouts: PptistAgentLayoutsApi
  elements: PptistAgentElementsApi
  text: PptistAgentTextApi
  shapes: PptistAgentShapesApi
  lines: PptistAgentLinesApi
  element: PptistAgentElementSubtypeApi
  animations: PptistAgentAnimationsApi
  tables: PptistAgentTablesApi
  charts: PptistAgentChartsApi
  images: PptistAgentImagesApi
  media: PptistAgentMediaApi
  videos: PptistAgentVideosApi
  audio: PptistAgentAudioApi
  latex: PptistAgentLatexApi
  links: PptistAgentLinksApi
  notes: PptistAgentNotesApi
  sections: PptistAgentSectionsApi
  search: PptistAgentSearchApi
  history: PptistAgentHistoryApi
  view: PptistAgentViewApi
  import: PptistAgentImportApi
  export: PptistAgentExportApi
}

export interface PptistCommandPayloadMap {
  'deck.get': undefined
  'deck.set': PptistDeckInput | PptistDocument
  'deck.patch': PptistDeckPatch | Partial<PptistDocument>
  'deck.setTitle': { title: string }
  'deck.getTheme': undefined
  'deck.setTheme': { theme: PptistSlideThemePatch | Partial<SlideTheme> }
  'deck.applyTheme': { theme: PptistSlideThemePatch | Partial<SlideTheme>; options?: PptistApplyThemeOptions }
  'deck.applyTemplate': { templateId: string }
  'deck.applyStyle': { styleId: string }
  'deck.extractTheme': { options?: PptistThemeExtractionOptions } | undefined
  'deck.setViewport': { size?: number; ratio?: number }
  'deck.setTemplates': { templates: SlideTemplate[] }
  'templates.catalog': undefined
  'templates.slidesCatalog': { templateId: string }
  'styles.catalog': undefined
  'layouts.catalog': undefined
  'import.json': PptistDocumentImportPayload
  'import.pptist': PptistDocumentImportPayload
  'import.pptxSafe': PptistDocumentImportPayload
  'export.json': undefined
  'slides.list': undefined
  'slides.get': { slideId?: string; slideIdOrIndex?: PptistSlideReference } | undefined
  'slides.current': undefined
  'slides.read': { slideIdOrIndex?: PptistSlideReference } | undefined
  'slides.create': PptistCreateSlideInput | undefined
  'slides.createFromLayout': PptistCreateFromLayoutInput
  'slides.insertFromTemplate': PptistInsertFromTemplateInput
  'slides.insert': PptistInsertSlidesInput
  'slides.update': { slideId: string; patch: Partial<Slide> }
  'slides.delete': { slideId: string | string[] }
  'slides.duplicate': { slideId?: string; slideIdOrIndex?: PptistSlideReference } | undefined
  'slides.move': { slideId?: string; slideIdOrIndex?: PptistSlideReference; toIndex: number }
  'slides.select': { slideIdOrIndex: PptistSlideReference }
  'slides.setBackground': { slideId: string; background?: SlideBackground }
  'slides.applyBackground': { background: SlideBackground; slideIds?: string[] }
  'slides.applyBackgroundToAll': { background: SlideBackground }
  'slides.getTransition': { slideId?: string } | undefined
  'slides.setTransition': { slideId: string; turningMode?: TurningMode }
  'slides.getRemark': { slideId?: string } | undefined
  'slides.setRemark': { slideId: string; remark: string }
  'elements.list': { slideId?: string } | undefined
  'elements.get': { elementId: string; slideId?: string }
  'elements.create': PptistCreateElementInput
  'elements.insert': PptistInsertElementsInput
  'elements.update': { elementId: string | string[]; slideId?: string; patch: Partial<PPTElement> }
  'elements.setTransform': { elementId: string | string[]; slideId?: string; transform: PptistElementTransformPatch }
  'elements.move': { elementId: string | string[]; slideId?: string; position: PptistElementMoveInput }
  'elements.resize': { elementId: string | string[]; slideId?: string; size: PptistElementResizeInput }
  'elements.rotate': { elementId: string | string[]; slideId?: string; rotate: number }
  'elements.setOpacity': { elementId: string | string[]; slideId?: string; opacity: number }
  'elements.setFlip': { elementId: string | string[]; slideId?: string; flip: PptistElementFlipInput }
  'elements.delete': { elementId: string | string[]; slideId?: string }
  'elements.reorder': { elementId: string; slideId?: string; toIndex: number }
  'elements.bringForward': { elementId: string; slideId?: string }
  'elements.sendBackward': { elementId: string; slideId?: string }
  'elements.bringToFront': { elementId: string; slideId?: string }
  'elements.sendToBack': { elementId: string; slideId?: string }
  'elements.select': { elementId: string | string[]; slideId?: string }
  'elements.selectGroup': { groupIdOrElementId: string; slideId?: string }
  'elements.clearSelection': undefined
  'elements.setHandle': { elementId: string; slideId?: string }
  'elements.group': { elementIds: string[]; groupId?: string }
  'elements.ungroup': { groupIdOrElementId: string }
  'elements.lock': { elementId: string | string[]; locked?: boolean }
  'elements.unlock': { elementId: string | string[] }
  'elements.hide': { elementId: string | string[]; hidden?: boolean }
  'elements.show': { elementId: string | string[] }
  'elements.setLink': { elementId: string; slideId?: string; link?: PPTElementLink }
  'text.list': { slideId?: string } | undefined
  'text.get': { elementId: string; slideId?: string }
  'text.create': PptistCreateTextInput | undefined
  'text.update': { elementId: string; slideId?: string; patch: Partial<PPTTextElement> }
  'text.delete': { elementId: string | string[]; slideId?: string }
  'text.getContent': { elementId: string; slideId?: string }
  'text.setContent': { elementId: string; slideId?: string; content: string }
  'text.setMarkdown': { elementId: string; slideId?: string; markdown: string }
  'text.updateContent': { elementId: string; slideId?: string; update: PptistTextContentUpdateInput }
  'text.clearContent': { elementId: string; slideId?: string }
  'text.setStyle': { elementId: string; slideId?: string; style: PptistTextStylePatch }
  'lines.get': { elementId: string; slideId?: string }
  'lines.create': PptistCreateLineElementInput
  'lines.update': { elementId: string; slideId?: string; patch: PptistLineElementPatch }
  'lines.setStyle': { elementId: string; slideId?: string; style: PptistLineStyleInput }
  'lines.setArrowheads': { elementId: string; slideId?: string; points: [LinePoint, LinePoint] }
  'lines.setDirection': { elementId: string; slideId?: string; direction?: PptistLineDirectionInput }
  'animations.list': { slideId?: string; elementId?: string } | undefined
  'animations.catalog': undefined
  'animations.sequence': { slideId?: string } | undefined
  'animations.create': { slideId: string; animation: Partial<PPTAnimation> & { elId: string; effect: string; type: PPTAnimation['type'] } }
  'animations.update': { slideId: string; animationId: string; patch: Partial<PPTAnimation> }
  'animations.setTrigger': { slideId: string; animationId: string; trigger: PPTAnimation['trigger'] }
  'animations.setDuration': { slideId: string; animationId: string; duration: number }
  'animations.delete': { slideId: string; animationId: string | string[] }
  'animations.reorder': { slideId: string; animationId: string; toIndex: number }
  'tables.update': { elementId: string; slideId?: string; patch: PptistTableElementPatch }
  'tables.setCell': { elementId: string; slideId?: string; row: number; col: number; patch: Partial<TableCell> }
  'tables.setCellStyle': { elementId: string; slideId?: string; row: number; col: number; style: Partial<TableCellStyle> }
  'tables.insertRow': { elementId: string; slideId?: string; rowIndex: number }
  'tables.deleteRow': { elementId: string; slideId?: string; rowIndex: number }
  'tables.insertColumn': { elementId: string; slideId?: string; colIndex: number }
  'tables.deleteColumn': { elementId: string; slideId?: string; colIndex: number }
  'tables.mergeCells': { elementId: string; slideId?: string; row: number; col: number; rowspan: number; colspan: number }
  'tables.splitCell': { elementId: string; slideId?: string; row: number; col: number }
  'charts.create': PptistCreateChartInput | undefined
  'charts.update': { elementId: string; slideId?: string; patch: PptistChartElementPatch | Partial<PPTChartElement> }
  'charts.setType': { elementId: string; slideId?: string; chartType: ChartType }
  'charts.setData': { elementId: string; slideId?: string; data: ChartData }
  'charts.setLabels': { elementId: string; slideId?: string; labels: string[] }
  'charts.setLegends': { elementId: string; slideId?: string; legends: string[] }
  'charts.setSeries': { elementId: string; slideId?: string; index: number; series: number[] }
  'charts.addSeries': { elementId: string; slideId?: string; series: number[] }
  'charts.deleteSeries': { elementId: string; slideId?: string; index: number }
  'charts.setOptions': { elementId: string; slideId?: string; options: ChartOptions }
  'images.update': { elementId: string; slideId?: string; patch: Partial<PPTImageElement> }
  'images.setSource': { elementId: string; slideId?: string; asset: PptistMediaAssetInput; patch?: Partial<PPTImageElement> }
  'images.setClip': { elementId: string; slideId?: string; clip?: PPTImageElement['clip'] }
  'images.setCrop': { elementId: string; slideId?: string; range: NonNullable<PPTImageElement['clip']>['range']; shape?: NonNullable<PPTImageElement['clip']>['shape'] }
  'images.setMask': { elementId: string; slideId?: string; mask: PptistImageMaskInput }
  'images.setRadius': { elementId: string; slideId?: string; radius?: PPTImageElement['radius'] }
  'images.setFilters': { elementId: string; slideId?: string; filters?: PPTImageElement['filters'] }
  'images.setFilter': { elementId: string; slideId?: string; key: PptistImageFilterKey; value?: string | number }
  'images.setOpacity': { elementId: string; slideId?: string; opacity: string | number }
  'images.setFlip': { elementId: string; slideId?: string; flip: Pick<PPTImageElement, 'flipH' | 'flipV'> }
  'images.setShadow': { elementId: string; slideId?: string; shadow?: Partial<NonNullable<PPTImageElement['shadow']>> }
  'images.setColorMask': { elementId: string; slideId?: string; colorMask?: PPTImageElement['colorMask'] }
  'images.setImageType': { elementId: string; slideId?: string; imageType?: PPTImageElement['imageType'] }
  'images.setAsBackground': { elementId: string; slideId?: string; options?: PptistImageBackgroundOptions }
  'media.resolveAsset': { asset: PptistMediaAssetInput; kind?: PptistMediaAssetKind }
  'media.setImageSource': { elementId: string; slideId?: string; asset: PptistMediaAssetInput; patch?: Partial<PPTImageElement> }
  'media.setVideoSource': { elementId: string; slideId?: string; asset: PptistMediaAssetInput; patch?: Partial<PPTVideoElement> }
  'media.setAudioSource': { elementId: string; slideId?: string; asset: PptistMediaAssetInput; patch?: Partial<PPTAudioElement> }
  'videos.get': { elementId: string; slideId?: string }
  'videos.update': { elementId: string; slideId?: string; patch: PptistVideoPatch }
  'videos.setSource': { elementId: string; slideId?: string; source: PptistVideoSourcePatch }
  'videos.setPlayback': { elementId: string; slideId?: string; playback: PptistVideoPlaybackPatch }
  'videos.setAutoplay': { elementId: string; slideId?: string; autoplay: boolean }
  'videos.setPoster': { elementId: string; slideId?: string; poster: string }
  'videos.setSize': { elementId: string; slideId?: string; size: PptistVideoSizePatch }
  'videos.setPosition': { elementId: string; slideId?: string; position: PptistVideoPositionPatch }
  'links.set': { elementId: string; slideId?: string; link?: PPTElementLink }
  'links.remove': { elementId: string; slideId?: string }
  'notes.create': { slideId: string; note: PptistNoteInput }
  'notes.update': { slideId: string; noteId: string; patch: PptistNotePatch }
  'notes.delete': { slideId: string; noteId: string | string[] }
  'notes.reply': { slideId: string; noteId: string; reply: PptistNoteReplyInput }
  'notes.listReplies': { slideId: string; noteId: string }
  'notes.updateReply': { slideId: string; noteId: string; replyId: string; patch: Partial<NoteReply> }
  'notes.deleteReply': { slideId: string; noteId: string; replyId: string | string[] }
  'sections.set': { slideId: string; section: NonNullable<Slide['sectionTag']> }
  'sections.clear': { sectionIdOrSlideId: string }
  'sections.rename': { sectionId: string; title: string }
  'sections.delete': { sectionId: string }
  'sections.assignRange': { startIndex: number; endIndex: number; section: NonNullable<Slide['sectionTag']> }
  'sections.move': { sectionId: string; toIndex: number }
  'search.find': { query: string; options?: PptistSearchOptions }
  'search.replace': { query: string; replacement: string; options?: PptistReplaceOptions }
  'history.commit': { label?: string } | undefined
  'history.undo': undefined
  'history.redo': undefined
  'view.setLocale': { locale: Locales }
  'view.goToSlide': { slideIdOrIndex: PptistSlideReference }
  'view.nextSlide': undefined
  'view.previousSlide': undefined
  'view.setZoom': { scale: number }
  'view.enterPresentation': undefined
  'view.exitPresentation': undefined
}

export interface PptistCommandResultDataMap {
  'deck.get': PptistDeckDocument
  'deck.set': PptistDeckDocument
  'deck.patch': PptistDeckDocument
  'deck.setTitle': { title: string }
  'deck.getTheme': SlideTheme
  'deck.setTheme': SlideTheme
  'deck.applyTheme': SlideTheme
  'deck.applyTemplate': PptistApplyTemplateResult
  'deck.applyStyle': PptistApplyStyleResult
  'deck.extractTheme': SlideTheme
  'deck.setViewport': PptistBridgeState
  'deck.setTemplates': SlideTemplate[]
  'templates.catalog': PptistTemplateSummary[]
  'templates.slidesCatalog': PptistTemplateSlidesCatalogResult
  'styles.catalog': PptistStyleSummary[]
  'layouts.catalog': PptistLayout[]
  'import.json': PptistDeckDocument
  'import.pptist': PptistDeckDocument
  'import.pptxSafe': PptistDeckDocument
  'export.json': PptistDocument
  'slides.list': Slide[]
  'slides.get': Slide | null
  'slides.current': Slide | null
  'slides.read': Slide | null
  'slides.create': Slide
  'slides.createFromLayout': PptistCreateFromLayoutResult
  'slides.insertFromTemplate': PptistInsertFromTemplateResult
  'slides.insert': PptistInsertSlidesResult
  'slides.update': Slide
  'slides.delete': PptistDeleteSlidesResult
  'slides.duplicate': Slide
  'slides.move': Slide[]
  'slides.select': PptistBridgeState
  'slides.setBackground': Slide
  'slides.applyBackground': Slide[]
  'slides.applyBackgroundToAll': Slide[]
  'slides.getTransition': PptistSlideTransition
  'slides.setTransition': Slide
  'slides.getRemark': string
  'slides.setRemark': Slide
  'elements.list': PPTElement[]
  'elements.get': PPTElement | null
  'elements.create': PPTElement
  'elements.insert': PptistInsertElementsResult
  'elements.update': PPTElement[]
  'elements.setTransform': PPTElement[]
  'elements.move': PPTElement[]
  'elements.resize': PPTElement[]
  'elements.rotate': PPTElement[]
  'elements.setOpacity': PPTElement[]
  'elements.setFlip': PPTElement[]
  'elements.delete': { deleted: string[] }
  'elements.reorder': PPTElement[]
  'elements.bringForward': PPTElement[]
  'elements.sendBackward': PPTElement[]
  'elements.bringToFront': PPTElement[]
  'elements.sendToBack': PPTElement[]
  'elements.select': PptistBridgeState
  'elements.selectGroup': PptistBridgeState
  'elements.clearSelection': PptistBridgeState
  'elements.setHandle': PptistBridgeState
  'elements.group': PPTElement[]
  'elements.ungroup': PPTElement[]
  'elements.lock': PPTElement[]
  'elements.unlock': PPTElement[]
  'elements.hide': PptistBridgeState
  'elements.show': PptistBridgeState
  'elements.setLink': PPTElement[]
  'text.list': PPTTextElement[]
  'text.get': PPTTextElement | null
  'text.create': PPTTextElement
  'text.update': PPTTextElement
  'text.delete': { deleted: string[] }
  'text.getContent': string | null
  'text.setContent': PPTTextElement
  'text.setMarkdown': PPTTextElement
  'text.updateContent': PPTTextElement
  'text.clearContent': PPTTextElement
  'text.setStyle': PPTTextElement
  'lines.get': PPTLineElement | null
  'lines.create': PPTLineElement
  'lines.update': PPTLineElement
  'lines.setStyle': PPTLineElement
  'lines.setArrowheads': PPTLineElement
  'lines.setDirection': PPTLineElement
  'animations.list': PPTAnimation[]
  'animations.catalog': PptistAnimationCatalog
  'animations.sequence': PptistAnimationSequenceStep[]
  'animations.create': PPTAnimation
  'animations.update': PPTAnimation
  'animations.setTrigger': PPTAnimation
  'animations.setDuration': PPTAnimation
  'animations.delete': { deleted: string[] }
  'animations.reorder': PPTAnimation[]
  'tables.update': PPTTableElement
  'tables.setCell': PPTTableElement
  'tables.setCellStyle': PPTTableElement
  'tables.insertRow': PPTTableElement
  'tables.deleteRow': PPTTableElement
  'tables.insertColumn': PPTTableElement
  'tables.deleteColumn': PPTTableElement
  'tables.mergeCells': PPTTableElement
  'tables.splitCell': PPTTableElement
  'charts.create': PPTChartElement
  'charts.update': PPTChartElement
  'charts.setType': PPTChartElement
  'charts.setData': PPTChartElement
  'charts.setLabels': PPTChartElement
  'charts.setLegends': PPTChartElement
  'charts.setSeries': PPTChartElement
  'charts.addSeries': PPTChartElement
  'charts.deleteSeries': PPTChartElement
  'charts.setOptions': PPTChartElement
  'images.update': PPTImageElement
  'images.setSource': PPTImageElement
  'images.setClip': PPTImageElement
  'images.setCrop': PPTImageElement
  'images.setMask': PPTImageElement
  'images.setRadius': PPTImageElement
  'images.setFilters': PPTImageElement
  'images.setFilter': PPTImageElement
  'images.setOpacity': PPTImageElement
  'images.setFlip': PPTImageElement
  'images.setShadow': PPTImageElement
  'images.setColorMask': PPTImageElement
  'images.setImageType': PPTImageElement
  'images.setAsBackground': Slide
  'media.resolveAsset': PptistMediaAsset
  'media.setImageSource': PPTImageElement
  'media.setVideoSource': PPTVideoElement
  'media.setAudioSource': PPTAudioElement
  'videos.get': PPTVideoElement
  'videos.update': PPTVideoElement
  'videos.setSource': PPTVideoElement
  'videos.setPlayback': PPTVideoElement
  'videos.setAutoplay': PPTVideoElement
  'videos.setPoster': PPTVideoElement
  'videos.setSize': PPTVideoElement
  'videos.setPosition': PPTVideoElement
  'links.set': PPTElement[]
  'links.remove': PPTElement[]
  'notes.create': Note
  'notes.update': Note
  'notes.delete': { deleted: string[] }
  'notes.reply': NoteReply
  'notes.listReplies': NoteReply[]
  'notes.updateReply': NoteReply
  'notes.deleteReply': { deleted: string[] }
  'sections.set': Slide
  'sections.clear': Slide
  'sections.rename': Slide[]
  'sections.delete': { deleted: string[] }
  'sections.assignRange': Slide[]
  'sections.move': Slide[]
  'search.find': PptistSearchResult[]
  'search.replace': PptistSearchReplaceResult
  'history.commit': PptistBridgeState
  'history.undo': PptistBridgeState
  'history.redo': PptistBridgeState
  'view.setLocale': { locale: Locales }
  'view.goToSlide': PptistBridgeState
  'view.nextSlide': PptistBridgeState
  'view.previousSlide': PptistBridgeState
  'view.setZoom': PptistBridgeState
  'view.enterPresentation': PptistBridgeState
  'view.exitPresentation': PptistBridgeState
}
