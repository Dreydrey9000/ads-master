"use client";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Minus, Flame, Plug, Plus, Trophy } from "lucide-react";
import { APP, BUSINESSES as CONFIG_BUSINESSES } from "@/ads-master.config";
import { getMetrics, getAds, getInsights, getSales, WINNING_ADS, SPEND_TRENDS } from "@/lib/data/demo";
import { PLATFORMS, platformById } from "@/lib/platforms";
import type { Business } from "@/lib/types";
import { money, PlatformDot, Verdict } from "./ui";
import { MiniArea, MiniDonut, MiniBars, GoalRing, Funnel, useCountUp } from "./charts";
import AddBusiness from "./AddBusiness";
import Connect from "./Connect";
import { useLive } from "@/lib/live";

const BASE_TABS = ["Overview", "AI Insights", "Winning Ads", "Spend Trends", "Connections"] as const;
type Tab = (typeof BASE_TABS)[number] | "Sales";
const STORE = "adsmaster.businesses";

function Kpi({ label, value, fmt, delay = 0 }: { label: string; value: number; fmt: (n: number) => string; delay?: number }) {
  const v = useCountUp(value);
  return <div className="card animate-rise" style={{ animationDelay: `${delay}ms` }}><div className="label">{label}</div><div className="mt-1 text-2xl font-bold tabular-nums">{fmt(v)}</div></div>;
}

