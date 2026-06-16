/**
 * Compositional slide layouts for the agentic bridge.
 *
 * A "layout" is a named, pre-composed slide recipe (title, bullets, two-column,
 * image+text, big stat, quote, chart, comparison, …). The agent picks a layout
 * by id and fills a few content *slots*; the builder here lays out themed,
 * contrast-safe elements using the active style preset's role tokens and a
 * fixed margin grid. This is the preferred way to add slides — it removes the
 * need to hand-place boxes or hand-pick colors/sizes, and it never emits raw
 * authoring HTML the agent has to reason about.
 *
 * Text never overflows: every text box is **auto-fit** with `@chenglou/pretext`
 * (the same measurement engine the editor's FitText uses). Each box has a fixed
 * region; the builder measures the content and picks the largest font size from
 * the style scale that still fits the box, shrinking gracefully toward a legible
 * minimum instead of clipping. The agent fills content; sizing is automatic.
 *
 * Builders are deterministic and pure (no store access): given a viewport, a
 * style preset, and slots, they return a `Partial<Slide>` that the bridge
 * normalizes and inserts. Text content is rendered to the small, safe HTML
 * subset PPTist stores (`<p>/<ul>/<li>/<span style>` with inline size and
 * color), with light inline markdown (`**bold**`, `_italic_`, `` `code` ``).
 */
import { layout as pretextLayout, prepare as pretextPrepare } from '@chenglou/pretext'
import type {
  ChartData,
  ChartType,
  PPTChartElement,
  PPTImageElement,
  PPTShapeElement,
  PPTTableElement,
  PPTTextElement,
  Slide,
  SlideBackground,
  TableCell,
  TableCellStyle,
} from '@/types/slides'
import type { PptistStylePreset } from './styles'

/**
 * Un-normalized element inputs the builder emits. Typed as a discriminated
 * union of per-type partials so the engine's required fields are still checked,
 * while letting the bridge's `normalizeElement` fill ids/defaults on insert.
 */
export type PptistLayoutElementInput =
  | (Partial<PPTTextElement> & { type: 'text' })
  | (Partial<PPTShapeElement> & { type: 'shape' })
  | (Partial<PPTImageElement> & { type: 'image' })
  | (Partial<PPTChartElement> & { type: 'chart' })
  | (Partial<PPTTableElement> & { type: 'table' })

export type PptistLayoutBackgroundMode = 'auto' | 'feature' | 'plain'

export interface PptistLayoutSlotDef {
  name: string
  /** Coarse shape of the value the agent should pass for this slot. */
  type: 'text' | 'bullets' | 'image' | 'chart' | 'stats' | 'rows'
  required: boolean
  description: string
}

export interface PptistLayout {
  id: string
  label: string
  /** One-line catalog description of the composition (what it looks like). */
  summary: string
  /** When to reach for it. */
  bestFor: string
  /** Whether it defaults to a feature (dark) background. */
  feature: boolean
  slots: PptistLayoutSlotDef[]
}

// ---------------------------------------------------------------------------
// HTML rendering (safe subset) + slot parsing
// ---------------------------------------------------------------------------

const round = Math.round

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Escape, then apply a tiny, safe inline-markdown subset. */
function inlineFormat(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>')
    .replace(/(^|[^_])_([^_]+?)_(?!_)/g, '$1<em>$2</em>')
}

interface SpanStyle {
  size: number
  color: string
  font: string
  bold?: boolean
}

function spanHtml(value: string, style: SpanStyle): string {
  const inner = style.bold ? `<strong>${inlineFormat(value)}</strong>` : inlineFormat(value)
  return `<span style="font-size:${round(style.size)}px;color:${style.color};font-family:${style.font}">${inner}</span>`
}

interface ParagraphStyle extends SpanStyle {
  align?: 'left' | 'center' | 'right'
}

/** Split a multi-line value into trimmed, non-empty blocks (paragraphs). */
function blocksOf(value: string): string[] {
  return String(value)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
}

function paragraphsHtml(value: string, style: ParagraphStyle): string {
  const lines = blocksOf(value)
  if (!lines.length) return ''
  const align = style.align ?? 'left'
  return lines.map(line => `<p style="text-align:${align}">${spanHtml(line, style)}</p>`).join('')
}

function bulletsHtml(items: string[], style: SpanStyle, ordered = false): string {
  const tag = ordered ? 'ol' : 'ul'
  const lis = items.map(item => `<li>${spanHtml(item, style)}</li>`).join('')
  return `<${tag}>${lis}</${tag}>`
}

function toItems(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean)
  if (value == null) return []
  return String(value)
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/, '').trim())
    .filter(Boolean)
}

type Slots = Record<string, unknown>

function reqStr(slots: Slots, key: string, layoutId: string): string {
  const value = slots[key]
  if (value == null || String(value).trim() === '') {
    throw new Error(`Layout "${layoutId}" requires a non-empty "${key}" slot.`)
  }
  return String(value)
}

function optStr(slots: Slots, key: string): string | undefined {
  const value = slots[key]
  return value == null || String(value).trim() === '' ? undefined : String(value)
}

