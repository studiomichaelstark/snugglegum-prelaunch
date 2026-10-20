import AxeBuilder from '@axe-core/playwright';
import { expect, jsonResponse, test } from './fixtures';

const PAGE = '/thank-you-newsletter';
const NUMBER_KEY = 'sg-founding-number';

test.describe('thank-you page', () => {
  test('is reachable with and without .html, is noindex, and stays out of the sitemap', async ({ consented: page, request }) => {
    expect((await request.get(PAGE)).ok()).toBe(true);
    expect((await request.get(`${PAGE}.html`)).ok()).toBe(true);
    await page.goto(PAGE);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Pop! You’re in.');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    const sitemap = await (await request.get('/sitemap-0.xml')).text();
    expect(sitemap).not.toContain('thank-you');
  });

  test('a direct visit shows the blank ticket and no counter, and nothing breaks', async ({ consented: page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text());
    });
    await page.route('**/api/count', (route) => route.fulfill({ status: 404, body: 'not found' }));
    await page.goto(PAGE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-ticket-number]')).toHaveText('No. ___ of 500');
    await expect(page.locator('[data-success-number]')).toContainText('feeling shy');
    await expect(page.locator('[data-signup-count]')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Check your inbox and confirm your email.' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('shows the founding number from the sign-up and the count with a thousands comma', async ({ consented: page }) => {
    await page.addInitScript(([key]) => window.sessionStorage.setItem(key as string, '42'), [NUMBER_KEY]);
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 1234 }));
    await page.goto(PAGE);
    await expect(page.locator('[data-ticket-number]')).toHaveText('No. 042 of 500');
    await expect(page.locator('[data-success-number]')).toContainText('You’re No. 042 of 500');
    await expect(page.locator('[data-signup-count]')).toHaveText('1,234 sign-ups so far');
  });

  test('exactly one sign-up reads "1 sign-up so far"', async ({ consented: page }) => {
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 1 }));
    await page.goto(PAGE);
    await expect(page.locator('[data-signup-count]')).toHaveText('1 sign-up so far');
  });

  test('the larger of the count and the founding number wins, and above 500 it is the waitlist', async ({ consented: page }) => {
    await page.addInitScript(([key]) => window.sessionStorage.setItem(key as string, '600'), [NUMBER_KEY]);
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 580 }));
    await page.goto(PAGE);
    await expect(page.locator('[data-ticket-number]')).toHaveText('Waitlist');
    await expect(page.locator('[data-success-number]')).toContainText('waitlist');
    await expect(page.locator('[data-signup-count]')).toHaveText('600 sign-ups so far');
  });

  test('confetti pops on arrival and when the gummy is poked, and never under reduced motion', async ({ consented: page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      (window as unknown as { __canvases: number }).__canvases = 0;
      // One canvas is reused for every burst, so count the bursts: each one sets data-pieces on it.
      new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-pieces') (window as unknown as { __canvases: number }).__canvases++;
        }
      }).observe(document, { attributes: true, attributeFilter: ['data-pieces'], subtree: true });
    });
    await page.goto(PAGE);
    const canvases = () => page.evaluate(() => (window as unknown as { __canvases: number }).__canvases);
    await expect.poll(canvases).toBe(1);
    await page.getByRole('button', { name: /poke the gummy/i }).click();
    await expect.poll(canvases).toBe(2);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(PAGE);
    await page.getByRole('button', { name: /poke the gummy/i }).click();
    await page.waitForTimeout(700);
    await expect(page.locator('canvas[data-confetti]')).toHaveCount(0);
  });

  test('"Another one" cycles through the fun facts, one at a time', async ({ consented: page }) => {
    await page.goto(PAGE);
    const visible = page.locator('[data-quip]:not([hidden])');
    await expect(visible).toHaveCount(1);
    const first = await visible.textContent();
    await page.getByRole('button', { name: 'Another one' }).click();
    await expect(visible).toHaveCount(1);
    expect(await visible.textContent()).not.toBe(first);
  });

  test('has the share button and a way back home', async ({ consented: page }) => {
    await page.goto(PAGE);
    await expect(page.getByRole('button', { name: 'Tell a friend with a sweet tooth' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Take me back to the gummies' })).toHaveAttribute('href', '/');
  });

  test('no accessibility violations (WCAG 2.2 AA)', async ({ consented: page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(PAGE);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });

  test('mobile: no horizontal overflow', async ({ consented: page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(PAGE);
    const [scrollWidth, clientWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
