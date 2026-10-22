import type { ProductId } from './products';
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
  /** false (default) = pre-launch: robots.txt blocks every bot, pages get noindex, no sitemap. From PUBLIC_ALLOW_INDEXING=true. */
  readonly allowIndexing: boolean;
}

export const siteConfig: SiteConfig = {
  name: 'Snugglegum™',
  locale: 'en-US',
  url: (import.meta.env.SITE ?? 'https://snugglegum.com').replace(/\/+$/, ''),
  formState: 'live',
  // Optional. Set PUBLIC_DISCOUNT_LABEL, PUBLIC_SUBSCRIBER_COUNT and PUBLIC_PROOF_THRESHOLD in .env to change them.
  discountLabel: (import.meta.env.PUBLIC_DISCOUNT_LABEL ?? '').trim(),
  subscriberCount: parseCount(import.meta.env.PUBLIC_SUBSCRIBER_COUNT, 0),
  proofThreshold: parseCount(import.meta.env.PUBLIC_PROOF_THRESHOLD, 250),
  allowIndexing: import.meta.env.PUBLIC_ALLOW_INDEXING === 'false',
};

/**
 * MailerLite hosted-form endpoint. The account and form IDs are public identifiers
 * (they are visible in any MailerLite embed). Never put an API key here.
 */
const accountId = import.meta.env.PUBLIC_MAILERLITE_ACCOUNT_ID ?? '';
const formId = import.meta.env.PUBLIC_MAILERLITE_FORM_ID ?? '';

// Optional since the sign-up goes through /api/signup (Connect API). The hosted form is only the fallback for
// the no-JavaScript case and for hosts without the function; without it the form needs JavaScript and /api/signup.
if (!accountId || !formId) {
  console.warn('[snugglegum] No MailerLite hosted form configured. The sign-up works through /api/signup only (and needs JavaScript).');
}

export const mailerLite = {
  accountId,
  formId,
  endpoint:
    accountId && formId
      ? `https://assets.mailerlite.com/jsonp/${accountId}/forms/${formId}/subscribe`
      : '',
} as const;

/**
 * MailerLite Group IDs, one per product-line interest, set once each is created in the MailerLite
 * dashboard (see .env, "MailerLite interest groups"). A blank entry means: still record that
 * product's interest (as a plain field on the subscriber), just not tagged to a native Group yet.
 * These are ordinary MailerLite identifiers, not secrets.
 */
export const mailerLiteGroups: Readonly<Record<ProductId, string>> = {
  'gen-z': (import.meta.env.PUBLIC_MAILERLITE_GROUP_GEN_Z ?? '').trim(),
  millennials: (import.meta.env.PUBLIC_MAILERLITE_GROUP_MILLENNIALS ?? '').trim(),
  boomer: (import.meta.env.PUBLIC_MAILERLITE_GROUP_BOOMER ?? '').trim(),
};

/**
 * Cloudflare Turnstile (optional bot check). The site key is public; the secret lives only in Cloudflare
 * (TURNSTILE_SECRET_KEY). Empty = the check is off. See README, "Security".
 */
export const turnstile = {
  siteKey: (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '').trim(),
} as const;
