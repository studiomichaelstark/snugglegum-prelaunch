import { expect, test } from './fixtures';

test.describe('hero illustration: hidden while the mouse button is held', () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, 'Desktop only.');
  });

  test('hides on press, comes back on release, and does not move the layout', async ({ consented: page }) => {
    await page.goto('/');
    const gummy = page.locator('#hero [data-hero-gummy]');
    const image = gummy.locator('img');
    await image.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    const before = (await gummy.boundingBox())!;
    const box = (await image.boundingBox())!;
    // The middle of the gummy ball (right of center in the picture).
    const x = box.x + box.width * 0.72;
    const y = box.y + box.height * 0.55;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(gummy).toHaveCSS('visibility', 'hidden');
    expect(await gummy.boundingBox()).toEqual(before);

    await page.mouse.move(x - 400, y);
    await expect(gummy).toHaveCSS('visibility', 'hidden');
    await page.mouse.up();
    await expect(gummy).toHaveCSS('visibility', 'visible');
  });

  test('a press on the transparent corner (bottom left) of the picture keeps it visible', async ({ consented: page }) => {
    await page.goto('/');
    const gummy = page.locator('#hero [data-hero-gummy]');
    const image = gummy.locator('img');
    await image.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    const box = (await image.boundingBox())!;

    await page.mouse.move(box.x + box.width * 0.02, box.y + box.height * 0.97);
    await page.mouse.down();
    await expect(gummy).toHaveCSS('visibility', 'visible');
    await page.mouse.up();
  });
});
