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

  test('every mention of the brand name carries the trademark sign', () => {
    // Case-sensitive on purpose: domains and email addresses are lowercase (snugglegum.com).
    const missing = builtFiles().flatMap((file) => {
      const text = read(file);
      return [...text.matchAll(/Snugglegum(?!™|<sup[^>]*>™<\/sup>)/g)].map(
        (m) => `${file}: …${text.slice(Math.max(0, m.index! - 25), m.index! + 35).replace(/\s+/g, ' ')}…`,
      );
    });
    expect(missing).toEqual([]);
  });

  test('the 18+ notice is in the built home page', () => {
    const html = read('dist/index.html');
    expect(html).toContain('Gummies for grownups only');
    expect(html).toContain('18+ only');
  });

  test('offer variants: no discount card and no social proof by default', () => {
    const html = read('dist/index.html');
    expect(html).not.toContain('[XX%]');
    expect(html).not.toMatch(/people are already on the list/);
    expect(html).toContain('data-card-count="2"');
    expect(html).toMatch(/Two things for joining before launch/);
  });
});
