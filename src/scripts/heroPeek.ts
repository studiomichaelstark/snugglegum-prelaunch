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

/** Whether the pixel of `image` under the viewport point (x, y) is visible. */
function isOpaqueAt(image: HTMLImageElement, x: number, y: number, probe: CanvasRenderingContext2D): boolean {
  const rect = image.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return false;
  if (!image.complete || !image.naturalWidth) return true; // not decoded yet: trust the box
  const sx = Math.min(image.naturalWidth - 1, Math.floor(((x - rect.left) / rect.width) * image.naturalWidth));
  const sy = Math.min(image.naturalHeight - 1, Math.floor(((y - rect.top) / rect.height) * image.naturalHeight));
  try {
    probe.clearRect(0, 0, 1, 1);
    probe.drawImage(image, sx, sy, 1, 1, 0, 0, 1, 1);
    return (probe.getImageData(0, 0, 1, 1).data[3] ?? 0) >= OPAQUE;
  } catch {
    return true; // pixels not readable: fall back to the box
  }
}

export function initHeroPeek(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const hero = document.querySelector<HTMLElement>('#hero');
  const gummy = hero?.querySelector<HTMLElement>('[data-hero-gummy]');
  const image = gummy?.querySelector<HTMLImageElement>('img');
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext('2d', { willReadFrequently: true });
  if (!hero || !gummy || !image || !context) return;

  const show = () => {
    gummy.style.visibility = '';
  };

  hero.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if (!isOpaqueAt(image, event.clientX, event.clientY, context)) return;
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
