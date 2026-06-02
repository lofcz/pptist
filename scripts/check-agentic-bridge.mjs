import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(join(root, 'src/embed/agentic/createAgenticApi.ts'), 'utf8')
const types = readFileSync(join(root, 'src/embed/agentic/types.ts'), 'utf8')
const helpers = readFileSync(join(root, 'src/embed/agentic/helpers.ts'), 'utf8')
const fixture = readFileSync(join(root, 'src/embed/agentic/fixtures.ts'), 'utf8')
const docs = readFileSync(join(root, 'docs/AGENTIC_BRIDGE.md'), 'utf8')

const expectedCommands = [
  'deck.get',
  'deck.set',
  'deck.patch',
  'deck.setTitle',
  'deck.setTheme',
  'deck.applyStyle',
  'deck.setViewport',
  'deck.setTemplates',
  'styles.catalog',
  'layouts.catalog',
  'import.json',
  'import.pptist',
  'import.pptxSafe',
  'export.json',
  'slides.list',
  'slides.get',
  'slides.current',
  'slides.create',
  'slides.createFromLayout',
  'slides.insert',
  'slides.read',
  'slides.update',
  'slides.delete',
  'slides.duplicate',
  'slides.move',
  'slides.select',
  'slides.setBackground',
  'slides.applyBackground',
  'slides.getTransition',
  'slides.setTransition',
  'slides.getRemark',
  'slides.setRemark',
  'elements.list',
  'elements.get',
  'elements.create',
  'elements.insert',
  'elements.update',
  'elements.setTransform',
  'elements.move',
  'elements.resize',
  'elements.rotate',
  'elements.setOpacity',
  'elements.setFlip',
  'elements.delete',
  'elements.reorder',
  'elements.bringForward',
  'elements.sendBackward',
  'elements.bringToFront',
  'elements.sendToBack',
  'elements.select',
  'elements.selectGroup',
  'elements.clearSelection',
  'elements.setHandle',
  'elements.group',
  'elements.ungroup',
  'elements.lock',
  'elements.unlock',
  'elements.hide',
  'elements.show',
  'elements.setLink',
  'elements.setOutline',
  'elements.setShadow',
  'elements.setFill',
  'elements.setGradient',
  'elements.setColorMask',
  'images.update',
  'images.setSource',
  'images.setClip',
  'images.setCrop',
  'images.setFilters',
  'images.setFilter',
  'images.setOpacity',
  'images.setShadow',
  'images.setRadius',
  'images.setMask',
  'images.setColorMask',
  'images.setImageType',
  'images.setFlip',
  'images.setAsBackground',
  'lines.get',
  'lines.create',
  'lines.update',
  'lines.setStyle',
  'lines.setArrowheads',
  'lines.setDirection',
  'latex.get',
  'latex.create',
  'latex.update',
  'text.list',
  'text.get',
  'text.create',
  'text.update',
  'text.delete',
  'text.getContent',
  'text.setContent',
  'text.setMarkdown',
  'text.updateContent',
  'text.clearContent',
  'text.setStyle',
  'richText.setContent',
  'richText.setStyle',
  'richText.setParagraphAttrs',
  'audio.get',
  'audio.create',
  'audio.update',
  'audio.setSource',
  'audio.setPlayback',
  'audio.setIcon',
  'audio.transform',
  'animations.list',
  'animations.catalog',
  'animations.sequence',
  'animations.create',
  'animations.update',
  'animations.setTrigger',
  'animations.setDuration',
  'animations.delete',
  'animations.reorder',
  'media.resolveAsset',
  'media.setImageSource',
  'media.setVideoSource',
  'media.setAudioSource',
  'tables.create',
  'tables.update',
  'tables.setCell',
  'tables.setCellStyle',
  'tables.insertRow',
  'tables.deleteRow',
  'tables.insertColumn',
  'tables.deleteColumn',
  'tables.mergeCells',
  'tables.splitCell',
  'charts.create',
  'charts.update',
  'charts.setType',
  'charts.setData',
  'charts.setLabels',
  'charts.setLegends',
  'charts.setSeries',
  'charts.addSeries',
  'charts.deleteSeries',
  'charts.setOptions',
  'videos.get',
  'videos.update',
  'videos.setSource',
  'videos.setPlayback',
  'videos.setAutoplay',
  'videos.setPoster',
  'videos.setSize',
  'videos.setPosition',
  'notes.create',
  'notes.update',
  'notes.delete',
  'notes.reply',
  'sections.list',
  'sections.set',
  'sections.clear',
  'sections.rename',
  'sections.delete',
  'sections.assignRange',
  'sections.move',
  'search.find',
  'search.replace',
  'history.commit',
  'history.undo',
  'history.redo',
  'view.goToSlide',
  'view.nextSlide',
  'view.previousSlide',
  'view.setZoom',
  'view.enterPresentation',
  'view.exitPresentation',
  'view.setLocale',
]

