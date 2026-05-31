# Translator Agent Instructions — PPTist i18n Migration

You are one of **50 parallel translator agents** migrating Chinese UI strings in PPTist to typesafe-i18n.

## Your assignment

1. Open `docs/translation-batches.json` and find your batch (`batch-01` … `batch-50`).
2. **Only edit** the files listed in your batch **plus** translation keys in `src/i18n/en/<namespace>/index.ts` and matching `cs/`, `sk/`, `pl/` files.

Do not modify generated files (`i18n-types.ts`, `i18n-util*.ts`, `i18n-vue.ts`).

## Step-by-step workflow

### 1. Identify strings

Find Chinese (CJK) string literals in your assigned files. Skip code comments unless they are user-facing.

### 2. Choose namespace

| If the string is in… | Namespace |
|----------------------|-----------|
| Shared button, error, loading | `common` |
| Editor panels, toolbars, header | `editor` |
| Canvas, alignment, link dialog | `canvas` |
| Presentation / screening mode | `screen` |
| Mobile views | `mobile` |
| Export dialogs | `export` |
| `src/configs/*` labels (hotkeys, animations, charts, shapes, …) | `configs` |
| Shared components under `src/components/` | `components` |

When unsure, prefer the namespace that matches the UI area.

### 3. Add keys (English first)

Add keys to `src/i18n/en/<namespace>/index.ts`:

```typescript
import type { BaseTranslation } from '../../i18n-types'

const en_editor: BaseTranslation = {
  toolbar: {
    save: 'Save',
  },
}

export default en_editor
```

**Key naming rules:**

- camelCase for keys
- Nested objects mirror UI structure (`toolbar.save`, `dialog.linkTitle`)
- Reuse existing keys in `common` when possible (cancel, save, delete, …)

### 4. Add cs / sk / pl translations

Mirror the same structure in:

- `src/i18n/cs/<namespace>/index.ts` → `NamespaceXxxTranslation`
- `src/i18n/sk/<namespace>/index.ts`
- `src/i18n/pl/<namespace>/index.ts`

Use **professional UI tone** suitable for education software (clear, concise, formal-but-friendly).

Czech plurals: use 6 forms when pluralizing (`zero|one|two|few|many|other`).

### 5. Replace literals in source files

**Vue SFCs** (`*.vue`):

```vue
<script lang="ts" setup>
import { useI18nContext } from '@/i18n/useI18nContext'
const { LL } = useI18nContext()
</script>

<template>
  <span>{{ LL.editor.toolbar.save() }}</span>
</template>
```

**Plain TypeScript** (`*.ts` hooks, configs, stores):

```typescript
import { getLL } from '@/i18n/getLL'
const LL = getLL()
// LL.configs.hotkeys.copy()
```

### 6. Regenerate types

After adding or changing keys:

```bash
npm run i18n:build
```

If working in parallel batches, you may **note new keys in your PR description** for a coordinator merge — but prefer running `i18n:build` locally before finishing.

### 7. Verify

```bash
npm run type-check
```

Fix any type errors from missing translations in cs/sk/pl.

## Do NOT

- Edit auto-generated i18n util files
- Translate developer-only code comments
- Change unrelated files outside your batch
- Use nested Chinese in keys or English source strings
- Duplicate keys that already exist in `common`

## Example migration

**Before** (`App.vue`):

```vue
<FullscreenSpin tip="数据初始化中，请稍等 ..." loading />
```

**After:**

```vue
<FullscreenSpin :tip="LL.common.loadingData()" loading />
```

**Keys** (`src/i18n/en/common/index.ts`):

```typescript
loadingData: 'Initializing data, please wait...',
```

## Coordinator merge notes

When multiple agents add keys to the same namespace, merge conflicts are expected in `src/i18n/*/editor/index.ts` (etc.). Resolve by combining all keys — never drop another agent's entries.

## Reference

Full setup docs: `docs/I18N.md`  
Sciobot reference project: `sciobot-next` at `src/i18n/`
