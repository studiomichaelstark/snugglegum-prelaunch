/**
 * Generates public/og-image.png (1200x630) as a screenshot of the home page hero.
 * Run `pnpm og` after the hero changed and commit the PNG. It builds the site first, then screenshots
 * a 1600x840 window at 0.75 scale so the headline, the illustration and the circular note fit in 1200x630.
 */
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const PORT = 4323;
const WIDTH = 1200;
const HEIGHT = 630;
const SCALE = 0.75;
const output = new URL('../public/og-image.png', import.meta.url).pathname;

const build = spawnSync('pnpm', ['exec', 'astro', 'build'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn('pnpm', ['exec', 'astro', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], { stdio: 'ignore', detached: true });
const stopServer = () => {
  try {
    process.kill(-server.pid, 'SIGKILL');
  } catch {
    // Already gone.
  }
};
process.on('exit', stopServer);

try {
  const url = `http://127.0.0.1:${PORT}/`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await fetch(url).then((response) => response.ok, () => false)) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH / SCALE, height: HEIGHT / SCALE }, deviceScaleFactor: SCALE });
  await page.addInitScript(() => {
    // No cookie dialog in the picture.
    localStorage.setItem('sg-cookie-consent', JSON.stringify({ version: 1, timestamp: new Date().toISOString(), categories: { analytics: false, marketing: false } }));
  });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  // The back-to-top button does not belong in a share picture.
  await page.getByRole('link', { name: 'Back to top' }).evaluate((element) => element.setAttribute('hidden', ''));
  await page.waitForTimeout(1500);
  const shot = await page.screenshot();
  await browser.close();

  await sharp(shot).resize(WIDTH, HEIGHT).png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toFile(output);
  console.log('Wrote public/og-image.png');
} finally {
  stopServer();
}
