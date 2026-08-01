/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_DEFAULT_LOCALE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
