/**
 * "How it works" scroll reveal: each step pops in (fade, rise, gummy spins and bounces to rest) a
 * moment after the one before it, as soon as it scrolls into view. The hidden starting state is only
 * applied once this script has marked the section ready, so the steps are visible without JavaScript,
 * and never hidden under reduced motion.
 */

const STAGGER_MS = 160;

export function initHowItWorks(): void {
  const section = document.querySelector<HTMLElement>('[data-how]');
  if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const steps = Array.from(section.querySelectorAll<HTMLElement>('[data-how-step]'));
  if (!steps.length) return;

  section.dataset.ready = '';

  const observer = new IntersectionObserver(
    (entries) => {
      // Entries that arrive together (a row of cards) reveal left to right.
      const entering = entries.filter((entry) => entry.isIntersecting).sort((a, b) => steps.indexOf(a.target as HTMLElement) - steps.indexOf(b.target as HTMLElement));
      entering.forEach((entry, order) => {
        const step = entry.target as HTMLElement;
        observer.unobserve(step);
        window.setTimeout(() => (step.dataset.in = ''), order * STAGGER_MS);
      });
    },
    { threshold: 0.2 },
  );
  steps.forEach((step) => observer.observe(step));
}
