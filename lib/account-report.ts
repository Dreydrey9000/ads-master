export interface AccountReport {
  accountName: string;
  currency: 'USD';
  since: string;
  until: string;
  timezone: string;
  fetchedAt: string;
  totals: { spend: number; impressions: number; clicks: number };
  days: { date: string; spend: number; impressions: number; clicks: number }[];
}

export function reportWindow(now = new Date()) {
  // Full completed days in the account timezone; UTC arithmetic on date labels avoids DST drift.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const end = new Date(`${today}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return { since: start.toISOString().slice(0, 10), until: end.toISOString().slice(0, 10) };
}

export function parseDeliveryRows(rows: unknown[]): AccountReport['days'] {
  return rows.map(row => {
    if (!row || typeof row !== 'object') throw new Error('INVALID_REPORT');
    const r = row as Record<string, unknown>;
    if (typeof r.readable_time !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.readable_time)) throw new Error('INVALID_REPORT');
    const number = (field: string) => {
      const value = r[field];
      if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && value.trim() === '') || !Number.isFinite(Number(value)) || Number(value) < 0) throw new Error('INVALID_REPORT');
      return Number(value);
    };
    return { date: r.readable_time, spend: number('spend'), impressions: number('impressions'), clicks: number('clicks') };
  });
}
