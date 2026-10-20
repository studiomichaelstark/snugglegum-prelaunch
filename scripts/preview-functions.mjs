/**
 * `pnpm preview:functions`: checks the MailerLite setup, builds the site, and runs it together with the
 * API Worker in Cloudflare's local simulator (http://127.0.0.1:8787). Nothing is deployed.
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
// Own process group, so one signal reaches pnpm, wrangler and workerd together. Ctrl-C from the terminal
// then goes to this script only, which decides how to stop the rest.
const server = spawn('pnpm', ['exec', 'wrangler', 'dev', '--ip', '127.0.0.1'], { stdio: 'inherit', detached: true });
const stopGroup = (signal) => {
  try {
    process.kill(-server.pid, signal);
  } catch {
    // Already gone.
  }
};

let stopping = false;
const FORCE_AFTER_MS = 2000;
function shutdown() {
  if (stopping) {
    // Second Ctrl-C: no more waiting.
    stopGroup('SIGKILL');
    process.exit(130);
  }
  stopping = true;
  console.log('\nStopping the local server... (press Ctrl-C again to force)');
  stopGroup('SIGTERM');
  setTimeout(() => {
    stopGroup('SIGKILL');
    process.exit(130);
  }, FORCE_AFTER_MS).unref();
}

server.on('exit', (code) => {
  stopGroup('SIGKILL');
  process.exit(code ?? 0);
});
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, shutdown);
