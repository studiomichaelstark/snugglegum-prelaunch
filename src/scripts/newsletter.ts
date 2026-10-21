/**
 * Newsletter form behavior. Runs only in the browser and only sends a request when the
 * visitor submits. Visible strings are read from <template> elements in NewsletterForm.astro.
 */

import { createChallenge } from '@/scripts/turnstile';

type ErrorKind = 'invalid-email' | 'lines' | 'flavor' | 'consent' | 'server' | 'already' | 'network' | 'rate-limit' | 'challenge';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REQUEST_TIMEOUT_MS = 15_000;
const ALREADY_SUBSCRIBED_PATTERN = /already|exist|subscribed/i;
/** Our own sign-up function (functions/api/signup.ts). It forwards to MailerLite and returns the founding number. */
const SIGNUP_PATH = '/api/signup';
/** Where a successful sign-up lands. src/pages/thank-you-newsletter.astro reads the number we leave in sessionStorage. */
const THANK_YOU_PATH = '/thank-you-newsletter';
export const FOUNDING_NUMBER_KEY = 'sg-founding-number';

interface MailerLiteResponse {
  /** /api/signup says so when the Turnstile check failed. */
  challenge?: boolean;
  /** "ok" comes from /api/signup, "success" from MailerLite's hosted form (the direct fallback). */
  ok?: boolean;
  success?: boolean;
  /** Only present when the answer comes from /api/signup. */
  number?: number;
  errors?: { fields?: Record<string, string[] | undefined> };
}

interface SubscribeResult {
  outcome: 'success' | ErrorKind;
  /** The founding number from /api/signup, or null (direct MailerLite fallback, no counter, no number). */
  number: number | null;
}

function messageFor(root: HTMLElement, kind: ErrorKind): string {
  const template = root.querySelector<HTMLTemplateElement>(`template[data-message="${kind}"]`);
  return template?.content.textContent?.trim() ?? '';
}

function showError(root: HTMLElement, form: HTMLFormElement, kind: ErrorKind, focusTarget?: HTMLElement): void {
  const error = form.querySelector<HTMLElement>('[data-form-error]');
  if (!error) return;
  error.textContent = messageFor(root, kind);
  error.hidden = false;
  form.querySelectorAll<HTMLInputElement>('input[name="fields[email]"], input[name="consent"], input[data-interest], input[data-flavor], input[data-flavor-other]').forEach((input) => {
    input.removeAttribute('aria-invalid');
  });
  focusTarget?.setAttribute('aria-invalid', 'true');
  focusTarget?.focus();
}

function clearError(form: HTMLFormElement): void {
  const error = form.querySelector<HTMLElement>('[data-form-error]');
  if (error) {
    error.hidden = true;
    error.textContent = '';
  }
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
}

function setBusy(form: HTMLFormElement, busy: boolean): void {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const idle = form.querySelector<HTMLElement>('[data-label-idle]');
  const busyLabel = form.querySelector<HTMLElement>('[data-label-busy]');
  if (button) button.disabled = busy;
  if (idle) idle.hidden = busy;
  if (busyLabel) busyLabel.hidden = !busy;
  form.setAttribute('aria-busy', busy ? 'true' : 'false');
}

interface ProductInterest {
  /** Product id, e.g. "gen-z". Sent as-is in fields[product_interest]. */
  id: string;
  /** MailerLite Group ID for this product, or '' while that Group has not been created yet. */
  groupId: string;
}

/** Reads the checked product-interest checkboxes inside a form. One subscriber, any number of interests. */
function readInterests(form: HTMLFormElement): ProductInterest[] {
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[data-interest]'))
    .filter((input) => input.checked)
    .map((input) => ({ id: input.dataset.interest ?? '', groupId: input.dataset.group ?? '' }));
}

const FLAVOR_OTHER_MAX_LENGTH = 40;

