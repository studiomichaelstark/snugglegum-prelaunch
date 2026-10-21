import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { expect, jsonResponse, LANDING_ROUTES, LINES, mockMailerLite, ROUTES, test, pickRequired } from './fixtures';

const LEGAL_LINES = [
  'Product in development. Formula, ingredients, and packaging will be confirmed before manufacturing. Not yet available.',
  'These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.',
  'Do not exceed the recommended daily serving. Keep out of reach of children.',
];

test.describe('home: pre-launch page', () => {
  test('hero carries the claim and the neutral serving note', async ({ consented: page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText(/vitamin gummies/i);
    await expect(page.locator('#hero')).toContainText('Vitamin Gummies you actually want to snack on.');
    await expect(page.locator('#hero')).toContainText('Serving size and daily gummies: see Supplement Facts (coming with launch).');
  });

  test('How it works reads Snack. Burst. Vitamins.', async ({ consented: page }) => {
    await page.goto('/');
    await expect(page.locator('#how-it-works h2')).toHaveText('Snack. Burst. Vitamins.');
    await expect(page.locator('#how-it-works li')).toHaveCount(3);
  });

  test('three version cards, all "Coming soon", each with its own accent', async ({ consented: page }) => {
    await page.goto('/');
    const cards = page.locator('#lines li[data-line]');
    await expect(cards).toHaveCount(3);
    const fills = new Set<string>();
    for (const line of LINES) {
      const card = page.locator(`#lines li[data-line="${line.id}"]`);
      await expect(card).toContainText(`Multivitamin for ${line.name}`);
      await expect(card).toContainText(line.ages);
      await expect(card).toContainText('Coming soon');
      await expect(card.locator('img')).toHaveAttribute('alt', `Snugglegum™ vitamin gummies pouch for ${line.name}, design concept`);
      fills.add(await card.evaluate((el) => getComputedStyle(el).backgroundColor));
    }
    expect(fills.size).toBe(3);
    await expect(page.locator('#lines')).not.toContainText(/gen alpha|\$\d/i);
  });

  test('founding-member message', async ({ consented: page }) => {
    await page.goto('/');
    const signup = page.locator('#newsletter-home');
    await expect(signup).toContainText('Join the first 500 founding members.');
    await expect(signup).toContainText('newsletter and help us pick our first flavor.');
    await expect(page.locator('#vote')).toHaveCount(0);
    const callout = page.locator('#join');
    await expect(callout).toContainText('Be one of the first 500.');
    await expect(callout.getByRole('img', { name: /Boomer, Millennials and Gen Z/ })).toBeVisible();
    await expect(callout.getByRole('link', { name: 'Become a founding member' })).toHaveAttribute('href', '#newsletter-home');
  });

  test('How it works: steps pop in on scroll, and stay visible without motion', async ({ consented: page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    // On phones the steps stack, so bring each one into view.
    for (const step of await page.locator('#how-it-works [data-how-step]').all()) await step.scrollIntoViewIfNeeded();
    await expect(page.locator('#how-it-works [data-how-step][data-in]')).toHaveCount(3);
    await expect(page.locator('#how-it-works [data-how-step]').first()).toHaveCSS('opacity', '1');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('#how-it-works[data-ready]')).toHaveCount(0);
    for (const opacity of await page.locator('#how-it-works [data-how-step]').evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity))) {
      expect(opacity).toBe('1');
    }
  });

  test('mobile: no horizontal overflow', async ({ consented: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const [scrollWidth, clientWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('JSON-LD has Organization, Brand and one Product per version', async ({ consented: page }) => {
    await page.goto('/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graph = blocks.flatMap((block) => JSON.parse(block)['@graph'] as { '@type': string; name?: string; slogan?: string }[]);
    const types = graph.map((node) => node['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('Brand');
    expect(graph.filter((node) => node['@type'] === 'Product').map((node) => node.name)).toEqual(LINES.map((line) => `Snugglegum™ Multivitamin for ${line.name}`));
    expect(graph.find((node) => node['@type'] === 'Brand')?.slogan).toBe('Sweet Vitamin Gummies');
  });
});

test.describe('legal footer', () => {
  for (const route of ROUTES) {
    test(`${route}: the three legal lines are in the footer, word for word`, async ({ consented: page }) => {
      await page.goto(route);
      const footer = page.locator('footer');
      for (const line of LEGAL_LINES) await expect(footer).toContainText(line);
    });
  }
});

test.describe('founding-member signup', () => {
  test('UTM parameters travel with the sign-up and stay in the URL until the thank-you page', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/?utm_source=tiktok&utm_medium=social&utm_campaign=founding500&utm_bogus=x');
    expect(new URL(page.url()).searchParams.get('utm_source')).toBe('tiktok');
    await pickRequired(page);
    await page.locator('input[name="fields[email]"]').first().fill('anna@example.com');
    await page.locator('input[name="consent"]').first().check();
    await page.locator('form:has(input[name="fields[email]"]) button[type="submit"]').first().click();
    await expect(page.getByText('Check your inbox and confirm your email.').first()).toBeVisible();
    await expect(page).toHaveURL(/\/thank-you-newsletter$/);

    const body = calls[0]?.body ?? '';
    expect(body).toMatch(/name="fields\[utm_source\]"\s*[\r\n]+\s*tiktok/);
    expect(body).toMatch(/name="fields\[utm_medium\]"\s*[\r\n]+\s*social/);
    expect(body).toMatch(/name="fields\[utm_campaign\]"\s*[\r\n]+\s*founding500/);
    expect(body).not.toContain('utm_bogus');
    expect(body).toMatch(/name="fields\[signup_page\]"\s*[\r\n]+\s*\//);
  });

  test('without UTM parameters none are sent', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    await pickRequired(page);
    await page.locator('input[name="fields[email]"]').first().fill('anna@example.com');
    await page.locator('input[name="consent"]').first().check();
    await page.locator('form:has(input[name="fields[email]"]) button[type="submit"]').first().click();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]?.body ?? '').not.toContain('utm_');
  });

  test('the three line checkboxes are unchecked and several can be sent as one subscription', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    for (const line of LINES) await expect(page.locator(`input[data-interest="${line.id}"]`).first()).not.toBeChecked();
    await page.locator('input[data-interest="gen-z"]').first().check();
    await page.locator('input[data-interest="boomer"]').first().check();
    await page.locator('input[data-flavor="pineapple"]').first().check();
    await page.locator('input[name="fields[email]"]').first().fill('anna@example.com');
    await page.locator('input[name="consent"]').first().check();
    await page.locator('form:has(input[name="fields[email]"]) button[type="submit"]').first().click();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]?.body ?? '').toMatch(/name="fields\[product_interest\]"\s*[\r\n]+\s*gen-z,boomer/);
  });
});

