import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const PAGES = [
  { path: '/404', file: '404', h1: 'Oops. This page burst.' },
  { path: '/confirmed', file: 'confirmed', h1: 'It’s official. You’re one of us.' },
  { path: '/unsubscribed', file: 'unsubscribed', h1: 'Sad pop. You’re off the list.' },
] as const;

test.describe('404 page', () => {
  test('an unknown URL answers 404 with the funny page', async ({ consented: page, request }) => {
    const response = await request.get('/definitely-not-a-page');
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('Oops. This page burst.');
    await page.goto('/definitely-not-a-page');
    await expect(page.locator('h1')).toHaveText('Oops. This page burst.');
    await expect(page.getByRole('link', { name: 'Take me home' })).toHaveAttribute('href', '/');
    await expect(page.getByRole('link', { name: 'Join the founding members' })).toHaveAttribute('href', '/#newsletter-home');
  });
});

for (const { path, file, h1 } of PAGES) {
  test.describe(`${path} page`, () => {
    test('renders one h1, is noindex, is built as an html file and is not in the sitemap', async ({ consented: page, request }) => {
      await page.goto(path === '/404' ? '/definitely-not-a-page' : path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(h1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      if (path !== '/404') expect((await request.get(`${path}.html`)).ok(), file).toBe(true);
      expect(await (await request.get('/sitemap-0.xml')).text()).not.toContain(`${path}<`);
    });

    test('the gummy squishes and sprays confetti when poked (never under reduced motion)', async ({ consented: page }) => {
      const url = path === '/404' ? '/definitely-not-a-page' : path;
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(url);
      const pop = page.locator('[data-pop-gummy]');
      await expect(pop).toBeVisible();
      await page.evaluate(() => {
        (window as unknown as { __seen: number }).__seen = 0;
        new MutationObserver(() => {
          if (document.querySelector('canvas[data-confetti]')) (window as unknown as { __seen: number }).__seen++;
        }).observe(document.body, { childList: true });
      });
      await pop.click();
      await expect.poll(() => page.evaluate(() => (window as unknown as { __seen: number }).__seen)).toBeGreaterThan(0);
      await expect(pop).toHaveClass(/is-popped/);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(url);
      await page.locator('[data-pop-gummy]').click();
      await page.waitForTimeout(600);
      await expect(page.locator('canvas[data-confetti]')).toHaveCount(0);
    });

    test('no accessibility violations (WCAG 2.2 AA)', async ({ consented: page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path === '/404' ? '/definitely-not-a-page' : path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    });

    test('mobile: no horizontal overflow', async ({ consented: page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(path === '/404' ? '/definitely-not-a-page' : path);
      const [scrollWidth, clientWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  });
}

test('the confirmed page greets with confetti on arrival', async ({ consented: page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    (window as unknown as { __arrived: boolean }).__arrived = false;
    new MutationObserver(() => {
      if (document.querySelector('canvas[data-confetti]')) (window as unknown as { __arrived: boolean }).__arrived = true;
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/confirmed');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __arrived: boolean }).__arrived)).toBe(true);
});
