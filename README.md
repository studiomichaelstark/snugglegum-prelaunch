# Snugglegum™ pre-launch landing page

A fully static, one-page landing site (plus `/imprint` and `/privacy`) for Snugglegum™, built from the Claude Design handoff. US-English, adults 18+ only.

## Stack

- [Astro](https://astro.build) 7, fully static output, TypeScript strict mode
- Tailwind CSS v4 through the official Vite plugin
- Plain TypeScript in Astro `<script>` tags. No UI framework. Interactivity only in the cookie/supplement dialogs and the newsletter form
- Playwright and `@axe-core/playwright` for tests
- Self-hosted Archivo font. No Google Fonts, no CDN


Node 22 or newer.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type check, build, then `check:placeholders`. **Fails on purpose while any `[[TODO]]` or copy-review flag remains.** This is the production build. |
| `npm run build:draft` | Type check and build, without the placeholder gate. Use it for previews and CI test runs. |
| `npm run preview` | Serve the built `dist/` |
| `npm test` | Playwright suite (Chromium, Firefox, WebKit, desktop and mobile) |
| `npm run test:ui` | Playwright UI mode |
| `npm run check:placeholders` | Lists every `[[TODO: …]]` marker and every `data-copy-review` flag, exits 1 if any remain |
| `npm run check:colors` | Fails on any color literal outside `src/styles/colors.css` |
| `npm run check` | `astro check` only |
| `npm run og` | Regenerates `public/og-image.png` (needs a fresh build only if the design changes) |

## Folder structure

```
src/
  config/        site.ts (design knobs, MailerLite endpoint), variants.ts (pure helpers), consent.ts
  styles/        colors.css (the only place with color values), global.css (Tailwind, font, keyframes)
  assets/        pouch image, self-hosted font (with its OFL license)
  layouts/       Base.astro (head, SEO, skip link, cookie modal), Legal.astro
  components/
    logo/        Logo.astro, StampBadge.astro (inline SVG)
    ui/          ButtonLink, OfferCard, ImagePlaceholder, icons
    forms/       NewsletterForm.astro, NewsletterSuccess.astro
    consent/     CookieModal.astro
    legal/       OperatorInfo.astro, LegalSection.astro
    sections/    Hero, Offer, HowItWorks, WhatsInside, Audience, Marquee, Faq, FinalCta, Footer, SupplementFacts
  scripts/       newsletter.ts, consent.ts, dialogs.ts
  pages/         index, imprint, privacy, robots.txt.ts, llms.txt.ts, favicon/site.webmanifest.ts
public/          favicon/, _headers, og-image.png
scripts/         check-placeholders.mjs, check-colors.mjs, make-og.mjs
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

Copy or numbers that need approval carry a `data-copy-review="…"` attribute. `npm run check:placeholders` lists them and blocks the production build. Delete the attribute once the text is approved.

## Colors (`src/styles/colors.css`)

All color values live in this one file as CSS custom properties with semantic names (`--color-brand-green`, `--color-brand-pink`, `--color-brand-lime`, `--color-brand-ink`, `--color-surface`, `--color-glow`, …). `src/styles/global.css` maps them into Tailwind with `@theme`, so utilities such as `bg-green`, `text-pink`, `bg-lime/50` use the variables. The default Tailwind palette is switched off, so a stray `bg-red-500` will not compile. Alpha versions use `color-mix()` or Tailwind's `/50` syntax.

To change a color, edit `colors.css` only. `npm run check:colors` and a Playwright test fail on hex, `rgb()`, `hsl()` or `oklch()` literals anywhere else in `src/` or `public/`. The meta `theme-color` and the web manifest read their values from `colors.css` at build time.

## Fonts

The design uses **Archivo** (variable, weight 400 to 900, width 100 to 125). Its license is the SIL Open Font License 1.1, which allows self-hosting (`src/assets/fonts/Archivo-OFL.txt`). The woff2 is a Latin subset of about 52 KB, declared with `font-display: swap` in `global.css`, and the single file is preloaded in `Base.astro`. A metric-matched fallback keeps layout shift low.

To add or replace a font: put the woff2 in `src/assets/fonts/`, add an `@font-face` in `global.css`, add the family to `--font-sans` in the `@theme` block, and preload only the critical file in `Base.astro`. Check its license allows self-hosting. A test fails on any request to an external origin.

## Environment variables and MailerLite

```
PUBLIC_MAILERLITE_ACCOUNT_ID=2650700
PUBLIC_MAILERLITE_FORM_ID=199242337324369472
PUBLIC_SITE_URL=              # production origin, e.g. https://www.example.com (empty = placeholder)
```

> **`PUBLIC_` variables are exposed in the client bundle.** The MailerLite account and form IDs are not secret (they appear in every MailerLite embed). **Never put an API key or any other secret in a `PUBLIC_` variable or anywhere in the frontend.** `.env` is git-ignored. `.env.example` is committed.

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

Anything still missing is written as `[[TODO: …]]`. `npm run check:placeholders` lists them and fails the production build until they are gone.

## Tests

```bash
npx playwright install chromium firefox webkit   # once
npm test
```

Projects: Chromium, Firefox and WebKit, each at a desktop and a mobile viewport, plus a browser-less `unit` project. The web server builds the site and serves it with `astro preview`.

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

**Firefox on this machine:** Playwright's Firefox build (155) fails to start on macOS 27 ("Could not find profile folder"), even when launched by hand. Run `SKIP_FIREFOX=1 npm test` to skip it locally. Run the full matrix in CI or on another machine.

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

- Build with `npm run build` (needs `PUBLIC_SITE_URL` and all `[[TODO]]` markers resolved). The output is the `dist/` folder.
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
| PDF icon follows text color | The design's icon was green on the green final section (invisible) |
| Offer terms line and "[date TBD]" dropped | Design notes that leaked into the copy |
| Pulse ring uses a transformed pseudo-element | Animates `transform` and `opacity` only |
| Three "How it works" images are empty dashed frames | No images exist yet. Pass `src` and `alt` to `ImagePlaceholder` to fill one |

## Open items

See the list at the end of the hand-over message and the output of `npm run check:placeholders`. In short:

- Approve or replace the flagged copy (`data-copy-review`), and the pouch artwork text.
- Fill every `[[TODO: …]]` in `/imprint` and `/privacy`, then have a lawyer review them (`docs/legal-review.md`).
- Set `PUBLIC_SITE_URL`, choose hosting, confirm MailerLite double opt-in.
- Decide the discount label, launch date, social-proof threshold, FAQ schema, and whether to add a pause control for the moving marquee.
