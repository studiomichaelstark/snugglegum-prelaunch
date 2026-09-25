import { expect, ROUTES, test } from './fixtures';

test.describe('back-to-top button', () => {
  for (const route of ROUTES) {
    test(`${route}: stays in the bottom-right corner and scrolls back to the top`, async ({ consented: page }) => {
      await page.goto(route);
      const button = page.getByRole('link', { name: 'Back to top' });
      await expect(button.locator('svg')).toHaveCount(1);

      const viewport = page.viewportSize()!;
      const cornerGap = async () => {
        const box = (await button.boundingBox())!;
        return { right: viewport.width - (box.x + box.width), bottom: viewport.height - (box.y + box.height) };
      };

      // Same corner position at the top of the page and after scrolling down.
      await expect(button).toBeVisible();
      const atTop = await cornerGap();
      expect(atTop.right).toBeGreaterThanOrEqual(0);
      expect(atTop.right).toBeLessThan(40);
      expect(atTop.bottom).toBeGreaterThanOrEqual(0);
      expect(atTop.bottom).toBeLessThan(40);

      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      expect(await cornerGap()).toEqual(atTop);

      await button.click();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    });
  }
});
