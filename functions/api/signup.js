/**
 * Cloudflare Pages Function: POST /api/signup
 *
 * Creates (or updates) a MailerLite subscriber through the Connect API, puts them in the right
 * groups, and, only when MailerLite answers 2xx, counts the sign-up in KV (binding SIGNUPS, key "total").
 *
 *   -> { "ok": true, "number": 42 }      number = the new total, used for "No. 042 of 500" on the ticket
 *
 * Secrets and bindings (Cloudflare Pages -> Settings; see README "Sign-up flow"):
 *   MAILERLITE_API_KEY   secret. Read from env only: never hardcoded, never logged, never sent to the browser.
 *   SIGNUPS              KV namespace binding.
 *   TURNSTILE_SECRET_KEY optional secret, switches the Turnstile check on (see README, "Security").
 *
 * The page's form posts its own field names (the hosted-form style fields[email], fields[product_interest]
 * as "gen-z,boomer", fields[flavor_vote] as "pineapple,energy", fields[flavor_other], consent). They are
 * mapped to MailerLite groups and fields here, so the form markup does not have to change. The plain
 * names from the spec (email, gen_z, ..., flavor_suggestion, consent_age_18) are accepted too, and every
 * group id works with "-" or "_" ("gen-z" = "gen_z"), as a list value or as a checkbox-style key.
 *
 * Counting and the answer: every accepted sign-up gets the next number, whether the address was new or already
 * on the list, and the answer looks the same either way. That is on purpose: a number that appeared only for
 * new addresses would tell anyone who submits an address whether it is already subscribed. The price is that
 * a person who signs up again (more than 10 minutes later) is counted again. The same address within 10
 * minutes is not sent twice and gets the number it got the first time.
 *
 * Optional bot check: when TURNSTILE_SECRET_KEY is set, the form must come with a valid Cloudflare Turnstile
 * token (field cf-turnstile-response). Without the secret the check is simply off.
 *
 * Hardening (see README, "Security"): same-origin only, size/type limits on the raw body, strict email and
 * text cleaning (no control characters, no spreadsheet formulas, no HTML), only our own group ids, a
 * minimum form age (scripts that skip the page fail), per-IP and per-email limits kept in the Cloudflare
 * cache (IPs and emails only as short-lived hashes), and generic errors that never echo upstream bodies.
 *
 * KV reads and writes are not atomic and reads can lag by up to a minute across locations, so two
 * sign-ups in the same instant can get the same number. A Durable Object would make it strict.
 */

export const GROUPS = {
  founding_member: '201827997333849619',
  gen_z: '201828008929002882',
  millennials: '201828016014231279',
  boomer: '201828023361602872',
  pineapple: '201828037197563265',
  energy: '201828046352680549',
};

export const COUNTER_KEY = 'total';
const CONNECT_URL = 'https://connect.mailerlite.com/api/subscribers';
const SELECTABLE_GROUPS = ['gen_z', 'millennials', 'boomer', 'pineapple', 'energy'];
const MAX_BODY_BYTES = 8 * 1024;
const MAX_KEYS = 40;
const MAX_KEY_LENGTH = 100;
const MAX_VALUE_LENGTH = 1000;
const MAX_FLAVOR_LENGTH = 200;
const MAX_TAG_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TRUTHY = new Set(['on', 'yes', 'true', '1']);
const BODY_TYPES = ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'];

/** A real visitor needs more than this between loading the page and sending the form. Scripts do not. */
export const MIN_FORM_AGE_MS = 700;
/** Attempts per IP and window. Generous for a household or an office, hopeless for a bot. */
export const IP_LIMIT = 8;
export const IP_WINDOW_SECONDS = 10 * 60;
/** The same address is sent to MailerLite once per window; the rest are treated as already done. */
export const EMAIL_WINDOW_SECONDS = 10 * 60;

const SECURITY_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...SECURITY_HEADERS, ...extraHeaders } });

