'use client';
import { useState } from 'react';
import GlassDialog from './GlassDialog';
import { parseReport, type Report } from '@/lib/reports';
import type { PlatformMetrics } from '@/lib/types';
import { money } from './ui';
export default function ImportReport({ business, onSave, onClose }: { business: string; onSave: (r: Report) => void; onClose: () => void }) {
  const [metrics, setMetrics] = useState<PlatformMetrics[] | null>(null);
  const [name, setName] = useState(''); const [period, setPeriod] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <GlassDialog title="Import a campaign report" onClose={onClose}>
    <p className="muted">Add real results for {business}. Reports stay in this browser. Import replaces the previous report for this business.</p>
    <a className="template-link" href="/report-template.csv" download>Download CSV template ↗</a>
    <form className="form-stack" onSubmit={e => { e.preventDefault(); if (!metrics || !period.trim()) return; try { onSave({ metrics, name, period: period.trim(), importedAt: new Date().toISOString() }); } catch { setError('Could not save this report. Free browser storage and try again. Your file is still ready to import.'); } }}>
      <label>Reporting period<input required maxLength={80} placeholder="e.g. September 1–30, 2026" value={period} onChange={e => setPeriod(e.target.value)} /></label>
      <label className="file-drop">Choose your CSV<input type="file" accept=".csv,text/csv" onChange={async e => {
        const f = e.target.files?.[0]; setMetrics(null); setError(''); if (!f) return;
        if (f.size > 1_000_000) { setError('Use a CSV smaller than 1 MB.'); return; }
        setBusy(true); try { const parsed = parseReport(await f.text()); setMetrics(parsed); setName(f.name); } catch (err) { setError(err instanceof Error ? err.message : 'Could not read this file. Try a CSV from the template.'); } finally { setBusy(false); }
      }} /></label>
      {busy && <p role="status"><span className="thinking-orb" /> Reading your report…</p>}
      {metrics && <div className="import-preview" role="status"><strong>{metrics.length} platform{metrics.length === 1 ? '' : 's'} ready</strong><span>{money(metrics.reduce((s, m) => s + m.spend, 0))} total spend · USD</span></div>}
      {error && <p className="error-message" role="alert">{error}</p>}
      <p className="small muted">Use aggregated totals in USD. This report does not include individual ads, daily trends, or sales pipeline events.</p>
      <button className="metal-button primary" disabled={!metrics || !period.trim() || busy}>Import report</button>
    </form>
  </GlassDialog>;
}
