import { expect, jsonResponse, mockMailerLite, test, trackExternalRequests } from './fixtures';

const EMAIL_FIELD = '#newsletter-email-hero';
const CONSENT_FIELD = '#newsletter-consent-hero';

test.describe('newsletter form', () => {
  test('sends nothing before submit', async ({ consented: page, baseURL }) => {
    const external = trackExternalRequests(page, baseURL!);
    await page.goto('/close-contact');
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });

  test('the consent checkbox is not pre-ticked and links to the privacy policy', async ({ consented: page }) => {
    await page.goto('/close-contact');
    await expect(page.locator(CONSENT_FIELD)).not.toBeChecked();
    const label = page.locator(`label[for="newsletter-consent-hero"]`);
    await expect(label.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    await expect(page.getByText('we email you a confirmation link first').first()).toBeVisible();
  });

  test('validates the email address and stays on the field', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/close-contact');
    await page.locator(EMAIL_FIELD).fill('not-an-email');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('form:has(#newsletter-email-hero) button[type="submit"]').click();

    const alert = page.locator('#newsletter-error-hero');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText('That email doesn’t look right. Check it and try again.');
    await expect(page.locator(EMAIL_FIELD)).toBeFocused();
    await expect(page.locator(EMAIL_FIELD)).toHaveAttribute('aria-invalid', 'true');
    expect(calls).toHaveLength(0);
  });

  test('requires consent', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/close-contact');
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator('form:has(#newsletter-email-hero) button[type="submit"]').click();

    await expect(page.locator('#newsletter-error-hero')).toHaveText(
      'Please confirm you agree to the emails.',
    );
    await expect(page.locator(CONSENT_FIELD)).toBeFocused();
    expect(calls).toHaveLength(0);
  });

  test('success: posts the MailerLite fields and replaces both forms', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await jsonResponse(route, { success: true });
    });
    await page.goto('/close-contact');
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('form:has(#newsletter-email-hero) button[type="submit"]').click();

    await expect(page.getByText('Sending…').first()).toBeVisible();
    await expect(page.getByText('Check your inbox and confirm your email.')).toHaveCount(2);
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
    await page.goto('/close-contact');
    await page.locator(EMAIL_FIELD).fill('bot@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('#newsletter-website-hero').evaluate((el: HTMLInputElement) => {
      el.value = 'spam';
    });
    await page.locator('form:has(#newsletter-email-hero) button[type="submit"]').click();
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
      message: 'You’re already on the list. Nice taste.',
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
      await page.goto('/close-contact');
      await page.locator(EMAIL_FIELD).fill('anna@example.com');
      await page.locator(CONSENT_FIELD).check();
      await page.locator('form:has(#newsletter-email-hero) button[type="submit"]').click();
      await expect(page.locator('#newsletter-error-hero')).toHaveText(failure.message);
      await expect(page.locator('form[data-newsletter-form]:visible').first()).toBeVisible();
    });
  }

  test('error state: network failure', async ({ consented: page }) => {
    await mockMailerLite(page, (route) => route.abort('failed'));
    await page.goto('/close-contact');
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('form:has(#newsletter-email-hero) button[type="submit"]').click();
    await expect(page.locator('#newsletter-error-hero')).toHaveText(
      'We couldn’t reach the list. Check your connection and try again.',
    );
  });

  test('the second form (final call to action) works the same way', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/close-contact');
    await page.locator('#newsletter-email-final').fill('lea@example.com');
    await page.locator('#newsletter-consent-final').check();
    await page.locator('form:has(#newsletter-email-final) button[type="submit"]').click();
    await expect(page.getByText('Check your inbox and confirm your email.')).toHaveCount(2);
    expect(calls).toHaveLength(1);
  });

  test('the status and error regions are announced to assistive tech', async ({ consented: page }) => {
    await page.goto('/close-contact');
    await expect(page.locator('[data-success-slot]').first()).toHaveAttribute('role', 'status');
    await expect(page.locator('#newsletter-error-hero')).toHaveAttribute('role', 'alert');
  });

  test('requires at least one product interest', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    const form = page.locator('[data-newsletter-form]').first();
    await form.locator('input[type="email"]').fill('anna@example.com');
    await form.locator('input[name="consent"]').check();
    await form.locator('button[type="submit"]').click();

    const alert = form.locator('[data-form-error]');
    await expect(alert).toHaveText('Please pick at least one Snugglegum™ product.');
    await expect(form.locator('input[data-interest]').first()).toBeFocused();
    expect(calls).toHaveLength(0);

    await form.locator('input[data-interest]').first().check();
    await expect(alert).toBeHidden();
  });

  for (const route of ['/', '/close-contact', '/protein-energy', '/beauty']) {
    test(`${route}: the interest picker is centered above the email field`, async ({ consented: page }) => {
      await page.goto(route);
      const forms = page.locator('[data-newsletter-form]');
      for (let i = 0; i < (await forms.count()); i++) {
        const form = forms.nth(i);
        if (!(await form.isVisible())) continue;
        const picker = (await form.locator('fieldset').boundingBox())!;
        const email = (await form.locator('input[type="email"]').boundingBox())!;
        expect(picker.y + picker.height).toBeLessThanOrEqual(email.y);
        const chips = await form.locator('fieldset label').evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
        const left = Math.min(...chips.map((c) => c.left));
        const right = Math.max(...chips.map((c) => c.right));
        expect(Math.abs((left + right) / 2 - (picker.x + picker.width / 2))).toBeLessThan(4);
      }
    });
  }
});
