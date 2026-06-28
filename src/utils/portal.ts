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

/**
 * Resolve the portal target for a *specific* embed instance.
 *
 * The module-level `portalTarget` only tracks the last-mounted embed, so when
 * several embeds coexist (e.g. multiple decks force-mounted side by side in a
 * host app) it points at the wrong one — overlays then render into a sibling
 * embed's portal, which the host may have hidden (`display:none`), so they
 * never appear. Resolving from the interacted element keeps each overlay in
 * its own embed. Falls back to the global target for the standalone app, where
 * there is no `.pptist-embed-root` wrapper.
 */
export function resolvePptistPortalTarget(el?: Element | null): HTMLElement {
  const root = el?.closest('.pptist-embed-root')
  if (root) {
    const scoped = root.querySelector<HTMLElement>(':scope > .pptist-embed-portal')
    if (scoped?.isConnected) return scoped
  }
  return getPptistPortalTarget()
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