/** True when the request comes from a page on our own origin (browsers always say so on a POST). */
function isSameOrigin(request) {
  const own = new URL(request.url).origin;
  const origin = request.headers.get('Origin');
  if (origin) return origin === own;
  if (request.headers.get('Sec-Fetch-Site') === 'same-origin') return true;
  const referer = request.headers.get('Referer');
  if (!referer) return false;
  try {
    return new URL(referer).origin === own;
  } catch {
    return false;
  }
}

/**
 * Reads the raw body (capped at MAX_BODY_BYTES even when Content-Length is missing or lies) and turns a
 * form-urlencoded, multipart or JSON body into a plain { key: string } object without a prototype.
 */
async function readBody(request, type) {
  const raw = await request.arrayBuffer();
  if (raw.byteLength > MAX_BODY_BYTES) return { tooLarge: true };
  const values = Object.create(null);
  const put = (key, value) => {
    if (Object.keys(values).length >= MAX_KEYS || key.length > MAX_KEY_LENGTH) return;
    values[key] = value.slice(0, MAX_VALUE_LENGTH);
  };
  if (type === 'application/json') {
    const data = JSON.parse(new TextDecoder().decode(raw));
    if (data === null || typeof data !== 'object' || Array.isArray(data)) throw new Error('JSON body must be an object');
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') put(key, String(value));
    }
    return { values };
  }
  const form = await new Response(raw, { headers: { 'Content-Type': request.headers.get('Content-Type') } }).formData();
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') put(key, value);
  }
  return { values };
}

// Control characters, line/paragraph separators, zero-width and bidi-override characters.
const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u2069\ufeff]/g;

