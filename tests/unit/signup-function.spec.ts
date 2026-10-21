import { expect, test } from '@playwright/test';
import { cleanEmail, cleanFreeText, cleanMessage, cleanTag, MAX_MESSAGE_LENGTH, COUNTER_KEY, EMAIL_WINDOW_SECONDS, GROUPS, handleSignup, IP_LIMIT, MIN_FORM_AGE_MS } from '../../functions/api/signup.js';
import { handleCount } from '../../functions/api/count.js';

class FakeKv {
  store = new Map<string, string>();
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.store.set(key, value);
  }
}

interface Env {
  MAILERLITE_API_KEY?: string;
  SIGNUPS?: FakeKv;
}
const SECRET = 'test-secret-key-123';
const SITE = 'https://snugglegum.example';
const envWith = (kv: FakeKv | undefined): Env => ({ MAILERLITE_API_KEY: SECRET, SIGNUPS: kv });

// A page that has been open for a few seconds, like a real visitor's.
const AGE = { form_age: '4000' };
function formRequest(fields: Record<string, string>, headers: Record<string, string> = {}) {
  return new Request(`${SITE}/api/signup`, { method: 'POST', body: new URLSearchParams({ ...AGE, ...fields }), headers: { Origin: SITE, ...headers } });
}
const jsonRequest = (body: unknown) =>
  new Request(`${SITE}/api/signup`, { method: 'POST', body: JSON.stringify({ ...AGE, ...(body as object) }), headers: { 'Content-Type': 'application/json', Origin: SITE } });

/** A stand-in for the Cloudflare cache: stores what is put, ignores the TTL. */
class FakeCache {
  store = new Map<string, string>();
  async match(request: Request) {
    const value = this.store.get(request.url);
    return value === undefined ? undefined : new Response(value);
  }
  async put(request: Request, response: Response) {
    this.store.set(request.url, await response.text());
  }
}

interface Call {
  url: string;
  init: { method: string; headers: Record<string, string>; body: string };
}
/** A fetch that records the MailerLite call and answers with the given status. */
const mailerLite = (status = 201, responseBody: unknown = { data: { id: '1' } }) => {
  const calls: Call[] = [];
  const impl = (async (url: string, init: Call['init']) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(responseBody), { status });
  }) as unknown as typeof fetch;
  return { calls, impl };
};

const GOOD = { 'fields[email]': 'a@example.com', consent: 'on', 'fields[product_interest]': 'gen-z', 'fields[flavor_vote]': 'pineapple' };