test.describe('hero parallax backdrop', () => {
  test('eight decorative layers in an aria-hidden container, no console errors', async ({ consented: page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      // The static preview has no /api/count (a 404 there is expected); every other error counts.
      if (message.type() === 'error' && !message.location().url.includes('/api/count')) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    const backdrop = page.locator('#hero .hero-parallax');
    await expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    await expect(backdrop.locator('[data-parallax-layer]')).toHaveCount(8);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('the layers follow the mouse', async ({ consented: page, isMobile }) => {
    test.skip(isMobile, 'No mouse on touch devices.');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const box = (await page.locator('#hero').boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.9, 120);
    await expect
      .poll(() => page.locator('#hero [data-parallax-layer][data-depth="near"]').first().evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41))
      .toBeLessThan(-5);
  });

  test('reduced motion: the layers stay put after a pointer move', async ({ consented: page, isMobile }) => {
    test.skip(isMobile, 'No mouse on touch devices.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const box = (await page.locator('#hero').boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.9, 400);
    await page.mouse.move(box.x + box.width * 0.1, 200);
    const transforms = await page.locator('#hero [data-parallax-layer]').evaluateAll((els) => els.map((el) => (el as HTMLElement).style.transform));
    expect(transforms).toEqual(Array(8).fill(''));
  });
});

test.describe('version cards', () => {
  test('Gen Z is light pink, Millennials the meadow token, and a pouch grows 50% on hover', async ({ consented: page, isMobile }) => {
    await page.goto('/');
    // Compare with the tokens in colors.css, resolved by the browser, so a palette tweak does not break the test.
    const fill = (id: string) => page.locator(`#lines li[data-line="${id}"]`).evaluate((el) => getComputedStyle(el).backgroundColor);
    const token = (name: string) =>
      page.evaluate((variable) => {
        const probe = document.createElement('div');
        probe.style.backgroundColor = `var(${variable})`;
        document.body.append(probe);
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
      }, name);
    // The cards fade their background in (transition), so poll instead of reading once.
    await expect.poll(() => fill('gen-z')).toBe(await token('--color-brand-pink'));
    await expect.poll(() => fill('millennials')).toBe(await token('--color-accent-meadow'));
    test.skip(isMobile, 'No hover on touch devices.');
    const pouch = page.locator('#lines li[data-line="millennials"] img');
    await pouch.scrollIntoViewIfNeeded();
    await pouch.hover();
    // Individual `scale` property (the tilt rotates the box, so its bounding box would not give the factor).
    await expect.poll(() => pouch.evaluate((el) => getComputedStyle(el).scale)).toBe('1.5');
  });
});

test.describe('pouch hover effects', () => {
  test('a pouch turns, glows and sprays confetti on hover', async ({ consented: page, isMobile }) => {
    test.skip(isMobile, 'No hover on touch devices.');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const pouch = page.locator('#lines li[data-line="gen-z"] [data-pouch]');
    await pouch.scrollIntoViewIfNeeded();
    // The spray is over in about a second, so record it with an observer instead of racing it.
    await page.evaluate(() => {
      const seen = { pieces: 0, position: '' };
      (window as unknown as { __confetti: typeof seen }).__confetti = seen;
      new MutationObserver(() => {
        const layer = document.querySelector<HTMLElement>('[data-confetti]');
        if (!layer) return;
        seen.pieces = Math.max(seen.pieces, Number(layer.dataset.pieces ?? 0));
        seen.position = getComputedStyle(layer).position;
      }).observe(document.body, { childList: true, subtree: true });
    });
    await pouch.hover();
    await expect.poll(() => pouch.evaluate((el) => getComputedStyle(el).rotate)).not.toBe('none');
    await expect.poll(() => pouch.evaluate((el) => getComputedStyle(el).filter)).toContain('drop-shadow');
    const seen = () => page.evaluate(() => (window as unknown as { __confetti: { pieces: number; position: string } }).__confetti);
    await expect.poll(async () => (await seen()).pieces).toBeGreaterThan(500);
    // Across the whole screen: a fixed layer on the viewport, not inside the card.
    expect((await seen()).position).toBe('fixed');
    // The spray is brief: it removes itself.
    await expect(page.locator('[data-confetti]')).toHaveCount(0, { timeout: 4000 });
  });

  test('reduced motion: no confetti', async ({ consented: page, isMobile }) => {
    test.skip(isMobile, 'No hover on touch devices.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const pouch = page.locator('#lines li[data-line="gen-z"] [data-pouch]');
    await pouch.scrollIntoViewIfNeeded();
    await pouch.hover();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-confetti]')).toHaveCount(0);
  });
});

test.describe('hero burst gummy', () => {
  test('stays still while the backdrop follows the mouse', async ({ consented: page, isMobile }) => {
    test.skip(isMobile, 'No mouse on touch devices.');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const box = (await page.locator('#hero').boundingBox())!;
    // Stay inside the viewport: the hero is taller than the test window.
    await page.mouse.move(box.x + box.width * 0.9, 400);
    await expect.poll(() => page.locator('#hero [data-parallax-layer]').first().evaluate((el) => (el as HTMLElement).style.transform)).toContain('translate3d');
    const gummyTransforms = await page.locator('#hero picture:not(.hero-parallax picture) img, #hero img[alt*="bursting"]').evaluateAll((els) => els.map((el) => getComputedStyle(el.parentElement!).transform));
    expect(gummyTransforms.every((t) => t === 'none')).toBe(true);
  });
});

test.describe('hero illustration note', () => {
  test('phones (portrait): no illustration and no note, the headline carries the hero', async ({ consented: page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 600, 'Wider screens show the illustration.');
    await page.goto('/');
    await expect(page.locator('#hero [data-hero-gummy]')).toBeHidden();
    await expect(page.locator('#hero [data-hero-note]')).toBeHidden();
    await expect(page.locator('#hero h1')).toBeVisible();
  });

  test('runs around the gummy at 16 px, readable to screen readers, and stays on screen', async ({ consented: page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'Phones get a plain line instead of the circle.');
    await page.goto('/');
    const note = page.locator('#hero [data-hero-note]');
    await expect(note).toHaveAttribute('role', 'img');
    await expect(note).toHaveAttribute('aria-label', 'Illustration. The final gummies may look different.');
    const measure = () =>
      note.evaluate((svg) => {
        const text = svg.querySelector('text')!;
        const scale = svg.getBoundingClientRect().width / (svg as SVGSVGElement).viewBox.baseVal.width;
        return {
          renderedPx: parseFloat(getComputedStyle(text).fontSize) * scale,
          right: text.getBoundingClientRect().right,
          viewport: document.documentElement.clientWidth,
        };
      });
    // The size is set by a script after load (heroNote.ts), so wait for it instead of reading once.
    await expect.poll(async () => Math.round((await measure()).renderedPx)).toBe(16);
    const { right, viewport } = await measure();
    expect(right).toBeLessThanOrEqual(viewport);
  });
});

test.describe('at a glance and Supplement Facts', () => {
  test('four icon cards, and no Supplement Facts button in the section', async ({ consented: page }) => {
    await page.goto('/');
    await expect(page.locator('#at-a-glance li')).toHaveCount(4);
    await expect(page.locator('#at-a-glance [data-dialog-open]')).toHaveCount(0);
  });

  for (const line of LINES) {
    test(`${line.name}: its own preliminary Supplement Facts open from the button under its card`, async ({ consented: page }) => {
      await page.goto('/');
      const card = page.locator(`#lines [data-line="${line.id}"]`);
      await card.getByRole('button', { name: /Supplement Facts/ }).click();
      const dialog = page.getByRole('dialog', { name: `Supplement Facts: ${line.name}` });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Preliminary');
      await expect(dialog).toContainText(line.ages);
      await expect(dialog.getByRole('row', { name: /Total Sugars/ })).toContainText('0 g');
      await dialog.getByRole('button', { name: 'Close' }).click();
      await expect(dialog).toBeHidden();
    });
  }

  test('the three panels differ and every % DV matches its amount', async ({ consented: page }) => {
    await page.goto('/');
    const seen: string[] = [];
    for (const line of LINES) {
      const rows = await page.locator(`#supplement-facts-${line.id} tbody tr`).evaluateAll((trs) =>
        trs.map((tr) => [...tr.querySelectorAll('th, td')].map((cell) => cell.textContent?.trim() ?? '')),
      );
      seen.push(JSON.stringify(rows));
      const b12 = rows.find((row) => row[0]?.startsWith('Vitamin B12'));
      expect(b12, line.name).toBeTruthy();
      const amount = Number.parseFloat(b12![1]!);
      expect(b12![2]).toBe(`${Math.round((amount / 2.4) * 100)}%`);
    }
    expect(new Set(seen).size).toBe(3);
  });
});

test.describe('sign-up count on the home page', () => {
  test('shows the live count once it reaches the threshold, and stays hidden below it', async ({ consented: page }) => {
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 1234 }));
    await page.goto('/');
    await expect(page.locator('#newsletter-home [data-signup-count]')).toHaveText('1,234 sign-ups so far');
  });

  test('a small count (below the default threshold of 250) is not shown', async ({ consented: page }) => {
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 5 }));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#newsletter-home [data-signup-count]')).toBeHidden();
  });

  test('without the counter (404) the line stays hidden and the page works', async ({ consented: page }) => {
    await page.route('**/api/count', (route) => route.fulfill({ status: 404, body: 'not found' }));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#newsletter-home [data-signup-count]')).toBeHidden();
    await expect(page.locator('form[data-newsletter-form]')).toHaveCount(1);
  });
});

