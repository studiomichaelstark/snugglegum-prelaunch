# Implementation plan: Snugglegum™ pre-launch landing page

Phase 1. No application code has been written. Waiting for your approval and your answers in section 2.

## 1. What I found in the handoff

- **Source of truth is `Snugglegum Landing.dc.html`.** It is a Claude Design prototype (React-like `x-dc` file). I read all 705 lines. There is no separate README. `snugglegum-design-system.md` acts as one, but it is **out of date** against the HTML (see colors below).
- **Colors in the HTML** (these go into `colors.css`; the markdown's `sky`, `sun`, `butter` are not used anywhere in the page):

| Token | Value | Used for |
|---|---|---|
| `--color-brand-green` | `#045442` | text, primary buttons, borders, dark sections |
| `--color-brand-pink` | `#F9CEE1` | hero, footer, cards, reverse text on green |
| `--color-lime` | `#C7E44C` | hover fills, focus rings, alert boxes, arrows, success card border |
| `--color-ink` | `#0E0E0E` | "How it works" section, badges, dialogs, bottom bar |
| `--color-surface` | `#FFFFFF` | page background, inputs |
| `--color-glow` | `#BB9AAA` | drop-shadow glow on the hero logo and pulse rings |
| `--color-link-hover` | `#0A7A5F` | link hover |
| `--color-selection` | `#E4BDCF` | text selection |
| `--color-text-muted-on-ink` | `#CCCCCC` | bottom bar copyright |

  Alpha variants (`#04544266`, `#FFFFFF33`, `rgba(...)` overlays) become `color-mix()` on those tokens, so no other hex appears anywhere.
- **Variants** (`formState`, `discountLabel`, `subscriberCount`, `proofThreshold`) are exactly as you described. The prototype's `foundingCount` prop is unused in the markup and is dropped.
- **Assets:** `uploads/snugglegum-doypack-trimmed.png` (746×964, the hero pouch), the wordmark logo and the 18+ "Gummies for grownups only" stamp (both are already inlined as paths in the HTML). The two SVG files carry embedded C2PA metadata blobs which I strip. `524445` is a byte-identical copy of `image-slot.js`. The screenshot is the supplement panel reference.
- **Three "How it works" images do not exist** yet (`image-slot` placeholders in the prototype).
- **Favicons** are in `public/favicon/`, but `site.webmanifest` has empty `name` and `short_name`, points its icons at `/android-chrome-*.png` (wrong path), and has white theme and background colors. I will fix all three by generating the manifest from `colors.css` and the site config.

## 2. Decisions I need from you

Answer with the numbers, or just say "go with your defaults". Items 1 to 3 change what gets built.

### 2.1 Design copy vs. your content guardrails (blocking)

You asked for the design's copy verbatim **and** no health, body-odor, "body taste" or ingredient-benefit claims. The design contains copy that breaks the second rule. I will not rewrite it myself, since that would be inventing copy. Please choose per row.

| # | Location (design) | Text | Conflict |
|---|---|---|---|
| a | Hero and final CTA, success message | "Free with sign-up: the "Body Taste Cheat Code" guide." / "your "Body Taste Cheat Code" guide is on its way" | "body taste" claim |
| b | How it works, intro | "Body taste isn't hygiene. It's biochemistry — and it's fixable." | body claim and implied fix |
| c | How it works, step 1 | "It starts with digestion … compounds through sweat, saliva … shaping how you come across up close" | body-odor claim |
| d | How it works, step 2 | "Zinc, maca and L-arginine support a more balanced system, so there's simply less to mask." | ingredient benefit claim |
| e | What's inside, Zinc | "Zinc contributes to normal immune function.*" | health claim (an authorized EU claim, but you excluded these) |
| f | Marquee | "3 Snugglegum a day, helps you taste okay" / "Because you are the aftertaste" | body-taste claim |
| g | Final CTA heading | "Can't wait to be tasted better?" | body-taste implication |
| h | Hero pouch **artwork** | "BODY FRESH" printed on the pouch image | body claim in an image I cannot edit |
| i | Bottom of "What's inside" | "We can't promise perfect skin." | mentions a body outcome, though as a disclaimer |

- **Option A (my recommendation):** you send replacement copy for a to g and i, I paste it in. Until then I build those blocks as designed, mark each with a `data-copy-review` attribute, and list them in the final open-items list. Nothing goes live because the production build will fail on the placeholder check until you resolve them. For h you send new pouch artwork.
- **Option B:** ship all copy as designed and accept the risk.
- **Option C:** I remove rows a to g and i (sections shrink, layout changes, "Keep the design as is" is bent).

### 2.2 Other design items that need a call

| # | Item | Default if you say "go" |
|---|---|---|
| 1 | Design shows five legal routes (imprint, privacy, cookies, terms, disclaimer). You asked for two. | Build `/imprint` and `/privacy` only. Footer shows Imprint, Privacy, Cookie settings. Cookie details go into the privacy page. The FDA-style disclaimer stays in the footer as designed. Terms and disclaimer pages are dropped. |
| 2 | `discountLabel` empty hides card 01, but the section says "Three things …" and the FAQ answer starts with the discount. | Hide card 01, renumber the others 01 and 02, and the heading reads "Two things for joining before launch". The FAQ sentence drops the discount part. Both driven by config. |
| 3 | Cookie modal shows Analytics and Marketing toggles, but you plan neither, and you said optional categories only if used. | Categories come from `src/config/consent.ts`. With none enabled, the "Customize" panel shows Necessary only, plus one factual line ("We don't currently use any optional cookies or trackers."). Accept all and Reject all still exist and behave the same. |
| 4 | Two different contact emails in the design: `gummyshot@snugglegum.com` (footer) and `gumshot@snugglegum.com` (legal page). You said not to invent an email. | Footer keeps the design's `gummyshot@snugglegum.com`. Legal pages use `[[TODO: contact email]]`. Tell me which one is real. |
| 5 | Supplement Facts panel: says 93 servings, one gummy a day, but the FAQ says "1 to 3 a day". It lists about 25 vitamins and minerals while "What's inside" says "five ingredients" and names none of them. It also has "Iodine 4.5 mg" (likely mcg), "Selenium … 25" without %, and literal `\u2020` escape sequences in the source that would print as text instead of a dagger. | Build the modal from the design, turn the `\u2020` sequences into real † characters, mark the numbers `data-copy-review`, and list them as open items. Needs your regulatory check. |
| 6 | Offer terms line says "Percentages and dates are placeholders until you confirm them." (a design note that leaked into copy). "[date TBD]" in the launch FAQ. | Drop both sentences from the page, list them as open items. |
| 7 | Success card has a "Tell a friend who has good taste" button, but the prototype wires it to nothing. | Web Share API with a copy-link fallback. No network request. |
| 8 | Hero pouch is 746 px wide but displays up to 520 px, so it is soft on high-density screens. | Ship as is (AVIF/WebP). Send a 1500 px+ transparent PNG if you want it sharper. |
| 9 | Production domain. | Placeholder `https://snugglegum.example` in canonical, sitemap and OG until you give me the domain. |
| 10 | Hosting target. `_headers` works on Netlify and Cloudflare Pages, not on Vercel or plain Apache/nginx. | Write `public/_headers` (Netlify/Cloudflare format) and document the CSP for other hosts. |

## 3. Accessibility report so far (numbers, no silent color changes)

Computed from the design's actual values, WCAG contrast formula:

| Pairing | Where | Ratio | Verdict | Proposed fix |
|---|---|---|---|---|
| Green on white | body text | 8.93 | AAA | none |
| Green on pink | hero and footer text | 6.35 | AA | none |
| Pink on green | reverse text, marquee | 6.35 | AA | none |
| White on green | final CTA text | 8.93 | AA | none |
| Ink on lime | button hover, alerts | 13.45 | AAA | none |
| **White logo on pink** | hero wordmark | **1.41** | Fails, but logotypes are exempt from 1.4.3 and 1.4.11 | none needed. Reported for your awareness, since it is the brand look and it relies on the glow. |
| **Green at 80% opacity on pink** | hero fine print, footer disclaimer, "What's inside" notes | **4.30** | Fails 4.5 | Raise opacity to 85% (4.76) or use full green |
| **Placeholder green 40% on white** | email input | **2.07** | Fails 4.5 | Use 75% (4.65) |
| **Green 70% on white** | cookie modal "· always on" | **4.13** | Fails 4.5 | Use 80% (5.32) |
| **Lime focus ring on white** | hero email input `outline: 3px solid lime` | **1.44** | Fails 3:1 for focus indicators | Use green ring on light surfaces (8.93). Keep lime rings on the green CTA band (6.22). |

I will apply the opacity and focus-ring fixes **only** to those specific text and focus cases, not to the brand colors, and list them under "deviations" in the README. If you would rather keep the design values, say so and I leave them.

## 4. Verified facts (Phase 0 research)

- **MailerLite endpoint:** `POST https://assets.mailerlite.com/jsonp/2650700/forms/199242337324369472/subscribe` with `multipart/form-data` or urlencoded fields `fields[email]`, `ml-submit=1`, `anticsrf=true`.
  - I checked the CORS preflight: `access-control-allow-origin: *`, `allow-methods: POST`, no custom headers needed, so a plain `fetch` from a static site works.
  - I sent one POST with an invalid address (no subscriber created). Response: HTTP 200 JSON `{"success":false,"errors":{"fields":{"email":["The email field must be a valid email address."]}}}`. Success shape (from MailerLite's own script): `{"success":true}`.
  - Rate limit header: `x-ratelimit-limit: 10`. I will map an HTTP 429 or an exceeded limit to the rate-limit message.
  - The share page shows the form has **only an email field**, no consent field. Consent is recorded on our side (checkbox required before submit) and double opt-in is set in MailerLite. I cannot check the double opt-in setting from outside, so it is an open item for you to confirm in the MailerLite dashboard.
  - `dashboard.mailerlite.com/jsonp/…` redirects (301) to the `assets.` host. I use the `assets.` host directly.
  - MailerLite's official script uses JSONP script injection and jQuery, which would need `script-src` for MailerLite. My approach needs only `connect-src https://assets.mailerlite.com`. No third-party script loads at all.
- **Fonts:** the design uses **Archivo** variable, weight 400 to 900 and width 100 to 125. License is **SIL OFL 1.1**, so self-hosting is allowed. Source: `@fontsource-variable/archivo` (`archivo-latin-wdth-normal.woff2`, 88 KB). I copy the file into the repo, subset it further if it helps, and drop the npm package. Arrows and the close icon become inline SVG so no glyph outside the Latin subset is needed.
- **Versions on npm today:** Astro 7.3.3, Tailwind 4.3.3, `@tailwindcss/vite` 4.3.3, `@astrojs/sitemap` 3.7.4, Playwright 1.63.0, `@axe-core/playwright` 4.13.0. Node 26.8.1.

## 5. Architecture

```
src/
  config/
    site.ts          typed SiteConfig: formState, discountLabel, subscriberCount, proofThreshold, URLs, env
    consent.ts       consent categories (none optional today), storage key, version
  styles/
    colors.css       the ONLY place with hex values
    global.css       imports colors.css, @font-face, @theme mapping, base styles
  assets/            hero pouch, fonts (woff2)
  layouts/           Base.astro (head, meta, JSON-LD, skip link), Legal.astro
  components/
    ui/              Button, TicketLabel, StampBadge, Sticker, ImagePlaceholder …
    logo/            Logo.astro (inline SVG, role="img", aria-label "Snugglegum™")
    legal/           OperatorInfo.astro (the one operator block, with `block` and `name` variants)
    consent/         CookieModal.astro + consent script + consent gate helper
    forms/           NewsletterForm.astro + subscribe script
    sections/        Hero, Offer, HowItWorks, WhatsInside, Audience, Marquee, Faq, FinalCta, Footer, BottomBar, SupplementFacts
  pages/
    index.astro, imprint.astro, privacy.astro, robots.txt.ts, llms.txt.ts, site.webmanifest.ts
public/              favicon/, _headers, og image
scripts/             check-placeholders.mjs, check-colors (also as test)
tests/               Playwright specs
docs/                seo-keywords.md, plan.md, faq-proposal.md, legal-review.md
```

### How the key requirements are met

- **Copy stays editable:** every visible string is HTML text inside `.astro` files. Only behavior values (thresholds, form state, IDs) live in `site.ts`.
- **Semantics:** one H1, no `header` element because the design has no top nav; `main`, `section`s with headings, `footer`, `nav aria-label="Legal"`, lists as `ul`, FAQ as native `<details>`, skip link to `main`.
- **No inline `style=""`:** the prototype uses inline styles everywhere. I convert them to Tailwind utilities and small CSS classes. That keeps the CSP at `style-src 'self'` with no `unsafe-inline`.
- **Dialogs (cookies and Supplement Facts):** native `<dialog>` opened with `showModal()`, plus explicit `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. Native modal gives the focus trap and ESC. A small script returns focus to the trigger and backs up the trap where a browser differs. Verified by tests in all three engines.
- **Consent:** `localStorage` key holds `{ version, timestamp, categories }`. No cookie is ever set. Scripts that need consent are added as `<script type="text/plain" data-consent="analytics" src="…">` and the gate activates them after consent. README documents the three steps. Note for `docs/legal-review.md`: with no optional tools, a banner is arguably not legally required today, but you asked for the mechanism and it is ready for later.
- **Newsletter form:** client script only runs on submit. Client checks first (email format, consent, honeypot), then `fetch` POST. States: idle, submitting, success, error, plus field error, rate limit, network error, "already subscribed" (if MailerLite reports it). Status text goes into an `aria-live` region. Nothing is sent before submit.
- **Strict CSP** (`public/_headers`): `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://assets.mailerlite.com; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`, plus Referrer-Policy, Permissions-Policy, X-Content-Type-Options. Astro may inline small scripts, so I will use the build option or hash generation that keeps `script-src 'self'` working, and verify with a test that loads the built site under the CSP and fails on any violation.
- **Env:** `.env` created and git-ignored before the first commit, verified with `git check-ignore`. `.env.example` committed.
- **OG image:** generated from the hero composition (pink background, logo, pouch) with a Playwright script, output committed to `public/`. Note it will show the pouch, so item h in 2.1 affects it.

## 6. Commit sequence (each commit passes type check, build and all tests)

The folder is not a git repository yet. I `git init`, write `.gitignore` with `.env`, verify with `git check-ignore`, then commit the untouched handoff first, so deleting the design files later is recoverable.

1. `chore: import Claude Design handoff (untouched)`
2. `chore: scaffold Astro, Tailwind v4, strict TypeScript, env files`
3. `feat: colors.css tokens, self-hosted Archivo, base layout, logo`
4. `feat: hero, offer, how it works, what's inside, audience, marquee, FAQ, final CTA, footer`
5. `feat: site config variants (form states, discount label, social proof threshold)`
6. `feat: newsletter form and MailerLite integration`
7. `feat: consent mechanism and cookie modal, Supplement Facts dialog`
8. `feat: /imprint, /privacy, OperatorInfo, check:placeholders`
9. `feat: SEO, JSON-LD, sitemap, robots, llms.txt, manifest, OG image, security headers`
10. `test: Playwright suite (cookies, modal, form, SEO, a11y, fonts and network, guardrails, hex check)`
11. `docs: README, legal-review`
12. `chore: remove Claude Design handoff files no longer needed`

Files I plan to delete in step 12, once everything they contain is in `src/`: `Snugglegum Landing.dc.html`, `support.js`, `image-slot.js`, `524445` (duplicate), `snugglegum-design-system.md`, and `uploads/` (after moving the pouch, logo and stamp into `src/assets` or components). Favicons stay in `public/favicon/`.

### Scripts

`dev`, `build`, `preview`, `test`, `test:ui`, `check:placeholders`. `build` runs type check, `astro build`, then `check:placeholders`, so **it fails on purpose while `[[TODO …]]` markers remain**. The tests and my pre-commit runs use `build:draft` (same without the placeholder gate). I will document both.

## 7. Test matrix

Playwright projects: Chromium, Firefox, WebKit, each at a desktop and a mobile viewport (6 projects), running against `astro preview` of the static build. Specs as in your list: cookies, cookie modal, newsletter form (endpoint mocked), SEO, accessibility (axe WCAG 2.2 AA on every route and with the dialogs open, keyboard navigation, reduced motion), fonts and network, guardrails. Additions I recommend:
- **Hex check** (fails on any hex color outside `colors.css`, also in built CSS and inline SVG).
- **™ check** (every "Snugglegum" in visible text, meta and JSON-LD is followed by ™, excluding URLs and email addresses).
- **CSP check** (built site loads with the CSP applied and produces zero violations).
- Guardrail scan also covers `llms.txt` and the generated files, not only HTML.

## 8. Risks

- Playwright browser downloads are about 1 GB (all three engines).
- WebKit and Firefox differ on `<dialog>` focus details, so those tests will catch differences early.
- The hero uses several looping animations (float, bob, pulse, blink, marquee). All are disabled under `prefers-reduced-motion`. I keep animation to `transform` and `opacity`, but the pulse animates `box-shadow`. I will check that it is not a performance problem, and switch to a pseudo-element with `transform` and `opacity` if it is.
- The design opens the cookie modal on first load, which I keep. It is a cookie notice, so it is exempt from Google's intrusive-interstitial rule, but it does sit over the LCP element on first visit.

## 9. Not going to do (so you can object)

- No Google Fonts or any CDN, no analytics or marketing scripts, no `Product` or `Review` schema, no FAQ schema before approval, no `sameAs` links, no invented operator data.
- The prototype's "Founding number" is copy only: assigning numbers needs a MailerLite automation that I cannot configure from the frontend. I list it as an open item.
