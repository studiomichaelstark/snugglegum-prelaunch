# Snugglegum™ / GumShot™ — Design System

Single source of truth for the pre-launch landing page. Derived from Reference A (Hartzler Dairy: layout, color, ticket labels, stamps, outlined pills), Reference B (Unwell: section rhythm, dashed "+" rows, sticker tags, giant footer wordmark — serif and red palette explicitly excluded) and Reference C (conversion anatomy only).

Prototype file: `Snugglegum Landing.dc.html`.

---

## Color palette

| Token | Hex | RGB | Use |
|---|---|---|---|
| `sky` | `#56DDDB` | 86, 221, 219 | Giant display word, ticket labels, step card 3, focus rings, decorative fills |
| `forest` | `#045442` | 4, 84, 66 | Body text and headings on light, dark surfaces, primary button, all 1.5–2px borders |
| `pink` | `#F9CEE1` | 249, 206, 225 | Reverse text on `forest`, pastel section background ("What's inside"), on-dark button fill |
| `sun` | `#FFAE01` | 255, 174, 1 | Step card 1, incentive sticker, floating tags — **TO CONFIRM** |
| `butter` | `#FFDB93` | 255, 219, 147 | Step card 2, soft accent cards — **TO CONFIRM** |
| `white` | `#FFFFFF` | 255, 255, 255 | Default page background |

Verified against the Hartzler screenshot: the headline cyan samples at `#56DDDB`, the dark green at `#045442`, the Colby card at `#FFAE01` and the Gouda card as a soft gradient averaging `#FFDB93`. **Deviation flagged:** the Gouda card in Reference A is a subtle gradient; the brief forbids gradients, so `butter` is used flat.

No new hues. Tints are only ever `forest` at reduced opacity (`#04544244` for secondary dashed dividers, `opacity: .75–.85` for fine print).

### Contrast ratios (WCAG 2.2)

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `forest` | `white` | 8.81:1 | AAA — body, headings, labels |
| `forest` | `sky` | 5.36:1 | AA all sizes |
| `forest` | `pink` | 6.27:1 | AA all sizes |
| `forest` | `sun` | 4.71:1 | AA all sizes (just above 4.5) |
| `forest` | `butter` | 6.64:1 | AA all sizes |
| `pink` | `forest` | 6.27:1 | AA all sizes — reverse text |
| `white` | `forest` | 8.81:1 | AAA |
| `sky` | `white` | 1.64:1 | **Fails.** Display type ≥48px and decorative fills only — never text, never a label, never a button |

`sky` is used as text exactly once: the `GUMSHOT` display word, `aria-hidden`, duplicated as real text in the H1 area for screen readers via the surrounding copy.

```css
:root{
  --sky:#56DDDB; --forest:#045442; --pink:#F9CEE1;
  --sun:#FFAE01; --butter:#FFDB93; --white:#FFFFFF;
}
```

```js
// tailwind.config
colors:{ sky:'#56DDDB', forest:'#045442', pink:'#F9CEE1', sun:'#FFAE01', butter:'#FFDB93' }
```

---

## Typography

One family: **Archivo** variable (`wght` 100–900, `wdth` 62–125). No serif anywhere — Reference B's serif moments are all set in Archivo at expanded width.

| Role | Size | Weight | Width | Line-height | Tracking | Case |
|---|---|---|---|---|---|---|
| Display (`GUMSHOT`, footer wordmark) | `clamp(4rem, 18vw, 16rem)` | 900 | 125 | 0.85 | -0.03em | Upper |
| H1 | `clamp(2.25rem, 6vw, 5rem)` | 900 | 118 | 0.92 | -0.02em | Sentence |
| H2 (section) | `clamp(2rem, 5vw, 4rem)` | 900 | 120 | 0.90 | -0.02em | Upper |
| H3 (card / row title) | `clamp(1.75rem, 3vw, 2.5rem)` / 22px | 900 / 800 | 118 / 100 | 0.95 / 1.1 | 0 | Upper / Sentence |
| Statement row | `clamp(2rem, 6.5vw, 4.5rem)` | 900 | 112 | 1.02 | -0.015em | Sentence |
| Label (ticket, caption, button, pill) | 12–14px | 600 | 112 | 1 | 0.14em | Upper |
| Body | 17px (18px desktop lead) | 400 | 100 | 1.55 | 0 | Sentence |
| Fine print | 13–14px | 400 | 100 | 1.6 | 0 | Sentence |
| Placeholder captions | 8–11px | 400 | — | 1.4 | 0 | Upper |