// ---------------------------------------------------------------------------
// Responsive text fitting (pretext)
// ---------------------------------------------------------------------------

/** Default text-element inset (PPTist uses [10,10,10,10]); subtracted when fitting. */
const TEXT_PAD = 10
/** Horizontal space a list marker + indent steals from a bullet's text column. */
const BULLET_INDENT = 28
/** Vertical gap PPTist leaves between paragraphs (paragraphSpace default). */
const PARAGRAPH_SPACE = 6
/** Vertical gap between list items. */
const BULLET_SPACE = 4

interface FitInput {
  /** Plain-text blocks (paragraphs / bullet items) measured independently. */
  blocks: string[]
  /** Box width in px (inset + indent are subtracted internally). */
  width: number
  /** Box height in px (inset is subtracted internally). */
  height: number
  fontFamily: string
  bold?: boolean
  italic?: boolean
  lineHeight: number
  /** Largest size to try (the style-scale size for this role). */
  maxSize: number
  /** Smallest legible size to fall back to. */
  minSize?: number
  bulletIndent?: number
  blockSpace?: number
}

function measureBlocksHeight(blocks: string[], size: number, innerWidth: number, input: FitInput): number {
  const lineHeightPx = Math.ceil(size * input.lineHeight)
  const font = `${input.italic ? 'italic' : 'normal'} ${input.bold ? 700 : 400} ${size}px ${input.fontFamily}`
  let total = 0
  for (const block of blocks) {
    const prepared = pretextPrepare(block, font)
    total += pretextLayout(prepared, innerWidth, lineHeightPx).height
  }
  total += Math.max(0, blocks.length - 1) * (input.blockSpace ?? 0)
  return total
}

/**
 * Pick the largest font size (<= maxSize, >= minSize) at which `blocks` fit the
 * box. Uses pretext to measure real wrapped height per block. Falls back to
 * maxSize if measurement is unavailable (e.g. no canvas in a non-DOM context).
 */
function fitFontSize(input: FitInput): number {
  const max = Math.max(1, round(input.maxSize))
  const min = Math.max(1, Math.min(max, round(input.minSize ?? Math.min(max, 12))))
  const blocks = input.blocks.map(block => block.trim()).filter(Boolean)
  const innerWidth = input.width - TEXT_PAD * 2 - (input.bulletIndent ?? 0)
  const innerHeight = input.height - TEXT_PAD * 2
  if (!blocks.length || innerWidth <= 2 || innerHeight <= 2) return max

  try {
    const fits = (size: number) => measureBlocksHeight(blocks, size, innerWidth, input) <= innerHeight
    if (fits(max)) return max
    let lo = min
    let hi = max - 1
    let best = min
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (fits(mid)) {
        best = mid
        lo = mid + 1
      }
      else hi = mid - 1
    }
    return best
  }
  catch {
    return max
  }
}

/** Height needed to comfortably show `lines` lines at `size` (incl. inset). */
function regionHeight(size: number, lines: number, lineHeight: number): number {
  return Math.ceil(size * lineHeight) * lines + TEXT_PAD * 2
}

// ---------------------------------------------------------------------------
// Layout grid + theming
// ---------------------------------------------------------------------------

interface LayoutCtx {
  W: number
  H: number
  m: number
  cw: number
  preset: PptistStylePreset
  feature: boolean
}

interface RoleColors {
  title: string
  body: string
  muted: string
  accent: string
  rule: string
  surface: string
  onAccent: string
}

function roleColors(ctx: LayoutCtx): RoleColors {
  const p = ctx.preset.palette
  if (ctx.feature) {
    return {
      title: p.featureTitle,
      body: p.featureBody,
      muted: p.featureBody,
      accent: p.featureAccent,
      rule: p.featureAccent,
      surface: p.featureBackground,
      onAccent: p.featureBackground,
    }
  }
  return {
    title: p.title,
    body: p.body,
    muted: p.muted,
    accent: p.accent,
    rule: p.rule,
    surface: p.surface,
    onAccent: p.onAccent,
  }
}

interface Box {
  left: number
  top: number
  width: number
  height: number
}

interface TextBox extends Box {
  content: string
  color: string
  font: string
  lineHeight?: number
}

function textElement(box: TextBox): Partial<PPTTextElement> & { type: 'text' } {
  return {
    type: 'text',
    left: round(box.left),
    top: round(box.top),
    width: round(box.width),
    height: round(box.height),
    rotate: 0,
    content: box.content,
    defaultColor: box.color,
    defaultFontName: box.font,
    lineHeight: box.lineHeight ?? 1.35,
  }
}

interface ParagraphFit {
  color: string
  font: string
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  lineHeight: number
  maxSize: number
  minSize?: number
}

