import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const manifest = JSON.parse(readFileSync('design/hero-parallax/manifest.json', 'utf8')) as {
  background: string;
  background_fallback: string;
  layers: { file: string; left_pct: number; top_pct: number; width_pct: number }[];
};
const layersSource = readFileSync('src/lib/heroParallaxLayers.ts', 'utf8');

test.describe('hero parallax data', () => {
  test('every layer position class matches the manifest', () => {
    for (const layer of manifest.layers) {
      const expected = `'${layer.file}': 'left-[${layer.left_pct}%] top-[${layer.top_pct}%] w-[${layer.width_pct}%]'`;
      // JSON.parse turns 0.0 into 0, so the class reads "[0%]".
      expect(layersSource, layer.file).toContain(expected);
    }
  });

  test('every file the manifest names is shipped as WebP, and no PNG layers are', () => {
    for (const file of [manifest.background, manifest.background_fallback, ...manifest.layers.map((l) => l.file)]) {
      expect(existsSync(join('public', 'hero-parallax', file)), file).toBe(true);
    }
    for (const layer of manifest.layers) {
      expect(existsSync(join('public', 'hero-parallax', layer.file.replace(/\.webp$/, '.png'))), layer.file).toBe(false);
    }
  });
});