/** A free-text answer as it may be stored: one line, no HTML, no spreadsheet formula starter. */
export function cleanFreeText(value, max) {
  return value
    .replace(INVISIBLE, ' ')
    .replace(/[<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[=+\-@]+/, '')
    .trim()
    .slice(0, max)
    .trim();
}

/** A campaign tag (utm_*): letters, digits and a few separators only. */
export function cleanTag(value, max = MAX_TAG_LENGTH) {
  return value.replace(INVISIBLE, '').replace(/[^\w\-.~ +%]/g, '').trim().slice(0, max);
}

/** The address, trimmed and with a lowercase domain, or '' when it is not a plausible single address. */
export function cleanEmail(value) {
  const email = value.trim();
  if (email.length > 254 || INVISIBLE.test(email) || /[\s,;<>()[\]\\"]/.test(email) || !EMAIL_PATTERN.test(email)) return '';
  const at = email.lastIndexOf('@');
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..') || domain.includes('..') || domain.startsWith('.') || domain.startsWith('-')) return '';
  return `${local}@${domain.toLowerCase()}`;
}

/** First 24 hex characters of SHA-256: enough to tell visitors apart, nothing to read back. */
async function digest(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].slice(0, 12).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const cacheKey = (kind, id) => new Request(`https://limits.snugglegum.invalid/${kind}/${id}`);

/**
 * Counts one attempt for this key in the Cloudflare cache and says whether it is still within the limit.
 * Per data center and not atomic, which is fine for abuse control. No cache (tests, plain Node) = no limit.
 */
async function withinLimit(cache, kind, id, limit, windowSeconds) {
  if (!cache) return true;
  try {
    const key = cacheKey(kind, id);
    const found = await cache.match(key);
    const count = found ? Number.parseInt(await found.text(), 10) || 0 : 0;
    if (count >= limit) return false;
    await cache.put(key, new Response(String(count + 1), { headers: { 'Cache-Control': `max-age=${windowSeconds}` } }));
    return true;
  } catch {
    return true;
  }
}

/** What was stored for this key ('' counts), or null when there is nothing (or no cache). */
const recall = async (cache, kind, id) => {
  if (!cache) return null;
  try {
    const found = await cache.match(cacheKey(kind, id));
    return found ? await found.text() : null;
  } catch {
    return null;
  }
};
const remember = async (cache, kind, id, windowSeconds, value) => {
  if (!cache) return;
  try {
    await cache.put(cacheKey(kind, id), new Response(value, { headers: { 'Cache-Control': `max-age=${windowSeconds}` } }));
  } catch {
    // Best effort.
  }
};

/** Asks Cloudflare whether this Turnstile token is valid. Fails closed: no token, or no answer, means no. */
async function turnstileOk(secret, token, ip, fetchImpl) {
  if (!token || token.length > 2048) return false;
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  try {
    const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    return (await response.json())?.success === true;
  } catch {
    console.error('signup: Turnstile could not be checked');
    return false;
  }
}

const defaultCache = () => (typeof caches !== 'undefined' && caches.default) || null;

const first = (values, ...keys) => {
  for (const key of keys) if (typeof values[key] === 'string' && values[key].trim() !== '') return values[key].trim();
  return '';
};

/** Normalizes "gen-z" / "Gen Z" / "gen_z" to "gen_z". */
const normalizeId = (value) => value.trim().toLowerCase().replace(/[\s-]+/g, '_');

/** Which selectable groups were checked. An unchecked box is simply absent. */
function selectedGroups(values) {
  const selected = new Set();
  for (const list of [values['fields[product_interest]'], values.product_interest, values['fields[flavor_vote]'], values.flavor_vote]) {
    for (const id of (list ?? '').split(',').map(normalizeId)) if (SELECTABLE_GROUPS.includes(id)) selected.add(id);
  }
  for (const id of SELECTABLE_GROUPS) {
    // Checkbox style: gen_z=on or gen-z=on, optionally wrapped as fields[gen-z].
    const keys = [id, id.replace(/_/g, '-')].flatMap((key) => [key, `fields[${key}]`]);
    if (keys.some((key) => TRUTHY.has(String(values[key] ?? '').toLowerCase()))) selected.add(id);
  }
  return [...selected];
}

/** Takes the next number from the KV counter. Returns null when there is no counter or it fails. */
async function nextNumber(kv) {
  if (!kv) return null;
  try {
    const stored = Number.parseInt((await kv.get(COUNTER_KEY)) ?? '0', 10);
    const next = (Number.isFinite(stored) && stored > 0 ? stored : 0) + 1;
    await kv.put(COUNTER_KEY, String(next));
    return next;
  } catch {
    console.error('signup: could not update the sign-up counter');
    return null;
  }
}

export async function handleSignup(request, env, fetchImpl = fetch, cache = defaultCache()) {
  if (!isSameOrigin(request)) return json({ ok: false, error: 'Forbidden.' }, 403);

  const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (!BODY_TYPES.includes(type)) return json({ ok: false, error: 'Unsupported request.' }, 415);
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) return json({ ok: false, error: 'Request too large.' }, 413);

  let body;
  try {
    body = await readBody(request, type);
  } catch {
    return json({ ok: false, error: 'We could not read that request.' }, 400);
  }
  if (body.tooLarge) return json({ ok: false, error: 'Request too large.' }, 413);
  const values = body.values;

  // Bots fill the hidden field. Pretend it worked: nothing is sent and no number is used up.
  if ((values.website ?? '').trim()) return json({ ok: true });

  // Per-IP limit. The address is only ever kept as a short hash, for as long as the window lasts.
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip && !(await withinLimit(cache, 'ip', await digest(ip), IP_LIMIT, IP_WINDOW_SECONDS))) {
    return json({ ok: false, error: 'Too many tries. Please wait a moment.' }, 429, { 'Retry-After': String(IP_WINDOW_SECONDS) });
  }

  // The form reports how long the page had been open. Scripts that skip the page leave it out or send ~0.
  const age = Number(first(values, 'form_age'));
  if (!Number.isFinite(age) || age < MIN_FORM_AGE_MS) {
    return json({ ok: false, error: 'Please try again in a moment.' }, 429, { 'Retry-After': '2' });
  }

  if (env.TURNSTILE_SECRET_KEY && !(await turnstileOk(env.TURNSTILE_SECRET_KEY, first(values, 'cf-turnstile-response'), ip, fetchImpl))) {
    return json({ ok: false, error: 'We could not check that you are human. Please try again.', challenge: true }, 403);
  }

  const email = cleanEmail(first(values, 'email', 'fields[email]'));
  if (!email) {
    return json({ ok: false, error: 'Please enter a valid email address.', errors: { fields: { email: ['invalid'] } } }, 400);
  }
  if (!TRUTHY.has(first(values, 'consent_age_18', 'consent').toLowerCase())) {
    return json({ ok: false, error: 'Please confirm you are 18 or older and agree to the emails.' }, 400);
  }

  // The same address again within the window (double click, reload, mail bombing): already done, same number.
  // Case-insensitive on purpose: MailerLite treats A@x.com and a@x.com as one subscriber.
  const emailId = await digest(email.toLowerCase());
  const earlier = await recall(cache, 'email', emailId);
  if (earlier !== null) return json({ ok: true, number: Number.parseInt(earlier, 10) || null });

  const apiKey = env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.error('signup: MAILERLITE_API_KEY is not set');
    return json({ ok: false, error: 'Sign-up is not available right now.' }, 500);
  }

  const fields = {
    consent_at: new Date().toISOString(),
    consent_age_18: 'yes',
    signup_source: 'founding-member-form',
  };
  const flavor = cleanFreeText(first(values, 'flavor_suggestion', 'fields[flavor_other]', 'flavor_other'), MAX_FLAVOR_LENGTH);
  if (flavor) fields.flavor_suggestion = flavor;
  for (const name of ['utm_source', 'utm_campaign']) {
    const value = cleanTag(first(values, name, `fields[${name}]`));
    if (value) fields[name] = value;
  }

  // Groups come only from our own list of ids: nothing the visitor sends can name another group.
  const payload = {
    email,
    groups: [GROUPS.founding_member, ...selectedGroups(values).map((id) => GROUPS[id])],
    fields,
  };

  let upstream;
  try {
    upstream = await fetchImpl(CONNECT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    console.error('signup: MailerLite could not be reached');
    return json({ ok: false, error: 'We could not reach the list. Please try again.', status: 502 }, 502);
  }

  if (!(upstream.status >= 200 && upstream.status < 300)) {
    const refused = await upstream.json().catch(() => null);
    const problems = refused && typeof refused.errors === 'object' && refused.errors !== null ? Object.keys(refused.errors) : [];
    // Log the status, and for a 422 only the NAMES of the refused fields (never their values or MailerLite's text):
    // "fields.consent_at" or "groups.0" means our setup is off (a missing custom field or group), not the visitor.
    const names = problems.filter((name) => /^[\w.\[\]-]{1,60}$/.test(name)).slice(0, 6);
    console.error(`signup: MailerLite answered ${upstream.status}${names.length ? ` (refused: ${names.join(', ')})` : ''}`);
    // Only a refused email address is the visitor's problem. Any other 422 is a setup problem and looks like our failure.
    const emailRejected = upstream.status === 422 && problems.includes('email');
    // Our own failures (bad key, no access, unknown field or group) are not the visitor's business: a plain 500.
    const status = upstream.status === 429 || emailRejected ? upstream.status : upstream.status >= 500 ? 502 : 500;
    return json(
      {
        ok: false,
        error: 'Something went wrong on our side. Please try again.',
        status: upstream.status,
        ...(emailRejected ? { errors: { fields: { email: ['invalid'] } } } : {}),
      },
      status,
    );
  }

  // Same answer for a new address and one that was already on the list (MailerLite only updates it).
  const number = await nextNumber(env.SIGNUPS);
  await remember(cache, 'email', emailId, EMAIL_WINDOW_SECONDS, number === null ? '' : String(number));
  return json({ ok: true, number });
}

export const onRequestPost = ({ request, env }) => handleSignup(request, env);

export const onRequest = () => json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'POST' });
