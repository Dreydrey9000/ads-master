import 'server-only';
import { type AccountReport, parseDeliveryRows, reportWindow } from './account-report';

const BASE = 'https://api.ads.openai.com/v1';
export async function fetchPersonalReport(): Promise<AccountReport> {
  const key = process.env.OPENAI_ADS_API_KEY;
  const expected = process.env.OPENAI_ADS_ACCOUNT_ID;
  if (!key || !expected) throw new Error('NOT_CONFIGURED');
  const deadline = AbortSignal.timeout(45000);
  async function get(path: string) {
    const res = await fetch(`${BASE}${path}`, { method: 'GET', headers: { Authorization: `Bearer ${key}`, 'User-Agent': 'AdsMaster/0.1 (personal reporting)' }, cache: 'no-store', signal: AbortSignal.any([deadline, AbortSignal.timeout(15000)]), redirect: 'error' });
    if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? 'RECONNECT' : res.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR');
    return res.json();
  }
  const account = await get('/ad_account');
  if (account.id !== expected || account.currency_code !== 'USD' || account.timezone !== 'America/New_York') throw new Error('ACCOUNT_MISMATCH');
  const window = reportWindow();
  const query = new URLSearchParams({ aggregation_level: 'ad_account', time_granularity: 'daily', limit: '2000' });
  query.append('time_ranges[]', JSON.stringify({ type: 'date_range', ...window, timezone: 'America/New_York' }));
  for (const field of ['impressions', 'clicks', 'spend', 'metadata.readable_time']) query.append('fields[]', field);
  const rows: unknown[] = [];
  const cursors = new Set<string>();
  let complete = false;
  for (let page = 0; page < 10; page++) {
    const result = await get(`/ad_account/insights?${query}`);
    if (!Array.isArray(result.data) || typeof result.has_more !== 'boolean') throw new Error('INVALID_REPORT');
    rows.push(...result.data);
    if (!result.has_more) { complete = true; break; }
    if (typeof result.last_id !== 'string' || !result.last_id || cursors.has(result.last_id)) throw new Error('INVALID_REPORT');
    cursors.add(result.last_id);
    query.set('after', result.last_id);
  }
  if (!complete) throw new Error('INCOMPLETE_REPORT');
  const days = parseDeliveryRows(rows).sort((a, b) => a.date.localeCompare(b.date));
  if (new Set(days.map(d => d.date)).size !== days.length || days.some(d => d.date < window.since || d.date > window.until)) throw new Error('INVALID_REPORT');
  return { accountName: typeof account.name === 'string' ? account.name : 'Drey Thomas', currency: 'USD', ...window, timezone: 'America/New_York', fetchedAt: new Date().toISOString(), days, totals: days.reduce((sum, day) => ({ spend: sum.spend + day.spend, impressions: sum.impressions + day.impressions, clicks: sum.clicks + day.clicks }), { spend: 0, impressions: 0, clicks: 0 }) };
}
