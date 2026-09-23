import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Resolves a CSS custom property from colors.css to the rgb() string the browser computes. */
async function token(page: Page, name: string): Promise<string> {
  return page.evaluate((variable) => {
    const probe = document.createElement('i');
    probe.style.color = `var(${variable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);
}

const paint = (locator: Locator) =>
  locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, border: style.borderTopColor, text: style.color };
  });

test.describe('button hover: white background, dark green border', () => {
  // Touch devices have no hover, and Tailwind only applies hover styles where (hover: hover) matches.
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, 'No hover on touch devices.');
  });

  const cases: { name: string; route?: string; open?: 'cookie'; find: (page: Page) => Locator }[] = [
    { name: 'hero submit', route: '/body-fresh', find: (p) => p.locator('form:has(#newsletter-email-hero) button[type="submit"]') },
    { name: 'offer call to action', find: (p) => p.locator('#offer').getByRole('link', { name: 'Get on the list' }) },
    { name: 'final call to action submit', route: '/body-fresh', find: (p) => p.locator('form:has(#newsletter-email-final) button[type="submit"]') },
    { name: 'bottom bar call to action', find: (p) => p.locator('footer').getByRole('link', { name: 'Get on the list' }) },
    { name: 'cookie modal "Accept all"', open: 'cookie', find: (p) => p.getByRole('button', { name: 'Accept all' }) },
  ];

  for (const { name, route = '/', open, find } of cases) {
    test(name, async ({ page, context }) => {
      if (open !== 'cookie') {
        const { preConsent } = await import('./fixtures');
        await preConsent(context);
      }
      await page.goto(route);
      const button = find(page);
      await button.scrollIntoViewIfNeeded();

      const white = await token(page, '--color-surface');
      const green = await token(page, '--color-brand-green');
      expect((await paint(button)).background, 'not white at rest').not.toBe(white);

      await button.hover();
      await expect.poll(async () => paint(button)).toEqual({ background: white, border: green, text: green });
    });
  }
});