interface FlavorChoice {
  /** Ids of the ticked flavor checkboxes, e.g. ["pineapple", "energy"]. */
  picked: string[];
  /** The visitor's own flavor suggestion, trimmed and length-capped. Empty when none. */
  other: string;
}

/** Reads the flavor checkboxes and the free-text suggestion inside a form. */
function readFlavors(form: HTMLFormElement): FlavorChoice {
  const picked = Array.from(form.querySelectorAll<HTMLInputElement>('input[data-flavor]'))
    .filter((input) => input.checked)
    .map((input) => input.dataset.flavor ?? '')
    .filter(Boolean);
  const other = (form.querySelector<HTMLInputElement>('input[data-flavor-other]')?.value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, FLAVOR_OTHER_MAX_LENGTH);
  return { picked, other };
}

/** Campaign parameters recorded with a sign-up, so MailerLite can attribute it to a campaign. */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const UTM_MAX_LENGTH = 120;

/** Reads the UTM parameters of the current page URL. Nothing is stored; they only travel with the sign-up. */
export function readUtm(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const found: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim().slice(0, UTM_MAX_LENGTH);
    if (value) found[key] = value;
  }
  return found;
}

async function subscribe(endpoint: string, email: string, interests: ProductInterest[], flavors: FlavorChoice, challengeToken: string | null): Promise<SubscribeResult> {
  const failed = (outcome: ErrorKind): SubscribeResult => ({ outcome, number: null });

  const body = new FormData();
  body.set('fields[email]', email);
  // The visitor ticked "I am 18 or older and agree …" (checked before this runs). /api/signup requires it.
  body.set('consent', 'on');
  body.set('consent_age_18', 'yes');
  // How long the page has been open. /api/signup turns away submissions that arrive before a person could have filled in the form.
  body.set('form_age', String(Math.round(performance.now())));
  if (challengeToken) body.set('cf-turnstile-response', challengeToken);
  body.set('ml-submit', '1');
  body.set('anticsrf', 'true');
  body.set('fields[signup_page]', window.location.pathname);
  for (const [key, value] of Object.entries(readUtm(window.location.search))) {
    body.set(`fields[${key}]`, value);
  }

  if (interests.length) {
    // A plain field always records the interest(s), even before a matching Group exists.
    body.set(
      'fields[product_interest]',
      interests.map((interest) => interest.id).join(','),
    );
    // Tag the subscriber to each product's native Group, for every interest that has one configured.
    for (const interest of interests) {
      if (interest.groupId) body.append('groups[]', interest.groupId);
    }
  }

  // Plain fields, so no MailerLite Group is needed to read the vote.
  if (flavors.picked.length) body.set('fields[flavor_vote]', flavors.picked.join(','));
  if (flavors.other) body.set('fields[flavor_other]', flavors.other);

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Preferred: our own function, which also hands out the founding number. Where it is not deployed
    // (static preview, other hosts) the request 404s, and the form posts straight to MailerLite instead.
    let response = await fetch(SIGNUP_PATH, { method: 'POST', body, signal: controller.signal });
    if ((response.status === 404 || response.status === 405) && endpoint) {
      response = await fetch(endpoint, { method: 'POST', body, signal: controller.signal });
    }
    if (response.status === 429) return failed('rate-limit');

    const data = (await response.json().catch(() => null)) as MailerLiteResponse | null;
    if (data?.ok === true || data?.success === true) {
      const number = Number.isInteger(data.number) && (data.number ?? 0) > 0 ? (data.number as number) : null;
      return { outcome: 'success', number };
    }

    if (data?.challenge === true) return failed('challenge');

    const emailErrors = data?.errors?.fields?.email;
    if (emailErrors?.length) {
      return failed(emailErrors.some((message) => ALREADY_SUBSCRIBED_PATTERN.test(message)) ? 'already' : 'invalid-email');
    }
    return failed('server');
  } catch {
    return failed('network');
  } finally {
    window.clearTimeout(timer);
  }
}

