# SEO and GEO research: Snugglegum™

Status: Phase 0 findings, 2026-09-21. Nothing here is published yet.

## 1. Method and limits

| Site | What I could analyze | Limit |
|---|---|---|
| smartsweets.com | Raw HTML (title, meta, canonical, headings, JSON-LD), `robots.txt`, `llms.txt` | None |
| gruns.co | Raw HTML (same signals), `robots.txt`, `llms.txt` | None |
| drinkag1.com | Search-result titles and snippets only | The site answers automated requests with a bot checkpoint (HTTP 429). I did not try to get around it. Treat the AG1 findings as partial. |

Nothing is copied from these sites. Only structure and strategy are used below.

## 2. What the three brands do

### SmartSweets
- **Title:** `SmartSweets - Low Sugar Gummy & Hard Candy – SmartSweets US` (about 58 characters). Pattern: brand, category keywords, brand again with market suffix.
- **Meta description:** one benefit-led sentence about a product promise, plus a "pinky promise" line. Playful voice even in meta.
- **Headings:** two H1s on the home page (`SmartSweets US` and a promo block). H2s are shop-oriented (`Shop Best Sellers`, `Join Our Community`). Weak keyword use in headings.
- **Schema:** no JSON-LD on the home page.
- **FAQ/answers:** short Q&A only inside the build-a-box block. No FAQ schema.
- **Keywords used:** low sugar candy, gummy, gummy candy, hard candy, plant-based, no synthetic dyes.
- **Tone:** playful, mission-driven, claim-heavy (numeric sugar-reduction claims).
- **`llms.txt`:** present, but it is generic Shopify agent-shopping instructions, not a brand summary.

### Grüns
- **Title:** `Grüns Daily Nutrition`. Brand plus category, very short (21 characters). No product keyword.
- **Meta description:** a long list of body and health benefit claims. This is the pattern we must **not** copy.
- **H1:** one H1 that carries a category label from our banned-word list, so I do not reproduce it. Only one H1, which is correct.
- **H2s:** mostly brand-voice lines (`Find Your Flavor`, `We made daily nutrition, like, ridiculously easy.`), plus a trust line about third-party testing.
- **Schema:** `Organization`, `WebSite`, and two `Product` blocks with `Offer` and `Brand`. Solid, and it is what a store needs. No `FAQPage`.
- **FAQ/answers:** expandable panels (ingredients, directions, science, benefits). Not marked up.
- **Tone:** casual and playful, close to Snugglegum™ in voice, but backed by benefit claims we cannot use.
- **`llms.txt`:** same generic Shopify agent-shopping file.

### AG1 (partial, from search snippets)
- Titles follow `Question or benefit phrase | AG1®` (for example `What Is AG1?`, `AG1® by Athletic Greens | One Scoop a Day…`).
- Question-style titles and a "what is X" page are their GEO play: a definition an AI engine can quote.
- Snippets are full of health-benefit wording. Not usable for us.

### Takeaways for Snugglegum™
1. **Definition-first.** AG1 shows the value of a plain "what is it" sentence. The design already has one directly under the H1: "Liquid-filled pineapple gummies. They haven't launched yet." I keep it as the answer block and echo it in the meta description and `llms.txt`.
2. **Schema.** Grüns proves `Organization` + `WebSite` is the useful baseline. We add `WebPage` per page. No `Product` or `Offer` yet, because there is no price or availability to state truthfully.
3. **Skip what they do.** No benefit-list meta descriptions, no numeric claims, no review schema, no fake social proof.
4. **`llms.txt`.** Competitors only ship generic store boilerplate, so a short, factual brand summary is a small edge.
5. **Own voice.** The playful tone is a differentiator in this category. Keep it in headings and FAQ, keep meta descriptions plain.

## 3. Keyword evaluation

Regulatory basis: EU Regulation (EC) 1924/2006 on nutrition and health claims, and the FTC's Health Products Compliance Guidance (claims about a supplement's effect need competent and reliable substantiation, and the FDA requires notification of structure/function claims). The brief already rules out health claims, so the test is: does the term promise an effect?

### Target keywords you named

