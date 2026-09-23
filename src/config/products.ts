/**
 * Structural configuration for the three Snugglegum™ products. No visible copy lives here —
 * copy stays in the page/component markup (see README, "Editing copy"). This file only holds
 * identifiers, routing and the accent token each product's pages/components key off.
 */

export type ProductId = 'body-fresh' | 'male-vitality' | 'beauty';

/** Tailwind color name from the `--color-*` tokens in global.css (e.g. `bg-{accent}`, `text-{accent}`). */
export type ProductAccent = 'pink' | 'vitality' | 'beauty';

export interface ProductSummary {
  readonly id: ProductId;
  /** Route, no trailing slash (matches this site's existing URL convention: /imprint, /privacy). */
  readonly path: string;
  /** Short product name as used in headings, labels and MailerLite: "Body Fresh". */
  readonly name: string;
  /** Section background/badge accent this product's pages use. Body Fresh keeps the original brand pink. */
  readonly accent: ProductAccent;
  /** Whether the accent is a dark surface (needs light/white body text) or a light one (needs dark text). */
  readonly accentTone: 'dark' | 'light';
}

export const products: readonly ProductSummary[] = [
  { id: 'body-fresh', path: '/body-fresh', name: 'Body Fresh', accent: 'pink', accentTone: 'light' },
  { id: 'male-vitality', path: '/male-vitality', name: 'Male Vitality', accent: 'vitality', accentTone: 'dark' },
  { id: 'beauty', path: '/beauty', name: 'Beauty', accent: 'beauty', accentTone: 'light' },
] as const;

export function productById(id: ProductId): ProductSummary {
  const product = products.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown product id: ${id}`);
  return product;
}