const expectedCommandDomains = [
  'animations',
  'audio',
  'charts',
  'deck',
  'elements',
  'export',
  'history',
  'import',
  'images',
  'latex',
  'layouts',
  'lines',
  'media',
  'notes',
  'richText',
  'search',
  'sections',
  'slides',
  'styles',
  'tables',
  'text',
  'videos',
  'view',
]

const expectedPublicDomains = [
  'deck',
  'slides',
  'elements',
  'element',
  'animations',
  'tables',
  'charts',
  'media',
  'links',
  'notes',
  'sections',
  'history',
  'view',
  'export',
]

const expectedElementTypes = ['text', 'image', 'shape', 'line', 'chart', 'table', 'latex', 'video', 'audio']
const expectedResultFields = ['ok', 'commandId', 'type', 'changed', 'documentVersion', 'snapshotId', 'data', 'errors', 'warnings']
const expectedEventTypes = ['documentChanged', 'selectionChanged', 'commandApplied', 'commandFailed', 'destroyed']
const expectedIssueFields = ['code', 'message', 'path', 'recoverable']

const tests = []
const failures = []

function test(name, check) {
  tests.push({ name, check })
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertIncludes(haystack, needle, message) {
  assert(haystack.includes(needle), message)
}

function assertSetEquals(actual, expected, message) {
  const extra = actual.filter(item => !expected.includes(item))
  const missing = expected.filter(item => !actual.includes(item))
  assert(!extra.length && !missing.length, `${message}${formatDelta(missing, extra)}`)
}

function assertUnique(values, label) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index)
  assert(!duplicates.length, `${label} contains duplicates: ${unique(duplicates).join(', ')}`)
}

function unique(values) {
  return [...new Set(values)].sort()
}

function matches(file, pattern) {
  return [...file.matchAll(pattern)].map(match => match[1])
}

function formatDelta(missing, extra) {
  const parts = []
  if (missing.length) parts.push(` missing [${missing.join(', ')}]`)
  if (extra.length) parts.push(` unexpected [${extra.join(', ')}]`)
  return parts.join(';')
}

function domainOf(command) {
  return command.split('.')[0]
}

