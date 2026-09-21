import { expect, test } from '@playwright/test';
import { collectPlaceholderReport } from '../../scripts/lib/placeholder-report.mjs';
import { markerFor, placeholderSpecs, resolvePlaceholders, sentence } from '../../src/config/placeholders';
import { parseCount } from '../../src/config/variants';

const required = placeholderSpecs.filter(
  (spec) => !('optional' in spec && spec.optional) && !('fallback' in spec) && !('blocking' in spec && spec.blocking === false),
);
const blockingCount = placeholderSpecs.filter((spec) => !('blocking' in spec && spec.blocking === false)).length;

/** An environment where every placeholder has a valid value. */
const fullEnv = Object.fromEntries(
  placeholderSpecs.map((spec) => [spec.env, 'kind' in spec && spec.kind === 'flag' ? 'true' : `value for ${spec.id}`]),
);

test.describe('placeholders in .env (src/config/placeholders.ts)', () => {
  test('every variable name is unique and starts with PUBLIC_', () => {
    const names = placeholderSpecs.map((spec) => spec.env);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^PUBLIC_[A-Z_]+$/);
  });

  test('an empty value becomes a visible [[TODO]] marker', () => {
    const resolved = resolvePlaceholders({});
    expect(resolved.contactEmail.status).toBe('missing');
    expect(resolved.contactEmail.display).toBe(markerFor('contact email'));
    expect(resolved.contactEmail.display).toMatch(/^\[\[TODO: .+\]\]$/);
  });

  test('a value is used as is, and surrounding whitespace is trimmed', () => {
    const resolved = resolvePlaceholders({ PUBLIC_CONTACT_EMAIL: '  hello@example.com ' });
    expect(resolved.contactEmail).toMatchObject({ status: 'set', value: 'hello@example.com', display: 'hello@example.com' });
  });

  test('"n/a" hides optional items but never satisfies a required one', () => {
    const resolved = resolvePlaceholders({ PUBLIC_LEGAL_VAT_ID: 'N/A', PUBLIC_CONTACT_EMAIL: 'n/a' });
    expect(resolved.vatId).toMatchObject({ status: 'hidden', value: null, display: null });
    expect(resolved.contactEmail.status).toBe('missing');
  });

  test('the privacy email falls back to the contact email', () => {
    expect(resolvePlaceholders({ PUBLIC_CONTACT_EMAIL: 'a@example.com' }).privacyEmail).toMatchObject({
      status: 'set',
      value: 'a@example.com',
    });
    expect(resolvePlaceholders({ PUBLIC_CONTACT_EMAIL: 'a@example.com', PUBLIC_PRIVACY_EMAIL: 'p@example.com' }).privacyEmail.value).toBe(
      'p@example.com',
    );
    expect(resolvePlaceholders({}).privacyEmail.status).toBe('missing');
  });

  test('the review flag needs the value true', () => {
    expect(resolvePlaceholders({ PUBLIC_LEGAL_REVIEWED: 'true' }).reviewed.status).toBe('set');
    expect(resolvePlaceholders({ PUBLIC_LEGAL_REVIEWED: 'false' }).reviewed.status).toBe('missing');
    expect(resolvePlaceholders({}).reviewed.status).toBe('missing');
  });

  test('sentence() ends a value with a period only when needed', () => {
    expect(sentence('Example Ltd')).toBe('Example Ltd.');
    expect(sentence('Example Ltd.')).toBe('Example Ltd.');
    expect(sentence('See the DPA (2024)')).toBe('See the DPA (2024)');
  });

  test('parseCount reads env numbers safely', () => {
    expect(parseCount(undefined, 250)).toBe(250);
    expect(parseCount('', 250)).toBe(250);
    expect(parseCount('  400 ', 250)).toBe(400);
    expect(parseCount('12.9', 0)).toBe(12);
    expect(parseCount('abc', 250)).toBe(250);
    expect(parseCount('-5', 250)).toBe(250);
  });
});

test.describe('check:placeholders report', () => {
  test('lists every required variable when the environment is empty', () => {
    const report = collectPlaceholderReport({ env: {} });
    // Offer switches (discount, subscriber count, threshold) may stay empty, they are simply off.
    expect(report.missing.length).toBe(blockingCount);
    expect(report.blocking).toBeGreaterThan(0);
  });

  test('reports nothing missing once every variable is set', () => {
    const report = collectPlaceholderReport({ env: fullEnv });
    expect(report.missing).toEqual([]);
    expect(report.variables.every((v) => v.status === 'set')).toBe(true);
  });

  test('optional items set to n/a count as resolved', () => {
    const optional = placeholderSpecs.filter((spec) => 'optional' in spec && spec.optional);
    const env = { ...fullEnv, ...Object.fromEntries(optional.map((spec) => [spec.env, 'n/a'])) };
    expect(collectPlaceholderReport({ env }).missing).toEqual([]);
  });

  test('empty offer switches are off, not missing', () => {
    const resolved = resolvePlaceholders({});
    for (const id of ['discountLabel', 'subscriberCount', 'proofThreshold'] as const) {
      expect(resolved[id]).toMatchObject({ status: 'hidden', display: null });
    }
  });

  test('a quoted empty value or a stringified undefined counts as empty', () => {
    const resolved = resolvePlaceholders({ PUBLIC_CONTACT_EMAIL: '""', PUBLIC_LEGAL_VAT_ID: 'undefined', PUBLIC_LEGAL_PHONE: 'null' });
    expect(resolved.contactEmail.status).toBe('missing');
    expect(resolved.vatId.status).toBe('missing');
    expect(resolved.phone.status).toBe('missing');
  });

  test('required items are exactly the ones without n/a, fallback or switch', () => {
    const missing = collectPlaceholderReport({ env: {} }).missing.map((v) => v.env);
    for (const spec of required) expect(missing).toContain(spec.env);
  });

  test('no [[TODO]] marker is hard-coded in src (values belong in .env)', () => {
    expect(collectPlaceholderReport({ env: fullEnv }).todos).toEqual([]);
  });
});
