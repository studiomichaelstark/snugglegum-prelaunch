/**
 * Consent store and script gate.
 *
 * The visitor's choice is kept in localStorage (never a cookie) as
 * { version, timestamp, categories }. Nothing optional runs before consent:
 * gated scripts are inert <script type="text/plain" data-consent="analytics"> elements
 * that this module activates only for categories the visitor accepted.
 */
import { CONSENT_STORAGE_KEY, CONSENT_VERSION, consentCategories, type OptionalConsentCategory } from '@/config/consent';
import { closeDialog, openDialog } from './dialogs';

export type ConsentCategories = Record<OptionalConsentCategory, boolean>;

export interface StoredConsent {
  version: number;
  timestamp: string;
  categories: ConsentCategories;
}

const CATEGORY_IDS = Object.keys(consentCategories) as OptionalConsentCategory[];

function normalize(input: Partial<ConsentCategories>): ConsentCategories {
  return {
    analytics: consentCategories.analytics.enabled && input.analytics === true,
    marketing: consentCategories.marketing.enabled && input.marketing === true,
  };
}

export function readConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent> | null;
    if (!parsed || parsed.version !== CONSENT_VERSION || typeof parsed.timestamp !== 'string') return null;
    return { version: parsed.version, timestamp: parsed.timestamp, categories: normalize(parsed.categories ?? {}) };
  } catch {
    return null;
  }
}

function writeConsent(categories: ConsentCategories): void {
  const value: StoredConsent = { version: CONSENT_VERSION, timestamp: new Date().toISOString(), categories };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage is blocked (private mode). The choice only lasts for this page view.
  }
  activateGatedScripts(categories);
  document.dispatchEvent(new CustomEvent('sg:consent', { detail: value }));
}

/** Turns inert consent-gated scripts into real ones, for accepted categories only. */
function activateGatedScripts(categories: ConsentCategories): void {
  document.querySelectorAll<HTMLScriptElement>('script[type="text/plain"][data-consent]').forEach((inert) => {
    const category = inert.dataset.consent as OptionalConsentCategory | undefined;
    if (!category || !categories[category]) return;

    const live = document.createElement('script');
    for (const { name, value } of Array.from(inert.attributes)) {
      if (name !== 'type' && name !== 'data-consent') live.setAttribute(name, value);
    }
    live.text = inert.text;
    inert.replaceWith(live);
  });
}

export function initConsent(): void {
  const dialog = document.getElementById('cookie-modal');
  if (!(dialog instanceof HTMLDialogElement)) return;

  const panel = dialog.querySelector<HTMLElement>('[data-consent-panel]');
  const customizeButton = dialog.querySelector<HTMLElement>('[data-consent-customize]');
  const customizeLabel = dialog.querySelector<HTMLElement>('[data-label-customize]');
  const saveLabel = dialog.querySelector<HTMLElement>('[data-label-save]');
  const toggles = new Map<OptionalConsentCategory, HTMLInputElement>();
  CATEGORY_IDS.forEach((id) => {
    const input = dialog.querySelector<HTMLInputElement>(`input[data-consent-category="${id}"]`);
    if (input) toggles.set(id, input);
  });

  const setPanelOpen = (open: boolean) => {
    if (panel) panel.hidden = !open;
    customizeButton?.setAttribute('aria-expanded', String(open));
    if (customizeLabel) customizeLabel.hidden = open;
    if (saveLabel) saveLabel.hidden = !open;
  };

  const syncToggles = (categories: ConsentCategories) => {
    toggles.forEach((input, id) => {
      input.checked = categories[id];
    });
  };

  const current = readConsent();
  if (current) {
    activateGatedScripts(current.categories);
    syncToggles(current.categories);
  }

  const save = (categories: ConsentCategories) => {
    writeConsent(categories);
    syncToggles(categories);
    closeDialog(dialog);
  };

  dialog.querySelector('[data-consent-accept]')?.addEventListener('click', () => {
    save(normalize({ analytics: true, marketing: true }));
  });

  dialog.querySelector('[data-consent-reject]')?.addEventListener('click', () => {
    save(normalize({ analytics: false, marketing: false }));
  });

  customizeButton?.addEventListener('click', () => {
    if (panel?.hidden) {
      setPanelOpen(true);
      return;
    }
    const chosen: Partial<ConsentCategories> = {};
    toggles.forEach((input, id) => {
      chosen[id] = input.checked;
    });
    save(normalize(chosen));
  });

  document.querySelectorAll<HTMLElement>('[data-open-cookie-settings]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      syncToggles(readConsent()?.categories ?? normalize({}));
      setPanelOpen(true);
      openDialog(dialog, trigger);
    });
  });

  // First visit: ask before anything else. The panel stays collapsed until "Customize".
  if (!current) {
    setPanelOpen(false);
    openDialog(dialog);
  }
}
