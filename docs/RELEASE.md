# Releasing `@lofcz/pptist`

PPTist publishes the embed package through npm trusted publishing, matching the release model used by `@lofcz/edix`.

## One-Time npm Setup

In npm, configure trusted publishing for `@lofcz/pptist`:

- Package: `@lofcz/pptist`
- Repository owner/name: `lofcz/PPTist`
- Workflow filename: `release.yml`
- Environment: leave empty unless the repository later adds a protected environment

No `NPM_TOKEN` secret is needed. The GitHub Actions workflow uses OIDC with `id-token: write` and publishes with provenance.

## Release Flow

1. Ensure the working branch is merged to the release branch.
2. Open GitHub Actions.
3. Run **Release and Publish to npm** manually.
4. Choose `patch`, `minor`, or `major`.

The workflow:

1. Installs with `npm ci`.
2. Runs `npm run test:agentic-bridge`.
3. Runs `npm run type-check`.
4. Runs `npm run build:embed`.
5. Verifies package contents with `npm pack --dry-run`.
6. Bumps `package.json` / `package-lock.json`.
7. Publishes with `npm publish --provenance --access public`.
8. Pushes the release commit/tag and creates a GitHub release.

## Consumer Install

```bash
npm install @lofcz/pptist
```

Use:

```ts
import { mountPptist } from '@lofcz/pptist/embed'
import type { PptistController } from '@lofcz/pptist/embed'
```

Load `pptist-embed.css` and copy/serve the package's `dist/embed` folder as application assets. Do not import the CSS into the host bundler.
