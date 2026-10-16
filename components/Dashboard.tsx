"use client";
import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Minus, Flame, Plus, LayoutDashboard, Compass, BarChart3, Plug, ArrowDownToLine, Upload, ChevronRight, ArrowUpRight } from "lucide-react";
import { APP, PERSONAL_BUSINESS_ID, BUSINESSES as CONFIG_BUSINESSES } from "@/ads-master.config";
import { getMetrics, getAds, getInsights, getSales, WINNING_ADS, SPEND_TRENDS } from "@/lib/data/demo";
import { PLATFORMS } from "@/lib/platforms";
import type { Business } from "@/lib/types";
import { money, PlatformDot, Verdict } from "./ui";
import { MiniBars, GoalRing, Funnel } from "./charts";
import AddBusiness from "./AddBusiness";
import Connect from "./Connect";
import ImportReport from "./ImportReport";
import Overview from "./Overview";
import AccountReports from './AccountReports';
import { useLive } from "@/lib/live";
import { downloadReport, type Report } from "@/lib/reports";

const BASE_TABS = ["Overview", "AI Insights", "Winning Ads", "Spend Trends", "Connections"] as const;
type Tab = (typeof BASE_TABS)[number] | "Sales" | "Account reports";
const ICONS = { "Account reports": BarChart3, Overview: LayoutDashboard, Sales: BarChart3, "AI Insights": Sparkles, "Winning Ads": Compass, "Spend Trends": TrendingUp, Connections: Plug };
const STORE = "adsmaster.businesses";
const REPORT_STORE = "adsmaster.reports.v1";

