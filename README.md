# Snugglegum™ pre-launch landing page

A fully static, one-page landing site (plus `/imprint` and `/privacy`) for Snugglegum™, built from the Claude Design handoff. US-English.

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
  assets/        self-hosted font (with its OFL license); no packaging art yet (see ComingSoonCard)
  layouts/       Base.astro (head, SEO, skip link, cookie modal), Legal.astro
  components/
    logo/        Logo.astro, StampBadge.astro (inline SVG)
    ui/          ButtonLink, ComingSoonCard, Brand, ImagePlaceholder, icons
    home/        Hero, Marquee, HowItWorks (Snack. Burst. Vitamins.), AtAGlance, Lines (three version cards), Join, Faq (+ FaqGroup), Newsletter (signup section), SupplementFacts
    forms/       NewsletterForm.astro, NewsletterSuccess.astro
    consent/     CookieModal.astro
    legal/       OperatorInfo.astro, LegalSection.astro, ContactEmail.astro
    sections/    Footer (legal lines)
  scripts/       newsletter.ts (incl. UTM capture), consent.ts, dialogs.ts
  pages/         index, imprint, privacy, robots.txt.ts, llms.txt.ts, favicon/site.webmanifest.ts
public/          favicon/, _headers, og-image.png
scripts/         check-placeholders.mjs (+ lib/), check-colors.mjs, make-og.mjs
tests/           Playwright specs (unit/ needs no browser)
docs/            seo-keywords.md, plan.md, faq-proposal.md, legal-review.md
```

### Section → component

Every home page section is the component with the same name as its `id`, in the order of the page:

| `id` | Component |
|---|---|
| `#hero` | `components/home/Hero.astro` (+ `HeroParallax.astro` backdrop) |
| `#marquee` | `components/home/Marquee.astro` |
| `#how-it-works` | `components/home/HowItWorks.astro` |
| `#at-a-glance` | `components/home/AtAGlance.astro` |
| `#lines` | `components/home/Lines.astro` |
| `#join` | `components/home/Join.astro` |
| `#faq` | `components/home/Faq.astro` |
| `#newsletter-home` | `components/home/Newsletter.astro` |
| `#supplement-facts-gen-z`, `-millennials`, `-boomer` (dialogs, opened from the cards in `#lines`) | `components/home/SupplementFacts.astro` |
| `#footer` | `components/sections/Footer.astro` |

## Editing copy

Every visible word is plain HTML text inside the `.astro` files, so edit it right in the markup:

- Home sections (hero, how it works, at a glance, product lines, FAQ): `src/components/home/`; the home page and the signup heading: `src/pages/index.astro`
- Footer and the legal lines: `src/components/sections/Footer.astro`
- Newsletter messages (errors, success, consent line): `src/components/forms/`
- Cookie modal text: `src/components/consent/CookieModal.astro`
- Legal texts: `src/pages/imprint.astro` and `src/pages/privacy.astro`
- Page titles and meta descriptions: the props on `<Base …>` in each page

Only behavior values (thresholds, form preview state, IDs) live in `src/config/`.

**Always write the brand name with the trademark sign.** In visible markup use the `<Brand />` component (`src/components/ui/Brand.astro`), e.g. `<Brand /> for Gen Z`. It renders `Snugglegum` plus the sign in a plain `<span class="tm">` (small and raised via CSS, size `tm-display` for big headings); never `<sup>`, which is meant for superscripts with their own meaning. Put a following punctuation mark directly behind the tag, never on its own line (Astro renders a line break there as a space). In plain text where markup is impossible (`<title>`, meta and Open Graph tags, JSON-LD, `alt`/`aria-label` attributes, `llms.txt`, `robots.txt`, the manifest, `src/config/*.ts`, string props) write the bare `Snugglegum™`. Tests fail if a built page, `llms.txt` or the manifest has "Snugglegum" without ™, if a `<sup>` carries the sign, or if the bare `Snugglegum™` appears in visible body text. Never use the two banned words (see `docs/`); a test fails on them too.

