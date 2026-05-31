import type { PPTElement } from '@/types/slides'

const ELEMENT_TYPES: PPTElement['type'][] = ['text', 'image', 'shape', 'line', 'chart', 'table', 'latex', 'video', 'audio']
const COLOR_KEYS = new Set(['backcolor', 'backgroundColor', 'borderColor', 'color', 'colorMask', 'defaultColor', 'fill', 'fontColor', 'lineColor', 'textColor'])
const COLOR_PATTERN = /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([^;{}<>]+\)|var\(--[a-z0-9_-]+\)|transparent|currentColor|none|[a-z]+)$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function requireValue(value: unknown, path: string): unknown {
  if (value === undefined || value === null) throw new Error(`${path} is required`)
  return value
}

export function assertString(value: unknown, path: string, allowEmpty = false): string {
  if (typeof value !== 'string') throw new Error(`${path} must be a string`)
  if (!allowEmpty && value.trim() === '') throw new Error(`${path} is required`)
  return value
}

export function assertId(value: unknown, path = 'id'): string {
  return assertString(value, path)
}

export function assertOptionalId(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined
  return assertId(value, path)
}

export function assertIdList(value: string | string[], path = 'id'): string[] {
  const ids = Array.isArray(value) ? value : [value]
  if (!ids.length) throw new Error(`${path} must include at least one ID`)
  return ids.map((id, index) => assertId(id, `${path}${Array.isArray(value) ? `[${index}]` : ''}`))
}

export function assertFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${path} must be a finite number`)
  return value
}

export function assertPositiveNumber(value: unknown, path: string): number {
  const number = assertFiniteNumber(value, path)
  if (number <= 0) throw new Error(`${path} must be greater than 0`)
  return number
}

export function assertIndexInRange(index: unknown, length: number, path = 'index'): number {
  const number = assertFiniteNumber(index, path)
  const integer = Math.trunc(number)
  if (integer !== number) throw new Error(`${path} must be an integer`)
  if (integer < 0 || integer >= length) throw new Error(`${path} is out of bounds`)
  return integer
}

export function assertInsertIndex(index: unknown, length: number, path = 'index'): number {
  if (index === undefined) return length
  const number = assertFiniteNumber(index, path)
  const integer = Math.trunc(number)
  if (integer !== number) throw new Error(`${path} must be an integer`)
  if (integer < 0 || integer > length) throw new Error(`${path} is out of bounds`)
  return integer
}

export function assertColorString(value: unknown, path = 'color'): string {
  const color = assertString(value, path)
  if (!COLOR_PATTERN.test(color.trim())) throw new Error(`${path} must be a valid color string`)
  return color
}

export function assertColorFields(value: unknown, path = 'value'): void {
  if (!value || typeof value !== 'object') return

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertColorFields(item, `${path}[${index}]`))
    return
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`
    if (COLOR_KEYS.has(key) && child !== undefined) {
      assertColorString(child, childPath)
    }
    else if (key === 'themeColors' && Array.isArray(child)) {
      child.forEach((color, index) => assertColorString(color, `${childPath}[${index}]`))
    }
    else if (child && typeof child === 'object') {
      assertColorFields(child, childPath)
    }
  }
}

export function assertElementType(value: unknown, path = 'element.type'): PPTElement['type'] {
  if (!ELEMENT_TYPES.includes(value as PPTElement['type'])) throw new Error(`${path} is not supported`)
  return value as PPTElement['type']
}

export function assertElementDimensions(element: Partial<PPTElement>, path = 'element'): void {
  if ('left' in element && element.left !== undefined) assertFiniteNumber(element.left, `${path}.left`)
  if ('top' in element && element.top !== undefined) assertFiniteNumber(element.top, `${path}.top`)
  if ('width' in element && element.width !== undefined) assertPositiveNumber(element.width, `${path}.width`)
  if ('height' in element && element.height !== undefined) assertPositiveNumber(element.height, `${path}.height`)
  if ('rotate' in element && element.rotate !== undefined) assertFiniteNumber(element.rotate, `${path}.rotate`)
}

function assertPoint(value: unknown, path: string): void {
  if (!Array.isArray(value) || value.length !== 2) throw new Error(`${path} must be a two-value point`)
  assertFiniteNumber(value[0], `${path}[0]`)
  assertFiniteNumber(value[1], `${path}[1]`)
}

function assertViewBox(value: unknown, path: string): void {
  if (!Array.isArray(value) || value.length !== 2) throw new Error(`${path} must be a two-value viewBox`)
  assertPositiveNumber(value[0], `${path}[0]`)
  assertPositiveNumber(value[1], `${path}[1]`)
}

export function assertElementSubtypeRequirements(element: Partial<PPTElement> & { type?: unknown }, path = 'element'): void {
  const type = assertElementType(element.type, `${path}.type`)

  if (type === 'text') {
    assertString(requireValue((element as { content?: unknown }).content, `${path}.content`), `${path}.content`, true)
  }
  else if (type === 'image' || type === 'video' || type === 'audio') {
    assertString(requireValue((element as { src?: unknown }).src, `${path}.src`), `${path}.src`)
  }
  else if (type === 'shape') {
    assertViewBox(requireValue((element as { viewBox?: unknown }).viewBox, `${path}.viewBox`), `${path}.viewBox`)
    assertString(requireValue((element as { path?: unknown }).path, `${path}.path`), `${path}.path`)
  }
  else if (type === 'line') {
    assertPoint(requireValue((element as { start?: unknown }).start, `${path}.start`), `${path}.start`)
    assertPoint(requireValue((element as { end?: unknown }).end, `${path}.end`), `${path}.end`)
  }
  else if (type === 'chart') {
    assertString(requireValue((element as { chartType?: unknown }).chartType, `${path}.chartType`), `${path}.chartType`)
    if (!isRecord((element as { data?: unknown }).data)) throw new Error(`${path}.data is required`)
  }
  else if (type === 'table') {
    if (!Array.isArray((element as { data?: unknown }).data)) throw new Error(`${path}.data is required`)
  }
  else if (type === 'latex') {
    assertString(requireValue((element as { latex?: unknown }).latex, `${path}.latex`), `${path}.latex`, true)
    assertString(requireValue((element as { path?: unknown }).path, `${path}.path`), `${path}.path`)
  }
}

export function assertElementCreateInput(element: Partial<PPTElement> & { type: PPTElement['type'] }, path = 'element'): void {
  if (element.id !== undefined) assertId(element.id, `${path}.id`)
  assertElementDimensions(element, path)
  assertElementSubtypeRequirements(element, path)
  assertColorFields(element, path)
}

export function assertElementPatch(patch: Partial<PPTElement>, current: PPTElement, path = 'patch'): void {
  if (patch.type !== undefined && patch.type !== current.type) {
    throw new Error(`${path}.type cannot change element type from ${current.type} to ${patch.type}`)
  }
  assertElementDimensions(patch, path)
  assertColorFields(patch, path)
}
