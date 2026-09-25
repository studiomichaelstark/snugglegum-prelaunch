import { expect, ROUTES, test } from './fixtures';

test.describe('brand name with trademark sign', () => {
  for (const route of ROUTES) {
    test(`${route}: the sign is small, raised and stays inside the running text`, async ({ consented: page }) => {
      await page.goto(route);
      const signs = await page.locator('span.tm').evaluateAll((els) =>
        els.map((el) => {
          const style = getComputedStyle(el);
          const parent = getComputedStyle(el.parentElement!);
          return {
            text: el.textContent,
            previous: el.previousSibling?.textContent?.slice(-10) ?? '',
            smaller: parseFloat(style.fontSize) < parseFloat(parent.fontSize),
            raised: parseFloat(style.top) < 0,
            parentDisplay: parent.display,
          };
        }),
      );

      for (const sign of signs) {
        expect(sign.text).toBe('™');
        expect(sign.previous).toMatch(/Snugglegum$/);
        expect(sign.smaller).toBe(true);
        expect(sign.raised).toBe(true);
        // A flex/grid parent would turn the sign into its own item and add the container's gap around it.
        expect(sign.parentDisplay).not.toMatch(/flex|grid/);
      }
    });
  }

  test('the back link reads "All Snugglegum™ products" as one name', async ({ consented: page }) => {
    await page.goto('/close-contact');
    await expect(page.getByRole('link', { name: 'All Snugglegum™ products' })).toHaveAttribute('href', '/');
  });
});
