import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cssPath = join(root, 'dist/embed/pptist-embed.css')
const fontsDir = join(root, 'dist/embed/fonts')

if (!existsSync(cssPath)) {
  console.error('dist/embed/pptist-embed.css missing — run vite build --config vite.config.embed.ts first')
  process.exit(1)
}

mkdirSync(fontsDir, { recursive: true })

const css = readFileSync(cssPath, 'utf8')
let count = 0
let extractedBytes = 0

const rewritten = css.replace(
  /@font-face\{([^{}]*?font-family:([^;{}]+);[^{}]*?)src:url\(data:font\/([^;,{}]+);base64,([^){}]+)\)([^{}]*?)\}/g,
  (match, beforeSrc, rawFamily, ext, base64, afterSrc) => {
    const family = rawFamily.trim().replace(/^['"]|['"]$/g, '')
    const safeFamily = family.replace(/[^a-z0-9_-]+/gi, '-')
    const fileName = `${safeFamily}.${ext === 'woff' ? 'woff' : 'woff2'}`
    const fontBuffer = Buffer.from(base64, 'base64')
    writeFileSync(join(fontsDir, fileName), fontBuffer)
    count++
    extractedBytes += fontBuffer.length
    return `@font-face{${beforeSrc}src:url(./fonts/${fileName})${afterSrc}}`
  },
)

writeFileSync(cssPath, rewritten)
console.log(`Extracted ${count} embedded fonts (${extractedBytes} bytes) from embed CSS`)
