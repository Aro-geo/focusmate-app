/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_DATABASE_URL: string
  readonly VITE_DATABASE_URL_PLACEHOLDER: string
  readonly VITE_STACK_PROJECT_ID: string
  readonly VITE_STACK_PUBLISHABLE_CLIENT_KEY: string
  readonly STACK_AUTH_JWKS_URL: string
  // more env variables...
}
