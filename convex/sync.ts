import { action, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { fetchers } from "./platforms";
import type { Doc, Id } from "./_generated/dataModel";

const LOOKBACK_DAYS = 30;

export const syncAccount = internalAction({
  args: { adAccountId: v.id("adAccounts") },
  handler: async (ctx, { adAccountId }): Promise<void> => {
    const row: { account: Doc<"adAccounts">; token: string } | null = await ctx.runQuery(internal.accounts.getWithToken, { adAccountId });
    if (!row) return;
    const f = fetchers[row.account.platform];
    if (!f) { await ctx.runMutation(internal.accounts.setStatus, { adAccountId, status: "error", lastError: `${row.account.platform} sync not built yet` }); return; }
    await ctx.runMutation(internal.accounts.setStatus, { adAccountId, status: "syncing" });
    try {
      const [daily, ads] = await Promise.all([f.daily(row.account.externalId, row.token, LOOKBACK_DAYS), f.ads(row.account.externalId, row.token, LOOKBACK_DAYS)]);
      await ctx.runMutation(internal.sync.write, { adAccountId, daily, ads });
      await ctx.runMutation(internal.accounts.setStatus, { adAccountId, status: "connected", synced: true });
    } catch (e: any) {
      await ctx.runMutation(internal.accounts.setStatus, { adAccountId, status: "error", lastError: String(e?.message ?? e).slice(0, 300) });
    }
  },
});

const dailyRow = v.object({ date: v.string(), spend: v.number(), revenue: v.number(), impressions: v.number(), clicks: v.number(), conversions: v.number() });
const adRow = v.object({ externalId: v.string(), name: v.string(), format: v.string(), spend: v.number(), revenue: v.number(), ctr: v.number(), conversions: v.number() });

/** Upserts by (account, date) and (account, ad id), so re-pulling lagged days just overwrites. */
export const write = internalMutation({
  args: { adAccountId: v.id("adAccounts"), daily: v.array(dailyRow), ads: v.array(adRow) },
  handler: async (ctx, { adAccountId, daily, ads }) => {
    const acct = await ctx.db.get(adAccountId);
    if (!acct) return;
    const base = { businessId: acct.businessId, adAccountId, platform: acct.platform };
    for (const d of daily) {
      const ex = await ctx.db.query("metricsDaily").withIndex("by_account_date", (q) => q.eq("adAccountId", adAccountId).eq("date", d.date)).unique();
      if (ex) await ctx.db.patch(ex._id, d); else await ctx.db.insert("metricsDaily", { ...base, ...d });
    }
    for (const a of ads) {
      const ex = await ctx.db.query("ads").withIndex("by_account_external", (q) => q.eq("adAccountId", adAccountId).eq("externalId", a.externalId)).unique();
      const doc = { ...a, updatedAt: Date.now() };
      if (ex) await ctx.db.patch(ex._id, doc); else await ctx.db.insert("ads", { ...base, ...doc });
    }
  },
});

/** Nightly (see crons.ts). */
export const syncAll = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const accounts: Doc<"adAccounts">[] = await ctx.runQuery(internal.accounts.listAll, {});
    for (const a of accounts) await ctx.runAction(internal.sync.syncAccount, { adAccountId: a._id as Id<"adAccounts"> });
  },
});

/** "Sync now" button. */
export const syncBusiness = action({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }): Promise<void> => {
    const accounts: Doc<"adAccounts">[] = await ctx.runQuery(internal.accounts.listAll, {});
    for (const a of accounts.filter((x) => x.businessId === businessId)) await ctx.runAction(internal.sync.syncAccount, { adAccountId: a._id });
  },
});