```css
.display{font-variation-settings:'wdth' 125;font-weight:900;line-height:.85;letter-spacing:-.03em;text-transform:uppercase}
.label{font-variation-settings:'wdth' 112;font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:12px}
body{font-family:Archivo,Helvetica,Arial,sans-serif;font-size:17px;line-height:1.55}
```

**Deviation flagged:** the prototype loads Archivo from Google Fonts so the design renders in the browser preview. **Production must self-host** — WOFF2, Latin subset, variable axes, `font-display: swap`, `<link rel="preload">` on the display cut, no request to `fonts.gstatic.com` (GDPR). If the variable width axis is dropped, substitute Archivo Black for display and Archivo for everything else.

---

## Spacing and layout

- Base scale: 4px. Steps used: 4, 8, 10, 12, 14, 16, 20, 22, 24, 28, 32, 36, 44, 48, 64, 72, 88.
- Container: `max-width: 1200px`, centered. FAQ narrows to 900px, legal template and forms to 760px / 620px.
- Side padding: `clamp(20px, 5vw, 48px)` (24px is the mobile floor on the 390px artboard).
- Section padding (vertical): `clamp(4rem, 10vw, 8rem)`; lighter sections `clamp(3rem, 8vw, 6rem)`.
- Grids: `repeat(auto-fit, minmax(240px, 1fr))` for the three step cards, `minmax(300px, 1fr)` for two-up blocks, fixed `repeat(3, 1fr)` for the hero product row so the overlapping composition survives on mobile.
- Hero overlap: product row pulled up by `clamp(-150px, -9vw, -32px)` over the display word.
- Breakpoints: Tailwind defaults (`sm 640 / md 768 / lg 1024 / xl 1280`). Designed mobile-first at 390px, checked at 1440px.

---

## Buttons and CTAs

| Variant | Fill | Text | Border | Notes |
|---|---|---|---|---|
| Primary (light) | `forest` | `pink` | 2px `forest` | Hero + final CTA submit |
| Primary (on `forest`) | `pink` | `forest` | 2px `pink` | Final CTA, sticky bar |
| Outline pill | transparent | `forest` | 2px `forest` | Footer legal links, share action |

- Shape: pill (`border-radius: 999px`), height 56px (primary), 46–50px (pills, minimum 44px touch target), padding `0 28px` / `0 22px`.
- Hover: swap to `sky` fill with `forest` text, `translateY(-2px)`, 150ms ease. Outline pills invert to `forest`/`pink`.
- Active: `scale(.98)`.
- Focus: `outline: 3px solid var(--sky); outline-offset: 3px` — visible on every interactive element, on dark surfaces too.
- Disabled/loading: label swaps to "Sending…", button stays interactive-looking, no spinner (zero JS budget).

---

## Forms and inputs

- Input: pill, 56px, `2px solid forest`, white fill, 17px text, `0 22px` padding, placeholder `forest` at 40%.
- Focus: 3px `sky` ring, 3px offset. On the `forest` band the input border is `pink`.
- Label: visually hidden but real (`<label for>`), never a placeholder-only field.
- Consent checkbox: required, **unchecked by default**, 22px box, `accent-color: forest`, 14px label with a link to the privacy policy.
- Honeypot: off-screen `website` text input, `tabindex="-1"`, `aria-hidden`, `autocomplete="off"`.
- Hidden UTM fields: `utm_source`, `utm_medium`, `utm_campaign` (disclosed in the privacy policy).

States (all in the prototype via the `formState` tweak):

| State | Treatment |
|---|---|
| Default | As above |
| Focus | 3px `sky` ring |
| Invalid email | `role="alert"` message on `pink` with 1.5px dashed `forest` border, input keeps focus |
| Missing consent | Same message pattern, checkbox label emphasised |
| Loading | Button label "Sending…" |
| Success | Form replaced by dashed `pink` card: "Check your inbox and confirm your email." + optional share pill |
| Error | Same alert pattern, message offers retry |
| Already subscribed | Alert pattern, friendly wording, no duplicate submit |

Prototype shortcuts: an address containing `already` returns already-subscribed, one containing `fail` returns the error state.

---

## Cards, ticket labels, stamps, radii, borders

