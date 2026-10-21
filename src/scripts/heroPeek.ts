/**
 * Desktop only: while the mouse button is held down on the hero illustration, the illustration (with its circular
 * note) is hidden, and it comes back on release. "Hidden" means visibility, so nothing moves in the layout.
 *
 * The illustration sits above the headline with pointer-events off (so the text below stays selectable and the
 * buttons stay clickable), so the press is caught on the hero and tested against the picture: only a press on a
 * visible pixel of the gummy counts, not on the transparent corners of the image. Set through the CSSOM, which
 * the strict CSP allows.
 */

const OPAQUE = 16; // alpha (0 to 255) from which a pixel counts as part of the illustration
const MASK_WIDTH = 320; // the picture is sampled once at this width; plenty to tell the gummy from the empty corners

interface Mask {
  width: number;
  height: number;
  alpha: Uint8ClampedArray;
}

/** Decodes the picture once and keeps its alpha channel, so a press is a lookup, not a read from a possibly undecoded image. */
async function buildMask(image: HTMLImageElement): Promise<Mask | null> {
  try {
    await image.decode();
    const width = Math.min(MASK_WIDTH, image.naturalWidth);
    const height = Math.max(1, Math.round((width * image.naturalHeight) / image.naturalWidth));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);
    const alpha = new Uint8ClampedArray(width * height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3] ?? 0;
    return { width, height, alpha };
  } catch {
    return null; // not decodable or not readable: fall back to the picture's box
  }
}

/** Whether the pixel of `image` under the viewport point (x, y) is part of the illustration. */
function isOpaqueAt(image: HTMLImageElement, mask: Mask | null, x: number, y: number): boolean {
  const rect = image.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return false;
  if (!mask) return true;
  const mx = Math.min(mask.width - 1, Math.floor(((x - rect.left) / rect.width) * mask.width));
  const my = Math.min(mask.height - 1, Math.floor(((y - rect.top) / rect.height) * mask.height));
  return (mask.alpha[my * mask.width + mx] ?? 0) >= OPAQUE;
}

export function initHeroPeek(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const hero = document.querySelector<HTMLElement>('#hero');
  const gummy = hero?.querySelector<HTMLElement>('[data-hero-gummy]');
  const image = gummy?.querySelector<HTMLImageElement>('img');
  if (!hero || !gummy || !image) return;

  let mask: Mask | null = null;
  void buildMask(image).then((built) => {
    mask = built;
    gummy.dataset.peekReady = '';
  });

  const show = () => {
    gummy.style.visibility = '';
  };

  hero.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (!isOpaqueAt(image, mask, event.clientX, event.clientY)) return;
    // No text selection or image drag from this press.
    event.preventDefault();
    gummy.style.visibility = 'hidden';
  });
  hero.addEventListener('mousedown', (event) => {
    if (gummy.style.visibility === 'hidden') event.preventDefault();
  });

  // The release can happen anywhere, even outside the window.
  for (const type of ['pointerup', 'pointercancel', 'dragend', 'contextmenu'] as const) window.addEventListener(type, show);
  window.addEventListener('blur', show);
}
