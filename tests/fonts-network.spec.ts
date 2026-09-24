import { expect, ROUTES, test, trackExternalRequests } from './fixtures';

test.describe('fonts and network', () => {
  for (const route of ROUTES) {
    test(`${route}: only local requests, only local fonts`, async ({ consented: page, baseURL }) => {
      const external = trackExternalRequests(page, baseURL!);
      const fonts: string[] = [];
      page.on('request', (request) => {
        if (request.resourceType() === 'font') fonts.push(request.url());
      });

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      expect(external).toEqual([]);
      expect(fonts.length).toBeGreaterThan(0);
      for (const url of fonts) {
        expect(new URL(url).origin).toBe(new URL(baseURL!).origin);
        expect(url).toMatch(/\.woff2$/);
      }
      expect(await page.evaluate(() => document.fonts.check('900 20px Archivo'))).toBe(true);
    });
  }

  test('the critical font is preloaded and no page references Google Fonts or a CDN', async ({ request }) => {
    for (const route of ROUTES) {
      const html = await (await request.get(route)).text();
      expect(html).toMatch(/<link rel="preload" href="\/_astro\/archivo[^"]+\.woff2" as="font" type="font\/woff2" crossorigin/);
      expect(html).not.toMatch(/fonts\.googleapis|fonts\.gstatic|cdn\.|unpkg|jsdelivr|cdnjs/i);
    }
  });

  test('MailerLite is contacted only after the form is submitted', async ({ consented: page, baseURL }) => {
    const external = trackExternalRequests(page, baseURL!);
    await page.route('https://assets.mailerlite.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"success":true}' }),
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);

    const form = page.locator('[data-newsletter][data-live="true"]').first();
    await form.locator('input[data-interest]').first().check();
    await form.locator('input[type="email"]').fill('anna@example.com');
    await form.locator('input[name="consent"]').check();
    await form.locator('button[type="submit"]').click();
    await expect.poll(() => external.length).toBe(1);
    expect(new URL(external[0]!).host).toBe('assets.mailerlite.com');
  });
});
