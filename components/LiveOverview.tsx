'use client';
import { useEffect, useState } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import { ArrowUpRight, Clock3, CircleAlert } from 'lucide-react';
import AccountSignIn, { AccountSignOut } from './AccountSignIn';
import { money } from './ui';
import { SOURCES, SOURCE_NAMES, nextStep, type BusinessId, type DashboardSource, type SavedReport } from '@/lib/dashboard-report';
import './live-overview.css';

const dashboardQuery = makeFunctionReference<'query', { businessId: BusinessId }, DashboardSource[] | null>('reporting:dashboard');
const viewerQuery = makeFunctionReference<'query', Record<string, never>, { id: string; isOwner: boolean } | null>('viewer:current');
const format = (value: number, data: SavedReport) => data.metric === 'pageviews' ? value.toLocaleString() : money(value);

export default function LiveOverview({ businessId }: { businessId: BusinessId }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <section className="card overview-stack"><h2>Automatic reports need setup.</h2><p>Sign-in must be configured before private reports can be displayed.</p></section>;
  return <ConnectedOverview businessId={businessId} />;
}

function ConnectedOverview({ businessId }: { businessId: BusinessId }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const viewer = useQuery(viewerQuery, isAuthenticated ? {} : 'skip');
  const saved = useQuery(dashboardQuery, viewer?.isOwner ? { businessId } : 'skip');
  const [now, setNow] = useState(Date.now);
  const [showUpdate, setShowUpdate] = useState(false);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!viewer?.isOwner) { setShowUpdate(false); return; }
    try { setShowUpdate(localStorage.getItem(`adsmaster.update.automatic-overview.${viewer.id}`) !== 'seen'); } catch { setShowUpdate(true); }
  }, [viewer?.id, viewer?.isOwner]);
  const waiting = isLoading || (isAuthenticated && viewer === undefined) || (viewer?.isOwner && saved === undefined);
  const sources: DashboardSource[] = SOURCES[businessId].map(provider => saved?.find(s => s.provider === provider) ?? { businessId, provider, attemptedAt: '', error: 'NOT_CONFIGURED' });
  function dismiss() { try { localStorage.setItem(`adsmaster.update.automatic-overview.${viewer?.id}`, 'seen'); } catch { /* Keep the update available on the next visit. */ } setShowUpdate(false); }
  return <section className="overview-stack" aria-label="Automatic business reporting">
    <div className="card account-report-header"><div><p className="eyebrow">{businessId === '1bb' ? '1BB' : 'DREY THOMAS'} / AUTOMATIC REPORTS</p><h2>Your results, together.</h2><p className="muted"><Clock3 size={15} aria-hidden="true" /> Scheduled hourly, even when this app is closed. Each source shows its last successful update.</p></div><div className="heading-actions">{isAuthenticated ? <AccountSignOut /> : !isLoading && <AccountSignIn />}</div></div>
    {waiting ? <div className="card" role="status"><span className="thinking-orb" /> Loading private reports…</div> : !isAuthenticated ? <div className="card"><h2>Your reports stay private.</h2><p className="muted">Sign in with your approved Google account to see saved results, graphs, and next steps.</p></div> : !viewer?.isOwner || saved === null ? <div className="card error-message" role="alert"><h2>Owner access required</h2><p>This login cannot view these business reports. Switch to your approved account.</p></div> : <>
      <ReportOverview sources={sources} now={now} />
      {showUpdate && <aside className="card account-update"><h2>New: automatic totals, graphs, and next steps</h2><p>Overview now brings DreyOS reports into Ads Master. Switch Business for personal or 1BB results. Meta and Google join the hourly background update, so reports keep refreshing after you close the app.</p><div className="heading-actions"><a className="metal-button" href="/updates">See what changed</a><button className="metal-button" onClick={dismiss}>Got it</button></div></aside>}
    </>}
  </section>;
}

export function ReportOverview({ sources, now }: { sources: DashboardSource[]; now: number }) {
  const next = nextStep(sources, now);
  return <>
    <section className="card next-action"><div><p className="eyebrow">WHAT TO DO NEXT</p><h2>{next.title}</h2><p>{next.detail}</p></div><a className="metal-button" href="https://dreyos.dreytools.com/growth/#review">Open Growth review <ArrowUpRight size={16} aria-hidden="true" /></a></section>
    <div className="report-grid">{sources.map(source => <SourceCard key={source.provider} source={source} now={now} />)}</div>
    <p className="small muted">These are source-reported totals for the dates on each card. Payments are before fees and costs, and do not establish ad attribution or available profit. Website pageviews can include member pages and repeat visits. Missing daily rows are not assumed to be zero.</p>
  </>;
}

