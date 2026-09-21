import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  collectRenderedProblems,
  decodeEntities,
  parseEnvFile,
  visibleText,
} from '../../scripts/lib/rendered-check.mjs';
import { markerFor, placeholderSpecs, resolvePlaceholders, type PlaceholderOutput } from '../../src/config/placeholders';

type Env = Record<string, string>;
const PAGES = ['index', 'imprint', 'privacy'] as const;

const filledEnv: Env = Object.fromEntries(
  placeholderSpecs.map((spec) => [
    spec.env,
    'kind' in spec && spec.kind === 'flag'
      ? 'true'
      : spec.env === 'PUBLIC_SITE_URL'
        ? 'https://www.example.test'
        : spec.env === 'PUBLIC_SUBSCRIBER_COUNT'
          ? '400'
          : spec.env === 'PUBLIC_PROOF_THRESHOLD'
            ? '250'
            : spec.env === 'PUBLIC_CONTACT_EMAIL'
              ? 'hello@example.test'
              : `value for ${spec.id}`,
  ]),
);
const emptyEnv: Env = Object.fromEntries(placeholderSpecs.map((spec) => [spec.env, '']));

/** Renders a fixture site the way the real pages should behave, driven by the registry. */
function renderFixture(env: Env): Record<(typeof PAGES)[number], string> {
  const resolved = resolvePlaceholders(env);
  const body: Record<string, string> = { index: '', imprint: '', privacy: '' };

  for (const spec of placeholderSpecs) {
    const output: PlaceholderOutput | undefined = 'output' in spec ? spec.output : undefined;
    if (!output) continue;
    const item = resolved[spec.id];
    for (const page of output.pages) {
      const labels = (output.whileShown ?? []).join(' ');
      const drafts = item.status === 'missing' ? (output.onlyWhenMissing ?? []).join(' ') : '';
      if (item.display !== null && (output.showsValue !== false || item.status === 'missing')) {
        const printed = item.status === 'set' ? item.display : markerFor(spec.label);
        const shown = spec.env === 'PUBLIC_MAILERLITE_ACCOUNT_ID' || spec.env === 'PUBLIC_MAILERLITE_FORM_ID' ? '' : printed;
        body[page] += `<p>${labels} ${shown}${drafts ? ` ${drafts}` : ''}</p>\n`;
      } else if (drafts) {
        body[page] += `<p>${drafts}</p>\n`;
      }
    }
  }
  const acct = env.PUBLIC_MAILERLITE_ACCOUNT_ID ?? '';
  const form = env.PUBLIC_MAILERLITE_FORM_ID ?? '';
  const discountOn = !!(env.PUBLIC_DISCOUNT_LABEL ?? '').trim();
  const count = Number(env.PUBLIC_SUBSCRIBER_COUNT || 0);
  const threshold = Number(env.PUBLIC_PROOF_THRESHOLD || 250);
  body.index +=
    `<div data-endpoint="https://assets.mailerlite.com/jsonp/${acct}/forms/${form}/subscribe"></div>` +
    `<h2>${discountOn ? 'Three' : 'Two'} things for joining before launch</h2>` +
    (count > 0 && count >= threshold ? `<p>${count} people are already on the list</p>` : '') +
    (acct && form ? '' : '<!-- ids missing: the build check reports this via the env check -->');

  const page = (name: string) =>
    `<!doctype html><html><head><title>Title</title><meta name="description" content="Desc"></head><body>${body[name]}</body></html>`;
  return { index: page('index'), imprint: page('imprint'), privacy: page('privacy') };
}

function makeRoot(pages: Record<string, string>, extraFiles: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'sg-rendered-'));
  mkdirSync(join(root, 'dist'), { recursive: true });
  for (const [name, html] of Object.entries(pages)) writeFileSync(join(root, 'dist', `${name}.html`), html);
  for (const [file, content] of Object.entries(extraFiles)) writeFileSync(join(root, 'dist', file), content);
  return root;
}

const kinds = (root: string, env: Env, fileEnv: Env = {}) =>
  collectRenderedProblems({ root, env, fileEnv }).problems.map((p: { kind: string }) => p.kind);

