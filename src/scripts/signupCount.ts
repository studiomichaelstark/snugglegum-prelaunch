/**
 * "N sign-ups so far", filled from /api/count into every [data-signup-count] element (they start hidden).
 *
 * The total comes from /api/count. KV reads can lag behind a write for a moment, so when the sign-up answer
 * already carried the new total (the thank-you page passes it), the larger of the two wins. The line shows
 * only from data-min-count on (default 1): the thank-you page shows any count, the home page waits for
 * PUBLIC_PROOF_THRESHOLD so an early "1 sign-up" does not look thin. Any failure leaves the line hidden.
 *
 * The same answer also fills a ticket marked data-next-number with the number the next visitor would get
 * (count + 1, or "Waitlist" once all 500 spots are taken). That is a preview: someone else may sign up first
 * (or a KV read may lag a moment), so the real number is always the one on the thank-you page.
 */

const COUNT_PATH = '/api/count';
/** Founding spots. A number above this is a waitlist place, not a founding number. */
const FOUNDING_SPOTS = 500;

export async function showSignupCount(minimum: number | null = null): Promise<void> {
  const lines = document.querySelectorAll<HTMLElement>('[data-signup-count]');
  const tickets = document.querySelectorAll<HTMLElement>('[data-ticket-number][data-next-number]');
  if (!lines.length && !tickets.length) return;
  try {
    const response = await fetch(COUNT_PATH, { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const data = (await response.json()) as { count?: unknown };
    if (typeof data.count !== 'number' || !Number.isFinite(data.count) || data.count < 0) return;
    const count = Math.max(data.count, minimum ?? 0);

    // The ticket preview also works for 0 sign-ups so far: the next number is 001.
    const next = count + 1;
    tickets.forEach((ticket) => {
      const format = next > FOUNDING_SPOTS ? ticket.dataset.formatWaitlist : ticket.dataset.format;
      if (format) ticket.textContent = format.replace('{n}', String(next).padStart(3, '0'));
    });

    if (count === 0) return;
    lines.forEach((element) => {
      const threshold = Number.parseInt(element.dataset.minCount ?? '1', 10) || 1;
      if (count < threshold) return;
      // "1 sign-up so far" for exactly one, "N sign-ups so far" otherwise.
      const format = count === 1 ? (element.dataset.formatOne ?? element.dataset.format) : element.dataset.format;
      element.textContent = (format ?? '{n}').replace('{n}', count.toLocaleString('en-US'));
      element.hidden = false;
    });
  } catch {
    // The counter is a bonus. No count, no line.
  }
}
