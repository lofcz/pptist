/**
 * Runtime asset base resolution.
 *
 * The standalone app serves runtime data (`mocks/`, `imgs/`, fonts) relative to
 * the page. When PPTist is embedded in a host those files are
 * served from a configurable location (`assetBaseUrl`, default `/pptist-assets`),
 * so any hard-coded `./mocks/...` / `./imgs/...` path resolves against the host
 * page and 404s — which is what leaves the template/style picker empty.
 *
 * `mountPptist()` calls `setPptistAssetBase()` with the host's `assetBaseUrl`, and
 * data/asset lookups go through `resolvePptistAsset()` so they resolve correctly
 * in both the standalone app (empty base) and an embedded host.
 */
let assetBase = ''

export function setPptistAssetBase(base: string | undefined | null) {
  assetBase = (base ?? '').replace(/\/+$/, '')
}

export function getPptistAssetBase(): string {
  return assetBase
}

/** Resolve a packaged-asset path against the configured asset base. */
export function resolvePptistAsset(path: string): string {
  if (!path) return path
  // Leave absolute URLs and inline/blob data untouched.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path) || /^(data|blob):/i.test(path)) return path
  const clean = path.replace(/^\.?\/+/, '')
  return assetBase ? `${assetBase}/${clean}` : clean
}
