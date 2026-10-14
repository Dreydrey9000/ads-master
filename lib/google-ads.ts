import 'server-only';
import { importPKCS8, SignJWT } from 'jose';
import { type AccountReport, finishReport, parseDeliveryRows, reportWindow } from './account-report';

export async function fetchGoogleReport(): Promise<AccountReport> {
  const raw = process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON;
  const id = process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (!raw || !id || !/^\d{10}$/.test(id)) throw new Error('NOT_CONFIGURED');
  const credential = JSON.parse(raw);
  if (typeof credential.client_email !== 'string' || typeof credential.private_key !== 'string') throw new Error('NOT_CONFIGURED');
  const deadline = AbortSignal.timeout(45000);
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/adwords' })
    .setProtectedHeader({ alg: 'RS256' }).setIssuer(credential.client_email)
    .setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('1h')
    .sign(await importPKCS8(credential.private_key, 'RS256'));
  const auth = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }), cache: 'no-store', redirect: 'error', signal: deadline });
  if (!auth.ok) throw new Error('RECONNECT');
  const token = (await auth.json()).access_token;
  if (typeof token !== 'string' || !token) throw new Error('RECONNECT');
  async function search(query: string) {
    const rows: { customer?: { id: string; currencyCode: string; timeZone: string; descriptiveName?: string }; segments?: { date: string }; metrics?: { costMicros?: string; impressions?: string; clicks?: string } }[] = [];
    let pageToken: string | undefined;
    const seen = new Set<string>();
    for (let page = 0; page < 10; page++) {
      // POST is Google's read-only search RPC; there are no mutate calls in this adapter.
      const res = await fetch(`https://googleads.googleapis.com/v25/customers/${id}/googleAds:search`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, pageToken }), cache: 'no-store', redirect: 'error', signal: deadline });
      if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? 'RECONNECT' : res.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR');
      const data = await res.json();
      if (data.results !== undefined && !Array.isArray(data.results)) throw new Error('INVALID_REPORT');
      rows.push(...(data.results ?? []));
      if (!data.nextPageToken) return rows;
      if (typeof data.nextPageToken !== 'string' || seen.has(data.nextPageToken)) throw new Error('INVALID_REPORT');
      pageToken = data.nextPageToken; seen.add(pageToken!);
    }
    throw new Error('INCOMPLETE_REPORT');
  }
  const accounts = await search('SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer');
  const account = accounts[0]?.customer;
  if (accounts.length !== 1 || account?.id !== id || account.currencyCode !== 'USD' || account.timeZone !== 'America/New_York') throw new Error('ACCOUNT_MISMATCH');
  const window = reportWindow();
  const rows = await search(`SELECT segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks FROM customer WHERE segments.date BETWEEN '${window.since}' AND '${window.until}' ORDER BY segments.date`);
  const days = parseDeliveryRows(rows.map(r => {
    const micros = r.metrics?.costMicros ?? '0';
    if (!/^\d+$/.test(String(micros)) || !Number.isSafeInteger(Number(micros))) throw new Error('INVALID_REPORT');
    return { readable_time: r.segments?.date, spend: Number(micros) / 1_000_000, impressions: r.metrics?.impressions ?? '0', clicks: r.metrics?.clicks ?? '0' };
  }));
  return { ...finishReport(account.descriptiveName ?? 'Drey Thomas', window, days), connectionNote: 'Google and YouTube campaign delivery from this Google Ads account. Access tokens renew automatically using the read-only service account.' };
}
