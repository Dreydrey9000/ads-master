import { test, expect } from '@playwright/test';
import { isReportOwner } from '../lib/report-access';
import { parseDeliveryRows, reportWindow } from '../lib/account-report';

test('private reporting fails closed and does not authorize other users', () => {
  expect(isReportOwner(null, 'owner')).toBe(false);
  expect(isReportOwner('stranger', 'owner')).toBe(false);
  expect(isReportOwner('owner', undefined)).toBe(false);
  expect(isReportOwner('owner', 'owner')).toBe(true);
});
test('full-day window uses New York midnight including DST and year boundaries', () => {
  expect(reportWindow(new Date('2026-01-01T03:00:00Z'))).toEqual({ since: '2025-12-01', until: '2025-12-30' });
  expect(reportWindow(new Date('2026-03-09T05:00:00Z'))).toEqual({ since: '2026-02-07', until: '2026-03-08' });
});
test('delivery parser preserves zero and rejects missing, invalid, or negative metrics', () => {
  const row = { readable_time: '2026-10-01', spend: '0', impressions: 0, clicks: 0 };
  expect(parseDeliveryRows([row])).toEqual([{ date: '2026-10-01', spend: 0, impressions: 0, clicks: 0 }]);
  for (const spend of [null, undefined, '', -1, 'NaN', Infinity]) expect(() => parseDeliveryRows([{ ...row, spend }])).toThrow();
});
test('unauthenticated reporting requests never expose account data', async ({ request }) => {
  const response = await request.get('/api/reports/openai');
  expect([401, 503]).toContain(response.status());
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(await response.json()).toEqual({ error: response.status() === 401 ? 'SIGN_IN' : 'NOT_CONFIGURED' });
});
