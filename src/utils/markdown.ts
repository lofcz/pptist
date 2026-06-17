import MarkdownIt from 'markdown-it'
import type { KatexOptions } from 'katex'

/**
 * PPTist stores text-like content as HTML (`text.content`, shape
 * `text.content`, slide remarks, notes). Markdown inputs use a real CommonMark
 * parser here; callers that already have trusted HTML should pass `content`.
 */
const MATH_RE = /(?:\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\\\(|\\\[|\\begin\{[a-zA-Z*]+\})/
const MATH_DELIMITERS = ['dollars', 'brackets', 'beg_end'] as const

type TexMathPluginOptions = {
  engine: typeof import('katex')
  delimiters: typeof MATH_DELIMITERS[number][]
  katexOptions: KatexOptions
}

type TexMathPlugin = (md: MarkdownIt, options: TexMathPluginOptions) => void

function createBaseParser() {
  const parser = new MarkdownIt({
    breaks: true,
    html: false,
    linkify: true,
    typographer: true,
  })

  const defaultLinkOpen = parser.renderer.rules.link_open

  parser.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
    return defaultLinkOpen?.(tokens, idx, options, env, self) ?? self.renderToken(tokens, idx, options)
  }

  return parser
}

const markdownParser = createBaseParser()
let mathMarkdownParserPromise: Promise<MarkdownIt> | null = null
let mathMarkdownParser: MarkdownIt | null = null

/** True when a string carries math delimiters the math parser should handle. */
export function containsMath(source: string): boolean {
  return MATH_RE.test(source)
}

function loadMathMarkdownParser(): Promise<MarkdownIt> {
  if (mathMarkdownParserPromise) return mathMarkdownParserPromise

  mathMarkdownParserPromise = Promise.all([
    import('markdown-it-texmath'),
    import('katex'),
  ]).then(([texmathModule, katex]) => {
    const parser = createBaseParser()
    const texmath = (texmathModule.default ?? texmathModule) as TexMathPlugin
    parser.use(texmath, {
      engine: katex,
      delimiters: [...MATH_DELIMITERS],
      katexOptions: {
        output: 'mathml',
        strict: false,
        throwOnError: false,
      },
    })
    mathMarkdownParser = parser
    return parser
  })

  return mathMarkdownParserPromise
}

export async function markdownToHtml(markdown: string): Promise<string> {
  if (markdown == null) return ''
  const source = String(markdown).trim()
  if (!source) return ''

  const parser = containsMath(source) ? await loadMathMarkdownParser() : markdownParser
  return parser.render(source).trim()
}

/**
 * Preload the math-capable markdown parser (lazy KaTeX + texmath) so
 * `renderInlineMarkdown` can render `$…$` math synchronously afterwards. No-op
 * once loaded; call before rendering content that may contain math.
 */
export async function ensureInlineMathReady(): Promise<void> {
  await loadMathMarkdownParser()
}

/**
 * Render one line of markdown to inline HTML (no `<p>` wrapper) using the same
 * CommonMark + texmath pipeline as {@link markdownToHtml}. Inline math (`$…$`)
 * renders only when the math parser has been preloaded via
 * {@link ensureInlineMathReady}; otherwise math delimiters read as literal text.
 */
export function renderInlineMarkdown(markdown: string): string {
  if (markdown == null) return ''
  const source = String(markdown).trim()
  if (!source) return ''

  const parser = containsMath(source) && mathMarkdownParser ? mathMarkdownParser : markdownParser
  return parser.renderInline(source).trim()
}