export default function Dashboard({ personal = false }: { personal?: boolean }) {
  const [custom, setCustom] = useState<Business[]>([]);
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [adding, setAdding] = useState(false), [importing, setImporting] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [sample, setSample] = useState(!personal);
  const [bizId, setBizId] = useState(personal ? PERSONAL_BUSINESS_ID : CONFIG_BUSINESSES[0].id);
  const [tab, setTab] = useState<Tab>("Overview");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? '[]');
      if (!Array.isArray(saved) || saved.some(b => !b || typeof b.id !== 'string' || typeof b.name !== 'string' || !Array.isArray(b.platforms) || !b.platforms.length || b.platforms.some((p: string) => !PLATFORMS.some(x => x.id === p)))) throw new Error('Invalid businesses');
      setCustom(saved);
      const savedReports = JSON.parse(localStorage.getItem(REPORT_STORE) ?? '{}');
      if (!savedReports || Array.isArray(savedReports) || typeof savedReports !== 'object' || Object.values(savedReports).some((r: any) => !r || !Array.isArray(r.metrics) || r.metrics.some((m: any) => !m || !PLATFORMS.some(p => p.id === m.platform) || !['spend','revenue','impressions','clicks','conversions'].every(k => typeof m[k] === 'number' && Number.isFinite(m[k]) && m[k] >= 0) || !Array.isArray(m.trend)))) throw new Error('Invalid reports');
      setReports(savedReports);
      const selected = personal ? PERSONAL_BUSINESS_ID : localStorage.getItem('adsmaster.selected') || CONFIG_BUSINESSES[0].id;
      setBizId(selected); if (selected === PERSONAL_BUSINESS_ID || savedReports[selected] || saved.some((b: Business) => b.id === selected)) setSample(false);
    } catch { setStorageError('Saved workspace could not be read. Original browser storage is unchanged. Export any visible report before resetting browser data.'); }
    finally { setLoaded(true); }
  }, [personal]);
  const businesses = [...CONFIG_BUSINESSES, ...custom];
  const biz = businesses.find(b => b.id === bizId) ?? businesses[0];
  const tabs: Tab[] = ["Overview", ...(biz.id === PERSONAL_BUSINESS_ID ? ["Account reports" as const] : []), ...(biz.sales?.enabled ? ["Sales" as const] : []), ...BASE_TABS.slice(1)];
  useEffect(() => { if (tab === "Account reports" && biz.id !== PERSONAL_BUSINESS_ID) setTab("Overview"); }, [biz.id, tab]);
  useEffect(() => { if (tab === "Sales" && !biz.sales?.enabled) setTab("Overview"); }, [biz.sales?.enabled, tab]);
  useEffect(() => { document.title = `${tab} | Ads Master`; }, [tab]);
  const live = useLive(biz.id);
  const report = reports[biz.id];
  const isLive = !sample && !report && Boolean(live?.hasAdData);
  const metrics = sample ? getMetrics(biz) : report ? report.metrics : live?.hasAdData ? live.metrics : [];
  const ads = sample ? getAds(biz) : isLive ? live?.ads ?? [] : [];
  const insights = sample ? getInsights(biz) : isLive ? live?.insights ?? [] : [];
  const sales = !biz.sales?.enabled ? null : sample ? getSales(biz) : live?.sales?.hasData ? live.sales : null;
  const totals = { spend: metrics.reduce((s, m) => s + m.spend, 0) };
  const selectBusiness = (id: string) => { setBizId(id); setSample(id !== PERSONAL_BUSINESS_ID && !custom.some(b => b.id === id) && !reports[id]); try { localStorage.setItem('adsmaster.selected', id); } catch { setStorageError('Business selection could not be remembered in this browser.'); } };
  const addBiz = (b: Business) => { const next = [...custom, b]; localStorage.setItem(STORE, JSON.stringify(next)); setCustom(next); selectBusiness(b.id); setSample(false); setAdding(false); };
  const saveReport = (r: Report) => { const next = { ...reports, [biz.id]: r }; localStorage.setItem(REPORT_STORE, JSON.stringify(next)); setReports(next); setSample(false); setImporting(false); setTab('Overview'); };
  const researchTab = tab === 'Winning Ads' || tab === 'Spend Trends';

  return <div className="app-shell">
    <a className="skip-link" href="#workspace">Skip to workspace</a>
    <aside className="sidebar">
      <a href="/" className="brand"><span className="brand-mark">a<span>m</span></span><span>{APP.name}<small>BY DREY</small></span></a>
      <div className="workspace-label label">Your workspace</div>
      <label className="business-select"><span className="small muted">Business</span><select value={biz.id} onChange={e => selectBusiness(e.target.value)} aria-label="Select business">{businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      <button className="add-business" onClick={() => setAdding(true)} disabled={!loaded || !!storageError}><Plus size={16} aria-hidden="true" /> Add business</button>
      <div className="nav-label label">Manage & discover</div>
      <nav aria-label="Main navigation">{tabs.map(t => { const Icon = ICONS[t]; return <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}><Icon size={18} aria-hidden="true" />{t}{tab === t && <span className="nav-dot" />}</button>; })}</nav>
      <a className="metal-button" href="https://dreyos.dreytools.com/growth/#review">DreyOS Growth <ArrowUpRight size={16} aria-hidden="true" /></a>
      <div className="sidebar-bottom"><div className="local-dot" /><span>Local workspace<small>Saved in this browser</small></span></div>
    </aside>
    <main id="workspace" className="workspace" tabIndex={-1}>
      <header className="topbar"><span>{biz.name}<ChevronRight size={14} aria-hidden="true" /><span>{tab}</span></span><span className={`source-pill ${sample ? '' : 'real'}`}><span />{sample ? 'Sample workspace' : isLive ? 'Connected data' : report ? 'Imported report' : 'Your workspace'}</span></header>
      <div className="workspace-content">
        <div className="page-heading"><div><p className="eyebrow">{biz.industry} / AD PERFORMANCE</p><h1>{tab === 'Overview' ? 'Your ads, in focus.' : tab}</h1><p className="muted">{tab === 'Overview' ? 'Your platforms, reports, and next steps in one workspace.' : `Reports and tools for ${biz.name}.`}</p></div><div className="heading-actions"><button className="metal-button" disabled={!metrics.length} onClick={() => downloadReport(metrics, `${biz.id}-${sample ? 'sample' : 'report'}.csv`)}><ArrowDownToLine size={16} aria-hidden="true" />Export</button><button className="metal-button primary" disabled={!loaded || !!storageError} onClick={() => setImporting(true)}><Upload size={16} aria-hidden="true" />Import report</button></div></div>
        {storageError && <p className="error-message" role="alert">{storageError}</p>}
        <div className="data-notice"><div><span className="notice-dot" /><p><strong>{sample ? 'You’re exploring sample data.' : report ? report.period : 'Your business, your results.'}</strong><span>{sample ? 'All numbers, insights, ad examples, and trends here are illustrative.' : report ? `Imported ${new Date(report.importedAt).toLocaleDateString()} · ${report.name} · USD` : isLive ? 'Showing connected platform data.' : biz.id === PERSONAL_BUSINESS_ID ? 'Sign in below for private account reports, or import a CSV.' : 'Import a CSV report to start. No ad account is connected.'}</span></p></div><button className="notice-button" onClick={() => setSample(!sample)}>{sample ? 'Use my data' : 'Explore sample'}<ArrowUpRight size={14} aria-hidden="true" /></button></div>
        {!loaded ? <div className="card" role="status"><span className="thinking-orb" /> Opening your workspace…</div> : <div key={biz.id + tab} className="panel-enter">
          {(tab === 'Overview' || tab === 'Connections') && biz.id === '1bb' && <section className="card"><p className="eyebrow">1BB / CONNECTED REPORTS</p><h2>Your 1BB reports are in DreyOS.</h2><p className="muted">Open Growth and select 1BB to view its connected ChatGPT Ads, Stripe payments, and website analytics. Those reports are separate from the sample or CSV figures in this workspace.</p><a className="metal-button" href="https://dreyos.dreytools.com/growth/#review">Open 1BB reporting in DreyOS <ArrowUpRight size={16} aria-hidden="true" /></a></section>}
          {(tab === 'Overview' || tab === 'Account reports' || tab === 'Connections') && biz.id === PERSONAL_BUSINESS_ID && !sample && <AccountReports />}
          {tab === 'Account reports' && sample && <section className="card empty-state"><h2>Switch to your private reports</h2><p>Account reports use your connected accounts. Leave sample mode to sign in and read them.</p><button className="metal-button primary" onClick={() => setSample(false)}>Use my data</button></section>}
          {tab === 'Overview' && (biz.id !== PERSONAL_BUSINESS_ID || sample || report) && <Overview metrics={metrics} ads={ads} sample={sample} onImport={() => setImporting(true)} />}
      {tab === "Sales" && sales && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card flex items-center gap-4 animate-rise">
            <GoalRing value={sales.closedRevenue} goal={sales.goal} size={96} />
            <div><div className="label">Closed this month</div><div className="text-2xl font-bold">{money(sales.closedRevenue)}</div><div className="text-xs text-zinc-500">Goal {money(sales.goal)}</div></div>
          </div>
          <div className="card animate-rise" style={{ animationDelay: "80ms" }}><div className="label mb-2">Closed $ / day (14d)</div><MiniBars data={sales.daily} color="#22c55e" /></div>
          <div className="card animate-rise" style={{ animationDelay: "160ms" }}><div className="label mb-1">Ad spend per closed deal</div><div className="text-2xl font-bold">{money(sales.stages[3].value ? totals.spend / sales.stages[3].value : 0)}</div><div className="text-xs text-zinc-500">Avg deal {money(biz.sales?.avgDealSize ?? 0)}</div></div>
          <div className="card md:col-span-2 animate-rise"><div className="mb-3 font-semibold">Pipeline</div><Funnel stages={sales.stages} /></div>
          <div className="card animate-rise">
            <div className="mb-3 font-semibold">Deals by ad source</div>
            <div className="space-y-2">{[...sales.bySource].sort((a, b) => b.revenue - a.revenue).map((s) => (
              <div key={s.platform} className="flex items-center justify-between text-sm"><PlatformDot id={s.platform} /><span className="text-zinc-400">{s.deals} deals · <span className="text-white">{money(s.revenue)}</span></span></div>
            ))}</div>
          </div>
        </div>
      )}

      {tab === "AI Insights" && (sample || live?.insights.length) && (
        <div className="grid gap-4 md:grid-cols-3">
          {(["good", "bad", "ugly"] as const).map((v, col) => (
            <div key={v} className="space-y-3">
              <div className="flex items-center gap-2 font-semibold capitalize"><Sparkles className="h-4 w-4 text-accent-soft" /> The {v}</div>
              {insights.filter((i) => i.verdict === v).map((i) => (
                <div key={i.title} className="card space-y-2 animate-rise" style={{ animationDelay: `${col * 100}ms` }}>
                  <div className="flex items-center justify-between"><Verdict v={i.verdict} />{i.platform && <PlatformDot id={i.platform} />}</div>
                  <div className="font-semibold">{i.title}</div>
                  <p className="text-sm text-zinc-400">{i.detail}</p>
                  <div className="rounded-lg bg-ink-800 p-3 text-sm"><span className="label block">Do this</span>{i.action}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "Winning Ads" && sample && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {WINNING_ADS.map((w, i) => (
            <div key={w.brand} className="card space-y-2 animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between"><PlatformDot id={w.platform} /><span className="flex items-center gap-1 text-xs text-bad"><Flame className="h-3 w-3" />{w.runningDays} sample days</span></div>
              <div className="font-semibold">{w.brand}</div>
              <p className="text-sm text-zinc-300">{w.hook}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-bad transition-all duration-1000" style={{ width: `${Math.min(100, w.runningDays / 1.2)}%` }} /></div>
              <div className="flex gap-2 text-xs text-zinc-500"><span className="rounded bg-ink-800 px-2 py-0.5">{w.angle}</span><span className="rounded bg-ink-800 px-2 py-0.5">{w.category}</span></div>
            </div>
          ))}
        </div>
      )}

      {tab === "Spend Trends" && sample && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">Illustrative consumer trends for exploring the dashboard. These are not current market research.</p>
          {SPEND_TRENDS.map((s, i) => {
            const Icon = s.impact === "tailwind" ? TrendingUp : s.impact === "headwind" ? TrendingDown : Minus;
            const c = s.impact === "tailwind" ? "text-good" : s.impact === "headwind" ? "text-ugly" : "text-zinc-400";
            return (
              <div key={s.category} className="card flex items-center gap-4 animate-rise !p-4" style={{ animationDelay: `${i * 60}ms` }}>
                <Icon className={`h-5 w-5 ${c}`} />
                <div className="flex-1"><div className="font-semibold">{s.category}</div><div className="text-sm text-zinc-400">{s.note}</div></div>
                <div className={`text-lg font-bold ${c}`}>{s.change > 0 ? "+" : ""}{s.change}%</div>
              </div>
            );
          })}
        </div>
      )}


          {((researchTab && !sample) || (tab === 'AI Insights' && !insights.length) || (tab === 'Sales' && !sales)) && <section className="card empty-state"><Sparkles size={28} aria-hidden="true" /><h2>{researchTab ? 'Research feeds are not connected yet.' : tab === 'Sales' ? 'No sales events yet.' : 'No verified insights yet.'}</h2><p>{tab === 'AI Insights' ? 'Imported reports show measured results. AI recommendations need a verified data connection.' : tab === 'Sales' ? 'Campaign CSVs do not contain pipeline events. Explore the sample to preview the sales view.' : 'Explore the sample workspace to preview this view. Its examples are illustrative.'}</p><button className="metal-button" onClick={() => setSample(true)}>Explore sample</button></section>}
          {tab === 'Connections' && live && <Connect live={live} />}
          {tab === 'Connections' && !live && <div className="connections-layout"><section className="card connection-intro"><span className="eyebrow">START WITH A REPORT</span><h2>Your platforms, together.</h2><p className="muted">Use private ChatGPT Ads, Meta, and Google / YouTube reporting in your personal workspace. TikTok and LinkedIn still need account setup.</p><button className="metal-button primary" onClick={() => setImporting(true)}>Import a CSV report <ArrowUpRight size={16} aria-hidden="true" /></button></section><div className="connection-grid">{PLATFORMS.map(p => <div className="card connection-card" key={p.id}><PlatformDot id={p.id} /><span className="small muted">{["openai", "meta", "google", "youtube"].includes(p.id) && biz.id === PERSONAL_BUSINESS_ID ? "Private reporting above" : "Not connected"}</span><span className="small">CSV import available</span></div>)}</div></div>}
        </div>}
        <footer className="workspace-footer"><span>ADS MASTER <span className="muted">/</span> DREY · <a href="/updates">What’s new</a></span><span>{sample ? 'Illustrative data · no campaigns changed' : 'Local reports · no campaigns changed'}</span></footer>
      </div>
    </main>
    {adding && <AddBusiness onAdd={addBiz} onClose={() => setAdding(false)} />}
    {importing && <ImportReport business={biz.name} onSave={saveReport} onClose={() => setImporting(false)} />}
  </div>;
}
