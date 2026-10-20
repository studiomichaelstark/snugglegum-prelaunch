import { chromium, webkit } from '@playwright/test';
import { spawn } from 'node:child_process';
const srv = spawn('pnpm', ['exec','astro','preview','--port','4323','--host','localhost','--ignore-lock'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 3000));
for (const [name, type] of [['chromium', chromium], ['webkit', webkit]]) {
  const b = await type.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => localStorage.setItem('sg-cookie-consent', JSON.stringify({version:1,timestamp:new Date().toISOString(),categories:{analytics:false,marketing:false}})));
  const p = await ctx.newPage();
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await p.goto('http://localhost:4323/');
  const pouch = p.locator('#lines li[data-line="gen-z"] [data-pouch]');
  await pouch.scrollIntoViewIfNeeded();
  console.log(name, 'before hover layers:', await p.locator('[data-confetti]').count(), 'media', await p.evaluate(() => [matchMedia('(hover: hover) and (pointer: fine)').matches, matchMedia('(prefers-reduced-motion: reduce)').matches]));
  await p.evaluate(() => { window.__seen = 0; new MutationObserver(() => { const l=document.querySelector('[data-confetti]'); if (l) window.__seen = Math.max(window.__seen, l.querySelectorAll('span').length); }).observe(document.body, {childList:true, subtree:true}); });
  await pouch.hover();
  await p.waitForTimeout(200);
  console.log(name, 'after hover layers:', await p.locator('[data-confetti]').count(), 'seen', await p.evaluate(() => window.__seen));
  await p.waitForTimeout(2500);
  console.log(name, 'after 2.7s layers:', await p.locator('[data-confetti]').count());
  await b.close();
}
srv.kill();
