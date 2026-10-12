import { query } from "./_generated/server";
import { v } from "convex/values";
import { businessSnapshot } from "./lib";
import type { Doc } from "./_generated/dataModel";

/**
 * Everything one business's dashboard needs, in the same shapes as lib/data/demo.ts.
 * Returns null until the business has at least one connected account, so the UI keeps showing demo data.
 */
export const get = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const biz = await ctx.db.query("businesses").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!biz) return null;
    const accounts = await ctx.db.query("adAccounts").withIndex("by_business", (q) => q.eq("businessId", biz._id)).collect();
    const { metrics, ads } = await businessSnapshot(ctx, biz._id);
    const latest = await ctx.db.query("insights").withIndex("by_business", (q) => q.eq("businessId", biz._id)).order("desc").first();

    let sales = null;
    if (biz.sales?.enabled) {
      const now = new Date();
      const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
      const events = await ctx.db.query("salesEvents").withIndex("by_business_at", (q) => q.eq("businessId", biz._id).gte("at", monthStart)).collect();
      const count = (s: string) => events.filter((e) => e.stage === s).length;
      const closed = events.filter((e) => e.stage === "closed");
      const daily = Array.from({ length: 14 }, (_, i) => {
        const start = new Date(); start.setUTCHours(0, 0, 0, 0); const t = start.getTime() - (13 - i) * 864e5;
        return closed.filter((e) => e.at >= t && e.at < t + 864e5).reduce((s, e) => s + (e.amount ?? 0), 0);
      });
      const src = new Map<Doc<"salesEvents">["platform"] & string, { deals: number; revenue: number }>();
      for (const e of closed) if (e.platform) { const c = src.get(e.platform) ?? { deals: 0, revenue: 0 }; src.set(e.platform, { deals: c.deals + 1, revenue: c.revenue + (e.amount ?? 0) }); }
      sales = {
        stages: [{ name: "Leads", value: count("lead") }, { name: "Booked", value: count("booked") }, { name: "Showed", value: count("showed") }, { name: "Closed", value: closed.length }],
        closedRevenue: closed.reduce((s, e) => s + (e.amount ?? 0), 0),
        goal: biz.sales.goalMonthly ?? 0,
        daily,
        bySource: [...src.entries()].map(([platform, v]) => ({ platform, ...v })),
        hasData: events.length > 0,
      };
    }

    return {
      businessId: biz._id,
      accounts: accounts.map(({ _id, platform, externalId, name, status, lastSyncedAt, lastError }) => ({ _id, platform, externalId, name, status, lastSyncedAt, lastError })),
      hasAdData: metrics.length > 0,
      metrics,
      ads,
      insights: latest?.items ?? [],
      insightsAt: latest?.createdAt ?? null,
      sales,
    };
  },
});
