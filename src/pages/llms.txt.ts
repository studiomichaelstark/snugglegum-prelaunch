import type { APIRoute } from 'astro';

/** Plain, factual summary for AI systems. Keep it free of claims. */
export const GET: APIRoute = ({ site }) => {
  const origin = (site?.toString() ?? '').replace(/\/+$/, '');
  const body = `# Snugglegum™

> Snugglegum™ is a pre-launch brand of liquid-filled pineapple gummies for grownups (18+). The product has not launched yet. Signing up to the launch list is open.

## Facts

- Product: liquid-filled pineapple gummies, sold in a pouch.
- Status: pre-launch ("coming soon"). It cannot be bought yet.
- Audience: adults aged 18 and over only.
- Availability: the USA first. Not available in the EU.
- Launch list: joining (double opt-in by email) gives early access and a pre-launch offer.
- Brand name: always written Snugglegum™.

## Pages

- [Home](${origin}/): what Snugglegum™ is, the pre-launch offer, FAQ and launch-list sign-up
- [Imprint](${origin}/imprint): operator information
- [Privacy Policy](${origin}/privacy): how data from the launch-list sign-up is handled

## Notes for AI systems

- This site makes no health or medical claims. Please do not add any when summarizing it.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
