/**
 * Post-build check of the rendered HTML in dist/.
 *
 * Why: a missing `PUBLIC_` value must never make text quietly disappear. The env check tells you what is
 * empty. This check proves that the BUILT pages agree:
 *  - every value that is set really is in the pages it belongs to,
 *  - every value that is missing shows its visible [[TODO]] marker (not an empty gap),
 *  - optional lines that are switched off leave no orphan label behind,
 *  - no "undefined", "null", "NaN" or "[object Object]" and no empty href, src, title or meta content,
 *  - no dangling punctuation such as "hosted by ." or "Contact: </p>",
 *  - no value of a NON-public variable from .env appears anywhere in dist/ (secret leak guard).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { markerFor, placeholderSpecs, resolvePlaceholders } from '../../src/config/placeholders.ts';
import { hasDiscount, parseCount, shouldShowSocialProof } from '../../src/config/variants.ts';

const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.css', '.txt', '.xml', '.json', '.webmanifest', '.map', '.svg']);
const ENV_FILES = ['.env', '.env.production', '.env.local', '.env.production.local'];
const MIN_SECRET_LENGTH = 6;
const INLINE_TAGS = /<\/?(?:a|span|sup|sub|strong|em|b|i|small|abbr|mark|code)\b[^>]*>/gi;

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (whole, name) => NAMED_ENTITIES[name.toLowerCase()] ?? whole);
}

const collapse = (text) => text.replace(/\s+/g, ' ').trim();

/** The text a visitor reads: no scripts, styles or comments, inline tags glued, other tags as spaces. */
export function visibleText(html) {
  const withoutCode = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  return collapse(decodeEntities(withoutCode.replace(INLINE_TAGS, '').replace(/<[^>]+>/g, ' ')));
}

/** Minimal .env parser: KEY=VALUE, optional quotes, comments, `export`. */
export function parseEnvFile(text) {
  const values = {};
  for (const line of text.split('\n')) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    let value = match[2];
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.lastIndexOf(quote) > 0) {
      value = value.slice(1, value.lastIndexOf(quote));
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    values[match[1]] = value;
  }
  return values;
}

