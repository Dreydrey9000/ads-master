export type BusinessId = 'drey-personal' | '1bb';
export type SourceId = 'openai' | 'meta' | 'google' | 'stripe' | 'posthog';
export type ReportRow = { date: string; value: number; clicks?: number; impressions?: number; refunded?: number };
export type SavedReport = {
  since: string; until: string; timezone: string; checkedAt: string;
  metric: 'spend' | 'captured' | 'pageviews'; currency?: 'USD'; rows: ReportRow[];
};
export type ReportUpdate = { businessId: BusinessId; provider: SourceId; error: string | null; data?: SavedReport };
export type DashboardSource = ReportUpdate & { attemptedAt: string };
export const SOURCE_NAMES: Record<SourceId, string> = { openai: 'ChatGPT Ads', meta: 'Meta Ads', google: 'Google / YouTube', stripe: 'Stripe payments', posthog: 'Website traffic' };
export const SOURCES: Record<BusinessId, SourceId[]> = { 'drey-personal': ['openai', 'meta', 'google', 'stripe'], '1bb': ['openai', 'stripe', 'posthog'] };
export function isBusiness(value: unknown): value is BusinessId { return value === '1bb' || value === 'drey-personal'; }
export function isSource(value: unknown): value is SourceId { return typeof value === 'string' && Object.hasOwn(SOURCE_NAMES, value); }
export const safeError = (value: unknown) => typeof value === 'string' && ['NOT_CONFIGURED','RECONNECT','RATE_LIMITED','ACCOUNT_MISMATCH','INVALID_REPORT','INCOMPLETE_REPORT','PROVIDER_ERROR'].includes(value) ? value : 'PROVIDER_ERROR';
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('INVALID_REPORT');
  return value as Record<string, unknown>;
}
function date(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(value).toISOString().slice(0,10) !== value) throw Error('INVALID_REPORT');
  return value;
}
function number(value: unknown, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER || (integer && !Number.isSafeInteger(value))) throw Error('INVALID_REPORT');
  return value;
}
export function validateReport(input: unknown, provider: SourceId, now = Date.now()): SavedReport {
  const d = record(input), since = date(d.since), until = date(d.until);
  if (since > until || Date.parse(until) - Date.parse(since) > 31 * 86400000 || Date.parse(until) > now) throw Error('INVALID_REPORT');
  const metric = provider === 'stripe' ? 'captured' : provider === 'posthog' ? 'pageviews' : 'spend';
  if (d.metric !== metric || (metric !== 'pageviews' && d.currency !== 'USD')) throw Error('INVALID_REPORT');
  if (typeof d.checkedAt !== 'string' || !Number.isFinite(Date.parse(d.checkedAt)) || Date.parse(d.checkedAt) > now + 300000) throw Error('INVALID_REPORT');
  if (typeof d.timezone !== 'string' || !['UTC','America/New_York'].includes(d.timezone)) throw Error('INVALID_REPORT');
  if (!Array.isArray(d.rows) || d.rows.length > 31) throw Error('INVALID_REPORT');
  const seen = new Set<string>();
  const rows = d.rows.map(value => {
    const r = record(value), day = date(r.date);
    if (day < since || day > until || seen.has(day)) throw Error('INVALID_REPORT');
    seen.add(day);
    return { date: day, value: number(r.value, metric === 'pageviews'),
      ...(metric === 'spend' ? { clicks: number(r.clicks, true), impressions: number(r.impressions, true) } : {}),
      ...(metric === 'captured' ? { refunded: number(r.refunded) } : {}) };
  }).sort((a,b) => a.date.localeCompare(b.date));
  if (rows.reduce((s,r)=>s+r.value,0) > Number.MAX_SAFE_INTEGER) throw Error('INVALID_REPORT');
  return { since, until, timezone: d.timezone, checkedAt: d.checkedAt, metric, ...(metric !== 'pageviews' ? { currency: 'USD' as const } : {}), rows };
}
export function validateUpdates(input: unknown): ReportUpdate[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 7) throw Error('INVALID_REPORT');
  const seen = new Set<string>();
  return input.map(value => {
    const item = record(value);
    if (!isBusiness(item.businessId) || !isSource(item.provider) || !SOURCES[item.businessId].includes(item.provider)) throw Error('INVALID_REPORT');
    const key = item.businessId + item.provider;
    if (seen.has(key)) throw Error('INVALID_REPORT'); seen.add(key);
    if (item.error !== null) return { businessId: item.businessId, provider: item.provider, error: safeError(item.error) };
    return { businessId: item.businessId, provider: item.provider, error: null, data: validateReport(item.data, item.provider) };
  });
}
export function nextStep(sources: DashboardSource[], now = Date.now()) {
  const problem = sources.find(s => s.error || !s.data || now - Date.parse(s.data.checkedAt) > 3 * 3600000);
  if (problem) return { title: `Check ${SOURCE_NAMES[problem.provider]}`, detail: problem.error === 'RECONNECT' ? 'This platform needs its reporting connection renewed. The last successful report remains below.' : 'This report is missing, delayed, or could not refresh. Check Connections before making a spending decision.' };
  const adReports = sources.filter(s => s.data?.metric === 'spend');
  const clicks = adReports.reduce((sum,s) => sum + (s.data?.rows.reduce((n,r)=>n+(r.clicks ?? 0),0) ?? 0),0);
  if (clicks) return { title: 'Check what happened after the click', detail: 'Clicks are being reported. Review completed applications or purchases and their matching conversion events before changing spend. Payment totals alone do not show which ads caused a sale.' };
  return { title: 'Prepare one measurable ad test', detail: 'No clicks are reported in the connected ad windows. Review the offer, destination, conversion test, spend cap, and stop rule in Growth before approving a launch.' };
}

export function retainedSnapshot(previous: SavedReport | undefined, update: ReportUpdate, attemptedAt: string) {
  if (previous && update.data && Date.parse(previous.checkedAt) > Date.parse(update.data.checkedAt)) return null;
  return { ...update, attemptedAt, ...(update.data ? {} : previous ? { data: previous } : {}) };
}
