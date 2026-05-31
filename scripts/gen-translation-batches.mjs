import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const files = execSync(
  'rg -l "[\\u4e00-\\u9fff\\u3400-\\u4dbf]" --glob "src/**/*.vue" --glob "src/**/*.ts" src',
  { encoding: 'utf8' },
)
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map(f => f.replace(/\\/g, '/'))
  .sort()

const total = files.length
const batchCount = 50
const baseSize = Math.floor(total / batchCount)
const remainder = total % batchCount
const batches = {}
let idx = 0

for (let b = 1; b <= batchCount; b++) {
  const size = baseSize + (b <= remainder ? 1 : 0)
  const name = `batch-${String(b).padStart(2, '0')}`
  batches[name] = files.slice(idx, idx + size)
  idx += size
}

const manifest = {
  description:
    'Translation batches for parallel i18n migration (Chinese UI strings to typesafe-i18n)',
  totalFiles: total,
  batchCount,
  locales: ['en', 'cs', 'sk', 'pl'],
  baseLocale: 'en',
  batches,
}

mkdirSync('docs', { recursive: true })
writeFileSync('docs/translation-batches.json', `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Wrote ${total} files in ${batchCount} batches`)