- **Color cards:** radius 28px, flat fill (`sun` / `butter` / `sky`), padding `clamp(24px, 3vw, 36px)`, min-height 280px, icon top / copy bottom.
- **Info cards:** white or transparent fill, `1.5px dashed forest`, radius 22–26px.
- **Placeholders:** exact final aspect ratio, `1.5px dashed forest`, radius 24px, centered monospace label (`PLACEHOLDER: GumShot pouch, 4:5, transparent background`). One component, props `ratio` / `label` / `tone`.
- **Ticket label:** `sky` fill, `forest` 12px label text, 6px radius plus four concave corner notches cut with a four-layer radial-gradient mask:

```css
.ticket{
  background:var(--sky);border-radius:6px;padding:11px 20px;
  -webkit-mask:var(--notch);mask:var(--notch);
}
:root{--notch:
  radial-gradient(circle 8px at 0 0,#0000 98%,#000) 0 0/51% 51% no-repeat,
  radial-gradient(circle 8px at 100% 0,#0000 98%,#000) 100% 0/51% 51% no-repeat,
  radial-gradient(circle 8px at 0 100%,#0000 98%,#000) 0 100%/51% 51% no-repeat,
  radial-gradient(circle 8px at 100% 100%,#0000 98%,#000) 100% 100%/51% 51% no-repeat;}
```

- **Stamp badge:** 84–96px SVG circle, `1.5px forest` stroke, rotated text on a circular `textPath` (`18+ ONLY · 18+ ONLY ·`), 7px `sky` center dot. Each instance needs a unique path `id`.
- **Sticker tags:** pill, 11px uppercase label, rotated -7° to +5°, gentle 6–8.5s float animation, disabled under `prefers-reduced-motion`.
- **Radii summary:** 999px pills, 28px cards, 26px info cards, 24px placeholders, 22px small cards, 6px tickets, `32px 32px 0 0` on the footer band.
- **Borders:** 2px solid for interactive elements, 1.5px solid for stamps, 1.5px dashed for informational containers and dividers.

---

## Iconography and imagery

- Inline SVG only, 48px box, `2px` `forest` stroke, round caps and joins, one flat `sun`/`sky`/`white` fill per icon for the duotone accent. No icon fonts, no CDN.
- Current set in the prototype is geometric and deliberately abstract (crack / burst / chew). **Open item:** the brief's literal set (pineapple, Zn chip, maca root, arginine molecule, burst droplet, soft chew, lock, mail, 18+) needs a drawn icon family from an illustrator — machine-drawn illustrative SVG would not meet the brand bar.
- Imagery: no stock look, no gradients. Every image slot is a labeled placeholder until real shots exist. Needed: pouch hero (4:5), open pouch with chews (4:5), chew macro with liquid burst (4:5), three how-it-works shots, two to three lifestyle/collage shots, OG share image (1200×630).
- Alt text guidance: describe the product and action, never the joke. "GumShot pouch, pineapple soft chews" not "the good stuff".

---

## Motion

CSS only. Sticker float (`translateY` 8px, 6–8.5s), button hover lift 2px / active 0.98, 150ms ease. Optional scroll reveal: opacity 0→1, `translateY(12px)`, 400ms, `IntersectionObserver` under 1 KB. Everything inside `@media (prefers-reduced-motion: reduce){animation:none;transition:none}`.

---

## Cookie modal

- Custom, no library. Fixed overlay `rgba(4,84,66,.55)`, card max-width 560px, bottom-aligned (bottom sheet on mobile, floating card on desktop), 2px `forest` border, 28px radius.
- Three **equally prominent** buttons in one grid row (`auto-fit minmax(150px,1fr)`): Accept all / Reject all / Customize. Same size, same height, same weight — only Accept all is filled `forest`, the other two are white with a `forest` border; no dark pattern.
- Customize expands a dashed panel: Necessary (locked on), Analytics (off), Marketing (off). Toggles are **off by default**; the third button becomes "Save choices".
- Choice persists (`localStorage: sg-cookie-consent`), reopens from the footer "Cookie settings" pill. No non-essential script or third-party request fires before consent.
- Keyboard: ESC closes, focus trapped in the card, focus returns to the trigger.

## Legal page pattern

