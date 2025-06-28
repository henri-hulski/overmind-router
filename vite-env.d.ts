/// <reference types="vite/client" />
/// <reference types="@vitest/browser/context" />

interface ImportMetaEnv {
  readonly BASE_URL: string
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
