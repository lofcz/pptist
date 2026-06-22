/**
 * Stub that replaces the real `katex` package at build time.
 *
 * `markdown-it-texmath` contains a static `require('katex')` fallback that the
 * bundler must resolve even though PPTist always passes a MathLive `engine`
 * adapter (see `utils/math.ts`), so that branch is never executed. Aliasing
 * `katex` to this stub (in `vite.config.ts` / `vite.config.embed.ts`) lets us
 * drop the real ~280KB KaTeX dependency while keeping the require resolvable.
 */
function renderToString(): string {
  return ''
}

export { renderToString }
export default { renderToString }
