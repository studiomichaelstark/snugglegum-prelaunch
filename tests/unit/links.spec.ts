import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const pages = () => (existsSync('dist') ? readdirSync('dist').filter((f) => f.endsWith('.html')) : []);
const read = (file: string) => readFileSync(join('dist', file), 'utf8');
const idsOf = (html: string) => new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1] ?? ''));
const hrefsOf = (html: string): string[] => [...new Set([...html.matchAll(/\bhref="([^"]*)"/g)].map((m) => m[1] ?? ''))];
/** "#top" scrolls to the page start by browser rule, even without an element with that id. */
const isBuiltIn = (fragment: string) => fragment === '' || fragment.toLowerCase() === 'top';

test.describe('internal links', () => {
  test('the build output exists', () => {
    expect(pages().length).toBeGreaterThan(5);
  });

  test('every #anchor on a page points to an element on that page', () => {
    const dead = pages().flatMap((file) => {
      const html = read(file);
      const ids = idsOf(html);
      return hrefsOf(html)
        .filter((href) => href.startsWith('#') && !isBuiltIn(href.slice(1)) && !ids.has(href.slice(1)))
        .map((href) => `${file}: ${href}`);
    });
    expect(dead).toEqual([]);
  });

  test('every internal link resolves to a built page, and its #fragment exists there', () => {
    const dead = pages().flatMap((file) =>
      hrefsOf(read(file))
        .filter((href) => href.startsWith('/') && !href.startsWith('//'))
        .flatMap((href) => {
          const [path = '', fragment = ''] = href.split('#');
          const target = path === '/' ? 'index.html' : `${path.replace(/^\//, '')}.html`;
          const isPage = existsSync(join('dist', target));
          const isFile = existsSync(join('dist', path.replace(/^\//, '')));
          if (!isPage && !isFile) return [`${file}: ${href} (no such page or file)`];
          if (fragment && !isBuiltIn(fragment) && isPage && !idsOf(read(target)).has(fragment)) return [`${file}: ${href} (no element #${fragment})`];
          return [];
        }),
    );
    expect(dead).toEqual([]);
  });
});
