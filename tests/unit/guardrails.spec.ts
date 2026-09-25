import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { expect, test } from '@playwright/test';

/** Words that must never appear in what we ship or document. */
const BANNED = [/superfood/i, /\bsex/i];
/** Health, medical and body claims we do not make. Reported when found in built output (see docs/plan.md, 2.1). */
const TEXT_EXTENSIONS = new Set(['.html', '.txt', '.xml', '.webmanifest', '.json', '.md', '.astro', '.ts', '.css']);

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const read = (path: string) => readFileSync(path, 'utf8');
const builtFiles = () => [...walk('dist')].filter((f) => ['.html', '.txt', '.xml', '.webmanifest'].includes(extname(f)));

test.describe('content guardrails', () => {
  test('the build output exists', () => {
    expect(builtFiles().length).toBeGreaterThan(5);
  });

  test('built pages, llms.txt, sitemap and manifest contain neither banned word', () => {
    const offenders = builtFiles().flatMap((file) =>
      BANNED.filter((re) => re.test(read(file))).map((re) => `${file} matches ${re}`),
    );
    expect(offenders).toEqual([]);
  });

  test('source, docs and README contain neither banned word', () => {
    const files = [
      ...['src', 'docs', 'public'].flatMap((dir) => [...walk(dir)]),
      ...['README.md'].filter(existsSync),
    ].filter((f) => TEXT_EXTENSIONS.has(extname(f)));
    const offenders = files.flatMap((file) => BANNED.filter((re) => re.test(read(file))).map((re) => `${file} matches ${re}`));
    expect(offenders).toEqual([]);
  });

  // <Brand /> renders the name plus the sign in a plain span (see src/components/ui/Brand.astro).
  const BRAND_MARKUP = /Snugglegum<span class="tm[^"]*">™<\/span>/g;
  const context = (text: string, index: number, length = 0) =>
    `…${text.slice(Math.max(0, index - 25), index + length + 35).replace(/\s+/g, ' ')}…`;

  test('every mention of the brand name carries the trademark sign', () => {
    // Case-sensitive on purpose: domains and email addresses are lowercase (snugglegum.com).
    // Accepted: the bare "Snugglegum™" (head, attributes, llms.txt, manifest) or the <Brand /> markup.
    const missing = builtFiles().flatMap((file) => {
      const text = read(file);
      return [...text.matchAll(/Snugglegum(?!™|<span class="tm[^"]*">™<\/span>)/g)].map(
        (m) => `${file}: ${context(text, m.index!)}`,
      );
    });
    expect(missing).toEqual([]);
  });

  test('the trademark sign is never a <sup>', () => {
    const offenders = builtFiles()
      .filter((file) => extname(file) === '.html')
      .flatMap((file) => {
        const text = read(file);
        return [...text.matchAll(/<sup[^>]*>\s*™|Snugglegum\s*<sup\b/g)].map((m) => `${file}: ${context(text, m.index!)}`);
      });
    expect(offenders).toEqual([]);
  });

  test('visible body text uses the <Brand /> markup, never the bare "Snugglegum™"', () => {
    const bare = builtFiles()
      .filter((file) => extname(file) === '.html')
      .flatMap((file) => {
        const body = /<body[\s\S]*<\/body>/.exec(read(file))?.[0] ?? '';
        const text = body
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '')
          .replace(BRAND_MARKUP, '\u0000BRAND\u0000')
          // Tags (quoted attribute values may contain ">"), so attribute text is not treated as visible text.
          .replace(/<\/?[a-zA-Z][^\s>/]*(?:"[^"]*"|'[^']*'|[^>"'])*>/g, ' ');
        return [...text.matchAll(/Snugglegum™/g)].map((m) => `${file}: ${context(text, m.index!)}`);
      });
    expect(bare).toEqual([]);
  });

  test('<Brand /> is in use on the built pages', () => {
    expect(read('dist/index.html').match(BRAND_MARKUP)?.length ?? 0).toBeGreaterThan(5);
  });

  test('no page, llms.txt or manifest mentions an age limit (18+, "18 or older", "under 18", the stamp)', () => {
    const offenders = builtFiles().flatMap((file) => {
      const text = read(file);
      return [...text.matchAll(/18\+|18 or older|[Uu]nder 18|18 and over|aged 18|grownups only/g)].map(
        (m) => `${file}: ${context(text, m.index!)}`,
      );
    });
    expect(offenders).toEqual([]);
  });

  test('offer variants: no discount card and no social proof by default', () => {
    const html = read('dist/index.html');
    expect(html).not.toContain('[XX%]');
    expect(html).not.toMatch(/people are already on the list/);
    expect(html).toContain('data-card-count="2"');
    expect(html).toMatch(/Two things for joining before launch/);
  });
});