test.describe('post-build check of the rendered HTML', () => {
  test('a correct site passes, with every value set', () => {
    expect(kinds(makeRoot(renderFixture(filledEnv)), filledEnv)).toEqual([]);
  });

  test('a correct site passes while everything is empty (visible [[TODO]] markers instead of gaps)', () => {
    expect(kinds(makeRoot(renderFixture(emptyEnv)), emptyEnv)).toEqual([]);
  });

  test('a value that is set but missing from the page is reported', () => {
    const pages = renderFixture(filledEnv);
    pages.privacy = pages.privacy.replace('value for hostingProvider', '');
    expect(kinds(makeRoot(pages), filledEnv)).toContain('value-not-rendered');
  });

  test('an empty value that leaves a gap instead of a marker is reported as a silent drop', () => {
    const pages = renderFixture(emptyEnv);
    pages.imprint = pages.imprint.replace(markerFor('contact email'), '');
    const result = collectRenderedProblems({ root: makeRoot(pages), env: emptyEnv, fileEnv: {} });
    const drop = result.problems.find((p: { kind: string }) => p.kind === 'silent-drop');
    expect(drop?.what).toContain('PUBLIC_CONTACT_EMAIL');
    expect(drop?.where).toBe('dist/imprint.html');
  });

  test('an optional line that is switched off must not leave its label behind', () => {
    const env = { ...filledEnv, PUBLIC_LEGAL_VAT_ID: 'n/a' };
    const pages = renderFixture(env);
    pages.imprint += '<p>VAT ID: </p>';
    expect(kinds(makeRoot(pages), env)).toContain('orphan-label');
  });

  test('the draft notice disappears once the review flag is set, and stays while it is not', () => {
    const reviewed = renderFixture(filledEnv);
    reviewed.imprint += '<p>Legal · draft</p>';
    expect(kinds(makeRoot(reviewed), filledEnv)).toContain('orphan-label');

    const draft = renderFixture(emptyEnv);
    draft.privacy = draft.privacy.replaceAll('Legal · draft', '');
    expect(kinds(makeRoot(draft), emptyEnv)).toContain('label-missing');
  });

  test('"undefined", "null", "NaN" and "[object Object]" in visible text are reported', () => {
    for (const word of ['undefined', 'null', 'NaN', '[object Object]']) {
      const pages = renderFixture(filledEnv);
      pages.index += `<p>Contact: ${word}</p>`;
      expect(kinds(makeRoot(pages), filledEnv), word).toContain('garbage-text');
    }
  });

  test('empty href, mailto, src, meta content, title and endpoint are reported', () => {
    const bad = [
      '<a href="">x</a>',
      '<a href="mailto:">x</a>',
      '<a href="mailto:undefined">x</a>',
      '<img src="" alt="">',
      '<meta property="og:title" content="">',
      '<div data-endpoint=""></div>',
      '<span data-x="undefined"></span>',
    ];
    for (const snippet of bad) {
      const pages = renderFixture(filledEnv);
      pages.index += snippet;
      expect(kinds(makeRoot(pages), filledEnv), snippet).toContain('empty-attribute');
    }
    const pages = renderFixture(filledEnv);
    pages.index = pages.index.replace('<title>Title</title>', '<title></title>');
    expect(kinds(makeRoot(pages), filledEnv)).toContain('empty-attribute');
  });

  test('dangling punctuation from an empty value is reported', () => {
    for (const snippet of ['<p>The website is hosted by . When you visit</p>', '<p>Retention: .</p>', '<p>Phone ( )</p>']) {
      const pages = renderFixture(filledEnv);
      pages.privacy += snippet;
      expect(kinds(makeRoot(pages), filledEnv), snippet).toContain('dangling-punctuation');
    }
  });

  test('an intro sentence with a colon before an address block is not a false alarm', () => {
    const pages = renderFixture(filledEnv);
    pages.imprint += '<p>Operated by:</p><address>Someone</address>';
    expect(kinds(makeRoot(pages), filledEnv)).toEqual([]);
  });

  test('the social proof line follows count and threshold', () => {
    const env = { ...filledEnv, PUBLIC_SUBSCRIBER_COUNT: '100' };
    const pages = renderFixture(env);
    pages.index += '<p>100 people are already on the list</p>';
    expect(kinds(makeRoot(pages), env)).toContain('social-proof');

    const above = renderFixture(filledEnv);
    above.index = above.index.replace('400 people are already on the list', '');
    expect(kinds(makeRoot(above), filledEnv)).toContain('social-proof');
  });

  test('a secret from a variable without PUBLIC_ in the built output is reported, a public one is not', () => {
    const root = makeRoot(renderFixture(filledEnv), { 'app.js': 'const k = "sk_live_abcdef123456";' });
    expect(kinds(root, filledEnv, { STRIPE_SECRET_KEY: 'sk_live_abcdef123456' })).toContain('secret-leak');
    expect(kinds(root, filledEnv, { PUBLIC_MAILERLITE_FORM_ID: 'sk_live_abcdef123456' })).not.toContain('secret-leak');
    expect(kinds(root, filledEnv, { SHORT: 'abc' })).not.toContain('secret-leak');
  });

  test('a PUBLIC_ variable in .env that nothing reads is a warning (typo guard)', () => {
    const result = collectRenderedProblems({ root: makeRoot(renderFixture(filledEnv)), env: filledEnv, fileEnv: { PUBLIC_CONTACT_EMAL: 'x@y.z' } });
    expect(result.warnings.join(' ')).toContain('PUBLIC_CONTACT_EMAL');
  });

  test('without a build the check is skipped, not failed', () => {
    const root = mkdtempSync(join(tmpdir(), 'sg-nodist-'));
    expect(collectRenderedProblems({ root, env: {}, fileEnv: {} }).skipped).toBe(true);
  });

  test('helpers: entities, visible text and .env parsing', () => {
    expect(decodeEntities('a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39; &#x2122;')).toBe('a & b <c> "d" \'e\' ™');
    expect(visibleText('<p>Hi <a href="x">there</a>.</p><script>var undefined_thing</script><style>.a{}</style>')).toBe('Hi there .'.replace(' .', '.'));
    expect(parseEnvFile('# c\nA=1\nexport B="two words"\nC=\'x y\'\nD=plain # note\nE=\n')).toEqual({ A: '1', B: 'two words', C: 'x y', D: 'plain', E: '' });
  });
});

test.describe('the real build (dist/, built with every placeholder empty)', () => {
  test('every missing value shows its marker, and nothing is empty, undefined or dangling', () => {
    const env = { ...emptyEnv, PUBLIC_MAILERLITE_ACCOUNT_ID: '2650700', PUBLIC_MAILERLITE_FORM_ID: '199242337324369472' };
    const result = collectRenderedProblems({ env, fileEnv: {} });
    expect(result.skipped).toBe(false);
    expect(result.problems).toEqual([]);
    expect(result.checked).toBeGreaterThan(30);
  });
});
