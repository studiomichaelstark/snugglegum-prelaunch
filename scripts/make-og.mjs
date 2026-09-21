/**
 * Generates public/og-image.png (1200x630) from the design: brand colors (colors.css), the wordmark,
 * the pouch and the self-hosted Archivo font. Run `npm run og` after changing any of them and commit the PNG.
 */
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
const colorsCss = read('src/styles/colors.css').toString('utf8');
const logoSvg = /<svg[\s\S]*<\/svg>/.exec(read('src/components/logo/Logo.astro').toString('utf8'))?.[0];
if (!logoSvg) throw new Error('Could not find the logo SVG in Logo.astro');

const fontBase64 = read('src/assets/fonts/archivo-latin-wdth-normal.woff2').toString('base64');
const pouchBase64 = read('src/assets/snugglegum-doypack.png').toString('base64');

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
${colorsCss}
@font-face { font-family: Archivo; src: url(data:font/woff2;base64,${fontBase64}) format('woff2'); font-weight: 400 900; font-stretch: 100% 125%; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; background: var(--color-brand-pink); font-family: Archivo, sans-serif; }
.logo { position: absolute; left: 64px; top: 190px; width: 640px; color: var(--color-surface);
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--color-glow) 40%, transparent)) drop-shadow(0 0 20px color-mix(in srgb, var(--color-glow) 30%, transparent)); }
.logo svg { display: block; width: 100%; height: auto; }
.pill { position: absolute; left: 64px; top: 340px; background: var(--color-brand-ink); color: var(--color-brand-pink);
  padding: 16px 30px; border-radius: 999px; font-weight: 900; font-stretch: 112%; letter-spacing: .12em; text-transform: uppercase; font-size: 24px; }
.pouch { position: absolute; right: 70px; top: 50px; height: 560px; transform: rotate(3deg); filter: drop-shadow(0 24px 28px color-mix(in srgb, var(--color-brand-ink) 30%, transparent)); }
</style></head><body>
<div class="logo">${logoSvg}</div>
<div class="pill">Coming soon</div>
<img class="pouch" alt="" src="data:image/png;base64,${pouchBase64}">
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('../public/og-image.png', import.meta.url).pathname });
await browser.close();
console.log('Wrote public/og-image.png');
