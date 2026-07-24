/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_DEFAULT_LOCALE?: string;
  readonly VITE_SENTRY_DSN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
