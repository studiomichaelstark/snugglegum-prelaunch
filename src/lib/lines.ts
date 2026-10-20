import type { ProductLineMeta } from '@/lib/seo';

/** Name and target age range of each version, for the JSON-LD Product nodes. Keep in sync with Lines.astro. */
export const productLineMeta: readonly ProductLineMeta[] = [
  { name: 'Gen Z', minAge: 18, maxAge: 29 },
  { name: 'Millennials', minAge: 30, maxAge: 45 },
  { name: 'Boomer', minAge: 62, maxAge: 80 },
];
