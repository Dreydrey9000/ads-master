import { test, expect } from '@playwright/test';
import { parseReport, reportCsv } from '../lib/reports';
const header = 'platform,spend,revenue,impressions,clicks,conversions';
test('CSV roundtrip, quotes, duplicate platforms and Unicode BOM', () => {
  const metrics = parseReport(`\uFEFF${header}\r\nmeta,"$1,200",3600,10000,300,12\r\nmeta,100,400,1000,30,2\r\nopenai,0,0,0,0,0`);
  expect(metrics[0]).toMatchObject({ spend: 1300, revenue: 4000, clicks: 330, conversions: 14, trend: [] });
  expect(parseReport(reportCsv(metrics))).toEqual(metrics);
});
test('invalid reports fail without inventing metrics', () => {
  for (const data of [header, `${header}\nmeta,,1,10,2,1`, `${header}\nunknown,1,1,10,2,1`, `${header}\nmeta,-1,1,10,2,1`, `${header}\nmeta,NaN,1,10,2,1`, `${header}\nmeta,1,1,10,20,1`, `${header}\nmeta,1,1,10,2,1.5`, `${header}\nmeta,"1,1,10,2,1`, `${header}\nmeta,1,1,10,2`]) expect(() => parseReport(data)).toThrow();
});
