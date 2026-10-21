import { readFileSync } from 'node:fs';
import { expect, jsonResponse, mockMailerLite, ROUTES, test } from './fixtures';

const headers = readFileSync('public/_headers', 'utf8');
const csp = /Content-Security-Policy:\s*(.+)/.exec(headers)?.[1]?.trim() ?? '';

test.describe('Content Security Policy (public/_headers)', () => {
  test('is strict and allows only self, the MailerLite endpoint and Cloudflare Turnstile', () => {
    expect(csp).not.toBe('');
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    expect(csp).toContain("default-src 'none'");
    expect(csp).toMatch(/script-src 'self' https:\/\/challenges\.cloudflare\.com(;|$)/);
    expect(csp).toMatch(/frame-src https:\/\/challenges\.cloudflare\.com(;|$)/);
    expect(csp).toMatch(/connect-src 'self' https:\/\/assets\.mailerlite\.com https:\/\/challenges\.cloudflare\.com(;|$)/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(headers).toMatch(/Referrer-Policy:/);
    expect(headers).toMatch(/Permissions-Policy:/);
    expect(headers).toMatch(/X-Content-Type-Options:\s*nosniff/);
  });

  test('every page works under the CSP without a single violation', async ({ page, context }) => {
    // The preview server does not apply _headers, so apply the policy here. localhost is not HTTPS.
    const policy = csp.replace('upgrade-insecure-requests', '').replace(/;\s*;/g, ';');
    await context.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': policy } });
    });
    await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.addInitScript(() => {
      (window as unknown as { __violations: string[] }).__violations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        (window as unknown as { __violations: string[] }).__violations.push(`${event.violatedDirective} ${event.blockedURI}`);
      });
    });

    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Exercise the dialog and, on every route that has one, the newsletter form.
      await expect(page.getByRole('dialog', { name: 'Cookies, briefly' })).toBeVisible();
      await page.getByRole('button', { name: 'Customize' }).click();
      await page.getByRole('button', { name: 'Save choices' }).click();
      const form = page.locator('[data-newsletter][data-live="true"]').first();
      if (await form.count()) {
        await form.locator('input[data-interest]').first().check();
        await form.locator('input[data-flavor]').first().check();
        await form.locator('input[type="email"]').fill('anna@example.com');
        await form.locator('input[name="consent"]').check();
        await form.locator('button[type="submit"]').click();
        await expect(page.getByText('Check your inbox and confirm your email.').first()).toBeVisible();
      }
      const violations = await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);
      expect(violations, route).toEqual([]);
      await page.evaluate(() => window.localStorage.clear());
    }
  });

  test('the playful pages, the confetti and the pouch effects work under the CSP without a violation', async ({ page, context, isMobile }) => {
    const policy = csp.replace('upgrade-insecure-requests', '').replace(/;\s*;/g, ';');
    await context.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': policy } });
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      window.localStorage.setItem('sg-cookie-consent', JSON.stringify({ version: 1, timestamp: new Date().toISOString(), categories: { analytics: false, marketing: false } }));
      (window as unknown as { __violations: string[] }).__violations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        (window as unknown as { __violations: string[] }).__violations.push(`${event.violatedDirective} ${event.blockedURI}`);
      });
    });
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 5 }));
    for (const route of ['/thank-you-newsletter', '/confirmed', '/unsubscribed', '/no-such-page']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.locator('[data-pop-gummy]').click();
      await expect(page.locator('canvas[data-confetti]').first()).toBeAttached();
      const violations = await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations);
      expect(violations, route).toEqual([]);
    }
    if (!isMobile) {
      await page.goto('/');
      await page.locator('#lines [data-pouch]').first().scrollIntoViewIfNeeded();
      // The mouse is still where the last click left it; a hover only counts when the pointer actually enters.
      await page.mouse.move(1, 1);
      // The confetti only lives for about a second, and a hover can take Playwright much longer to return in
      // slow browsers: record the burst when it happens instead of looking for it afterwards.
      await page.evaluate(() => {
        (window as unknown as { __burst: boolean }).__burst = false;
        new MutationObserver(() => {
          if (document.querySelector('canvas[data-confetti]')) (window as unknown as { __burst: boolean }).__burst = true;
        }).observe(document.body, { childList: true });
      });
      await page.locator('#lines [data-pouch]').first().hover();
      await expect.poll(() => page.evaluate(() => (window as unknown as { __burst: boolean }).__burst)).toBe(true);
      expect(await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations), '/').toEqual([]);
    }
  });
});
