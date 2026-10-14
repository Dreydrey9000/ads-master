import 'server-only';
import { type AccountReport, parseDeliveryRows, reportWindow, finishReport } from './account-report';

export async function fetchMetaReport(): Promise<AccountReport> {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const id = process.env.META_ADS_ACCOUNT_ID;
  if (!token || !id || !/^act_\d+$/.test(id)) throw new Error('NOT_CONFIGURED');
  const deadline = AbortSignal.timeout(45000);
  async function get(path: string, query: URLSearchParams) {
    const res = await fetch(`https://graph.facebook.com/v26.0/${path}?${query}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error', signal: deadline });
    if (!res.ok) throw new Error(res.status === 400 || res.status === 401 || res.status === 403 ? 'RECONNECT' : res.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR');
    return res.json();
  }
  const account = await get(id, new URLSearchParams({ fields: 'id,name,currency,timezone_name' }));
  if (account.id !== id || account.currency !== 'USD' || account.timezone_name !== 'America/New_York') throw new Error('ACCOUNT_MISMATCH');
  const window = reportWindow();
  const query = new URLSearchParams({ fields: 'date_start,spend,impressions,clicks', level: 'account', time_increment: '1', time_range: JSON.stringify(window), limit: '100' });
  const rows: unknown[] = [];
  const cursors = new Set<string>();
  for (let page = 0; page < 10; page++) {
    const result = await get(`${id}/insights`, query);
    if (!Array.isArray(result.data)) throw new Error('INVALID_REPORT');
    rows.push(...result.data.map((r: Record<string, unknown>) => ({ ...r, readable_time: r?.date_start })));
    if (!result.paging?.next) {
      return { ...finishReport(account.name ?? 'Andre Thomas', window, parseDeliveryRows(rows)), connectionNote: 'Meta may require reconnection when its reporting token expires. No campaign-editing permission is granted.' };
    }
    const cursor = result.paging?.cursors?.after;
    if (typeof cursor !== 'string' || !cursor || cursors.has(cursor)) throw new Error('INVALID_REPORT');
    cursors.add(cursor); query.set('after', cursor);
  }
  throw new Error('INCOMPLETE_REPORT');
}