test.describe('POST /api/signup', () => {
  test('sends the right request to the MailerLite Connect API', async () => {
    const ml = mailerLite();
    const response = await handleSignup(
      formRequest({
        ...GOOD,
        'fields[product_interest]': 'gen-z,boomer',
        'fields[flavor_vote]': 'pineapple',
        'fields[flavor_other]': '  Mango chili  ',
        'fields[utm_source]': 'tiktok',
        'fields[utm_campaign]': 'founding500',
        'fields[utm_medium]': 'social',
      }),
      envWith(new FakeKv()),
      ml.impl,
    );
    expect(response.status).toBe(200);
    const call = ml.calls[0]!;
    expect(call.url).toBe('https://connect.mailerlite.com/api/subscribers');
    expect(call.init.method).toBe('POST');
    expect(call.init.headers).toMatchObject({ Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json', Accept: 'application/json' });
    const sent = JSON.parse(call.init.body);
    expect(sent.email).toBe('a@example.com');
    expect(sent.groups).toEqual([GROUPS.founding_member, GROUPS.gen_z, GROUPS.boomer, GROUPS.pineapple]);
    expect(sent.fields).toMatchObject({ flavor_suggestion: 'Mango chili', consent_age_18: 'yes', signup_source: 'founding-member-form', utm_source: 'tiktok', utm_campaign: 'founding500' });
    expect(new Date(sent.fields.consent_at).toISOString()).toBe(sent.fields.consent_at);
    expect(sent.fields.utm_medium).toBeUndefined();
  });

  test('founding_member is always there, plus the picked version and flavor; empty extras are omitted', async () => {
    const ml = mailerLite();
    await handleSignup(formRequest(GOOD), envWith(new FakeKv()), ml.impl);
    const sent = JSON.parse(ml.calls[0]!.init.body);
    expect(sent.groups).toEqual([GROUPS.founding_member, GROUPS.gen_z, GROUPS.pineapple]);
    expect(Object.keys(sent.fields).sort()).toEqual(['consent_age_18', 'consent_at', 'signup_source']);
  });

  test('a version and a flavor (or a suggestion of your own) are required', async () => {
    const ml = mailerLite();
    const base = { 'fields[email]': 'a@example.com', consent: 'on' };
    const noVersion = await handleSignup(formRequest({ ...base, 'fields[flavor_vote]': 'pineapple' }), envWith(new FakeKv()), ml.impl);
    expect(noVersion.status).toBe(400);
    const noFlavor = await handleSignup(formRequest({ ...base, 'fields[product_interest]': 'boomer' }), envWith(new FakeKv()), ml.impl);
    expect(noFlavor.status).toBe(400);
    expect(ml.calls).toHaveLength(0);
    // A suggestion of your own is enough for the flavor.
    const own = await handleSignup(formRequest({ ...base, 'fields[product_interest]': 'boomer', 'fields[flavor_other]': 'Mango' }), envWith(new FakeKv()), ml.impl);
    expect(own.status).toBe(200);
    expect(JSON.parse(ml.calls[0]!.init.body).groups).toEqual([GROUPS.founding_member, GROUPS.boomer]);
  });

  test('maps the form\'s own names (gen-z, fields[flavor_other], fields[email], consent) to the same groups and fields', async () => {
    const ml = mailerLite();
    await handleSignup(
      formRequest({ 'fields[email]': 'a@example.com', consent: 'on', 'fields[product_interest]': 'gen-z,millennials,boomer', 'fields[flavor_vote]': 'energy,pineapple', 'fields[flavor_other]': 'Mango' }),
      envWith(new FakeKv()),
      ml.impl,
    );
    const sent = JSON.parse(ml.calls[0]!.init.body);
    expect(sent.email).toBe('a@example.com');
    expect(sent.groups).toEqual([GROUPS.founding_member, GROUPS.gen_z, GROUPS.millennials, GROUPS.boomer, GROUPS.energy, GROUPS.pineapple]);
    expect(sent.fields.flavor_suggestion).toBe('Mango');
    expect(sent.fields.consent_age_18).toBe('yes');
  });

  test('hyphenated and underscored checkbox keys both work, and consent_age_18 alone counts as consent', async () => {
    const ml = mailerLite();
    await handleSignup(formRequest({ email: 'a@example.com', consent_age_18: 'yes', 'gen-z': 'on', gen_z: 'on', boomer: 'yes', 'fields[energy]': 'true' }), envWith(new FakeKv()), ml.impl);
    const sent = JSON.parse(ml.calls[0]!.init.body);
    expect(sent.groups).toEqual([GROUPS.founding_member, GROUPS.gen_z, GROUPS.boomer, GROUPS.energy]);
  });

  test('accepts the plain spec names and a JSON body too', async () => {
    const ml = mailerLite();
    const response = await handleSignup(jsonRequest({ email: 'b@example.com', consent_age_18: 'yes', millennials: 'on', energy: true, flavor_suggestion: 'x'.repeat(300) }), envWith(new FakeKv()), ml.impl);
    expect(response.status).toBe(200);
    const sent = JSON.parse(ml.calls[0]!.init.body);
    expect(sent.groups).toEqual([GROUPS.founding_member, GROUPS.millennials, GROUPS.energy]);
    expect(sent.fields.flavor_suggestion).toHaveLength(200);
  });

  test('every accepted sign-up gets the next number, and the answer looks the same for a new and a known address', async () => {
    const kv = new FakeKv();
    const created = await handleSignup(formRequest({ ...GOOD, 'fields[email]': 'new@example.com' }), envWith(kv), mailerLite(201).impl, null);
    // 200 = MailerLite only updated an address that was already on the list.
    const known = await handleSignup(formRequest({ ...GOOD, 'fields[email]': 'known@example.com' }), envWith(kv), mailerLite(200, { data: { id: '1', created_at: '2020-01-01 10:00:00' } }).impl, null);
    const [a, b] = [await created.json(), await known.json()];
    expect(a).toEqual({ ok: true, number: 1 });
    expect(b).toEqual({ ok: true, number: 2 });
    expect(Object.keys(a)).toEqual(Object.keys(b));
    expect(created.status).toBe(known.status);
    expect([...created.headers.keys()].sort()).toEqual([...known.headers.keys()].sort());
    expect(kv.store.get(COUNTER_KEY)).toBe('2');
  });

  test('an upstream failure is generic, carries the status, does not count, and never leaks the body or the key', async () => {
    const kv = new FakeKv();
    const leaky = mailerLite(500, { message: `internal detail with token ${SECRET}` });
    const response = await handleSignup(formRequest(GOOD), envWith(kv), leaky.impl);
    const text = await response.text();
    expect(response.status).toBe(502);
    expect(JSON.parse(text)).toMatchObject({ ok: false, status: 500 });
    expect(text).not.toContain('internal detail');
    expect(text).not.toContain(SECRET);
    expect(kv.store.size).toBe(0);
  });

  test('upstream 422 becomes an email error the form understands, still without the body', async () => {
    const response = await handleSignup(formRequest(GOOD), envWith(new FakeKv()), mailerLite(422, { errors: { email: ['secret detail'] } }).impl);
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.errors.fields.email).toEqual(['invalid']);
    expect(JSON.stringify(body)).not.toContain('secret detail');
  });

  test('a 422 about a custom field or group is OUR setup problem: plain 500, no email error, and only the field names are logged', async () => {
    const logged: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => void logged.push(args.join(' '));
    try {
      const body = { message: 'The given data was invalid. secret-detail', errors: { 'fields.consent_at': ['The selected fields.consent_at is invalid.'], 'groups.0': ['x'] } };
      const response = await handleSignup(formRequest(GOOD), envWith(new FakeKv()), mailerLite(422, body).impl, null);
      const text = await response.text();
      expect(response.status).toBe(500);
      expect(JSON.parse(text).errors).toBeUndefined();
      expect(text).not.toMatch(/secret-detail|consent_at/);
      expect(logged.join('\n')).toContain('MailerLite answered 422 (refused: fields.consent_at, groups.0)');
      expect(logged.join('\n')).not.toMatch(/secret-detail|The selected/);
    } finally {
      console.error = original;
    }
  });

  test('400 for an invalid email and for a missing 18+ consent, without calling MailerLite', async () => {
    const ml = mailerLite();
    const badEmail = await handleSignup(formRequest({ ...GOOD, 'fields[email]': 'nope' }), envWith(new FakeKv()), ml.impl);
    const noConsent = await handleSignup(formRequest({ 'fields[email]': 'a@example.com' }), envWith(new FakeKv()), ml.impl);
    expect(badEmail.status).toBe(400);
    expect(noConsent.status).toBe(400);
    expect((await noConsent.json()).error).toMatch(/18/);
    expect(ml.calls).toHaveLength(0);
  });

  test('rejects a foreign Origin and ignores bots (filled honeypot) without calling MailerLite or counting', async () => {
    const ml = mailerLite();
    const kv = new FakeKv();
    expect((await handleSignup(formRequest(GOOD, { Origin: 'https://evil.example' }), envWith(kv), ml.impl)).status).toBe(403);
    expect(await (await handleSignup(formRequest({ ...GOOD, website: 'http://spam' }), envWith(kv), ml.impl)).json()).toEqual({ ok: true });
    expect(ml.calls).toHaveLength(0);
    expect(kv.store.size).toBe(0);
  });

  test('works without the KV binding (no number), and fails cleanly without the API key or when MailerLite is down', async () => {
    expect(await (await handleSignup(formRequest(GOOD), envWith(undefined), mailerLite().impl)).json()).toEqual({ ok: true, number: null });
    expect((await handleSignup(formRequest(GOOD), { SIGNUPS: new FakeKv() }, mailerLite().impl)).status).toBe(500);
    const down = (async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect((await handleSignup(formRequest(GOOD), envWith(new FakeKv()), down)).status).toBe(502);
  });
});

test.describe('POST /api/signup, hardening', () => {
  const run = (request: Request, ml = mailerLite(), cache: FakeCache | null = new FakeCache(), kv: FakeKv | undefined = new FakeKv()) => handleSignup(request, envWith(kv), ml.impl, cache);

  test('accepts only same-origin requests: Origin, or Sec-Fetch-Site, or Referer; a bare script is refused', async () => {
    const bare = (headers: Record<string, string>) => new Request(`${SITE}/api/signup`, { method: 'POST', body: new URLSearchParams({ ...AGE, ...GOOD }), headers });
    expect((await run(bare({}))).status).toBe(403);
    expect((await run(bare({ Origin: 'https://evil.example' }))).status).toBe(403);
    expect((await run(bare({ 'Sec-Fetch-Site': 'cross-site' }))).status).toBe(403);
    expect((await run(bare({ Referer: 'https://evil.example/page' }))).status).toBe(403);
    expect((await run(bare({ 'Sec-Fetch-Site': 'same-origin' }))).status).toBe(200);
    expect((await run(bare({ Referer: `${SITE}/#newsletter-home` }))).status).toBe(200);
  });

  test('refuses other content types and bodies over the cap, even without a Content-Length', async () => {
    const text = new Request(`${SITE}/api/signup`, { method: 'POST', body: 'email=a@example.com', headers: { Origin: SITE, 'Content-Type': 'text/plain' } });
    expect((await run(text)).status).toBe(415);
    const big = new Request(`${SITE}/api/signup`, { method: 'POST', body: new URLSearchParams({ ...AGE, ...GOOD, 'fields[flavor_other]': 'x'.repeat(20_000) }), headers: { Origin: SITE } });
    expect((await run(big)).status).toBe(413);
    const stream = new Request(`${SITE}/api/signup`, {
      method: 'POST',
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`form_age=4000&fields[email]=a@example.com&consent=on&pad=${'x'.repeat(20_000)}`));
          controller.close();
        },
      }),
      headers: { Origin: SITE, 'Content-Type': 'application/x-www-form-urlencoded' },
      // @ts-expect-error Node needs this for a streamed request body.
      duplex: 'half',
    });
    expect((await run(stream)).status).toBe(413);
  });

  test('turns away submissions that arrive too fast or without form_age', async () => {
    const ml = mailerLite();
    const fast = formRequest({ ...GOOD, form_age: String(MIN_FORM_AGE_MS - 1) });
    const missing = new Request(`${SITE}/api/signup`, { method: 'POST', body: new URLSearchParams(GOOD), headers: { Origin: SITE } });
    const junk = formRequest({ ...GOOD, form_age: 'soon' });
    for (const request of [fast, missing, junk]) expect((await run(request, ml)).status).toBe(429);
    expect(ml.calls).toHaveLength(0);
    expect((await run(formRequest({ ...GOOD, form_age: String(MIN_FORM_AGE_MS) }), ml)).status).toBe(200);
  });

  test('limits attempts per IP, tells the form to slow down, and keeps only a hash of the address', async () => {
    const cache = new FakeCache();
    const ml = mailerLite();
    const fromIp = (n: number) => formRequest({ ...GOOD, 'fields[email]': `user${n}@example.com` }, { 'CF-Connecting-IP': '203.0.113.9' });
    for (let n = 0; n < IP_LIMIT; n++) expect((await run(fromIp(n), ml, cache)).status).toBe(200);
    const blocked = await run(fromIp(99), ml, cache);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    expect(ml.calls).toHaveLength(IP_LIMIT);
    // Another visitor is not affected, and nothing in the cache contains an address.
    expect((await run(formRequest(GOOD, { 'CF-Connecting-IP': '198.51.100.7' }), ml, cache)).status).toBe(200);
    expect([...cache.store.keys()].join(' ')).not.toMatch(/203\.0\.113|198\.51\.100|example\.com/);
  });

  test('the same address twice within the window reaches MailerLite once, is counted once, and gets the same number', async () => {
    const cache = new FakeCache();
    const kv = new FakeKv();
    const ml = mailerLite();
    const first = await (await run(formRequest(GOOD), ml, cache, kv)).json();
    const again = await (await run(formRequest({ ...GOOD, 'fields[email]': ' A@Example.com ' }), ml, cache, kv)).json();
    expect(first).toEqual({ ok: true, number: 1 });
    expect(again).toEqual({ ok: true, number: 1 });
    expect(ml.calls).toHaveLength(1);
    expect(kv.store.get(COUNTER_KEY)).toBe('1');
    expect(EMAIL_WINDOW_SECONDS).toBeGreaterThan(0);
  });

  test('a failed attempt does not lock the address out', async () => {
    const cache = new FakeCache();
    expect((await run(formRequest(GOOD), mailerLite(500), cache)).status).toBe(502);
    expect((await run(formRequest(GOOD), mailerLite(201), cache)).status).toBe(200);
  });

  test('visitors cannot name groups or inject fields: only the form\'s own ids count', async () => {
    const ml = mailerLite();
    await run(
      new Request(`${SITE}/api/signup`, {
        method: 'POST',
        body: new URLSearchParams([...Object.entries({ ...AGE, ...GOOD, 'fields[product_interest]': 'gen-z,admin,999' }), ['groups[]', '999'], ['groups', '999'], ['fields[status]', 'unsubscribed'], ['status', 'active'], ['__proto__', 'x']]),
        headers: { Origin: SITE },
      }),
      ml,
    );
    const sent = JSON.parse(ml.calls[0]!.init.body);
    expect(sent.groups).toEqual([GROUPS.founding_member, GROUPS.gen_z, GROUPS.pineapple]);
    expect(Object.keys(sent).sort()).toEqual(['email', 'fields', 'groups']);
    expect(Object.keys(sent.fields).sort()).toEqual(['consent_age_18', 'consent_at', 'signup_source']);
  });

  test('cleans the address and the free text before they leave', async () => {
    expect(cleanEmail(' Anna@Example.COM ')).toBe('Anna@example.com');
    for (const bad of ['a@b..com', 'a..b@x.com', '.a@x.com', 'a@x.com,b@y.com', 'a@x.com b@y.com', 'a@x.com\nBcc: b@y.com', '<a@x.com>', 'a@-x.com', `${'a'.repeat(65)}@x.com`, `a@${'b'.repeat(250)}.com`, 'a@x']) {
      expect(cleanEmail(bad), bad).toBe('');
    }
    expect(cleanFreeText('=HYPERLINK("http://evil") <script>alert(1)</script>\u202e  Mango\n\tchili ', 200)).toBe('HYPERLINK("http://evil") scriptalert(1)/script Mango chili');
    expect(cleanFreeText('@SUM(A1) +1 -2', 200)).toBe('SUM(A1) +1 -2');
    expect(cleanFreeText('x'.repeat(500), 200)).toHaveLength(200);
    expect(cleanTag('tik<tok>&x=1;DROP TABLE')).toBe('tiktokx1DROP TABLE');

    const ml = mailerLite();
    await run(formRequest({ ...GOOD, 'fields[flavor_other]': '=1+1 <b>Mango</b>', 'fields[utm_source]': 'tiktok"><img src=x>' }), ml);
    const sent = JSON.parse(ml.calls[0]!.init.body);
    expect(sent.fields.flavor_suggestion).toBe('1+1 bMango/b');
    expect(sent.fields.utm_source).toBe('tiktokimg srcx');
  });

  test('a JSON body that is not an object is refused, and a method other than POST gets 405 with Allow', async () => {
    const array = new Request(`${SITE}/api/signup`, { method: 'POST', body: '[1,2]', headers: { Origin: SITE, 'Content-Type': 'application/json' } });
    expect((await run(array)).status).toBe(400);
    const { onRequest } = await import('../../functions/api/signup.js');
    const response = onRequest();
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
  });

  test.describe('Turnstile (only when TURNSTILE_SECRET_KEY is set)', () => {
    const SECRET_T = 'turnstile-secret-xyz';
    const withTurnstile = (verdict: 'pass' | 'fail' | 'down') => {
      const calls: { url: string; secret?: string; response?: string; remoteip?: string }[] = [];
      const ml = mailerLite();
      const impl = (async (url: string, init: { method: string; body: FormData | string; headers?: Record<string, string> }) => {
        if (String(url).includes('challenges.cloudflare.com')) {
          const form = init.body as FormData;
          calls.push({ url, secret: String(form.get('secret')), response: String(form.get('response')), remoteip: String(form.get('remoteip')) });
          if (verdict === 'down') throw new Error('offline');
          return new Response(JSON.stringify({ success: verdict === 'pass' }));
        }
        return (ml.impl as unknown as (u: string, i: unknown) => Promise<Response>)(url, init);
      }) as unknown as typeof fetch;
      return { calls, mlCalls: ml.calls, impl };
    };
    const env = (kv = new FakeKv()) => ({ MAILERLITE_API_KEY: SECRET, SIGNUPS: kv, TURNSTILE_SECRET_KEY: SECRET_T });

    test('a valid token passes, and Cloudflare is asked with the secret, the token and the IP', async () => {
      const t = withTurnstile('pass');
      const response = await handleSignup(formRequest({ ...GOOD, 'cf-turnstile-response': 'tok-123' }, { 'CF-Connecting-IP': '203.0.113.5' }), env(), t.impl, null);
      expect(response.status).toBe(200);
      expect(t.calls[0]).toMatchObject({ url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify', secret: SECRET_T, response: 'tok-123', remoteip: '203.0.113.5' });
      expect(t.mlCalls).toHaveLength(1);
    });

    test('a missing, invalid or unverifiable token is refused before MailerLite, without counting', async () => {
      for (const [verdict, fields] of [['pass', {}], ['fail', { 'cf-turnstile-response': 'bad' }], ['down', { 'cf-turnstile-response': 'tok' }]] as const) {
        const kv = new FakeKv();
        const t = withTurnstile(verdict);
        const response = await handleSignup(formRequest({ ...GOOD, ...fields }), env(kv), t.impl, null);
        const body = await response.json();
        expect(response.status, verdict).toBe(403);
        expect(body.challenge).toBe(true);
        expect(JSON.stringify(body)).not.toContain(SECRET_T);
        expect(t.mlCalls).toHaveLength(0);
        expect(kv.store.size).toBe(0);
      }
    });

    test('without the secret there is no check and no call to Cloudflare', async () => {
      const t = withTurnstile('fail');
      const response = await handleSignup(formRequest(GOOD), envWith(new FakeKv()), t.impl, null);
      expect(response.status).toBe(200);
      expect(t.calls).toHaveLength(0);
    });
  });

  test('every answer is no-store and nosniff, and error bodies never contain the key or the upstream text', async () => {
    const leaky = mailerLite(401, { message: `bad token ${SECRET}` });
    for (const response of [await run(formRequest(GOOD), leaky), await run(formRequest({ ...GOOD, 'fields[email]': 'x' }))]) {
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(await response.text()).not.toMatch(/bad token|test-secret/);
    }
    expect((await run(formRequest({ ...GOOD, 'fields[email]': 'y@example.com' }), mailerLite(401))).status).toBe(500);
  });
});