test.describe('ticket preview on the home page', () => {
  const ticket = (page: import('@playwright/test').Page) => page.locator('#newsletter-home [data-ticket-number]');

  test('shows the next free number: the current count plus one', async ({ consented: page }) => {
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 41 }));
    await page.goto('/');
    await expect(ticket(page)).toHaveText('No. 042 of 500');
    await expect(ticket(page)).toHaveAttribute('title', /next free number/i);
  });

  test('with no sign-ups yet the next number is 001, and the count line stays hidden', async ({ consented: page }) => {
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 0 }));
    await page.goto('/');
    await expect(ticket(page)).toHaveText('No. 001 of 500');
    await expect(page.locator('#newsletter-home [data-signup-count]')).toBeHidden();
  });

  test('the last founding spot is 500, and from there on the ticket says Waitlist', async ({ consented: page }) => {
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 499 }));
    await page.goto('/');
    await expect(ticket(page)).toHaveText('No. 500 of 500');
    await page.unroute('**/api/count');
    await page.route('**/api/count', (route) => jsonResponse(route, { count: 500 }));
    await page.reload();
    await expect(ticket(page)).toHaveText('Waitlist');
  });

  test('without the counter the blank stays', async ({ consented: page }) => {
    await page.route('**/api/count', (route) => route.fulfill({ status: 404, body: 'not found' }));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(ticket(page)).toHaveText('No. ___ of 500');
  });
});

