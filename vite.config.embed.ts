import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite-plus'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

function isExternalRuntimeDependency(id: string) {
  return (
    id === 'vue' ||
    id.startsWith('vue/') ||
    id.startsWith('@vue/') ||
    id.includes('/node_modules/vue/') ||
    id.includes('\\node_modules\\vue\\') ||
    id.includes('/node_modules/@vue/') ||
    id.includes('\\node_modules\\@vue\\') ||
    id === 'pinia' ||
    id.startsWith('pinia/') ||
    id.includes('/node_modules/pinia/') ||
    id.includes('\\node_modules\\pinia\\')
  )
}

function dropUnusedVueDefaultImport() {
  return {
    name: 'drop-unused-vue-default-import',
    renderChunk(code: string) {
      const importPattern =
        /import\s+([A-Za-z_$][\w$]*)\s*,\s*\{([^}]+)\}\s+from\s+(["'])vue\3;/

      const rewritten = code.replace(importPattern, (match, defaultName, namedImports, quote, offset) => {
        const restOfChunk = code.slice(offset + match.length)
        const isDefaultUsed = new RegExp(`\\b${defaultName}\\b`).test(restOfChunk)

        return isDefaultUsed ? match : `import {${namedImports}} from ${quote}vue${quote};`
      })

      return rewritten === code ? null : { code: rewritten, map: null }
    },
  }
}

/**
 * Library build: Vue app as ESM bundle for sciobot-next (React host).
 * Output: dist/embed/pptist-embed.js + pptist-embed.css.
 * Vue and Pinia stay external so host bundlers can place them in shared vendor chunks.
 */
export default defineConfig({
  plugins: [
    vue(),
    dropUnusedVueDefaultImport(),
    Components({
      dirs: [],
      resolvers: [
        IconsResolver({
          prefix: 'i',
          customCollections: ['custom'],
        }),
      ],
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: false,
      customCollections: {
        custom: FileSystemIconLoader('src/assets/icons'),
      },
      scale: 1,
      defaultClass: 'i-icon',
    }),
  ],
  build: {
    outDir: 'dist/embed',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    lib: {
      entry: fileURLToPath(new URL('./src/embed/index.ts', import.meta.url)),
      name: 'PptistEmbed',
      formats: ['es'],
      fileName: () => 'pptist-embed.js',
    },
    cssCodeSplit: false,
    commonjsOptions: {
      requireReturnsDefault: false,
    },
    rollupOptions: {
      external: isExternalRuntimeDependency,
      output: {
        assetFileNames: assetInfo => {
          const name = assetInfo.names?.[0] || assetInfo.name || ''
          if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) return 'fonts/[name][extname]'
          return 'pptist-embed.[ext]'
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    sourcemap: false,
    target: 'es2020',
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use '@/assets/styles/variable.scss' as *;
          @use '@/assets/styles/mixin.scss' as *;
        `,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      vuedraggable: fileURLToPath(new URL('./node_modules/vuedraggable/src/vuedraggable.js', import.meta.url)),
    },
  },
})
