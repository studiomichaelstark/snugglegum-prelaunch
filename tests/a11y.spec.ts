import AxeBuilder from '@axe-core/playwright';
import { expect, ROUTES, test } from './fixtures';

const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function scan(page: import('@playwright/test').Page) {
  // Let one-shot animations (the modal slide-in fades its opacity) finish, or axe measures a half-transparent dialog.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
  );
  const results = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => `${n.target.join(' ')} :: ${n.failureSummary?.split('\n')[1] ?? ''}`),
  }));
}

test.describe('accessibility (WCAG 2.2 AA via axe)', () => {
  for (const route of ROUTES) {
    test(`${route}: no violations`, async ({ consented: page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(await scan(page)).toEqual([]);
    });

    test(`${route}: no violations with the cookie modal open`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('dialog', { name: 'Cookies, briefly' })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test(`${route}: no violations with the cookie details expanded`, async ({ consented: page }) => {
      await page.goto(route);
      await page.getByRole('button', { name: 'Cookie settings' }).last().click();
      await expect(page.getByRole('dialog', { name: 'Cookies, briefly' })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });
  }

  test('/: no violations with the Supplement Facts dialog open', async ({ consented: page }) => {
    await page.goto('/');
    await page.locator('button[data-dialog-open]').first().click();
    await expect(page.getByRole('dialog', { name: 'Supplement Facts' })).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });

  test('/: no violations with an FAQ answer open and the error message shown', async ({ consented: page }) => {
    await page.goto('/');
    await page.locator('#faq summary').first().click();
    await page.locator('form:has(#newsletter-email-hero) button[type="submit"]').click();
    await expect(page.locator('#newsletter-error-hero')).toBeVisible();
    expect(await scan(page)).toEqual([]);
  });
});

test.describe('keyboard and motion', () => {
  test('skip link is the first tab stop and jumps to main content', async ({ consented: page, browserName }) => {
    // Safari's default is to Tab past links (Option+Tab reaches them), so a plain Tab never lands on the skip link.
    test.skip(browserName === 'webkit', 'Safari does not Tab to links by default.');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('every interactive element on the home page is reachable by keyboard and shows a focus outline', async ({ consented: page }) => {
    await page.goto('/');
    const seen = new Set<string>();
    for (let i = 0; i < 60; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return {
          key: `${el.tagName}:${el.id || el.textContent?.trim().slice(0, 30) || el.getAttribute('href')}`,
          outlineWidth: parseFloat(style.outlineWidth),
          outlineStyle: style.outlineStyle,
          visible: el.getClientRects().length > 0,
        };
      });
      if (!info) continue;
      expect(info.visible, info.key).toBe(true);
      expect(info.outlineStyle, `${info.key} outline style`).not.toBe('none');
      expect(info.outlineWidth, `${info.key} outline width`).toBeGreaterThanOrEqual(2);
      seen.add(info.key);
    }
    expect(seen.size).toBeGreaterThan(15);
  });

  test('prefers-reduced-motion switches every animation off', async ({ consented: page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const animated = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('body *'))
        .filter((el) => getComputedStyle(el).animationName !== 'none')
        .map((el) => `${el.tagName}.${el.className}`.slice(0, 80)),
    );
    expect(animated).toEqual([]);
  });

  test('without reduced motion the decorative animations do run', async ({ consented: page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const marquee = page.locator('.marquee-track');
    await expect(marquee).toHaveCSS('animation-name', 'sg-marquee');
  });

  test('touch targets: buttons and links are at least 24x24 CSS pixels', async ({ consented: page }) => {
    await page.goto('/');
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('button, a[href], input:not([type="hidden"])'))
        .filter((el) => el.getClientRects().length > 0 && !el.closest('[aria-hidden="true"]') && !el.closest('.sr-only'))
        .filter((el) => el.tagName !== 'A' || getComputedStyle(el).display !== 'inline')
        .map((el) => ({ el: `${el.tagName}#${el.id}:${el.textContent?.trim().slice(0, 20)}`, ...el.getBoundingClientRect().toJSON() }))
        .filter((box) => box.width < 24 || box.height < 24)
        .map((box) => `${box.el} ${Math.round(box.width)}x${Math.round(box.height)}`),
    );
    expect(small).toEqual([]);
  });
});