test.describe('flavor choice in the signup form', () => {
  test('two flavor checkboxes and a free-text field are sent as plain fields', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    for (const id of ['pineapple', 'energy']) await expect(page.locator(`input[data-flavor="${id}"]`)).not.toBeChecked();
    await page.locator('input[data-flavor="pineapple"]').check();
    await page.locator('input[data-flavor="energy"]').check();
    await page.locator('input[data-flavor-other]').fill('  Mango   chili ');
    await page.locator('input[data-interest]').first().check();
    await page.locator('input[name="fields[email]"]').first().fill('anna@example.com');
    await page.locator('input[name="consent"]').first().check();
    await page.locator('form:has(input[name="fields[email]"]) button[type="submit"]').first().click();
    await expect.poll(() => calls.length).toBe(1);
    const body = calls[0]?.body ?? '';
    expect(body).toMatch(/name="fields\[flavor_vote\]"\s*[\r\n]+\s*pineapple,energy/);
    expect(body).toMatch(/name="fields\[flavor_other\]"\s*[\r\n]+\s*Mango chili/);
  });

  test('a suggestion of your own alone is enough and is sent without a flavor vote', async ({ consented: page }) => {
    const calls = await mockMailerLite(page, (route) => jsonResponse(route, { success: true }));
    await page.goto('/');
    await page.locator('input[data-interest]').first().check();
    await page.locator('input[data-flavor-other]').fill('Mango');
    await page.locator('input[name="fields[email]"]').first().fill('anna@example.com');
    await page.locator('input[name="consent"]').first().check();
    await page.locator('form:has(input[name="fields[email]"]) button[type="submit"]').first().click();
    await expect.poll(() => calls.length).toBe(1);
    const body = calls[0]?.body ?? '';
    expect(body).toContain('flavor_other');
    expect(body).not.toContain('flavor_vote');
  });
});