One template for `/imprint`, `/privacy`, `/cookies`, `/terms`, `/disclaimer`: logo top-left, Close/Back pill top-right, `Legal · draft` ticket, H1 in display width 120, numbered H2 sections at 22px/800, body 17px/1.6 capped at 66ch, dashed card at the end carrying the FDA disclaimer. Placeholders in square brackets everywhere real data is missing.

---

## Page structure → Astro components

| Section | Component | Props / notes |
|---|---|---|
| Hero | `Hero.astro` | composes `Logo`, `TicketLabel`, `StampBadge`, `SignupForm`, `ProductRow` |
| — | `Logo.astro` | inline SVG, `currentColor`, `color` prop (`forest` / `pink`) |
| — | `TicketLabel.astro` | `label`, `tone` |
| — | `StampBadge.astro` | `text`, `size`, unique `id` |
| — | `ImagePlaceholder.astro` | `ratio`, `label`, `tone` — swap for `astro:assets` later |
| — | `SignupForm.astro` | `id`, `tone` (`light` / `dark`), posts to `/api/subscribe` |
| — | `SocialProof.astro` | `count`, `threshold` — renders nothing below threshold |
| How it works | `HowItWorks.astro` + `StepCard.astro` | `step`, `title`, `body`, `tone`, `icon` |
| What's inside | `WhatsInside.astro` + `PlusRow.astro` | `title`, `body`, `icon` |
| Who it's for | `Audience.astro` | two `ToneBlock`s (`forest`/`pink`) |
| Statement row | `StatementRow.astro` | `words[]`, `stickers[]` |
| FAQ | `Faq.astro` + native `<details>` | zero JS |
| Final CTA | `FinalCta.astro` | reuses `SignupForm` with `tone="dark"` |
| Footer | `SiteFooter.astro` | `LegalPills`, disclaimer, `WordmarkBand` |
| Sticky bar | `StickyCta.astro` | shows after hero leaves viewport, <1 KB inline script |
| Cookies | `CookieModal.astro` | consent store in `localStorage`, ESC + focus trap |
| Legal | `layouts/Legal.astro` | one layout, five MD pages |

Token names in code match this file: `sky`, `forest`, `pink`, `sun`, `butter`.

Backend: the form posts to a serverless endpoint that calls MailerLite with the API token from an environment variable (never in the browser), double opt-in configured in MailerLite, and a fallback link to MailerLite's hosted form if JS is unavailable.

---

## Inconsistencies flagged

1. **Reference A uses a script logo; Reference B a fat sans wordmark.** Resolved in favor of the supplied Snugglegum wordmark in both hero and footer, so the page has one voice.
2. **Reference A's Gouda card is a gradient**, the brief bans gradients. `butter` is applied flat.
3. **Reference B's information rows sit on a red/pink block with a serif headline.** Serif removed per the brief; the block is `pink` with Archivo.
4. **`sky` cannot carry text.** The brief lists it for "ticket labels" (background — fine) and "fills" — but any label on `sky` must be `forest`, and `sky` itself never sits on white as readable text. Enforced.
5. **`sun` at 4.71:1 with `forest`** passes AA but only just. If `sun` is ever darkened during confirmation, re-check.
6. **Brief asks for three product placeholders overlapping the giant word on mobile too.** At 390px this compresses each placeholder to roughly 100px; labels drop to 9px, which is below the 12px label floor. Flagged as a mobile trade-off — the alternative is stacking, which loses the Hartzler composition. Decision needed.
7. **Google Fonts in the prototype vs. self-hosting requirement.** Prototype-only deviation, documented above.
8. **Social proof is in the markup but hidden** until `subscriberCount >= proofThreshold` (default 250). No star ratings, no testimonials, no press logos — nothing that isn't real yet.

---

## Open questions

1. `sun` `#FFAE01` and `butter` `#FFDB93` — confirm or replace (both marked TO CONFIRM in the brief).
2. Launch discount: what replaces `[XX% OFF]`?
3. Social-proof threshold: 250 is a placeholder. What number is worth showing?
4. Zinc per chew `[XX mg]` and the Supplement Facts panel.
5. "None of the bad" list — three placeholder rows await the final formula. No claims invented.
6. Legal operator data: name, address, register, VAT, representative, phone.
7. Launch date for FAQ 1 (`[date TBD]`).
8. Icon family: commission a drawn set, or keep the abstract geometric marks?
9. Do you want a scroll-reveal animation at all, or fully static?
10. Share action after sign-up: mailto, copy-link, or native share sheet?
