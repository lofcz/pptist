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
let mathMarkdownParser: Promise<MarkdownIt> | null = null

function hasMath(source: string) {
  return MATH_RE.test(source)
}

async function loadMathMarkdownParser() {
  if (mathMarkdownParser) return mathMarkdownParser

  mathMarkdownParser = Promise.all([
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
    return parser
  })

  return mathMarkdownParser
}

export async function markdownToHtml(markdown: string): Promise<string> {
  if (markdown == null) return ''
  const source = String(markdown).trim()
  if (!source) return ''

  const parser = hasMath(source) ? await loadMathMarkdownParser() : markdownParser
  return parser.render(source).trim()
}
