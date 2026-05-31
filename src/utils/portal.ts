let portalTarget: HTMLElement | null = null

export function setPptistPortalTarget(target: HTMLElement | null) {
  portalTarget = target
}

export function clearPptistPortalTarget(target: HTMLElement) {
  if (portalTarget === target) portalTarget = null
}

export function getPptistPortalTarget(): HTMLElement {
  if (portalTarget?.isConnected) return portalTarget
  return document.body
}

function getPptistQueryRoot(): Document | ShadowRoot {
  const root = portalTarget?.getRootNode()
  if (root instanceof ShadowRoot) return root
  return document
}

export function queryPptist<T extends Element = Element>(selector: string): T | null {
  return getPptistQueryRoot().querySelector<T>(selector) ?? document.querySelector<T>(selector)
}

export function queryPptistAll<T extends Element = Element>(selector: string): NodeListOf<T> {
  const rootMatches = getPptistQueryRoot().querySelectorAll<T>(selector)
  return rootMatches.length ? rootMatches : document.querySelectorAll<T>(selector)
}
