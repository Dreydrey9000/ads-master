'use client';
import { useConvexAuth, useQuery } from 'convex/react';
import { makeFunctionReference } from 'convex/server';
import AccountSignIn, { AccountSignOut } from './AccountSignIn';
import { useEffect, useRef, useState } from 'react';
import type { AccountReport } from '@/lib/account-report';
import { money } from './ui';

const errors: Record<string, string> = {
  SIGN_IN: 'Your session ended. Sign in again to refresh your reports.',
  OWNER_ONLY: 'This login has not been approved for Drey’s personal reports. Finish owner setup or switch to your approved account.',
  NOT_CONFIGURED: 'Account setup is still in progress. Your reporting key needs to be connected before automatic updates can start.',
  RECONNECT: 'The account connection needs attention. Replace the reporting key in the secure server settings, then retry.',
  RATE_LIMITED: 'The ad platform is limiting requests. Wait a few minutes, then retry.',
  ACCOUNT_MISMATCH: 'The connected account does not match this workspace. Check the account connection before retrying.',
  PROVIDER_ERROR: 'The ad platform could not be reached. Check your connection and try again.',
  INVALID_REPORT: 'The platform returned an incomplete report. Try again later; no partial totals are shown.',
  INCOMPLETE_REPORT: 'The full report could not be loaded. Try again later; no partial totals are shown.',
};

export default function AccountReports() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <section className="card"><h2>Automatic reports need setup.</h2><p className="muted">Sign-in has not been configured for this installation. CSV reports remain available.</p></section>;
  return <ConnectedAccountReports />;
}