function SourceCard({ source, now }: { source: DashboardSource; now: number }) {
  const data = source.data;
  const stale = data && now - Date.parse(data.checkedAt) > 3 * 3600000;
  const attention = source.error || stale || !data;
  const total = data?.rows.reduce((sum, row) => sum + row.value, 0) ?? 0;
  const label = data?.metric === 'captured' ? 'Captured payments' : data?.metric === 'pageviews' ? 'Pageviews' : 'Ad spend';
  return <article className="card report-source">
    <div className="report-source-heading"><h3>{SOURCE_NAMES[source.provider]}</h3><span className={`report-health${attention ? ' attention' : ''}`}>{attention ? <CircleAlert size={14} aria-hidden="true" /> : <Clock3 size={14} aria-hidden="true" />}{attention ? 'Needs attention' : 'Up to date'}</span></div>
    {attention && <p className="report-warning">{source.error === 'RECONNECT' ? 'Reconnect this account to resume updates.' : !data ? 'Waiting for the first successful background report.' : source.error ? 'The latest refresh failed. Showing the last successful report.' : 'This report is over three hours old. The background connection needs checking.'}</p>}
    {data ? <>
      <span className="label">{label}</span><strong className="report-total">{format(total, data)}</strong>
      <p className="small muted">{data.since} – {data.until} · {data.timezone === 'UTC' ? 'UTC' : 'New York time'}{data.currency && ' · USD'}</p>
      {data.metric === 'spend' && <p className="small">{data.rows.reduce((s,r) => s + (r.clicks ?? 0),0).toLocaleString()} clicks · {data.rows.reduce((s,r) => s + (r.impressions ?? 0),0).toLocaleString()} impressions</p>}
      {data.metric === 'captured' && <p className="small">{money(data.rows.reduce((s,r) => s + (r.refunded ?? 0),0))} refunded from these payments</p>}
      <DailyGraph data={data} label={`${SOURCE_NAMES[source.provider]} daily ${label.toLowerCase()}`} />
      <p className="small muted">Updated <time dateTime={data.checkedAt}>{new Date(data.checkedAt).toLocaleString()}</time></p>
      <details><summary>Daily figures</summary><div className="table-scroll" role="region" aria-label={`${SOURCE_NAMES[source.provider]} daily figures`} tabIndex={0}><table><thead><tr><th scope="col">Date</th><th scope="col">{label}</th>{data.metric === 'spend' && <><th scope="col">Clicks</th><th scope="col">Impressions</th></>}{data.metric === 'captured' && <th scope="col">Refunded</th>}</tr></thead><tbody>{data.rows.map(row => <tr key={row.date}><td>{row.date}</td><td>{format(row.value, data)}</td>{data.metric === 'spend' && <><td>{row.clicks}</td><td>{row.impressions}</td></>}{data.metric === 'captured' && <td>{money(row.refunded ?? 0)}</td>}</tr>)}</tbody></table>{!data.rows.length && <p>No daily activity returned for this period.</p>}</div></details>
    </> : <p className="muted">No verified total yet. Check the account connection in DreyOS Growth.</p>}
    {attention && source.attemptedAt && <p className="small muted">Last attempt: {new Date(source.attemptedAt).toLocaleString()}</p>}
  </article>;
}

function DailyGraph({ data, label }: { data: SavedReport; label: string }) {
  const days = Math.round((Date.parse(data.until) - Date.parse(data.since)) / 86400000) + 1;
  const max = Math.max(1, ...data.rows.map(r => r.value));
  const width = 600, height = 120, slot = width / days;
  return <figure className="daily-graph"><svg viewBox={`0 0 ${width} ${height + 12}`} role="img" aria-label={`${label}. Maximum daily value ${format(Math.max(0, ...data.rows.map(r => r.value)), data)}. Exact values in Daily figures below.`}>
    <line x1="0" x2={width} y1={height} y2={height} className="graph-baseline" />
    {Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.parse(data.since) + i * 86400000).toISOString().slice(0,10);
      const row = data.rows.find(r => r.date === date);
      const x = i * slot + 2;
      return row ? <rect key={date} x={x} y={height - Math.max(2, row.value / max * height)} width={Math.max(2,slot - 4)} height={Math.max(2,row.value / max * height)} rx="2" className="graph-bar"><title>{`${date}: ${format(row.value,data)}`}</title></rect> : <line key={date} x1={x} x2={x + Math.max(2,slot - 4)} y1={height + 7} y2={height + 7} className="graph-missing"><title>{`${date}: no row returned`}</title></line>;
    })}
  </svg><figcaption className="small muted">Daily {data.metric === 'captured' ? 'captured payments' : data.metric} · bars: reported days · dashes: no row returned</figcaption></figure>;
}
