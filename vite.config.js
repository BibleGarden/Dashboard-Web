import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      script: {
        defineModel: true,
        propsDestructure: true
      }
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: (() => {
      const alignmentApiTarget = process.env.VITE_ALIGNMENT_API_TARGET || 'http://localhost:8002'
      const bibleApiTarget = process.env.VITE_BIBLE_API_TARGET || 'http://localhost:8085/api'
      return {
        '/alignment-api': {
          target: alignmentApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/alignment-api/, '')
        },
        '/bible-api': {
          target: bibleApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bible-api/, '')
        }
      }
    })()
  }
})
