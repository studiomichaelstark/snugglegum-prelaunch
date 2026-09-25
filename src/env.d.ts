/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_MAILERLITE_ACCOUNT_ID?: string;
  readonly PUBLIC_MAILERLITE_FORM_ID?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_DISCOUNT_LABEL?: string;
  readonly PUBLIC_SUBSCRIBER_COUNT?: string;
  readonly PUBLIC_PROOF_THRESHOLD?: string;
  readonly PUBLIC_MAILERLITE_GROUP_CLOSE_CONTACT?: string;
  readonly PUBLIC_MAILERLITE_GROUP_PROTEIN_ENERGY?: string;
  readonly PUBLIC_MAILERLITE_GROUP_BEAUTY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
