/**
 * Paints the page's own background (the <html> element) in the color of the section in the middle of the
 * screen. Some phone browsers (and iOS Safari without full-screen mode) leave strips left and right of the page in
 * landscape and fill them with the page background; that color is white by default. With this the strips continue
 * the section in view instead. Where the page fills the whole width, nothing changes visibly.
 * Set through the CSSOM, which the strict CSP allows. Touch screens only.
 */

const TRANSPARENT = /^(transparent|rgba\(0, 0, 0, 0\))$/;

function sectionColorAt(y: number): string | null {
  // The widest element at that height that has a background: the section itself.
  for (const element of document.elementsFromPoint(window.innerWidth / 2, y)) {
    if (element === document.documentElement || element === document.body) continue;
    const color = getComputedStyle(element).backgroundColor;
    if (!TRANSPARENT.test(color) && element.getBoundingClientRect().width >= window.innerWidth - 1) return color;
  }
  return null;
}

export function initEdgeColor(): void {
  if (!window.matchMedia('(hover: none)').matches) return;
  const root = document.documentElement;
  let frame = 0;

  const update = () => {
    frame = 0;
    const color = sectionColorAt(window.innerHeight / 2);
    if (color) root.style.backgroundColor = color;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  schedule();
}