/** Emit a paragraph text element whose font is auto-fit to the box. */
function paragraphsElement(box: Box, text: string, style: ParagraphFit): Partial<PPTTextElement> & { type: 'text' } {
  const size = fitFontSize({
    blocks: blocksOf(text),
    width: box.width,
    height: box.height,
    fontFamily: style.font,
    bold: style.bold,
    italic: style.italic,
    lineHeight: style.lineHeight,
    maxSize: style.maxSize,
    minSize: style.minSize,
    blockSpace: PARAGRAPH_SPACE,
  })
  return textElement({
    ...box,
    content: paragraphsHtml(text, { size, color: style.color, font: style.font, bold: style.bold, align: style.align }),
    color: style.color,
    font: style.font,
    lineHeight: style.lineHeight,
  })
}

interface BulletFit {
  color: string
  font: string
  lineHeight: number
  maxSize: number
  minSize?: number
  ordered?: boolean
}

/** Emit a bulleted text element whose font is auto-fit to the box. */
function bulletsElement(box: Box, items: string[], style: BulletFit): Partial<PPTTextElement> & { type: 'text' } {
  const size = fitFontSize({
    blocks: items,
    width: box.width,
    height: box.height,
    fontFamily: style.font,
    lineHeight: style.lineHeight,
    maxSize: style.maxSize,
    minSize: style.minSize,
    bulletIndent: BULLET_INDENT,
    blockSpace: BULLET_SPACE,
  })
  return textElement({
    ...box,
    content: bulletsHtml(items, { size, color: style.color, font: style.font }, style.ordered),
    color: style.color,
    font: style.font,
    lineHeight: style.lineHeight,
  })
}

const RECT_VIEWBOX: [number, number] = [200, 200]
const RECT_PATH = 'M 0 0 L 200 0 L 200 200 L 0 200 Z'

function rectElement(opts: { left: number; top: number; width: number; height: number; fill: string }): Partial<PPTShapeElement> & { type: 'shape' } {
  return {
    type: 'shape',
    left: round(opts.left),
    top: round(opts.top),
    width: round(opts.width),
    height: round(opts.height),
    rotate: 0,
    viewBox: RECT_VIEWBOX,
    path: RECT_PATH,
    fixedRatio: false,
    fill: opts.fill,
  }
}

function imageElement(opts: { left: number; top: number; width: number; height: number; src: string }): Partial<PPTImageElement> & { type: 'image' } {
  return {
    type: 'image',
    left: round(opts.left),
    top: round(opts.top),
    width: round(opts.width),
    height: round(opts.height),
    rotate: 0,
    src: opts.src,
    fixedRatio: false,
  }
}

/** Eyebrow (kicker) + title + accent rule. Returns the y where content starts. */
function buildHeader(
  ctx: LayoutCtx,
  slots: Slots,
  layoutId: string,
): { elements: PptistLayoutElementInput[]; contentTop: number } {
  const c = roleColors(ctx)
  const sc = ctx.preset.scale
  const fonts = ctx.preset.fonts
  const elements: PptistLayoutElementInput[] = []
  let y = ctx.m

  const eyebrow = optStr(slots, 'eyebrow')
  if (eyebrow) {
    const h = regionHeight(sc.label, 1, 1.3)
    elements.push(
      paragraphsElement(
        { left: ctx.m, top: y, width: ctx.cw, height: h },
        eyebrow.toUpperCase(),
        { color: c.accent, font: fonts.body, bold: true, lineHeight: 1.3, maxSize: sc.label, minSize: 11 },
      ),
    )
    y += h + round(sc.label * 0.4)
  }

  const title = reqStr(slots, 'title', layoutId)
  const titleH = regionHeight(sc.title, 2, 1.18)
  elements.push(
    paragraphsElement(
      { left: ctx.m, top: y, width: ctx.cw, height: titleH },
      title,
      { color: c.title, font: fonts.heading, bold: true, lineHeight: 1.18, maxSize: sc.title, minSize: 22 },
    ),
  )
  y += titleH

  elements.push(rectElement({ left: ctx.m, top: y + 4, width: round(Math.min(ctx.cw, 120)), height: 4, fill: c.accent }))
  y += round(sc.body * 1.2)

  return { elements, contentTop: y }
}

/** Centered hero composition for feature slides (title/section/closing). */
function buildFeature(ctx: LayoutCtx, slots: Slots, layoutId: string, titleSize: number): PptistLayoutElementInput[] {
  const c = roleColors(ctx)
  const sc = ctx.preset.scale
  const fonts = ctx.preset.fonts
  const elements: PptistLayoutElementInput[] = []
  let y = round(ctx.H * 0.26)

  const eyebrow = optStr(slots, 'eyebrow')
  if (eyebrow) {
    const h = regionHeight(sc.label, 1, 1.4)
    elements.push(
      paragraphsElement(
        { left: ctx.m, top: y, width: ctx.cw, height: h },
        eyebrow.toUpperCase(),
        { color: c.accent, font: fonts.body, bold: true, lineHeight: 1.4, maxSize: sc.label, minSize: 11 },
      ),
    )
    y += h + round(sc.label * 0.5)
  }

  const title = reqStr(slots, 'title', layoutId)
  const titleH = regionHeight(titleSize, 2, 1.12)
  elements.push(
    paragraphsElement(
      { left: ctx.m, top: y, width: ctx.cw, height: titleH },
      title,
      { color: c.title, font: fonts.heading, bold: true, lineHeight: 1.12, maxSize: titleSize, minSize: 28 },
    ),
  )
  y += titleH

  elements.push(rectElement({ left: ctx.m, top: y + 6, width: 140, height: 5, fill: c.accent }))
  y += round(sc.sectionHeader * 1.1)

  const subtitle = optStr(slots, 'subtitle')
  if (subtitle) {
    const h = Math.max(regionHeight(sc.sectionHeader, 2, 1.3), ctx.H - ctx.m - y)
    elements.push(
      paragraphsElement(
        { left: ctx.m, top: y, width: ctx.cw, height: h },
        subtitle,
        { color: c.body, font: fonts.body, lineHeight: 1.3, maxSize: sc.sectionHeader, minSize: 16 },
      ),
    )
  }

  return elements
}