### Design knobs (`src/config/site.ts`)

| Key | Effect |
|---|---|
| `formState` | `'live'` = the real working form. `'idle'`, `'submitting'`, `'success'`, `'error'` pre-render that state for design review. |
| `discountLabel` | e.g. `'15%'`. **Empty hides the discount card, renumbers the others, changes "Three things" to "Two things" and drops the discount from the FAQ.** |
| `proofThreshold` | `PUBLIC_PROOF_THRESHOLD` (default 250). The home page shows "N sign-ups so far" from the live `/api/count` only once the count has reached it, so an early "1 sign-up" does not look thin. To see it while testing, set it to 1. `PUBLIC_SUBSCRIBER_COUNT` is no longer used. |

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
| `cookie-modal` | Opens from the footer, focus trap, ESC, focus return, keyboard use, persistence, dialog focus |
| `newsletter` | Nothing sent before submit, validation, consent required, honeypot, success and every error state (endpoint mocked) |
| `seo` | One `h1`, unique title and description, canonical, Open Graph, Twitter, JSON-LD, alt text, sitemap, robots, `llms.txt`, manifest |
| `a11y` | axe at WCAG 2.2 AA on every route and with each dialog open, keyboard navigation, focus outlines, reduced motion, touch targets |
| `fonts-network` | Only local fonts, no external origins, MailerLite contacted only after submit |
| `csp` | Every page runs under the real CSP from `public/_headers` without a violation |
| `unit/guardrails` | No banned words in built output, sources or docs; ™ on every brand mention (`<Brand />` in visible text, no `<sup>`) |
| `unit/colors`, `unit/variants` | Color rule, design knobs |
| `unit/placeholders` | `.env` resolution (empty, value, `n/a`, fallback, review flag) and the `check:placeholders` report |
| `unit/rendered-check` | The post-build HTML check: every failure above on a synthetic `dist/`, plus the real build |

**Firefox on this machine:** Playwright's Firefox build (155) fails to start on macOS 27 ("Could not find profile folder"), even when launched by hand. Run `SKIP_FIREFOX=1 pnpm test` to skip it locally. Run the full matrix in CI or on another machine.

## SEO and GEO notes

- Unique title and description per page, canonical, Open Graph and Twitter tags, `theme-color`, favicon set and manifest.
- JSON-LD: `Organization` and `Brand` on every page, `WebSite` on the home page, `WebPage` on each, and one pre-launch `Product` per product line on the home page (no `Offer`, no review markup). No `FAQPage`.
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

## Sign-up flow and counter (Cloudflare Pages Functions)

The newsletter form posts to `/api/signup` (`functions/api/signup.js`). The function creates the subscriber through the MailerLite **Connect API**, adds the groups, and only when MailerLite answers 2xx counts the sign-up in KV (binding `SIGNUPS`, key `total`). `/api/count` (`functions/api/count.js`) returns `{ "count": N }`, never cached. After a successful sign-up the browser goes to the thank-you page (`/thank-you-newsletter`, built as `thank-you-newsletter.html`). It shows "N sign-ups so far" (hidden silently if the count cannot be fetched) and the ticket shows the visitor's own number as "No. 042 of 500" (above 500: "Waitlist"). The number travels from the form to the page in `sessionStorage`; it is never stored in MailerLite.

Where `/api/signup` does not exist (static preview, another host) the form falls back to posting straight to the MailerLite hosted form, without number or counter. The no-JavaScript form also posts there natively.

**Set it up once** (these change your Cloudflare account, so run them yourself):

```bash
pnpm exec wrangler login                         # once, if you are not logged in
pnpm exec wrangler kv namespace create SIGNUPS   # prints the namespace id
```

Bind it in Cloudflare: Pages project, Settings, Bindings, KV namespace, variable name `SIGNUPS`. There is deliberately no `wrangler.toml` in the repo: with one, Cloudflare Pages ignores the variables set in the dashboard (the build then fails with every `PUBLIC_*` missing). `docs/wrangler.pages.example.toml` keeps the old file for reference. The secret `MAILERLITE_API_KEY` is not in the repo; it stays a Secret in Cloudflare (Pages, Settings, Variables and Secrets).

