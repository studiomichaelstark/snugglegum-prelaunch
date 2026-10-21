import { expect, test } from './fixtures';

test.describe('pouch tap on touch screens', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, 'Touch screens only; the desktop uses hover (csp.spec.ts).');
  });

  test('a tap enlarges the pouch, bursts confetti and settles back', async ({ consented: page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const pouch = page.locator('#lines [data-pouch]').first();
    await pouch.scrollIntoViewIfNeeded();
    const small = (await pouch.boundingBox())!.width;

    await pouch.tap();
    await expect(pouch).toHaveAttribute('data-popped', '');
    await expect(page.locator('canvas[data-confetti]').first()).toBeAttached();
    await expect.poll(async () => (await pouch.boundingBox())!.width).toBeGreaterThan(small * 1.4);

    await expect(pouch).not.toHaveAttribute('data-popped', '', { timeout: 6000 });
    await expect.poll(async () => (await pouch.boundingBox())!.width).toBeLessThan(small * 1.05);
  });

  test('only one pouch is big at a time', async ({ consented: page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const pouches = page.locator('#lines [data-pouch]');
    await pouches.nth(0).scrollIntoViewIfNeeded();
    await pouches.nth(0).tap();
    await pouches.nth(1).scrollIntoViewIfNeeded();
    await pouches.nth(1).tap();
    await expect(pouches.nth(1)).toHaveAttribute('data-popped', '');
    await expect(pouches.nth(0)).not.toHaveAttribute('data-popped', '');
  });
});
