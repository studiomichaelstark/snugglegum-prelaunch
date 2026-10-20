/**
 * `pnpm preview:functions`: checks the MailerLite setup, builds the site, and runs it together with the
 * Pages Functions in Cloudflare's local simulator (http://127.0.0.1:8788). Nothing is deployed.
 * It stops early only when sign-ups could not work at all (no key, key rejected). Missing groups or fields
 * are shown as a warning and the server still starts, so you can look at the rest.
 */
import { spawn, spawnSync } from 'node:child_process';
import { checkMailerLite } from './check-mailerlite.mjs';

console.log('Checking the MailerLite setup (read-only)...');
const result = await checkMailerLite();
if (result === 1) {
  console.log('\nNot starting: sign-ups cannot work yet. Fix the point above, then run this again.');
  process.exit(1);
}
if (result === 2) console.log('\nStarting anyway, but sign-ups will be refused until the points above are fixed.');

console.log('\nBuilding the site...');
const build = spawnSync('pnpm', ['exec', 'astro', 'build'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

console.log('\nStarting the local server. When a sign-up fails, the reason is printed in this window.');
const server = spawn('pnpm', ['exec', 'wrangler', 'pages', 'dev', '--ip', '127.0.0.1'], { stdio: 'inherit' });
server.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
