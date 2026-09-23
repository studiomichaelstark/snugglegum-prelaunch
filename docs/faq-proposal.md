# FAQ proposal for FAQPage schema (needs your approval)

Nothing here is published as structured data until you approve it. The visible FAQ on the page (`src/components/sections/Faq.astro`, `#faq`) stays exactly as written either way — this file only proposes what could additionally go into `FAQPage` JSON-LD. `FAQPage` JSON-LD must match visible text word for word, so I only propose answers that already exist on the page, unedited.

The FAQ is now three groups (23 questions total): **About Snugglegum™**, **About gummy supplements**, **Pre-launch**. Several answers in the first and third groups make body/attraction/ingredient claims and carry `data-copy-review` on the page itself (see `docs/plan.md` for the convention). Those stay out of any schema proposal below regardless of your decision on the rest, until they're approved as visible copy first.

## Proposed: "About gummy supplements" group (6 of 6, all claim-free)

This whole group is generic, product-agnostic content about the gummy-supplement format — no Snugglegum-specific or body/health claim anywhere in it, and none of its answers carry `data-copy-review`. It's also the block most directly aimed at the generic GEO queries you named ("what are gummy supplements", "do gummy vitamins work", etc.), so it's the safest and highest-value candidate for `FAQPage` schema.

| # | Question | Answer (verbatim) |
|---|---|---|
| 1 | What are gummy supplements? | Gummy supplements are chewable dietary supplements made to deliver vitamins, minerals or other functional ingredients in a soft, flavored format. They are an alternative to traditional pills, capsules and powders. |
| 2 | Do gummy supplements work? | A gummy is simply a delivery format. Whether a gummy provides a meaningful nutritional benefit depends on its ingredients, amounts, formulation and quality — not on the fact that it is a gummy. |
| 3 | Are gummy vitamins as effective as pills? | They can deliver nutrients effectively, but gummies and pills are not automatically equivalent. Formulation, dosage, stability and ingredients matter, so the Supplement Facts panel is more important than the format itself. |
| 4 | Are gummy supplements healthy? | That depends on the product. Some gummies contain useful nutrients, while others may contain significant amounts of sugar or sugar alcohols. Check the ingredients, serving size and Supplement Facts rather than assuming that every gummy is healthy simply because it contains vitamins. |
| 5 | Why are supplements made as gummies? | Gummies can be easier and more enjoyable to take than pills, particularly for people who dislike swallowing tablets. The trade-off is that gummies have formulation constraints, including taste, texture, stability and the amount of active ingredients that can practically be included. |
| 6 | Can you take too many gummy supplements? | Yes. Gummies are supplements, not candy, and taking more than the recommended serving can result in excessive intake of certain nutrients or ingredients. Always follow the product's recommended serving size. |

## Proposed: claim-free "Pre-launch" answers (6 of 9)

| # | Question | Answer (verbatim) |
|---|---|---|
| 7 | When does Snugglegum™ launch? | Soon. Join the list and you'll hear first. |
| 8 | Where will Snugglegum™ be available? | The USA launches first. Other markets, including the EU, are currently on the waitlist. |
| 9 | What does Snugglegum™ taste like? | Pineapple — with a liquid center. |
| 10 | Why is Snugglegum™ 18+? | Because our humor is. |
| 11 | Will you spam me? | No. Launch news, early access and the occasional bad joke. Unsubscribe anytime. |
| 12 | What's with the name? | Say "Snugglegum™" out loud. Then say it again. Slowly. |

## Left out of any schema proposal, on purpose

| Question | Why |
|---|---|
| What is Snugglegum™? / How does it work? / Can it change how I smell? / Why does it contain zinc? / etc. (7 of 8 in "About Snugglegum™") | Body-chemistry, attraction or ingredient-benefit claims. Same category the rest of the page already flags with `data-copy-review`; not a candidate for machine-quotable schema before that copy itself is approved. |
| Can Snugglegum™ affect how body fluids taste? | The single most legally sensitive answer on the page (explicitly limited by its own wording, but still names specific body fluids). Needs a lawyer's sign-off before it exists as visible copy, let alone as a discrete, out-of-context-quotable schema snippet. |
| What do I get for signing up now? | Contains the discount label, which is templated from `PUBLIC_DISCOUNT_LABEL` and changes over time — schema would need to track it or go stale. |
| How many Snugglegum™ gummies should I take? / Is Snugglegum™ safe? | Dosage and safety wording. The dosage answer deliberately avoids a fixed number until the label is final; safety wording is the kind of statement that shouldn't be duplicated into machine-readable form independent of the page it lives on. |
| What is Snugglegum™ (etc.), if ever approved as visible copy | Even once approved as visible copy, consider whether brand-identity questions belong in `FAQPage` schema at all, or whether `Organization`/`WebSite` (already in place) covers that job better. |

## Your decision

- Approve the 12 claim-free questions above (as one `FAQPage` block, or split into two), approve a different subset, or reject entirely.
- If approved, I add `FAQPage` JSON-LD to `/`, built from the same `Faq.astro` markup so the two cannot drift, limited to exactly the approved questions.
- Question 12 ("What's with the name?") is deliberately cheeky. Fine as visible copy; you may prefer to leave it out of machine-readable answers that AI engines quote directly.
