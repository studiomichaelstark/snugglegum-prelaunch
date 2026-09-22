# Snugglegum™ Brand Voice Guidelines

## Generation Metadata
- Created: 2026-09-22
- Version: 1
- Replaces: n/a (first generation)
- Sources: shipped site copy (~15 `.astro` files), `docs/plan.md`, `docs/seo-keywords.md`, `docs/faq-proposal.md`, `docs/legal-review.md`, `src/config/site.ts`, `tests/unit/guardrails.spec.ts`
- Documents processed: 7 planning/config documents + the full shipped copy surface
- Conversations analyzed: 0 (no sales/support transcripts exist for this project)
- Discovery report used: No — no `/brand-voice:discover-brand` report exists in this session, and the brand-voice platform connectors (Notion, Box, Gong, etc.) are not authorized here. See Data Gaps.
- Overall confidence: **High** (aggregate 0.86 — see Confidence Scores)

---

## Executive Summary

Snugglegum™ is a pre-launch DTC brand selling liquid-filled pineapple gummies "for grownups," positioned almost entirely on personality rather than health or performance claims. The voice is irreverent and innuendo-forward — the hero headline ("For kisses that don't stop at the lips.") and the brand name itself are the joke — but it is disciplined about *where* the humor goes. The moment content touches safety, dosage, legal, or cookies, the jokes stop and the copy becomes plain and precise. That contrast — cheeky everywhere it's safe to be, completely straight everywhere it isn't — is the brand's actual operating discipline, and it's enforced by the codebase itself (a Playwright test bans two words outright and requires the trademark sign on every mention of the name).

