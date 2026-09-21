/**
 * Pure helpers for the design's "knobs". No Astro or env access here,
 * so they can be unit tested in Node.
 */

/** 'live' = the real form. The others pre-render one state for design review. */
export type FormState = 'live' | 'idle' | 'submitting' | 'success' | 'error';

export type FormStateView = Exclude<FormState, 'live'>;

/** Discount label such as "15%". Empty or whitespace = the offer is hidden everywhere. */
export function hasDiscount(discountLabel: string): boolean {
  return discountLabel.trim().length > 0;
}

/** Social proof only renders once the list is big enough to be worth showing. */
export function shouldShowSocialProof(subscriberCount: number, proofThreshold: number): boolean {
  return Number.isFinite(subscriberCount) && subscriberCount > 0 && subscriberCount >= proofThreshold;
}

export function isPreviewState(state: FormState): state is FormStateView {
  return state !== 'live';
}

/** Reads a non-negative whole number from an env string. Empty or invalid input gives the fallback. */
export function parseCount(raw: string | undefined, fallback: number): number {
  const text = (raw ?? '').trim();
  if (!text) return fallback;
  const value = Number(text);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}
