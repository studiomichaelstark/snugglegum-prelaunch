import { expect, jsonResponse, LANDING_ROUTES, mockMailerLite, test, trackExternalRequests } from './fixtures';

const EMAIL_FIELD = '#newsletter-email-home';
const CONSENT_FIELD = '#newsletter-consent-home';

test.describe('newsletter form', () => {
  test('sends nothing before submit', async ({ consented: page, baseURL }) => {
    const external = trackExternalRequests(page, baseURL!);
    await page.goto('/');
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });

  test('the consent checkbox is not pre-ticked and links to the privacy policy', async ({ consented: page }) => {
    await page.goto('/');
    await expect(page.locator(CONSENT_FIELD)).not.toBeChecked();
    const label = page.locator(`label[for="newsletter-consent-home"]`);
    await expect(label.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    await expect(page.getByText('we email you a confirmation link first').first()).toBeVisible();
  });

  test('validates the email address and stays on the field', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    await page.locator(EMAIL_FIELD).fill('not-an-email');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();

    const alert = page.locator('#newsletter-error-home');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText('That email doesn’t look right. Check it and try again.');
    await expect(page.locator(EMAIL_FIELD)).toBeFocused();
    await expect(page.locator(EMAIL_FIELD)).toHaveAttribute('aria-invalid', 'true');
    expect(calls).toHaveLength(0);
  });

  test('requires consent', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();

    await expect(page.locator('#newsletter-error-home')).toHaveText(
      'Please confirm you are 18 or older and agree to the emails.',
    );
    await expect(page.locator(CONSENT_FIELD)).toBeFocused();
    expect(calls).toHaveLength(0);
  });

  test('success: posts the MailerLite fields and replaces the form', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await jsonResponse(route, { success: true });
    });
    await page.goto('/');
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();

    await expect(page.getByText('Sending…').first()).toBeVisible();
    await expect(page.getByText('Check your inbox and confirm your email.')).toHaveCount(1);
    await expect(page.locator('form[data-newsletter-form]:visible')).toHaveCount(0);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe('POST');
    const body = calls[0]?.body ?? '';
    expect(body).toContain('fields[email]');
    expect(body).toContain('anna@example.com');
    expect(body).toContain('ml-submit');
    expect(body).toContain('anticsrf');
    expect(body).not.toContain('website');
  });

  test('a filled honeypot looks like success but sends nothing', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    await page.locator(EMAIL_FIELD).fill('bot@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('#newsletter-website-home').evaluate((el: HTMLInputElement) => {
      el.value = 'spam';
    });
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();
    await expect(page.getByText('Check your inbox and confirm your email.').first()).toBeVisible();
    expect(calls).toHaveLength(0);
  });

  const failures = [
    {
      name: 'server error',
      respond: (route: Parameters<typeof jsonResponse>[0]) => jsonResponse(route, { message: 'boom' }, 500),
      message: 'Something went wrong on our side. Try again.',
    },
    {
      name: 'rate limit (HTTP 429)',
      respond: (route: Parameters<typeof jsonResponse>[0]) => jsonResponse(route, {}, 429),
      message: 'Too many tries in a row. Wait a moment and try again.',
    },
    {
      name: 'address already on the list',
      respond: (route: Parameters<typeof jsonResponse>[0]) =>
        jsonResponse(route, { success: false, errors: { fields: { email: ['This email is already subscribed.'] } } }),
      message: 'You’re already on the list. Welcome back.',
    },
    {
      name: 'address rejected by MailerLite',
      respond: (route: Parameters<typeof jsonResponse>[0]) =>
        jsonResponse(route, {
          success: false,
          errors: { fields: { email: ['The email field must be a valid email address.'] } },
        }),
      message: 'That email doesn’t look right. Check it and try again.',
    },
  ];

  for (const failure of failures) {
    test(`error state: ${failure.name}`, async ({ consented: page }) => {
      await mockMailerLite(page, failure.respond);
      await page.goto('/');
      await page.locator(EMAIL_FIELD).fill('anna@example.com');
      await page.locator(CONSENT_FIELD).check();
      await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();
      await expect(page.locator('#newsletter-error-home')).toHaveText(failure.message);
      await expect(page.locator('form[data-newsletter-form]:visible').first()).toBeVisible();
    });
  }

  test('error state: network failure', async ({ consented: page }) => {
    await mockMailerLite(page, (route) => route.abort('failed'));
    await page.goto('/');
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();
    await expect(page.locator('#newsletter-error-home')).toHaveText(
      'We couldn’t reach the list. Check your connection and try again.',
    );
  });

  test('the status and error regions are announced to assistive tech', async ({ consented: page }) => {
    await page.goto('/');
    await expect(page.locator('[data-success-slot]').first()).toHaveAttribute('role', 'status');
    await expect(page.locator('#newsletter-error-home')).toHaveAttribute('role', 'alert');
  });

  test('the product-line interest is optional', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    const form = page.locator('[data-newsletter-form]').first();
    await form.locator('input[type="email"]').fill('anna@example.com');
    await form.locator('input[name="consent"]').check();
    await form.locator('button[type="submit"]').click();

    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]?.body ?? '').not.toContain('product_interest');
  });

  for (const route of LANDING_ROUTES) {
    test(`${route}: the interest picker is centered above the email field`, async ({ consented: page }) => {
      await page.goto(route);
      const forms = page.locator('[data-newsletter-form]');
      for (let i = 0; i < (await forms.count()); i++) {
        const form = forms.nth(i);
        if (!(await form.isVisible())) continue;
        const picker = (await form.locator('fieldset:has(input[data-interest])').boundingBox())!;
        const email = (await form.locator('input[type="email"]').boundingBox())!;
        expect(picker.y + picker.height).toBeLessThanOrEqual(email.y);
        const chips = await form.locator('fieldset:has(input[data-interest]) label').evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
        const left = Math.min(...chips.map((c) => c.left));
        const right = Math.max(...chips.map((c) => c.right));
        expect(Math.abs((left + right) / 2 - (picker.x + picker.width / 2))).toBeLessThan(4);
      }
    });
  }
});
