import { expect, ROUTES, test } from './fixtures';

const SITE = 'https://snugglegum.example';

test.describe('SEO', () => {
  for (const route of ROUTES) {
    test(`${route}: one h1, meta, canonical, social tags, alt text`, async ({ consented: page }) => {
      await page.goto(route);

      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('h1')).toHaveCount(1);
      expect((await page.title()).length).toBeGreaterThan(10);
      expect((await page.title()).length).toBeLessThanOrEqual(60);

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length).toBeGreaterThan(50);
      expect(description?.length).toBeLessThanOrEqual(160);

      const expectedCanonical = route === '/' ? `${SITE}/` : `${SITE}${route}`;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expectedCanonical);
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', /^#[0-9a-f]{6}$/i);
      await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);

      for (const property of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name']) {
        await expect(page.locator(`meta[property="${property}"]`), property).toHaveCount(1);
      }
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', expectedCanonical);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${SITE}/og-image.png`);
      for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
        await expect(page.locator(`meta[name="${name}"]`), name).toHaveCount(1);
      }

      // Every image has alt text, and every SVG that carries meaning has an accessible name.
      const imagesWithoutAlt = await page.locator('img:not([alt])').count();
      expect(imagesWithoutAlt).toBe(0);
      const namelessMeaningfulSvgs = await page.locator('svg[role="img"]:not([aria-label]):not([aria-labelledby])').count();
      expect(namelessMeaningfulSvgs).toBe(0);
      const heroImage = page.locator('#hero img');
      if (route === '/') await expect(heroImage).toHaveAttribute('alt', /Snugglegum™ pouch/);
    });

    test(`${route}: valid JSON-LD`, async ({ consented: page }) => {
      await page.goto(route);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks.length).toBeGreaterThan(0);
      const types = blocks.flatMap((block) => {
        const data = JSON.parse(block);
        expect(data['@context']).toBe('https://schema.org');
        return (data['@graph'] as { '@type': string }[]).map((node) => node['@type']);
      });
      expect(types).toContain('Organization');
      expect(types).toContain('WebPage');
      if (route === '/') expect(types).toContain('WebSite');
      expect(types).not.toContain('FAQPage');
    });
  }

  test('titles and descriptions are unique per page', async ({ consented: page }) => {
    const titles: string[] = [];
    const descriptions: string[] = [];
    for (const route of ROUTES) {
      await page.goto(route);
      titles.push(await page.title());
      descriptions.push((await page.locator('meta[name="description"]').getAttribute('content')) ?? '');
    }
    expect(new Set(titles).size).toBe(ROUTES.length);
    expect(new Set(descriptions).size).toBe(ROUTES.length);
  });

  test('sitemap, robots, llms.txt and manifest are reachable and consistent', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBe(true);
    const xml = await sitemap.text();
    for (const path of ['/', '/imprint', '/privacy']) expect(xml).toContain(`${SITE}${path}`);

    expect((await request.get('/sitemap-index.xml')).ok()).toBe(true);

    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBe(true);
    const robotsText = await robots.text();
    expect(robotsText).toContain('Sitemap: https://snugglegum.example/sitemap-index.xml');
    for (const bot of ['Googlebot', 'GPTBot', 'ClaudeBot', 'PerplexityBot']) expect(robotsText).toContain(`User-agent: ${bot}`);
    expect(robotsText).not.toMatch(/Disallow: \/\s*$/m);

    const llms = await request.get('/llms.txt');
    expect(llms.ok()).toBe(true);
    expect(await llms.text()).toContain('# Snugglegum™');

    const manifest = await request.get('/favicon/site.webmanifest');
    expect(manifest.ok()).toBe(true);
    const json = await manifest.json();
    expect(json.name).toBe('Snugglegum™');
    expect(json.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    for (const icon of json.icons as { src: string }[]) expect((await request.get(icon.src)).ok()).toBe(true);
  });
});
