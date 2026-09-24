import { readFileSync } from 'node:fs';
import { expect, jsonResponse, mockMailerLite, ROUTES, test } from './fixtures';

const headers = readFileSync('public/_headers', 'utf8');
const csp = /Content-Security-Policy:\s*(.+)/.exec(headers)?.[1]?.trim() ?? '';

test.describe('Content Security Policy (public/_headers)', () => {
  test('is strict and allows only self plus the MailerLite endpoint', () => {
    expect(csp).not.toBe('');
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toMatch(/connect-src 'self' https:\/\/assets\.mailerlite\.com(;|$)/);
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
});
