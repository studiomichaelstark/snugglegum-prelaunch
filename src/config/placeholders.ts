/**
 * Every value the site still needs from you, in ONE list. Fill them in `.env` (or in the host's
 * environment variables). Nothing here has imports, so the Astro pages and
 * `scripts/check-placeholders.mjs` read the very same list.
 *
 * - Empty value            -> the page shows a visible `[[TODO: …]]` marker and the production build fails.
 * - `n/a` (optional items) -> the line or section is left out of the page.
 * - Values with spaces need double quotes in `.env`:  PUBLIC_LEGAL_HOSTING_PROVIDER="Example Ltd, 1 Main St"
 *
 * All of these values end up on public pages, so none of them is a secret.
 */

export type PlaceholderGroup = 'general' | 'contact' | 'imprint' | 'privacy' | 'review' | 'offer';

export interface PlaceholderSpec {
  /** Name used in code: `legal.contactEmail`. */
  id: string;
  /** Environment variable. */
  env: string;
  group: PlaceholderGroup;
  /** Short description. Also the text inside the `[[TODO: …]]` marker. */
  label: string;
  /** Where it appears and what to enter. Shown by check:placeholders and copied into .env comments. */
  hint: string;
  /** `flag`: must be `true`. Default is free text. */
  kind?: 'text' | 'flag';
  /** `n/a` is accepted and hides the line or section. */
  optional?: boolean;
  /** Use this other item (by id) when this one is empty. */
  fallback?: string;
  /** `false`: empty is fine (the feature is simply off) and does not block the production build. */
  blocking?: boolean;
  /** Where the value must show up in the built site. Used by the post-build check. */
  output?: PlaceholderOutput;
}

/** What the built HTML must look like, so a value that silently vanishes is caught after the build. */
export interface PlaceholderOutput {
  /** Built pages (file names without .html) that must contain the value, or its [[TODO]] marker when missing. */
  pages: readonly string[];
  /** Default true. `false` for values that never print a marker when missing (site URL, IDs in URLs). */
  marker?: boolean;
  /** Default true. `false` for flags, whose value is never printed. */
  showsValue?: boolean;
  /** Text that must be in the pages exactly while the item is shown (its value, or its marker while missing) and gone once it is hidden. Typically a label in front of the value. */
  whileShown?: readonly string[];
  /** Text that must be in the pages only while the value is missing (for example the draft notice). */
  onlyWhenMissing?: readonly string[];
}

