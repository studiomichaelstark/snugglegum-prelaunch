/**
 * Cloudflare Pages Function: GET /api/count
 *
 * Returns { "count": <number of sign-ups so far> } from the KV counter that /api/signup keeps
 * (binding SIGNUPS, key "total"; 0 when it is empty or missing). Never cached.
 */

export const COUNTER_KEY = 'total';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });

export async function handleCount(env) {
  try {
    const stored = Number.parseInt((await env.SIGNUPS?.get(COUNTER_KEY)) ?? '0', 10);
    return json({ count: Number.isFinite(stored) && stored > 0 ? stored : 0 });
  } catch {
    console.error('count: could not read the sign-up counter');
    return json({ count: 0 }, 500);
  }
}

export const onRequestGet = ({ env }) => handleCount(env);

export const onRequest = () => new Response(JSON.stringify({ error: 'Method not allowed.' }), { status: 405, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Allow: 'GET' } });
