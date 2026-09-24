/**
 * Newsletter form behavior. Runs only in the browser and only sends a request when the
 * visitor submits. Visible strings are read from <template> elements in NewsletterForm.astro.
 */

type ErrorKind = 'invalid-email' | 'interest' | 'consent' | 'server' | 'already' | 'network' | 'rate-limit';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REQUEST_TIMEOUT_MS = 15_000;
const ALREADY_SUBSCRIBED_PATTERN = /already|exist|subscribed/i;

interface MailerLiteResponse {
  success?: boolean;
  errors?: { fields?: Record<string, string[] | undefined> };
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
  form.querySelectorAll<HTMLInputElement>('input[name="fields[email]"], input[name="consent"]').forEach((input) => {
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
  /** Product id, e.g. "close-contact". Sent as-is in fields[product_interest]. */
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

async function subscribe(endpoint: string, email: string, interests: ProductInterest[]): Promise<'success' | ErrorKind> {
  if (!endpoint) return 'server';

  const body = new FormData();
  body.set('fields[email]', email);
  body.set('ml-submit', '1');
  body.set('anticsrf', 'true');

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

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, { method: 'POST', body, signal: controller.signal });
    if (response.status === 429) return 'rate-limit';

    const data = (await response.json().catch(() => null)) as MailerLiteResponse | null;
    if (data?.success === true) return 'success';

    const emailErrors = data?.errors?.fields?.email;
    if (emailErrors?.length) {
      return emailErrors.some((message) => ALREADY_SUBSCRIBED_PATTERN.test(message)) ? 'already' : 'invalid-email';
    }
    return 'server';
  } catch {
    return 'network';
  } finally {
    window.clearTimeout(timer);
  }
}

function showSuccess(source: HTMLElement): void {
  document.querySelectorAll<HTMLElement>('[data-newsletter][data-live="true"]').forEach((root) => {
    const form = root.querySelector<HTMLFormElement>('[data-newsletter-form]');
    const slot = root.querySelector<HTMLElement>('[data-success-slot]');
    const template = root.querySelector<HTMLTemplateElement>('template[data-success-template]');
    if (!form || !slot || !template) return;

    form.hidden = true;
    slot.replaceChildren(template.content.cloneNode(true));

    if (root === source) {
      slot.querySelector<HTMLElement>('[data-success-card]')?.focus();
    }
  });
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

  const interestInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[data-interest]'));

  emailInput?.addEventListener('input', () => clearError(form));
  interestInputs.forEach((input) => input.addEventListener('change', () => clearError(form)));
  consentInput?.addEventListener('change', () => clearError(form));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting || !emailInput || !consentInput) return;

    // Fields are validated in the order they appear: interests, email, consent.
    if (!interestInputs.some((input) => input.checked)) {
      showError(root, form, 'interest', interestInputs[0]);
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
      showSuccess(root);
      return;
    }

    submitting = true;
    setBusy(form, true);
    const result = await subscribe(endpoint, email, readInterests(form));
    submitting = false;
    setBusy(form, false);

    if (result === 'success') {
      showSuccess(root);
      return;
    }
    showError(root, form, result, result === 'invalid-email' ? emailInput : undefined);
  });
}

export function initNewsletter(): void {
  document.querySelectorAll<HTMLElement>('[data-newsletter][data-live="true"]').forEach(bind);

  // Delegated so it also works for the share button that appears after a successful sign-up.
  document.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('[data-share]');
    if (button) void share(button);
  });
}
