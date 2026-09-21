import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { findColorLiterals } from '../../scripts/lib/find-color-literals.mjs';

test.describe('colors live only in src/styles/colors.css', () => {
  test('the project has no hex, rgb(), hsl() or oklch() literals elsewhere', () => {
    expect(findColorLiterals()).toEqual([]);
  });

  test('the check itself catches violations and ignores anchors, entities and colors.css', () => {
    const root = mkdtempSync(join(tmpdir(), 'sg-colors-'));
    mkdirSync(join(root, 'src', 'styles'), { recursive: true });
    mkdirSync(join(root, 'src', 'components'), { recursive: true });
    mkdirSync(join(root, 'public'), { recursive: true });

    writeFileSync(join(root, 'src', 'styles', 'colors.css'), ':root{--color-brand-pink:#f9cee1;}');
    writeFileSync(join(root, 'src', 'components', 'ok.astro'), '<a href="#offer">x</a> <i>&#x9;</i> <b class="bg-pink">y</b> #final-cta');
    writeFileSync(join(root, 'src', 'components', 'hex.astro'), '<div class="bg-[#fff]" style="color:#045442">');
    writeFileSync(join(root, 'src', 'components', 'fn.astro'), '<div class="shadow-[0_0_4px_rgba(0,0,0,.3)]">');
    writeFileSync(join(root, 'public', 'icon.svg'), '<svg><path fill="#0E0E0E"/></svg>');

    const hits = findColorLiterals(root)
      .map((h) => `${h.file.replaceAll('\\', '/')}:${h.value}`)
      .sort();
    expect(hits).toEqual(['public/icon.svg:#0E0E0E', 'src/components/fn.astro:rgba(', 'src/components/hex.astro:#045442', 'src/components/hex.astro:#fff']);
  });
});
