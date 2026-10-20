/**
 * Cloudflare Worker entry point. The static site in dist/ is served by Workers Static Assets; only
 * /api/* reaches this script (wrangler.toml, assets.run_worker_first). The sign-up and counter logic
 * lives in functions/api/*.js and is shared with the unit tests.
 */
import * as count from '../functions/api/count.js';
import * as signup from '../functions/api/signup.js';

const routes = {
  '/api/signup': { POST: signup.onRequestPost, fallback: signup.onRequest },
  '/api/count': { GET: count.onRequestGet, fallback: count.onRequest },
};

export default {
  async fetch(request, env) {
    const route = routes[new URL(request.url).pathname];
    if (!route) return env.ASSETS.fetch(request);
    const handler = route[request.method] ?? route.fallback;
    return handler({ request, env });
  },
};
