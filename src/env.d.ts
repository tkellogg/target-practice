/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GH_ACCESS_KEY: string
  readonly VITE_ANTH_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 