import { expect, test as base, type BrowserContext, type Page, type Route } from '@playwright/test';

export { expect };

export const CONSENT_KEY = 'sg-cookie-consent';
export const ROUTES = ['/', '/imprint', '/privacy'] as const;
/** Pages that carry the founding-member signup. */
export const LANDING_ROUTES = ['/'] as const;
/** Short names of the three versions, as used in the interest checkboxes. */
export const LINES = [
  { id: 'gen-z', name: 'Gen Z', ages: 'Ages 18 to 29' },
  { id: 'millennials', name: 'Millennials', ages: 'Ages 30 to 45' },
  { id: 'boomer', name: 'Boomer', ages: 'Ages 62 to 80' },
] as const;
export const MAILERLITE_URL = 'https://assets.mailerlite.com/**';

/** Skips the first-visit cookie modal by storing a "rejected" choice before any page script runs. */
export async function preConsent(context: BrowserContext): Promise<void> {
  await context.addInitScript(
    ([key]) => {
      window.localStorage.setItem(
        key as string,
        JSON.stringify({ version: 1, timestamp: new Date().toISOString(), categories: { analytics: false, marketing: false } }),
      );
    },
    [CONSENT_KEY],
  );
}

/** Collects every request whose origin differs from the site's origin. */
export function trackExternalRequests(page: Page, baseURL: string): string[] {
  const external: string[] = [];
  const origin = new URL(baseURL).origin;
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) return;
    if (new URL(url).origin !== origin) external.push(url);
  });
  return external;
}

export interface MailerLiteCall {
  method: string;
  body: string;
}

/** Mocks the MailerLite endpoint. Returns the list of calls it received. */
export async function mockMailerLite(
  page: Page,
  respond: (route: Route) => Promise<void> | void,
): Promise<MailerLiteCall[]> {
  const calls: MailerLiteCall[] = [];
  await page.route(MAILERLITE_URL, async (route) => {
    const request = route.request();
    calls.push({ method: request.method(), body: request.postData() ?? '' });
    await respond(route);
  });
  return calls;
}

export const jsonResponse = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });

export const test = base.extend<{ consented: Page }>({
  /** A page with consent already stored, so the modal does not cover the content. */
  consented: async ({ page, context }, use) => {
    await preConsent(context);
    await use(page);
  },
});

/** Ticks what the sign-up form requires besides email and consent: one version and one flavor. */
export async function pickRequired(page: Page): Promise<void> {
  await page.locator('#newsletter-home input[data-interest]').first().check();
  await page.locator('#newsletter-home input[data-flavor="pineapple"]').check();
}