**If a sign-up fails** the page only says "Something went wrong on our side" on purpose. The real reason is printed in the terminal window that runs `pnpm preview:functions` (or in Cloudflare's Real-time logs), for example `signup: MAILERLITE_API_KEY is not set`, `MailerLite answered 401` (key rejected) or `MailerLite answered 422 (refused: fields.flavor_suggestion)` (a custom field is missing in MailerLite). `pnpm check:mailerlite` (also run automatically by `pnpm preview:functions`) checks all of that up front, read-only: it needs `.dev.vars`, tests the key, and lists any of the six groups or six custom fields (`consent_at`, `consent_age_18`, `signup_source`, `flavor_suggestion`, `utm_source`, `utm_campaign`) that are missing in your MailerLite account.

**Try it without publishing anything:** `pnpm preview:functions` builds the site and runs it together with the functions in Cloudflare's local simulator, at http://127.0.0.1:8788, with the same headers and CSP as production. Nothing is deployed and nobody else can reach it. Before the first run copy `.dev.vars.example` to `.dev.vars` and put your MailerLite API key in it (git-ignored); the command checks the key and your MailerLite setup first and stops with a clear message if sign-ups could not work. The counter is a local one, separate from production, and `.wrangler/` holds its state (delete the folder to reset it). What is real: a sign-up creates a real contact in your MailerLite account and sends the real confirmation email, so use an address of your own. What is not: the "confirmed" redirect goes to whatever address you set in MailerLite, so the confirmation page opens on the live domain, not on localhost. Checked without a key: the simulator starts, the KV binding is local, and `/api/count`, the 403, 429 and 400 answers and MailerLite's 401 for a wrong key behave as designed.

**Still to do in the dashboards**
1. Cloudflare Pages: check that `MAILERLITE_API_KEY` exists for Production. Bindings (KV `SIGNUPS`) and variables are set in the dashboard.
2. MailerLite: create the custom fields `flavor_suggestion`, `consent_at`, `consent_age_18`, `signup_source`, `utm_source`, `utm_campaign` (text). Check that the six group IDs in `functions/api/signup.js` exist in the account. If the double opt-in should also apply to sign-ups made through the API, check MailerLite's API/double opt-in setting; otherwise those subscribers are active at once.
3. Test one real sign-up, then open `/api/count`.

**Limits to know**
- KV's free plan allows 1,000 writes a day, and every successful sign-up is one write. Beyond that the sign-up still works, it just comes back without a number.
- KV is not atomic and reads can lag by up to a minute: two sign-ups in the same instant may get the same number, and the count can briefly trail. The page shows the larger of the count and the new number.
- **Every accepted sign-up is counted and gets a number, whether the address was new or already on the list**, and the answer looks the same either way (on purpose, see "Security"). Someone who signs up again more than 10 minutes later is counted again. The same address within 10 minutes is sent to MailerLite once and gets the same number.
- The thank-you page shows `max(count, own number)`. The own number is the value KV held right after this sign-up's write, so the larger value is never higher than what KV has held; it only fixes a lagging read, which would otherwise show "No. 042" next to "41 sign-ups".
- Preview deployments share the namespace unless you give them their own (give the Preview environment its own KV binding in the dashboard), so test sign-ups there would raise the real counter.

## Security (the sign-up form and `/api/signup`)

**In place** (`functions/api/signup.js`, tested in `tests/unit/signup-function.spec.ts`)
- **Same origin only.** The request must come from a page on this site (`Origin`, else `Sec-Fetch-Site`, else `Referer`). A bare script, a foreign page or a cross-site form post gets 403.
- **Small, well-formed bodies.** Only form-urlencoded, multipart or JSON; the raw body is capped at 8 KB even when `Content-Length` is missing or lies; at most 40 fields; the parsed object has no prototype.
- **Clean input.** The address is validated strictly (one address, no spaces, commas, angle brackets or control characters, length limits, no `..`). Free text keeps no HTML, no control or invisible characters and no spreadsheet-formula starter (`=`, `+`, `-`, `@`), UTM tags only plain characters. Groups come only from the function's own list: a visitor cannot name another group or field.
- **Bots.** The hidden honeypot field (answered with a fake success), plus `form_age`: the form reports how long the page has been open, and anything under 0.7 s or without it is told to try again. A real visitor never notices; a script that only reads the HTML fails.
- **Same answer for everyone.** The reply to a sign-up never depends on whether the address was already on the list, so nobody can use the form to find out who is subscribed. (A number that appeared only for new addresses would have been exactly that leak, which is why repeat sign-ups are counted too.)
- **Optional Turnstile bot check.** Off until you set the two keys below; invisible for nearly everyone when on.
- **Limits.** 8 attempts per IP and 10 minutes (429 with `Retry-After`; the form shows "Too many tries in a row"), and the same address reaches MailerLite once per 10 minutes (a double click or reload just lands on the thank-you page). They live in the Cloudflare cache with IP and address stored only as short-lived hashes, per data center and not atomic, which is enough for abuse control.
- **No leaks.** Errors are generic; MailerLite's answer is never passed on; its 401/403 become a plain 500; only status codes are logged, never the key, an address or a body. Responses are `no-store` and `nosniff`.
- **Front end.** Strict CSP (no inline script or style, `connect-src 'self'` plus MailerLite for the fallback), texts are written with `textContent`, never `innerHTML`; `.dev.vars` is git-ignored and the key exists only as a Cloudflare secret.

**Still open, and yours to do** (I changed nothing in Cloudflare or MailerLite)
1. **Double opt-in for API sign-ups (most important).** If MailerLite activates subscribers created through the Connect API at once, anyone can put someone else's address on the list. Check MailerLite's API / double opt-in setting and test with an address of your own: it must stay "unconfirmed" until its owner clicks the link.
2. **The hosted (embedded) MailerLite form is still public.** Its account and form IDs sit in the page and the no-JavaScript fallback, so anyone can post straight to it and skip all of the above. Once `/api/signup` works in production, turn off or delete that hosted form in MailerLite (or switch on its own bot protection). The page then needs the fallback only where the function is not deployed. Note that `pnpm build` still demands `PUBLIC_MAILERLITE_ACCOUNT_ID` and `PUBLIC_MAILERLITE_FORM_ID`; that requirement can be dropped once the hosted form is gone.
3. **A Cloudflare rate-limiting rule** as a second wall: Security, WAF, Rate limiting rules, for example "URI path equals /api/signup", 5 requests per 10 seconds per IP, then block for 10 minutes. Also switch on Bot Fight Mode.
4. **Turnstile** (Cloudflare's CAPTCHA, usually invisible) only if abuse shows up despite the above; it needs a site key and a secret and adds `challenges.cloudflare.com` to the CSP.
5. **Privacy policy.** It should mention that the rate limiter keeps a short-lived hash of the IP and of the address in Cloudflare's cache (about 10 minutes), without logs. Ask your lawyer to review the wording.
6. **API key.** Use the most restricted key MailerLite offers, and rotate it if it ever shows up in a log, a ticket or a chat.

**Turnstile: what it is and how to switch it on.** Cloudflare Turnstile is a free, privacy-friendly "are you a person?" check, the modern replacement for CAPTCHAs. Visitors almost never see it (it runs in the background and only shows a small box when Cloudflare is unsure). I recommend switching it on once the site is public, because it is the one thing that stops bots from using many different IP addresses to fill the list (and the 500 founding spots) with fake addresses. Steps: Cloudflare dashboard, Turnstile, Add widget, enter your domain, mode "Managed", copy the **site key** and the **secret key**. Then set `PUBLIC_TURNSTILE_SITE_KEY` (the site key) as a build variable in the Pages project, and `TURNSTILE_SECRET_KEY` (the secret key) as a Secret next to `MAILERLITE_API_KEY`, and redeploy. The CSP in `public/_headers` already allows `challenges.cloudflare.com`. Cloudflare's script is only loaded when someone first clicks into the form. To test the switched-on build locally with Cloudflare's published test key: `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA pnpm exec playwright test tests/turnstile.spec.ts`. The privacy policy mentions Turnstile automatically once the site key is set.

**Where to click in Cloudflare** (menu names can differ a little over time)
- **Secrets and the counter:** Workers & Pages, your Pages project, Settings, Variables and Secrets: `MAILERLITE_API_KEY` (and later `TURNSTILE_SECRET_KEY`) as Secret. The KV namespace is bound under Settings, Bindings; to look at the counter: Workers & Pages, KV, `SIGNUPS`, key `total`.
- **Rate limiting rule** (needs the site on your own domain, not only `*.pages.dev`): pick the domain, Security, WAF, Rate limiting rules, Create rule. Name "signup", match "URI Path equals /api/signup" and "Method equals POST", count requests per IP, e.g. 5 requests per 10 seconds, action Block. The free plan only offers a short fixed period and block time; that is fine, the function has its own 10-minute limit.
- **Bot Fight Mode:** pick the domain, Security, Bots, switch "Bot Fight Mode" on.
- **Watch it work:** Workers & Pages, your Pages project, Functions, Real-time logs (shows our status-code logs, never keys or addresses).
- **Quick checks after the first deploy:** `curl -i -X POST https://YOUR-DOMAIN/api/signup` must answer 403 (no Origin), and `curl -i https://YOUR-DOMAIN/api/count` must answer `{"count":0}`-style JSON.

**Known and accepted**
- Fake addresses can still use up numbers, at the speed the limits allow (and with Turnstile on, hardly at all). With double opt-in the ticket says "Confirm your email to keep your spot"; spots whose owners never confirm can be cleaned up by hand in MailerLite.
- The count includes sign-ups that are not confirmed yet, which is why the page says "sign-ups".

## Playful message pages

`Fun.astro` (layout) builds four pages that share a dark hero with a gummy you can poke (squish and confetti, off under reduced motion). All are `noindex` and left out of the sitemap:

| Page | File | Use |
|---|---|---|
| `/thank-you-newsletter` | `thank-you-newsletter.html` | where a successful sign-up lands |
| `/404` | `404.html` | Cloudflare Pages and Netlify serve it, with status 404, for any unknown URL |
| `/confirmed` | `confirmed.html` | the page people see after clicking the link in the confirmation email: set `https://YOUR-DOMAIN/confirmed` as the double opt-in confirmation page in MailerLite (not the thank-you page, which would show "Check your inbox" to someone who just did) |
| `/unsubscribed` | `unsubscribed.html` | for MailerLite's unsubscribe redirect (set this URL in MailerLite's unsubscribe settings) |

Cloudflare Pages redirects `/page.html` to `/page`, so both addresses work. Copy lives in each page's markup.

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
| The decorative "GUMMIES" word is excluded from the axe scan (`data-decorative-text`) | It is `aria-hidden` pure decoration at 14% opacity, which WCAG 1.4.3 exempts from the contrast minimum |
| Three "How it works" images are empty dashed frames | No images exist yet. Pass `src` and `alt` to `ImagePlaceholder` to fill one |

## Open items

See the list at the end of the hand-over message and the output of `pnpm check:placeholders`. In short:

- Approve or replace the flagged copy (`data-copy-review`), and the pouch artwork text.
- Fill in the missing values in `.env` (`pnpm check:placeholders` lists them), then have a lawyer review the legal pages (`docs/legal-review.md`) and set `PUBLIC_LEGAL_REVIEWED=true`.
- Set `PUBLIC_SITE_URL`, choose hosting, confirm MailerLite double opt-in.
- Decide the discount label, launch date, social-proof threshold, FAQ schema, and whether to add a pause control for the moving marquee.
