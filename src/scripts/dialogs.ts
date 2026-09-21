/**
 * Shared modal behavior for every <dialog> on the site (cookie settings, supplement facts).
 * Native showModal() makes the rest of the page inert and handles ESC. On top of that we:
 *  - trap Tab / Shift+Tab inside the dialog (some browsers let focus escape to browser chrome),
 *  - move focus into the dialog on open,
 *  - return focus to the element that opened it on close.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const returnTargets = new WeakMap<HTMLDialogElement, HTMLElement | null>();

function focusableIn(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('hidden') && el.getClientRects().length > 0,
  );
}

export function openDialog(dialog: HTMLDialogElement, trigger?: HTMLElement | null): void {
  if (dialog.open) return;
  const active = document.activeElement;
  returnTargets.set(dialog, trigger ?? (active instanceof HTMLElement && active !== document.body ? active : null));
  dialog.showModal();

  const initial = dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]') ?? focusableIn(dialog)[0];
  initial?.focus();
}

export function closeDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) dialog.close();
}

function trapTab(event: KeyboardEvent, dialog: HTMLDialogElement): void {
  if (event.key !== 'Tab') return;
  const items = focusableIn(dialog);
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const active = document.activeElement;
  const outside = !dialog.contains(active) || active === dialog;
  if (event.shiftKey && (active === first || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
  }
}

export function initDialogs(): void {
  document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
    dialog.addEventListener('keydown', (event) => trapTab(event, dialog));

    dialog.addEventListener('close', () => {
      const target = returnTargets.get(dialog);
      returnTargets.delete(dialog);
      if (target?.isConnected) target.focus();
    });

    if (dialog.hasAttribute('data-dismiss-on-backdrop')) {
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;

    const opener = target?.closest<HTMLElement>('[data-dialog-open]');
    if (opener) {
      const dialog = document.getElementById(opener.dataset.dialogOpen ?? '');
      if (dialog instanceof HTMLDialogElement) {
        event.preventDefault();
        openDialog(dialog, opener);
      }
      return;
    }

    const closer = target?.closest<HTMLElement>('[data-dialog-close]');
    const parent = closer?.closest('dialog');
    if (parent) closeDialog(parent);
  });
}
