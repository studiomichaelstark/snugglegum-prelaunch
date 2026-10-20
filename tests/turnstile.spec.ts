import { expect, jsonResponse, test } from './fixtures';

// The optional bot check is built in only when PUBLIC_TURNSTILE_SITE_KEY is set at build time:
//   PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA SKIP_FIREFOX=1 pnpm exec playwright test tests/turnstile.spec.ts
// (1x00000000000000000000AA is Cloudflare's published test key). Without the variable these tests are skipped.
test.skip(!process.env.PUBLIC_TURNSTILE_SITE_KEY, 'Turnstile is off in this build.');

const API = '**/challenges.cloudflare.com/turnstile/v0/api.js*';
// A stand-in for Cloudflare's script: renders instantly and hands out a numbered token.
const STUB = `
  window.__renders = 0; window.__resets = 0;
  window.turnstile = {
    render(container, options) { window.__renders++; const n = window.__renders; setTimeout(() => options.callback('stub-token-' + n), 30); return 'w' + n; },
    reset() { window.__resets++; },
  };
`;

test.describe('Turnstile bot check (when switched on)', () => {
  test('Cloudflare is contacted only once someone touches the form, and the token travels with the sign-up', async ({ consented: page }) => {
    let scriptRequests = 0;
    await page.route(API, (route) => {
      scriptRequests++;
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
    });
    let posted = '';
    await page.route('**/api/signup', (route) => {
      posted = route.request().postData() ?? '';
      return jsonResponse(route, { ok: true, number: 4 });
    });
    await page.route('**/api/count', (route) => route.abort());
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(scriptRequests).toBe(0);
    await expect(page.locator('[data-turnstile]').first()).toHaveAttribute('data-sitekey', /.+/);

    await page.locator('#newsletter-email-home').fill('anna@example.com');
    await page.locator('#newsletter-consent-home').check();
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();
    await expect(page).toHaveURL(/\/thank-you-newsletter$/);
    expect(scriptRequests).toBe(1);
    expect(posted).toMatch(/name="cf-turnstile-response"\s*[\r\n]+\s*stub-token-1/);
  });

  test('a failed check shows its own message and asks for a fresh token for the next try', async ({ consented: page }) => {
    await page.route(API, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: STUB }));
    await page.route('**/api/signup', (route) => jsonResponse(route, { ok: false, error: 'x', challenge: true }, 403));
    await page.goto('/');
    await page.locator('#newsletter-email-home').fill('anna@example.com');
    await page.locator('#newsletter-consent-home').check();
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();
    await expect(page.locator('#newsletter-error-home')).toHaveText('We couldn’t check that you’re human. Please try again.');
    expect(await page.evaluate(() => (window as unknown as { __resets: number }).__resets)).toBe(1);
  });

  test('if Cloudflare cannot be reached the form still sends (the server decides) and nothing hangs', async ({ consented: page }) => {
    await page.route(API, (route) => route.abort());
    let posted = '';
    await page.route('**/api/signup', (route) => {
      posted = route.request().postData() ?? '';
      return jsonResponse(route, { ok: false, error: 'x', challenge: true }, 403);
    });
    await page.goto('/');
    await page.locator('#newsletter-email-home').fill('anna@example.com');
    await page.locator('#newsletter-consent-home').check();
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();
    await expect(page.locator('#newsletter-error-home')).toBeVisible();
    expect(posted).not.toContain('cf-turnstile-response');
  });
});
