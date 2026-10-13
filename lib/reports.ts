import type { PlatformId, PlatformMetrics } from './types';

export interface Report { metrics: PlatformMetrics[]; importedAt: string; name: string; period: string }
export const REPORT_HEADERS = ['platform', 'spend', 'revenue', 'impressions', 'clicks', 'conversions'] as const;
const platforms: PlatformId[] = ['meta', 'google', 'tiktok', 'linkedin', 'openai', 'youtube'];

// Quoted CSV fields, escaped quotes and CRLF are supported. All numeric fields are required.
export function parseReport(text: string): PlatformMetrics[] {
  if (text.length > 1_000_000) throw new Error('Use a CSV smaller than 1 MB.');
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (c === ',' || c === '\n')) { row.push(field.trim()); field = ''; if (c === '\n') { rows.push(row); row = []; } }
    else field += c;
  }
  if (quoted) throw new Error('A quoted field is unfinished. Check the CSV and try again.');
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  const nonempty = rows.filter(r => r.some(Boolean));
  const header = nonempty.shift()?.map(s => s.replace(/^\uFEFF/, '').toLowerCase()) ?? [];
  if (REPORT_HEADERS.some(h => !header.includes(h)) || new Set(header).size !== header.length) throw new Error('Use the six unique column names in the CSV template.');
  if (!nonempty.length) throw new Error('Add at least one platform row below the header.');
  const result = new Map<PlatformId, PlatformMetrics>();
  nonempty.forEach((r, i) => {
    if (r.length !== header.length) throw new Error(`Row ${i + 2}: column count does not match the header.`);
    const platform = r[header.indexOf('platform')].toLowerCase() as PlatformId;
    if (!platforms.includes(platform)) throw new Error(`Row ${i + 2}: platform must be meta, google, tiktok, linkedin, openai, or youtube.`);
    const entry: PlatformMetrics = { platform, trend: [], spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 };
    for (const key of REPORT_HEADERS.slice(1) as Exclude<typeof REPORT_HEADERS[number], 'platform'>[]) {
      const raw = r[header.indexOf(key)].replace(/[$,]/g, '');
      const value = Number(raw);
      if (!raw || !Number.isFinite(value) || value < 0 || value > 1e12 || (['impressions', 'clicks', 'conversions'].includes(key) && !Number.isInteger(value))) throw new Error(`Row ${i + 2}: ${key} must be a nonnegative ${['impressions', 'clicks', 'conversions'].includes(key) ? 'whole number' : 'number'}.`);
      entry[key] = value;
    }
    if (entry.clicks > entry.impressions) throw new Error(`Row ${i + 2}: clicks cannot exceed impressions.`);
    const prev = result.get(platform);
    if (prev) for (const key of REPORT_HEADERS.slice(1) as Exclude<typeof REPORT_HEADERS[number], 'platform'>[]) prev[key] += entry[key];
    else result.set(platform, entry);
  });
  return [...result.values()];
}
export function reportCsv(metrics: PlatformMetrics[]) {
  return [REPORT_HEADERS.join(','), ...metrics.map(m => REPORT_HEADERS.map(k => m[k]).join(','))].join('\n');
}
export function downloadReport(metrics: PlatformMetrics[], name: string) {
  const url = URL.createObjectURL(new Blob([reportCsv(metrics)], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
