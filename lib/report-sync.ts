import { record, validateReport, type BusinessId, type ReportUpdate, type SavedReport, safeError } from './dashboard-report';
import type { AccountReport } from './account-report';

export function fromAccount(report: AccountReport): SavedReport {
  return validateReport({ since: report.since, until: report.until, timezone: report.timezone, checkedAt: report.fetchedAt, metric: 'spend', currency: report.currency,
    rows: report.days.map(row => ({ date: row.date, value: row.spend, clicks: row.clicks, impressions: row.impressions })) }, 'meta');
}
export function fromDreyOS(input: unknown): ReportUpdate[] {
  if (!Array.isArray(input) || input.length !== 2) throw Error('INVALID_REPORT');
  const seen = new Set<string>();
  return input.flatMap(value => {
    const group = record(value), businessId = group.businessId;
    if ((businessId !== '1bb' && businessId !== 'drey-personal') || seen.has(businessId)) throw Error('INVALID_REPORT');
    seen.add(businessId);
    const sources = record(group.sources), failures = record(group.failures), reporting = record(sources.reporting);
    return (businessId === '1bb' ? ['openai','stripe','posthog'] as const : ['openai','stripe'] as const).map(provider => {
      const base = { businessId: businessId as BusinessId, provider };
      if (failures[provider]) return { ...base, error: safeError(failures[provider]) };
      try {
        let data: unknown;
        if (provider === 'stripe') {
          const p = record(sources.payments);
          if (p.complete !== true || !Array.isArray(p.daily) || p.daily.length > 62 || p.daily.some(row => record(row).currency !== 'usd')) throw Error('INVALID_REPORT');
          const until = new Date(String(p.until) + 'T00:00:00Z'); until.setUTCDate(until.getUTCDate()-1);
          data = { since: p.from, until: until.toISOString().slice(0,10), timezone: 'UTC', checkedAt: p.checkedAt, metric: 'captured', currency: 'USD', rows: p.daily.map(value => {
            const row = record(value);
            if (!Number.isSafeInteger(row.capturedMinor) || !Number.isSafeInteger(row.refundedMinor)) throw Error('INVALID_REPORT');
            return { date: row.date, value: Number(row.capturedMinor)/100, refunded: Number(row.refundedMinor)/100 };
          }) };
        } else {
          const entry = record(reporting[provider === 'openai' ? 'ads' : 'posthog']);
          if (!entry.configured) return { ...base, error: 'NOT_CONFIGURED' };
          const p = record(entry.data);
          if (!Array.isArray(p.rows)) throw Error('INVALID_REPORT');
          if (provider === 'openai') {
            const account = businessId === '1bb' ? 'adacct_6abfbca6370081a2bbd57187fe0e2c25' : 'adacct_6ac43e2cb6a48197be5896e246ceda66';
            if (p.accountId !== account) throw Error('ACCOUNT_MISMATCH');
            data = { since:p.from, until:p.through, timezone:p.timezone, checkedAt:p.checkedAt, metric:'spend', currency:p.currency, rows:p.rows.map(value=>{const r=record(value); return {date:r.date,value:r.spend,clicks:r.clicks,impressions:r.impressions};}) };
          } else {
            if (businessId !== '1bb' || p.projectId !== 403729 || p.host !== '1bbcommunity.com') throw Error('ACCOUNT_MISMATCH');
            data = { since:p.from, until:p.through, timezone:'UTC', checkedAt:p.checkedAt, metric:'pageviews', rows:p.rows.map(value=>{const r=record(value);return {date:r.date,value:r.pageviews};}) };
          }
        }
        return { ...base, error: null, data: validateReport(data,provider) };
      } catch (error) { return { ...base, error: safeError(error instanceof Error ? error.message : undefined) }; }
    });
  });
}
