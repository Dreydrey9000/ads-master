import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [390, 1440]) test(`private sign-in is accessible at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/drey');
  const button = page.getByRole('button', { name: 'Sign in to connect reports', exact: true });
  const setup = page.getByRole('heading', { name: 'Automatic reports need setup.' });
  await expect(button.or(setup)).toBeVisible();
  // CI builds without provider credentials exercise the fail-closed setup state.
  if (await setup.isVisible()) {
    await expect(button).toHaveCount(0);
    return;
  }
  await expect(button).toBeVisible();
  await button.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Sign in to Ads Master' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(scan.violations).toEqual([]);
  await page.route('**/api/auth', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) }));
  await dialog.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Google sign-in could not start. Try again, or check the account setup.');
  await expect(dialog.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();
});
