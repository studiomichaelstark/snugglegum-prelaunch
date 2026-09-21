# FAQ proposal for FAQPage schema (needs your approval)

Nothing here is published as structured data until you approve it. The visible FAQ on the page stays exactly as in the design either way. `FAQPage` JSON-LD must match visible text, so I only propose answers that already exist in the design, word for word.

## Proposed (6 Q&As, all claim-free)

| # | Question | Answer (verbatim from design) |
|---|---|---|
| 1 | When does it launch? | Soon. Join the list and you'll hear first. *(design also has "[date TBD]"; I drop it from the schema and the page unless you give a date)* |
| 2 | Where can I get it? | The USA first. Not available in the EU. |
| 3 | What does it taste like? | Pineapple, with a liquid center. |
| 4 | Why 18+? | Because our humor is. |
| 5 | Will you spam me? | No. Launch news, early access and the occasional bad joke. Unsubscribe anytime. |
| 6 | What's with the name? | Say "Engineered to make you gum" out loud. We'll wait. |

## Left out of the schema on purpose

| Design question | Why |
|---|---|
| What exactly do I get for signing up now? | Contains the discount label, which is a placeholder and hidden while empty. Add it once the discount is real. |
| How many a day? ("1 to 3, after meals") | Contradicts the Supplement Facts panel ("One gummy a day"). Dosage advice should not go into structured data until the label is final. |
| Is it safe? | Safety and "dietary supplement" statements are regulated wording. Keep visible, do not amplify in schema. |

## Your decision

- Approve as proposed, edit, or reject. If approved I add `FAQPage` JSON-LD to `/` built from the same markup so the two cannot drift.
- Question 6 is deliberately double-meaning. It is fine as visible copy, but you may prefer to keep it out of machine-readable answers that AI engines quote.
