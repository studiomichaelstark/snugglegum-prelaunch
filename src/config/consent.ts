/**
 * Consent configuration. Nothing optional is used today, so every category is disabled.
 *
 * To add an analytics or marketing tool later (see README, "Consent"):
 *  1. set the matching category to `enabled: true` below (this shows its toggle in the modal),
 *  2. add the tool's script as <script type="text/plain" data-consent="analytics" src="..."></script>,
 *  3. allow its origin in the CSP (public/_headers) and mention it in /privacy.
 */
export const CONSENT_STORAGE_KEY = 'sg-cookie-consent';

/** Bump when categories change, so everyone is asked again. */
export const CONSENT_VERSION = 1;

export type OptionalConsentCategory = 'analytics' | 'marketing';

export const consentCategories: Readonly<Record<OptionalConsentCategory, { enabled: boolean }>> = {
  analytics: { enabled: false },
  marketing: { enabled: false },
};

export const hasOptionalCategories = Object.values(consentCategories).some((c) => c.enabled);
