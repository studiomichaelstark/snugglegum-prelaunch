import { expect, jsonResponse, LANDING_ROUTES, mockMailerLite, pickRequired, test, trackExternalRequests } from './fixtures';

const EMAIL_FIELD = '#newsletter-email-home';
const CONSENT_FIELD = '#newsletter-consent-home';

test.describe('newsletter form', () => {
  test('sends nothing before submit', async ({ consented: page, baseURL }) => {
    const external = trackExternalRequests(page, baseURL!);
    await page.goto('/');
    await pickRequired(page);
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
    await pickRequired(page);
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
    await pickRequired(page);
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
    await pickRequired(page);
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
    await pickRequired(page);
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
      await pickRequired(page);
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
    await pickRequired(page);
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

  test('a version is required and comes first', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    await page.locator('#newsletter-home input[data-flavor="pineapple"]').check();
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();

    await expect(page.locator('#newsletter-error-home')).toHaveText('Please pick at least one version.');
    await expect(page.locator('#newsletter-home input[data-interest]').first()).toBeFocused();
    expect(calls).toHaveLength(0);
  });

  test('a flavor, or a suggestion of your own, is required', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    await page.locator('#newsletter-home input[data-interest]').first().check();
    await page.locator(EMAIL_FIELD).fill('anna@example.com');
    await page.locator(CONSENT_FIELD).check();
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();

    await expect(page.locator('#newsletter-error-home')).toHaveText('Please pick a flavor or suggest your own.');
    expect(calls).toHaveLength(0);

    // A suggestion of your own is enough.
    await page.locator('#newsletter-home input[data-flavor-other]').fill('Mango');
    await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();
    await expect.poll(() => calls.length).toBe(1);
  });

  test('both questions say they are required instead of optional', async ({ consented: page }) => {
    await page.goto('/');
    const legends = page.locator('#newsletter-home fieldset legend');
    await expect(legends).toHaveCount(2);
    for (const legend of await legends.all()) await expect(legend).not.toContainText('optional');
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

  test.describe('sign-up flow with /api/signup, /api/count and the thank-you page', () => {
    const THANK_YOU = /\/thank-you-newsletter$/;
    const submit = async (page: import('@playwright/test').Page) => {
      await page.goto('/');
      await pickRequired(page);
      await page.locator(EMAIL_FIELD).fill('anna@example.com');
      await page.locator(CONSENT_FIELD).check();
      await page.locator('form:has(#newsletter-email-home) button[type="submit"]').click();
    };
    const thanks = (page: import('@playwright/test').Page) => page.getByRole('heading', { name: 'Check your inbox and confirm your email.' });

    test('posts to /api/signup with the age consent, then lands on the thank-you page with number and count', async ({ consented: page }) => {
      let posted = '';
      await page.route('**/api/signup', (route) => {
        posted = route.request().postData() ?? '';
        return jsonResponse(route, { ok: true, number: 7 });
      });
      await page.route('**/api/count', (route) => jsonResponse(route, { count: 1234 }));
      await page.goto('/');
      // Before the sign-up the ticket previews the next free number (count 1234 = all spots taken); the real number comes after.
      await expect(page.locator('[data-ticket-number]')).toHaveText('Waitlist');
      await submit(page);
      await expect(page).toHaveURL(THANK_YOU);
      await expect(thanks(page)).toBeVisible();
      await expect(page.locator('[data-ticket-number]')).toHaveText('No. 007 of 500');
      await expect(page.locator('[data-success-number]')).toContainText('You’re No. 007 of 500');
      // Thousands get a comma, and the label says sign-ups, not subscribers.
      await expect(page.locator('[data-signup-count]')).toHaveText('1,234 sign-ups so far');
      expect(posted).toContain('anna@example.com');
      expect(posted).toMatch(/name="consent"\s*[\r\n]+\s*on/);
    });

    test('sends how long the page has been open, so the function can turn away scripts', async ({ consented: page }) => {
      let posted = '';
      await page.route('**/api/signup', (route) => {
        posted = route.request().postData() ?? '';
        return jsonResponse(route, { ok: true, number: 1 });
      });
      await page.route('**/api/count', (route) => route.abort());
      await submit(page);
      const age = /name="form_age"\s*[\r\n]+\s*(\d+)/.exec(posted)?.[1];
      expect(Number(age)).toBeGreaterThan(0);
      expect(posted).toMatch(/name="consent_age_18"\s*[\r\n]+\s*yes/);
    });

    test('a 429 from the function shows the "too many tries" message and keeps the visitor on the form', async ({ consented: page }) => {
      await page.route('**/api/signup', (route) => jsonResponse(route, { ok: false, error: 'Too many tries.' }, 429));
      await submit(page);
      await expect(page.locator('#newsletter-error-home')).toHaveText('Too many tries in a row. Wait a moment and try again.');
      await expect(page).not.toHaveURL(THANK_YOU);
      // The button is usable again for the next try.
      await expect(page.locator('form:has(#newsletter-email-home) button[type="submit"]')).toBeEnabled();
    });

    test('the larger of the count and the new number wins (KV reads can lag)', async ({ consented: page }) => {
      await page.route('**/api/signup', (route) => jsonResponse(route, { ok: true, number: 12 }));
      await page.route('**/api/count', (route) => jsonResponse(route, { count: 11 }));
      await submit(page);
      await expect(page.locator('[data-signup-count]')).toHaveText('12 sign-ups so far');
    });

    test('if the count cannot be fetched, the line stays hidden and nothing breaks', async ({ consented: page }) => {
      await page.route('**/api/signup', (route) => jsonResponse(route, { ok: true, number: 3 }));
      await page.route('**/api/count', (route) => route.abort());
      await submit(page);
      await expect(thanks(page)).toBeVisible();
      await expect(page.locator('[data-signup-count]')).toBeHidden();
      await expect(page.locator('[data-ticket-number]')).toHaveText('No. 003 of 500');
    });

    test('above 500 the ticket says Waitlist', async ({ consented: page }) => {
      await page.route('**/api/signup', (route) => jsonResponse(route, { ok: true, number: 501 }));
      await page.route('**/api/count', (route) => route.abort());
      await submit(page);
      await expect(page.locator('[data-ticket-number]')).toHaveText('Waitlist');
      await expect(page.locator('[data-success-number]')).toContainText('waitlist');
    });

    test('without the function (404) the form falls back to MailerLite, still reaches the thank-you page, and shows no number', async ({ consented: page }) => {
      await page.route('**/api/signup', (route) => route.fulfill({ status: 404, body: 'not found' }));
      await page.route('**/api/count', (route) => route.fulfill({ status: 404, body: 'not found' }));
      const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
      await submit(page);
      await expect(page).toHaveURL(THANK_YOU);
      expect(calls).toHaveLength(1);
      await expect(page.locator('[data-ticket-number]')).toHaveText('No. ___ of 500');
      await expect(page.locator('[data-signup-count]')).toBeHidden();
    });

    test('an error from the function keeps the visitor on the form with the usual message', async ({ consented: page }) => {
      await page.route('**/api/signup', (route) => jsonResponse(route, { ok: false, error: 'x', status: 500 }, 500));
      await submit(page);
      await expect(page.locator('#newsletter-error-home')).toBeVisible();
      await expect(page).not.toHaveURL(THANK_YOU);
      await expect(page.locator('[data-ticket-number]')).toHaveText('No. ___ of 500');
    });

    test('a failed bot check (403 challenge) shows its own message and keeps the visitor on the form', async ({ consented: page }) => {
      await page.route('**/api/signup', (route) => jsonResponse(route, { ok: false, error: 'x', challenge: true }, 403));
      await submit(page);
      await expect(page.locator('#newsletter-error-home')).toHaveText('We couldn’t check that you’re human. Please try again.');
      await expect(page).not.toHaveURL(THANK_YOU);
    });

    test('an email rejected by MailerLite (422) points at the email field', async ({ consented: page }) => {
      await page.route('**/api/signup', (route) => jsonResponse(route, { ok: false, status: 422, errors: { fields: { email: ['invalid'] } } }, 422));
      await submit(page);
      await expect(page.locator('#newsletter-error-home')).toBeVisible();
      await expect(page.locator(EMAIL_FIELD)).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
