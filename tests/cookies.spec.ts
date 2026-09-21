import { expect, test, trackExternalRequests, CONSENT_KEY } from './fixtures';

test.describe('cookies and consent', () => {
  test('sets no cookies and makes no external request before any choice', async ({ page, context, baseURL }) => {
    const external = trackExternalRequests(page, baseURL!);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('dialog', { name: 'Cookies, briefly' })).toBeVisible();
    expect(await page.evaluate(() => document.cookie)).toBe('');
    expect(await context.cookies()).toEqual([]);
    expect(external).toEqual([]);
    expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).toBeNull();
  });

  test('"Reject all" stores the choice, and zero cookies and external requests remain after a reload', async ({
    page,
    context,
    baseURL,
  }) => {
    const external = trackExternalRequests(page, baseURL!);
    await page.goto('/');
    await page.getByRole('button', { name: 'Reject all' }).click();
    await expect(page.getByRole('dialog', { name: 'Cookies, briefly' })).toBeHidden();

    const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? 'null'), CONSENT_KEY);
    expect(stored).toMatchObject({ version: 1, categories: { analytics: false, marketing: false } });
    expect(new Date(stored.timestamp).toString()).not.toBe('Invalid Date');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('dialog', { name: 'Cookies, briefly' })).toBeHidden();
    expect(await page.evaluate(() => document.cookie)).toBe('');
    expect(await context.cookies()).toEqual([]);
    expect(external).toEqual([]);
  });

  test('"Accept all" follows the configured categories (none are enabled, so nothing optional runs)', async ({
    page,
    context,
    baseURL,
  }) => {
    const external = trackExternalRequests(page, baseURL!);
    await page.goto('/');

    // A consent-gated script for a category that is not enabled must stay inert.
    await page.evaluate(() => {
      const gated = document.createElement('script');
      gated.type = 'text/plain';
      gated.dataset.consent = 'analytics';
      gated.text = 'window.__gateProbe = true;';
      document.body.append(gated);
    });

    await page.getByRole('button', { name: 'Accept all' }).click();
    await page.waitForLoadState('networkidle');

    const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? 'null'), CONSENT_KEY);
    expect(stored.categories).toEqual({ analytics: false, marketing: false });
    expect(await page.evaluate(() => (window as unknown as { __gateProbe?: boolean }).__gateProbe)).toBeUndefined();
    expect(await page.evaluate(() => document.cookie)).toBe('');
    expect(await context.cookies()).toEqual([]);
    expect(external).toEqual([]);
  });

  test('a stored choice with an old version is ignored and asked again', async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, JSON.stringify({ version: 0, timestamp: new Date().toISOString(), categories: {} }));
    }, CONSENT_KEY);
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: 'Cookies, briefly' })).toBeVisible();
  });
});
