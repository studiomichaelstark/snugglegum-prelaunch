import { expect, test } from '@playwright/test';
import { hasDiscount, isPreviewState, shouldShowSocialProof } from '../../src/config/variants';

test.describe('design knobs (src/config/variants.ts)', () => {
  test('discount label is hidden while empty or blank', () => {
    expect(hasDiscount('')).toBe(false);
    expect(hasDiscount('   ')).toBe(false);
    expect(hasDiscount('15%')).toBe(true);
  });

  test('social proof renders only at or above the threshold', () => {
    expect(shouldShowSocialProof(0, 250)).toBe(false);
    expect(shouldShowSocialProof(249, 250)).toBe(false);
    expect(shouldShowSocialProof(250, 250)).toBe(true);
    expect(shouldShowSocialProof(1200, 250)).toBe(true);
  });

  test('social proof never shows zero people, even with a zero threshold', () => {
    expect(shouldShowSocialProof(0, 0)).toBe(false);
    expect(shouldShowSocialProof(Number.NaN, 0)).toBe(false);
  });

  test('"live" is the only state that runs the real form', () => {
    expect(isPreviewState('live')).toBe(false);
    for (const state of ['idle', 'submitting', 'success', 'error'] as const) expect(isPreviewState(state)).toBe(true);
  });
});
