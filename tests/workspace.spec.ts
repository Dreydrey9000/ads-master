import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const csv = 'platform,spend,revenue,impressions,clicks,conversions\nmeta,100,400,10000,200,10\nopenai,50,300,2000,100,5';

test('desktop navigation, ad search and no browser errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Your ads, in focus.' })).toBeVisible();
  await page.getByLabel('Select business').selectOption('viral-editz');
  await expect(page.getByText('You’re exploring sample data.')).toBeVisible();
  await expect(page.locator('.recharts-area-curve')).toBeVisible();
  await expect(page.locator('.recharts-pie-sector').first()).toBeVisible();
  await page.getByRole('textbox', { name: 'Search ads' }).fill('no-matching-ad');
  await expect(page.getByText('No ads match', { exact: false })).toBeVisible();
  for (const tab of ['AI Insights','Winning Ads','Spend Trends','Connections','Overview']) { await page.getByRole('button', { name: tab, exact: true }).click(); await expect(page).toHaveTitle(`${tab} | Ads Master`); const tabScan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze(); expect(tabScan.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]); }
  expect(errors).toEqual([]);
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(scan.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
});
test('import real results, persist, export and isolate businesses', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Import report', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Import report', exact: true })).toBeDisabled();
  await dialog.getByLabel('Reporting period').fill('September 2026');
  await dialog.getByLabel('Choose your CSV').setInputFiles({ name: 'my-results.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(dialog.getByText('2 platforms ready')).toBeVisible();
  await dialog.getByRole('button', { name: 'Import report', exact: true }).click();
  await expect(page.locator('.kpi-0')).toContainText('$150'); await expect(page.locator('.kpi-1')).toContainText('$700');
  await expect(page.getByText('Individual ad results are not included.', { exact: false })).toBeVisible();
  await page.reload(); await expect(page.locator('.source-pill')).toHaveText('Imported report');
  await expect(page.locator('.kpi-0')).toContainText('$150');
  const downloaded = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe('1bb-report.csv');
  await expect(page.getByRole('button', { name: 'AI Insights', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Explore sample', exact: true })).toHaveCount(0);
  await page.getByLabel('Select business').selectOption('viral-editz'); await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.locator('.source-pill')).toHaveText('Sample workspace');
  await page.getByLabel('Select business').selectOption('1bb'); await expect(page.locator('.kpi-0')).toContainText('$150');
});
test('malformed input stays recoverable and dialog supports Escape', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Import report', exact: true }).click();
  const dialog = page.getByRole('dialog'); await dialog.getByLabel('Reporting period').fill('Keep my period');
  await dialog.getByLabel('Choose your CSV').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('broken') });
  await expect(dialog.getByRole('alert')).toContainText('column names');
  await expect(dialog.getByLabel('Reporting period')).toHaveValue('Keep my period');
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Import report', exact: true })).toBeFocused();
});
test('add business is validated, saved and starts empty', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Add business', exact: true }).click();
  const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('button', { name: 'Add business', exact: true })).toBeDisabled();
  await dialog.getByLabel('Business name').fill('QA Studio'); await dialog.getByLabel('Include a sales pipeline').check();
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze(); expect(scan.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
  await dialog.getByRole('button', { name: 'Add business', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your next campaign starts here.' })).toBeVisible();
  await page.reload(); await expect(page.getByLabel('Select business')).toContainText('QA Studio'); await expect(page.getByRole('heading', { name: 'Your next campaign starts here.' })).toBeVisible();
});
test('storage write failure preserves form and reports no success', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.getByRole('button', { name: 'Add business', exact: true }).click(); const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Business name').fill('Keep my business'); await dialog.getByRole('button', { name: 'Add business', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Could not save'); await expect(dialog.getByLabel('Business name')).toHaveValue('Keep my business');
});
for (const width of [320, 390, 720]) test(`responsive ${width}px and reduced motion`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 }); await page.goto('/'); await expect(page.locator('.overview-stack')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator('.panel-enter').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze(); expect(scan.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
  await page.getByRole('button', { name: 'Import report', exact: true }).click();
  expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});


test('personal link opens empty, remembers imports and isolates businesses', async ({ page }) => {
  await page.goto('/drey');
  await expect(page.getByLabel('Select business')).toHaveValue('drey-personal');
  await expect(page.locator('.source-pill')).toHaveText('Your workspace');
  await page.getByRole('button', { name: 'Import report', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Reporting period').fill('October 2026');
  await dialog.getByLabel('Choose your CSV').setInputFiles({ name: 'personal.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await dialog.getByRole('button', { name: 'Import report', exact: true }).click();
  await page.reload();
  await expect(page.locator('.kpi-0')).toContainText('$150');
  await page.getByLabel('Select business').selectOption('1bb');
  await expect(page.locator('.source-pill')).toHaveText('Your workspace');
  await page.goto('/drey');
  await expect(page.locator('.source-pill')).toHaveText('Imported report');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(scan.violations).toEqual([]);
});

test('unconfigured AI endpoint cannot make paid requests', async ({ request }) => {
  const response = await request.post('/api/insights', { data: { businessId: '1bb' } });
  expect(response.status()).toBe(410);
  expect(await response.json()).toEqual({ error: 'AI insights are not available yet. Import a CSV report to review your measured results.' });
});


test('personal report navigation handles sample mode and business switching', async ({ page }) => {
  await page.goto('/drey');
  await page.getByRole('button', { name: 'Account reports', exact: true }).click();
  await expect(page).toHaveTitle('Account reports | Ads Master');
  await page.getByRole('button', { name: 'Explore sample', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Switch to your private reports' })).toBeVisible();
  await page.getByRole('button', { name: 'Use my data', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Switch to your private reports' })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Select business' }).selectOption({ index: 0 });
  await expect(page).toHaveTitle('Overview | Ads Master');
  await expect(page.getByRole('button', { name: 'Account reports', exact: true })).toHaveCount(0);
  await page.goto('/updates');
  await expect(page.getByRole('heading', { name: 'DreyOS reporting, within reach' })).toBeVisible();
  await expect(page.locator('img').first()).toBeVisible();
});

test('1BB never inherits sample research or false connection labels', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Select business').selectOption('viral-editz');
  await page.getByRole('button', { name: 'Winning Ads', exact: true }).click();
  await expect(page.locator('.source-pill')).toHaveText('Sample workspace');
  await page.getByLabel('Select business').selectOption('1bb');
  await expect(page).toHaveTitle('Overview | Ads Master');
  await expect(page.locator('.source-pill')).toHaveText('Your workspace');
  await expect(page.getByRole('button', { name: 'Explore sample', exact: true })).toHaveCount(0);
  for (const name of ['AI Insights', 'Winning Ads', 'Spend Trends']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await expect(page.locator('.kpi-0')).toHaveCount(0);
  await page.getByRole('button', { name: 'Connections', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1BB · Automatic reports' })).toBeVisible();
  await expect(page.getByText('Not connected', { exact: true })).toHaveCount(0);
  await expect(page.getByText('CSV import available', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Explore sample', exact: true })).toHaveCount(0);
});