export default function Dashboard() {
  const [custom, setCustom] = useState<Business[]>([]);
  const [adding, setAdding] = useState(false);
  useEffect(() => { try { setCustom(JSON.parse(localStorage.getItem(STORE) ?? "[]")); } catch {} }, []);
  const businesses = [...CONFIG_BUSINESSES, ...custom];
  const [bizId, setBizId] = useState(businesses[0].id);
  const biz = businesses.find((b) => b.id === bizId) ?? businesses[0];
  const tabs: Tab[] = biz.sales?.enabled ? ["Overview", "Sales", ...BASE_TABS.slice(1)] : [...BASE_TABS];
  const [tab, setTab] = useState<Tab>("Overview");
  useEffect(() => { if (tab === "Sales" && !biz.sales?.enabled) setTab("Overview"); }, [biz, tab]);

  // Live Convex data wins wherever it exists; demo fills the gaps so the UI never looks empty.
  const live = useLive(biz.id);
  const metrics = useMemo(() => (live?.hasAdData ? live.metrics : getMetrics(biz)), [biz, live]);
  const ads = useMemo(() => (live?.hasAdData ? live.ads : getAds(biz)), [biz, live]);
  const insights = useMemo(() => (live?.insights.length ? live.insights : getInsights(biz)), [biz, live]);
  const sales = useMemo(() => (!biz.sales?.enabled ? null : live?.sales?.hasData ? live.sales : getSales(biz)), [biz, live]);
  const isLive = Boolean(live?.hasAdData);
  const totals = useMemo(() => {
    const spend = metrics.reduce((s, m) => s + m.spend, 0), revenue = metrics.reduce((s, m) => s + m.revenue, 0), conv = metrics.reduce((s, m) => s + m.conversions, 0);
    return { spend, revenue, roas: spend ? revenue / spend : 0, cpa: conv ? spend / conv : 0 };
  }, [metrics]);
  const mix = metrics.map((m) => ({ name: platformById[m.platform].name, value: m.spend, color: platformById[m.platform].color }));

  const addBiz = (b: Business) => { const next = [...custom, b]; setCustom(next); localStorage.setItem(STORE, JSON.stringify(next)); setBizId(b.id); setAdding(false); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-lg font-black animate-glow">A</div>
          <div><h1 className="text-xl font-bold tracking-tight">{APP.name}</h1><p className="text-xs text-zinc-500">{APP.tagline}</p></div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${isLive ? "border-good/50 text-good" : "border-ink-600 text-zinc-500"}`}>{isLive ? "● Live" : "Demo data"}</span>
      </header>

      {/* Business switcher */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {businesses.map((b) => (
          <button key={b.id} onClick={() => setBizId(b.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition active:scale-95 ${b.id === biz.id ? "border-accent bg-accent/20 text-white" : "border-ink-700 bg-ink-900 text-zinc-400 hover:text-white"}`}>
            <span>{b.emoji ?? "🏢"}</span>{b.name}{b.sales?.enabled && <span className="rounded bg-good/20 px-1.5 text-[10px] text-good">SALES</span>}
          </button>
        ))}
        <button onClick={() => setAdding(true)} className="flex shrink-0 items-center gap-1 rounded-xl border border-dashed border-ink-600 px-3 py-2 text-sm text-zinc-500 hover:border-accent hover:text-white"><Plus className="h-4 w-4" /> Add business</button>
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-ink-700">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm transition ${tab === t ? "border-accent text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>{t}</button>
        ))}
      </nav>

      <div key={biz.id + tab}>
      {tab === "Overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Spend (30d)" value={totals.spend} fmt={money} />
            <Kpi label="Revenue" value={totals.revenue} fmt={money} delay={60} />
            <Kpi label="Blended ROAS" value={totals.roas} fmt={(n) => `${n.toFixed(2)}x`} delay={120} />
            <Kpi label="Blended CPA" value={totals.cpa} fmt={money} delay={180} />
          </div>
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <div className="card flex items-center gap-4 animate-rise">
              <MiniDonut data={mix} size={88} />
              <div className="space-y-1 text-xs">{mix.map((m) => <div key={m.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: m.color }} />{m.name}</div>)}<div className="label pt-1">Spend mix</div></div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {metrics.map((m, i) => {
                const p = platformById[m.platform], roas = m.spend ? m.revenue / m.spend : 0;
                return (
                  <div key={m.platform} className="card animate-rise !p-4" style={{ animationDelay: `${i * 70}ms` }}>
                    <div className="flex items-center justify-between"><PlatformDot id={m.platform} /><span className={`text-sm font-bold ${roas >= 3 ? "text-good" : roas >= 2 ? "text-bad" : "text-ugly"}`}>{roas.toFixed(1)}x</span></div>
                    <MiniArea data={m.trend} color={p.color} h={32} />
                    <div className="flex justify-between text-[11px] text-zinc-500"><span>{money(m.spend)}</span><span>{m.impressions ? ((m.clicks / m.impressions) * 100).toFixed(2) : "0.00"}% CTR</span></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card overflow-x-auto animate-rise">
            <div className="mb-3 flex items-center gap-2 font-semibold"><Trophy className="h-4 w-4 text-bad" /> Your ads, ranked</div>
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-zinc-500"><tr><th className="pb-2">Ad</th><th>Platform</th><th>Spend</th><th>ROAS</th><th>CTR</th><th>Verdict</th></tr></thead>
              <tbody>{ads.map((a) => (
                <tr key={a.id} className="border-t border-ink-700 transition hover:bg-ink-800/60">
                  <td className="py-2 pr-4">{a.name}</td><td><PlatformDot id={a.platform} /></td><td>{money(a.spend)}</td><td>{a.roas}x</td><td>{a.ctr}%</td><td><Verdict v={a.verdict} /></td>
                </tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

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
            <div className="space-y-2">{sales.bySource.sort((a, b) => b.revenue - a.revenue).map((s) => (
              <div key={s.platform} className="flex items-center justify-between text-sm"><PlatformDot id={s.platform} /><span className="text-zinc-400">{s.deals} deals · <span className="text-white">{money(s.revenue)}</span></span></div>
            ))}</div>
          </div>
        </div>
      )}

      {tab === "AI Insights" && (
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

      {tab === "Winning Ads" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {WINNING_ADS.map((w, i) => (
            <div key={w.brand} className="card space-y-2 animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between"><PlatformDot id={w.platform} /><span className="flex items-center gap-1 text-xs text-bad"><Flame className="h-3 w-3" />{w.runningDays} days live</span></div>
              <div className="font-semibold">{w.brand}</div>
              <p className="text-sm text-zinc-300">{w.hook}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-bad transition-all duration-1000" style={{ width: `${Math.min(100, w.runningDays / 1.2)}%` }} /></div>
              <div className="flex gap-2 text-xs text-zinc-500"><span className="rounded bg-ink-800 px-2 py-0.5">{w.angle}</span><span className="rounded bg-ink-800 px-2 py-0.5">{w.category}</span></div>
            </div>
          ))}
        </div>
      )}

      {tab === "Spend Trends" && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">Where people are spending right now, and what it means for {biz.name}.</p>
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

      {tab === "Connections" && live && <Connect live={live} />}
      {tab === "Connections" && !live && (
        <div className="grid gap-3 md:grid-cols-3">
          {PLATFORMS.map((p, i) => (
            <div key={p.id} className="card flex items-center justify-between animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <PlatformDot id={p.id} />
              <button className="flex items-center gap-1 rounded-lg border border-ink-600 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-accent active:scale-95"><Plug className="h-3 w-3" /> {biz.platforms.includes(p.id) ? "Connect" : "Add"}</button>
            </div>
          ))}
        </div>
      )}
      </div>

      {adding && <AddBusiness onAdd={addBiz} onClose={() => setAdding(false)} />}
    </div>
  );
}
