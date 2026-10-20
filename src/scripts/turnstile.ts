/**
 * Optional Cloudflare Turnstile bot check for the sign-up form (off unless PUBLIC_TURNSTILE_SITE_KEY is set).
 *
 * The widget runs in "interaction-only" mode: invisible for nearly everyone, and it only shows a small box
 * when Cloudflare is unsure. Cloudflare's script is loaded the first time someone touches the form, never
 * on page load, so a visit alone makes no request to Cloudflare. The token travels with the sign-up
 * (field cf-turnstile-response) and /api/signup checks it with TURNSTILE_SECRET_KEY.
 */

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
/** How long a submit waits for the check before it sends without a token (the server then decides). */
const TOKEN_WAIT_MS = 8000;

let scriptLoading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  scriptLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script blocked or offline'));
    document.head.append(script);
  });
  return scriptLoading;
}

export interface Challenge {
  /** Starts loading the widget (once). Safe to call on every focus. */
  start(): void;
  /** The current token, waiting a few seconds for it; null when there is none. */
  token(): Promise<string | null>;
  /** Asks for a fresh token (after a failed or used one). */
  reset(): void;
}

/** A challenge for the form's [data-turnstile] container, or null when Turnstile is not set up. */
export function createChallenge(container: HTMLElement | null): Challenge | null {
  const siteKey = container?.dataset.sitekey;
  if (!container || !siteKey) return null;

  let current: string | null = null;
  let widgetId: string | undefined;
  let started = false;
  /** The script or the widget already failed: do not make a submit wait for a token that will not come. */
  let failed = false;
  let waiting: Array<(token: string | null) => void> = [];

  const settle = (token: string | null) => {
    current = token;
    failed = token === null;
    const resolvers = waiting;
    waiting = [];
    resolvers.forEach((resolve) => resolve(token));
  };

  const start = () => {
    if (started) return;
    started = true;
    loadScript()
      .then(() => {
        widgetId = window.turnstile?.render(container, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          callback: (token: string) => settle(token),
          'expired-callback': () => {
            current = null;
          },
          'error-callback': () => settle(null),
        });
      })
      .catch(() => settle(null));
  };

  return {
    start,
    token() {
      start();
      if (current) return Promise.resolve(current);
      if (failed) return Promise.resolve(null);
      return new Promise((resolve) => {
        waiting.push(resolve);
        window.setTimeout(() => resolve(current), TOKEN_WAIT_MS);
      });
    },
    reset() {
      current = null;
      // A widget that exists can be asked again; a script that never loaded stays failed.
      if (widgetId !== undefined) {
        failed = false;
        window.turnstile?.reset(widgetId);
      }
    },
  };
}