// ---------------------------------------------------------------------------
// Per-layout builders
// ---------------------------------------------------------------------------

type LayoutBuilder = (ctx: LayoutCtx, slots: Slots, warnings: string[]) => PptistLayoutElementInput[]

function buildBullets(ctx: LayoutCtx, slots: Slots): PptistLayoutElementInput[] {
  const { elements, contentTop } = buildHeader(ctx, slots, 'bullets')
  const c = roleColors(ctx)
  const sc = ctx.preset.scale
  const items = toItems(slots.bullets)
  if (!items.length) throw new Error('Layout "bullets" requires a non-empty "bullets" slot (array or newline-separated string).')
  const ordered = slots.ordered === true
  elements.push(
    bulletsElement(
      { left: ctx.m, top: contentTop, width: ctx.cw, height: ctx.H - ctx.m - contentTop },
      items,
      { color: c.body, font: ctx.preset.fonts.body, lineHeight: 1.5, maxSize: sc.body, minSize: 14, ordered },
    ),
  )
  return elements
}

function buildColumn(
  ctx: LayoutCtx,
  slots: Slots,
  prefix: 'left' | 'right',
  left: number,
  top: number,
  width: number,
  height: number,
): PptistLayoutElementInput[] {
  const c = roleColors(ctx)
  const sc = ctx.preset.scale
  const fonts = ctx.preset.fonts
  const elements: PptistLayoutElementInput[] = []
  let y = top

  const heading = optStr(slots, `${prefix}Heading`)
  if (heading) {
    const h = regionHeight(sc.sectionHeader, 2, 1.2)
    elements.push(
      paragraphsElement(
        { left, top: y, width, height: h },
        heading,
        { color: c.title, font: fonts.heading, bold: true, lineHeight: 1.2, maxSize: sc.sectionHeader, minSize: 18 },
      ),
    )
    y += h
  }

  const items = toItems(slots[`${prefix}Bullets`])
  const body = optStr(slots, `${prefix}Body`)
  const regionH = top + height - y
  if (items.length) {
    elements.push(
      bulletsElement(
        { left, top: y, width, height: regionH },
        items,
        { color: c.body, font: fonts.body, lineHeight: 1.5, maxSize: sc.body, minSize: 13 },
      ),
    )
  }
  else if (body) {
    elements.push(
      paragraphsElement(
        { left, top: y, width, height: regionH },
        body,
        { color: c.body, font: fonts.body, lineHeight: 1.45, maxSize: sc.body, minSize: 13 },
      ),
    )
  }

  return elements
}

function buildTwoColumn(ctx: LayoutCtx, slots: Slots): PptistLayoutElementInput[] {
  const { elements, contentTop } = buildHeader(ctx, slots, 'twoColumn')
  const gutter = round(ctx.W * 0.04)
  const colWidth = round((ctx.cw - gutter) / 2)
  const colHeight = ctx.H - ctx.m - contentTop
  elements.push(...buildColumn(ctx, slots, 'left', ctx.m, contentTop, colWidth, colHeight))
  elements.push(...buildColumn(ctx, slots, 'right', ctx.m + colWidth + gutter, contentTop, colWidth, colHeight))
  return elements
}

