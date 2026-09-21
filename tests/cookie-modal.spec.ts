import { expect, test, CONSENT_KEY } from './fixtures';

test.describe('cookie settings modal', () => {
  test('opens from the footer and exposes dialog semantics', async ({ consented: page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Cookie settings' }).last();
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Cookies, briefly' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Opened from the footer, the details panel is already expanded.
    await expect(dialog.getByLabel(/Necessary/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Save choices' })).toBeVisible();
  });

  test('traps focus in both directions', async ({ consented: page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Cookie settings' }).last().click();
    const dialog = page.getByRole('dialog', { name: 'Cookies, briefly' });
    await expect(dialog).toBeVisible();

    const insideDialog = () => page.evaluate(() => !!document.activeElement?.closest('dialog#cookie-modal'));

    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      expect(await insideDialog(), `after ${i + 1} Tab presses`).toBe(true);
    }
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Shift+Tab');
      expect(await insideDialog(), `after ${i + 1} Shift+Tab presses`).toBe(true);
    }
  });

  test('ESC closes it and focus returns to the trigger', async ({ consented: page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Cookie settings' }).last();
    await trigger.focus();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Cookies, briefly' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('is operable by keyboard: Reject all with Enter, and the choice persists across reloads', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Cookies, briefly' });
    await expect(dialog).toBeVisible();

    const reject = dialog.getByRole('button', { name: 'Reject all' });
    await reject.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Cookies, briefly' })).toBeHidden();
    const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? 'null'), CONSENT_KEY);
    expect(stored.version).toBe(1);
  });

  test('"Customize" expands the panel and "Save choices" stores and closes', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Cookies, briefly' });
    await dialog.getByRole('button', { name: 'Customize' }).click();
    await expect(dialog.getByText("We don't currently use any optional cookies or trackers.")).toBeVisible();
    await dialog.getByRole('button', { name: 'Save choices' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).not.toBeNull();
  });

  test('Supplement Facts dialog: opens, ESC closes, focus returns', async ({ consented: page }) => {
    await page.goto('/');
    const trigger = page.locator('button[data-dialog-open]').first();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Supplement Facts' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