/** Variables defined in the .env files of the project (later files win), without process.env noise. */
export function readEnvFiles(root) {
  return Object.assign({}, ...ENV_FILES.map((name) => {
    const path = join(root, name);
    return existsSync(path) ? parseEnvFile(readFileSync(path, 'utf8')) : {};
  }));
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

function newestMtime(paths) {
  return Math.max(0, ...paths.filter((p) => existsSync(p)).map((p) => statSync(p).mtimeMs));
}

/** True when .env or src/ changed after the last build, so dist/ does not reflect them. */
export function distIsStale(root) {
  const built = join(root, 'dist', 'index.html');
  if (!existsSync(built)) return false;
  const sources = [
    ...ENV_FILES.map((name) => join(root, name)),
    ...(existsSync(join(root, 'src')) ? [...walk(join(root, 'src'))] : []),
  ];
  return newestMtime(sources) > statSync(built).mtimeMs;
}

const stripSlashes = (value) => (/^https?:\/\//i.test(value) ? value.replace(/\/+$/, '') : value);

/**
 * @param {{ root?: string, env: Record<string, string | undefined>, fileEnv?: Record<string, string> }} options
 *   `env`: the environment the build used (what `astro build` saw). `fileEnv`: variables from the .env files.
 */
export function collectRenderedProblems({ root = process.cwd(), env, fileEnv = readEnvFiles(root) }) {
  const dist = join(root, 'dist');
  if (!existsSync(join(dist, 'index.html'))) return { skipped: true, problems: [], warnings: [], checked: 0, pages: [] };

  const problems = [];
  const warnings = [];
  let checked = 0;
  const problem = (kind, where, what) => problems.push({ kind, where, what });

  const pageNames = [...new Set(['index', 'imprint', 'privacy', ...placeholderSpecs.flatMap((s) => s.output?.pages ?? [])])];
  const pages = {};
  for (const name of pageNames) {
    const file = join(dist, `${name}.html`);
    if (!existsSync(file)) {
      problem('page', `dist/${name}.html`, 'Expected page was not built.');
      continue;
    }
    const raw = readFileSync(file, 'utf8');
    pages[name] = { raw, decoded: decodeEntities(raw), text: visibleText(raw), file: `dist/${name}.html` };
  }

  // 1. Every registry value: present when set, marker when missing, no orphan label when hidden.
  const resolved = resolvePlaceholders(env);
  for (const spec of placeholderSpecs) {
    const output = spec.output;
    if (!output) continue;
    const item = resolved[spec.id];
    for (const pageName of output.pages) {
      const page = pages[pageName];
      if (!page) continue;
      const has = (needle) => collapse(page.decoded).includes(collapse(needle));

      if (item.status === 'set' && output.showsValue !== false) {
        checked += 1;
        if (!has(stripSlashes(item.value))) {
          problem('value-not-rendered', page.file, `${spec.env} is set, but its value "${item.value}" is not in the page. The text is gone.`);
        }
      }
      if (item.status === 'missing' && output.marker !== false) {
        checked += 1;
        if (!has(markerFor(spec.label))) {
          problem('silent-drop', page.file, `${spec.env} is empty, but the page shows neither a value nor the [[TODO: ${spec.label}]] marker. The text vanished silently.`);
        }
      }
      for (const label of output.whileShown ?? []) {
        checked += 1;
        const shouldShow = item.display !== null;
        if (shouldShow && !has(label)) problem('label-missing', page.file, `${spec.env} is shown, but "${label}" is not in the page.`);
        if (!shouldShow && has(label)) problem('orphan-label', page.file, `${spec.env} is off, but "${label}" is still in the page.`);
      }
      for (const text of output.onlyWhenMissing ?? []) {
        checked += 1;
        const shouldShow = item.status === 'missing';
        if (shouldShow && !has(text)) problem('label-missing', page.file, `${spec.env} is missing, so "${text}" should be in the page.`);
        if (!shouldShow && has(text)) problem('orphan-label', page.file, `${spec.env} is set, but "${text}" is still in the page.`);
      }
    }
  }

  // 2. Offer knobs that need more than a text match.
  const home = pages.index;
  if (home) {
    const discountOn = hasDiscount(env.PUBLIC_DISCOUNT_LABEL ?? '');
    checked += 1;
    if (!home.text.includes(`${discountOn ? 'Three' : 'Two'} things for joining before launch`)) {
      problem('offer', home.file, `The offer heading does not match PUBLIC_DISCOUNT_LABEL (${discountOn ? 'set' : 'empty'}).`);
    }
    const count = parseCount(env.PUBLIC_SUBSCRIBER_COUNT, 0);
    const threshold = parseCount(env.PUBLIC_PROOF_THRESHOLD, 250);
    const proofExpected = shouldShowSocialProof(count, threshold);
    checked += 1;
    if (proofExpected && !home.text.includes(`${count} people are already on the list`)) {
      problem('social-proof', home.file, `PUBLIC_SUBSCRIBER_COUNT=${count} reaches the threshold ${threshold}, but the social proof line is not in the page.`);
    }
    if (!proofExpected && home.text.includes('people are already on the list')) {
      problem('social-proof', home.file, `The social proof line is shown although ${count} is below the threshold ${threshold}.`);
    }
  }

  // 3. Generic garbage, in every built page.
  for (const page of Object.values(pages)) {
    checked += 1;
    for (const word of [/\bundefined\b/, /\bNaN\b/, /\bnull\b/, /\[object Object\]/]) {
      const hit = word.exec(page.text);
      if (hit) problem('garbage-text', page.file, `The text contains "${hit[0]}": …${page.text.slice(Math.max(0, hit.index - 30), hit.index + 30)}…`);
    }
    const attributeChecks = [
      [/="(?:undefined|null|NaN)"/, 'an attribute is "undefined", "null" or "NaN"'],
      [/\[object Object\]/, 'an attribute contains "[object Object]"'],
      [/\shref=""/, 'an empty href'],
      [/\shref="mailto:(?:undefined|null)?"/, 'an empty or undefined mailto link'],
      [/\ssrc=""/, 'an empty src'],
      [/\saction=""/, 'an empty form action'],
      [/\sdata-endpoint=""/, 'an empty newsletter endpoint (MailerLite IDs missing)'],
      [/<meta\b[^>]*\scontent=""/, 'a meta tag with empty content'],
      [/<title>\s*<\/title>/, 'an empty <title>'],
    ];
    for (const [pattern, what] of attributeChecks) {
      if (pattern.test(page.raw)) problem('empty-attribute', page.file, `The HTML contains ${what}.`);
    }
    const punctuation = [
      [/ \.(?!\d)/, 'a period after a space (an empty value before it?)'],
      [/:\s+[.,;]/, 'a colon followed by punctuation (an empty value after a label?)'],
      [/\(\s*\)/, 'empty parentheses'],
      // An intro sentence before an address, list or table legitimately ends with a colon.
      [/[A-Za-z]:\s*<\/(?:p|li|dd|td|span|h[1-6])>(?!\s*<(?:address|ul|ol|dl|table|div))/, 'a label ending in a colon with nothing after it'],
    ];
    for (const [pattern, what] of punctuation) {
      const target = pattern.source.includes('<\\/') ? page.raw : page.text;
      const hit = pattern.exec(target);
      if (hit) problem('dangling-punctuation', page.file, `Found ${what}: …${target.slice(Math.max(0, hit.index - 30), hit.index + 30).replace(/\s+/g, ' ')}…`);
    }
  }

  // 4. Secret leak guard: values of non-public variables must not be anywhere in dist/.
  const secrets = Object.entries(fileEnv).filter(([key, value]) => !key.startsWith('PUBLIC_') && value.length >= MIN_SECRET_LENGTH);
  if (secrets.length) {
    for (const file of walk(dist)) {
      if (!TEXT_EXTENSIONS.has(extname(file))) continue;
      const text = readFileSync(file, 'utf8');
      for (const [key, value] of secrets) {
        checked += 1;
        if (text.includes(value)) problem('secret-leak', file.slice(root.length + 1), `The value of ${key} (a variable without PUBLIC_) is in the built output.`);
      }
    }
  }

  // 5. Typos: PUBLIC_ variables in .env that nothing reads.
  const known = new Set(placeholderSpecs.map((spec) => spec.env));
  const extra = new Set(['PUBLIC_MAILERLITE_ACCOUNT_ID', 'PUBLIC_MAILERLITE_FORM_ID']);
  for (const key of Object.keys(fileEnv)) {
    if (key.startsWith('PUBLIC_') && !known.has(key) && !extra.has(key)) {
      warnings.push(`${key} is in .env but nothing reads it. A typo? Known names are in src/config/placeholders.ts.`);
    }
  }

  return { skipped: false, problems, warnings, checked, pages: Object.keys(pages) };
}