function ConnectedAccountReports() {
  const { isLoading, isAuthenticated: isSignedIn } = useConvexAuth();
  const isLoaded = !isLoading;
  const user = useQuery(makeFunctionReference<'query', Record<string, never>, { id: string; isOwner: boolean } | null>('viewer:current'), isSignedIn ? {} : 'skip');
  const [provider, setProvider] = useState<'openai' | 'meta' | 'google'>('openai');
  const providerName = { openai: 'ChatGPT Ads', meta: 'Meta Ads', google: 'Google / YouTube Ads' }[provider];
  const [report, setReport] = useState<AccountReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [showUpdate, setShowUpdate] = useState(false);
  const lastFetch = useRef(0);
  useEffect(() => {
    if (!user) return;
    try { setShowUpdate(localStorage.getItem(`adsmaster.update.glass-workspace.${user.id}`) !== 'seen'); } catch { setShowUpdate(true); }
  }, [user]);
  useEffect(() => {
    setReport(null); setError('');
    if (!isSignedIn) return;
    let active = true;
    let pending = false;
    const controller = new AbortController();
    async function load() {
      if (pending || document.hidden) return;
      pending = true; setLoading(true); lastFetch.current = Date.now();
      try {
        const response = await fetch(`/api/reports/${provider}`, { cache: 'no-store', signal: controller.signal });
        const body = await response.json();
        if (!active) return;
        if (!response.ok) { setError(errors[body.error] ?? errors.PROVIDER_ERROR); setReport(null); }
        else { setReport(body); setError(''); }
      } catch { if (active) { setReport(null); setError(errors.PROVIDER_ERROR); } }
      finally { pending = false; if (active) setLoading(false); }
    }
    void load();
    const interval = window.setInterval(load, 5 * 60 * 1000);
    const visible = () => { if (!document.hidden && Date.now() - lastFetch.current >= 5 * 60 * 1000) void load(); };
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; controller.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, [isSignedIn, user?.id, refresh, provider]);

  function dismissUpdate() {
    try { localStorage.setItem(`adsmaster.update.glass-workspace.${user?.id}`, 'seen'); } catch { /* Remains available on the next visit. */ }
    setShowUpdate(false);
  }

  return <section className="overview-stack" aria-label="Automatic account reports">
    <div className="card account-report-header">
      <div><p className="eyebrow">PERSONAL ACCOUNT / {providerName.toUpperCase()}</p><h2>Your account, automatically.</h2><p className="muted">Private reporting for Drey Thomas. Refreshes every five minutes while this view is open.</p></div>
      <div className="heading-actions">{isSignedIn && <AccountSignOut />}{!isLoaded ? <span role="status">Checking sign-in…</span> : isSignedIn ? <button className="metal-button" disabled={loading} onClick={() => setRefresh(n => n + 1)}>Refresh reports</button> : <AccountSignIn />}</div>
    </div>
    {showUpdate && isSignedIn && <aside className="card account-update"><h2>New: your Glass Workspace</h2><p>Your workspace has a new glass layout. Use Account reports in the navigation to reach your private ChatGPT Ads, Meta, and Google / YouTube reports. Connections and CSV import remain available.</p><p className="small muted">Only your personal account is used here. Reporting does not change campaigns or budgets.</p><div className="heading-actions"><a className="metal-button" href="/updates">See what changed</a><button className="metal-button" onClick={dismissUpdate}>Got it</button></div></aside>}
    {isSignedIn && <div className="heading-actions reporting-platforms" role="group" aria-label="Reporting platform">{(['openai', 'meta', 'google'] as const).map(id => <button key={id} className={`metal-button${provider === id ? ' primary' : ''}`} aria-pressed={provider === id} onClick={() => { if (provider !== id) { setReport(null); setError(''); setProvider(id); } }}>{ {openai: 'ChatGPT Ads', meta: 'Meta Ads', google: 'Google / YouTube Ads'}[id] }</button>)}</div>}
    {loading && <div className="card" role="status"><span className="thinking-orb" /> Reading your account report…</div>}
    {error && <div className="card error-message" role="alert"><h2>Reports need attention</h2><p>{error}</p><p className="small">You can still import a CSV using the button above.</p></div>}
    {!isSignedIn && isLoaded && <div className="card"><h2>Your reports stay private.</h2><p className="muted">Sign in with your approved owner account to view connected results. A new login does not automatically gain access.</p></div>}
    {isSignedIn && report && <>
      <p className="small muted">{report.accountName} · {providerName}</p>
      {report.connectionNote && <p className="small muted">{report.connectionNote}</p>}
      <p className="small muted">{report.since} – {report.until} · 30 completed days · New York time · Updated {new Date(report.fetchedAt).toLocaleString()}</p>
      <div className="kpi-grid">{[
        ['Ad spend', money(report.totals.spend), `USD · reported by ${providerName}`],
        ['Impressions', report.totals.impressions.toLocaleString(), 'Times your ads were shown'],
        ['Clicks', report.totals.clicks.toLocaleString(), 'Reported ad clicks'],
        ['Click-through rate', report.totals.impressions ? `${(report.totals.clicks / report.totals.impressions * 100).toFixed(2)}%` : '—', 'Clicks ÷ impressions'],
      ].map(([label, value, detail]) => <div className="card kpi" key={label}><span className="label">{label}</span><strong>{value}</strong><span className="small muted">{detail}</span></div>)}</div>
      <div className="card"><h2>{report.days.length ? 'Daily delivery' : 'No delivery reported in this period.'}</h2><p className="muted">Revenue and conversions are not included in this connection yet. Ad results are not a measure of cash available to spend.</p>{report.days.length > 0 && <div className="table-scroll" role="region" aria-label="Daily account delivery" tabIndex={0}><table><thead><tr><th scope="col">Date</th><th scope="col">Spend</th><th scope="col">Impressions</th><th scope="col">Clicks</th></tr></thead><tbody>{report.days.map(day => <tr key={day.date}><td>{day.date}</td><td>{money(day.spend)}</td><td>{day.impressions.toLocaleString()}</td><td>{day.clicks.toLocaleString()}</td></tr>)}</tbody></table></div>}</div>
    </>}
  </section>;
}
