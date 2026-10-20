/**
 * Smooth scrolling for the whole page (Lenis): mouse wheel and trackpad glide and ease out instead of
 * stepping, and anchor links ("Become a founding member" → #newsletter-home) glide too.
 *
 * Only where it helps and cannot hurt:
 *  - not under reduced motion (the visitor asked for less movement: native scrolling stays),
 *  - not on touch devices (their own momentum scrolling is already smooth, and the scroll-driven
 *    effects use native scrolling there),
 *  - dialogs are left alone ([data-lenis-prevent] on <dialog>), so their content scrolls natively.
 * Lenis is loaded on demand, so it is not part of the first paint.
 */

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export async function initSmoothScroll(): Promise<void> {
  if (window.matchMedia(REDUCED_MOTION).matches || !window.matchMedia(FINE_POINTER).matches) return;

  const { default: Lenis } = await import('lenis');

  // The anchor a click is heading for, so the glide can be corrected if the layout moved on the way
  // (a font or image finishing, say): Lenis aims at the position the target had when it was clicked.
  let heading: HTMLElement | null = null;
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.getAttribute('href')?.slice(1);
      heading = id ? document.getElementById(id) : null;
    },
    true,
  );

  const lenis = new Lenis({
    // Lenis does not run its own animation loop unless asked to.
    autoRaf: true,
    lerp: 0.1,
    wheelMultiplier: 1,
    // Same-page links glide too. #top scrolls to the very top.
    anchors: {
      onComplete: () => {
        const target = heading;
        heading = null;
        if (target && Math.abs(target.getBoundingClientRect().top) > 2) lenis.scrollTo(target, { duration: 0.5 });
      },
    },
  });

  // If the visitor switches on "reduce motion" while the page is open, hand scrolling back to the browser.
  window.matchMedia(REDUCED_MOTION).addEventListener('change', (event) => {
    if (event.matches) lenis.destroy();
  });
}
