'use client';
import { useState } from 'react';
import { PLATFORMS } from '@/lib/platforms';
import type { Business, PlatformId } from '@/lib/types';
import GlassDialog from './GlassDialog';
export default function AddBusiness({ onAdd, onClose }: { onAdd: (b: Business) => void; onClose: () => void }) {
  const [name, setName] = useState(''); const [industry, setIndustry] = useState('');
  const [platforms, setPlatforms] = useState<PlatformId[]>(['meta', 'google', 'openai']);
  const [sales, setSales] = useState(false); const [deal, setDeal] = useState('2000'); const [error, setError] = useState('');
  return <GlassDialog title="Add a business" onClose={onClose}><form className="form-stack" onSubmit={e => {
    e.preventDefault(); if (!name.trim() || !platforms.length) return;
    try { onAdd({ id: crypto.randomUUID(), name: name.trim(), industry: industry.trim() || 'General', platforms, sales: sales ? { enabled: true, avgDealSize: Number(deal) } : undefined }); }
    catch { setError('Could not save this business. Free browser storage and try again. Your details are still here.'); }
  }}>
    <p className="muted">Keep each business and its reports in its own workspace. Saved on this browser.</p>
    <label>Business name<input autoFocus required maxLength={70} value={name} onChange={e => setName(e.target.value)} placeholder="Your business name" /></label>
    <label>Industry<input maxLength={70} value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Coaching" /></label>
    <fieldset><legend>Ad platforms</legend><div className="platform-choices">{PLATFORMS.map(p => <button type="button" key={p.id} aria-pressed={platforms.includes(p.id)} onClick={() => setPlatforms(x => x.includes(p.id) ? x.filter(y => y !== p.id) : [...x, p.id])}>{p.name}</button>)}</div></fieldset>
    <label className="checkbox-label"><input type="checkbox" checked={sales} onChange={e => setSales(e.target.checked)} /> Include a sales pipeline</label>
    {sales && <label>Average deal size (USD)<input required type="number" min="0" max="100000000" step="0.01" value={deal} onChange={e => setDeal(e.target.value)} /></label>}
    {error && <p className="error-message" role="alert">{error}</p>}
    <button disabled={!name.trim() || !platforms.length} className="metal-button primary">Add business</button>
  </form></GlassDialog>;
}
