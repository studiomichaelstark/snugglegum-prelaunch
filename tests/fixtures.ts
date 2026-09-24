import { expect, test as base, type BrowserContext, type Page, type Route } from '@playwright/test';

export { expect };

export const CONSENT_KEY = 'sg-cookie-consent';
export const ROUTES = ['/', '/close-contact', '/male-vitality', '/beauty', '/imprint', '/privacy'] as const;
/** Routes with their own <h1> and hero — homepage plus every product page. */
export const PRODUCT_ROUTES = ['/', '/close-contact', '/male-vitality', '/beauty'] as const;
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
