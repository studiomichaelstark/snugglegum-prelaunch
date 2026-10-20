/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_MAILERLITE_ACCOUNT_ID?: string;
  readonly PUBLIC_MAILERLITE_FORM_ID?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  readonly PUBLIC_DISCOUNT_LABEL?: string;
  readonly PUBLIC_SUBSCRIBER_COUNT?: string;
  readonly PUBLIC_PROOF_THRESHOLD?: string;
  readonly PUBLIC_MAILERLITE_GROUP_GEN_Z?: string;
  readonly PUBLIC_MAILERLITE_GROUP_MILLENNIALS?: string;
  readonly PUBLIC_MAILERLITE_GROUP_BOOMER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
