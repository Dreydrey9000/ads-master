import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { isoDaysAgo } from "./platforms/types";

export type Verdict = "good" | "bad" | "ugly";
/** Simple rule until AI scores ads: 3x+ ROAS good, 1.5x+ bad (fixable), under that ugly. */
export const verdictFor = (roas: number): Verdict => (roas >= 3 ? "good" : roas >= 1.5 ? "bad" : "ugly");
const r2 = (n: number) => Math.round(n * 100) / 100;

export async function businessSnapshot(ctx: QueryCtx, businessId: Id<"businesses">, days = 30) {
  const since = isoDaysAgo(days);
  const rows = await ctx.db.query("metricsDaily").withIndex("by_business_date", (q) => q.eq("businessId", businessId).gte("date", since)).collect();

  const byPlatform = new Map<string, Doc<"metricsDaily">[]>();
  for (const r of rows) byPlatform.set(r.platform, [...(byPlatform.get(r.platform) ?? []), r]);

  const last14 = Array.from({ length: 14 }, (_, i) => isoDaysAgo(13 - i));
  const metrics = [...byPlatform.entries()].map(([platform, list]) => {
    const sum = (k: "spend" | "revenue" | "impressions" | "clicks" | "conversions") => list.reduce((s, r) => s + r[k], 0);
    const trend = last14.map((d) => {
      const day = list.filter((r) => r.date === d);
      const sp = day.reduce((s, r) => s + r.spend, 0);
      return sp ? r2(day.reduce((s, r) => s + r.revenue, 0) / sp) : 0;
    });
    return { platform: platform as Doc<"metricsDaily">["platform"], spend: sum("spend"), revenue: sum("revenue"), impressions: sum("impressions"), clicks: sum("clicks"), conversions: sum("conversions"), trend };
  });

  const adDocs = await ctx.db.query("ads").withIndex("by_business", (q) => q.eq("businessId", businessId)).collect();
  const ads = adDocs
    .filter((a) => a.spend > 0)
    .map((a) => {
      const roas = a.spend ? a.revenue / a.spend : 0;
      return { id: a._id as string, businessId: businessId as string, platform: a.platform, name: a.name, format: a.format as any, spend: a.spend, roas: r2(roas), ctr: r2(a.ctr), cpa: a.conversions ? r2(a.spend / a.conversions) : 0, verdict: verdictFor(roas) };
    })
    .sort((a, b) => b.roas - a.roas);

  return { metrics, ads };
}
