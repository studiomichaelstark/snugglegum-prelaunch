/**
 * The pokeable gummy on the playful message pages (thank-you, 404, confirmed, unsubscribed):
 * a click (or Enter/Space) squishes it and fires confetti; a page can ask for a welcome pop on arrival
 * with data-arrival-pop. Reduced motion: no confetti (confettiAt checks) and the squish is switched off globally.
 */
import { confettiAt } from '@/scripts/pouchConfetti';

const ARRIVAL_DELAY_MS = 350;

export function initGummy(): void {
  const gummy = document.querySelector<HTMLElement>('[data-pop-gummy]');
  if (!gummy) return;

  gummy.addEventListener('click', (event) => {
    // Keyboard "clicks" have no pointer position: burst from the middle of the gummy.
    const rect = gummy.getBoundingClientRect();
    const fromKeyboard = event.detail === 0;
    confettiAt(fromKeyboard ? rect.left + rect.width / 2 : event.clientX, fromKeyboard ? rect.top + rect.height / 2 : event.clientY);
    gummy.classList.remove('is-popped');
    // Restart the squish animation.
    void gummy.offsetWidth;
    gummy.classList.add('is-popped');
  });

  if (gummy.hasAttribute('data-arrival-pop')) {
    window.setTimeout(() => {
      const rect = gummy.getBoundingClientRect();
      confettiAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }, ARRIVAL_DELAY_MS);
  }
}
