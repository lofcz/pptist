import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite-plus'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

// Demo / upstream-only chrome (AI, AIPPT, GitHub, feedback, FAQ, disclaimer) is
// gated behind a compile-time constant so it is dead-code-eliminated unless the
// build explicitly opts in with `PPTIST_EXTRAS_ENABLED=true`.
const EXTRAS_ENABLED = process.env.PPTIST_EXTRAS_ENABLED === 'true'

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  define: {
    __PPTIST_EXTRAS_ENABLED__: JSON.stringify(EXTRAS_ENABLED),
  },
  plugins: [
    vue(),
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
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://server.pptist.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use '@/assets/styles/variable.scss' as *;
          @use '@/assets/styles/mixin.scss' as *;
        `
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      vuedraggable: fileURLToPath(new URL('./node_modules/vuedraggable/src/vuedraggable.js', import.meta.url))
    }
  }
})
