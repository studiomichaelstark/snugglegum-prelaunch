import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import { placeholderSpecs } from './src/config/placeholders';

const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;

// Same page, three engines, desktop and mobile viewports. Firefox has no `isMobile`, so its
// mobile project only changes the viewport and touch support.
const mobileViewport = { width: 390, height: 844 };

type Project = NonNullable<PlaywrightTestConfig['projects']>[number];

// Set SKIP_FIREFOX=1 on a machine where Playwright's Firefox build cannot start (see README, "Tests").
const firefoxProjects: Project[] = process.env.SKIP_FIREFOX
  ? []
  : [
      { name: 'firefox-desktop', testIgnore: /unit\//, use: { ...devices['Desktop Firefox'] } },
      {
        name: 'firefox-mobile',
        testIgnore: /unit\//,
        use: { ...devices['Desktop Firefox'], viewport: mobileViewport, hasTouch: true },
      },
    ];

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    // The tests run against the real static build. Type checking runs separately (`pnpm check`).
    command: `pnpm exec astro build && pnpm exec astro preview --port ${PORT} --host localhost --ignore-lock`,
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      // Pin every placeholder and knob to "empty", so the tests do not depend on what is in your .env.
      ...Object.fromEntries(placeholderSpecs.map((spec) => [spec.env, ''])),
      PUBLIC_DISCOUNT_LABEL: '',
      PUBLIC_SUBSCRIBER_COUNT: '',
      PUBLIC_PROOF_THRESHOLD: '',
      PUBLIC_MAILERLITE_ACCOUNT_ID: process.env.PUBLIC_MAILERLITE_ACCOUNT_ID ?? '2650700',
      PUBLIC_MAILERLITE_FORM_ID: process.env.PUBLIC_MAILERLITE_FORM_ID ?? '199242337324369472',
      PUBLIC_SITE_URL: '',
    },
  },
  projects: [
    { name: 'unit', testMatch: /unit\/.*\.spec\.ts/ },
    { name: 'chromium-desktop', testIgnore: /unit\//, use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', testIgnore: /unit\//, use: { ...devices['Pixel 7'] } },
    ...firefoxProjects,
    { name: 'webkit-desktop', testIgnore: /unit\//, use: { ...devices['Desktop Safari'] } },
    { name: 'webkit-mobile', testIgnore: /unit\//, use: { ...devices['iPhone 14'] } },
  ],
});
