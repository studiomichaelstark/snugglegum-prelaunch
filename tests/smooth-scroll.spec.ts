import { expect, test } from './fixtures';

test.describe('smooth scrolling (Lenis)', () => {
  test('on desktop the wheel glides: many small steps instead of one jump', async ({ consented: page, isMobile }) => {
    test.skip(isMobile, 'Touch devices keep their native momentum scrolling.');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    await page.evaluate(() => {
      (window as unknown as { __y: number[] }).__y = [];
      const sample = () => {
        (window as unknown as { __y: number[] }).__y.push(Math.round(window.scrollY));
        requestAnimationFrame(sample);
      };
      sample();
    });
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(550);
    const positions = await page.evaluate(() => (window as unknown as { __y: number[] }).__y);
    const moving = new Set(positions.filter((y) => y > 0 && y < 600));
    // A native wheel step lands in one or two frames; a glide passes through many positions on its way.
    expect(moving.size).toBeGreaterThan(5);
  });

  test('anchor links glide and still arrive', async ({ consented: page, isMobile }) => {
    test.skip(isMobile, 'Touch devices keep their native scrolling.');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.locator('#hero a[href="#newsletter-home"]').click();
    await expect
      .poll(() => page.evaluate(() => Math.abs(document.querySelector('#newsletter-home')!.getBoundingClientRect().top)), { timeout: 8000 })
      .toBeLessThan(5);
  });

  test('reduced motion: no Lenis, native scrolling', async ({ consented: page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).not.toHaveClass(/lenis/);
  });

  test('touch devices: no Lenis', async ({ consented: page, isMobile }) => {
    test.skip(!isMobile, 'Desktop only.');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).not.toHaveClass(/lenis/);
  });

  test('a dialog scrolls on its own, and the page behind stays put', async ({ consented: page, isMobile }) => {
    test.skip(isMobile, 'The wheel is a desktop input.');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 500 });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);
    // The Supplement Facts button is switched off on the page, so open the dialog the way the button did.
    await page.evaluate(() => {
      const trigger = document.createElement('button');
      trigger.dataset.dialogOpen = 'supplement-facts';
      trigger.textContent = 'open';
      trigger.id = 'test-open-facts';
      document.body.append(trigger);
    });
    await page.locator('#test-open-facts').click();
    const dialog = page.getByRole('dialog', { name: 'Supplement Facts' });
    await expect(dialog).toBeVisible();
    const before = await page.evaluate(() => window.scrollY);
    await dialog.hover();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => dialog.evaluate((el) => el.scrollTop)).toBeGreaterThan(50);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });
});