const registeredCommands = unique(matches(source, /register\('([^']+)'/g))
const commandDomains = unique(registeredCommands.map(domainOf))

test('command bus registers every expected command exactly', () => {
  assertUnique(expectedCommands, 'Expected command list')
  assertUnique(registeredCommands, 'Registered command list')
  assertSetEquals(registeredCommands, expectedCommands, 'Command bus registration mismatch')
})

test('command domains are explicitly covered', () => {
  assertSetEquals(commandDomains, expectedCommandDomains, 'Command domain coverage mismatch')
})

test('public domain types and docs are covered', () => {
  for (const domain of expectedPublicDomains) {
    assert(
      types.includes(`${domain}:`) || types.includes(`${domain}(`),
      `Missing public domain type: ${domain}`,
    )
    assert(
      docs.includes(`controller.${domain}`) || docs.includes(`| ${domain[0].toUpperCase()}${domain.slice(1)}`),
      `Missing docs coverage for domain: ${domain}`,
    )
  }
})

test('result, issue, and event contracts expose required fields', () => {
  assertIncludes(types, 'export interface PptistCommandResult', 'Missing PptistCommandResult export')
  assertIncludes(types, 'export interface PptistBridgeEvent', 'Missing PptistBridgeEvent export')
  assertIncludes(types, 'export interface PptistCommandIssue', 'Missing PptistCommandIssue export')
  assertIncludes(types, 'export type PptistBridgeEventType', 'Missing PptistBridgeEventType export')

  for (const field of expectedResultFields) {
    assert(new RegExp(`\\b${field}\\??:`).test(types), `PptistCommandResult missing field: ${field}`)
  }
  for (const field of expectedIssueFields) {
    assert(new RegExp(`\\b${field}\\??:`).test(types), `PptistCommandIssue missing field: ${field}`)
  }
  for (const eventType of expectedEventTypes) {
    assertIncludes(types, `'${eventType}'`, `PptistBridgeEventType missing event: ${eventType}`)
    assertIncludes(source, `type: '${eventType}'`, `Command bus never emits event: ${eventType}`)
  }
})

test('command bus validators reject invalid and unsupported commands', () => {
  assertIncludes(source, 'isCanonicalCommandType(type)', 'register does not validate canonical command types')
  assertIncludes(source, 'Duplicate command registration:', 'register does not reject duplicate command types')
  assertIncludes(source, 'InvalidCommandType', 'execute does not reject malformed command types')
  assertIncludes(source, 'Unsupported command:', 'execute does not reject unsupported commands')
  assertIncludes(source, 'commandTypeFailure(command)', 'execute/canExecute do not share command validation')
  assertIncludes(source, 'Controller has been destroyed', 'canExecute does not validate destroyed controller state')
  assertIncludes(source, "emit({ type: 'commandFailed'", 'Command bus does not emit failed command events')
})

test('helper validators preserve command payload invariants', () => {
  for (const helper of ['clampIndex', 'insertIndex', 'ensureSlide', 'findElement', 'normalizeSlide', 'normalizeElement', 'normalizeAnimation', 'normalizeNote', 'normalizeReply']) {
    assertIncludes(helpers, `function ${helper}`, `Missing helper validator: ${helper}`)
  }
  assertIncludes(helpers, 'Number.isFinite(index)', 'Index validators must reject non-finite indexes')
  assertIncludes(helpers, 'Math.trunc(index)', 'Index validators must truncate fractional indexes')
  assertIncludes(helpers, 'Slide not found:', 'ensureSlide must fail missing slide IDs')
  assertIncludes(helpers, 'Element not found:', 'findElement must fail missing element IDs')
  assertIncludes(helpers, 'clonePlain', 'Normalizers must return plain cloned payloads')
})

test('golden fixture covers all supported element types', () => {
  for (const elementType of expectedElementTypes) {
    assertIncludes(fixture, `type: '${elementType}'`, `Golden fixture missing element type: ${elementType}`)
  }
  assertIncludes(fixture, 'agenticBridgeGoldenElementCoverage', 'Golden fixture missing compile-time element coverage map')
  assertIncludes(fixture, 'agenticBridgeGoldenElementTypes', 'Golden fixture missing exported element type list')
})

test('golden fixture covers bridge-adjacent slide metadata', () => {
  for (const snippet of [
    'sectionTag:',
    'notes:',
    'replies:',
    'animations:',
    'turningMode:',
    'remark:',
    'background:',
    'theme:',
  ]) {
    assertIncludes(fixture, snippet, `Golden fixture missing ${snippet}`)
  }
})

test('golden fixture includes table, chart, and media details', () => {
  for (const snippet of [
    'colWidths:',
    'cellMinHeight:',
    'data:',
    'labels:',
    'legends:',
    'series:',
    'options:',
    'poster:',
    'autoplay:',
    'loop:',
  ]) {
    assertIncludes(fixture, snippet, `Golden fixture missing ${snippet}`)
  }
})

test('golden fixture IDs are unique and stable', () => {
  const fixtureIds = matches(fixture, /:\s'([^']*(?:fixture|cell_)\w*)'/g)
  assert(fixtureIds.length >= expectedElementTypes.length, 'Golden fixture does not expose enough stable IDs')
  assertUnique(fixtureIds, 'Golden fixture IDs')
})

for (const { name, check } of tests) {
  try {
    check()
  }
  catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

if (failures.length) {
  console.error('Agentic bridge check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Agentic bridge check passed: ${tests.length} tests, ${expectedCommands.length} commands, ${expectedPublicDomains.length} public domains, ${expectedElementTypes.length} element fixtures.`)
