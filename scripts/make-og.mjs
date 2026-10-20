/**
 * Generates public/og-image.png (1200x630) from the design: brand colors (colors.css), the wordmark,
 * the pouch and the self-hosted Archivo font. Run `pnpm og` after changing any of them and commit the PNG.
 */
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
const colorsCss = read('src/styles/colors.css').toString('utf8');
const logoSvg = /<svg[\s\S]*<\/svg>/.exec(read('src/components/logo/Logo.astro').toString('utf8'))?.[0];
if (!logoSvg) throw new Error('Could not find the logo SVG in Logo.astro');

const fontBase64 = read('src/assets/fonts/archivo-latin-wdth-normal.woff2').toString('base64');

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
${colorsCss}
@font-face { font-family: Archivo; src: url(data:font/woff2;base64,${fontBase64}) format('woff2'); font-weight: 400 900; font-stretch: 100% 125%; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: var(--color-brand-pink); font-family: Archivo, sans-serif; }
.logo { position: absolute; left: 64px; top: 190px; width: 640px; color: var(--color-surface);
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--color-glow) 40%, transparent)) drop-shadow(0 0 20px color-mix(in srgb, var(--color-glow) 30%, transparent)); }
.logo svg { display: block; width: 100%; height: auto; }
.pill { position: absolute; left: 64px; top: 345px; background: var(--color-brand-ink); color: var(--color-brand-pink);
  padding: 16px 30px; border-radius: 999px; font-weight: 900; font-stretch: 112%; letter-spacing: .12em; text-transform: uppercase; font-size: 24px; }
.claim { position: absolute; left: 64px; top: 420px; width: 600px; color: var(--color-brand-green); font-weight: 900; font-stretch: 118%; text-transform: uppercase; font-size: 44px; line-height: .95; letter-spacing: -.02em; }
.card { position: absolute; right: 90px; top: 70px; width: 420px; height: 490px; transform: rotate(3deg); background: var(--color-surface); border: 4px dashed var(--color-brand-green); border-radius: 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 36px; color: var(--color-brand-green); box-shadow: 0 24px 28px color-mix(in srgb, var(--color-brand-ink) 30%, transparent); }
.card .blob { width: 190px; height: 190px; background: var(--color-brand-pink); border-radius: 46% 54% 52% 48% / 55% 45% 55% 45%; }
.card p { font-weight: 900; font-stretch: 120%; text-transform: uppercase; font-size: 42px; line-height: .9; text-align: center; }
</style></head><body>
<div class="logo">${logoSvg}</div>
<div class="pill">Coming soon</div>
<div class="claim">Sweet Vitamins for Generations</div>
<div class="card"><div class="blob"></div><p>Coming<br>soon</p></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('../public/og-image.png', import.meta.url).pathname });
await browser.close();
console.log('Wrote public/og-image.png');