| Keyword | Verdict | Fit | Legal risk | Where to use |
|---|---|---|---|---|
| **gummies** | Include, primary | Exact product form. The pouch itself says "Liquid filled gummies". | Low | Title, meta description, JSON-LD, alt text, `llms.txt`, first body paragraph (already in design) |
| **gummy** | Include, secondary | Singular and modifier form ("gummy brand", "gummy pouch") | Low | Same places, where it reads naturally |
| **functional gummies / functional gummy** | **Hold, your decision** | Your internal category. But "functional" tells a reader and a regulator that the product does something. With zero permitted claims, the page cannot back it up. | Medium. Under the FTC standard the overall impression counts, so a "functional" label next to a "Zinc … immune function" line or "Body Taste" copy reads as a claim. Under EC 1924/2006 it is a non-specific claim risk. | My default: **not** in title, H1, meta, headings. At most one neutral mention in `llms.txt` and the Organization description, and only if you approve it. |
| **gummyshots** | **Exclude** | Not used in the design copy. The only trace is the `gummyshot@` email address and the old "GumShot" naming in the handoff notes. | Low legal risk, but a **search-intent problem**: the query "gummy shots" returns alcohol shot recipes (gummy bear cocktails) and gummy shot glasses. That is the wrong audience and a poor association for a pre-launch brand. | Not a keyword. If GumShot™ is a real product name, decide that separately as a brand term. |

### Long-tail terms taken straight from the design copy (safe to use)

| Term | Source in design | Verdict |
|---|---|---|
| liquid-filled gummies / liquid-filled pineapple gummies | Hero paragraph, pouch | Include. Best differentiator and truthful. |
| pineapple gummies | Hero, ingredients, FAQ | Include |
| gummies for grownups | The stamp ("Gummies for grownups only"), 18+ notice | Include. Prefer this over "adult gummies", which attracts unrelated and adult-content results. |
| pre-launch gummies / coming soon | Hero, offer section | Include in meta and `llms.txt` only |

### Excluded keywords and why

| Excluded | Why |
|---|---|
| The two words banned in the brief, and any explicit or adult-content terms | Brief guardrail. Not researched, not used. |
| gut health, digestive, immune support, detox, weight loss, probiotics, greens powder, vitamins for [X], energy, focus, beauty, recovery | Health or effect claims. Would need authorization or substantiation, and the brief says no. |
| body odor, body taste, breath, fresh, deodorant, "taste better" | Body-related effect claims. Also the wrong intent (personal hygiene shoppers). Applies to design copy too, see the plan. |
| kids, children's | The product is 18+ only. The FTC has taken action on children's gummy claims. |
| sugar-free, low sugar, vegan, gluten-free, plant-based, organic, natural | No verified facts. The supplement panel lists 8 g added sugar, so "sugar-free" would be false. |
| clinical, science-backed, doctor-recommended, third-party tested | Unverifiable at this point. |
| best gummies, #1, top-rated | Superlatives need substantiation. |
| adult gummies | Ambiguous intent, adult-content adjacency. |
| shop, buy, price, discount code | Not purchasable yet. Misleading intent for a pre-launch page. |

### Where the design limits keyword placement

The brief says copy must stay verbatim, so keywords cannot be worked into headings. The design's H1 ("For kisses that don't stop at the lips.") and section headings carry no product keyword. That is fine, because:
- Search engines weigh the title tag, meta description, first paragraph, alt text and structured data strongly, and all of those are free for us to write.
- For a pre-launch page the goal is brand and "coming soon" recall plus list sign-ups, not a head-term ranking.
- I will not add hidden text or keyword-stuffed blocks.

## 4. Proposed on-page SEO

### Home (`/`)

| Element | Proposal | Length |
|---|---|---|
| `<title>` | `Snugglegum™ – Liquid-Filled Pineapple Gummies for Grownups` | 58 |
| Meta description | `Snugglegum™ makes liquid-filled pineapple gummies for grownups 18+. Coming soon in the USA. Join the list to hear first and get the pre-launch deal.` | 148 |
| H1 | Design copy, unchanged: "For kisses that don't stop at the lips." | |
| Answer block (`<p>` under H1) | Design copy: "Liquid-filled pineapple gummies. They haven't launched yet. The list is how you get in first." | |
| OG/Twitter | Same title and description, 1200×630 image generated from the hero composition | |
| Alt text (hero pouch) | `Snugglegum™ pouch of liquid-filled pineapple gummies` (the design has `Snugglegum pouch`; this adds the ™ and the product description) | |