/** Leaves the founding number for the thank-you page (if there is one) and goes there. */
function goToThankYou(number: number | null): void {
  try {
    if (number === null) window.sessionStorage.removeItem(FOUNDING_NUMBER_KEY);
    else window.sessionStorage.setItem(FOUNDING_NUMBER_KEY, String(number));
  } catch {
    // Storage blocked: the thank-you page simply shows no number.
  }
  window.location.assign(THANK_YOU_PATH);
}

async function share(button: HTMLElement): Promise<void> {
  const url = `${window.location.origin}/`;
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ url });
    } catch {
      // The visitor closed the share sheet. Nothing to do.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    const original = button.textContent;
    button.textContent = button.dataset.copiedLabel ?? original;
    window.setTimeout(() => {
      button.textContent = original;
    }, 2500);
  } catch {
    // Clipboard blocked. The visitor can still copy the address bar.
  }
}

function bind(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-newsletter-form]');
  if (!form) return;

  // Native validation is the no-JavaScript fallback. With JavaScript we show our own messages.
  form.noValidate = true;

  const emailInput = form.querySelector<HTMLInputElement>('input[name="fields[email]"]');
  const consentInput = form.querySelector<HTMLInputElement>('input[name="consent"]');
  const honeypot = form.querySelector<HTMLInputElement>('input[name="website"]');
  const endpoint = root.dataset.endpoint ?? '';
  let submitting = false;

  // Optional bot check: null when Turnstile is not set up. Cloudflare's script loads on the first touch of the form.
  const challenge = createChallenge(form.querySelector<HTMLElement>('[data-turnstile]'));
  form.addEventListener('focusin', () => challenge?.start(), { once: true });

  const interestInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[data-interest]'));

  emailInput?.addEventListener('input', () => clearError(form));
  interestInputs.forEach((input) => input.addEventListener('change', () => clearError(form)));
  form.querySelectorAll('input[data-flavor], input[data-flavor-other]').forEach((input) => {
    input.addEventListener('change', () => clearError(form));
  });
  consentInput?.addEventListener('change', () => clearError(form));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting || !emailInput || !consentInput) return;

    // Fields are validated in the order they appear: version, flavor, email, consent. Version and flavor are required:
    // a founding member picks at least one version and either a flavor or a suggestion of their own.
    const firstInterest = interestInputs[0];
    if (!readInterests(form).length) {
      showError(root, form, 'lines', firstInterest);
      return;
    }
    const flavorChoice = readFlavors(form);
    if (!flavorChoice.picked.length && !flavorChoice.other) {
      showError(root, form, 'flavor', form.querySelector<HTMLInputElement>('input[data-flavor]') ?? undefined);
      return;
    }
    const email = emailInput.value.trim();
    if (!EMAIL_PATTERN.test(email)) {
      showError(root, form, 'invalid-email', emailInput);
      return;
    }
    if (!consentInput.checked) {
      showError(root, form, 'consent', consentInput);
      return;
    }

    clearError(form);

    // Bots fill the hidden field. Pretend it worked and send nothing.
    if (honeypot?.value) {
      goToThankYou(null);
      return;
    }

    submitting = true;
    setBusy(form, true);
    const { outcome: result, number } = await subscribe(endpoint, email, readInterests(form), flavorChoice, (await challenge?.token()) ?? null);

    if (result === 'success') {
      // Stay busy (button disabled, no second submit) while the browser moves on to the thank-you page.
      goToThankYou(number);
      return;
    }
    submitting = false;
    setBusy(form, false);
    // A token works once: ask for a fresh one for the next try.
    challenge?.reset();
    showError(root, form, result, result === 'invalid-email' ? emailInput : undefined);
  });
}

/** "Tell a friend" buttons ([data-share]), delegated so it works for buttons added later. Used by the thank-you page. */
export function initShare(): void {
  document.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-share]');
    if (button) void share(button);
  });
}

export function initNewsletter(): void {
  document.querySelectorAll<HTMLElement>('[data-newsletter][data-live="true"]').forEach(bind);
  initShare();
}
