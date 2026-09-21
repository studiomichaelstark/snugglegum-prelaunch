/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_MAILERLITE_ACCOUNT_ID?: string;
  readonly PUBLIC_MAILERLITE_FORM_ID?: string;
  readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
