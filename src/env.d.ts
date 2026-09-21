/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_MAILERLITE_ACCOUNT_ID?: string;
  readonly PUBLIC_MAILERLITE_FORM_ID?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_DISCOUNT_LABEL?: string;
  readonly PUBLIC_SUBSCRIBER_COUNT?: string;
  readonly PUBLIC_PROOF_THRESHOLD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
