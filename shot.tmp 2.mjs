import { chromium } from '@playwright/test';
const browser = await chromium.launch();
for (const [name, w, h] of [['m390', 390, 844], ['m360', 360, 740], ['d1440', 1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => localStorage.setItem('sg-cookie-consent', JSON.stringify({ version: 1, timestamp: new Date().toISOString(), categories: { analytics: false, marketing: false } })));
  const page = await ctx.newPage();
  await page.goto('http://localhost:4321/');
  await page.waitForLoadState('networkidle');
  const top = await page.locator('#hero h1').evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
  await page.screenshot({ path: '/private/tmp/claude-501/-Users-michaelkonjevic-Documents-Kunden-Snugglegum-Web-Snugglegum-v1/ce5cd528-eabe-447d-b530-8c7ce65c184e/scratchpad/' + name + '-hero.png', clip: { x: 0, y: top, width: w, height: w < 500 ? 1250 : 1100 }, fullPage: true });
  const f = await page.locator('form:has(#newsletter-email-hero)').evaluate((form) => {
    const i = form.querySelector('input[type=email]').getBoundingClientRect(); const b = form.querySelector('button[type=submit]').getBoundingClientRect();
    return { inputTop: Math.round(i.top), buttonTop: Math.round(b.top), inputW: Math.round(i.width), buttonW: Math.round(b.width), buttonH: Math.round(b.height) };
  });
  const pouch = await page.locator('#hero picture').evaluate((el) => Math.round(el.getBoundingClientRect().width));
  console.log(name, 'form', JSON.stringify(f), 'pouchW', pouch, 'scrollW', await page.evaluate(() => document.documentElement.scrollWidth));
  await ctx.close();
}
await browser.close();
