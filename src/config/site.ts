import { parseCount, type FormState } from './variants';

/**
 * Typed knobs from the Claude Design prototype, plus site-wide values.
 * Visible copy does NOT live here. Edit it in the .astro components.
 */
export interface SiteConfig {
  /** Brand name, always with the trademark sign. */
  readonly name: string;
  readonly locale: string;
  /** Production origin (from PUBLIC_SITE_URL, or a placeholder until it is known). */
  readonly url: string;
  /** 'live' = working form. 'idle' | 'submitting' | 'success' | 'error' pre-render that state for review. */
  readonly formState: FormState;
  /** e.g. "15%". Empty hides the discount offer everywhere. From PUBLIC_DISCOUNT_LABEL. */
  readonly discountLabel: string;
  /** Number of confirmed subscribers, shown in the social-proof line once it reaches proofThreshold. From PUBLIC_SUBSCRIBER_COUNT. */
  readonly subscriberCount: number;
  /** Minimum subscriberCount before the social-proof line renders. From PUBLIC_PROOF_THRESHOLD. */
  readonly proofThreshold: number;
}

export const siteConfig: SiteConfig = {
  name: 'Snugglegum™',
  locale: 'en-US',
  url: (import.meta.env.SITE ?? 'https://snugglegum.example').replace(/\/+$/, ''),
  formState: 'live',
  // Optional. Set PUBLIC_DISCOUNT_LABEL, PUBLIC_SUBSCRIBER_COUNT and PUBLIC_PROOF_THRESHOLD in .env to change them.
  discountLabel: (import.meta.env.PUBLIC_DISCOUNT_LABEL ?? '').trim(),
  subscriberCount: parseCount(import.meta.env.PUBLIC_SUBSCRIBER_COUNT, 0),
  proofThreshold: parseCount(import.meta.env.PUBLIC_PROOF_THRESHOLD, 250),
};

/**
 * MailerLite hosted-form endpoint. The account and form IDs are public identifiers
 * (they are visible in any MailerLite embed). Never put an API key here.
 */
const accountId = import.meta.env.PUBLIC_MAILERLITE_ACCOUNT_ID ?? '';
const formId = import.meta.env.PUBLIC_MAILERLITE_FORM_ID ?? '';

if (!accountId || !formId) {
  console.warn(
    '[snugglegum] PUBLIC_MAILERLITE_ACCOUNT_ID / PUBLIC_MAILERLITE_FORM_ID are not set. The newsletter form will show an error on submit.',
  );
}

export const mailerLite = {
  accountId,
  formId,
  endpoint:
    accountId && formId
      ? `https://assets.mailerlite.com/jsonp/${accountId}/forms/${formId}/subscribe`
      : '',
} as const;

/** Pages that exist, for sitemap-like lists. */
export const routes = {
  home: '/',
  imprint: '/imprint',
  privacy: '/privacy',
} as const;
