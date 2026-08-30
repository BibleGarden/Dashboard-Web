/// <reference types="vite/client" />

interface ImportMetaEnv {
  // May be undefined at runtime when the container is started without it —
  // validated explicitly in src/config/api.ts (assertApiConfigured).
  readonly VITE_ADMIN_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
