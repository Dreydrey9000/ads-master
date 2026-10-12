/**
 * OpenAI / ChatGPT Ads connector.
 * Advertiser API: create the key in Ads Manager > Settings (ads.openai.com).
 * Docs: https://learn.chatgpt.com/ads/api-overview
 * Ads Manager reports impressions, clicks, spend, CTR, avg CPC, avg CPM and conversions.
 * Note: spend lags ~7–8h and conversions 24–48h, so don't judge a campaign on day one.
 *
 * TODO: confirm exact endpoint paths/field names against the Insights API reference
 * before going live — the API is in beta and still changing.
 */
import type { AdConnector, Ad, PlatformMetrics } from "../types";

const BASE = process.env.OPENAI_ADS_API_BASE ?? "https://api.openai.com/v1/ads";

async function call<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_ADS_API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OpenAI Ads ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const openaiAds: AdConnector = {
  platform: "openai",
  isConfigured: () => Boolean(process.env.OPENAI_ADS_API_KEY),
  async getMetrics(accountId, days) {
    const data = await call<any>(`/accounts/${accountId}/insights?date_preset=last_${days}d&level=account`);
    const r = data?.data?.[0] ?? {};
    return {
      platform: "openai",
      spend: Number(r.spend ?? 0),
      revenue: Number(r.conversion_value ?? 0),
      impressions: Number(r.impressions ?? 0),
      clicks: Number(r.clicks ?? 0),
      conversions: Number(r.conversions ?? 0),
      trend: [],
    } satisfies PlatformMetrics;
  },
  async getAds(accountId, days) {
    const data = await call<any>(`/accounts/${accountId}/insights?date_preset=last_${days}d&level=ad`);
    return (data?.data ?? []).map((r: any): Ad => ({
      id: r.ad_id,
      businessId: accountId,
      platform: "openai",
      name: r.ad_name ?? r.ad_id,
      format: "chat",
      spend: Number(r.spend ?? 0),
      roas: r.spend ? Number(r.conversion_value ?? 0) / Number(r.spend) : 0,
      ctr: Number(r.ctr ?? 0),
      cpa: r.conversions ? Number(r.spend) / Number(r.conversions) : 0,
      verdict: "good",
    }));
  },
};
