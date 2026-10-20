/**
 * Thank-you page (src/pages/thank-you-newsletter.astro). The pokeable gummy and its confetti come from the shared layout (funPage.ts).
 *  - fills the ticket with the founding number the sign-up left in sessionStorage ("No. 042 of 500", or the waitlist wording above 500),
 *  - shows "N sign-ups so far" from /api/count (stays hidden if that fails),
 *  - cycles the silly lines on "Another one",
 *  - wires the "tell a friend" button.
 * Visible strings live in the page markup (data-format attributes, hidden list items).
 */
import { FOUNDING_NUMBER_KEY, initShare } from '@/scripts/newsletter';
import { showSignupCount } from '@/scripts/signupCount';

/** Founding spots. A number above this is a waitlist place, not a founding number. */
const FOUNDING_SPOTS = 500;

function readNumber(): number | null {
  try {
    const stored = Number.parseInt(window.sessionStorage.getItem(FOUNDING_NUMBER_KEY) ?? '', 10);
    return Number.isInteger(stored) && stored > 0 ? stored : null;
  } catch {
    return null;
  }
}

function showFoundingNumber(number: number): void {
  const waitlist = number > FOUNDING_SPOTS;
  document.querySelectorAll<HTMLElement>('[data-ticket-number], [data-success-number]').forEach((element) => {
    const format = waitlist ? element.dataset.formatWaitlist : element.dataset.format;
    if (format) element.textContent = format.replace('{n}', String(number).padStart(3, '0'));
  });
}

function bindQuips(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-quip-next]');
  const quips = Array.from(document.querySelectorAll<HTMLElement>('[data-quip]'));
  if (!button || quips.length < 2) return;
  button.hidden = false;
  let current = 0;
  button.addEventListener('click', () => {
    quips[current]?.setAttribute('hidden', '');
    current = (current + 1) % quips.length;
    quips[current]?.removeAttribute('hidden');
  });
}

export function initThankYou(): void {
  const number = readNumber();
  if (number !== null) showFoundingNumber(number);
  void showSignupCount(number);
  bindQuips();
  initShare();
}
