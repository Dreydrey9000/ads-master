/** Meta Marketing API insights. https://developers.facebook.com/docs/marketing-api/insights */
import { isoDaysAgo, type PlatformFetcher } from "./types";
const G = "https://graph.facebook.com/v21.0";
const pick = (arr: any[] | undefined, t = "purchase") => Number((arr ?? []).find((a) => a.action_type === t)?.value ?? 0);

async function get(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`Meta ${res.status}: ${json.error?.message ?? "request failed"}`);
  return json;
}

export const meta: PlatformFetcher = {
  async daily(act, token, days) {
    const range = encodeURIComponent(JSON.stringify({ since: isoDaysAgo(days), until: isoDaysAgo(0) }));
    const j = await get(`${G}/${act}/insights?time_range=${range}&time_increment=1&fields=spend,impressions,clicks,actions,action_values&limit=500&access_token=${token}`);
    return (j.data ?? []).map((r: any) => ({
      date: r.date_start, spend: +r.spend || 0, revenue: pick(r.action_values), impressions: +r.impressions || 0, clicks: +r.clicks || 0, conversions: pick(r.actions),
    }));
  },
  async ads(act, token, days) {
    const j = await get(`${G}/${act}/insights?level=ad&date_preset=last_${days}d&fields=ad_id,ad_name,spend,ctr,actions,action_values&limit=500&access_token=${token}`);
    return (j.data ?? []).map((r: any) => ({
      externalId: r.ad_id, name: r.ad_name ?? r.ad_id, format: "image", spend: +r.spend || 0, revenue: pick(r.action_values), ctr: +r.ctr || 0, conversions: pick(r.actions),
    }));
  },
};
