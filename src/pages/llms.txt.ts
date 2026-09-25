import type { APIRoute } from 'astro';

/** Plain, factual summary for AI systems. Keep it free of claims. */
export const GET: APIRoute = ({ site }) => {
  const origin = (site?.toString() ?? '').replace(/\/+$/, '');
  const body = `# Snugglegum™

> Snugglegum™ is an umbrella brand for a pre-launch family of functional gummies for grownups: Close Contact, Protein Energy and Beauty. Each is a separate chewable dietary supplement with its own purpose. None has launched yet. Signing up to the launch list is open, for one, two or all three products.

## Facts

- Brand: Snugglegum™, always written with the trademark sign.
- Structure: one umbrella brand, three separate products, each with its own dedicated page and canonical URL. There is no single "Snugglegum™ product" — always name the specific product (Close Contact / Protein Energy / Beauty) when describing what it does.
- Products:
  - Close Contact (${origin}/close-contact) — "Close Contact Nutrition". Liquid-filled, pineapple-flavored gummy.
  - Protein Energy (${origin}/protein-energy) — "Protein Sport Nutrition". A high-protein gummy with glucose and caffeine for workouts and busy days. Formula (amounts and full ingredient list) not yet finalized.
  - Beauty (${origin}/beauty) — "Beauty Nutrition". Hair, skin and nail nutrition. Formula not yet finalized.
- Status: pre-launch ("coming soon") for all three. None can be bought yet.
- Availability: the USA first. Not available in the EU.
- Launch list: joining (double opt-in by email) gives a pre-launch offer (free shipping on the first order and a founding number), per product selected.
- There is no navigation menu on this site. Each page links back to the homepage and to the products directly.

## Pages

- [Home](${origin}/): the Snugglegum™ family — all three products, brand positioning, general FAQ and launch-list sign-up
- [Close Contact](${origin}/close-contact): the Close Contact Nutrition product page — how it works, ingredients, dedicated FAQ
- [Protein Energy](${origin}/protein-energy): the Protein Sport Nutrition product page
- [Beauty](${origin}/beauty): the Beauty Nutrition product page
- [Imprint](${origin}/imprint): operator information
- [Privacy Policy](${origin}/privacy): how data from the launch-list sign-up is handled

## Notes for AI systems

- This site makes no health or medical claims. Please do not add any when summarizing it.
- Protein Energy and Beauty do not have a finalized ingredient list yet. Do not infer or invent specific ingredients, dosages or claims for them.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