### `/imprint`

| Element | Proposal |
|---|---|
| `<title>` | `Imprint – Snugglegum™` |
| Meta description | `Legal notice and operator information for Snugglegum™, the pre-launch brand of liquid-filled pineapple gummies for adults 18+.` |
| H1 | `Imprint` |

### `/privacy`

| Element | Proposal |
|---|---|
| `<title>` | `Privacy Policy – Snugglegum™` |
| Meta description | `How Snugglegum™ handles your data: newsletter sign-up with double opt-in via MailerLite, cookies, retention and your rights under the GDPR.` |
| H1 | `Privacy Policy` |

## 5. Heading map

```
/  (home)
h1  For kisses that don't stop at the lips.
h2  Three things for joining before launch              #offer
  h3  [discount] off        (hidden while discountLabel is empty)
  h3  7 days early
  h3  Founding number
h2  How it works                                        #how-it-works
  h3  It starts with digestion          (see copy conflicts in plan)
  h3  Brushing is only the start        (see copy conflicts in plan)
  h3  Make it a rhythm
h2  What's inside                                       #whats-inside
  h3  Zinc / Maca / L-Arginine / Pineapple / Liquid center
h2  Who it's for
h2  Who it's not
h2  Questions, answered                                 #faq  (questions are <summary> elements)
h2  Can't wait to be tasted better?                     #final-cta   (see copy conflicts in plan)
footer (nav "Legal", cookie settings button)
dialogs: Supplement Facts (h2), Cookies, briefly (h2), each closed by default

/imprint   h1 Imprint, h2 numbered sections
/privacy   h1 Privacy Policy, h2 numbered sections
```

"Who it's for" and "Who it's not" are separate H2s in the design. I keep them as designed. The design also shows small uppercase eyebrow lines ("Yes", "Not really", "The pre-launch deal") as `<p>` elements, not headings.

## 6. Structured data (JSON-LD)

| Type | Where | Notes |
|---|---|---|
| `Organization` | All pages | `name: "Snugglegum™"`, `url`, `logo`, `email` only once you confirm the real address. No `sameAs` until real profiles exist. Founder/operator name is not added, since the operator may change to a US LLC. |
| `WebSite` | Home | `name`, `url`, `inLanguage: "en-US"`. No `SearchAction` (no site search). |
| `WebPage` | Every page | `name`, `description`, `isPartOf`, `inLanguage`. |
| `FAQPage` | **Not added** | Only after you approve `docs/faq-proposal.md`. The markup must match the visible FAQ exactly. |
| `Product`, `Offer`, `AggregateRating`, `Review` | **Never for now** | No price, no availability, no real reviews. |

## 7. GEO / AEO plan

- **Answer-first:** the definition sentence sits directly under the H1 and is repeated in the meta description and `llms.txt`.
- **`llms.txt`:** short, factual. Brand name with ™, what it is, pre-launch status, USA first and not in the EU, 18+ only, how to join the list, pages list. No claims.
- **`robots.txt`:** allow all major search and AI crawlers explicitly (list will be in the README with a one-line toggle per bot), plus the sitemap URL.
- **Internal anchors:** `#offer`, `#how-it-works`, `#whats-inside`, `#faq`, `#final-cta`, with descriptive link text.
- **Entity consistency:** the brand is always "Snugglegum™", never "Snuggle Gum", "Snugglegum" without ™, or "GumShot" in body copy.
- **Fast LCP:** the hero pouch is the LCP element. It gets `astro:assets` AVIF/WebP, explicit dimensions, `loading="eager"` and `fetchpriority="high"`. Font preload for the single variable Archivo file.

## 8. Things I noticed that affect SEO

- The pouch artwork includes the text "BODY FRESH". That is image text, so it is invisible to search engines but visible to users and it is a body claim. See the plan.
- The design's two footer email addresses differ (`gummyshot@…` and `gumshot@…`), which would hurt entity consistency. See the plan.
