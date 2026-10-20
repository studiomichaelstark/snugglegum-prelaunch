/**
 * Hero parallax scene, built from design/hero-parallax/manifest.json (the source of truth for files,
 * sizes, depths and speeds). Position classes are literal Tailwind strings so the scanner sees them
 * and no inline style is needed (strict CSP); tests/unit/hero-parallax.spec.ts checks them against
 * the manifest.
 */
import manifest from '../../design/hero-parallax/manifest.json';

export interface ParallaxLayer {
  /** Public URL, e.g. "/hero-parallax/layers/gummy-01-far.webp". */
  src: string;
  width: number;
  height: number;
  depth: 'far' | 'mid' | 'near';
  speed: number;
  z: number;
  /** left / top / width as percentages of the scene. */
  positionClass: string;
}

/** left_pct / top_pct / width_pct from the manifest, written out for Tailwind. */
export const POSITION_CLASSES: Readonly<Record<string, string>> = {
  'layers/gummy-01-far.webp': 'left-[53.377%] top-[71.21%] w-[12.461%]',
  'layers/gummy-02-mid.webp': 'left-[55.823%] top-[0%] w-[23.059%]',
  'layers/gummy-03-mid.webp': 'left-[74.961%] top-[27.469%] w-[16.537%]',
  'layers/gummy-04-mid.webp': 'left-[0%] top-[52.156%] w-[8.812%]',
  'layers/gummy-05-near.webp': 'left-[0%] top-[0%] w-[19.488%]',
  'layers/gummy-06-near.webp': 'left-[82.88%] top-[0%] w-[17.12%]',
  'layers/gummy-07-near.webp': 'left-[74.495%] top-[48.053%] w-[25.505%]',
  'layers/gummy-08-near.webp': 'left-[5.318%] top-[66.551%] w-[37.034%]',
};

const PUBLIC_BASE = '/hero-parallax/';

export const sceneCanvas = manifest.canvas;

/**
 * Largest layer shift, as a share of the scene width. The manifest caps it at
 * max_offset_px_at_canvas (60 px of 2576 = 2.33 %), which stays inside the 2.83 % overscan, so the
 * cropped layer edges never come into view.
 */
export const MAX_OFFSET_RATIO = manifest.parallax.max_offset_px_at_canvas / manifest.canvas.width;

/** Overscan on every side, as a share of the covered hero size. */
export const OVERSCAN_RATIO = manifest.parallax.overscan_pct / 100;

export const backgroundSources = {
  webp: `${PUBLIC_BASE}${manifest.background}`,
  jpg: `${PUBLIC_BASE}${manifest.background_fallback}`,
};

export const parallaxLayers: readonly ParallaxLayer[] = [...manifest.layers]
  .sort((a, b) => a.z - b.z)
  .map((layer) => {
    const positionClass = POSITION_CLASSES[layer.file];
    if (!positionClass) throw new Error(`No position class for ${layer.file}`);
    return {
      src: `${PUBLIC_BASE}${layer.file}`,
      width: layer.width,
      height: layer.height,
      depth: layer.depth as ParallaxLayer['depth'],
      speed: layer.speed,
      z: layer.z,
      positionClass,
    };
  });