export const placeholderSpecs = [
  {
    id: 'siteUrl',
    env: 'PUBLIC_SITE_URL',
    group: 'general',
    label: 'production domain',
    hint: 'Canonical, sitemap, robots, llms.txt, Open Graph. Origin only, no trailing slash, e.g. https://www.example.com',
    output: { pages: ['index', 'imprint', 'privacy'], marker: false },
  },
  {
    id: 'mailerLiteAccountId',
    env: 'PUBLIC_MAILERLITE_ACCOUNT_ID',
    group: 'general',
    label: 'MailerLite account ID',
    hint: 'Newsletter form endpoint. A public identifier, not a secret.',
    output: { pages: ['index'], marker: false },
  },
  {
    id: 'mailerLiteFormId',
    env: 'PUBLIC_MAILERLITE_FORM_ID',
    group: 'general',
    label: 'MailerLite form ID',
    hint: 'Newsletter form endpoint. A public identifier, not a secret.',
    output: { pages: ['index'], marker: false },
  },
  {
    id: 'contactEmail',
    env: 'PUBLIC_CONTACT_EMAIL',
    group: 'contact',
    label: 'contact email',
    hint: 'Footer, imprint, and the privacy policy contact (unless PUBLIC_PRIVACY_EMAIL is set).',
    output: { pages: ['index', 'imprint', 'privacy'] },
  },
  {
    id: 'privacyEmail',
    env: 'PUBLIC_PRIVACY_EMAIL',
    group: 'contact',
    label: 'privacy contact email',
    hint: 'Privacy policy contact. Leave empty to reuse PUBLIC_CONTACT_EMAIL.',
    fallback: 'contactEmail',
    output: { pages: ['privacy'] },
  },
  {
    id: 'phone',
    env: 'PUBLIC_LEGAL_PHONE',
    group: 'imprint',
    label: 'phone number or another fast electronic contact channel',
    hint: 'Imprint, section 2. Phone number, or for example "Contact form: https://…". Use n/a to omit the line.',
    optional: true,
    output: { pages: ['imprint'], whileShown: ['Phone or second contact channel:'] },
  },
  {
    id: 'commercialRegister',
    env: 'PUBLIC_LEGAL_COMMERCIAL_REGISTER',
    group: 'imprint',
    label: 'commercial register entry',
    hint: 'Imprint, section 1. Register court and number. Use n/a if there is none.',
    optional: true,
    output: { pages: ['imprint'], whileShown: ['Commercial register:'] },
  },
  {
    id: 'vatId',
    env: 'PUBLIC_LEGAL_VAT_ID',
    group: 'imprint',
    label: 'VAT ID',
    hint: 'Imprint, section 1. Use n/a if there is none.',
    optional: true,
    output: { pages: ['imprint'], whileShown: ['VAT ID:'] },
  },
  {
    id: 'disputeResolution',
    env: 'PUBLIC_LEGAL_DISPUTE_RESOLUTION',
    group: 'imprint',
    label: 'statement on consumer dispute resolution',
    hint: 'Imprint, section 7. A full sentence. Use n/a to leave the whole section out.',
    optional: true,
    output: { pages: ['imprint'], whileShown: ['7. Consumer dispute resolution'] },
  },
  {
    id: 'hostingProvider',
    env: 'PUBLIC_LEGAL_HOSTING_PROVIDER',
    group: 'privacy',
    label: 'hosting provider, its address and the data processing agreement',
    hint: 'Privacy policy, section 3. Completes "The website is hosted by …".',
    output: { pages: ['privacy'] },
  },
  {
    id: 'logRetention',
    env: 'PUBLIC_LEGAL_LOG_RETENTION',
    group: 'privacy',
    label: 'server log retention period',
    hint: 'Privacy policy, section 3. Completes "Retention: …", for example "7 days".',
    output: { pages: ['privacy'] },
  },
  {
    id: 'mailerLiteEntity',
    env: 'PUBLIC_LEGAL_MAILERLITE_ENTITY',
    group: 'privacy',
    label: 'current MailerLite contracting entity and address',
    hint: 'Privacy policy, section 7. Completes "Provider: …".',
    output: { pages: ['privacy'] },
  },
  {
    id: 'mailerLiteTracking',
    env: 'PUBLIC_LEGAL_MAILERLITE_TRACKING',
    group: 'privacy',
    label: 'MailerLite open and click tracking statement',
    hint: 'Privacy policy, section 7. Describe tracking if it is on (and rely on consent). Use n/a if it is off.',
    optional: true,
    output: { pages: ['privacy'] },
  },
  {
    id: 'transferMechanism',
    env: 'PUBLIC_LEGAL_TRANSFER_MECHANISM',
    group: 'privacy',
    label: 'third-country transfer mechanism',
    hint: 'Privacy policy, section 9. Completes "the transfer relies on: …", per MailerLite\'s current DPA.',
    output: { pages: ['privacy'] },
  },
  {
    id: 'supervisoryAuthority',
    env: 'PUBLIC_LEGAL_SUPERVISORY_AUTHORITY',
    group: 'privacy',
    label: 'competent supervisory authority and its contact details',
    hint: 'Privacy policy, section 11.',
    output: { pages: ['privacy'] },
  },
  {
    id: 'usStatePrivacy',
    env: 'PUBLIC_LEGAL_US_STATE_PRIVACY',
    group: 'privacy',
    label: 'US state privacy disclosures',
    hint: 'Privacy policy, section 13. Extra paragraph. Use n/a if none is needed.',
    optional: true,
    output: { pages: ['privacy'] },
  },
  {
    id: 'lastUpdated',
    env: 'PUBLIC_LEGAL_LAST_UPDATED',
    group: 'review',
    label: 'date of last update',
    hint: 'Both legal pages, for example "September 22, 2026".',
    output: { pages: ['imprint', 'privacy'] },
  },
  {
    id: 'reviewed',
    env: 'PUBLIC_LEGAL_REVIEWED',
    group: 'review',
    label: 'legal review done (set PUBLIC_LEGAL_REVIEWED=true)',
    hint: 'Set to true after a lawyer has reviewed both pages. Removes the "Legal · draft" marker and notice.',
    kind: 'flag',
    output: { pages: ['imprint', 'privacy'], showsValue: false, onlyWhenMissing: ['Legal · draft', 'This text is a draft template'] },
  },
  {
    id: 'discountLabel',
    env: 'PUBLIC_DISCOUNT_LABEL',
    group: 'offer',
    label: 'discount label',
    hint: 'First offer card and FAQ, for example 15%. Empty hides the discount everywhere.',
    blocking: false,
    output: { pages: ['index'], whileShown: ['On your first order, once it launches.', 'off your first order'] },
  },
  {
    id: 'subscriberCount',
    env: 'PUBLIC_SUBSCRIBER_COUNT',
    group: 'offer',
    label: 'confirmed subscriber count',
    hint: 'Shown as "N people are already on the list" once it reaches PUBLIC_PROOF_THRESHOLD. Empty = hidden.',
    blocking: false,
  },
  {
    id: 'proofThreshold',
    env: 'PUBLIC_PROOF_THRESHOLD',
    group: 'offer',
    label: 'social proof threshold',
    hint: 'Minimum subscriber count before the social proof line shows. Empty = 250.',
    blocking: false,
  },
] as const satisfies readonly PlaceholderSpec[];