function buildImageText(ctx: LayoutCtx, slots: Slots, warnings: string[]): PptistLayoutElementInput[] {
  const { elements, contentTop } = buildHeader(ctx, slots, 'imageText')
  const c = roleColors(ctx)
  const sc = ctx.preset.scale
  const fonts = ctx.preset.fonts
  const gutter = round(ctx.W * 0.04)
  const regionHeightPx = ctx.H - ctx.m - contentTop
  const src = optStr(slots, 'image') ?? optStr(slots, 'imageSrc') ?? optStr(slots, 'src')
  const side = optStr(slots, 'imageSide') === 'left' ? 'left' : 'right'

  const pushBody = (left: number, width: number, height: number) => {
    const items = toItems(slots.bullets)
    const body = optStr(slots, 'body')
    if (items.length) {
      elements.push(
        bulletsElement(
          { left, top: contentTop, width, height },
          items,
          { color: c.body, font: fonts.body, lineHeight: 1.5, maxSize: sc.body, minSize: 13 },
        ),
      )
    }
    else {
      elements.push(
        paragraphsElement(
          { left, top: contentTop, width, height },
          body ?? '',
          { color: c.body, font: fonts.body, lineHeight: 1.5, maxSize: sc.body, minSize: 13 },
        ),
      )
    }
  }

  if (!src) {
    warnings.push('Layout "imageText" has no "image" src — rendering text full width. Add an image url to use the split layout.')
    pushBody(ctx.m, ctx.cw, regionHeightPx)
    return elements
  }

  const imageWidth = round(ctx.cw * 0.44)
  const textWidth = ctx.cw - imageWidth - gutter
  const caption = optStr(slots, 'caption')
  const captionHeight = caption ? round(sc.caption * 2) : 0
  const imageHeight = regionHeightPx - captionHeight - (caption ? 8 : 0)
  const imageLeft = side === 'left' ? ctx.m : ctx.m + textWidth + gutter
  const textLeft = side === 'left' ? ctx.m + imageWidth + gutter : ctx.m

  elements.push(imageElement({ left: imageLeft, top: contentTop, width: imageWidth, height: imageHeight, src }))
  if (caption) {
    elements.push(
      paragraphsElement(
        { left: imageLeft, top: contentTop + imageHeight + 8, width: imageWidth, height: captionHeight },
        caption,
        { color: c.muted, font: fonts.body, lineHeight: 1.3, maxSize: sc.caption, minSize: 10 },
      ),
    )
  }

  pushBody(textLeft, textWidth, regionHeightPx)
  return elements
}

interface StatEntry {
  value: string
  label?: string
}

function readStats(slots: Slots): StatEntry[] {
  if (Array.isArray(slots.stats)) {
    return slots.stats
      .map(entry => {
        const record = (entry ?? {}) as Record<string, unknown>
        const value = record.value ?? record.stat ?? record.number
        return { value: value == null ? '' : String(value), label: record.label == null ? undefined : String(record.label) }
      })
      .filter(stat => stat.value !== '')
  }
  const single = slots.stat ?? slots.value
  if (single != null && String(single).trim() !== '') {
    return [{ value: String(single), label: optStr(slots, 'statLabel') ?? optStr(slots, 'label') }]
  }
  return []
}

function buildBigStat(ctx: LayoutCtx, slots: Slots): PptistLayoutElementInput[] {
  const stats = readStats(slots)
  if (!stats.length) throw new Error('Layout "bigStat" requires a "stat" string or a "stats" array of { value, label }.')
  const c = roleColors(ctx)
  const sc = ctx.preset.scale
  const fonts = ctx.preset.fonts
  const elements: PptistLayoutElementInput[] = []

  let top = ctx.m
  const title = optStr(slots, 'title')
  if (title) {
    const header = buildHeader(ctx, slots, 'bigStat')
    elements.push(...header.elements)
    top = header.contentTop + round(sc.body * 0.5)
  }

  const count = Math.min(stats.length, 3)
  const visible = stats.slice(0, count)
  const gutter = round(ctx.W * 0.04)
  const cellWidth = round((ctx.cw - gutter * (count - 1)) / count)
  const blockHeight = ctx.H - ctx.m - top
  const valueSize = count === 1 ? sc.display * 1.3 : count === 2 ? sc.display : sc.title * 1.3
  const valueTop = title ? top : top + round(blockHeight * 0.18)
  const valueHeight = round(valueSize * 1.4)

  visible.forEach((stat, index) => {
    const left = ctx.m + index * (cellWidth + gutter)
    elements.push(
      paragraphsElement(
        { left, top: valueTop, width: cellWidth, height: valueHeight },
        stat.value,
        { color: c.accent, font: fonts.heading, bold: true, align: 'center', lineHeight: 1.05, maxSize: valueSize, minSize: 28 },
      ),
    )
    if (stat.label) {
      elements.push(
        paragraphsElement(
          { left, top: valueTop + valueHeight, width: cellWidth, height: round(sc.body * 2.6) },
          stat.label,
          { color: c.muted, font: fonts.body, align: 'center', lineHeight: 1.3, maxSize: sc.body, minSize: 12 },
        ),
      )
    }
  })

  const footnote = optStr(slots, 'body') ?? optStr(slots, 'footnote')
  if (footnote) {
    elements.push(
      paragraphsElement(
        { left: ctx.m, top: ctx.H - ctx.m - round(sc.caption * 2.4), width: ctx.cw, height: round(sc.caption * 2.4) },
        footnote,
        { color: c.muted, font: fonts.body, align: 'center', lineHeight: 1.3, maxSize: sc.caption, minSize: 10 },
      ),
    )
  }
  return elements
}