The brand explicitly defines itself against a category norm: competing gummy/wellness brands lean on long lists of health-benefit claims (see `docs/seo-keywords.md`'s read of Grüns and SmartSweets); Snugglegum's own planning docs rule that out categorically — no health, body-odor, "body taste," or ingredient-benefit claims. **That rule is currently in tension with a chunk of the live copy** (the hero's whole premise, the "Body Taste Cheat Code" lead magnet, most of the "How it works" section) — nine specific lines are shipping today flagged `data-copy-review`, pending an explicit decision documented in `docs/plan.md` §2.1. This is the single most important open item in this document; see Open Questions.

---

## We Are / We Are Not

| We Are | We Are Not |
|--------|------------|
| **Irreverent, via wordplay** — the joke is in the name, the pun, the double meaning a reader has to sit with for a second | **Crude, or joking about bodies as fact** — humor targets the brand name and the category, not a stated body-condition claim |
| **Confident without begging** — states what's true and lets scarcity speak ("the list is how you get in first," "the offer closes") | **Hypey or superlative** — no "best," "#1," "clinical," "science-backed"; nothing the brand can't substantiate |
| **Honest about limits, said plainly** — "Not yet, but on the list," "We can't promise the perfect X," "Talk to your doctor" | **Overpromising**, especially on health or body outcomes |
| **Warm about an awkward topic** — the category is faintly taboo-adjacent, and the copy treats that gently rather than clinically | **Preachy or medicalized** — no "gut health," "detox," "wellness," "science-backed" register |
| **Age-gated, not euphemistic** — "gummies for grownups," "Why 18+? Because our humor is." | **"Adult" in the euphemistic sense** — explicitly rejected in `docs/seo-keywords.md` as ambiguous and adult-content-adjacent |
| **Precise and plain when it counts** — dosage lines, cookie modal, legal pages, error states all drop the jokes entirely | **Flippant about safety, legal, or compliance content** — zero personality in the FDA disclaimer, imprint, or privacy pages |
| **Specific and sensory** — "Andean root with a big personality," "a beach holiday in your mouth," "one liquid center, zero mystery" | **Vague wellness-speak** — "functional," "energy," "focus," "recovery" are explicitly excluded/held terms |

### Voice Attributes Detail

#### Attribute 1: Irreverent, via wordplay
- **What it means**: The brand's wit lives in double meanings and puns, not shock value. Readers are trusted to get the joke a beat late.
- **How it shows up**: "For kisses that don't stop at the lips." (Hero H1); "Cookies, briefly" (cookie modal heading — a pun on "brief"); "Say 'Engineered to make you gum' out loud. We'll wait." (FAQ); "Begum tasty" (Marquee).
- **What to avoid**: Making the joke *about* a body condition or effect rather than about the name/category. That's the line the current flagged copy crosses (see Open Questions).
- **Evidence**: Consistent across Hero, FAQ, Marquee, CookieModal — 4+ independent shipped files. `docs/faq-proposal.md` explicitly confirms the FAQ's name pun is "deliberately double-meaning" and intentional.
- **Confidence**: High

#### Attribute 2: Confident without begging
- **What it means**: Scarcity and exclusivity are stated as fact, not urgency-marketing pressure.
- **How it shows up**: "The list orders a full week before it's public. First batch is limited, so early means something." "Once it's public, the offer closes." "Founding number: reserved on confirmation."
- **What to avoid**: Countdown-timer energy, exclamation points, "hurry" / "don't miss out" phrasing — none appear anywhere in the shipped copy.
- **Evidence**: Offer section (3 card blurbs), FinalCta, NewsletterSuccess all use the same restrained-scarcity register. Corroborated negatively by `docs/seo-keywords.md`, which explicitly excludes superlative terms ("best," "#1," "top-rated") as unsubstantiated.
- **Confidence**: High

#### Attribute 3: Honest about limits, said plainly
- **What it means**: Where the brand can't promise something (EU availability, a body outcome, medical safety), it says so directly instead of hedging with vague marketing language.
- **How it shows up**: "Not yet, but on the list. USA launches first, EU's still on the waitlist too." "It's a dietary supplement. Talk to your doctor if you have a medical condition or take medication."
- **What to avoid**: Soft-pedaling a limitation instead of stating it; implying availability or effect that isn't real.
- **Evidence**: FAQ ("Where can I get it?", "Is it safe?"), corroborated by `docs/plan.md`'s content-guardrail policy and `docs/legal-review.md` point 11 on EU sign-ups.
- **Confidence**: High

#### Attribute 4: Warm about an awkward topic
- **What it means**: The product category (breath/taste-adjacent) is handled with reassurance rather than embarrassment or clinical distance.
- **How it shows up**: "Your body isn't doing anything wrong. It's just doing biochemistry." (currently flagged, see Open Questions, but demonstrates the *intended* register).
- **What to avoid**: Shaming language, or swinging the other way into medical/clinical phrasing.
- **Evidence**: Single strong example, currently pending copy review — this is why confidence is capped below the top attributes.
- **Confidence**: Medium (single flagged source; would become High once the line is either approved as-is or replaced with copy in the same register)

#### Attribute 5: Age-gated, not euphemistic
- **What it means**: The 18+ restriction is played for a joke about the brand's humor, not framed as an "adult" product in the innuendo-marketing sense.
- **How it shows up**: The stamp badge "Gummies for grownups only," FAQ "Why 18+? Because our humor is.," Audience section ("Under 18s (come back later).").
- **What to avoid**: "Adult gummies" — `docs/seo-keywords.md` flags this exact phrase as excluded, both for adult-content search adjacency and audience-intent mismatch.
- **Evidence**: 3 shipped copy locations + explicit exclusion documented in the SEO research. High corroboration.
- **Confidence**: High

#### Attribute 6: Precise and plain when it counts
- **What it means**: Legal, safety, dosage, and transactional-failure copy carries zero brand personality — it's the one place voice intentionally goes silent.
- **How it shows up**: Cookie modal body text ("We only store what is strictly necessary..."), dosage line ("Please don't exceed the recommended amount, more isn't better, it's just more."), network/rate-limit error messages, all of `/imprint` and `/privacy`.
- **What to avoid**: Jokes anywhere near a safety instruction, a legal disclosure, or a genuine error state (as opposed to a light one like "already subscribed," which does keep some personality — "Nice taste.").
- **Evidence**: Consistent across CookieModal, WhatsInside, NewsletterForm error templates, Legal.astro — 4+ files, explicit and structural (dedicated legal layout with a "Legal · draft" gate).
- **Confidence**: High

#### Attribute 7: Specific and sensory
- **What it means**: Product description leans on concrete, textural language over abstract benefit claims.
- **How it shows up**: "Andean root with a big personality." "The flavor. A beach holiday in your mouth." "Five ingredients, one liquid center, zero mystery."
- **What to avoid**: "Functional," "gut health," "energy," "focus," "recovery," "science-backed" — all explicitly excluded or held pending a strategic decision in `docs/seo-keywords.md`.
- **Evidence**: WhatsInside ingredient copy (5 examples) + explicit exclusion list in the SEO doc.
- **Confidence**: High

---

## Brand Personality

- **Archetype**: The Charming Troublemaker — funny, a little naughty, genuinely trustworthy the moment it matters.
- **If our brand were a person**: The friend who makes the dare fun but is also the first one to say "actually, don't do that" when it's a real risk. Quick with a pun, allergic to hype, and visibly relieved not to have to talk like a supplement label.
- **Core values expressed in voice**: Honesty about limits over spin; humor as connection (rewarding attention, not shocking); respect for the reader's intelligence (the FAQ's "We'll wait." assumes the reader will get there); restraint under regulation — the brand doesn't hide claims behind euphemism, it just doesn't make them.

---

## Messaging Framework

### Primary Value Proposition
Liquid-filled pineapple gummies for grownups, worth waiting for, and honest about what they are.

Variations observed:
- "Liquid-filled pineapple gummies. They haven't launched yet. The list is how you get in first." (Hero subhead)
- "All the good stuff. Five ingredients, one liquid center, zero mystery." (WhatsInside subhead)

### Key Message Pillars

1. **Get in before everyone else**
   - Core idea: Joining the list now buys real, time-boxed advantages (early access, a founding number, a possible discount) that disappear at public launch.
   - When to use: Offer section, FinalCta, footer CTA — any conversion-focused moment.
   - Example phrasing: "The list orders a full week before it's public. First batch is limited, so early means something."

2. **The joke is the hook**
   - Core idea: Wordplay and innuendo (on the name, the category, the situation) carry the brand's personality and differentiate it from earnest wellness-brand copy.
   - When to use: Headlines, section intros, FAQ, marquee — anywhere that isn't safety, legal, or transactional.
   - Example phrasing: "Say 'Engineered to make you gum' out loud. We'll wait."

3. **Simple, not "functional"**
   - Core idea: Five named ingredients, no claims, no mystery — positioned explicitly against the category's benefit-list norm.
   - When to use: Product/ingredient copy, competitive contexts.
   - Example phrasing: "Five ingredients, one liquid center, zero mystery."

### Competitive Positioning
(Source: `docs/seo-keywords.md` §2, direct competitive research — AUTHORITATIVE)

- vs. Grüns: Grüns' copy is a long list of body/health benefit claims — the exact pattern `docs/seo-keywords.md` says "we must not copy." Snugglegum stays claim-free by design.
- vs. SmartSweets: Similarly playful tone, but SmartSweets leans on numeric sugar-reduction claims. Snugglegum doesn't compete on quantified health claims at all.
- vs. AG1: AG1's "definition-first" clarity (a plain "what is it" sentence up front) is worth keeping — Snugglegum already does this in the hero subhead — but AG1's benefit-heavy copy is not adopted.
- vs. category status quo: Per the source doc's own conclusion — "the playful tone is a differentiator in this category." Humor and honesty are the wedge, not medical claims.

---

## Tone-by-Context Matrix

Voice (the "We Are" table) stays constant. These three dimensions flex by context:

| Context | Formality | Energy | Technical Depth | Key Principle |
|---------|-----------|--------|------------------|---------------|
| Hero / marketing headlines | Low | High | Low | Lead with the pun, not the pitch |
| Offer / pre-launch CTAs | Low–Medium | High | Low | Confident urgency — "closes," never "hurry!" |
| Ingredient / product copy | Medium | Medium | Low–Medium | Sensory and specific, never clinical |
| FAQ (mixed) | Varies by question | Varies | Low | Match the question's register — joke about the name, go straight on safety |
| Compliance / cookies / legal | High | Low | Medium | Zero jokes, full plain-language clarity |
| Transactional / form messages | Medium | Low–Medium | Low | Reassure fast; personality only on the easy wins, never on real friction |

### Context-Specific Guidelines

#### Hero / Marketing Headlines
- **Overall tone**: Confident, cheeky, a little suggestive.
- **Opening approach**: Lead with the wordplay; the plain product description follows immediately under it (a pattern borrowed deliberately from AG1's "definition-first" approach, per `docs/seo-keywords.md`).
- **Do's**: Trust the reader to catch the joke; keep the follow-up sentence completely literal.
- **Don'ts**: Don't explain the joke; don't stack two jokes in a row.
- **Example**: "For kisses that don't stop at the lips." → "Liquid-filled pineapple gummies. They haven't launched yet."

#### FAQ
- **Overall tone**: Swings per question — this is the clearest single place the tone-flex rule is visible in the wild.
- **Opening approach**: Answer first, personality second (or not at all, for safety questions).
- **Do's**: Let questions about the name/brand/humor be genuinely funny; keep questions about safety/dosage/medical status completely plain.
- **Don'ts**: Never joke in a safety or dosage answer.
- **Example (playful)**: "Why 18+?" → "Because our humor is." **Example (plain)**: "Is it safe?" → "It's a dietary supplement. Talk to your doctor if you have a medical condition or take medication."

#### Compliance / Cookies / Legal
- **Overall tone**: Plain-language legal register. One small allowed exception: a pun is acceptable in a *heading* ("Cookies, briefly") but never in the body text underneath.
- **Do's**: State exactly what is and isn't collected; use the FDA-required disclaimer verbatim; keep legal pages in a visibly distinct register from the marketing site.
- **Don'ts**: No jokes, no scarcity language, no brand personality embellishment.
- **Example**: "We only store what is strictly necessary to run the site... No cookies are set."

#### Transactional / Form Messages
- **Overall tone**: Efficient and reassuring by default; personality allowed only when nothing has actually gone wrong.
- **Do's**: Keep genuine error states (network failure, rate limit) plain and solution-oriented; reserve personality for benign states (already-subscribed).
- **Don'ts**: Don't make light of an actual failure.
- **Example (benign)**: "You're already on the list. Nice taste." **Example (real friction)**: "We couldn't reach the list. Check your connection and try again."

---

## Terminology Guide

### Must-Use Terms
| Term | Usage | Instead Of | Example |
|------|-------|------------|---------|
| Snugglegum™ | Every mention of the brand name carries the trademark sign — this is enforced by an automated test | "Snugglegum" without ™, "Snuggle Gum" | "Snugglegum™ makes liquid-filled pineapple gummies." |
| gummies for grownups | The age/audience framing | "adult gummies" | "Gummies for grownups only." |

### Preferred Terms
| Term | Usage | Example |
|------|-------|---------|
| liquid-filled pineapple gummies | Primary product descriptor — verified as the strongest, most truthful differentiator in `docs/seo-keywords.md` | "Liquid-filled pineapple gummies. They haven't launched yet." |
| the list / pre-launch list | The waitlist mechanism | "The list is how you get in first." |

### Avoid These Terms
| Term | Reason | Alternative |
|------|--------|-------------|
| functional / functional gummy | Held pending a strategic decision — implies an effect the current claim-free copy can't back up (`docs/seo-keywords.md`) | Describe ingredients by name instead of by claimed effect |
| body taste / body odor / ingredient-benefit phrasing | Conflicts with the brand's own stated content guardrail; 9 lines using this register are currently flagged pending review (`docs/plan.md` §2.1) | Reframe around the name/category joke instead of a body claim — see Open Questions |

### Never-Use Terms
| Term | Reason |
|------|--------|
| "superfood," "sex" | Hard-banned — a Playwright test fails the build if either appears anywhere in source or built output |
| gut health, digestive, immune support, detox, weight loss, probiotics, energy, focus, beauty, recovery | Health/effect claims requiring substantiation the brand has ruled out |
| sugar-free, vegan, gluten-free, organic, natural | Unverified, and the Supplement Facts panel lists 8g added sugar — "sugar-free" would be factually false |
| clinical, science-backed, doctor-recommended, third-party tested | Unverifiable claims |
| best, #1, top-rated | Unsubstantiated superlatives |
| kids, children's | Product is 18+ only |
| adult gummies | Ambiguous, adult-content-adjacent search intent |
| shop, buy, price, discount code (as live CTAs) | Not purchasable yet — misleading on a pre-launch page |
| GumShot (in body copy) | Entity-consistency risk flagged in `docs/seo-keywords.md`; only the `gummyshot@` email address uses this form |

---

## Voice in Action

*Note: this project has no sales/support conversation data, so this section is illustrative (drawn from shipped copy) rather than ranked by measured effectiveness. See Data Gaps.*

1. **"Say 'Engineered to make you gum' out loud. We'll wait."** — Context: FAQ, "What's with the name?" — Why it works: rewards the reader for playing along; confirmed as intentional wordplay in `docs/faq-proposal.md` rather than an accident worth softening.
2. **"Please don't exceed the recommended amount, more isn't better, it's just more."** — Context: dosage instruction, WhatsInside — Why it works: keeps the brand's dry wit ("it's just more") while still delivering a real safety instruction clearly — the template for how personality and responsibility coexist.
3. **"Nice taste."** — Context: already-subscribed form message — Why it works: a two-word personality touch in a state where nothing has gone wrong, contrasted deliberately with the plain wording used for genuine errors.

## Language to Avoid

### Anti-Patterns
(Source: `docs/plan.md` §2.1 — the project's own explicit content-guardrail conflict list. These lines are still live on the site today, flagged `data-copy-review`, pending your decision — see Open Questions.)

1. **"Can't wait to be tasted better?"** (FinalCta heading) — Problem: implies a body-condition outcome, which conflicts with the stated no-health-claims policy. — Better direction: reframe around anticipation for the *product* or the *list*, in the register of "Say 'Engineered to make you gum' out loud" — playing on the name/category, not a body claim.
2. **"Zinc, maca and L-arginine support a more balanced system, so there's simply less to mask."** (HowItWorks step 2) — Problem: ingredient-benefit claim. — Better direction: describe what the ingredients *are* (as WhatsInside does: "An amino acid your body already knows") rather than what they allegedly *do*.
3. **"3 Snugglegum™ a day, helps you taste okay" / "Because you are the aftertaste"** (Marquee) — Problem: body-taste claims. — Better direction: the marquee's other two lines ("Begum tasty," "Gum once, thank me later") already show the wordplay-only pattern to follow instead.

---

## Content Examples

### Excellent Examples
**"Say 'Engineered to make you gum' out loud. We'll wait."** (FAQ) — On-brand because it's a pure name/category pun with zero claim risk, confirmed as intentional, and trusts the reader — the clearest unflagged demonstration of Attribute 1 (Irreverent, via wordplay).

**"It's a dietary supplement. Talk to your doctor if you have a medical condition or take medication."** (FAQ, "Is it safe?") — On-brand because it demonstrates the tone-flex rule precisely: same brand, zero jokes, because the topic is real.

### Examples to Avoid
**"Can't wait to be tasted better?"** (FinalCta — currently live) — Off-brand relative to the site's own stated content policy: it's a body-taste implication, one of nine such lines flagged in `docs/plan.md` §2.1. Not necessarily *bad copy* on its own terms — it clearly reads as on-voice cheekiness — but it's the kind of line the brand's own guardrails say shouldn't ship without review. Fix direction: keep the confident-question structure, swap the body-outcome implication for a category/name joke or a pure anticipation line about the product itself.

---

## Confidence Scores

| Section | Confidence | Basis | Sources |
|---------|------------|-------|---------|
| Voice Attributes | High | 7 attributes, each backed by 2+ shipped-copy examples plus explicit guardrail documents; consistent, no unresolved conflicts except Attribute 4 (Medium, single flagged source) | 15+ shipped files + `docs/plan.md` |
| Messaging Framework | Medium | Value prop and pillars are consistent across the shipped copy, but there's no formal one-line positioning statement anywhere — inferred from patterns, not stated outright | Shipped copy + `docs/seo-keywords.md` |
| Tone Matrix | High | 6 contexts, each with 3+ corroborating examples and a clear, consistent structural signal (e.g., a dedicated Legal layout, distinct error-message wording) | Shipped copy across sections, forms, consent, legal |
| Terminology | High | Must-use/never-use terms are largely test-enforced or explicitly documented in competitive research, not inferred | `guardrails.spec.ts`, `docs/seo-keywords.md` |
| Language Patterns | Medium | Strong internal consistency, but no conversational/outcome data exists to rank effectiveness — see Data Gaps | Shipped copy only |

**Aggregate**: 0.30 (Voice, High) + 0.15 (Messaging, Medium) + 0.20 (Tone, High) + 0.15 (Terminology, High) + 0.06 (Language, Medium) = **0.86 → High**

---

## Open Questions for Team Discussion

### High Priority (blocks guideline completion)
1. **Nine lines of live copy conflict with the brand's own no-health-claims policy**
   - What was found: `docs/plan.md` §2.1 lists 9 specific copy blocks — the hero's "Body Taste Cheat Code" lead magnet, most of the "How it works" narrative, two Marquee lines, and the FinalCta headline — that read as body, health, or ingredient-benefit claims. This directly conflicts with your own stated content guardrail (no health, body-odor, "body taste," or ingredient-benefit claims). All 9 are shipping today, marked `data-copy-review`, under `docs/plan.md`'s default "Option A" (ship as designed until you send replacement copy).
   - Agent recommendation: Use the FAQ's proven register ("Because our humor is.," the name pun) as the template for rewrites — play on the brand name and category, not on a body-condition outcome. This preserves Attribute 1 (Irreverent, via wordplay) without the claim risk.
   - Need from you: Resolve `docs/plan.md` §2.1's Option A/B/C decision (send replacement copy / accept the risk / cut the sections). This also determines whether the lead magnet needs a new name.

### Medium Priority (improves quality)
2. **"Functional gummy" positioning is undecided**
   - What was found: `docs/seo-keywords.md` holds this term pending your call — it implies an effect the current claim-free copy can't substantiate, and adopting it would be a strategic shift, not just a copy edit.
   - Agent recommendation: Keep "functional" out of approved terminology until that decision is made explicitly, so it doesn't slip into copy piecemeal.
   - Need from you: A yes/no on pursuing a "functional" category position at all, independent of any single piece of copy.

### Low Priority (nice to have)
3. **No sources beyond the shipped site and its own planning docs**
   - What was found: There's no separate style guide, founder interview, or sales/support transcript corroborating voice choices beyond the copy itself.
   - Agent recommendation: If useful, run `/brand-voice:discover-brand` once the relevant platform connectors (Notion, Drive, etc.) are authorized, or point a future run of this command at founder notes or a pitch deck if any exist — this would raise Messaging Framework and Language Patterns from Medium to High confidence.
   - Need from you: Nothing required now; optional for a future refresh.

---

## Data Gaps & Recommendations

- [ ] No sales/support conversation transcripts exist — connect Gong/Granola, or point this command at manual transcripts if any exist, to build an effectiveness-ranked "Language That Works" section.
- [ ] No founder-voice document ("if our brand were a person") — Brand Personality here is inferred from copy patterns alone; a short founder interview would raise it to High confidence.
- [ ] The claims-guardrail tension (9 flagged copy blocks) is unresolved — see Open Question #1. This is the most consequential gap in the entire document.
- [ ] The brand-voice platform connectors (Notion, Box, Gong, Confluence, SharePoint) are not authorized in this session — if brand material lives in any of those, authorize the connector and re-run `/brand-voice:discover-brand` first.

---

## Appendix: Sources

| # | Source | Platform | Type | Date | Key Sections Used | Confidence |
|---|--------|----------|------|------|--------------------|------------|
| 1 | Shipped site copy (`src/components/sections/*.astro`, `forms/*.astro`, `consent/CookieModal.astro`, `layouts/Legal.astro`) | Local repo | AUTHORITATIVE (live production copy) | current as of 2026-09-22 | All visible marketing, product, FAQ, legal, and transactional copy | High |
| 2 | `docs/plan.md` | Local repo | AUTHORITATIVE (explicit content guardrails, §2.1 and §9) | 2026-09-21 | Content-claim policy, banned words, "not going to do" list | High |
| 3 | `docs/seo-keywords.md` | Local repo | AUTHORITATIVE (competitive positioning, keyword inclusion/exclusion) | 2026-09-21 | Competitive tone comparison, terminology rules | High |
| 4 | `docs/faq-proposal.md` | Local repo | OPERATIONAL (confirms intentional FAQ wordplay) | undated | FAQ voice confirmation | High |
| 5 | `docs/legal-review.md` | Local repo | OPERATIONAL (compliance constraints shaping voice) | undated | Points 8–12 on claims and disclosures | Medium |
| 6 | `src/config/site.ts`, `src/config/placeholders.ts` | Local repo | OPERATIONAL (brand name, locale, config facts) | current | Brand name form, locale (en-US) | High |
| 7 | `tests/unit/guardrails.spec.ts` | Local repo | AUTHORITATIVE (test-enforced brand rules) | current | Banned words, trademark-sign requirement | High |

No discovery report, conversation transcripts, or connected-platform documents were available for this generation.