export type PlaceholderId = (typeof placeholderSpecs)[number]['id'];

export type PlaceholderStatus = 'set' | 'missing' | 'hidden';

export interface ResolvedPlaceholder {
  spec: PlaceholderSpec;
  status: PlaceholderStatus;
  /** The value, or null when missing or hidden. */
  value: string | null;
  /** What a page prints: the value, a visible `[[TODO: …]]` marker, or null (line left out). */
  display: string | null;
}

export type Env = Readonly<Record<string, string | undefined>>;

const NOT_APPLICABLE = /^n\/a$/i;
/** Values that mean "nothing" but are not empty strings: a quoted empty value, or a stringified undefined. */
const EMPTYISH = /^(undefined|null|""|'')$/i;
const TRUE_VALUES = /^(true|1|yes)$/i;

export const markerFor = (label: string): string => `[[TODO: ${label}]]`;

function resolveOne(spec: PlaceholderSpec, env: Env, resolved: Map<string, ResolvedPlaceholder>): ResolvedPlaceholder {
  const trimmed = (env[spec.env] ?? '').trim();
  const raw = EMPTYISH.test(trimmed) ? '' : trimmed;

  if (spec.kind === 'flag') {
    return TRUE_VALUES.test(raw)
      ? { spec, status: 'set', value: 'true', display: 'true' }
      : { spec, status: 'missing', value: null, display: markerFor(spec.label) };
  }

  if (raw && NOT_APPLICABLE.test(raw) && spec.optional) {
    return { spec, status: 'hidden', value: null, display: null };
  }

  if (raw && !NOT_APPLICABLE.test(raw)) {
    return { spec, status: 'set', value: raw, display: raw };
  }

  if (spec.fallback) {
    const fallback = resolved.get(spec.fallback);
    if (fallback && fallback.status === 'set') return { ...fallback, spec };
  }

  // Empty is fine for switches that are simply off.
  if (spec.blocking === false) return { spec, status: 'hidden', value: null, display: null };

  // Empty, or "n/a" on an item that is required.
  return { spec, status: 'missing', value: null, display: markerFor(spec.label) };
}

/** Resolves every item against an environment. Order in the list matters only for `fallback`. */
export function resolvePlaceholders(env: Env): Record<PlaceholderId, ResolvedPlaceholder> {
  const resolved = new Map<string, ResolvedPlaceholder>();
  for (const spec of placeholderSpecs) resolved.set(spec.id, resolveOne(spec, env, resolved));
  return Object.fromEntries(resolved) as Record<PlaceholderId, ResolvedPlaceholder>;
}

/** Ends a value with a period unless it already ends with punctuation, so "…hosted by {value}." never doubles up. */
export function sentence(text: string): string {
  return /[.!?:)]$/.test(text) ? text : `${text}.`;
}