function buildQuote(ctx: LayoutCtx, slots: Slots): PptistLayoutElementInput[] {
  const quote = reqStr(slots, 'quote', 'quote')
  const c = roleColors(ctx)
  const sc = ctx.preset.scale
  const fonts = ctx.preset.fonts
  const elements: PptistLayoutElementInput[] = []

  const quoteSize = round(sc.sectionHeader * 1.15)
  const blockWidth = round(ctx.cw * 0.82)
  const blockLeft = ctx.m + round((ctx.cw - blockWidth) / 2)
  const top = round(ctx.H * 0.26)
  const quoteHeight = round(sc.sectionHeader * 4.5)

  elements.push(rectElement({ left: blockLeft, top, width: 6, height: round(sc.sectionHeader * 4), fill: c.accent }))
  elements.push(
    paragraphsElement(
      { left: blockLeft + 28, top, width: blockWidth - 28, height: quoteHeight },
      quote,
      { color: c.title, font: fonts.heading, lineHeight: 1.35, maxSize: quoteSize, minSize: 18 },
    ),
  )

  const attribution = optStr(slots, 'attribution')
  if (attribution) {
    elements.push(
      paragraphsElement(
        { left: blockLeft + 28, top: top + quoteHeight + round(sc.body * 0.4), width: blockWidth - 28, height: round(sc.body * 2.2) },
        `— ${attribution}`,
        { color: c.muted, font: fonts.body, lineHeight: 1.3, maxSize: sc.body, minSize: 13 },
      ),
    )
  }
  return elements
}

const CHART_TYPE_ALIASES: Record<string, ChartType> = {
  bar: 'bar',
  column: 'column',
  line: 'line',
  area: 'area',
  pie: 'pie',
  ring: 'ring',
  donut: 'ring',
  radar: 'radar',
  scatter: 'scatter',
}

function buildChart(ctx: LayoutCtx, slots: Slots): PptistLayoutElementInput[] {
  const { elements, contentTop } = buildHeader(ctx, slots, 'chart')
  const c = roleColors(ctx)
  const sc = ctx.preset.scale
  const fonts = ctx.preset.fonts

  const labels = Array.isArray(slots.labels) ? slots.labels.map(String) : []
  if (!labels.length) throw new Error('Layout "chart" requires a non-empty "labels" array.')

  const rawSeries = slots.series
  let series: number[][]
  if (Array.isArray(rawSeries) && rawSeries.length && Array.isArray(rawSeries[0])) {
    series = (rawSeries as unknown[][]).map(row => row.map(value => Number(value) || 0))
  }
  else if (Array.isArray(rawSeries)) {
    series = [rawSeries.map(value => Number(value) || 0)]
  }
  else {
    throw new Error('Layout "chart" requires a "series" array of numbers (or array of number arrays for multi-series).')
  }

  const legends = Array.isArray(slots.legends) && slots.legends.length
    ? slots.legends.map(String)
    : series.map((_, index) => `Series ${index + 1}`)

  const chartType = CHART_TYPE_ALIASES[String(slots.chartType ?? 'column').toLowerCase()] ?? 'column'
  const caption = optStr(slots, 'caption')
  const captionHeight = caption ? round(sc.caption * 2.2) : 0
  const chartHeight = ctx.H - ctx.m - contentTop - captionHeight - (caption ? 8 : 0)
  const data: ChartData = { labels, legends, series }

  elements.push({
    type: 'chart',
    left: round(ctx.m),
    top: round(contentTop),
    width: round(ctx.cw),
    height: round(chartHeight),
    rotate: 0,
    chartType,
    data,
    themeColors: [...ctx.preset.chartColors],
    textColor: c.body,
  } as Partial<PPTChartElement> & { type: 'chart' })

  if (caption) {
    elements.push(
      paragraphsElement(
        { left: ctx.m, top: contentTop + chartHeight + 8, width: ctx.cw, height: captionHeight },
        caption,
        { color: c.muted, font: fonts.body, lineHeight: 1.3, maxSize: sc.caption, minSize: 10 },
      ),
    )
  }
  return elements
}

function buildComparison(ctx: LayoutCtx, slots: Slots): PptistLayoutElementInput[] {
  const { elements, contentTop } = buildHeader(ctx, slots, 'comparison')
  const c = roleColors(ctx)
  const sc = ctx.preset.scale
  const fonts = ctx.preset.fonts

  const headers = Array.isArray(slots.headers) ? slots.headers.map(String) : []
  const rows = Array.isArray(slots.rows)
    ? slots.rows.map(row => (Array.isArray(row) ? row.map(String) : [String(row)]))
    : []
  if (!rows.length) throw new Error('Layout "comparison" requires a non-empty "rows" array of row arrays.')

  const colCount = Math.max(headers.length, ...rows.map(row => row.length), 1)
  const headerStyle: TableCellStyle = {
    bold: true,
    color: c.onAccent,
    backcolor: ctx.preset.palette.accent,
    fontname: fonts.heading,
    fontsize: `${sc.body}px`,
    align: 'center',
  }
  const bodyStyle: TableCellStyle = {
    color: c.body,
    fontname: fonts.body,
    fontsize: `${round(sc.body * 0.85)}px`,
  }
  const labelStyle: TableCellStyle = { ...bodyStyle, bold: true, color: c.title }

  const data: TableCell[][] = []
  if (headers.length) {
    data.push(
      Array.from({ length: colCount }, (_, col) => ({ text: headers[col] ?? '', style: headerStyle })) as unknown as TableCell[],
    )
  }
  for (const row of rows) {
    data.push(
      Array.from({ length: colCount }, (_, col) => ({
        text: row[col] ?? '',
        style: col === 0 ? labelStyle : bodyStyle,
      })) as unknown as TableCell[],
    )
  }

  elements.push({
    type: 'table',
    left: round(ctx.m),
    top: round(contentTop),
    width: round(ctx.cw),
    rotate: 0,
    data,
    colWidths: new Array(colCount).fill(1 / colCount),
  } as Partial<PPTTableElement> & { type: 'table' })

  return elements
}

