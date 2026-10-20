/**
 * Hero backdrop motion (HeroParallax.astro): the layers shift by up to the manifest's max offset times
 * their speed (far 0.3, mid 0.55, near 1). The burst gummy illustration stays still on purpose.
 *
 * Fine pointer (mouse): the layers follow the pointer, eased with requestAnimationFrame.
 * Touch: the backdrop layers get a subtle vertical scroll parallax via GSAP ScrollTrigger (loaded
 * only there). Motion pauses while the hero is out of view, and nothing moves under reduced motion.
 * Transforms are set through the CSSOM (element.style), which the strict CSP allows.
 */

const EASE = 0.08; // share of the remaining distance covered per frame
const REST_EPSILON = 0.001;

interface Scene {
  hero: HTMLElement;
  scene: HTMLElement | null;
  layers: HTMLElement[];
  maxOffsetRatio: number;
}

const speedOf = (layer: HTMLElement) => Number(layer.dataset.speed ?? 0);

/** Largest allowed layer shift in px: the manifest's max offset, scaled to the rendered scene. */
const maxOffsetPx = ({ scene, maxOffsetRatio }: Scene) => (scene ? scene.offsetWidth * maxOffsetRatio : 0);

function followPointer(parts: Scene): void {
  const { hero, layers } = parts;
  const goal = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let frame = 0;
  let visible = true;
  let maxOffset = maxOffsetPx(parts);

  const render = () => {
    current.x += (goal.x - current.x) * EASE;
    current.y += (goal.y - current.y) * EASE;

    // Layers drift against the pointer, near ones the most: depth.
    for (const layer of layers) {
      const shift = maxOffset * speedOf(layer);
      layer.style.transform = `translate3d(${(-current.x * shift).toFixed(2)}px, ${(-current.y * shift).toFixed(2)}px, 0)`;
    }

    const settled = Math.abs(goal.x - current.x) < REST_EPSILON && Math.abs(goal.y - current.y) < REST_EPSILON;
    frame = settled || !visible ? 0 : requestAnimationFrame(render);
  };

  const schedule = () => {
    if (!frame && visible) frame = requestAnimationFrame(render);
  };

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    // -1 … 1 from the hero's center.
    goal.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
    goal.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
    schedule();
  });

  hero.addEventListener('pointerleave', () => {
    goal.x = 0;
    goal.y = 0;
    schedule();
  });

  new ResizeObserver(() => {
    maxOffset = maxOffsetPx(parts);
  }).observe(hero);

  // Pause while the hero is off screen.
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      schedule();
    }
  }).observe(hero);
}

async function scrollParallax(parts: Scene): Promise<void> {
  const { hero, layers } = parts;
  if (!layers.length) return;
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);

  for (const layer of layers) {
    // Scrubbed between "hero top at viewport top" and "hero bottom at viewport top": ScrollTrigger
    // only updates inside that range, so the backdrop is idle while the hero is out of view.
    gsap.to(layer, {
      y: () => -maxOffsetPx(parts) * speedOf(layer),
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
  }
}

export function initHeroParallax(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const hero = document.querySelector<HTMLElement>('#hero');
  if (!hero) return;
  const scene = hero.querySelector<HTMLElement>('[data-parallax-scene]');
  const parts: Scene = {
    hero,
    scene,
    layers: Array.from(hero.querySelectorAll<HTMLElement>('[data-parallax-layer]')),
    maxOffsetRatio: Number(scene?.dataset.maxOffsetRatio ?? 0),
  };

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    followPointer(parts);
  } else {
    void scrollParallax(parts);
  }
}
