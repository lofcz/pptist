/**
 * Compile-time feature flags.
 *
 * `EXTRAS_ENABLED` gates demo / upstream-only chrome that has no place in an
 * embedded product build: the AI / AIPPT entry points, the GitHub link, the
 * feedback & FAQ links, and the "for testing only" demo disclaimer.
 *
 * The value comes from the `__PPTIST_EXTRAS_ENABLED__` constant that Vite
 * replaces at build time (see `vite.config.ts` / `vite.config.embed.ts`). Because
 * it resolves to a literal `true`/`false`, any `if (EXTRAS_ENABLED)` branch and
 * any `v-if="EXTRAS_ENABLED"` subtree is eliminated by the bundler when the flag
 * is off — the default for consumer builds. Enable it with
 * `PPTIST_EXTRAS_ENABLED=true` at build time.
 */
export const EXTRAS_ENABLED: boolean = __PPTIST_EXTRAS_ENABLED__