// ---------------------------------------------------------------------------
// Catalog + dispatch
// ---------------------------------------------------------------------------

const LAYOUT_BUILDERS: Record<string, LayoutBuilder> = {
  title: (ctx, slots) => buildFeature(ctx, slots, 'title', ctx.preset.scale.display),
  section: (ctx, slots) => buildFeature(ctx, slots, 'section', round(ctx.preset.scale.display * 0.86)),
  closing: (ctx, slots) => buildFeature(ctx, slots, 'closing', round(ctx.preset.scale.display * 0.9)),
  bullets: buildBullets,
  twoColumn: buildTwoColumn,
  imageText: buildImageText,
  bigStat: buildBigStat,
  quote: buildQuote,
  chart: buildChart,
  comparison: buildComparison,
}

export const PPTX_LAYOUTS: PptistLayout[] = [
  {
    id: 'title',
    label: 'Title',
    summary: 'Cover slide: large centered title with optional eyebrow + subtitle on a dark feature background.',
    bestFor: 'The opening slide of the deck.',
    feature: true,
    slots: [
      { name: 'title', type: 'text', required: true, description: 'Presentation title.' },
      { name: 'subtitle', type: 'text', required: false, description: 'Supporting line (audience, date, author).' },
      { name: 'eyebrow', type: 'text', required: false, description: 'Small kicker above the title (e.g. course name).' },
    ],
  },
  {
    id: 'section',
    label: 'Section divider',
    summary: 'Section break: bold heading + optional eyebrow/subtitle on a dark feature background.',
    bestFor: 'Marking the start of a new part of the deck.',
    feature: true,
    slots: [
      { name: 'title', type: 'text', required: true, description: 'Section heading.' },
      { name: 'subtitle', type: 'text', required: false, description: 'One line about the section.' },
      { name: 'eyebrow', type: 'text', required: false, description: 'Kicker such as "Part 2".' },
    ],
  },
  {
    id: 'closing',
    label: 'Closing',
    summary: 'Closing slide: a large sign-off line + optional subtitle/eyebrow on a dark feature background.',
    bestFor: 'The final slide — thank-you, recap, or a call to action / contact line.',
    feature: true,
    slots: [
      { name: 'title', type: 'text', required: true, description: 'Closing line (e.g. "Thank you" or the key takeaway).' },
      { name: 'subtitle', type: 'text', required: false, description: 'Contact details, next steps, or a closing thought.' },
      { name: 'eyebrow', type: 'text', required: false, description: 'Small kicker above the closing line.' },
    ],
  },
  {
    id: 'bullets',
    label: 'Bulleted list',
    summary: 'Title + a single column of bullet points. The everyday content slide.',
    bestFor: 'Explaining a concept as a short list of points.',
    feature: false,
    slots: [
      { name: 'title', type: 'text', required: true, description: 'Slide title.' },
      { name: 'bullets', type: 'bullets', required: true, description: 'Array of bullet strings (or newline-separated).' },
      { name: 'eyebrow', type: 'text', required: false, description: 'Small kicker above the title.' },
      { name: 'ordered', type: 'text', required: false, description: 'Set true for a numbered list.' },
    ],
  },
  {
    id: 'twoColumn',
    label: 'Two columns',
    summary: 'Title + two side-by-side columns, each with an optional heading and bullets or body text.',
    bestFor: 'Compare/contrast, pros/cons, before/after, or two related groups.',
    feature: false,
    slots: [
      { name: 'title', type: 'text', required: true, description: 'Slide title.' },
      { name: 'leftHeading', type: 'text', required: false, description: 'Heading for the left column.' },
      { name: 'leftBullets', type: 'bullets', required: false, description: 'Left column bullets (array or newlines).' },
      { name: 'leftBody', type: 'text', required: false, description: 'Left column paragraph text (if not bullets).' },
      { name: 'rightHeading', type: 'text', required: false, description: 'Heading for the right column.' },
      { name: 'rightBullets', type: 'bullets', required: false, description: 'Right column bullets (array or newlines).' },
      { name: 'rightBody', type: 'text', required: false, description: 'Right column paragraph text (if not bullets).' },
    ],
  },
  {
    id: 'imageText',
    label: 'Image + text',
    summary: 'Title + an image on one side and bullets/text on the other (image side configurable).',
    bestFor: 'Pairing a visual with an explanation.',
    feature: false,
    slots: [
      { name: 'title', type: 'text', required: true, description: 'Slide title.' },
      { name: 'image', type: 'image', required: false, description: 'Image url. Omit to render text full width.' },
      { name: 'imageSide', type: 'text', required: false, description: '"left" or "right" (default right).' },
      { name: 'bullets', type: 'bullets', required: false, description: 'Bullets beside the image.' },
      { name: 'body', type: 'text', required: false, description: 'Paragraph text beside the image (if not bullets).' },
      { name: 'caption', type: 'text', required: false, description: 'Small caption under the image.' },
    ],
  },
  {
    id: 'bigStat',
    label: 'Big number(s)',
    summary: 'One to three oversized statistics with labels, optional title and footnote.',
    bestFor: 'Highlighting key metrics or headline figures.',
    feature: false,
    slots: [
      { name: 'stats', type: 'stats', required: false, description: 'Array of { value, label } (1–3). Or use stat/statLabel.' },
      { name: 'stat', type: 'text', required: false, description: 'A single big value (alternative to stats).' },
      { name: 'statLabel', type: 'text', required: false, description: 'Label for the single stat.' },
      { name: 'title', type: 'text', required: false, description: 'Optional slide title above the stats.' },
      { name: 'body', type: 'text', required: false, description: 'Optional footnote under the stats.' },
    ],
  },
  {
    id: 'quote',
    label: 'Quote',
    summary: 'A large pull-quote with an accent bar and optional attribution.',
    bestFor: 'Featuring a quotation or a key takeaway sentence.',
    feature: false,
    slots: [
      { name: 'quote', type: 'text', required: true, description: 'The quotation text.' },
      { name: 'attribution', type: 'text', required: false, description: 'Who said it.' },
    ],
  },
  {
    id: 'chart',
    label: 'Chart',
    summary: 'Title + a themed chart (column/bar/line/pie/area) with optional caption.',
    bestFor: 'Showing data trends or comparisons visually.',
    feature: false,
    slots: [
      { name: 'title', type: 'text', required: true, description: 'Slide title.' },
      { name: 'chartType', type: 'text', required: false, description: 'column | bar | line | pie | ring | area (default column).' },
      { name: 'labels', type: 'chart', required: true, description: 'Category labels (array of strings).' },
      { name: 'series', type: 'chart', required: true, description: 'Numbers, or array of number arrays for multiple series.' },
      { name: 'legends', type: 'chart', required: false, description: 'Series names (array of strings).' },
      { name: 'caption', type: 'text', required: false, description: 'Caption / data source under the chart.' },
    ],
  },
  {
    id: 'comparison',
    label: 'Comparison table',
    summary: 'Title + a compact themed table; first row is a header, first column is a row label.',
    bestFor: 'Comparing options across a few attributes.',
    feature: false,
    slots: [
      { name: 'title', type: 'text', required: true, description: 'Slide title.' },
      { name: 'headers', type: 'rows', required: false, description: 'Header row cells (array of strings).' },
      { name: 'rows', type: 'rows', required: true, description: 'Array of row arrays; first cell of each is the row label.' },
    ],
  },
]

