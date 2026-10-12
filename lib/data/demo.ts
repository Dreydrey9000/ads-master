/**
 * Demo data generator — works for ANY business in ads-master.config.ts or added in the UI.
 * Seeded from the business id so numbers are stable between reloads.
 * Real connectors (lib/connectors) replace this as platforms get connected.
 */
import type { Business, PlatformMetrics, Ad, Insight, WinningAd, SpendTrend, PlatformId, SalesFunnel } from "../types";
import { platformById } from "../platforms";

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

const BASE_ROAS: Record<PlatformId, number> = { openai: 4.4, google: 3.8, tiktok: 3.4, meta: 3.0, youtube: 1.7, linkedin: 1.2 };

export function getMetrics(b: Business): PlatformMetrics[] {
  const r = rng(b.id);
  return b.platforms.map((p) => {
    const spend = Math.round(600 + r() * 3600);
    const roas = BASE_ROAS[p] * (0.8 + r() * 0.4);
    const impressions = Math.round(spend * (60 + r() * 220));
    const clicks = Math.round(impressions * (0.006 + r() * 0.025));
    const conversions = Math.max(1, Math.round((spend * roas) / (150 + r() * 200)));
    const trend = Array.from({ length: 14 }, (_, i) => +(roas + Math.sin(i / 2 + r() * 3) * 0.4 + (i - 7) * 0.03).toFixed(2));
    return { platform: p, spend, revenue: Math.round(spend * roas), impressions, clicks, conversions, trend };
  });
}

const FORMAT: Record<PlatformId, Ad["format"]> = { openai: "chat", google: "search", tiktok: "video", meta: "video", youtube: "video", linkedin: "image" };
const AD_NAMES: Record<PlatformId, string[]> = {
  openai: ["Chat ad: answers \"how do I…\"", "Chat ad: comparison prompt"],
  google: ["Search: high-intent keyword", "Search: competitor terms"],
  tiktok: ["9s before/after hook", "Founder POV skit"],
  meta: ["UGC testimonial 30s", "Static offer card"],
  youtube: ["Pre-roll brand reel", "Shorts tutorial"],
  linkedin: ["Sponsored founder story", "Lead-gen form"],
};

export function getAds(b: Business): Ad[] {
  const r = rng(b.id + "ads");
  return getMetrics(b).flatMap((m) =>
    AD_NAMES[m.platform].map((name, i) => {
      const roas = +((m.revenue / m.spend) * (i === 0 ? 1.1 : 0.75) * (0.85 + r() * 0.3)).toFixed(1);
      const spend = Math.round(m.spend * (i === 0 ? 0.6 : 0.4));
      return {
        id: `${b.id}-${m.platform}-${i}`, businessId: b.id, platform: m.platform, name, format: FORMAT[m.platform],
        spend, roas, ctr: +(0.4 + r() * 4).toFixed(1), cpa: Math.round(80 + r() * 200 / Math.max(roas, 0.5)),
        verdict: roas >= 3 ? "good" : roas >= 1.8 ? "bad" : "ugly",
      } as Ad;
    })
  ).sort((a, b) => b.roas - a.roas);
}

export function getInsights(b: Business): Insight[] {
  const ads = getAds(b);
  const best = ads[0], worst = ads[ads.length - 1], mid = ads[Math.floor(ads.length / 2)];
  const n = (p: PlatformId) => platformById[p].name;
  return [
    { verdict: "good", platform: best.platform, title: `${n(best.platform)} is carrying you (${best.roas}x)`, detail: `"${best.name}" has the best return in ${b.name}.`, action: `Scale budget 20% every 3 days while ROAS holds above ${(best.roas * 0.8).toFixed(1)}x, and make 3 variations of the hook.` },
    { verdict: "bad", platform: mid.platform, title: `${n(mid.platform)} is slipping`, detail: `"${mid.name}" at ${mid.roas}x — likely creative fatigue.`, action: "Refresh the first 3 seconds / headline; test 2 new angles from the Winning Ads tab." },
    { verdict: "ugly", platform: worst.platform, title: `${n(worst.platform)} is burning money (${worst.roas}x)`, detail: `"${worst.name}" costs $${worst.cpa} per conversion.`, action: `Pause it and move the budget to ${n(best.platform)}.` },
  ];
}

export function getSales(b: Business): SalesFunnel {
  const r = rng(b.id + "sales");
  const leads = Math.round(300 + r() * 500);
  const booked = Math.round(leads * (0.25 + r() * 0.15));
  const showed = Math.round(booked * (0.6 + r() * 0.2));
  const closed = Math.round(showed * (0.2 + r() * 0.15));
  const deal = b.sales?.avgDealSize ?? 2000;
  const daily = Array.from({ length: 14 }, () => Math.round((closed * deal) / 30 * (0.4 + r() * 1.2)));
  const ms = getMetrics(b);
  const total = ms.reduce((s, m) => s + m.conversions, 0);
  return {
    stages: [{ name: "Leads", value: leads }, { name: "Booked", value: booked }, { name: "Showed", value: showed }, { name: "Closed", value: closed }],
    closedRevenue: closed * deal,
    goal: b.sales?.goalMonthly ?? closed * deal * 1.3,
    daily,
    bySource: ms.map((m) => { const deals = Math.max(1, Math.round((closed * m.conversions) / total)); return { platform: m.platform, deals, revenue: deals * deal }; }),
  };
}

export const WINNING_ADS: WinningAd[] = [
  { brand: "Hormozi / Acquisition.com", platform: "meta", hook: "\"Here's how I'd make $100k if I started over\"", angle: "Contrarian advice", runningDays: 120, category: "Coaching" },
  { brand: "Notion", platform: "openai", hook: "Answers \"best AI workspace\" with a templates demo", angle: "Utility in-chat", runningDays: 45, category: "SaaS" },
  { brand: "CapCut", platform: "tiktok", hook: "Split-screen raw vs. edited in 3 seconds", angle: "Transformation", runningDays: 90, category: "Video tools" },
  { brand: "Shopify", platform: "youtube", hook: "\"I quit my job — day 1\" vlog", angle: "Founder journey", runningDays: 60, category: "Ecommerce" },
  { brand: "Skool", platform: "meta", hook: "Screenshot of a community payout", angle: "Proof-first", runningDays: 75, category: "Communities" },
  { brand: "Gong", platform: "linkedin", hook: "\"Top reps say this 3x more on calls\"", angle: "Data stat", runningDays: 80, category: "Sales" },
];

export const SPEND_TRENDS: SpendTrend[] = [
  { category: "Online courses & coaching", change: 7, note: "Buyers want proof and quick wins.", impact: "tailwind" },
  { category: "AI tools & subscriptions", change: 24, note: "Fastest-growing SMB software line.", impact: "tailwind" },
  { category: "Short-form video services", change: 12, note: "Budget moving from static to video.", impact: "tailwind" },
  { category: "Discretionary consumer spend", change: -2, note: "Holiday caution; price-led offers win.", impact: "headwind" },
  { category: "B2B services", change: 0, note: "Flat; long sales cycles.", impact: "neutral" },
];
// NOTE: SPEND_TRENDS + WINNING_ADS are placeholders until research feeds are wired (docs/ROADMAP.md).
