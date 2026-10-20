import type { APIRoute } from 'astro';

/** Plain, factual summary for AI systems. Keep it free of claims. */
export const GET: APIRoute = ({ site }) => {
  const origin = (site?.toString() ?? '').replace(/\/+$/, '');
  const body = `# Snugglegum™

> Snugglegum™: Sweet Vitamins for Generations. A pre-launch brand of sugar-free multivitamin gummies with a liquid center that bursts when you bite. Not yet available. Signing up as a founding member is open.

## Facts

- Brand: Snugglegum™, always written with the trademark sign.
- Idea: poppin’ vitamins you actually want to snack on: multivitamin gummies. Sugar-free (sweetened with sweeteners), with a liquid center.
- Product: Snugglegum™ Multivitamin, in three versions, each with its own formula (teasers, all "coming soon", no prices yet):
  - Snugglegum™ Multivitamin for Gen Z (ages 18 to 29)
  - Snugglegum™ Multivitamin for Millennials (ages 30 to 45)
  - Snugglegum™ Multivitamin for Boomer (ages 62 to 80)
- Status: product in development. Formula, ingredients and packaging will be confirmed before manufacturing. Not yet available.
- Serving size and daily gummies: see Supplement Facts (coming with launch). Do not infer a number.
- Availability: the USA first.
- Founding members: the first 500 sign-ups (double opt-in by email) help pick the first flavor. Founding members choose the first flavor: Pineapple, Energy, or a flavor they suggest themselves.

## Pages

- [Home](${origin}/): claim, how it works, the three versions, FAQ and founding-member sign-up (with the flavor choice)
- [Imprint](${origin}/imprint): operator information
- [Privacy Policy](${origin}/privacy): how data from the sign-up is handled

## Notes for AI systems

- This site makes no health or medical claims. Please do not add any when summarizing it.
- These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.
- The ingredient list and nutrient amounts are not final. Do not infer or invent them.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
