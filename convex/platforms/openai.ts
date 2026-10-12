/**
 * ChatGPT Ads (OpenAI Ads Manager) Advertiser API — beta.
 * Key: Ads Manager > Settings. Docs: https://learn.chatgpt.com/ads/api-overview
 * Spend lags ~7–8h and conversions 24–48h, so the nightly sync re-pulls the last few days.
 *
 * TODO(verify): endpoint paths + field names below are best-guess against the beta docs.
 * Override the base with the Convex env var OPENAI_ADS_API_BASE once confirmed.
 */
import { isoDaysAgo, type PlatformFetcher } from "./types";
const BASE = () => process.env.OPENAI_ADS_API_BASE ?? "https://api.openai.com/v1/ads";

async function get(path: string, token: string) {
  const res = await fetch(`${BASE()}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`ChatGPT Ads ${res.status}: ${await res.text()}`);
  return res.json();
}

export const openai: PlatformFetcher = {
  async daily(acct, token, days) {
    const j = await get(`/accounts/${acct}/insights?start_date=${isoDaysAgo(days)}&end_date=${isoDaysAgo(0)}&granularity=day&level=account`, token);
    return (j.data ?? []).map((r: any) => ({
      date: r.date, spend: +r.spend || 0, revenue: +r.conversion_value || 0, impressions: +r.impressions || 0, clicks: +r.clicks || 0, conversions: +r.conversions || 0,
    }));
  },
  async ads(acct, token, days) {
    const j = await get(`/accounts/${acct}/insights?start_date=${isoDaysAgo(days)}&end_date=${isoDaysAgo(0)}&level=ad`, token);
    return (j.data ?? []).map((r: any) => ({
      externalId: r.ad_id, name: r.ad_name ?? r.ad_id, format: "chat", spend: +r.spend || 0, revenue: +r.conversion_value || 0, ctr: +r.ctr || 0, conversions: +r.conversions || 0,
    }));
  },
};