test.describe('retired wording', () => {
  const OLD_TERMS = [
    /snugglegum™?\s+daily/i,
    /close[\s-]?contact/i,
    /protein[\s-]?energy/i,
    /\bbeauty\b/i,
    /body[\s-]?taste/i,
    /muscle[\s-]?candy/i,
    /gum[\s-]?shot/i,
    /gummy[\s-]?shot/i,
    /one gummy a day/i,
    /a handful/i,
    /complete daily dose/i,
    /australia/i,
    /\bEU\b/,
    /\bCE\b/,
    /\bgen[\s-]?x\b/i,
    /\bboomers\b/i,
    /burst\.\s*sweet\./i,
    /gummy bear \/ energy/i,
    /chew-now|snack-size|boring-nights/i,
    /energy drink/i,
    /bubblegum/i,
    /sweet vitamins you actually/i,
    /burst sweet vitamins/i,
    /popping candy/i,
  ];

  function* walk(dir: string): Generator<string> {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) yield* walk(path);
      else yield path;
    }
  }

  test('built pages, llms.txt and the manifest use none of the old product wording', () => {
    const files = [...walk('dist')].filter((f) => ['.html', '.txt', '.xml', '.webmanifest'].includes(extname(f)));
    expect(files.length).toBeGreaterThan(5);
    const hits = files.flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return OLD_TERMS.filter((re) => re.test(text)).map((re) => `${file} matches ${re}`);
    });
    expect(hits).toEqual([]);
  });

  test('the public pages never state a number of gummies per day', () => {
    const files = [...walk('dist')].filter((f) => extname(f) === '.html');
    const hits = files.flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return /\b(one|two|three|1|2|3)\s+gummies?\s+(a|per|each)\s+day\b/i.test(text) ? [file] : [];
    });
    expect(hits).toEqual([]);
  });
});

test.describe('landing routes share one signup', () => {
  test('every landing route has exactly one working form', async ({ consented: page }) => {
    for (const route of LANDING_ROUTES) {
      await page.goto(route);
      await expect(page.locator('form[data-newsletter-form]'), route).toHaveCount(1);
    }
  });
});
