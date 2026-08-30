import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * Read a required proxy-target env var, or throw a clear, named error.
 * No silent fallback to a hardcoded host — an unset/empty target is a
 * configuration mistake and must fail the dev-server startup, not proxy
 * requests to a default that may not even be reachable.
 */
function requireEnv(name) {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(
      `${name} is not set (or is empty). Set it in Dashboard-Web/.env for the ` +
        'dev container (dashboard-web, port 9086), or in the environment of the ' +
        'dashboard-web-prod container (root docker-compose.yml, port 9087).'
    )
  }
  return value
}

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
      const alignmentApiTarget = requireEnv('VITE_ALIGNMENT_API_TARGET')
      // Admin API (Dashboard-API): local instance in dev, api.bible.garden/admin-api in the prod-config build
      const adminApiTarget = requireEnv('VITE_ADMIN_API_TARGET')
      return {
        '/alignment-api': {
          target: alignmentApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/alignment-api/, '')
        },
        '/admin-api': {
          target: adminApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/admin-api/, '')
        }
      }
    })()
  }
})