test.describe('GET /api/count', () => {
  test('returns the stored total, 0 when empty, as uncached JSON', async () => {
    const kv = new FakeKv();
    const empty = await handleCount({ SIGNUPS: kv });
    expect(await empty.json()).toEqual({ count: 0 });
    expect(empty.headers.get('Cache-Control')).toBe('no-store');
    kv.store.set(COUNTER_KEY, '1234');
    expect(await (await handleCount({ SIGNUPS: kv })).json()).toEqual({ count: 1234 });
    expect(await (await handleCount({})).json()).toEqual({ count: 0 });
  });
});

test.describe('the optional message to the team', () => {
  test('is cleaned, capped and sent as the "message" custom field; no message, no field', async () => {
    const ml = mailerLite();
    await handleSignup(formRequest({ ...GOOD, 'fields[message]': '  =Love the idea!\n\n=SUM(A1) <b>please</b> \u202e ' }), envWith(new FakeKv()), ml.impl);
    expect(JSON.parse(ml.calls[0]!.init.body).fields.message).toBe('Love the idea! =SUM(A1) bplease/b');

    const none = mailerLite();
    await handleSignup(formRequest({ ...GOOD, 'fields[message]': '   ' }), envWith(new FakeKv()), none.impl);
    expect(JSON.parse(none.calls[0]!.init.body).fields.message).toBeUndefined();

    const long = mailerLite();
    await handleSignup(formRequest({ ...GOOD, 'fields[message]': 'a'.repeat(5000) }), envWith(new FakeKv()), long.impl);
    expect(JSON.parse(long.calls[0]!.init.body).fields.message).toHaveLength(MAX_MESSAGE_LENGTH);
  });

  test('a message with a link is dropped, the sign-up still goes through', () => {
    for (const bad of ['see https://evil.example/x', 'visit www.evil.example', 'mail me at evil.com', 'ftp://x', '\uff57\uff57\uff57\uff0eevil\uff0ecom', 'hxxp://a.b is not the same but javascript://x']) {
      expect(cleanMessage(bad), bad).toBe('');
    }
    expect(cleanMessage('Can you add a mint flavor, please?')).toBe('Can you add a mint flavor, please?');
    expect(cleanMessage('a')).toBe('');
  });

  test('the sign-up works when the account has no "message" field yet: one retry without it, nothing leaks', async () => {
    const calls: { body: string }[] = [];
    const impl = (async (_url: string, init: { body: string }) => {
      calls.push({ body: init.body });
      return calls.length === 1 ? new Response(JSON.stringify({ errors: { 'fields.message': ['unknown'] } }), { status: 422 }) : new Response('{}', { status: 201 });
    }) as unknown as typeof fetch;
    const response = await handleSignup(formRequest({ ...GOOD, 'fields[message]': 'Hello team' }), envWith(new FakeKv()), impl);
    expect(response.status).toBe(200);
    expect(calls).toHaveLength(2);
    expect(JSON.parse(calls[0]!.body).fields.message).toBe('Hello team');
    expect(JSON.parse(calls[1]!.body).fields.message).toBeUndefined();
  });

  test('other refusals are not retried, and the message is never logged', async () => {
    const logged: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => void logged.push(args.join(' '));
    try {
      const ml = mailerLite(422, { errors: { 'fields.consent_at': ['x'] } });
      const response = await handleSignup(formRequest({ ...GOOD, 'fields[message]': 'secret note' }), envWith(new FakeKv()), ml.impl);
      expect(response.status).toBe(500);
      expect(ml.calls).toHaveLength(1);
      expect(logged.join('\n')).not.toContain('secret note');
    } finally {
      console.error = original;
    }
  });
});
