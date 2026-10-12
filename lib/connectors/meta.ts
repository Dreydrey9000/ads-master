/** Meta Marketing API (Graph API Insights). Docs: developers.facebook.com/docs/marketing-api/insights */
import type { AdConnector, Ad } from "../types";
const G = "https://graph.facebook.com/v21.0";
const tok = () => process.env.META_ACCESS_TOKEN;

export const meta: AdConnector = {
  platform: "meta",
  isConfigured: () => Boolean(tok()),
  async getMetrics(accountId, days) {
    const url = `${G}/${accountId}/insights?date_preset=last_${days}d&fields=spend,impressions,clicks,actions,action_values&access_token=${tok()}`;
    const r = (await (await fetch(url, { cache: "no-store" })).json())?.data?.[0] ?? {};
    const purchases = (r.actions ?? []).find((a: any) => a.action_type === "purchase")?.value ?? 0;
    const revenue = (r.action_values ?? []).find((a: any) => a.action_type === "purchase")?.value ?? 0;
    return { platform: "meta", spend: +r.spend || 0, revenue: +revenue, impressions: +r.impressions || 0, clicks: +r.clicks || 0, conversions: +purchases, trend: [] };
  },
  async getAds(accountId, days) {
    const url = `${G}/${accountId}/insights?level=ad&date_preset=last_${days}d&fields=ad_id,ad_name,spend,ctr,actions,action_values&access_token=${tok()}`;
    const rows = (await (await fetch(url, { cache: "no-store" })).json())?.data ?? [];
    return rows.map((r: any): Ad => {
      const conv = +((r.actions ?? []).find((a: any) => a.action_type === "purchase")?.value ?? 0);
      const rev = +((r.action_values ?? []).find((a: any) => a.action_type === "purchase")?.value ?? 0);
      return { id: r.ad_id, businessId: accountId, platform: "meta", name: r.ad_name, format: "image", spend: +r.spend, roas: r.spend ? rev / r.spend : 0, ctr: +r.ctr, cpa: conv ? r.spend / conv : 0, verdict: "good" };
    });
  },
};