const LAYOUTS_BY_ID = new Map(PPTX_LAYOUTS.map(layout => [layout.id, layout]))

export function listLayouts(): PptistLayout[] {
  return PPTX_LAYOUTS.map(layout => ({ ...layout, slots: layout.slots.map(slot => ({ ...slot })) }))
}

export interface PptistLayoutBuildResult {
  slide: Partial<Slide>
  warnings: string[]
}

/**
 * Build a themed slide from a layout id + content slots. Pure and deterministic:
 * returns a `Partial<Slide>` (background + un-normalized elements) plus any
 * non-fatal warnings (e.g. a missing optional image). Text is auto-fit to each
 * box via pretext, so content never overflows. Throws on missing required slots
 * or an unknown layout.
 */
export function buildLayoutSlide(
  layoutId: string,
  slots: Slots,
  preset: PptistStylePreset,
  viewport: { width: number; height: number },
  backgroundMode: PptistLayoutBackgroundMode = 'auto',
): PptistLayoutBuildResult {
  const layout = LAYOUTS_BY_ID.get(layoutId)
  if (!layout) {
    throw new Error(`Unknown layout "${layoutId}". Call layouts.catalog to list available layouts.`)
  }
  const builder = LAYOUT_BUILDERS[layoutId]
  const W = viewport.width
  const H = viewport.height
  const margin = round(W * 0.06)
  const feature = backgroundMode === 'feature' ? true : backgroundMode === 'plain' ? false : layout.feature
  const ctx: LayoutCtx = { W, H, m: margin, cw: W - margin * 2, preset, feature }

  const warnings: string[] = []
  const elements = builder(ctx, slots, warnings)
  const background: SlideBackground = {
    type: 'solid',
    color: feature ? preset.palette.featureBackground : preset.palette.background,
  }
  return {
    slide: { background, elements: elements as unknown as Slide['elements'] },
    warnings,
  }
}
