# Snugglegum™ pre-launch landing page

A fully static, one-page landing site (plus `/imprint` and `/privacy`) for Snugglegum™, built from the Claude Design handoff. US-English, adults 18+ only.

## Stack

- [Astro](https://astro.build) 7, fully static output, TypeScript strict mode
- Tailwind CSS v4 through the official Vite plugin
- Plain TypeScript in Astro `<script>` tags. No UI framework. Interactivity only in the cookie/supplement dialogs and the newsletter form
- Playwright and `@axe-core/playwright` for tests
- Self-hosted Archivo font. No Google Fonts, no CDN


Node 22.18 or newer and [pnpm](https://pnpm.io). This project uses pnpm only.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Type check, build, then `check:placeholders`. **Fails on purpose while any `.env` value is missing or any copy-review flag remains.** This is the production build. |
| `pnpm build:draft` | Type check and build, without the placeholder gate. Use it for previews and CI test runs. |
| `pnpm preview` | Serve the built `dist/` |
| `pnpm test` | Playwright suite (Chromium, Firefox, WebKit, desktop and mobile) |
| `pnpm test:ui` | Playwright UI mode |
| `pnpm check:placeholders` | Lists every `.env` variable (set, missing or n/a) with a hint for each missing one, hard-coded `[[TODO]]` markers and `data-copy-review` flags, **and checks the built HTML in `dist/`** (see below). Exits 1 if anything is left |
| `pnpm check:colors` | Fails on any color literal outside `src/styles/colors.css` |
| `pnpm check` | `astro check` only |
| `pnpm og` | Regenerates `public/og-image.png` (needs a fresh build only if the design changes) |

## Folder structure

```
src/
  config/        site.ts (design knobs, MailerLite endpoint), variants.ts (pure helpers), consent.ts,
                 placeholders.ts (the list of every value you fill in .env), legal.ts (reads them)
  styles/        colors.css (the only place with color values), global.css (Tailwind, font, keyframes)
  assets/        pouch image, self-hosted font (with its OFL license)
  layouts/       Base.astro (head, SEO, skip link, cookie modal), Legal.astro
  components/
    logo/        Logo.astro, StampBadge.astro (inline SVG)
    ui/          ButtonLink, OfferCard, ImagePlaceholder, icons
    forms/       NewsletterForm.astro, NewsletterSuccess.astro
    consent/     CookieModal.astro
    legal/       OperatorInfo.astro, LegalSection.astro, ContactEmail.astro
    sections/    Hero, Offer, HowItWorks, WhatsInside, Audience, Marquee, Faq, FinalCta, Footer, SupplementFacts
  scripts/       newsletter.ts, consent.ts, dialogs.ts
  pages/         index, imprint, privacy, robots.txt.ts, llms.txt.ts, favicon/site.webmanifest.ts
public/          favicon/, _headers, og-image.png
scripts/         check-placeholders.mjs (+ lib/), check-colors.mjs, make-og.mjs
tests/           Playwright specs (unit/ needs no browser)
docs/            seo-keywords.md, plan.md, faq-proposal.md, legal-review.md
```

## Editing copy

Every visible word is plain HTML text inside the `.astro` files, so edit it right in the markup:

- Hero, offer, how it works, what's inside, audience, marquee, FAQ, final call to action, footer: `src/components/sections/`
- Newsletter messages (errors, success, consent line): `src/components/forms/`
- Cookie modal text: `src/components/consent/CookieModal.astro`
- Legal texts: `src/pages/imprint.astro` and `src/pages/privacy.astro`
- Page titles and meta descriptions: the props on `<Base …>` in each page

Only behavior values (thresholds, form preview state, IDs) live in `src/config/`.

**Always write the brand name as `Snugglegum™`.** A test fails if any built page, `llms.txt` or manifest has "Snugglegum" without ™. Never use the two banned words (see `docs/`); a test fails on them too.

### Design knobs (`src/config/site.ts`)

| Key | Effect |
|---|---|
| `formState` | `'live'` = the real working form. `'idle'`, `'submitting'`, `'success'`, `'error'` pre-render that state for design review. |
| `discountLabel` | e.g. `'15%'`. **Empty hides the discount card, renumbers the others, changes "Three things" to "Two things" and drops the discount from the FAQ.** |
| `subscriberCount`, `proofThreshold` | The "N people are already on the list" line renders only when `subscriberCount >= proofThreshold` (default: hidden). |

### Review flags

Copy or numbers that need approval carry a `data-copy-review="…"` attribute in the markup. `pnpm check:placeholders` lists them and blocks the production build. Delete the attribute once the text is approved. (These are decisions about wording, so they stay in the code. Values like emails and dates live in `.env`.)

## Colors (`src/styles/colors.css`)

All color values live in this one file as CSS custom properties with semantic names (`--color-brand-green`, `--color-brand-pink`, `--color-brand-lime`, `--color-brand-ink`, `--color-surface`, `--color-glow`, …). `src/styles/global.css` maps them into Tailwind with `@theme`, so utilities such as `bg-green`, `text-pink`, `bg-lime/50` use the variables. The default Tailwind palette is switched off, so a stray `bg-red-500` will not compile. Alpha versions use `color-mix()` or Tailwind's `/50` syntax.

To change a color, edit `colors.css` only. `pnpm check:colors` and a Playwright test fail on hex, `rgb()`, `hsl()` or `oklch()` literals anywhere else in `src/` or `public/`. The meta `theme-color` and the web manifest read their values from `colors.css` at build time.

## Fonts

The design uses **Archivo** (variable, weight 400 to 900, width 100 to 125). Its license is the SIL Open Font License 1.1, which allows self-hosting (`src/assets/fonts/Archivo-OFL.txt`). The woff2 is a Latin subset of about 52 KB, declared with `font-display: swap` in `global.css`, and the single file is preloaded in `Base.astro`. A metric-matched fallback keeps layout shift low.

To add or replace a font: put the woff2 in `src/assets/fonts/`, add an `@font-face` in `global.css`, add the family to `--font-sans` in the `@theme` block, and preload only the critical file in `Base.astro`. Check its license allows self-hosting. A test fails on any request to an external origin.

## Placeholders and environment variables

**Everything the site still needs from you is filled in one file: `.env`.** It already lists every variable with a comment. Open it, fill in the values, and run:

```bash
pnpm check:placeholders     # what is still missing, with a hint for each item
```

`.env` is git-ignored. `.env.example` (committed) has the same keys, empty. On a host, set the same variables in its dashboard instead. Values with spaces need double quotes, for example `PUBLIC_LEGAL_LOG_RETENTION="7 days"`.

| Rule | Meaning |
|---|---|
| Empty | The page shows a visible `[[TODO: …]]` marker, and `pnpm build` fails |
| `n/a` | For items marked optional: the line or section is left out of the page |
| `PUBLIC_LEGAL_REVIEWED=true` | Set after a lawyer has reviewed both legal pages. Removes the "Legal · draft" marker and notice |

| Group | Variables |
|---|---|
| Site and MailerLite | `PUBLIC_SITE_URL`, `PUBLIC_MAILERLITE_ACCOUNT_ID`, `PUBLIC_MAILERLITE_FORM_ID` |
| Contact | `PUBLIC_CONTACT_EMAIL` (footer, imprint, privacy), `PUBLIC_PRIVACY_EMAIL` (empty = reuse the contact email) |
| Imprint | `PUBLIC_LEGAL_PHONE`, `PUBLIC_LEGAL_COMMERCIAL_REGISTER`, `PUBLIC_LEGAL_VAT_ID`, `PUBLIC_LEGAL_DISPUTE_RESOLUTION` (last four optional) |
| Privacy policy | `PUBLIC_LEGAL_HOSTING_PROVIDER`, `PUBLIC_LEGAL_LOG_RETENTION`, `PUBLIC_LEGAL_MAILERLITE_ENTITY`, `PUBLIC_LEGAL_MAILERLITE_TRACKING` (optional), `PUBLIC_LEGAL_TRANSFER_MECHANISM`, `PUBLIC_LEGAL_SUPERVISORY_AUTHORITY`, `PUBLIC_LEGAL_US_STATE_PRIVACY` (optional) |
| Review | `PUBLIC_LEGAL_LAST_UPDATED`, `PUBLIC_LEGAL_REVIEWED` |
| Offer (optional, not blocking) | `PUBLIC_DISCOUNT_LABEL`, `PUBLIC_SUBSCRIBER_COUNT`, `PUBLIC_PROOF_THRESHOLD` |

The single source for these names, hints and rules is `src/config/placeholders.ts`. The pages read it through `src/config/legal.ts`, and `pnpm check:placeholders` reads the same list, so they cannot drift. To add a new value: add an entry to that file, use `legal.yourId.display` in a page, and run the script once to regenerate your `.env` comments by hand.

> **`PUBLIC_` variables are exposed in the client bundle.** The MailerLite account and form IDs are not secret (they appear in every MailerLite embed), and every legal value above is printed on a public page anyway. **Never put an API key or any other secret in a `PUBLIC_` variable or anywhere in the frontend.**

### Public and server-only variables

Astro embeds only variables that start with `PUBLIC_` into client code, and everything this project prints on a page is read on the server at build time. So:

- **Every variable in `.env` starts with `PUBLIC_`.** Each of them ends up as text on a public page (or in a public URL), so there is nothing secret in them.
- **Brand name, claims, copy and meta tags are not in `.env`.** They stay as plain text in the `.astro` files (see "Editing copy").
- **There are no server-only variables.** The site is static, has no API and needs no key. The MailerLite API key is deliberately not used anywhere. If you ever add a secret, give it a name **without** `PUBLIC_`. It is then not embedded into client code, and `pnpm check:placeholders` fails the build if its value shows up anywhere in `dist/`.

### What `pnpm check:placeholders` verifies after the build

A missing value must never make text quietly vanish. Besides listing what is empty, the check reads the **built pages** and fails if:

| Problem | Example |
|---|---|
| A value that is set is not in the page it belongs to | `PUBLIC_CONTACT_EMAIL` is set but the footer no longer prints it |
| A value that is empty shows neither the value nor its `[[TODO: …]]` marker | An empty gap instead of a marker |
| An optional line switched off with `n/a` leaves its label behind | "VAT ID:" with nothing after it |
| The text contains `undefined`, `null`, `NaN` or `[object Object]` | `Contact: undefined` |
| An attribute is empty or `undefined` | `href="mailto:"`, an empty `src`, `<meta content="">`, an empty `<title>`, an empty newsletter endpoint |
| Punctuation dangles after an empty value | "hosted by ." or "Retention: ." |
| The draft notice does not match `PUBLIC_LEGAL_REVIEWED` | "Legal · draft" still visible after review |
| The discount heading or social-proof line does not match its variables | "Three things" without a discount |
| A value of a variable **without** `PUBLIC_` appears anywhere in `dist/` | A secret leaked into the output |

It also warns about `PUBLIC_` variables in `.env` that nothing reads (a typo such as `PUBLIC_CONTACT_EMAL`). `pnpm build` runs it with `--require-build`, so a missing or outdated `dist/` fails the build. Run alone, it says when `dist/` is older than `.env` or `src/` (run `pnpm build:draft` first).

`PUBLIC_SITE_URL` drives the canonical URL, the sitemap, `robots.txt`, `llms.txt`, Open Graph and JSON-LD. Until it is set they use `https://snugglegum.example`.

### How the form talks to MailerLite

- The form is a custom, accessible HTML form. It does not load any MailerLite script.
- On submit it sends a plain `fetch` `POST` (multipart) to `https://assets.mailerlite.com/jsonp/<account>/forms/<form>/subscribe` with `fields[email]`, `ml-submit=1` and `anticsrf=true`. That endpoint answers with JSON and allows cross-origin requests (`access-control-allow-origin: *`).
- Nothing is sent before the visitor submits. The consent checkbox is required and not pre-ticked. A hidden honeypot field catches bots.
- Handled states: success, invalid email, missing consent, "already subscribed", rate limit (HTTP 429), MailerLite error, network failure and timeout. Messages go to `aria-live` regions.
- Without JavaScript the form still posts natively to MailerLite.
- **Double opt-in and the confirmation email are configured in the MailerLite dashboard**, not in this code. Confirm that double opt-in is on for this form.

## Consent mechanism

- The cookie modal (`CookieModal.astro`) opens on the first visit and from the "Cookie settings" button in the footer and on the legal pages. "Accept all" and "Reject all" are equally prominent. "Customize" expands the categories.
- The choice is stored in `localStorage` (never a cookie) under `sg-cookie-consent` as `{ version, timestamp, categories }`. Bump `CONSENT_VERSION` in `src/config/consent.ts` to ask everyone again.
- The site sets **no cookies** and loads **no third-party resource** until the visitor submits the form.
- Categories are defined in `src/config/consent.ts`. Both optional categories are disabled today, so the modal shows only "Necessary" and a short statement.

### Adding an analytics or marketing script later

1. In `src/config/consent.ts`, set the category to `enabled: true`. Its toggle then appears in the modal.
2. Add the script to `src/layouts/Base.astro` as an **inert** tag that only runs after consent:
   ```html
   <script type="text/plain" data-consent="analytics" src="https://example.com/tool.js" defer></script>
   ```
   The consent script turns it into a real `<script>` only if the visitor accepted that category, including on later visits.
3. Allow the tool's origin in `script-src` and `connect-src` in `public/_headers`.
4. Describe the tool in `src/pages/privacy.astro` and bump `CONSENT_VERSION`.

Listen for changes with `document.addEventListener('sg:consent', (e) => …)`.

## Operator and controller data

`src/components/legal/OperatorInfo.astro` is the **single place** for the operator's name and address. It feeds the imprint, the privacy policy and the footer's trademark and copyright lines. To change it (for example a US LLC later), edit the `operator` object in that file and nothing else.

Contact and legal details that are not the operator's name and address (email, phone, VAT ID, hosting, supervisory authority, …) come from `.env`, see "Placeholders and environment variables".

## Tests

```bash
pnpm exec playwright install chromium firefox webkit   # once
pnpm test
```

Projects: Chromium, Firefox and WebKit, each at a desktop and a mobile viewport, plus a browser-less `unit` project. The web server builds the site and serves it with `astro preview`. The build pins every placeholder variable to empty, so the tests do not depend on what is in your `.env`.

| Spec | Covers |
|---|---|
| `cookies` | No cookies and no external requests before a choice, after "Reject all" (also after reload), after "Accept all", old consent versions |
| `cookie-modal` | Opens from the footer, focus trap, ESC, focus return, keyboard use, persistence, Supplement Facts dialog |
| `newsletter` | Nothing sent before submit, validation, consent required, honeypot, success and every error state (endpoint mocked) |
| `seo` | One `h1`, unique title and description, canonical, Open Graph, Twitter, JSON-LD, alt text, sitemap, robots, `llms.txt`, manifest |
| `a11y` | axe at WCAG 2.2 AA on every route and with each dialog open, keyboard navigation, focus outlines, reduced motion, touch targets |
| `fonts-network` | Only local fonts, no external origins, MailerLite contacted only after submit |
| `csp` | Every page runs under the real CSP from `public/_headers` without a violation |
| `unit/guardrails` | No banned words in built output, sources or docs; ™ on every brand mention; 18+ notice; offer variants |
| `unit/colors`, `unit/variants` | Color rule, design knobs |
| `unit/placeholders` | `.env` resolution (empty, value, `n/a`, fallback, review flag) and the `check:placeholders` report |
| `unit/rendered-check` | The post-build HTML check: every failure above on a synthetic `dist/`, plus the real build |

**Firefox on this machine:** Playwright's Firefox build (155) fails to start on macOS 27 ("Could not find profile folder"), even when launched by hand. Run `SKIP_FIREFOX=1 pnpm test` to skip it locally. Run the full matrix in CI or on another machine.

## SEO and GEO notes

- Unique title and description per page, canonical, Open Graph and Twitter tags, `theme-color`, favicon set and manifest.
- JSON-LD: `Organization` on every page, `WebSite` on the home page, `WebPage` on each. **No `FAQPage`** until you approve `docs/faq-proposal.md`. No `Product`, `Offer` or review markup.
- `/sitemap-index.xml` and `/sitemap-0.xml` come from `@astrojs/sitemap`. `/sitemap.xml` is an alias of the URL list.
- `llms.txt` is a short, factual brand summary. Edit `src/pages/llms.txt.ts`.
- The hero pouch is the LCP element: AVIF/WebP through `astro:assets`, explicit dimensions, `loading="eager"` and `fetchpriority="high"`. Images below the fold load lazily. There are no inline styles or scripts.
- Keyword research, exclusions and the heading map: `docs/seo-keywords.md`.

### `robots.txt`

Generated by `src/pages/robots.txt.ts`. It explicitly allows these crawlers. To block one, add its name to the `blocked` array in that file.

| Type | Crawlers |
|---|---|
| Search | Googlebot, Bingbot, DuckDuckBot, Applebot, YandexBot, Baiduspider |
| AI search and assistants | OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User |
| AI training and data | GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, Meta-ExternalAgent, Amazonbot, cohere-ai |

`robots.txt` is a request, not a lock. Well-behaved crawlers follow it.

## Deployment

- Build with `pnpm build` (needs every variable in `.env` filled in, see below). The output is the `dist/` folder.
- `public/_headers` (CSP, referrer, permissions, HSTS, cache) works on **Netlify** and **Cloudflare Pages**. On another host, set the same headers in its configuration. The CSP allows only this origin plus `https://assets.mailerlite.com` for the form request.
- Clean URLs (`/imprint`, `/privacy`) rely on the host serving `imprint.html` for `/imprint`, which Netlify and Cloudflare Pages do by default.
- Set the three environment variables in the host's dashboard.

## Deviations from the design (and why)

| Change | Reason |
|---|---|
| Fine print at 85% opacity on pink (was 80%), placeholder text at 75% (was 40%), cookie "always on" at 80% (was 70%) | WCAG AA contrast (4.30, 2.07 and 4.13 measured) |
| Focus ring is green on light surfaces (was lime on white) | Lime on white is 1.44:1 |
| Links are underlined; button-style links are not | Tailwind's reset removes underlines. Underline is needed to tell inline links apart (WCAG 1.4.1) |
| `/imprint` and `/privacy` only. Cookies, Terms and Disclaimer pages dropped | Requested scope. Cookie details are in the privacy policy |
| Cookie modal text says no cookies are set and lists only categories that exist | The site sets no cookies and uses no analytics or marketing tools |
| Fine print says "Double opt-in: we email you a confirmation link first." | Clear double opt-in wording was required |
| Added short messages for network error, rate limit and "Link copied" | Required states the design did not include |
| "Two things …" heading and numbering when the discount is empty | Required behavior for an empty `discountLabel` |
| Offer terms line and "[date TBD]" dropped | Design notes that leaked into the copy |
| Pulse ring uses a transformed pseudo-element | Animates `transform` and `opacity` only |
| On phones the sign-up button is a round arrow icon (from the `sm` breakpoint up it is the labelled pill). Field and button share one row | Requested. The accessible name "Get on the list" stays as visually hidden text |
| On phones (below 768 px) the hero pouch is 25% smaller (`min(75%, 390px)`) and sits 20 px lower, the three stickers are 20% smaller, and the round "You know why pineapple" sticker has less padding (8 px). From `md` (768 px) up everything is as designed | Requested for the mobile view, so the giant "GUMMIES" word behind the pouch is readable. Sticker text stays at 12 px |
| The decorative "GUMMIES" word is excluded from the axe scan (`data-decorative-text`) | It is `aria-hidden` pure decoration at 14% opacity, which WCAG 1.4.3 exempts from the contrast minimum |
| Three "How it works" images are empty dashed frames | No images exist yet. Pass `src` and `alt` to `ImagePlaceholder` to fill one |

## Open items

See the list at the end of the hand-over message and the output of `pnpm check:placeholders`. In short:

- Approve or replace the flagged copy (`data-copy-review`), and the pouch artwork text.
- Fill in the missing values in `.env` (`pnpm check:placeholders` lists them), then have a lawyer review the legal pages (`docs/legal-review.md`) and set `PUBLIC_LEGAL_REVIEWED=true`.
- Set `PUBLIC_SITE_URL`, choose hosting, confirm MailerLite double opt-in.
- Decide the discount label, launch date, social-proof threshold, FAQ schema, and whether to add a pause control for the moving marquee.
