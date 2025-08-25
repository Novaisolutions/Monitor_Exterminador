/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_OPENAI_KEY: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_N8N_PROMPT_GET?: string
  readonly VITE_N8N_PROMPT_SET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
