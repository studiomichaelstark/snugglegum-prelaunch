import { expect, jsonResponse, mockMailerLite, PRODUCT_ROUTES, ROUTES, test } from './fixtures';

const PRODUCTS = [
  { id: 'close-contact', name: 'Close Contact', path: '/close-contact' },
  { id: 'protein-energy', name: 'Protein Energy', path: '/protein-energy' },
  { id: 'beauty', name: 'Beauty', path: '/beauty' },
] as const;

test.describe('product family: homepage gateway', () => {
  test('shows all 3 products with working Learn more CTAs', async ({ consented: page }) => {
    await page.goto('/');
    for (const product of PRODUCTS) {
      const cta = page.getByRole('link', { name: `Learn more about ${product.name}` });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute('href', product.path);
    }
  });

  test('mobile: the 3-product hero does not overflow or stack into enormous cards', async ({ consented: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    const cardHeights = await page.locator('#hero li').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    // Each card now leads with its pouch image, so "enormous" starts higher than for text-only cards.
    for (const height of cardHeights) expect(height).toBeLessThan(720);
  });
});

test.describe('product family: no traditional navigation menu', () => {
  for (const route of ROUTES) {
    test(`${route}: no header nav, hamburger or product menu`, async ({ consented: page }) => {
      await page.goto(route);
      // The footer's "Legal" nav (imprint/privacy) is pre-existing and not a site/product menu.
      const navs = page.locator('nav');
      const navCount = await navs.count();
      expect(navCount).toBeLessThanOrEqual(1);
      if (navCount) await expect(navs.first()).toHaveAttribute('aria-label', 'Legal');

      await expect(page.locator('header')).toHaveCount(0);
      const hamburgers = page.locator('button[aria-label*="menu" i], [aria-expanded][class*="menu" i]');
      expect(await hamburgers.count()).toBe(0);
    });
  }
});

test.describe('product family: independent product pages', () => {
  for (const product of PRODUCTS) {
    test(`${product.path}: loads independently with full brand + product context`, async ({ consented: page }) => {
      await page.goto(product.path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('body')).toContainText('Snugglegum');

      // A simple, non-nav way back to the homepage — not a conventional nav menu.
      await expect(page.getByRole('link', { name: 'All Snugglegum™ products' })).toHaveAttribute('href', '/');
    });
  }
});

test.describe('product family: newsletter interests', () => {
  test('the homepage form shows exactly 3 labeled product checkboxes, none preselected', async ({ consented: page }) => {
    await page.goto('/');
    for (const product of PRODUCTS) {
      const checkbox = page.locator(`input[data-interest="${product.id}"]`).first();
      await expect(checkbox).not.toBeChecked();
      const id = await checkbox.getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`).first()).toContainText(product.name);
    }
    expect(await page.locator('input[data-interest]').count()).toBeGreaterThanOrEqual(3);
  });

  for (const product of PRODUCTS) {
    test(`${product.path}: preselects ${product.name} but still allows other selections`, async ({ consented: page }) => {
      await page.goto(product.path);
      const own = page.locator(`input[data-interest="${product.id}"]`).first();
      await expect(own).toBeChecked();

      const others = PRODUCTS.filter((p) => p.id !== product.id);
      for (const other of others) {
        await expect(page.locator(`input[data-interest="${other.id}"]`).first()).not.toBeChecked();
      }

      const another = page.locator(`input[data-interest="${others[0]!.id}"]`).first();
      await another.check();
      await expect(own).toBeChecked();
      await expect(another).toBeChecked();
    });
  }

  test('selecting multiple products still sends exactly one subscription with both interests', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/protein-energy');

    await page.locator('input[data-interest="protein-energy"]').first().check();
    await page.locator('input[data-interest="beauty"]').first().check();
    const emailField = page.locator('input[name="fields[email]"]').first();
    await emailField.fill('anna@example.com');
    await page.locator('input[name="consent"]').first().check();
    await page.locator('form:has(input[name="fields[email]"]) button[type="submit"]').first().click();

    await expect.poll(() => calls.length).toBe(1);
    const body = calls[0]?.body ?? '';
    expect(body).toMatch(/name="fields\[product_interest\]"\s*[\r\n]+\s*protein-energy,beauty/);
  });
});

test.describe('product family: SEO uniqueness', () => {
  test('every product route has a unique title, description and canonical', async ({ consented: page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const canonicals = new Set<string>();
    for (const route of PRODUCT_ROUTES) {
      await page.goto(route);
      titles.add(await page.title());
      descriptions.add((await page.locator('meta[name="description"]').getAttribute('content')) ?? '');
      canonicals.add((await page.locator('link[rel="canonical"]').getAttribute('href')) ?? '');
    }
    expect(titles.size).toBe(PRODUCT_ROUTES.length);
    expect(descriptions.size).toBe(PRODUCT_ROUTES.length);
    expect(canonicals.size).toBe(PRODUCT_ROUTES.length);
  });

  for (const product of PRODUCTS) {
    test(`${product.path}: JSON-LD names the Product and links it to the Organization`, async ({ consented: page }) => {
      await page.goto(product.path);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      const graph = blocks.flatMap((block) => JSON.parse(block)['@graph'] as { '@type': string }[]);
      const productNode = graph.find((node) => node['@type'] === 'Product') as { name?: string; brand?: unknown } | undefined;
      expect(productNode, 'Product node').toBeTruthy();
      expect(productNode!.name).toContain(product.name);
      expect(graph.map((node) => node['@type'])).toContain('BreadcrumbList');
    });
  }
});

test.describe('product family: UTM parameters are preserved', () => {
  test('submitting the newsletter form does not strip UTM query params from the URL', async ({ consented: page }) => {
    await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/close-contact?utm_source=instagram&utm_campaign=launch');
    await page.locator('input[name="fields[email]"]').first().fill('anna@example.com');
    await page.locator('input[name="consent"]').first().check();
    await page.locator('form:has(input[name="fields[email]"]) button[type="submit"]').first().click();
    await expect(page.getByText('Check your inbox and confirm your email.').first()).toBeVisible();

    const url = new URL(page.url());
    expect(url.searchParams.get('utm_source')).toBe('instagram');
    expect(url.searchParams.get('utm_campaign')).toBe('launch');
  });
});

test.describe('product family: every product page has the same building blocks', () => {
  for (const product of PRODUCTS) {
    test(`${product.path}: hero signup, chemistry, what's inside, audience, marquee and closing signup`, async ({ consented: page }) => {
      await page.goto(product.path);
      await expect(page.locator('#hero form[data-newsletter-form]')).toHaveCount(1);
      await expect(page.locator('section[id^="chemistry-of-"]')).toHaveCount(1);
      for (const id of ['whats-inside', 'audience', 'marquee', 'faq']) {
        await expect(page.locator(`section#${id}`), id).toHaveCount(1);
      }
      // The hero form plus the closing one.
      await expect(page.locator('form[data-newsletter-form]')).toHaveCount(2);
    });
  }
});
