/**
 * Structural configuration for the three versions of Snugglegum Multivitamin. No visible copy lives here:
 * copy stays in the page/component markup (see README, "Editing copy"). This file only holds
 * identifiers and the accent token each line's card keys off. The lines are teasers only, so
 * there are no per-line pages or prices yet.
 */

export type ProductId = 'gen-z' | 'millennials' | 'boomer';

/** Tailwind color name from the `--color-*` tokens in global.css (e.g. `bg-{accent}`). */
export type ProductAccent = 'pink' | 'meadow' | 'sport';

export interface ProductSummary {
  readonly id: ProductId;
  /** Short line name as used in labels and MailerLite: "Gen Z". */
  readonly name: string;
  /** Card surface accent. Three distinct tokens from colors.css. */
  readonly accent: ProductAccent;
  /** Whether the accent is a dark surface (needs light text) or a light one (needs dark text). */
  readonly accentTone: 'dark' | 'light';
}

export const products: readonly ProductSummary[] = [
  { id: 'gen-z', name: 'Gen Z', accent: 'pink', accentTone: 'light' },
  { id: 'millennials', name: 'Millennials', accent: 'meadow', accentTone: 'light' },
  { id: 'boomer', name: 'Boomer', accent: 'sport', accentTone: 'light' },
] as const;

export function productById(id: ProductId): ProductSummary {
  const product = products.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown product id: ${id}`);
  return product;
}
